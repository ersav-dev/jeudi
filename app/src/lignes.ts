// les tracés de lignes : quand on touche une station, sa ou ses lignes se
// dessinent sur la carte, et ses bouches de métro apparaissent.
//
// La géométrie est la VRAIE (les voies telles qu'elles courent sous Paris),
// simplifiée à ~6 m : 9 200 points pour 69 tracés, 204 ko. La version
// « stations reliées à la règle » a été essayée d'abord — trop schématique
// une fois posée sur les vraies rues.
//
// ⚠ 10/08 — CE COMMENTAIRE DISAIT L'INVERSE DE LA VÉRITÉ, et je l'avais écrit.
// Il affirmait qu'OSM était « plus terne » et que la vraie teinte du métro 1
// était #FFCE00. Vérification faite à LA source — le « référentiel des lignes »
// d'Île-de-France Mobilités en open data, champ `colourweb_hexa`, celui qui
// fait la signalétique officielle — le métro 1 est bel et bien **#FFBE00** et
// la 3 **#6E6E00**. C'était OSM qui avait raison. Les valeurs précédentes
// venaient de la palette qu'on trouve sur Wikipédia (dite « charte 2016 »),
// que j'avais crue meilleure sans la vérifier.
// Les 30 lignes ont été réécrites depuis le référentiel le 10/08.
// À réactualiser d'un coup :
//   data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/
//   referentiel-des-lignes/records?where=transportmode in ("metro","tram","rail")
//
// Le métro 15 a été RETIRÉ : le référentiel le donne « prochainement active »
// au 23/09/2027, avec un gris d'attente (#AAAAAA) faute de teinte publiée. Le
// tracer aujourd'hui, c'était promettre un métro qui n'existe pas — la même
// faute que les arrêts de bus de jour affichés la nuit. Il reviendra à son
// ouverture. Conséquence assumée : Bécon-les-Bruyères, Le Val d'Or,
// Bois-Colombes et Saint-Cloud n'ont plus de ligne à allumer et redeviennent
// inertes (elles rejoignent les 45 autres déjà dans ce cas).
//
// Géométrie OSM figée le 2026-08-08 · couleurs IDFM du 2026-08-10.
import type { FeatureCollection, MultiLineString, Point } from 'geojson'

export type Ligne = {
  id: string
  ref: string
  mode: 'metro' | 'rer' | 'tram'
  couleur: string
  stations: string[]
  brins: [number, number][][]
}

// le sens de passage d'un accès : 's' on ne peut que sortir · 'e' on ne peut
// qu'entrer · absent = les deux, le cas courant.
//
// Ce champ vient du référentiel IDFM, pas d'OSM. La différence est décisive :
// dans OSM l'absence de tag est muette (« les deux » ou « personne n'a
// renseigné » ?), alors qu'IDFM remplit accisentry ET accisexit sur les 2 522
// accès. « Les deux » y est une affirmation. C'est ce qui permet de dessiner
// une flèche sans mentir. 129 accès ne sont que des sorties, 11 que des entrées.
export type SensAcces = 's' | 'e'
export type Bouche = {
  p: [number, number]
  r: string | null
  n: string | null
  d: number
  s?: SensAcces
}

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
export const SOURCE_ARRETS = 'lignes-arrets'
export const LAYER_ARRETS = 'lignes-arrets-pastilles'

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

// ── LES POINTS DE QUAI (08/08) ────────────────────────────────────────────
// Un trait sans arrêts n'est qu'un fil : il dit par où ça passe, jamais où ça
// s'arrête. On repose donc sur le tracé la grammaire du plan de métro — une
// pastille d'encre cerclée de la couleur de la ligne à chaque station.
//
// Le hic : Ligne.stations ne porte que des NOMS. Les coordonnées vivent dans
// transport.json, indexé par nom lui aussi. Il faut donc marier deux
// référentiels OSM qui n'écrivent pas pareil (« Gare du Nord » d'un côté,
// « Gare du Nord (Métro) » de l'autre).

export type PropsArret = {
  couleur: string
  /** 1 = un arrêt de la ligne · 1,6 = LA station qu'on vient de toucher */
  ech: number
}

export const AUCUN_ARRET: FeatureCollection<Point, PropsArret> = {
  type: 'FeatureCollection',
  features: [],
}

// la clé du repli : on efface tout ce qui distingue deux graphies d'un même
// quai — la parenthèse de désambiguïsation (« (Métro) », « (RER) »), les
// accents, la casse, les tirets et les espaces. « Saint-Denis - Université »
// et « Saint-Denis-Université » tombent alors sur la même clé.
export const clefStation = (nom: string): string =>
  nom
    .replace(/\([^)]*\)/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

export type IndexStations = {
  exact: Map<string, [number, number]>
  souple: Map<string, [number, number]>
}

// premier arrivé, premier servi : transport.json est déjà dédupliqué par nom,
// et quand deux graphies se rabattent sur la même clé souple (rare), on garde
// la première — mieux vaut un quai approché que pas de quai.
export const indexerStations = (
  stations: { nom: string; p: [number, number] }[],
): IndexStations => {
  const exact = new Map<string, [number, number]>()
  const souple = new Map<string, [number, number]>()
  for (const s of stations) {
    if (!exact.has(s.nom)) exact.set(s.nom, s.p)
    const k = clefStation(s.nom)
    if (k && !souple.has(k)) souple.set(k, s.p)
  }
  return { exact, souple }
}

// le nom exact d'abord — c'est le cas des neuf dixièmes du métro — puis la
// clé souple. null quand on ne sait pas situer : on n'invente pas un quai.
export const situerStation = (
  nom: string,
  index: IndexStations,
): [number, number] | null => index.exact.get(nom) ?? index.souple.get(clefStation(nom)) ?? null

// les pastilles à poser pour les lignes allumées. Une station desservie par
// DEUX lignes allumées n'est dessinée qu'une fois (la première couleur
// gagne) : sur le terrain c'est un seul quai, deux pastilles superposées ne
// feraient qu'une bouillie de contours.
export const arretsPour = (
  ids: string[] | undefined,
  toutes: Map<string, Ligne> | null,
  index: IndexStations | null,
  touchee: string | null,
): FeatureCollection<Point, PropsArret> => {
  if (!ids?.length || !toutes || !index) return AUCUN_ARRET
  const cleTouchee = touchee ? clefStation(touchee) : null
  const vues = new Set<string>()
  const features = []
  for (const id of ids) {
    const l = toutes.get(id)
    if (!l) continue
    for (const nom of l.stations) {
      const k = clefStation(nom)
      if (!k || vues.has(k)) continue
      const p = situerStation(nom, index)
      if (!p) continue
      vues.add(k)
      features.push({
        type: 'Feature' as const,
        properties: { couleur: l.couleur, ech: k === cleTouchee ? 1.6 : 1 },
        geometry: { type: 'Point' as const, coordinates: p },
      })
    }
  }
  return { type: 'FeatureCollection', features }
}

// l'audit des trous, tiré UNE FOIS en console au chargement. Ce n'est pas de
// la mise au point : c'est la mesure d'une limite connue. transport.json
// s'arrête à la petite couronne, alors que les branches de RER listent leurs
// stations jusqu'à Dourdan et Melun — ces quais-là sont hors carte, et donc
// hors pastilles. Le métro, lui, doit rester près de zéro.
export const stationsIntrouvables = (
  toutes: Map<string, Ligne>,
  index: IndexStations,
): { ref: string; mode: Ligne['mode']; total: number; perdues: number }[] => {
  const bilan: { ref: string; mode: Ligne['mode']; total: number; perdues: number }[] = []
  for (const l of toutes.values()) {
    let perdues = 0
    for (const nom of l.stations) if (!situerStation(nom, index)) perdues++
    if (perdues) bilan.push({ ref: l.ref, mode: l.mode, total: l.stations.length, perdues })
  }
  return bilan.sort((a, b) => b.perdues / b.total - a.perdues / a.total)
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
  sens?: SensAcces
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
      // le sens reste sur CHAQUE escalier : deux accès d'une même sortie
      // peuvent très bien ne pas se franchir dans le même sens
      ...(b.s ? { sens: b.s } : {}),
    })
  }
  return sorties
}
