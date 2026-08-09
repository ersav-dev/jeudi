// ════════════════════════════════════════════════════════════════
// jeudi. — LES SUPER POTES (l'anneau intérieur des proches)
// togglable, stocké en local, avec le CAP à 10 (CONCEPT.md « deux anneaux »
// / [[jeudi-lentille-super-potes]]). Anneau intérieur = la confiance qui
// pèse (deck, match de groupe, leurs critères).
// Vrais profils only (bloc D) : plus AUCUN proche fictif pré-rempli —
// l'anneau se remplit avec de vraies relations (ids uuid du cloud).
// ════════════════════════════════════════════════════════════════

const CLE = 'jeudi-proches'
export const CAP_PROCHES = 10

// un vrai membre a un id uuid (cloud) — les ids legacy du seed ('karim',
// 'lea') sont filtrés à la lecture : le stockage s'assainit tout seul
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function lesProches(): string[] {
  const raw = localStorage.getItem(CLE)
  if (raw == null) return [] // jamais touché → personne (les vrais arrivent)
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && UUID.test(x)) : []
  } catch {
    return []
  }
}

export function estProche(id: string, proches = lesProches()): boolean {
  return proches.includes(id)
}

export function nbProches(): number {
  return lesProches().length
}

// ════════════════════════════════════════════════════════════════
// LE CERCLE AFFICHÉ (bloc D) — RÉEL uniquement, logique PURE.
// Plus de fusion seed+réel : les faux membres sont morts. On garde une
// étape de dédoublonnage (deux relations vers le même id → une entrée).
// ════════════════════════════════════════════════════════════════

/** un membre tel que l'écran cercle l'affiche (toujours réel désormais) */
export interface MembreVue {
  id: string
  prenom: string
  /** toujours vrai depuis le bloc D — gardé pour la robustesse de l'UI */
  reel: boolean
  critere?: string
  tagline?: string
  bio?: string
  insta?: string
  photoUrl?: string
}

/** le cercle affiché : les vrais membres, dédoublonnés par id — rien d'autre */
export function fusionnerCercle(
  reels: { id: string; prenom: string; critere?: string; bio?: string; insta?: string; photoUrl?: string }[],
): MembreVue[] {
  const vus = new Set<string>()
  const fusion: MembreVue[] = []
  for (const m of reels) {
    if (vus.has(m.id)) continue
    vus.add(m.id)
    fusion.push({ ...m, reel: true })
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

// ════════════════════════════════════════════════════════════════
// LA CURATION — le cap n'est pas un mur (CONCEPT.md « deux anneaux » :
// « ton cercle est plein. qui tu sors ? » — swipe garder/retirer). Quand
// l'anneau est plein, basculerProche() ci-dessus refuse SANS écrire — ça
// évite déjà l'erreur silencieuse, mais ça ne fait toujours rien. Ici,
// le geste complet : on retire un super pote et on ajoute le nouveau à sa
// place, EN UNE FOIS. Jamais de message d'erreur, jamais une étape
// « retire d'abord, reviens ensuite » — le petit nombre se sent par le
// design (l'écran de curation), jamais par un blocage.
// ════════════════════════════════════════════════════════════════

/** retire `idASortir` puis ajoute `idAAjouter` — un seul geste atomique.
 *  Marche même si l'anneau n'était pas plein (retire, puis ajoute) ; si
 *  `idAAjouter` y est déjà, rien ne change au-delà du retrait. Le
 *  `.slice` final est un filet de sécurité (jamais censé jouer en usage
 *  normal, puisqu'on vient de faire de la place) — pas une frontière de
 *  sécurité, juste une garantie qu'on ne dépasse jamais le cap. */
export function curerEtRemplacer(idASortir: string, idAAjouter: string): string[] {
  const sans = lesProches().filter((x) => x !== idASortir)
  const n = sans.includes(idAAjouter) ? sans : [...sans, idAAjouter].slice(0, CAP_PROCHES)
  localStorage.setItem(CLE, JSON.stringify(n))
  return n
}
