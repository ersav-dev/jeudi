// ════════════════════════════════════════════════════════════════
// jeudi. — L'ENVOYEUR (Edge Function, chantier push 12/08/2026)
//
// La passe quotidienne (~18 h, déclenchée par le cron —
// supabase/cron_envoyer_push.sql). Jeudi ne harcèle pas : push =
// RARE et PRÉCIEUX, dans la voix du carnet.
//
// Ce que cette v1 envoie :
//   · « @ninon veut rejoindre ton cercle. » — les demandes reçues
//     depuis la dernière passe (24 h), regroupées si plusieurs.
//   · le jeudi : « ça dit quoi ce soir ? » — LE rendez-vous.
// JAMAIS : « X a posté », des compteurs, du réengagement gratuit.
// (Anniversaires et « ta sortie attend son verdict » : passes
// suivantes — le squelette est prêt, la ligne éditoriale aussi.)
//
// Sécurité : la clé privée VAPID ne sort JAMAIS d'ici (secrets).
// La fonction tourne avec le service role (au-dessus de la RLS) —
// c'est l'envoyeur, il doit voir tous les abonnements. Si le secret
// CRON_SECRET est posé, l'en-tête x-cron-secret doit correspondre
// (sinon n'importe qui avec la clé anon peut déclencher une passe —
// pas grave, mais autant fermer).
//
// Déploiement (une fois, voir CHANTIER_PUSH.md) :
//   npx supabase functions deploy envoyer-push --project-ref <ref>
//   npx supabase secrets set VAPID_PUBLIC_KEY=… VAPID_PRIVATE_KEY=… \
//     VAPID_SUBJECT=mailto:contact@jeudi.app --project-ref <ref>
// ════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

type Charge = { titre: string; corps?: string; url?: string; tag?: string }
type Abonnement = { endpoint: string; user_id: string; p256dh: string; auth: string }

Deno.serve(async (req) => {
  // ── la porte ──────────────────────────────────────────────────
  const secret = Deno.env.get('CRON_SECRET')
  if (secret && req.headers.get('x-cron-secret') !== secret) {
    return Response.json({ erreur: 'non' }, { status: 403 })
  }

  const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')
  const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')
  const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@jeudi.app'
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return Response.json({ erreur: 'clés VAPID absentes des secrets' }, { status: 500 })
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── qui est abonné ? ──────────────────────────────────────────
  const { data: abonnements, error: eAbo } = await sb
    .from('push_abonnements')
    .select('endpoint,user_id,p256dh,auth')
  if (eAbo) return Response.json({ erreur: eAbo.message }, { status: 500 })
  if (!abonnements?.length) return Response.json({ envoyes: 0, note: 'personne d’abonné' })

  const parMembre = new Map<string, Abonnement[]>()
  for (const a of abonnements as Abonnement[]) {
    const liste = parMembre.get(a.user_id) ?? []
    liste.push(a)
    parMembre.set(a.user_id, liste)
  }

  // ── quoi dire, à qui ─────────────────────────────────────────
  const messages = new Map<string, Charge[]>()
  const dire = (userId: string, c: Charge) => {
    const liste = messages.get(userId) ?? []
    liste.push(c)
    messages.set(userId, liste)
  }

  // 1· les demandes de cercle reçues depuis la dernière passe (24 h).
  //    Regroupées : une notification par membre, jamais une rafale.
  const depuis = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { data: demandes } = await sb
    .from('relations')
    .select('vers_id, profils!relations_de_id_fkey(prenom)')
    .eq('statut', 'demande')
    .gte('cree_le', depuis)
  for (const [userId] of parMembre) {
    const recues = (demandes ?? []).filter((d) => d.vers_id === userId)
    if (recues.length === 0) continue
    const prenoms = recues
      .map((d) => (d.profils as unknown as { prenom?: string })?.prenom?.toLowerCase())
      .filter(Boolean)
    dire(userId, {
      titre:
        recues.length === 1 && prenoms[0]
          ? `@${prenoms[0]} veut rejoindre ton cercle.`
          : `${recues.length} personnes veulent rejoindre ton cercle.`,
      url: '/',
      tag: 'cercle',
    })
  }

  // 2· le jeudi ~18 h : LE rendez-vous. (Le cron tourne tous les jours ;
  //    c'est ici qu'on ne garde que le jeudi, en heure de Paris.)
  const jourParis = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
  }).format(new Date())
  if (jourParis === 'Thu') {
    for (const [userId] of parMembre) {
      dire(userId, { titre: 'jeudi.', corps: 'ça dit quoi ce soir ?', url: '/', tag: 'jeudi' })
    }
  }

  // ── envoyer, et purger les adresses mortes (410/404) ──────────
  let envoyes = 0
  let morts = 0
  let echecs = 0
  for (const [userId, charges] of messages) {
    for (const abo of parMembre.get(userId) ?? []) {
      const cible = {
        endpoint: abo.endpoint,
        keys: { p256dh: abo.p256dh, auth: abo.auth },
      }
      for (const charge of charges) {
        try {
          await webpush.sendNotification(cible, JSON.stringify(charge), { TTL: 12 * 3600 })
          envoyes++
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode
          if (code === 404 || code === 410) {
            // l'appareil s'est désabonné sans nous le dire : on oublie l'adresse
            await sb.from('push_abonnements').delete().eq('endpoint', abo.endpoint)
            morts++
            break // inutile d'essayer les autres charges sur une adresse morte
          }
          echecs++
        }
      }
    }
  }

  return Response.json({ envoyes, morts, echecs, membres: messages.size })
})
