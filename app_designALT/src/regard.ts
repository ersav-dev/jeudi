// ════════════════════════════════════════════════════════════════
// jeudi. — LE REGARD D'UN PROCHE (« selon Karim »)
// Tes super potes te donnent accès à LEURS critères sur un lieu — voir à
// travers leurs yeux (CONCEPT.md « Les critères »). Gradué = pastilles 3
// niveaux signées, jamais d'étoile. Ici les critères + lectures sont SIMULÉS
// et déterministes (en vrai : définis et posés par eux).
// ════════════════════════════════════════════════════════════════
import { type Lieu } from './db'
import { type TypeCritere } from './criteres'

export interface CritereMembre {
  nom: string
  type: TypeCritere
}

// les critères de chaque membre (simulés, cohérents avec leur perso)
export const CRITERES_MEMBRES: Record<string, CritereMembre[]> = {
  karim: [
    { nom: 'le bruit', type: 'gradue' },
    { nom: 'le foot', type: 'binaire' },
  ],
  lea: [
    { nom: 'la lumière', type: 'gradue' },
    { nom: 'manger seul', type: 'binaire' },
  ],
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export interface Lecture {
  nom: string
  type: TypeCritere
  /** 1..3 pour un critère gradué */
  niveau?: 1 | 2 | 3
  /** oui/non pour un critère binaire */
  oui?: boolean
}

/** la lecture (déterministe) d'un membre sur un lieu, critère par critère */
export function regardDe(membreId: string, lieu: Lieu): Lecture[] {
  const crit = CRITERES_MEMBRES[membreId]
  if (!crit) return []
  return crit.map((c) => {
    const h = hash(membreId + c.nom + lieu.id)
    if (c.type === 'gradue') return { nom: c.nom, type: 'gradue', niveau: ((h % 3) + 1) as 1 | 2 | 3 }
    return { nom: c.nom, type: 'binaire', oui: h % 2 === 0 }
  })
}

/** les pastilles d'un niveau gradué (●●○), jamais d'étoile */
export function pastilles(n: 1 | 2 | 3): string {
  return '●'.repeat(n) + '○'.repeat(3 - n)
}
