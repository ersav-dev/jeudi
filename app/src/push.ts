// ════════════════════════════════════════════════════════════════
// jeudi. — LE PUSH, côté app (chantier push, 12/08/2026)
//
// Ici vit tout le geste « me prévenir » : savoir si l'appareil sait
// faire, où en est la permission, s'abonner, se couper. La table
// cloud (0020) est parlée par db.ts — ce module ne connaît que le
// navigateur.
//
// Les règles :
//   · on ne demande JAMAIS la permission à l'ouverture de l'app —
//     seulement sur le tap de l'interrupteur (un geste voulu).
//   · sur iPhone, le push n'existe que si la PWA est installée
//     (iOS ≥ 16.4) : avant ça, on explique au lieu de mendier.
//   · couper est aussi simple qu'allumer, et nettoie le cloud.
// ════════════════════════════════════════════════════════════════
import { sauverAbonnementPush, supprimerAbonnementPush } from './db'

/** la clé publique VAPID (paire générée le 12/08 — la privée vit dans
 *  les secrets Supabase). PushManager.subscribe la veut en Uint8Array. */
const CLE_PUBLIQUE = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

/** base64url → octets (le format d'applicationServerKey). PURE — testée. */
export function cleVersOctets(base64url: string): Uint8Array {
  const rembourrage = '='.repeat((4 - (base64url.length % 4)) % 4)
  const base64 = (base64url + rembourrage).replace(/-/g, '+').replace(/_/g, '/')
  const brut = atob(base64)
  const octets = new Uint8Array(brut.length)
  for (let i = 0; i < brut.length; i++) octets[i] = brut.charCodeAt(i)
  return octets
}

export type EtatPush =
  /** l'appareil ne sait pas faire (ou pas encore : iPhone sans A2HS) */
  | 'indisponible'
  /** possible, pas activé */
  | 'coupe'
  /** abonné, le serveur a l'adresse */
  | 'active'
  /** l'utilisateur a dit non au navigateur — on ne re-demande pas, on explique */
  | 'refuse'

/** ce que CET appareil sait faire, là, maintenant */
export async function etatPush(): Promise<EtatPush> {
  if (
    typeof Notification === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !CLE_PUBLIQUE
  ) {
    return 'indisponible'
  }
  if (Notification.permission === 'denied') return 'refuse'
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const abo = await reg?.pushManager.getSubscription()
    return abo ? 'active' : 'coupe'
  } catch {
    return 'coupe'
  }
}

/** l'iPhone non installé : le seul cas où « indisponible » a un remède */
export function conseilIphone(): boolean {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const installee = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false
  return ios && !installee
}

/** s'abonner : permission (sur le geste !) → subscribe → la table 0020.
 *  Throw avec un message montrable si ça coince — l'UI dit la vérité. */
export async function activerPush(): Promise<void> {
  if (!CLE_PUBLIQUE) throw new Error('pas de clé de push — build incomplet.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('le téléphone a dit non — voir ses réglages.')
  const reg = await navigator.serviceWorker.ready
  const abo = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    // TS veut un BufferSource « propre » — le slice garantit un ArrayBuffer nu
    applicationServerKey: cleVersOctets(CLE_PUBLIQUE).buffer as ArrayBuffer,
  })
  const json = abo.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    // un abonnement sans clés ne servira jamais : on le rend au navigateur
    await abo.unsubscribe().catch(() => {})
    throw new Error('l’abonnement est revenu incomplet — réessaie.')
  }
  await sauverAbonnementPush({
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  })
}

/** se couper : le navigateur d'abord, le cloud ensuite (si le cloud rate,
 *  l'endpoint mort sera purgé par l'envoyeur au premier 410 — pas grave). */
export async function couperPush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration()
  const abo = await reg?.pushManager.getSubscription()
  if (!abo) return
  const endpoint = abo.endpoint
  await abo.unsubscribe().catch(() => {})
  await supprimerAbonnementPush(endpoint).catch(() => {})
}
