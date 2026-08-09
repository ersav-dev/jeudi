// ════════════════════════════════════════════════════════════════
// jeudi. — LE MÊME LIEU DEUX FOIS (09/08/2026)
//
// Ersan, sur la vraie carte : « Harry's Bar est double… vire les trucs
// du genre aussi ! »
//
// LA CAUSE. Le fond du carnet a été versé dans le cloud par
// supabase/imports/2026-08-01_import_ersan_v2_tout.sql, qui empile trois
// sources (les 81 spots Google d'Ersan + 129 curated + 96 extra) et se
// dédoublonne « par nom » — c'est-à-dire par nom EXACT. Deux fiches du
// même bar qui ne s'écrivent pas pareil passent donc toutes les deux :
//   « Harry's Bar Paris » (Google, 48.8692089 / 2.3321714)
//   « Harry's New York Bar » (curated, 48.8692491 / 2.3321281)  → 5 m
//   « Péniche Antipode » / « Peniche Antipode »                 → 0 m
//   « Bisou. » / « Bisou », « La Cité Fertile » / « La Cite Fertile »…
// La pose des marqueurs (Carte.tsx) n'y est pour rien : elle indexe par
// id, et deux fiches distinctes ont bien deux ids distincts. Le doublon
// est dans la DONNÉE, et cette donnée vit dans le cloud — on ne peut
// donc pas la corriger « à la source » depuis l'app. On la corrige donc
// À LA LECTURE, ce qui protège en prime les doublons que l'utilisateur
// se fabrique lui-même (import Google puis ajout manuel du même bar,
// adoption d'un spot du cercle qu'on avait déjà…).
//
// LA RÈGLE, volontairement PRUDENTE. Fusionner à tort est bien pire que
// laisser un doublon : sur les quais, des péniches différentes partagent
// la même adresse géocodée (La Dame de Canton, le Bateau Phare, Nix Nox
// et PLAT/FORM sont à 0 m les unes des autres), et Septime / Clamato
// sont deux restaurants voisins. « Proche » ne suffit donc jamais : il
// faut AUSSI que les noms se répondent.
//   (A) même nom normalisé (sans casse, accents ni ponctuation) et
//       moins de 200 m — la distance garde-fou évite de fusionner les
//       deux Bouillon Chartier ou deux succursales d'une chaîne.
//   (B) moins de 15 m ET au moins un mot fort en commun (≥ 4 lettres,
//       hors mots passe-partout « paris », « bar », « club »…) — c'est
//       ce qui attrape Harry's, « Kodawari Ramen (Yokochō) » vs
//       « Kodawari Ramen », « Club Coca-Cola - Quai de la Photo » vs
//       « Quai de la Photo ». À 15 m, deux voisins de palier restent
//       deux lieux (Septime / Septime La Cave sont à 38 m).
//
// QUI GAGNE. Dans l'ordre, et c'est explicite parce que c'est un choix :
//   1. le rang donné par l'appelant — LE LIEU DE L'UTILISATEUR BAT LE
//      FOND ÉDITORIAL. Ma fiche porte ma note, mes photos, mon tampon ;
//      le fond, lui, est remplaçable.
//   2. à rang égal, la fiche la plus RICHE (photos, tip, voix du cercle,
//      description) — on ne jette pas du contenu.
//   3. puis la plus ANCIENNE : c'est elle que les favoris, les sorties
//      et les comparaisons pointent déjà.
//   4. puis le nom le mieux écrit (« Péniche Antipode » et pas
//      « Peniche Antipode ») — le fond a été versé d'un bloc, donc à
//      cette étape les deux fiches ont souvent le même âge.
//   5. puis l'id, pour que le résultat soit le même à chaque lecture.
// ════════════════════════════════════════════════════════════════

/** le strict minimum pour juger d'un doublon — volontairement pas `Lieu`,
 *  pour que ce module reste pur et testable sans la base */
export interface LieuComparable {
  id: string
  nom: string
  lat: number
  lng: number
  note?: string
  description?: string
  photos?: readonly unknown[]
  tipsCercle?: readonly unknown[]
  creeLe?: string
}

/** même nom écrit pareil → jusqu'à 200 m, c'est le même lieu (au-delà,
 *  c'est une seconde adresse d'une même enseigne : deux lieux) */
export const SEUIL_MEME_NOM_M = 200
/** noms seulement « parents » → il faut être quasiment au même point */
export const SEUIL_VOISIN_M = 15

/** mots qui ne disent rien de l'identité d'un lieu : deux fiches qui ne
 *  partagent que « paris » ou « bar » ne parlent pas du même endroit */
const MOTS_PASSE_PARTOUT = new Set([
  'paris', 'bar', 'club', 'cafe', 'restaurant', 'resto', 'brasserie',
  'bistro', 'bistrot', 'chez', 'maison', 'grand', 'grande', 'petit',
  'petite', 'nouveau', 'nouvelle', 'france', 'french', 'house',
])

/** minuscules, sans accents, sans ponctuation, espaces normalisés */
export function normaliserNom(nom: string): string {
  return nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** les mots qui portent vraiment le nom (≥ 4 lettres, pas passe-partout) */
function motsForts(nomNormalise: string): Set<string> {
  const forts = new Set<string>()
  for (const mot of nomNormalise.split(' ')) {
    if (mot.length >= 4 && !MOTS_PASSE_PARTOUT.has(mot)) forts.add(mot)
  }
  return forts
}

/** haversine en mètres — recopié ici (et pas importé de db.ts) pour que ce
 *  module ne dépende de rien : db.ts l'importe, l'inverse ferait un cycle */
export function distanceEntre(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** les deux fiches désignent-elles le même endroit ? (règles A et B) */
export function memeLieu(a: LieuComparable, b: LieuComparable): boolean {
  const d = distanceEntre(a, b)
  if (d > SEUIL_MEME_NOM_M) return false
  const na = normaliserNom(a.nom)
  const nb = normaliserNom(b.nom)
  if (!na || !nb) return false
  // (A) le nom est le même, à l'accent et à la ponctuation près
  if (na === nb) return true
  // (B) presque au même point + un mot fort partagé
  if (d > SEUIL_VOISIN_M) return false
  const fortsA = motsForts(na)
  for (const mot of motsForts(nb)) if (fortsA.has(mot)) return true
  return false
}

/** ce que la fiche apporte : on ne jette jamais la plus fournie */
function richesse(l: LieuComparable): number {
  return (
    (l.photos?.length ?? 0) * 3 +
    (l.tipsCercle?.length ?? 0) * 2 +
    (l.note ? 2 : 0) +
    (l.description ? 1 : 0)
  )
}

/** > 0 si `a` doit l'emporter sur `b` */
function gagne<T extends LieuComparable>(a: T, b: T, rang: (l: T) => number): boolean {
  const ra = rang(a)
  const rb = rang(b)
  if (ra !== rb) return ra > rb
  const qa = richesse(a)
  const qb = richesse(b)
  if (qa !== qb) return qa > qb
  const ca = a.creeLe ?? ''
  const cb = b.creeLe ?? ''
  if (ca !== cb) return ca < cb // la plus ancienne : c'est elle qu'on référence déjà
  // même âge (le fond a été versé d'un bloc) : on garde le nom le mieux
  // écrit — « Péniche Antipode » plutôt que « Peniche Antipode »
  const aa = accents(a.nom)
  const ab = accents(b.nom)
  if (aa !== ab) return aa > ab
  return a.id < b.id
}

/** combien de lettres accentuées porte ce nom (qualité de la saisie) */
function accents(nom: string): number {
  return nom.normalize('NFD').match(/[\u0300-\u036f]/g)?.length ?? 0
}

// une grille de ~0.003° : la maille dépasse 200 m en lat comme en lng à
// Paris, donc deux doublons tombent forcément dans des cases voisines.
// Sans elle, une lecture de quelques milliers de lieux ferait des
// millions de haversines à chaque rafraîchissement de la carte.
const MAILLE = 0.003
const cle = (lat: number, lng: number) =>
  `${Math.floor(lat / MAILLE)}:${Math.floor(lng / MAILLE)}`

/**
 * Retire les fiches qui désignent le même lieu, en gardant la meilleure
 * de chaque grappe. L'ordre des survivants est celui de l'entrée.
 * @param rang priorité de l'appelant (plus grand = gagne) : mes spots
 *             devant ceux du cercle, devant le fond éditorial.
 */
export function dedoublonner<T extends LieuComparable>(
  lieux: readonly T[],
  rang: (l: T) => number = () => 0,
): T[] {
  if (lieux.length < 2) return [...lieux]
  // index spatial : case → indices
  const cases = new Map<string, number[]>()
  lieux.forEach((l, i) => {
    const k = cle(l.lat, l.lng)
    const c = cases.get(k)
    if (c) c.push(i)
    else cases.set(k, [i])
  })
  // union-find : les fiches du même lieu forment une grappe, quel que
  // soit l'ordre d'arrivée (A≈B et B≈C ⇒ une seule grappe)
  const parent = lieux.map((_, i) => i)
  const racine = (i: number): number => {
    let r = i
    while (parent[r] !== r) r = parent[r]
    while (parent[i] !== r) [i, parent[i]] = [parent[i], r]
    return r
  }
  for (let i = 0; i < lieux.length; i++) {
    const li = lieux[i]
    const cx = Math.floor(li.lat / MAILLE)
    const cy = Math.floor(li.lng / MAILLE)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const j of cases.get(`${cx + dx}:${cy + dy}`) ?? []) {
          if (j <= i) continue // chaque paire une seule fois
          if (racine(i) === racine(j)) continue
          if (memeLieu(li, lieux[j])) parent[racine(j)] = racine(i)
        }
      }
    }
  }
  // le champion de chaque grappe
  const champion = new Map<number, number>()
  lieux.forEach((l, i) => {
    const r = racine(i)
    const tenant = champion.get(r)
    if (tenant === undefined || gagne(l, lieux[tenant], rang)) champion.set(r, i)
  })
  const gardes = new Set(champion.values())
  return lieux.filter((_, i) => gardes.has(i))
}
