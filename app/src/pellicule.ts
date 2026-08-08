// ════════════════════════════════════════════════════════════════
// jeudi. — LA PELLICULE (le moteur PUR — CHANTIER_PELLICULE.md §1)
// La carte cesse d'être un plan de spots : chaque endroit où quelqu'un
// du cercle a shooté récemment porte un TAS de polaroids — plus c'est
// frais, plus le tas est grand ; plus ça date, plus il fond, jusqu'au
// petit tirage souvenir sépia qui ne disparaît jamais.
// Ici : zéro DOM, zéro réseau — que des règles, toutes testées.
// ════════════════════════════════════════════════════════════════
import type { Lieu, PhotoLieu } from './db'

// ── les bornes de la fraîcheur (heures) — échelle modulaire ~1,33 ──
export const BORNES_TAILLE = { chaud: 6, tiede: 24, vivant: 48 } as const

/** une photo qui participe à la pellicule : un TIRAGE DU SOIR (type
 *  'soir'), daté ET déjà « sec ». Les preuves de l'album (porte, salle…)
 *  documentent le lieu — elles ne font pas vivre la carte, et le backfill
 *  de la 0010 les a toutes datées « anciennes » : sans ce filtre, 300
 *  spots porteraient un tas sépia. */
export function photosPellicule(l: Lieu, maintenant: Date): PhotoLieu[] {
  const t = maintenant.getTime()
  return (l.photos ?? [])
    .filter((p) => {
      if (p.type !== 'soir') return false
      if (!p.priseLe) return false
      const prise = new Date(p.priseLe).getTime()
      if (Number.isNaN(prise) || prise > t) return false
      // la publication différée : la photo « sèche » avant d'apparaître
      if (p.visibleLe && new Date(p.visibleLe).getTime() > t) return false
      return true
    })
    .sort((a, b) => new Date(b.priseLe!).getTime() - new Date(a.priseLe!).getTime())
}

export interface Tas {
  lieu: Lieu
  /** les photos, la plus récente d'abord */
  photos: PhotoLieu[]
  /** l'âge de la photo la plus récente, en heures */
  fraicheurH: number
  /** les photos encore vivantes (≤ 48 h) — l'épaisseur de l'éventail */
  vivantes: number
  /** l'id de l'auteur de la photo du dessus (le prénom se résout à l'écran) */
  auteurId?: string
  /** la soirée de la photo du dessus (YYYY-MM-DD) — la clé du sceau */
  soiree: string
}

/** regroupe les lieux qui ont des photos datées en TAS, triés du plus
 *  frais au plus ancien (l'ordre de naissance ET l'axe ↑↓ du carrousel) */
export function construireTas(lieux: Lieu[], maintenant: Date): Tas[] {
  const tas: Tas[] = []
  for (const lieu of lieux) {
    const photos = photosPellicule(lieu, maintenant)
    if (!photos.length) continue
    const fraicheurH = (maintenant.getTime() - new Date(photos[0].priseLe!).getTime()) / 3600000
    tas.push({
      lieu,
      photos,
      fraicheurH,
      vivantes: photos.filter(
        (p) => (maintenant.getTime() - new Date(p.priseLe!).getTime()) / 3600000 <= BORNES_TAILLE.vivant,
      ).length,
      auteurId: photos[0].auteurId,
      soiree: soireeDe(photos[0].priseLe!),
    })
  }
  return tas.sort((a, b) => a.fraicheurH - b.fraicheurH)
}

/** la taille du polaroid du dessus — la fraîcheur se voit de loin */
export function taillePolaroid(fraicheurH: number): 80 | 60 | 45 | 34 {
  if (fraicheurH <= BORNES_TAILLE.chaud) return 80
  if (fraicheurH <= BORNES_TAILLE.tiede) return 60
  if (fraicheurH <= BORNES_TAILLE.vivant) return 45
  return 34
}

/** une photo de moins d'1 h n'est pas encore sèche : elle arrive laiteuse
 *  et se révèle en 3,2 s (§1.7) — et sa légende le dit */
export function enDeveloppement(fraicheurH: number): boolean {
  return fraicheurH < 1
}

/** l'heure au crayon sous le tas : un FAIT, jamais un compteur */
export function libelleAge(fraicheurH: number): string {
  // §1.7 : tant que ça se développe, on ne donne pas d'heure — on donne l'état
  if (enDeveloppement(fraicheurH)) return 'ça se développe…'
  if (fraicheurH < 24) return `il y a ${Math.round(fraicheurH)}h`
  if (fraicheurH < 48) return 'hier'
  return `il y a ${Math.round(fraicheurH / 24)}j`
}

/** la NUIT à laquelle appartient un instant : une photo de 2 h du matin
 *  appartient à la soirée de la VEILLE (règle des 6 h, comme le tirage) */
export function soireeDe(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 6 * 3600000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** la clé d'une vue : (lieu, soirée) — UN sceau par soirée, pas par photo */
export function cleVue(lieuId: string, soiree: string): string {
  return `${lieuId}|${soiree}`
}

/** le sceau est-il déjà brisé ? (le tas a été OUVERT cette soirée-là) */
export function estVu(tas: Tas, vues: ReadonlySet<string>): boolean {
  return vues.has(cleVue(tas.lieu.id, tas.soiree))
}

/** la photo est-elle un souvenir (au-delà de 48 h) ? — sépia, 34 px,
 *  et il ne disparaît jamais : la carte a toujours une mémoire */
export function estSouvenir(fraicheurH: number): boolean {
  return fraicheurH > BORNES_TAILLE.vivant
}

// ── les structures PRÊTES À L'ÉCRAN (résolues par App, peintes par
// Carte/Pellicule — aucune logique dedans, que des valeurs) ────────
export interface TasAffiche {
  lieuId: string
  /** les sources d'image, la photo du dessus d'abord (max 4) */
  srcs: string[]
  vivantes: number
  taille: 80 | 60 | 45 | 34
  /** « il y a 2h » — l'heure au crayon, un fait */
  age: string
  /** le prénom sur l'étiquette (« toi » pour soi) */
  prenom: string
  /** le sceau est-il brisé ? (cire → crayon) */
  vu: boolean
  souvenir: boolean
  /** l'âge brut : le z-order de la carte et le regroupement en grappes */
  fraicheurH: number
  /** moins d'1 h : la photo du dessus se révèle encore (§1.7) */
  developpe: boolean
}

// ════════════════════════════════════════════════════════════════
// LES SOIRS DU CERCLE (CHANTIER_PELLICULE §7) — la même donnée, lue
// HUMAINEMENT au lieu de spatialement. Une entrée = le RÉSULTAT d'une
// soirée, pas un post : on ne peut pas publier sans être sorti.
// Non-feed, tel quel : ça FINIT · zéro compteur, zéro like · 7 jours
// chronologiques, aucun algorithme · le « bof » a la même place que le
// « validé ». Aucun second pipeline : tout part de construireTas.
// ════════════════════════════════════════════════════════════════

/** la fenêtre du carnet : une semaine, pas un jour de plus */
export const CARNET_JOURS = 7

/** une entrée du carnet : UN LIEU, UNE NUIT — le résultat d'une soirée */
export interface SoireeCarnet {
  lieu: Lieu
  /** la nuit (YYYY-MM-DD) — la même clé que le sceau de la carte */
  soiree: string
  /** les tirages de CETTE nuit, le plus récent d'abord */
  photos: PhotoLieu[]
  /** l'âge du tirage le plus récent de la nuit, en heures */
  fraicheurH: number
  auteurId?: string
  /** le verdict tamponné à la sortie — « bof » est du signal, pas un vide */
  verdict?: 'valide' | 'bof'
}

/** les soirées des 7 derniers jours, la plus récente d'abord.
 *  Le tas est PAR LIEU (la carte) ; le carnet est PAR NUIT — on redécoupe
 *  les mêmes photos, on n'en va pas chercher d'autres. */
export function construireCarnet(
  lieux: Lieu[],
  maintenant: Date,
  jours: number = CARNET_JOURS,
): SoireeCarnet[] {
  const entrees: SoireeCarnet[] = []
  for (const tas of construireTas(lieux, maintenant)) {
    const parNuit = new Map<string, PhotoLieu[]>()
    for (const p of tas.photos) {
      // tas.photos est déjà trié du plus récent au plus ancien : chaque
      // seau hérite de ce tri, photos[0] est bien le dernier tirage
      const nuit = soireeDe(p.priseLe!)
      const seau = parNuit.get(nuit)
      if (seau) seau.push(p)
      else parNuit.set(nuit, [p])
    }
    for (const [soiree, photos] of parNuit) {
      const fraicheurH = (maintenant.getTime() - new Date(photos[0].priseLe!).getTime()) / 3600000
      if (fraicheurH > jours * 24) continue
      entrees.push({
        lieu: tas.lieu,
        soiree,
        photos,
        fraicheurH,
        auteurId: photos[0].auteurId,
        verdict: tas.lieu.tampon?.v,
      })
    }
  }
  // chronologique pur : la dernière nuit en haut. Rien d'autre ne décide.
  return entrees.sort((a, b) => a.fraicheurH - b.fraicheurH)
}

const JOURS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

/** l'intertitre au crayon entre deux nuits : « ce soir », « hier soir »,
 *  « samedi » — jamais une date froide tant qu'on est dans la semaine */
export function libelleNuit(soiree: string, maintenant: Date): string {
  const [a, m, j] = soiree.split('-').map(Number)
  const nuit = new Date(a, m - 1, j)
  const [ha, hm, hj] = soireeDe(maintenant.toISOString()).split('-').map(Number)
  const ecart = Math.round((new Date(ha, hm - 1, hj).getTime() - nuit.getTime()) / 86400000)
  if (ecart <= 0) return 'ce soir'
  if (ecart === 1) return 'hier soir'
  if (ecart < 7) return JOURS_FR[nuit.getDay()]
  return `le ${String(j).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

/** une nuit du carnet : le titre, puis ses soirées */
export interface NuitCarnet {
  soiree: string
  libelle: string
  entrees: SoireeCarnet[]
}

/** regroupe les entrées par nuit, en conservant l'ordre chronologique */
export function parNuits(entrees: SoireeCarnet[], maintenant: Date): NuitCarnet[] {
  const nuits: NuitCarnet[] = []
  for (const e of entrees) {
    const derniere = nuits[nuits.length - 1]
    if (derniere && derniere.soiree === e.soiree) derniere.entrees.push(e)
    else nuits.push({ soiree: e.soiree, libelle: libelleNuit(e.soiree, maintenant), entrees: [e] })
  }
  return nuits
}

/** le tip manuscrit de CELUI qui y est allé : sa voix cloud s'il en a une
 *  sur ce spot, sinon la note du spot (le cas du proprio) */
export function tipDeLaSoiree(lieu: Lieu, auteurId?: string): string {
  const sien = auteurId ? lieu.tipsCercle?.find((t) => t.auteurId === auteurId)?.note : undefined
  return (sien ?? lieu.note ?? '').trim()
}

export interface DiapoPellicule {
  src: string
  age: string
  prenom: string
}

/** une entrée PRÊTE À L'ÉCRAN (App résout prénoms et sources, le carnet peint) */
export interface EntreeAffichee {
  cle: string
  lieuId: string
  nom: string
  /** « il y a 2h » — un fait, jamais un compteur */
  age: string
  prenom: string
  verdict?: 'valide' | 'bof'
  tip: string
  /** la bande de tirages de la soirée */
  srcs: string[]
}

export interface NuitAffichee {
  soiree: string
  libelle: string
  entrees: EntreeAffichee[]
}

/** une soirée du carrousel : l'axe ↑↓ traverse cette liste */
export interface SoireePellicule {
  lieuId: string
  nom: string
  lat: number
  lng: number
  soiree: string
  diapos: DiapoPellicule[]
}

// ════════════════════════════════════════════════════════════════
// §1.9 · LA LIGNE-BOUSSOLE — une boussole, jamais un compteur
// Elle ne parle QUE de ce qu'on ne peut pas voir : hors écran, ou pas
// encore lu. Elle NOMME une chose plutôt que de compter des gens —
// « karim y est encore » serait de la surveillance, et « 3 potes sont
// sortis » répète ce que la carte montre déjà.
// ════════════════════════════════════════════════════════════════

export type Cardinal = 'nord' | 'sud' | 'est' | 'ouest'

export interface PointGeo {
  lng: number
  lat: number
}

/** la direction d'un point vu du centre de la carte. Le δ de longitude est
 *  corrigé de la latitude : à Paris, un degré est ~⅔ d'un degré de latitude —
 *  sans ça la boussole dirait « à l'est » pour un spot au nord-est. */
export function directionCardinale(centre: PointGeo, vers: PointGeo): Cardinal {
  const dx = (vers.lng - centre.lng) * Math.cos((centre.lat * Math.PI) / 180)
  const dy = vers.lat - centre.lat
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'est' : 'ouest'
  return dy > 0 ? 'nord' : 'sud'
}

/** un tas, tel que la boussole a besoin de le connaître */
export interface CandidatBoussole extends PointGeo {
  lieuId: string
  nom: string
  prenom: string
  vu: boolean
  fraicheurH: number
  /** dans le cadre actuel de la carte ? */
  aLEcran: boolean
}

export type LigneBoussole =
  /** des tirages non lus HORS de l'écran : on donne le cap, la carte y va */
  | { genre: 'hors-ecran'; direction: Cardinal; n: number; cible: PointGeo }
  /** tout est à l'écran mais pas tout lu : on nomme UNE chose */
  | { genre: 'nomme'; prenom: string; nom: string; cible: PointGeo }
  /** la fin — et une invitation, jamais un constat */
  | { genre: 'tout-lu' }

const plusFrais = (l: CandidatBoussole[]): CandidatBoussole =>
  l.reduce((a, b) => (b.fraicheurH < a.fraicheurH ? b : a))

/** la ligne du bas de la carte. `null` = la pellicule est vide : c'est
 *  l'invitation de §1.8 qui parle, la boussole se tait. */
export function ligneBoussole(
  candidats: readonly CandidatBoussole[],
  centre: PointGeo,
): LigneBoussole | null {
  if (!candidats.length) return null
  const pasVus = candidats.filter((c) => !c.vu)
  if (!pasVus.length) return { genre: 'tout-lu' }

  // ce qu'on NE PEUT PAS voir d'abord : le hors-champ est la seule chose que
  // la carte ne montre pas
  const dehors = pasVus.filter((c) => !c.aLEcran)
  if (dehors.length) {
    const paquets = new Map<Cardinal, CandidatBoussole[]>()
    for (const c of dehors) {
      const d = directionCardinale(centre, c)
      const p = paquets.get(d)
      if (p) p.push(c)
      else paquets.set(d, [c])
    }
    let meilleur: [Cardinal, CandidatBoussole[]] | null = null
    for (const paquet of paquets) {
      if (
        !meilleur ||
        paquet[1].length > meilleur[1].length ||
        (paquet[1].length === meilleur[1].length &&
          plusFrais(paquet[1]).fraicheurH < plusFrais(meilleur[1]).fraicheurH)
      ) {
        meilleur = paquet
      }
    }
    const [direction, lot] = meilleur!
    const tete = plusFrais(lot)
    return { genre: 'hors-ecran', direction, n: lot.length, cible: { lng: tete.lng, lat: tete.lat } }
  }

  // tout est sous les yeux : on nomme le plus frais non lu — une CHOSE
  // laissée quelque part, pas quelqu'un qui « y est encore »
  const c = plusFrais(pasVus)
  return { genre: 'nomme', prenom: c.prenom, nom: c.nom, cible: { lng: c.lng, lat: c.lat } }
}

const MOTS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf']

/** « deux tirages », pas « 2 tirages » : la ligne est écrite à la main */
export function nombreEnMots(n: number): string {
  return MOTS[n] ?? String(n)
}

/** « le perchoir » → « au perchoir » : on écrit du français, pas un gabarit */
export function aLieu(nom: string): string {
  const n = nom.trim()
  const b = n.toLowerCase()
  if (b.startsWith('les ')) return `aux ${n.slice(4)}`
  if (b.startsWith('le ')) return `au ${n.slice(3)}`
  if (b.startsWith('la ')) return `à la ${n.slice(3)}`
  return `à ${n}`
}

const PREPOSITION: Record<Cardinal, string> = {
  nord: 'au nord',
  sud: 'au sud',
  est: 'à l’est',
  ouest: 'à l’ouest',
}

/** la ligne, écrite. `tr` traduit les fragments invariants (langue.ts) —
 *  les noms de lieux et les prénoms, eux, ne se traduisent jamais. */
export function texteBoussole(b: LigneBoussole, tr: (s: string) => string = (s) => s): string {
  if (b.genre === 'tout-lu') return tr('tout est lu. à toi d’écrire la suite.')
  if (b.genre === 'nomme') {
    return `${b.prenom} ${tr('a laissé quelque chose')} ${aLieu(b.nom)}.`
  }
  const quoi =
    b.n > 1
      ? `${tr(nombreEnMots(b.n))} ${tr('tirages que tu n’as pas vus')}`
      : tr('un tirage que tu n’as pas vu')
  return `${tr(PREPOSITION[b.direction])}, ${quoi} →`
}

// ════════════════════════════════════════════════════════════════
// §5.2 · LE CLUSTERING DES TAS — Oberkampf un samedi, c'est 15 tas
// superposés. Deux tas qui se chevauchent fusionnent en un tas commun
// (« 3 spots ici » au crayon) ; le tap les déploie en éventail.
// Z-order = fraîcheur décroissante : le plus chaud passe devant.
// ════════════════════════════════════════════════════════════════

/** la hauteur du bloc prénom/heure sous le tas — il fait partie de
 *  l'encombrement : deux blocs qui se marchent dessus sont illisibles */
export const HAUTEUR_BLOC = 34

/** un tas projeté à l'écran. (x, y) = l'épingle graphite, donc le BAS du tas */
export interface PointTas {
  lieuId: string
  x: number
  y: number
  taille: number
  fraicheurH: number
}

/** une grappe : ses lieux du plus frais au plus ancien (le 1er est la
 *  MENEUSE — celle qui reste visible et porte « n spots ici ») */
export interface Grappe {
  lieux: string[]
  x: number
  y: number
}

const boite = (p: PointTas) => ({
  g: p.x - p.taille / 2,
  d: p.x + p.taille / 2,
  h: p.y - p.taille,
  b: p.y + HAUTEUR_BLOC,
})

/** regroupe les tas qui se chevauchent (transitivement : A touche B, B
 *  touche C → une seule grappe). n reste petit — seuls les tas POSÉS
 *  arrivent ici — donc le O(n²) est le bon compromis. */
export function grouperTas(points: readonly PointTas[]): Grappe[] {
  const tri = [...points].sort((a, b) => a.fraicheurH - b.fraicheurH)
  const pere = tri.map((_, i) => i)
  const trouver = (i: number): number => {
    while (pere[i] !== i) {
      pere[i] = pere[pere[i]]
      i = pere[i]
    }
    return i
  }
  const boites = tri.map(boite)
  for (let i = 0; i < tri.length; i++) {
    for (let j = i + 1; j < tri.length; j++) {
      const a = boites[i]
      const c = boites[j]
      if (a.d < c.g || c.d < a.g || a.b < c.h || c.b < a.h) continue
      const ri = trouver(i)
      const rj = trouver(j)
      // la racine reste le plus frais (l'ordre du tri) : la meneuse est stable
      if (ri !== rj) pere[Math.max(ri, rj)] = Math.min(ri, rj)
    }
  }
  const parRacine = new Map<number, Grappe>()
  for (let i = 0; i < tri.length; i++) {
    const r = trouver(i)
    const g = parRacine.get(r)
    if (g) g.lieux.push(tri[i].lieuId)
    else parRacine.set(r, { lieux: [tri[i].lieuId], x: tri[r].x, y: tri[r].y })
  }
  return [...parRacine.values()]
}

/** l'éventail du déploiement : où poser les n suiveuses autour de la
 *  meneuse (un arc vers le haut, qui s'ouvre avec le nombre) */
export function eventailGrappe(n: number, rayon = 58): { dx: number; dy: number }[] {
  if (n <= 0) return []
  if (n === 1) return [{ dx: 0, dy: -rayon }]
  const arc = Math.min(150, 46 * (n - 1))
  return Array.from({ length: n }, (_, i) => {
    const a = ((-arc / 2 + (arc * i) / (n - 1)) * Math.PI) / 180
    return { dx: Math.round(Math.sin(a) * rayon), dy: Math.round(-Math.cos(a) * rayon) }
  })
}

// ════════════════════════════════════════════════════════════════
// §5.3 · LA PERF — jamais 4 <img> × 300 tas. L'éventail est aplati en
// UNE image composite peinte offscreen (pelliculeComposite.ts) ;
// ici, la géométrie pure de cet aplatissement, et le plafond des
// miniatures : 2× la taille affichée, 168 px maximum.
// ════════════════════════════════════════════════════════════════

export const MINIATURE_MAX = 168

/** la résolution du bitmap d'un tas : net sur écran rétina, jamais plus */
export function tailleMiniature(taille: number): number {
  return Math.min(Math.round(taille * 2), MINIATURE_MAX)
}

/** la rotation des feuilles déborde du carré du tas : le composite est
 *  peint sur une toile élargie de 28 % de chaque côté */
export const MARGE_COMPOSITE = 0.28

/** une couche du composite — les valeurs SONT celles du CSS (.haut, .p1…) */
export interface CoucheTas {
  src: string
  /** degrés */
  rot: number
  /** translation, en fraction de la taille du tas (après rotation, comme CSS) */
  tx: number
  ty: number
}

const POSES: readonly Omit<CoucheTas, 'src'>[] = [
  { rot: 7, tx: 0.04, ty: -0.03 }, // .p1
  { rot: -9, tx: -0.05, ty: 0.02 }, // .p2
  { rot: 13, tx: 0.07, ty: 0.04 }, // .p3
]

/** les couches à peindre, DANS L'ORDRE DU PINCEAU : la feuille la plus
 *  lointaine d'abord, la photo du dessus en dernier. Les feuilles mortes
 *  (au-delà de 48 h) ne sont pas peintes du tout — elles sont déjà
 *  tombées, et c'est autant d'images qu'on ne charge pas. */
export function couchesComposite(srcs: readonly string[], vivantes: number): CoucheTas[] {
  const couches: CoucheTas[] = []
  for (let i = 3; i >= 1; i--) {
    if (!srcs[i] || i >= vivantes) continue
    couches.push({ src: srcs[i], ...POSES[i - 1] })
  }
  if (srcs[0]) couches.push({ src: srcs[0], rot: -2, tx: 0, ty: 0 })
  return couches
}

// ── l'invitation de la pellicule vide (§1.8) ──────────────────────────────
// « la ville se recharge — ce soir, c'est toi qui shootes. »
//
// Une invitation garde sa force si elle ne se répète pas. Elle ne paraît donc
// qu'UNE FOIS PAR JOUR, et s'efface d'elle-même après quelques secondes : elle
// a dit ce qu'elle avait à dire, et la carte est devenue trop dense (lignes de
// métro, bouches) pour porter une phrase en permanence.
//
// Elle disparaîtra pour de bon au premier tas — c'est le but.
const CLE_INVITE = 'jeudi-pellicule-invite'
/** combien de temps la phrase reste avant de s'effacer */
export const DUREE_INVITE_MS = 6000

/** le jour civil d'un instant, en AAAA-MM-JJ local (pas UTC : à 1 h du matin
 *  on est encore « hier soir » pour l'utilisateur, mais déjà demain en UTC) */
export function jourCivil(t: number = Date.now()): string {
  const d = new Date(t)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** l'invitation doit-elle paraître ? Non si la pellicule est pleine, non si
 *  elle a déjà été vue aujourd'hui. */
export function inviteAMontrer(pelliculeVide: boolean, dernierJour: string | null,
                               maintenant: number = Date.now()): boolean {
  if (!pelliculeVide) return false
  return dernierJour !== jourCivil(maintenant)
}

export function lireJourInvite(): string | null {
  try {
    return localStorage.getItem(CLE_INVITE)
  } catch {
    return null
  }
}

export function noterInviteVue(maintenant: number = Date.now()): void {
  try {
    localStorage.setItem(CLE_INVITE, jourCivil(maintenant))
  } catch {
    /* navigation privée : tant pis, elle reparaîtra */
  }
}
