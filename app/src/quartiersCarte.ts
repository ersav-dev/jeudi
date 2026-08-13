// ════════════════════════════════════════════════════════════════
// jeudi. — LES QUARTIERS SUR LA CARTE : le rendu MapLibre.
//
// Ce que la note d'Ersan demandait depuis le début : « une couleur qui va
// affecter les rues ». C'est possible depuis que le fond est VECTORIEL
// (13/08) — prouvé sur banc avant la bascule, voir design/quartiers_voieA_001.
//
// LA RECETTE, en trois couches :
//   1. les ROUTES du style sont dupliquées UNE SEULE FOIS (pas une fois par
//      zone : ~26 couches, pas 260) et repeintes par un `case` qui teste
//      chaque zone avec `within`. Ajouter une zone ne coûte donc rien de
//      plus qu'un cran dans l'expression ;
//   2. l'APLAT prend le relais au dézoom (fondu croisé : la teinte des rues
//      s'éteint pendant que l'aplat s'allume — jamais les deux à fond) ;
//   3. le CONTOUR ne s'annonce pas (1,4 px à 38 %) : c'est la teinte qui
//      porte la zone, pas le trait (arbitrage d'Ersan, planche 3).
//
// Le mot, lui, n'est pas une couche : c'est un marqueur DOM en Caveat —
// les glyphes du style ne connaissent pas notre écriture, et de toute façon
// un nom de quartier est écrit par un humain, pas par la carte.
// ════════════════════════════════════════════════════════════════
import maplibregl from 'maplibre-gl'
import { ENCRES, contour, type Quartier } from './quartiers'

const PREFIXE = 'qz-'
export const SOURCE_ZONES = 'quartiers-zones'
const LAYER_APLAT = 'quartiers-aplat'
const LAYER_TRAIT = 'quartiers-trait'

const hex = (id: string) => ENCRES.find((e) => e.id === id)?.hex ?? '#9A948A'

/** le polygone d'une zone, en GeoJSON (contour échantillonné : les points
    doux sont des courbes, les durs des angles — cf. quartiers.ts) */
const anneau = (q: Quartier): [number, number][] => {
  const c = contour(q.points).map((p): [number, number] => [p.lng, p.lat])
  if (c.length) c.push(c[0])
  return c
}

const enFeature = (q: Quartier) => ({
  type: 'Feature' as const,
  id: q.id,
  properties: {
    id: q.id,
    nom: q.nom,
    encre: hex(q.encre),
    poids: q.poids,
    // l'opacité de l'aplat suit le poids : une zone qui ne pèse sur rien ne
    // pèse rien à l'écran non plus
    aplat: q.poids === 0 ? 0.22 : 0.28,
  },
  geometry: { type: 'Polygon' as const, coordinates: [anneau(q)] },
})

/** les couches de routes du style à dupliquer : les remplissages, pas les
    liserés (`_case`), sinon on repeint aussi le contour noir des avenues */
const couchesDeRoutes = (m: maplibregl.Map): maplibregl.LayerSpecification[] =>
  m.getStyle().layers.filter(
    (c) => c.type === 'line' && /^(road|tunnel|bridge)_/.test(c.id) && !/_case/.test(c.id),
  ) as maplibregl.LayerSpecification[]

/** pose (ou remet à jour) tout le décor des quartiers */
export function poserQuartiersSurCarte(m: maplibregl.Map, zones: Quartier[]): void {
  if (!m.isStyleLoaded()) return

  // ── 1. la source (aplat + contour) ───────────────────────────
  const data = { type: 'FeatureCollection' as const, features: zones.map(enFeature) }
  const src = m.getSource(SOURCE_ZONES) as maplibregl.GeoJSONSource | undefined
  if (src) src.setData(data)
  else {
    m.addSource(SOURCE_ZONES, { type: 'geojson', data })
    // l'aplat, sous tout le reste de nos calques
    m.addLayer({
      id: LAYER_APLAT,
      type: 'fill',
      source: SOURCE_ZONES,
      paint: {
        'fill-color': ['get', 'encre'],
        // le fondu croisé : rien de près (les rues suffisent), l'aplat au loin
        'fill-opacity': [
          'interpolate', ['linear'], ['zoom'],
          13.2, ['get', 'aplat'],
          14.6, 0,
        ],
      },
    })
    m.addLayer({
      id: LAYER_TRAIT,
      type: 'line',
      source: SOURCE_ZONES,
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': ['get', 'encre'],
        'line-width': 1.4,
        // au repos le contour ne s'annonce pas (Ersan, 13/08)
        'line-opacity': 0.38,
        // une zone éteinte (« jamais ici ») se signale par un trait haché,
        // en attendant le vrai motif de hachures
        'line-dasharray': ['case', ['==', ['get', 'poids'], 0], ['literal', [2, 2]], ['literal', [1, 0]]],
      },
    })
  }

  // ── 2. la teinte des rues (le cœur du chantier) ──────────────
  // Les zones ÉTEINTES (poids 0) ne teignent rien : elles retirent, elles
  // ne décorent pas. Les autres teignent, d'autant plus qu'elles pèsent.
  const teignantes = zones.filter((z) => z.poids > 0)
  const anciennes = m.getStyle().layers.filter((c) => c.id.startsWith(PREFIXE))
  for (const c of anciennes) m.removeLayer(c.id)
  if (!teignantes.length) return

  const polys = teignantes.map((z) => ({
    type: 'Polygon' as const,
    coordinates: [anneau(z)],
  }))
  // couleur : le premier `within` qui répond gagne (les zones sont testées
  // dans l'ordre du carnet, la plus ancienne d'abord)
  const couleur: unknown[] = ['case']
  const opacite: unknown[] = ['case']
  teignantes.forEach((z, i) => {
    couleur.push(['within', polys[i]], hex(z.encre))
    // le poids se lit dans l'intensité : 1 chuchote, 3 parle
    opacite.push(['within', polys[i]], 0.45 + z.poids * 0.18)
  })
  couleur.push('#000000')
  opacite.push(0)
  const dedans: unknown[] = ['any', ...polys.map((p) => ['within', p])]

  for (const c of couchesDeRoutes(m)) {
    const copie = JSON.parse(JSON.stringify(c)) as maplibregl.LayerSpecification & {
      filter?: unknown
      paint?: Record<string, unknown>
      'source-layer'?: string
    }
    copie.id = PREFIXE + c.id
    copie.filter = (c as { filter?: unknown }).filter
      ? ['all', (c as { filter?: unknown }).filter, dedans]
      : dedans
    copie.paint = {
      ...(copie.paint || {}),
      'line-color': couleur,
      'line-opacity': opacite,
    }
    // la teinte se pose SUR la route d'origine, et sous tout le reste :
    // juste après la dernière route du style
    m.addLayer(copie as maplibregl.LayerSpecification, premiereNonRoute(m))
  }
}

/** l'id de la première couche qui n'est pas une route — nos teintes se
    glissent juste avant, donc au-dessus des rues et sous les libellés */
function premiereNonRoute(m: maplibregl.Map): string | undefined {
  const l = m.getStyle().layers
  const i = l.findIndex((c) => /^(building|water_name|place_|poi_|road_label|housenum)/.test(c.id))
  return i >= 0 ? l[i].id : undefined
}

// ── les étiquettes : un marqueur DOM par zone, écrit à la main ──
const etiquettes = new Map<string, maplibregl.Marker>()

export function poserEtiquettes(m: maplibregl.Map, zones: Quartier[]): void {
  for (const [id, mk] of etiquettes) {
    if (!zones.some((z) => z.id === id)) {
      mk.remove()
      etiquettes.delete(id)
    }
  }
  for (const z of zones) {
    if (!z.nom.trim()) continue
    const c = contour(z.points)
    const centre: [number, number] = [
      c.reduce((s, p) => s + p.lng, 0) / c.length,
      c.reduce((s, p) => s + p.lat, 0) / c.length,
    ]
    let mk = etiquettes.get(z.id)
    if (!mk) {
      const el = document.createElement('div')
      el.className = 'quartier-mot'
      mk = new maplibregl.Marker({ element: el }).setLngLat(centre).addTo(m)
      etiquettes.set(z.id, mk)
    }
    const el = mk.getElement()
    el.textContent = z.nom
    el.style.color = hex(z.encre)
    el.style.opacity = z.poids === 0 ? '0.55' : '1'
    mk.setLngLat(centre)
  }
}

export function retirerEtiquettes(): void {
  for (const mk of etiquettes.values()) mk.remove()
  etiquettes.clear()
}
