import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// ── Le modèle de données de jeudi ──────────────────────────────
// La fondation : utilisateur → carnet → lieu (visibilité + envies).
// Local-first (IndexedDB) ; la sync cloud arrive avec le social.

// position "moi" par défaut tant que la vraie géoloc n'est pas dispo
// (bloquée en HTTP local) : Place Vendôme, Paris. Sert de point de
// référence pour la distance et le centrage de la carte.
export const MA_POSITION = { lat: 48.8675, lng: 2.3295 }

// position courante (live binding) : Place Vendôme par défaut, remplacée par la
// vraie géoloc dès qu'elle répond (contexte sécurisé : localhost / HTTPS).
export let maPosition: { lat: number; lng: number } = { ...MA_POSITION }
export function definirMaPosition(p: { lat: number; lng: number }) {
  maPosition = p
}

export type Visibilite = 'prive' | 'cercle' | 'public'
export type Statut = 'actif' | 'archive'

// Étage 1 — avec qui
export const COMPAGNIES = ['solo', 'duo', 'potos', 'pro'] as const
export type Compagnie = (typeof COMPAGNIES)[number]

// Étage 2 — les envies (le lexique en -o)
export const ENVIES = [
  'tranquilo',
  'alloco',
  'resto',
  'gastro',
  'incognito',
  'apéro',
  'turbo',
] as const
export type Envie = (typeof ENVIES)[number]

// Étage 3 — la météo du porte-monnaie
export const METEOS = ['soleil', 'nuageux', 'pluie'] as const
export type Meteo = (typeof METEOS)[number]

export interface PhotoLieu {
  type: 'lieu' | 'plat' | 'wc'
  /** photo prise par le membre (cas réel) */
  blob?: Blob
  /** photo distante — fausses photos de test / futur cloud */
  url?: string
}

/** un tip d'un membre du cercle sur ce lieu (l'autre voix) */
export interface TipCercle {
  auteur: string
  titre: string // "éclaireur du 10e", "47 spots"...
  note: string
  /** url de photo distante (membres fictifs / futur cloud) */
  photoUrl?: string
}

export interface Lieu {
  id: string
  nom: string
  lat: number
  lng: number
  adresse?: string
  /** description factuelle courte du lieu (type/ambiance) : « bar à cocktails,
   *  ambiance prohibition ». PAS un avis — juste de quoi situer le lieu. */
  description?: string
  /** le tip — 2-3 phrases dans la voix du membre, jamais un avis */
  note: string
  visibilite: Visibilite
  envies: Envie[]
  compagnies: Compagnie[]
  /** soleil = ça coûte, pluie = ça coûte rien */
  meteo?: Meteo
  /** verdict du critère perso du membre (texte libre, jamais un chiffre) */
  criterePerso?: string
  photos: PhotoLieu[]
  statut: Statut
  creeLe: string // ISO 8601
  derniereValidation?: string // ISO 8601
  /** provenance : capture rue, import google, ajout manuel */
  source: 'rue' | 'google' | 'manuel'
  /** à qui appartient ce spot : 'moi' (mes captures) ou l'id d'un membre du cercle.
   *  undefined = ancien spot d'avant le marqueur → traité comme mien. Les spots du
   *  cercle sont en lecture seule ; on les "adopte" pour en avoir sa propre copie. */
  proprietaire?: string
  /** les autres voix sur ce lieu (cercle simulé en V1, cloud ensuite) */
  tipsCercle?: TipCercle[]
  /** le tampon perso posé sur la photo au moment du verdict (x/y en %) */
  tampon?: { v: 'valide' | 'bof'; x: number; y: number; qui?: string; date?: string }
  /** les conditions optimales recommandées (sous-ensemble des envies/compagnies, marqué à l'appui long) */
  recos?: string[]
  /** horaires d'ouverture : [ouverture, fermeture] en heures décimales (0.5 = 30 min).
   *  fermeture > 24 = après minuit (ex: [19, 26] = 19h → 2h). une borne à null =
   *  "je sais pas" pour cette borne. undefined = horaires inconnus tout court. */
  horaires?: [number | null, number | null]
  /** Coupe du monde : 'diffuse' = on y voit les matchs (pastille ballon) ·
   *  'refuge' = no foot, ici on y échappe. undefined = neutre. */
  match?: 'diffuse' | 'refuge'
  /** rooftop / terrasse sur le toit — une catégorie à part, très demandée,
   *  filtrable au même titre que le foot. */
  rooftop?: boolean
  /** sur l'eau : péniche, guinguette au bord de l'eau, terrasse Seine/canal. */
  surLeau?: boolean
  /** la propreté des WC, de 1 à 3. LE SEUL "score" chiffré autorisé par le
   *  concept (on juge un lieu à ses toilettes). jamais d'étoiles sur le reste. */
  propreteWc?: 1 | 2 | 3
}

export interface Profil {
  /** 0-100 : mesuré à l'onboarding "le swipe, c'est ta langue ?" */
  scoreSwipe: number
  /** l'obsession du membre : "la luminosité", "le bruit"... */
  critere: string
  prenom: string
  /** le portrait du membre, en tirage (blob image) */
  photo?: Blob
  /** une bio courte + un lien insta (optionnels) */
  bio?: string
  insta?: string
  /** infos « carte d'identité de carnet » : date de naissance (YYYY-MM-DD,
   *  demandée à l'inscription → l'âge en découle) + date d'entrée (ISO) */
  naissance?: string
  age?: number // hérité : remplacé par le calcul depuis `naissance`
  depuis?: string
}

/** l'âge en années à partir d'une date de naissance YYYY-MM-DD */
export function ageDepuis(naissance?: string): number | null {
  if (!naissance) return null
  const n = new Date(naissance)
  if (isNaN(n.getTime())) return null
  const a = new Date()
  let age = a.getFullYear() - n.getFullYear()
  const m = a.getMonth() - n.getMonth()
  if (m < 0 || (m === 0 && a.getDate() < n.getDate())) age--
  return age
}

interface JeudiDB extends DBSchema {
  lieux: {
    key: string
    value: Lieu
    indexes: { 'par-statut': Statut }
  }
  profil: {
    key: string
    value: Profil
  }
}

let dbPromise: Promise<IDBPDatabase<JeudiDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<JeudiDB>('jeudi', 1, {
      upgrade(db) {
        const lieux = db.createObjectStore('lieux', { keyPath: 'id' })
        lieux.createIndex('par-statut', 'statut')
        db.createObjectStore('profil')
      },
    })
  }
  return dbPromise
}

export async function tousLesLieux(): Promise<Lieu[]> {
  const db = await getDB()
  const lieux = await db.getAllFromIndex('lieux', 'par-statut', 'actif')
  return lieux.sort((a, b) => b.creeLe.localeCompare(a.creeLe))
}

export async function ajouterLieu(lieu: Lieu): Promise<void> {
  const db = await getDB()
  await db.put('lieux', lieu)
}

/** le spot est-il à moi ? (undefined = ancien spot d'avant le marqueur = mien) */
export function estAMoi(lieu: Lieu): boolean {
  return !lieu.proprietaire || lieu.proprietaire === 'moi'
}

/** adopter un spot du cercle : on en crée SA PROPRE copie privée. la voix
 *  d'origine reste dans tipsCercle ; ta note se vide pour que tu y mettes la tienne. */
export async function adopterLieu(lieu: Lieu): Promise<Lieu> {
  const auteur = lieu.tipsCercle?.[0]
  const copie: Lieu = {
    ...lieu,
    id: nouvelId(),
    proprietaire: 'moi',
    source: 'manuel',
    visibilite: 'prive',
    note: '',
    statut: 'actif',
    creeLe: new Date().toISOString(),
    tampon: undefined,
    derniereValidation: undefined,
    // on conserve la reco d'origine comme première voix du cercle
    tipsCercle: auteur ? [auteur, ...(lieu.tipsCercle?.slice(1) ?? [])] : lieu.tipsCercle,
  }
  await ajouterLieu(copie)
  return copie
}

export async function archiverLieu(id: string): Promise<void> {
  const db = await getDB()
  const lieu = await db.get('lieux', id)
  if (lieu) await db.put('lieux', { ...lieu, statut: 'archive' })
}

/** suppression définitive — pas de retour en arrière */
export async function supprimerLieu(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('lieux', id)
}

// ── distance depuis "moi" (Place Vendôme par défaut) ───────────
/** distance à vol d'oiseau en mètres entre ma position et un lieu (haversine) */
export function distanceM(lieu: { lat: number; lng: number }, depuis = maPosition): number {
  const R = 6371000
  const dLat = ((lieu.lat - depuis.lat) * Math.PI) / 180
  const dLng = ((lieu.lng - depuis.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((depuis.lat * Math.PI) / 180) *
      Math.cos((lieu.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(a)))
}

/** "450 m" ou "1,2 km" */
export function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`
}

/** minutes de marche (~80 m/min) */
export function tempsMarche(m: number): number {
  return Math.max(1, Math.round(m / 80))
}

// ── état d'ouverture à l'instant (lexique nocturne) ────────────
export function etatHoraire(
  horaires: [number | null, number | null] | undefined,
  maintenant = new Date(),
): { ouvert: boolean | null; texte: string } | null {
  if (!horaires) return null
  const [o, f] = horaires
  if (o == null && f == null) return null
  const fmt = (x: number) => `${Math.floor(x % 24)}h${x % 1 === 0.5 ? '30' : ''}`
  // une seule borne connue : on ne peut pas trancher ouvert/fermé (ouvert: null)
  if (o == null) return { ouvert: null, texte: `ferme à ${fmt(f!)}` }
  if (f == null) return { ouvert: null, texte: `ouvre à ${fmt(o)}` }
  const h = maintenant.getHours() + maintenant.getMinutes() / 60
  // fermeture après minuit : on compare aussi l'heure + 24
  const ouvert = (h >= o && h < f) || (h + 24 < f && h < o + 24 && f > 24)
  return ouvert
    ? { ouvert: true, texte: `ouvert · ferme à ${fmt(f)}` }
    : { ouvert: false, texte: `fermé · ouvre à ${fmt(o)}` }
}

// ── la "situation du portefeuille" (ex-météo) : ce que coûte le spot ──
// des valeurs concrètes pour que l'utilisateur sache ce qu'il choisit.
// une teinte stable par curateur (déterministe sur le nom), partagée entre la
// carte (pins) et l'index (tampon de provenance) — même code couleur partout.
// pas de rouge cire (réservé à "toi").
const TEINTES = ['#6b8e9e', '#9e7a6b', '#7d9e6b', '#8e6b9e', '#9e9456', '#6b9e8c']
export function teinteCurateur(nom: string): string {
  let h = 0
  for (let i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) >>> 0
  return TEINTES[h % TEINTES.length]
}

export const METEO_INFOS: Record<Meteo, { mot: string }> = {
  soleil: { mot: 'on flambe' },
  nuageux: { mot: 'ça va' },
  pluie: { mot: 'ça coûte rien' },
}

// la couleur de "jeudi" : l'accent de marque, choisi par chacun à l'inscription.
// tout l'app passe par la variable CSS --red, donc la changer recolore tout.
export const COULEUR_DEFAUT = '#a8322a' // le rouge cire d'origine
export function lireCouleur(): string {
  return localStorage.getItem('jeudi-couleur') || COULEUR_DEFAUT
}
export function appliquerCouleur(c: string): void {
  document.documentElement.style.setProperty('--red', c)
}

// les seuils € du porte-monnaie, réglés par chacun à l'inscription.
// [s1, s2] : pluie < s1 · nuageux s1–s2 · soleil s2+. défaut 20 / 50.
export function lireSeuils(): [number, number] {
  try {
    const v = JSON.parse(localStorage.getItem('jeudi-seuils') || '')
    if (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && n > 0)) {
      return [v[0], v[1]] as [number, number]
    }
  } catch {
    /* défaut */
  }
  return [20, 50]
}
export function prixMeteo(m: Meteo): string {
  const [s1, s2] = lireSeuils()
  if (m === 'pluie') return `< ${s1} €`
  if (m === 'nuageux') return `${s1}–${s2} €`
  return `${s2} €+`
}

// le repère concret derrière la fourchette : un plat + une boisson au resto,
// deux verres au bar (par personne) — selon le type de lieu (déduit des envies).
const ENVIES_RESTO = new Set(['tranquilo', 'resto', 'gastro', 'alloco'])
export function uniteParPersonne(envies: readonly string[]): string {
  return envies.some((e) => ENVIES_RESTO.has(e)) ? 'plat + boisson' : 'deux verres'
}

// la glose grise qui "répond" au critère choisi — la voix de l'app
export const COMPAGNIE_GLOSE: Record<Compagnie, string> = {
  solo: 'au comptoir, en solo date.',
  duo: 'en tête-à-tête.',
  potos: 'la bande, ça partage.',
  pro: 'tu reçois, pas de fausse note.',
}

const ENVIE_GLOSE: Record<string, string> = {
  tranquilo: 'se poser, sans bruit.',
  resto: 'la valeur sûre. on mange bien.',
  gastro: 'la grande table.',
  incognito: "le speakeasy, le bar caché — l'adresse à voix basse.",
  apéro: "le verre d'avant.",
  alcolo: 'après minuit, on ne fait plus semblant.',
  turbo: 'on enchaîne les spots — la nuit est longue.',
  disco: "jusqu'au bout de la nuit.",
  dodo: 'sage. à jeudi.',
  alloco: 'le grec/taco de quartier, debout.',
}
export function gloseEnvie(mot: string): string {
  return ENVIE_GLOSE[mot] ?? 'le snack de quartier, debout.'
}

// #22 : la propreté des WC en pastilles pleines/vides (jamais des étoiles)
export function propreteWcLabel(n?: number): { points: string; mot: string } | null {
  if (!n) return null
  const mots = ['', 'à fuir', 'correct', 'nickel']
  return { points: '●'.repeat(n) + '○'.repeat(3 - n), mot: mots[n] ?? '' }
}

// #11+ : la liste des lieux « à comparer » (clic long sur la carte). persistée
// en localStorage ; la vue comparaison côte-à-côte viendra ensuite.
export function lireComparer(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem('jeudi-comparer') || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
export function basculerComparer(id: string): string[] {
  const l = lireComparer()
  const n = l.includes(id) ? l.filter((x) => x !== id) : [...l, id]
  localStorage.setItem('jeudi-comparer', JSON.stringify(n))
  return n
}
/** remplace toute la liste « à comparer » (ex. comparer tout un récap d'un coup) */
export function ecrireComparer(ids: string[]): string[] {
  localStorage.setItem('jeudi-comparer', JSON.stringify(ids))
  return ids
}
export function viderComparer(): void {
  localStorage.removeItem('jeudi-comparer')
}

// ── les favoris : un signet posé sur un lieu (le marque-page du carnet) ──
// PAS une note — juste « celui-là, je le garde sous la main ». persisté en
// localStorage, indépendant de la visibilité et du tampon.
export function lireFavoris(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem('jeudi-favoris') || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
export function basculerFavori(id: string): string[] {
  const l = lireFavoris()
  const n = l.includes(id) ? l.filter((x) => x !== id) : [...l, id]
  localStorage.setItem('jeudi-favoris', JSON.stringify(n))
  return n
}

// ── code postal parisien déduit de l'adresse ───────────────────
// les adresses géocodées portent soit "Paris Xe Arrondissement", soit un
// quartier administratif (Gaillon, Val-de-Grâce…). on en déduit le CP 750XX.
const QUARTIERS_PARIS: string[][] = [
  ['saint-germain-l-auxerrois', 'halles', 'palais-royal', 'place-vendome'],
  ['gaillon', 'vivienne', 'mail', 'bonne-nouvelle'],
  ['arts-et-metiers', 'enfants-rouges', 'archives', 'sainte-avoie'],
  ['saint-merri', 'saint-gervais', 'arsenal', 'notre-dame'],
  ['saint-victor', 'jardin-des-plantes', 'val-de-grace', 'sorbonne'],
  ['monnaie', 'odeon', 'notre-dame-des-champs', 'saint-germain-des-pres'],
  ['saint-thomas-d-aquin', 'invalides', 'ecole-militaire', 'gros-caillou'],
  ['champs-elysees', 'faubourg-du-roule', 'madeleine', 'europe'],
  ['saint-georges', 'chaussee-d-antin', 'faubourg-montmartre', 'rochechouart'],
  ['saint-vincent-de-paul', 'porte-saint-denis', 'porte-saint-martin', 'hopital-saint-louis'],
  ['folie-mericourt', 'saint-ambroise', 'roquette', 'sainte-marguerite'],
  ['bel-air', 'picpus', 'bercy', 'quinze-vingts'],
  ['salpetriere', 'gare', 'maison-blanche', 'croulebarbe'],
  ['montparnasse', 'parc-de-montsouris', 'petit-montrouge', 'plaisance'],
  ['saint-lambert', 'necker', 'grenelle', 'javel'],
  ['auteuil', 'muette', 'porte-dauphine', 'chaillot'],
  ['ternes', 'plaine-de-monceaux', 'batignolles', 'epinettes'],
  ['grandes-carrieres', 'clignancourt', 'goutte-d-or', 'chapelle'],
  ['villette', 'pont-de-flandre', 'amerique', 'combat'],
  ['belleville', 'saint-fargeau', 'pere-lachaise', 'charonne'],
]
const QUARTIER_ARR: Record<string, number> = {}
QUARTIERS_PARIS.forEach((q, i) => q.forEach((n) => (QUARTIER_ARR[n] = i + 1)))

function sansAccents(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** déduit le code postal (75001…75020) d'une adresse parisienne, sinon '' */
export function codePostalParis(adresse?: string): string {
  if (!adresse) return ''
  // déjà un CP dans l'adresse ?
  const deja = adresse.match(/\b(75\d{3}|9[2-5]\d{3})\b/)
  if (deja) return deja[1]
  const a = sansAccents(adresse).replace(/[\s,]+/g, '-')
  const arr = a.match(/(\d{1,2})(?:er|eme|e)-?arrondissement/)
  let n = arr ? Number(arr[1]) : 0
  if (!n) {
    for (const q in QUARTIER_ARR) {
      if (a.includes(q)) {
        n = QUARTIER_ARR[q]
        break
      }
    }
  }
  if (n >= 1 && n <= 20) return `750${n.toString().padStart(2, '0')}`
  return ''
}

/** une adresse propre façon Google : "Rue Daunou · 75002 Paris".
 *  vire le nom du lieu répété et le "Quartier …", garde la rue, ajoute le CP + ville. */
export function adresseLisible(adresse?: string, nom = ''): string {
  if (!adresse) return ''
  const cp = codePostalParis(adresse)
  const nomBas = nom.toLowerCase()
  const parts = adresse
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !nomBas.includes(p.toLowerCase())) // pas le nom du lieu
    .filter(
      (p) =>
        !/^quartier/i.test(p) &&
        !/arrondissement/i.test(p) &&
        !/^paris$/i.test(p) &&
        !/^\d{4,5}\b/.test(p), // un CP déjà isolé : on le remet proprement après
    )
  const rue = parts.join(', ')
  const ville = cp ? `${cp} Paris` : ''
  return [rue, ville].filter(Boolean).join(' · ')
}

/** l'adresse COMPLÈTE (n° + rue, CP + ville) par reverse-geocoding des coordonnées.
 *  Nominatim a le house_number que notre import n'avait pas gardé. mis en cache
 *  (localStorage) par lieu pour ne pas re-télécharger ni spammer le service. */
export async function reverseAdresse(id: string, lat: number, lng: number): Promise<string> {
  const cle = `jeudi-adr-${id}`
  const cache = localStorage.getItem(cle)
  if (cache !== null) return cache
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    const r = await fetch(url, { headers: { 'Accept-Language': 'fr' } })
    const d = await r.json()
    const a = d.address ?? {}
    const num = a.house_number ? `${a.house_number} ` : ''
    const rue = a.road || a.pedestrian || a.footway || a.square || ''
    const cp = a.postcode || ''
    const ville = a.city || a.town || a.village || a.municipality || a.suburb || ''
    const complete = `${num}${rue}${rue && (cp || ville) ? ', ' : ''}${cp}${cp && ville ? ' ' : ''}${ville}`.trim()
    if (complete) {
      localStorage.setItem(cle, complete)
      return complete
    }
  } catch {
    /* hors-ligne ou service indispo : on retombe sur l'adresse stockée */
  }
  return ''
}

export function nouvelId(): string {
  // crypto.randomUUID n'existe qu'en contexte sécurisé (HTTPS / localhost).
  // En HTTP sur IP locale (test depuis le tél), on bascule sur un fallback.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      /* contexte non sécurisé : on tombe sur le fallback */
    }
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

// ── import Google Takeout ("Saved Places.json" / "Lieux enregistrés") ──
// Format GeoJSON : FeatureCollection, coordonnées [lng, lat]. On crée tes
// spots privés (proprietaire 'moi'), en sautant les doublons par nom.
interface TakeoutFeature {
  geometry?: { coordinates?: number[] } | null
  properties?: {
    Title?: string
    Location?: { Address?: string; 'Business Name'?: string; Geo?: { coordinates?: number[] } }
    google_maps_url?: string
    Comment?: string
  }
}

export async function importerTakeout(json: unknown): Promise<number> {
  const fc = json as { features?: TakeoutFeature[] }
  if (!fc || !Array.isArray(fc.features)) {
    throw new Error('fichier non reconnu (attendu : Saved Places.json de Google Takeout)')
  }
  const db = await getDB()
  const existants = new Set((await db.getAll('lieux')).map((l) => l.nom))
  let n = 0
  for (const f of fc.features) {
    const props = f.properties ?? {}
    const coords = f.geometry?.coordinates ?? props.Location?.Geo?.coordinates
    const nom = props.Title || props.Location?.['Business Name']
    if (!coords || coords.length < 2 || !nom || existants.has(nom)) continue
    existants.add(nom)
    await ajouterLieu({
      id: nouvelId(),
      nom,
      // GeoJSON : [lng, lat]
      lng: coords[0],
      lat: coords[1],
      adresse: props.Location?.Address,
      note: props.Comment ?? '',
      visibilite: 'prive',
      envies: [],
      compagnies: [],
      photos: [],
      statut: 'actif',
      creeLe: new Date().toISOString(),
      source: 'google',
      proprietaire: 'moi',
    })
    n++
  }
  return n
}

export async function majLieu(lieu: Lieu): Promise<void> {
  const db = await getDB()
  await db.put('lieux', lieu)
}

export async function lireLieu(id: string): Promise<Lieu | undefined> {
  const db = await getDB()
  return db.get('lieux', id)
}

export async function lireProfil(): Promise<Profil | undefined> {
  const db = await getDB()
  return db.get('profil', 'moi')
}

export async function sauverProfil(p: Profil): Promise<void> {
  const db = await getDB()
  await db.put('profil', p, 'moi')
}

// ── les sorties en attente de validation ("alors, Le Bisou ?") ──
export interface SortieEnAttente {
  lieuId: string
  nom: string
  date: string // ISO 8601
}

export function sortiesEnAttente(): SortieEnAttente[] {
  try {
    return JSON.parse(localStorage.getItem('jeudi-sorties') ?? '[]')
  } catch {
    return []
  }
}

export function ajouterSortie(s: SortieEnAttente) {
  const liste = sortiesEnAttente().filter((x) => x.lieuId !== s.lieuId)
  liste.push(s)
  localStorage.setItem('jeudi-sorties', JSON.stringify(liste))
}

export function retirerSortie(lieuId: string) {
  localStorage.setItem(
    'jeudi-sorties',
    JSON.stringify(sortiesEnAttente().filter((x) => x.lieuId !== lieuId)),
  )
}
