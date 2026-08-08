// les repères de transport de Paris : métro, RER, tram, bus, Vélib', Batobus.
// aidés par ces petits ronds au style d'un plan RATP, le lecteur SE SITUE
// sans qu'on ait à annoter — c'est la même fonction que les monuments, à une
// autre échelle. Données figées le 2026-08-07 depuis OSM (Overpass API),
// consolidées puis dédupliquées par nom (une gare = 1 point, moyenne des
// entrées ou quais). Chargé DYNAMIQUEMENT (712 ko) — pas dans le bundle
// initial, la carte s'affiche d'abord, les repères se posent après.
import type { FeatureCollection, Point } from 'geojson'

export type TypeTransport = 'metro' | 'rer' | 'tram' | 'bus' | 'batobus' | 'velib'

// couleur RATP par mode (bleu-nuit métro, bleu RER, vert tram, jaune bus,
// rouge Vélib, cyan Batobus) — utilisée par le badge de la plaque
export const TEINTES: Record<TypeTransport, string> = {
  metro: '#0b1a3a',
  rer: '#0055c8',
  tram: '#66a933',
  bus: '#f0b429',
  batobus: '#00a4c4',
  velib: '#e05a3a',
}

let cache: FeatureCollection<Point, { type: TypeTransport; nom: string; lignes?: string[] }> | null = null
let promesse: Promise<FeatureCollection<Point, { type: TypeTransport; nom: string; lignes?: string[] }>> | null = null

export const donneesTransport = () => {
  if (cache) return Promise.resolve(cache)
  if (promesse) return promesse
  promesse = fetch('/transport.json')
    .then((r) => r.json() as Promise<FeatureCollection<Point, { type: TypeTransport; nom: string; lignes?: string[] }>>)
    .then((geo) => {
      cache = geo
      return geo
    })
  return promesse
}
