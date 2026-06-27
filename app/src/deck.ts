// ════════════════════════════════════════════════════════════════
// jeudi. — DECK PONDÉRÉ PAR LES PROCHES (chantier 7)
// Un lieu porté par quelqu'un de ton cercle PROCHE (l'anneau intérieur)
// remonte dans le deck : la confiance se transmet. Pur logique, isolé.
// ════════════════════════════════════════════════════════════════
import { type Lieu, distanceM } from './db'

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export interface SignalProche {
  porteParProche: boolean
  /** qui, parmi tes proches, porte ce lieu (propriétaire ou voix sur le tip) */
  qui: string[]
}

/** `proches` = les prénoms (ou ids) de ton anneau intérieur. Le matching est
 *  insensible casse/accents ; comme les ids du seed = le prénom en minuscule
 *  (karim/Karim), passer les prénoms suffit à couvrir propriétaire ET tips. */
export function signalProche(lieu: Lieu, proches: string[]): SignalProche {
  const set = new Set(proches.map(norm))
  const qui: string[] = []
  if (lieu.proprietaire && set.has(norm(lieu.proprietaire))) qui.push(lieu.proprietaire)
  for (const t of lieu.tipsCercle ?? []) if (set.has(norm(t.auteur))) qui.push(t.auteur)
  return { porteParProche: qui.length > 0, qui: [...new Set(qui)] }
}

export interface LieuPondere {
  lieu: Lieu
  score: number
  parProches: string[]
  raison?: string
}

/** repondère une liste de lieux par la proximité du cercle. `scoreBase` permet
 *  de composer avec un score déjà calculé (deck du soir, reco…) ; sinon le
 *  classement se fait sur la seule confiance + distance. */
export function pondererParProches(
  lieux: Lieu[],
  proches: string[],
  scoreBase?: (l: Lieu) => number,
): LieuPondere[] {
  const out = lieux.map((lieu) => {
    const sig = signalProche(lieu, proches)
    const base = scoreBase?.(lieu) ?? 0
    const boost = sig.porteParProche ? Math.min(0.6, 0.4 + 0.2 * (sig.qui.length - 1)) : 0
    const raison = sig.porteParProche
      ? `porté par ${sig.qui[0]}${sig.qui.length > 1 ? ` +${sig.qui.length - 1}` : ''} (ton cercle proche)`
      : undefined
    return { lieu, score: base + boost, parProches: sig.qui, raison }
  })
  return out.sort((a, b) => b.score - a.score || distanceM(a.lieu) - distanceM(b.lieu))
}
