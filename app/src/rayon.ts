// ════════════════════════════════════════════════════════════════
// jeudi. — LE RAYON : du temps, adaptatif, jamais un mur.
// (principe validé le 06/08 — AVANT_LANCEMENT.md)
//
// L'app ne connaît AUCUNE ville : pour remplir le deck, elle tâte le
// terrain en cercles concentriques et s'arrête au premier qui contient
// assez de spots. À Paris, le premier palier suffit (tout reste à pied) ;
// à Rambouillet, l'anneau s'ouvre tout seul jusqu'à attraper Versailles —
// et l'app LE DIT au lieu de servir un deck menteur.
//
// La limite n'est pas en km mais en TEMPS, et elle dépend du moment
// choisi : « maintenant » ne traverse pas la région, « samedi » si.
// ════════════════════════════════════════════════════════════════
import type { Moment } from './moment'
import { dateDuMoment } from './moment'
import { lireVitesse } from './db'

/** les cercles concentriques, en mètres — pensés en minutes de trajet :
 *  ~15 min à pied · ~30 min à pied · vélo court · ~30 min roulés · ~1 h */
export const PALIERS_M = [1200, 2500, 5000, 12000, 30000, Infinity] as const

/** au-delà : on ne parle plus « à pied » (2,5 km ≈ 30 min de marche) */
export const MARCHE_MAX_M = 2500

/** l'allure quand ça roule (~25 km/h, mélange transport/voiture assumé) */
const VITESSE_ROULE = 417 // m/min

export interface Anneau<T> {
  retenus: T[]
  /** le palier retenu (m) — Infinity si même le plafond n'a pas suffi */
  rayonM: number
  /** la distance du spot retenu le plus loin (m) — c'est ELLE qu'on annonce */
  loinM: number
  /** true = on a dû dépasser la marche : l'UI l'annonce honnêtement */
  elargi: boolean
}

/** le premier palier qui contient ≥ `cible` candidats (sans dépasser
 *  `plafondM`). Jamais un mur : si même le plafond ne suffit pas, on rend
 *  ce qu'il contient — l'appelant affiche la phrase honnête, pas du vide
 *  menteur. Les items rendus sont TRIÉS du plus proche au plus loin. */
export function retenirParRayon<T>(
  items: T[],
  distDe: (t: T) => number,
  cible = 8,
  plafondM: number = Infinity,
): Anneau<T> {
  const tries = items
    .map((t) => ({ t, d: distDe(t) }))
    .sort((a, b) => a.d - b.d)
  const paliers = PALIERS_M.filter((p) => p <= plafondM)
  if (!paliers.length || paliers[paliers.length - 1] < plafondM) paliers.push(plafondM)
  for (const p of paliers) {
    const dedans = tries.filter((x) => x.d <= p)
    if (dedans.length >= cible || p === paliers[paliers.length - 1]) {
      // « élargi » = un spot RETENU dépasse la marche — pas le palier atteint
      // (3 spots à 500 m dans un deck incomplet ne doivent rien annoncer)
      const loin = dedans.length ? dedans[dedans.length - 1].d : 0
      return {
        retenus: dedans.map((x) => x.t),
        rayonM: p,
        loinM: loin,
        elargi: loin > MARCHE_MAX_M,
      }
    }
  }
  // items vide : rien nulle part
  return { retenus: [], rayonM: paliers[paliers.length - 1] ?? plafondM, loinM: 0, elargi: false }
}

/** jusqu'où l'anneau a le DROIT de s'ouvrir, selon le moment choisi :
 *  maintenant → ~30 min roulés · un moment du même jour → ~1 h (le temps
 *  de s'y rendre) · un autre jour → pas de limite (on planifie). */
export function plafondRayon(m: Moment, ref = new Date()): number {
  if (m.cle === 'maintenant') return 12000
  const d = dateDuMoment(m, ref)
  const memeJour =
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  return memeJour ? 30000 : Infinity
}

/** le temps de trajet honnête : à pied tant que c'est marchable (au pas
 *  réglé — réglages → « ton pas »), roulé au-delà. */
export function trajetMin(m: number): { min: number; aPied: boolean } {
  if (m <= MARCHE_MAX_M) return { min: Math.max(1, Math.round(m / lireVitesse())), aPied: true }
  return { min: Math.max(5, Math.round(m / VITESSE_ROULE)), aPied: false }
}

/** « 12 min à pied » · « ~25 min » — fini le « 312 min à pied » */
export function libelleTrajet(m: number): string {
  const t = trajetMin(m)
  return t.aPied ? `${t.min} min à pied` : `~${t.min} min`
}
