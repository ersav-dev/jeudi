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
import type { FeatureCollection, MultiLineString, Point } from 'geojson'

export type Ligne = {
  id: string
  ref: string
  mode: 'metro' | 'rer' | 'tram'
  couleur: string
  stations: string[]
  brins: [number, number][][]
}

export type Bouche = { p: [number, number]; n: string | null }

export const SOURCE_LIGNES = 'lignes-tracees'
export const LAYER_LIGNES = 'lignes-tracees-trait'
export const LAYER_LIGNES_HALO = 'lignes-tracees-halo'
export const SOURCE_BOUCHES = 'bouches-metro'
export const LAYER_BOUCHES = 'bouches-metro-points'

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
export const AUCUNE_BOUCHE: FeatureCollection<Point, { nom: string | null }> = {
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

export const bouchesPour = (
  station: string | null,
  toutes: Record<string, Bouche[]> | null,
): FeatureCollection<Point, { nom: string | null }> => {
  const l = station && toutes ? toutes[station] : null
  if (!l?.length) return AUCUNE_BOUCHE
  return {
    type: 'FeatureCollection',
    features: l.map((b) => ({
      type: 'Feature' as const,
      properties: { nom: b.n },
      geometry: { type: 'Point' as const, coordinates: b.p },
    })),
  }
}
