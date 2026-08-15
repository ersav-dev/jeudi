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
//   2. « on trace TOUS les quartiers, pas que le sien — le taf, dating
//      area, alerte dealers, no go » (13/08 au soir). Une zone n'est donc
//      pas une identité mais une INTENTION. Ça a tué la règle « une encre =
//      une zone » (six ne suffisent plus) et ça donne enfin aux zones un
//      usage réel — ce que le panel réclamait.
//
//   3. « l'utilisateur met des couleurs… et à côté : me recommander ce
//      quartier ? et on pondère, genre sur 3 ». La couleur ne veut rien
//      dire (elle est à lui) ; le poids se règle à part, sur la pastille à
//      trois niveaux du carnet. Voir PoidsZone.
//
// ⚠ CE QUI SORT, ET CE QUI NE SORT PAS. Une zone « jamais ici » est un
// jugement porté sur un bout de ville où des gens habitent. Elle peut être
// proposée aux SUPER POTES (10 max, choisis un par un) : ça, c'est une
// conversation, pas une publication — et une zone reçue n'est jamais un
// filtre, seulement une proposition à accepter (`ZoneRecue`). Ce qui reste
// interdit et ne bougera pas : au-delà de l'anneau (aucun public, aucun
// inconnu, aucun export), et TOUTE AGRÉGATION entre utilisateurs — jamais
// de carte de chaleur, jamais de « 4 personnes évitent ce quartier ».
// C'est la frontière entre un carnet qu'on se passe et un mur.
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

// LE POIDS D'UNE ZONE (Ersan, 13/08 au soir : « l'utilisateur met des
// couleurs… et il met à côté : me recommander ce quartier ? et on pondère,
// genre sur 3 »). Mon binaire vers/contre est mort en une phrase, et il
// avait tort : entre « j'évite » et « j'adore » il y a « ça m'est égal »,
// qui est l'état de 90 % de la ville.
//
// Sa graduation (0/1/2/3), avec UNE correction : le 0 n'est pas un cran,
// c'est une sortie de barème. « Jamais ici ou alors très peu » mélangeait
// deux choses — si « très peu » restait possible, la promesse « ne me le
// propose plus » ne tenait plus. Donc : 0 = zéro, et « très peu », c'est
// exactement ce que dit le cran 1.
//
// UN CADRAN PLEIN PAR DÉFAUT, ET UN CŒUR ÉTEINT À CÔTÉ (Ersan, 13/08 :
// « de base c'est les 3 qui sont actives, et le cœur est éteint »). C'est
// le bon sens de lecture : une zone qu'on vient de tracer ne DIMINUE rien
// — l'app fait comme d'habitude. On baisse le cadran pour être proposé
// moins souvent, et on l'éteint complètement pour ne plus l'être du tout.
//
//   3 · ●●●   comme d'habitude → LE DÉFAUT : rien ne change
//   2 · ●●○   un peu moins     → ça descend un peu
//   1 · ●○○   rarement         → ça descend beaucoup
//   0 · ○○○   jamais ici       → RETIRÉ. Le cadran éteint EST le retrait.
//   ♥ (à côté, éteint par défaut) → en priorité : ça remonte
//
// Le cœur n'est pas un quatrième cran, c'est un INTERRUPTEUR au-dessus du
// plein. Il est dessiné à l'encre, monoline (ICoeur) — jamais un emoji, la
// DA l'interdit — et il existe déjà dans l'alphabet des perles. Ce n'est
// PAS une étoile : on ne note pas un quartier, on dit à l'app à quel point
// on veut qu'elle nous y envoie.
//
// La COULEUR n'a aucun sens : elle est à l'utilisateur (c'est son carnet,
// il met les encres qu'il veut). C'est la MATIÈRE qui porte le poids —
// hachuré / pointillé / filet / rues teintées. Une couleur ne dit jamais
// une règle.
export type PoidsZone = 0 | 1 | 2 | 3

/** le cadran d'une zone qu'on vient de tracer : PLEIN — elle ne diminue rien */
export const POIDS_DEFAUT: PoidsZone = 3

export const POIDS = [
  { n: 0 as const, pastille: '○○○', mot: 'jamais ici', dit: 'on ne te le propose plus' },
  { n: 1 as const, pastille: '●○○', mot: 'rarement', dit: 'ça descend beaucoup' },
  { n: 2 as const, pastille: '●●○', mot: 'un peu moins', dit: 'ça descend un peu' },
  { n: 3 as const, pastille: '●●●', mot: "comme d'habitude", dit: 'rien ne change (le défaut)' },
]

/** le cœur, à côté du cadran : éteint par défaut. Il ne remplace aucun cran,
    il ajoute UN étage au-dessus du plein. Éteindre le cadran l'éteint aussi
    (on ne met pas en priorité un endroit où on ne va jamais). */
export const COEUR_DEFAUT = false

export interface Quartier {
  id: string
  /** le mot, écrit (ou composé en lettres) par un humain — jamais par l'app */
  nom: string
  /** le cadran : ●●● comme d'habitude (défaut) → ○○○ jamais ici */
  poids: PoidsZone
  /** le cœur, à côté : « en priorité ». Éteint par défaut. */
  coeur?: boolean
  /** où elle vit. « cercle » = proposée aux super potes (10 max), jamais
      au-delà : ce n'est pas une publication, c'est une conversation. */
  partage: 'moi' | 'cercle'
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

// ⚠ La règle « une encre = une zone » est TOMBÉE le 13/08 au soir : dès
// qu'on trace le taf, le dating, ce qu'on évite et son quartier, six zones
// ne suffisent plus. L'encre redevient une couleur qu'on choisit (elle peut
// se répéter — c'est le MOT qui distingue), et le plafond redevient un
// nombre : dix. Au-delà, la carte redevient un mur — et le cap n'est pas un
// mur, on cure, comme les proches et les stickers.
export const CAP_ZONES = 10

/** l'encre proposée par défaut : la première encore libre, sinon la suivante
    dans l'ordre du carnet (la répétition est permise, plus un blocage) */
export function encreSuggeree(zones: Pick<Quartier, 'encre'>[]): EncreId {
  const prises = new Set(zones.map((z) => z.encre))
  return ENCRES.find((e) => !prises.has(e.id))?.id ?? ENCRES[zones.length % ENCRES.length].id
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

// ── ÉDITER LA FORME (14/08) ──────────────────────────────────────────
// Ersan : « on doit pouvoir créer, supprimer, modifier les autres… et si on
// clique sur un angle, voir quel type d'angle on veut ». Les trois gestes
// de l'éditeur, en fonctions pures — l'écran ne fait que les appeler.

/** on choisit l'angle, on ne le devine pas : dur (net) ou doux (la courbe passe) */
export function poserAngle(points: PointZone[], i: number, dur: boolean): PointZone[] {
  return points.map((p, j) => (j === i ? { ...p, dur } : p))
}

/** glisser une poignée : le point suit le doigt */
export function deplacerPoint(points: PointZone[], i: number, vers: PointZone): PointZone[] {
  return points.map((p, j) => (j === i ? { ...p, lng: vers.lng, lat: vers.lat } : p))
}

/** taper un MILIEU ajoute un point là — doux par défaut : on vient
    d'épouser une courbe, pas de casser un angle */
export function ajouterPointApres(points: PointZone[], i: number): PointZone[] {
  const n = points.length
  if (n < 2) return points
  const a = points[i % n], b = points[(i + 1) % n]
  const milieu: PointZone = { lng: (a.lng + b.lng) / 2, lat: (a.lat + b.lat) / 2 }
  return [...points.slice(0, i + 1), milieu, ...points.slice(i + 1)]
}

/** retirer un point — jamais en dessous de trois : une zone à deux points
    n'est plus une zone, c'est un trait */
export function retirerPoint(points: PointZone[], i: number): PointZone[] {
  if (points.length <= 3) return points
  return points.filter((_, j) => j !== i)
}

/** les milieux, pour les afficher : le point AJOUTABLE entre i et i+1 */
export function milieux(points: PointZone[]): PointZone[] {
  const n = points.length
  return points.map((a, i) => {
    const b = points[(i + 1) % n]
    return { lng: (a.lng + b.lng) / 2, lat: (a.lat + b.lat) / 2 }
  })
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

// ── la pondération ───────────────────────────────────────────────────
// Le 0 ne se négocie pas : c'est un retrait, pas un malus. Personne
// n'entoure un endroit pour qu'on le lui propose un soir de fatigue.
// Le 3 ne se négocie pas non plus, dans l'autre sens : ça ne FILTRE rien
// (on ne réduit pas la ville à trois quartiers), ça REMONTE. Et entre les
// deux, le 1 et le 2 penchent le classement sans jamais rien supprimer.

type ZonePesee = Pick<Quartier, 'points' | 'poids'> & { coeur?: boolean }

/** le cadran qui s'applique à un lieu : le plus BAS l'emporte (un « jamais »
    gagne toujours sur un cœur qui le chevauche — le retrait est une
    décision, la préférence est un souhait) */
export function poidsDuLieu(p: { lat: number; lng: number }, zones: ZonePesee[]): PoidsZone {
  const dedans = zones.filter((z) => dansLaZone(p, z.points))
  if (!dedans.length) return POIDS_DEFAUT
  return dedans.reduce<PoidsZone>((min, z) => (z.poids < min ? z.poids : min), 3)
}

/** le rang qui sert à classer : le cadran, plus l'étage du cœur (4) quand
    il est allumé ET que la zone n'est pas éteinte */
export function rangDuLieu(p: { lat: number; lng: number }, zones: ZonePesee[]): number {
  const cadran = poidsDuLieu(p, zones)
  if (cadran === 0) return 0
  const aimee = zones.some((z) => z.coeur && z.poids > 0 && dansLaZone(p, z.points))
  return aimee ? 4 : cadran
}

/** retire les lieux tombés dans un « jamais » (0) — appliqué en permanence */
export function ecarterLesJamais<T extends { lat: number; lng: number }>(
  lieux: T[],
  zones: ZonePesee[],
): T[] {
  const jamais = zones.filter((z) => z.poids === 0)
  if (!jamais.length) return lieux
  return lieux.filter((l) => !jamais.some((z) => dansLaZone(l, z.points)))
}

/** l'ordre du soir : on écarte les « jamais », puis les autres penchent —
    SANS casser l'ordre d'origine à poids égal (le tri est stable : la
    distance et l'ouverture continuent de décider en dessous) */
export function classerParZones<T extends { lat: number; lng: number }>(
  lieux: T[],
  zones: ZonePesee[],
): T[] {
  return ecarterLesJamais(lieux, zones)
    .map((l, i) => ({ l, i, p: rangDuLieu(l, zones) }))
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .map((x) => x.l)
}

/** restreindre à UNE zone — « ce soir près du taf », allumé à la demande */
export function filtrerParZones<T extends { lat: number; lng: number }>(
  lieux: T[],
  zones: ZonePesee[],
  dans?: Pick<Quartier, 'points'>,
): T[] {
  const restants = classerParZones(lieux, zones)
  return dans ? lieuxDeLaZone(restants, dans.points) : restants
}

// ── le partage au super cercle (Ersan, 13/08 : « peut-être qu'on partagera
// nos quartiers avec nos amis… mais c'est 10 max, dans le super cercle ») ─
// Ce que ça change par rapport à l'interdit que j'avais écrit : dix
// personnes choisies une par une, ce n'est pas une publication, c'est une
// conversation — dire « évite ce coin » à ses potes, tout le monde le fait.
// Ce qui reste interdit et ne bougera pas : au-delà de l'anneau (aucun
// public, aucun inconnu), et TOUTE AGRÉGATION entre utilisateurs — jamais
// de carte de chaleur, jamais de « 4 personnes évitent ce quartier ».
export const CAP_SUPER_CERCLE = 10

/** une zone reçue d'un pote n'est JAMAIS un filtre : c'est une proposition.
    Tant qu'elle n'est pas acceptée, elle ne pèse sur rien — sinon le
    jugement d'un ami retirerait des lieux de ta vie sans que tu le saches. */
export interface ZoneRecue extends Pick<Quartier, 'nom' | 'poids' | 'points' | 'encre'> {
  de: string
  acceptee: boolean
}

/** les zones qui pèsent vraiment : les miennes + celles que J'AI acceptées */
export function zonesActives(
  miennes: ZonePesee[],
  recues: (ZoneRecue & ZonePesee)[] = [],
): ZonePesee[] {
  return [...miennes, ...recues.filter((z) => z.acceptee)]
}

/** dans quelles zones tombe ce point — pour dire « tu es dans : le taf » */
export function zonesQuiContiennent<T extends Pick<Quartier, 'points'>>(
  p: { lat: number; lng: number },
  zones: T[],
): T[] {
  return zones.filter((z) => dansLaZone(p, z.points))
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
