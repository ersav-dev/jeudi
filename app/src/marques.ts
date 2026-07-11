// ════════════════════════════════════════════════════════════════
// jeudi. — LES MARQUES : un émoji posé par l'utilisateur sur un lieu
// « mon QG 🍺, la pizza du triomphe 🍕 » — l'utilisateur choisit N'IMPORTE
// quel émoji (appui long sur un pin / un point de poussière → panneau).
//
// DA : l'émoji reste banni du CHROME (boutons, labels système) — mais une
// marque posée par l'utilisateur est du CONTENU utilisateur : exception
// assumée (décision Ersan). L'émoji ne va JAMAIS dans les labels texte.
//
// logique PURE (localStorage seulement) : testable sans DOM ni React —
// même pattern pub/sub que tuto.ts (React écoute via useSyncExternalStore
// ou un simple abonnement).
// ════════════════════════════════════════════════════════════════

/** la clé localStorage : préfixe `jeudi-` → effacerTout (db.ts) la balaie
 *  d'office, et exporterMesDonnees (db.ts) l'inclut via lireMarques(). */
export const CLE_MARQUES = 'jeudi-marques'

/** toutes les marques : Record<lieuId, émoji> — {} si rien/stockage abîmé */
export function lireMarques(): Record<string, string> {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_MARQUES) ?? '{}')
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
    // on ne garde que les valeurs string (stockage abîmé → entrée jetée)
    const propre: Record<string, string> = {}
    for (const [id, emoji] of Object.entries(v)) {
      if (typeof emoji === 'string' && emoji) propre[id] = emoji
    }
    return propre
  } catch {
    return {}
  }
}

// ── détection d'émoji ──
// \p{Extended_Pictographic} couvre les pictogrammes (🍺 👨‍🍳 ❤️)… mais PAS
// les drapeaux (🇫🇷 = deux Regional Indicators, hors Extended_Pictographic
// en Unicode) → on les accepte explicitement, le brief veut les drapeaux.
const RE_EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u

/** le PREMIER émoji d'une saisie, en graphème COMPLET (👨‍🍳, 🇫🇷 — jamais
 *  coupé au milieu d'une séquence ZWJ) ; null si la saisie n'en contient pas.
 *  Intl.Segmenter découpe les graphèmes composés ; repli : Array.from
 *  (points de code — suffisant pour les émojis simples). */
export function premierEmoji(texte: string): string | null {
  const graphemes =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(texte)].map(
          (s) => s.segment,
        )
      : [...texte]
  for (const g of graphemes) {
    if (RE_EMOJI.test(g)) return g
  }
  return null
}

/** pose une marque sur un lieu — on retient le PREMIER émoji de la saisie.
 *  saisie sans émoji = ignorée (false : l'UI fait son micro-shake). */
export function poserMarque(lieuId: string, saisie: string): boolean {
  const emoji = premierEmoji(saisie)
  if (!emoji) return false
  const marques = lireMarques()
  marques[lieuId] = emoji
  localStorage.setItem(CLE_MARQUES, JSON.stringify(marques))
  prevenir()
  return true
}

/** retire la marque d'un lieu — idempotent (pas de marque = rien à faire) */
export function retirerMarque(lieuId: string): void {
  const marques = lireMarques()
  if (!(lieuId in marques)) return
  delete marques[lieuId]
  localStorage.setItem(CLE_MARQUES, JSON.stringify(marques))
  prevenir()
}

// ── l'abonnement (pattern tuto.ts) ──
type Ecouteur = () => void
const ecouteurs = new Set<Ecouteur>()

/** s'abonner aux changements de marques ; renvoie le désabonnement */
export function sAbonnerMarques(cb: Ecouteur): () => void {
  ecouteurs.add(cb)
  return () => {
    ecouteurs.delete(cb)
  }
}

function prevenir(): void {
  ecouteurs.forEach((cb) => cb())
}
