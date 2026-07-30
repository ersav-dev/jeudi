// ════════════════════════════════════════════════════════════════
// jeudi. — LES CRITÈRES (ta façon de juger un lieu)
// Deux formes (CONCEPT.md « Les critères ») :
//  · binaire = un FAIT (foot oui/non, cocktails oui/non…)
//  · gradué  = un AVIS signé, en pastilles 3 niveaux (●○○ · ●●○ · ●●●),
//              JAMAIS d'étoiles ni de « /5 ». = la mécanique des WC généralisée.
// Couche données locale (comme db/seed) ; le cloud + le « selon Karim » viendront.
// ════════════════════════════════════════════════════════════════
import { nouvelId } from './db'

export type TypeCritere = 'binaire' | 'gradue'

export interface Critere {
  id: string
  nom: string
  type: TypeCritere
}

const CLE = 'jeudi-criteres'

export function mesCriteres(): Critere[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function ecrire(l: Critere[]): void {
  localStorage.setItem(CLE, JSON.stringify(l))
}

export function ajouterCritere(nom: string, type: TypeCritere): Critere[] {
  const n = nom.trim()
  if (!n) return mesCriteres()
  const l = [...mesCriteres(), { id: nouvelId(), nom: n, type }]
  ecrire(l)
  return l
}

export function supprimerCritere(id: string): Critere[] {
  const l = mesCriteres().filter((c) => c.id !== id)
  ecrire(l)
  return l
}

// l'aperçu d'un critère, dans le langage du carnet (jamais d'étoile) :
// gradué → pastilles 3 niveaux · binaire → oui/non
export function apercuCritere(type: TypeCritere): string {
  return type === 'gradue' ? '●●○' : 'oui · non'
}
