// les tracés de lignes : quand on touche une station, sa ou ses lignes se
// dessinent sur la carte, et ses bouches de métro apparaissent.
//
// La géométrie est la VRAIE (les voies telles qu'elles courent sous Paris),
// simplifiée à ~6 m : 9 200 points pour 69 tracés, 204 ko. La version
// « stations reliées à la règle » a été essayée d'abord — trop schématique
// une fois posée sur les vraies rues.
//
// Les couleurs sont celles de la charte IDFM, PAS celles d'OSM : OSM est
// systématiquement plus terne (la 1 y est #ffbe00 au lieu du #FFCE00, la 3
// #6e6e00 au lieu du #9F9825 olive).
//
// Données OSM figées le 2026-08-08.
import type { FeatureCollection, MultiLineString } from 'geojson'

export type Ligne = {
  id: string
  ref: string
  mode: 'metro' | 'rer' | 'tram'
  couleur: string
  stations: string[]
  brins: [number, number][][]
}

// une bouche : sa position, son numéro de sortie (celui écrit sur les
// panneaux, en bas), son nom de rue brut, sa distance à la station
export type Bouche = { p: [number, number]; r: string | null; n: string | null; d: number }

// « Place de l'Opéra (théâtre national de l'Opéra) » → « Pl. de l'Opéra ».
// Les noms bruts montent à 89 caractères ; sur la carte il en faut ~15.
// La parenthèse saute d'abord (c'est toujours une précision, jamais l'adresse),
// puis les génériques de voie s'abrègent comme sur un plan.
const ABREGE: [RegExp, string][] = [
  [/^Avenue\b/i, 'Av.'],
  [/^Boulevard\b/i, 'Bd'],
  [/^Place\b/i, 'Pl.'],
  [/^Rue\b/i, 'R.'],
  [/^Quai\b/i, 'Q.'],
  [/^Passage\b/i, 'Pass.'],
  [/^Théâtre\b/i, 'Th.'],
  [/^Galeries\b/i, 'Gal.'],
  [/\bSainte-/gi, 'Ste-'],
  [/\bSaint-/gi, 'St-'],
]

export const elaguer = (nom: string | null): string | null => {
  if (!nom) return null
  let s = nom.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
  if (!s) return null
  for (const [re, court] of ABREGE) s = s.replace(re, court)
  return s
}

export const SOURCE_LIGNES = 'lignes-tracees'
export const LAYER_LIGNES = 'lignes-tracees-trait'
export const LAYER_LIGNES_HALO = 'lignes-tracees-halo'

let cacheL: Map<string, Ligne> | null = null
let promL: Promise<Map<string, Ligne>> | null = null

export const chargerLignes = (): Promise<Map<string, Ligne>> => {
  if (cacheL) return Promise.resolve(cacheL)
  if (promL) return promL
  promL = fetch('/lignes.json')
    .then((r) => r.json() as Promise<{ lignes: Ligne[] }>)
    .then((d) => (cacheL = new Map(d.lignes.map((l) => [l.id, l]))))
  return promL
}

let cacheB: Record<string, Bouche[]> | null = null
let promB: Promise<Record<string, Bouche[]>> | null = null

// les bouches ne servent qu'au moment où une station est touchée : on ne les
// charge donc qu'à ce moment-là, jamais à l'ouverture de la carte.
export const chargerBouches = (): Promise<Record<string, Bouche[]>> => {
  if (cacheB) return Promise.resolve(cacheB)
  if (promB) return promB
  promB = fetch('/entrees.json')
    .then((r) => r.json() as Promise<Record<string, Bouche[]>>)
    .then((d) => (cacheB = d))
  return promB
}

export const AUCUNE_LIGNE: FeatureCollection<MultiLineString, { couleur: string; ref: string }> = {
  type: 'FeatureCollection',
  features: [],
}

// un seul layer peint toutes les lignes : la couleur voyage dans la donnée,
// lue côté MapLibre par ['get','couleur']
export const tracesPour = (
  ids: string[] | undefined,
  toutes: Map<string, Ligne>,
): FeatureCollection<MultiLineString, { couleur: string; ref: string }> => {
  if (!ids?.length) return AUCUNE_LIGNE
  const features = []
  for (const id of ids) {
    const l = toutes.get(id)
    if (!l) continue
    const brins = l.brins.filter((b) => b.length >= 2)
    if (!brins.length) continue
    features.push({
      type: 'Feature' as const,
      properties: { couleur: l.couleur, ref: l.ref },
      geometry: { type: 'MultiLineString' as const, coordinates: brins },
    })
  }
  return { type: 'FeatureCollection', features }
}

// combien de SORTIES on accepte d'afficher d'un coup : Châtelet en a dix,
// au-delà de huit la carte devient une grille de flèches. On plafonne les
// sorties, pas les escaliers — une sortie à deux escaliers reste entière.
export const PLAFOND_BOUCHES = 8
// le numéro apparaît dès qu'on est sur un quartier, le nom seulement quand
// on marche vraiment vers la sortie
export const Z_BOUCHES = 15
export const Z_NOM_BOUCHE = 17

export type BoucheAffichee = {
  p: [number, number]
  num: string | null
  nom: string | null
}

// Une même sortie a souvent DEUX escaliers : OSM les cartographie séparément
// (215 cas dans Paris, écartés de 1 à 60 m). On garde les deux — savoir qu'il
// y a deux accès compte quand on donne rendez-vous « à la sortie 1 ». Mais on
// n'écrit le numéro et la rue QU'UNE FOIS par sortie : deux flèches, une
// étiquette. Le dessin dit alors ce qu'il faut — une sortie, deux façons d'y
// descendre — au lieu de bégayer.
const cleSortie = (b: Bouche) => `${b.r ?? '?'}|${b.n ?? ''}`

// les bouches à poser pour la station touchée. Le plafond compte les SORTIES
// (la donnée est déjà triée par distance à la station) ; tous les escaliers
// des sorties retenues sont posés. Le nom n'apparaît qu'au-delà de Z_NOM_BOUCHE.
export const bouchesPour = (
  station: string | null,
  toutes: Record<string, Bouche[]> | null,
  zoom: number,
): BoucheAffichee[] => {
  if (zoom < Z_BOUCHES) return []
  const l = station && toutes ? toutes[station] : null
  if (!l?.length) return []
  const avecNom = zoom >= Z_NOM_BOUCHE
  const rang = new Map<string, number>()
  const sorties: BoucheAffichee[] = []
  for (const b of l) {
    const cle = cleSortie(b)
    const vu = rang.has(cle)
    if (!vu) {
      if (rang.size >= PLAFOND_BOUCHES) continue
      rang.set(cle, sorties.length)
    }
    sorties.push({
      p: b.p,
      // le premier escalier de la sortie porte l'étiquette, les suivants non
      num: vu ? null : b.r,
      nom: vu || !avecNom ? null : elaguer(b.n),
    })
  }
  return sorties
}
