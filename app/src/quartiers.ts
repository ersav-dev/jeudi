// ════════════════════════════════════════════════════════════════
// jeudi. — LES QUARTIERS DESSINÉS : le module pur.
//
// Ton Paris, annoté à la main : on entoure une zone au doigt, on lui donne
// une encre et un mot. Ici, AUCUN écran et AUCUNE carte — que des fonctions
// qui se testent. Le dessin, le rendu MapLibre et le magasin viendront
// s'appuyer dessus (cadrage : CHANTIER_QUARTIERS.md).
//
// Deux décisions d'Ersan commandent tout ce fichier :
//
//   1. « un outil plume et un lasso, et à CHAQUE POINT on choisit angle
//      droit ou angle doux » (13/08). Le choix n'est pas dans l'outil, il
//      est dans le point : chaque ancre porte son `dur`. La plume pose des
//      durs, le lasso pose des doux, et un tap retourne n'importe lequel.
//      Conséquence : l'outil « traits droits » n'existe pas (c'est une zone
//      tout en durs) et le cran de lissage n'existe pas non plus.
//
//   2. « une encre = une zone » : la palette REMPLACE le plafond arbitraire.
//      Six encres, donc six quartiers. Pour un septième, on en rature un.
//
// Et une exigence du panel du 13/08 (PANEL_QUARTIERS_2026-08-13.md) : une
// zone qui ne sert à rien n'est qu'un dessin. `dansLaZone()` est donc écrite
// ICI, dès le premier jour — c'est elle qui rendra « dans mon quartier »
// possible dans la recherche.
// ════════════════════════════════════════════════════════════════

/** une ancre du contour. `dur` = angle net ; sinon la courbe la traverse. */
export interface PointZone {
  lng: number
  lat: number
  /** vrai = point d'angle (la tangente est cassée) */
  dur?: boolean
}

export interface Quartier {
  id: string
  /** le mot, écrit (ou composé en lettres) par un humain — jamais par l'app */
  nom: string
  /** l'identifiant d'encre (voir ENCRES), pas une valeur hexadécimale */
  encre: EncreId
  points: PointZone[]
  creeLe: string
  /** comment il est né — utile pour comprendre les usages, jamais affiché */
  source: 'lasso' | 'plume' | 'bulle'
}

// ── les encres du carnet ────────────────────────────────────────────
// Nommées comme des pigments, tirées vers le gris pour tenir sur le
// charbon. La cire (#A8322A) et le bleu jeudi (#5d8dff) restent DEHORS :
// ils ont déjà un métier (l'irréversible, l'identité).
export const ENCRES = [
  { id: 'prusse', nom: 'bleu de Prusse', hex: '#5C88A6' },
  { id: 'vert', nom: 'vert-de-gris', hex: '#7C9A6E' },
  { id: 'aniline', nom: "violet d'aniline", hex: '#8E76B4' },
  { id: 'ocre', nom: 'ocre brûlée', hex: '#C9963E' },
  { id: 'indien', nom: 'rose indien', hex: '#B85F82' },
  { id: 'graphite', nom: 'graphite', hex: '#9A948A' },
] as const

export type EncreId = (typeof ENCRES)[number]['id']

/** le plafond n'est pas un nombre inventé : c'est la palette elle-même */
export const CAP_ZONES = ENCRES.length

/** la première encre encore libre — `null` quand la carte est pleine */
export function encreLibre(zones: Pick<Quartier, 'encre'>[]): EncreId | null {
  const prises = new Set(zones.map((z) => z.encre))
  return ENCRES.find((e) => !prises.has(e.id))?.id ?? null
}

// ── géométrie de base ───────────────────────────────────────────────
// À l'échelle d'un quartier (moins de 2 km), la Terre est un plan : on
// projette en mètres autour d'une latitude de référence. Inutile d'aller
// chercher une vraie projection pour dessiner un contour à main levée.
const R_TERRE = 6_371_000

const enMetres = (p: PointZone, lat0: number): [number, number] => [
  ((p.lng * Math.PI) / 180) * R_TERRE * Math.cos((lat0 * Math.PI) / 180),
  ((p.lat * Math.PI) / 180) * R_TERRE,
]

/** distance en mètres entre deux points (équirectangulaire — suffisant ici) */
export function metres(a: PointZone, b: PointZone): number {
  const [ax, ay] = enMetres(a, a.lat)
  const [bx, by] = enMetres(b, a.lat)
  return Math.hypot(bx - ax, by - ay)
}

/** distance d'un point au SEGMENT [a,b], en mètres */
function distanceAuSegment(p: PointZone, a: PointZone, b: PointZone): number {
  const lat0 = a.lat
  const [px, py] = enMetres(p, lat0)
  const [ax, ay] = enMetres(a, lat0)
  const [bx, by] = enMetres(b, lat0)
  const dx = bx - ax, dy = by - ay
  const l2 = dx * dx + dy * dy
  if (l2 === 0) return Math.hypot(px - ax, py - ay)
  // t = où tombe la projection de p sur [a,b], borné au segment
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// ── le lissage : Douglas-Peucker ────────────────────────────────────
// Le doigt produit ~200 points tremblés ; on en garde une douzaine. Ce
// n'est pas de la cosmétique : c'est ce qui rend la forme stockable,
// reprojetable et éditable. La planche 1 le montre — le tremblé n'était
// pas de l'âme, c'était du bruit.
export const TOLERANCE_M = 18

export function simplifier(points: PointZone[], toleranceM = TOLERANCE_M): PointZone[] {
  if (points.length <= 2) return [...points]
  let iMax = 0, dMax = 0
  for (let i = 1; i < points.length - 1; i++) {
    const d = distanceAuSegment(points[i], points[0], points[points.length - 1])
    if (d > dMax) { dMax = d; iMax = i }
  }
  if (dMax <= toleranceM) return [points[0], points[points.length - 1]]
  const gauche = simplifier(points.slice(0, iMax + 1), toleranceM)
  const droite = simplifier(points.slice(iMax), toleranceM)
  return [...gauche.slice(0, -1), ...droite]
}

// ── les trois naissances d'une zone ─────────────────────────────────
// (le panel du 13/08 en a exigé une troisième : « entourer autour d'ici »,
//  pour qui ne peut pas — ou ne veut pas — tracer)

/** LE LASSO : un tracé au doigt → un contour lissé, tous les points DOUX */
export function depuisTrace(trace: PointZone[], toleranceM = TOLERANCE_M): PointZone[] {
  if (trace.length < 3) return []
  // le tracé se ferme tout seul : on ne demande pas de revenir au départ
  const ferme = metres(trace[0], trace[trace.length - 1]) < toleranceM
  const brut = ferme ? trace.slice(0, -1) : trace
  const lisse = simplifier(brut, toleranceM)
  // le premier et le dernier point du DP sont les deux bouts du tracé :
  // une fois la boucle fermée, ils sont voisins — si trop proches, on fond
  const points = lisse.map((p) => ({ lng: p.lng, lat: p.lat }))
  if (points.length > 3 && metres(points[0], points[points.length - 1]) < toleranceM) points.pop()
  return points
}

/** LA PLUME : des taps → un contour anguleux, tous les points DURS */
export function depuisTaps(taps: PointZone[]): PointZone[] {
  return taps.map((p) => ({ lng: p.lng, lat: p.lat, dur: true }))
}

/** LA BULLE : un centre et un rayon → huit points doux (aucun tracé) */
export function bulleAutour(centre: PointZone, rayonM: number, cotes = 8): PointZone[] {
  const dLat = (rayonM / R_TERRE) * (180 / Math.PI)
  const dLng = dLat / Math.cos((centre.lat * Math.PI) / 180)
  return Array.from({ length: cotes }, (_, i) => {
    const a = (i / cotes) * Math.PI * 2
    return { lng: centre.lng + Math.cos(a) * dLng, lat: centre.lat + Math.sin(a) * dLat }
  })
}

/** le tap qui retourne un point : carré ↔ rond */
export function retournerPoint(points: PointZone[], i: number): PointZone[] {
  return points.map((p, j) => (j === i ? { ...p, dur: !p.dur } : p))
}

// ── le contour rendu : la courbe, échantillonnée ────────────────────
// Un point DOUX reçoit la tangente de Catmull-Rom (le tiers de la corde qui
// le traverse) ; un point DUR reçoit une poignée nulle, ce qui casse la
// tangente et produit l'angle. C'est le point d'angle des vrais outils
// vectoriels, obtenu par un tap au lieu d'une touche du clavier.
const tangente = (p: PointZone[], i: number): [number, number] => {
  const n = p.length
  const a = p[(i - 1 + n) % n], b = p[(i + 1) % n]
  return [(b.lng - a.lng) / 6, (b.lat - a.lat) / 6]
}

/** échantillonne le contour fermé en polyligne — la géométrie de vérité */
export function contour(points: PointZone[], parSegment = 12): PointZone[] {
  const n = points.length
  if (n < 3) return [...points]
  const out: PointZone[] = []
  for (let i = 0; i < n; i++) {
    const a = points[i], b = points[(i + 1) % n]
    const ta = a.dur ? [0, 0] : tangente(points, i)
    const tb = b.dur ? [0, 0] : tangente(points, (i + 1) % n)
    const c1 = { lng: a.lng + ta[0], lat: a.lat + ta[1] }
    const c2 = { lng: b.lng - tb[0], lat: b.lat - tb[1] }
    for (let s = 0; s < parSegment; s++) {
      const t = s / parSegment, u = 1 - t
      out.push({
        lng: u * u * u * a.lng + 3 * u * u * t * c1.lng + 3 * u * t * t * c2.lng + t * t * t * b.lng,
        lat: u * u * u * a.lat + 3 * u * u * t * c1.lat + 3 * u * t * t * c2.lat + t * t * t * b.lat,
      })
    }
  }
  return out
}

/** le même contour en GeoJSON — l'anneau se referme sur son premier point */
export function enGeoJSON(points: PointZone[]): {
  type: 'Polygon'
  coordinates: [number, number][][]
} {
  const c = contour(points).map((p): [number, number] => [p.lng, p.lat])
  if (c.length) c.push(c[0])
  return { type: 'Polygon', coordinates: [c] }
}

// ── L'USAGE QUE LE PANEL EXIGE : « dans mon quartier » ───────────────
// Sans elle, une zone n'est qu'un dessin. Lancer de rayon sur le contour
// échantillonné : on compte les traversées à droite du point.
export function dansLaZone(p: { lat: number; lng: number }, points: PointZone[]): boolean {
  const c = contour(points)
  if (c.length < 3) return false
  let dedans = false
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
    const yi = c[i].lat, xi = c[i].lng, yj = c[j].lat, xj = c[j].lng
    if (yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) {
      dedans = !dedans
    }
  }
  return dedans
}

/** les lieux d'une liste qui tombent dans la zone (le filtre de la recherche) */
export function lieuxDeLaZone<T extends { lat: number; lng: number }>(
  lieux: T[],
  points: PointZone[],
): T[] {
  return lieux.filter((l) => dansLaZone(l, points))
}

// ── la règle des 32 px (planche 6) ──────────────────────────────────
// Pour retourner un point, il faut pouvoir le toucher. Douze points sur
// 700 m tombent parfois à 15 px l'un de l'autre, et un doigt en fait 44 :
// on n'affiche que les points assez écartés. Les autres ne sont pas
// perdus — ils reviennent en zoomant.
export const ECART_MIN_PX = 32

export function metresParPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom)
}

/** indices des points saisissables à ce zoom (le premier est toujours gardé) */
export function pointsSaisissables(points: PointZone[], zoom: number): number[] {
  if (!points.length) return []
  const seuil = ECART_MIN_PX * metresParPixel(points[0].lat, zoom)
  const gardes: number[] = [0]
  for (let i = 1; i < points.length; i++) {
    const dernier = points[gardes[gardes.length - 1]]
    if (metres(dernier, points[i]) >= seuil) gardes.push(i)
  }
  // le dernier ne doit pas non plus coller au premier
  if (gardes.length > 1 && metres(points[gardes[gardes.length - 1]], points[0]) < seuil) gardes.pop()
  return gardes
}
