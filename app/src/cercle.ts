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

// ════════════════════════════════════════════════════════════════
// LE CERCLE RÉEL + LE DÉCOR (étape 5) — logique PURE de fusion.
// Les vrais membres (cloud) passent DEVANT les membres seed (démo) ;
// dédoublonnage par id, un vrai gagne toujours sur un homonyme seed.
// ════════════════════════════════════════════════════════════════

/** un membre tel que l'écran cercle l'affiche (réel OU décor seed) */
export interface MembreVue {
  id: string
  prenom: string
  /** vrai membre cloud — pas de tampon « démo » */
  reel: boolean
  titre?: string
  critere?: string
  tagline?: string
  bio?: string
  insta?: string
  photoUrl?: string
}

/** fusionne le cercle réel et le décor : les vrais d'abord, sans doublon d'id */
export function fusionnerCercle(
  reels: { id: string; prenom: string; critere?: string; bio?: string; insta?: string; photoUrl?: string }[],
  seed: { id: string; prenom: string; titre?: string; critere?: string; tagline?: string; bio?: string }[] = MEMBRES,
): MembreVue[] {
  const vus = new Set<string>()
  const fusion: MembreVue[] = []
  for (const m of reels) {
    if (vus.has(m.id)) continue
    vus.add(m.id)
    fusion.push({ ...m, reel: true })
  }
  for (const m of seed) {
    if (vus.has(m.id)) continue
    vus.add(m.id)
    fusion.push({ ...m, reel: false })
  }
  return fusion
}

/** owner_id → prénom pour l'affichage (« chez untel »). null = hors cercle. */
export function prenomDe(
  ownerId: string | undefined,
  membres: { id: string; prenom: string }[],
): string | null {
  if (!ownerId) return null
  return membres.find((m) => m.id === ownerId)?.prenom ?? null
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
