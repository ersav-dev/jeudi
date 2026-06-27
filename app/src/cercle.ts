// ════════════════════════════════════════════════════════════════
// jeudi. — LES SUPER POTES (l'anneau intérieur des proches)
// `proche` est figé dans le seed ; ici on le rend togglable, stocké en local,
// avec le CAP à 10 (CONCEPT.md « deux anneaux » / [[jeudi-lentille-super-potes]]).
// Anneau intérieur = la confiance qui pèse (deck, match de groupe, leurs critères).
// ════════════════════════════════════════════════════════════════
import { MEMBRES } from './seed'

const CLE = 'jeudi-proches'
export const CAP_PROCHES = 10

function defautProches(): string[] {
  return MEMBRES.filter((m) => m.proche).map((m) => m.id)
}

export function lesProches(): string[] {
  const raw = localStorage.getItem(CLE)
  if (raw == null) return defautProches() // jamais touché → on part des proches du seed
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : defautProches()
  } catch {
    return defautProches()
  }
}

export function estProche(id: string, proches = lesProches()): boolean {
  return proches.includes(id)
}

export function nbProches(): number {
  return lesProches().length
}

/** ajoute/retire un super pote. renvoie la liste + un drapeau si le cap bloque l'ajout. */
export function basculerProche(id: string): { proches: string[]; pleinAtteint: boolean } {
  const cur = lesProches()
  if (cur.includes(id)) {
    const n = cur.filter((x) => x !== id)
    localStorage.setItem(CLE, JSON.stringify(n))
    return { proches: n, pleinAtteint: false }
  }
  if (cur.length >= CAP_PROCHES) return { proches: cur, pleinAtteint: true } // plein → on refuse
  const n = [...cur, id]
  localStorage.setItem(CLE, JSON.stringify(n))
  return { proches: n, pleinAtteint: false }
}
