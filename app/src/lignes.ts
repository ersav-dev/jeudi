// les tracés de lignes : quand on touche une station, sa ou ses lignes
// se dessinent sur la carte, chacune dans sa vraie couleur RATP.
//
// Ce n'est PAS la géométrie des voies : c'est l'ordre des stations, relié.
// Un plan de métro n'a jamais été un relevé GPS — c'est un tracé dessiné, et
// c'est ce que veut le carnet. Accessoirement ça pèse 64 ko au lieu de
// plusieurs Mo. Données OSM figées le 2026-08-08 (relations type=route).
import type { FeatureCollection, LineString } from 'geojson'

export type Ligne = {
  id: string
  ref: string
  mode: 'metro' | 'rer' | 'tram'
  couleur: string
  stations: string[]
  points: [number, number][]
}

export const SOURCE_LIGNES = 'lignes-tracees'
export const LAYER_LIGNES = 'lignes-tracees-trait'
export const LAYER_LIGNES_HALO = 'lignes-tracees-halo'

let cache: Map<string, Ligne> | null = null
let promesse: Promise<Map<string, Ligne>> | null = null

export const chargerLignes = (): Promise<Map<string, Ligne>> => {
  if (cache) return Promise.resolve(cache)
  if (promesse) return promesse
  promesse = fetch('/lignes.json')
    .then((r) => r.json() as Promise<{ lignes: Ligne[] }>)
    .then((d) => {
      cache = new Map(d.lignes.map((l) => [l.id, l]))
      return cache
    })
  return promesse
}

// la collection vide : l'état « aucune ligne tracée »
export const AUCUNE_LIGNE: FeatureCollection<LineString, { couleur: string; ref: string }> = {
  type: 'FeatureCollection',
  features: [],
}

// les tracés demandés, prêts pour MapLibre (la couleur voyage dans la
// propriété : un seul layer peint toutes les lignes via ['get','couleur'])
export const tracesPour = (
  ids: string[] | undefined,
  toutes: Map<string, Ligne>,
): FeatureCollection<LineString, { couleur: string; ref: string }> => {
  if (!ids?.length) return AUCUNE_LIGNE
  const features = []
  for (const id of ids) {
    const l = toutes.get(id)
    if (!l || l.points.length < 2) continue
    features.push({
      type: 'Feature' as const,
      properties: { couleur: l.couleur, ref: l.ref },
      geometry: { type: 'LineString' as const, coordinates: l.points },
    })
  }
  return { type: 'FeatureCollection', features }
}
