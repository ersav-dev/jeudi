// ════════════════════════════════════════════════════════════════
// jeudi. — le MATCH DE GROUPE, couche cloud (« on se voit où »).
// Un objet central « sortie » = des spots candidats + des votes.
// DEUX portes, UN moteur : les inscrits in-app (RLS), les invités par
// UN lien /sortie/<token> sans compte (RPC security definer — le token
// est la capacité). Pas de messagerie : le langage de réactions, un
// tap, agrégé en totaux (« 5 chauds · 2 trop cher »). Les budgets ne
// voyagent jamais : chacun filtre depuis SA météo, en silence.
// ════════════════════════════════════════════════════════════════
import { supabase } from './supabase'
import type { Lieu, Meteo, Envie } from './db'

const URL_APP = 'https://jeudi-seven.vercel.app'

/** le lien qui circule sur WhatsApp */
export function lienSortie(token: string): string {
  return `${URL_APP}/sortie/${token}`
}

/** extrait le token d'un chemin /sortie/<token> — PUR (testable).
 *  null = ce n'est pas une page de sortie. */
export function extraireTokenSortie(pathname: string): string | null {
  const m = /^\/sortie\/([A-Za-z0-9_-]{10,64})\/?$/.exec(pathname)
  return m ? m[1] : null
}

// ── le langage de réactions codifié : les 5 du moteur + « juste boire »
export const REACTIONS_SG = [
  'chaud',
  'pourquoi pas',
  'pas moi',
  'trop cher',
  'trop loin',
  'juste boire',
] as const
export type ReactionSG = (typeof REACTIONS_SG)[number]

export function estReactionSG(x: unknown): x is ReactionSG {
  return typeof x === 'string' && (REACTIONS_SG as readonly string[]).includes(x)
}

/** la météo du porte-monnaie → le budget max du moteur (jamais révélé) :
 *  pluie = 0 (ça coûte rien) · nuageux = 1 · soleil = 2 (on flambe) */
export function budgetDepuisMeteo(m: Meteo): 0 | 1 | 2 {
  return m === 'pluie' ? 0 : m === 'soleil' ? 2 : 1
}

// ── les formes lues par les deux portes ─────────────────────────
export interface CandidatSG {
  id: string
  /** le spot d'origine dans `lieux` (si toujours vivant) — rouvre la fiche in-app */
  lieuId?: string
  /** qui l'a mis au vote (« proposé par marie ») — prénom instantané */
  proposePar?: string
  nom: string
  lat: number
  lng: number
  adresse?: string
  note?: string
  envies: string[]
  meteo?: Meteo
  ordre: number
}

export interface ParticipantVue {
  prenom: string
  aVote: boolean
}

/** comptes agrégés par candidat : candidatId → { chaud: 3, 'trop cher': 1 } */
export type ComptesSG = Record<string, Partial<Record<ReactionSG, number>>>

export interface SortieVue {
  titre: string
  envies: string[]
  statut: 'ouvert' | 'clos'
  /** ISO — null = pas de limite, le créateur clôt à la main */
  deadline: string | null
  /** la vérité du serveur : statut ouvert ET deadline pas passée */
  ouverte: boolean
  centre: { lat: number; lng: number } | null
  gagnantId: string | null
  /** « on rejoue. » : le token du match qui rejoue celui-ci (s'il existe) —
   *  la page de l'ancien lien rapatrie ses votants vers le nouveau */
  rematchToken: string | null
  createur: string
  candidats: CandidatSG[]
  participants: ParticipantVue[]
  comptes: ComptesSG
}

// ── parseur PUR du jsonb de sg_voir (testable sans réseau) ──────
type Brut = Record<string, unknown>
const objet = (x: unknown): Brut => (x && typeof x === 'object' ? (x as Brut) : {})
const chaine = (x: unknown): string => (typeof x === 'string' ? x : '')
const nombre = (x: unknown): number => (typeof x === 'number' && isFinite(x) ? x : 0)

export function parseSortieVue(brut: unknown): SortieVue | null {
  const b = objet(brut)
  const s = b.sortie
  if (!s || typeof s !== 'object') return null
  const so = objet(s)
  const lat = so.centre_lat
  const lng = so.centre_lng
  const comptes: ComptesSG = {}
  for (const ligne of Array.isArray(b.comptes) ? b.comptes : []) {
    const l = objet(ligne)
    const cid = chaine(l.candidat_id)
    const r = l.reaction
    if (!cid || !estReactionSG(r)) continue
    ;(comptes[cid] ??= {})[r] = nombre(l.n)
  }
  return {
    titre: chaine(so.titre),
    envies: Array.isArray(so.envies) ? so.envies.map(chaine).filter(Boolean) : [],
    statut: so.statut === 'clos' ? 'clos' : 'ouvert',
    deadline: typeof so.deadline === 'string' ? so.deadline : null,
    ouverte: so.ouverte === true,
    centre:
      typeof lat === 'number' && typeof lng === 'number' ? { lat, lng } : null,
    gagnantId: typeof so.gagnant_id === 'string' ? so.gagnant_id : null,
    rematchToken: typeof so.rematch_token === 'string' ? so.rematch_token : null,
    createur: chaine(so.createur),
    candidats: (Array.isArray(b.candidats) ? b.candidats : [])
      .map((c): CandidatSG => {
        const o = objet(c)
        const met = o.meteo
        return {
          id: chaine(o.id),
          lieuId: chaine(o.lieu_id) || undefined,
          proposePar: chaine(o.propose_par) || undefined,
          nom: chaine(o.nom),
          lat: nombre(o.lat),
          lng: nombre(o.lng),
          adresse: chaine(o.adresse) || undefined,
          note: chaine(o.note) || undefined,
          envies: Array.isArray(o.envies) ? o.envies.map(chaine).filter(Boolean) : [],
          meteo: met === 'soleil' || met === 'nuageux' || met === 'pluie' ? met : undefined,
          ordre: nombre(o.ordre),
        }
      })
      .filter((c) => c.id && c.nom)
      .sort((a, z) => a.ordre - z.ordre),
    participants: (Array.isArray(b.participants) ? b.participants : []).map((p) => {
      const o = objet(p)
      return { prenom: chaine(o.prenom), aVote: o.a_vote === true }
    }),
    comptes,
  }
}

// ════════════════════════════════════════════════════════════════
// LE VERDICT — déterministe : mêmes votes → même gagnant, sur tous
// les téléphones. 1) le plus de « chaud » · 2) le plus de partants
// (chaud + pourquoi pas + juste boire) · 3) le mieux classé (ordre).
// ════════════════════════════════════════════════════════════════
export function gagnantSG(candidats: CandidatSG[], comptes: ComptesSG): CandidatSG | null {
  if (!candidats.length) return null
  const partants = (c: Partial<Record<ReactionSG, number>>) =>
    (c.chaud ?? 0) + (c['pourquoi pas'] ?? 0) + (c['juste boire'] ?? 0)
  return [...candidats].sort((a, z) => {
    const ca = comptes[a.id] ?? {}
    const cz = comptes[z.id] ?? {}
    return (
      (cz.chaud ?? 0) - (ca.chaud ?? 0) ||
      partants(cz) - partants(ca) ||
      a.ordre - z.ordre
    )
  })[0]
}

/** « 5 chauds · 2 trop cher » — chaud d'abord, puis les freins par poids.
 *  '' = personne n'a réagi sur ce spot. */
export function resumeSG(c: Partial<Record<ReactionSG, number>> | undefined): string {
  if (!c) return ''
  const bouts: string[] = []
  const chauds = c.chaud ?? 0
  if (chauds > 0) bouts.push(`${chauds} chaud${chauds > 1 ? 's' : ''}`)
  const autres = (Object.entries(c) as [ReactionSG, number][])
    .filter(([r, n]) => r !== 'chaud' && n > 0)
    .sort((a, z) => z[1] - a[1])
  for (const [r, n] of autres) bouts.push(`${n} ${r}`)
  return bouts.join(' · ')
}

/** la durée restante seule (« 42 min », « 1 h 05 ») — l'UI la préfixe de
 *  t('il reste'). '' si passée ou sans limite. */
export function libelleRestant(deadline: string | null, maintenant = new Date()): string {
  if (!deadline) return ''
  const ms = new Date(deadline).getTime() - maintenant.getTime()
  if (!isFinite(ms) || ms <= 0) return ''
  const min = Math.ceil(ms / 60000)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const reste = min % 60
  return reste ? `${h} h ${String(reste).padStart(2, '0')}` : `${h} h`
}

// ════════════════════════════════════════════════════════════════
// LA PORTE IN-APP (créateur) — RLS classique, session requise
// ════════════════════════════════════════════════════════════════
export interface SortieCreee {
  id: string
  token: string
  participantId: string
  cle: string
}

/** lance un match : la sortie, ses candidats (instantanés de la shortlist),
 *  et moi comme premier participant. deadline null = pas de limite. */
export async function creerSortieGroupe(opts: {
  titre: string
  envies: Envie[]
  centre: { lat: number; lng: number }
  deadline: Date | null
  monPrenom: string
  candidats: Lieu[]
}): Promise<SortieCreee> {
  const { data: auth } = await supabase.auth.getSession()
  const uid = auth.session?.user?.id
  if (!uid) throw new Error('connecte-toi d’abord pour lancer un match.')
  const { data: sortie, error: e1 } = await supabase
    .from('sorties_groupe')
    .insert({
      createur_id: uid,
      titre: opts.titre || null,
      envies: opts.envies,
      centre_lat: opts.centre.lat,
      centre_lng: opts.centre.lng,
      deadline: opts.deadline ? opts.deadline.toISOString() : null,
    })
    .select('id,token')
    .single()
  if (e1 || !sortie) throw new Error('le match n’a pas pu se lancer — réessaie.')
  const { error: e2 } = await supabase.from('sg_candidats').insert(
    opts.candidats.map((l, i) => ({
      sortie_id: sortie.id,
      lieu_id: /^[0-9a-f-]{36}$/i.test(l.id) ? l.id : null,
      nom: l.nom,
      lat: l.lat,
      lng: l.lng,
      adresse: l.adresse ?? null,
      note: l.note || null,
      envies: l.envies,
      meteo: l.meteo ?? null,
      ordre: i,
      propose_par: opts.monPrenom || null,
    })),
  )
  if (e2) throw new Error('les spots n’ont pas suivi — réessaie.')
  const { data: part, error: e3 } = await supabase
    .from('sg_participants')
    .insert({ sortie_id: sortie.id, profil_id: uid, prenom: opts.monPrenom || 'moi' })
    .select('id,cle')
    .single()
  if (e3 || !part) throw new Error('le match est lancé mais sans toi — recharge.')
  return { id: sortie.id, token: sortie.token, participantId: part.id, cle: part.cle }
}

/** proposer un spot à un match ouvert (créateur OU participant inscrit).
 *  Le serveur garde le cap (12 max) et la fenêtre (vote ouvert). */
export async function ajouterCandidat(sortieId: string, lieu: Lieu, prenom: string): Promise<void> {
  const { count } = await supabase
    .from('sg_candidats')
    .select('id', { count: 'exact', head: true })
    .eq('sortie_id', sortieId)
  const { error } = await supabase.from('sg_candidats').insert({
    sortie_id: sortieId,
    lieu_id: /^[0-9a-f-]{36}$/i.test(lieu.id) ? lieu.id : null,
    nom: lieu.nom,
    lat: lieu.lat,
    lng: lieu.lng,
    adresse: lieu.adresse ?? null,
    note: lieu.note || null,
    envies: lieu.envies,
    meteo: lieu.meteo ?? null,
    ordre: count ?? 99,
    propose_par: prenom || null,
  })
  if (error)
    throw new Error(
      /plein/.test(error.message)
        ? 'le match est plein — 12 spots max, on vote maintenant.'
        : 'le spot n’est pas parti — le vote est peut-être clos.',
    )
}

/** les matchs ouverts où JE suis (créateur ou participant inscrit) —
 *  la RLS filtre pour nous. Sert au bandeau « un vote vit » des membres. */
export interface MatchOuvert {
  id: string
  token: string
  titre: string
  deadline: string | null
  estCreateur: boolean
}

export async function mesMatchsOuverts(): Promise<MatchOuvert[]> {
  const { data: auth } = await supabase.auth.getSession()
  const uid = auth.session?.user?.id
  if (!uid) return []
  const { data, error } = await supabase
    .from('sorties_groupe')
    .select('id,token,titre,deadline,createur_id')
    .eq('statut', 'ouvert')
    .order('cree_le', { ascending: false })
    .limit(5)
  if (error || !data) return []
  return (data as { id: string; token: string; titre: string | null; deadline: string | null; createur_id: string }[])
    .filter((s) => !s.deadline || new Date(s.deadline).getTime() > Date.now())
    .map((s) => ({
      id: s.id,
      token: s.token,
      titre: s.titre ?? '',
      deadline: s.deadline,
      estCreateur: s.createur_id === uid,
    }))
}

/** « on rejoue. » — un match clos repart : mêmes spots, nouveau vote.
 *  L'ancienne sortie pointe vers la nouvelle (rematch_id) : la page des
 *  invités de l'ancien lien affichera « ça se rejoue — revote ici → ». */
export async function relancerSortie(
  ancienId: string,
  vue: SortieVue,
  monPrenom: string,
  deadline: Date | null,
): Promise<SortieCreee> {
  const { data: auth } = await supabase.auth.getSession()
  const uid = auth.session?.user?.id
  if (!uid) throw new Error('connecte-toi d’abord pour lancer un match.')
  const { data: sortie, error: e1 } = await supabase
    .from('sorties_groupe')
    .insert({
      createur_id: uid,
      titre: vue.titre || null,
      envies: vue.envies,
      centre_lat: vue.centre?.lat ?? null,
      centre_lng: vue.centre?.lng ?? null,
      deadline: deadline ? deadline.toISOString() : null,
    })
    .select('id,token')
    .single()
  if (e1 || !sortie) throw new Error('le match n’a pas pu se lancer — réessaie.')
  const { error: e2 } = await supabase.from('sg_candidats').insert(
    vue.candidats.map((c, i) => ({
      sortie_id: sortie.id,
      lieu_id: c.lieuId ?? null,
      nom: c.nom,
      lat: c.lat,
      lng: c.lng,
      adresse: c.adresse ?? null,
      note: c.note ?? null,
      envies: c.envies,
      meteo: c.meteo ?? null,
      ordre: i,
      propose_par: c.proposePar ?? null,
    })),
  )
  if (e2) throw new Error('les spots n’ont pas suivi — réessaie.')
  const { data: part, error: e3 } = await supabase
    .from('sg_participants')
    .insert({ sortie_id: sortie.id, profil_id: uid, prenom: monPrenom || 'moi' })
    .select('id,cle')
    .single()
  if (e3 || !part) throw new Error('le match est lancé mais sans toi — recharge.')
  // le fil d'Ariane : l'ancien match pointe vers son rejeu (best-effort)
  await supabase.from('sorties_groupe').update({ rematch_id: sortie.id }).eq('id', ancienId)
  return { id: sortie.id, token: sortie.token, participantId: part.id, cle: part.cle }
}

/** le créateur tranche : clôt le vote et grave le gagnant */
export async function cloreSortie(id: string, gagnantId: string | null): Promise<void> {
  const { error } = await supabase
    .from('sorties_groupe')
    .update({ statut: 'clos', gagnant_id: gagnantId, clos_le: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error('la clôture n’a pas pris — réessaie.')
}

/** realtime in-app : chaque vote qui tombe rappelle onVote. rend le débranchement. */
export function ecouterVotes(sortieId: string, onVote: () => void): () => void {
  const canal = supabase
    .channel(`sg-${sortieId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sg_votes', filter: `sortie_id=eq.${sortieId}` },
      onVote,
    )
    .subscribe()
  return () => {
    void supabase.removeChannel(canal)
  }
}

// ════════════════════════════════════════════════════════════════
// LA PORTE PUBLIQUE (invités) — les 3 RPC, token = capacité
// ════════════════════════════════════════════════════════════════
export async function voirSortie(token: string): Promise<SortieVue> {
  const { data, error } = await supabase.rpc('sg_voir', { p_token: token })
  if (error) throw new Error('le match ne répond pas — vérifie ta connexion.')
  const vue = parseSortieVue(data)
  if (!vue) throw new Error('ce lien ne mène nulle part — redemande-le sur WhatsApp.')
  return vue
}

export async function rejoindreSortie(
  token: string,
  prenom: string,
): Promise<{ participantId: string; cle: string }> {
  const { data, error } = await supabase.rpc('sg_rejoindre', {
    p_token: token,
    p_prenom: prenom,
  })
  if (error) throw new Error('impossible de rejoindre — le vote est peut-être clos.')
  const b = objet(data)
  const participantId = chaine(b.participant_id)
  const cle = chaine(b.cle)
  if (!participantId || !cle) throw new Error('impossible de rejoindre — réessaie.')
  return { participantId, cle }
}

export async function voterSortie(
  token: string,
  cle: string,
  candidatId: string,
  reaction: ReactionSG,
): Promise<void> {
  const { error } = await supabase.rpc('sg_voter', {
    p_token: token,
    p_cle: cle,
    p_candidat: candidatId,
    p_reaction: reaction,
  })
  if (error) throw new Error('le vote n’est pas parti — le match est peut-être clos.')
}

// ════════════════════════════════════════════════════════════════
// LA MÉMOIRE LOCALE — la clé de l'invité (son téléphone est son compte)
// et le match actif du créateur.
// ════════════════════════════════════════════════════════════════
export interface CleSortie {
  participantId: string
  cle: string
  prenom: string
  /** mes réactions déjà posées (affichage optimiste) : candidatId → réaction */
  votes: Record<string, ReactionSG>
}

export function lireCleSortie(token: string): CleSortie | null {
  try {
    const v = JSON.parse(localStorage.getItem(`jeudi-sortie-${token}`) ?? '') as CleSortie
    return v && typeof v.cle === 'string' && typeof v.participantId === 'string'
      ? { ...v, votes: v.votes ?? {} }
      : null
  } catch {
    return null
  }
}

export function ecrireCleSortie(token: string, v: CleSortie): void {
  try {
    localStorage.setItem(`jeudi-sortie-${token}`, JSON.stringify(v))
  } catch {
    /* navigation privée : la clé vivra le temps de la page */
  }
}

/** le match que J'AI lancé (créateur) — un seul à la fois en v1 */
export interface SortieActive extends SortieCreee {
  quand: string // ISO du lancement
}

const CLE_ACTIVE = 'jeudi-sortie-active'

export function lireSortieActive(): SortieActive | null {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_ACTIVE) ?? '') as SortieActive
    return v && typeof v.token === 'string' && typeof v.id === 'string' ? v : null
  } catch {
    return null
  }
}

export function ecrireSortieActive(v: SortieActive | null): void {
  try {
    if (v) localStorage.setItem(CLE_ACTIVE, JSON.stringify(v))
    else localStorage.removeItem(CLE_ACTIVE)
  } catch {
    /* pareil : sans stockage, le match vit le temps de la session */
  }
}
