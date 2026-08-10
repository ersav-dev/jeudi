// les repères de transport de Paris : métro, RER, tram, bus, Vélib', Batobus.
// aidés par ces petits ronds au style d'un plan RATP, le lecteur SE SITUE
// sans qu'on ait à annoter — c'est la même fonction que les monuments, à une
// autre échelle. Données figées le 2026-08-07 depuis OSM (Overpass API),
// consolidées puis dédupliquées par nom (une gare = 1 point, moyenne des
// entrées ou quais). Chargé DYNAMIQUEMENT (712 ko) — pas dans le bundle
// initial, la carte s'affiche d'abord, les repères se posent après.
import type { FeatureCollection, Point } from 'geojson'

// 10/08 — LE FICHIER NE CONTIENT PLUS QUE CE QUI EST DESSINÉ. Il portait aussi
// 3 107 arrêts de bus et 1 507 stations Vélib' que rien n'affichait : 88 % de
// 716 ko téléchargés pour rien. Retirés (97 ko désormais).
//   · les bus de JOUR ont quitté le produit — un arrêt montré à 2 h alors
//     qu'il ne roule plus est une fausse promesse (panel du 10/08) ;
//   · les bus de NUIT vivent dans `noctilien.json`, chargé seulement quand on
//     ouvre une fiche (voir rentrer.ts) ;
//   · les Vélib' viennent désormais du temps réel GBFS — leurs positions
//     arrivent avec leur disponibilité, donc rien à figer ici (et rien qui
//     pourrit quand une station ferme).
export type TypeTransport = 'metro' | 'rer' | 'tram' | 'batobus'

// couleur RATP par mode (bleu-nuit métro, bleu RER, vert tram, cyan Batobus)
// — utilisée par le badge de la plaque
export const TEINTES: Record<TypeTransport, string> = {
  metro: '#0b1a3a',
  rer: '#0055c8',
  tram: '#66a933',
  batobus: '#00a4c4',
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
