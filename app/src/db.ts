import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { supabase } from './supabase'
import { adresseDepuis } from './nominatim'
import { fusionnerTips } from './tips'
import { lireMarques } from './marques'

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
  /** id du membre (table `tips`) — présent = un VRAI tip cloud ;
   *  absent = tip du seed (décor), tamponné « démo » dans la fiche */
  auteurId?: string
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
  /** le portrait du membre, en tirage (blob image, cache local) */
  photo?: Blob
  /** le portrait dans le cloud (Supabase Storage, étape 4) — prioritaire à l'affichage */
  photoUrl?: string
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

// ── couche cloud (étape 3) ─────────────────────────────────────
// Tes lieux vivent dans Supabase (table lieux, owner_id = toi). Le décor
// (cercle simulé Karim/Léa + spots publics du seed) reste en LOCAL (IndexedDB).
// monId = ton id de session, mis en cache pour estAMoi() (qui est synchrone).
let monId: string | null = null
export function definirMonId(id: string | null) {
  monId = id
}

// ── pretAuth : « l'auth a répondu au moins une fois » ──
// La course classique : tousLesLieux() partait AVANT que chargerMonId ait
// rempli monId → la branche cloud était sautée et mes spots cloud passaient
// pour du décor. pretAuth se résout au premier retour d'auth (chargerMonId OU
// l'event INITIAL_SESSION de Supabase) ; les lectures/écritures cloud
// l'attendent. Ça ne bloque pas le rendu local-first : la session est en
// localStorage, la réponse est quasi immédiate.
let authResolue = false
let resoudreAuth: (() => void) | null = null
export const pretAuth: Promise<void> = new Promise<void>((r) => {
  resoudreAuth = r
})
function marquerAuthPrete(): void {
  if (!authResolue) {
    authResolue = true
    resoudreAuth?.()
  }
}

/** lit la session et met monId à jour (à appeler au boot, avant tousLesLieux) */
export async function chargerMonId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  monId = data.session?.user?.id ?? null
  marquerAuthPrete()
  // connecté : on rejoue les écritures restées en rade (file d'attente offline)
  if (monId) void rejouerAttente()
  return monId
}
// tient monId à jour aux changements (connexion / déconnexion / refresh)
supabase.auth.onAuthStateChange((_e, session) => {
  monId = session?.user?.id ?? null
  marquerAuthPrete()
})

/** ligne de la table `lieux` (colonnes snake_case côté Supabase).
 *  `cree_le` est posé par la base (default) → absent des écritures ;
 *  `recos` reste optionnelle tant que la migration 0003 n'est pas garantie. */
interface LigneLieu {
  id: string
  owner_id: string | null
  nom: string
  lat: number
  lng: number
  adresse: string | null
  description: string | null
  note: string | null
  visibilite: Visibilite
  envies: Envie[] | null
  compagnies: Compagnie[] | null
  meteo: Meteo | null
  critere_perso: string | null
  source: Lieu['source'] | null
  statut: Statut | null
  match: Lieu['match'] | null
  rooftop: boolean | null
  sur_leau: boolean | null
  proprete_wc: Lieu['propreteWc'] | null
  horaire_ouv: number | null
  horaire_ferm: number | null
  tampon: Lieu['tampon'] | null
  derniere_validation: string | null
  recos?: string[] | null
  cree_le: string
}
function ligneVersLieu(r: LigneLieu): Lieu {
  return {
    id: r.id,
    nom: r.nom,
    lat: r.lat,
    lng: r.lng,
    adresse: r.adresse ?? undefined,
    description: r.description ?? undefined,
    note: r.note ?? '',
    visibilite: r.visibilite,
    envies: r.envies ?? [],
    compagnies: r.compagnies ?? [],
    meteo: r.meteo ?? undefined,
    criterePerso: r.critere_perso ?? undefined,
    photos: [], // les photos arrivent avec le Storage cloud (étape 4)
    statut: r.statut ?? 'actif',
    creeLe: r.cree_le,
    derniereValidation: r.derniere_validation ?? undefined,
    source: r.source ?? 'manuel',
    proprietaire: r.owner_id ?? undefined,
    tampon: r.tampon ?? undefined,
    horaires:
      r.horaire_ouv != null || r.horaire_ferm != null
        ? [r.horaire_ouv ?? null, r.horaire_ferm ?? null]
        : undefined,
    match: r.match ?? undefined,
    rooftop: r.rooftop ?? undefined,
    surLeau: r.sur_leau ?? undefined,
    propreteWc: r.proprete_wc ?? undefined,
    // colonne créée par la migration 0003 : absente en base = undefined
    recos: Array.isArray(r.recos) ? r.recos : undefined,
  }
}
function lieuVersLigne(l: Lieu): Omit<LigneLieu, 'cree_le'> {
  return {
    id: l.id,
    owner_id: monId,
    nom: l.nom,
    lat: l.lat,
    lng: l.lng,
    adresse: l.adresse ?? null,
    description: l.description ?? null,
    note: l.note ?? null,
    visibilite: l.visibilite,
    envies: l.envies ?? [],
    compagnies: l.compagnies ?? [],
    meteo: l.meteo ?? null,
    critere_perso: l.criterePerso ?? null,
    source: l.source,
    statut: l.statut,
    match: l.match ?? null,
    rooftop: l.rooftop ?? false,
    sur_leau: l.surLeau ?? false,
    proprete_wc: l.propreteWc ?? null,
    horaire_ouv: l.horaires?.[0] ?? null,
    horaire_ferm: l.horaires?.[1] ?? null,
    tampon: l.tampon ?? null,
    derniere_validation: l.derniereValidation ?? null,
    // text[] côté base (0003). Si la colonne n'existe pas encore, l'écriture
    // échoue avec « column recos… » → pousserLieuCloud retente sans elle.
    recos: l.recos ?? null,
  }
}

// ── Storage des photos (étape 4, sécurisé par la migration 0003) ──────────
// Un bucket `photos` (PRIVÉ après 0003) ; chaque fichier vit sous `<monId>/...`.
// Les colonnes `photos.url` et `profils.photo_url` stockent le CHEMIN du
// fichier dans le bucket (plus une URL publique) ; l'app génère des URLs
// SIGNÉES à la lecture. createSignedUrl marche AUSSI sur un bucket public →
// le code est compatible avant ET après la migration.
const BUCKET_PHOTOS = 'photos'
const TTL_SIGNATURE_S = 3600 // 1 h

/** retrouve le CHEMIN bucket depuis une valeur stockée (compat avant/après 0003) :
 *  - déjà un chemin (« uid/lieu/0-lieu.jpg ») → tel quel
 *  - URL Supabase (publique d'avant 0003, ou signée) → chemin extrait
 *  - blob:/data:/URL externe (photos de test du seed) → null : pas un fichier
 *    du bucket, l'appelant garde la valeur telle quelle */
function cheminDepuis(valeur: string): string | null {
  if (valeur.startsWith('blob:') || valeur.startsWith('data:')) return null
  if (/^https?:\/\//i.test(valeur)) {
    const m = valeur.match(/\/object\/(?:public|sign|authenticated)\/photos\/([^?]+)/)
    return m ? decodeURIComponent(m[1]) : null
  }
  return valeur
}

// petit cache mémoire des signatures : chemin → { url signée, expiration }
const signatures = new Map<string, { url: string; expire: number }>()

/** URL affichable d'un fichier du bucket (signée, TTL 1 h, mise en cache).
 *  null si hors-ligne / chemin inconnu — l'appelant garde sa valeur de repli. */
export async function urlPhoto(
  chemin: string,
  ttlSecondes = TTL_SIGNATURE_S,
): Promise<string | null> {
  const connue = signatures.get(chemin)
  if (connue && connue.expire > Date.now()) return connue.url
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_PHOTOS)
      .createSignedUrl(chemin, ttlSecondes)
    if (error || !data?.signedUrl) return null
    // marge de 60 s : on ne ressert jamais une URL sur le point d'expirer
    signatures.set(chemin, {
      url: data.signedUrl,
      expire: Date.now() + Math.max(ttlSecondes - 60, 30) * 1000,
    })
    return data.signedUrl
  } catch {
    return null
  }
}

/** téléverse un blob dans MON dossier → CHEMIN bucket (null si échec/hors-ligne) */
async function televerserPhoto(blob: Blob, chemin: string): Promise<string | null> {
  if (!monId) return null
  const { data, error } = await supabase.storage
    .from(BUCKET_PHOTOS)
    .upload(chemin, blob, { upsert: true, contentType: blob.type || 'image/jpeg' })
  if (error) {
    console.error('[jeudi] upload photo KO', chemin, error)
    return null
  }
  // le contenu a changé : une signature en cache pour ce chemin est périmée
  signatures.delete(chemin)
  return data?.path ?? chemin
}

/** ménage Storage d'un lieu : supprime les fichiers de `<monId>/<lieuId>/`
 *  qui ne sont plus référencés (`gardes` = chemins encore utilisés ; sans
 *  gardes → tout le dossier part). Best-effort : un échec ne casse rien. */
async function nettoyerStorageLieu(lieuId: string, gardes?: Set<string>): Promise<void> {
  if (!monId) return
  const dossier = `${monId}/${lieuId}`
  try {
    const { data, error } = await supabase.storage.from(BUCKET_PHOTOS).list(dossier)
    if (error || !data) {
      if (error) console.warn('[jeudi] listage Storage KO', dossier, error)
      return
    }
    const aSupprimer = data
      .map((f) => `${dossier}/${f.name}`)
      .filter((ch) => !gardes || !gardes.has(ch))
    if (!aSupprimer.length) return
    const { error: eSuppr } = await supabase.storage.from(BUCKET_PHOTOS).remove(aSupprimer)
    if (eSuppr) console.warn('[jeudi] ménage Storage KO', dossier, eSuppr)
  } catch (e) {
    console.warn('[jeudi] ménage Storage KO', dossier, e)
  }
}

/** synchronise les photos d'un de MES lieux : upload des blobs neufs, réécrit
 *  la table `photos` en INSÉRANT AVANT d'effacer (un insert raté conserve les
 *  anciennes lignes — jamais d'état 0-photo), puis fait le ménage des blobs
 *  Storage qui ne sont plus référencés. */
async function syncPhotosLieu(lieu: Lieu): Promise<void> {
  if (!monId || !estAMoi(lieu)) return
  const lignes: { lieu_id: string; type: string; url: string; ordre: number }[] = []
  let i = 0
  for (const p of lieu.photos ?? []) {
    let valeur: string | undefined
    if (p.blob) {
      valeur = (await televerserPhoto(p.blob, `${monId}/${lieu.id}/${i}-${p.type}.jpg`)) ?? undefined
    } else if (p.url) {
      // URL signée/publique → on retrouve le CHEMIN ; URL externe (photos de
      // test) → stockée telle quelle (compat) ; blob:/data: → rien à stocker
      valeur = cheminDepuis(p.url) ?? (/^https?:\/\//i.test(p.url) ? p.url : undefined)
    }
    if (valeur) lignes.push({ lieu_id: lieu.id, type: p.type, url: valeur, ordre: i })
    i++
  }
  // pas d'unicité (lieu_id, ordre) en base → pas d'upsert possible : on relève
  // les anciennes lignes, on insère les neuves, PUIS on efface les anciennes
  // par id — dans cet ordre, et les deux erreurs remontent en console.
  const anciennes = await supabase.from('photos').select('id').eq('lieu_id', lieu.id)
  if (anciennes.error) {
    console.error('[jeudi] syncPhotos lecture KO — sync photos abandonnée', anciennes.error)
    return
  }
  if (lignes.length) {
    const ins = await supabase.from('photos').insert(lignes)
    if (ins.error) {
      console.error('[jeudi] syncPhotos insert KO — anciennes lignes conservées', ins.error)
      return
    }
  }
  const anciensIds = ((anciennes.data ?? []) as { id: string }[]).map((r) => r.id)
  if (anciensIds.length) {
    const del = await supabase.from('photos').delete().in('id', anciensIds)
    if (del.error) console.error('[jeudi] syncPhotos delete KO (doublons possibles)', del.error)
  }
  await nettoyerStorageLieu(lieu.id, new Set(lignes.map((l) => l.url)))
}

/** charge les photos (table `photos`) pour une liste d'ids de lieux → map
 *  id→photos, avec des URLs SIGNÉES prêtes à afficher (un seul lot + cache). */
async function chargerPhotos(ids: string[]): Promise<Map<string, PhotoLieu[]>> {
  const map = new Map<string, PhotoLieu[]>()
  if (!ids.length) return map
  const { data } = await supabase
    .from('photos')
    .select('lieu_id,type,url,ordre')
    .in('lieu_id', ids)
    .order('ordre')
  // ligne de la table `photos` (les seules colonnes sélectionnées ci-dessus)
  const lignes = (data ?? []) as { lieu_id: string; type: PhotoLieu['type']; url: string; ordre: number }[]
  // 1er passage : signer en UN lot les chemins pas (ou plus) en cache
  const aSigner: string[] = []
  for (const r of lignes) {
    const ch = typeof r.url === 'string' ? cheminDepuis(r.url) : null
    if (!ch) continue
    const connue = signatures.get(ch)
    if ((!connue || connue.expire <= Date.now()) && !aSigner.includes(ch)) aSigner.push(ch)
  }
  if (aSigner.length) {
    try {
      const { data: signees } = await supabase.storage
        .from(BUCKET_PHOTOS)
        .createSignedUrls(aSigner, TTL_SIGNATURE_S)
      for (const s of signees ?? []) {
        if (s.path && s.signedUrl) {
          signatures.set(s.path, {
            url: s.signedUrl,
            expire: Date.now() + (TTL_SIGNATURE_S - 60) * 1000,
          })
        }
      }
    } catch {
      /* hors-ligne : on servira la valeur brute ci-dessous */
    }
  }
  // 2e passage : construire la map avec l'URL signée (ou la valeur brute :
  // URL externe de test, ou chemin nu si la signature a échoué)
  for (const r of lignes) {
    const arr = map.get(r.lieu_id) ?? []
    let url: string = r.url
    const ch = typeof r.url === 'string' ? cheminDepuis(r.url) : null
    if (ch) url = signatures.get(ch)?.url ?? url
    arr.push({ type: r.type, url })
    map.set(r.lieu_id, arr)
  }
  return map
}

// ════════════════════════════════════════════════════════════════════
// ── les tips cloud (table `tips`) : les « autres voix » réelles ──
// La RLS de 0001 les rend lisibles si le lieu parent m'est visible ; on
// n'écrit que les siens (auteur_id = moi). Comme le cercle : écritures
// SANS write-queue (du contenu social ne se rejoue pas des heures après
// sans le dire) → l'échec remonte en erreur VISIBLE, message affichable
// tel quel. Lecture : best-effort, le miroir IndexedDB tient le hors-ligne.
// ════════════════════════════════════════════════════════════════════

/** ligne de la table `tips` (les seules colonnes lues) */
interface LigneTip {
  lieu_id: string
  auteur_id: string
  titre: string | null
  note: string | null
}

/** charge les tips cloud d'une liste de lieux → map id→TipCercle[], joints
 *  aux prénoms : mon cercle d'abord (monCercle, cache léger), la vitrine
 *  `profils_publics` pour le reste (moi inclus, et les voix sur des spots
 *  publics d'inconnus). Best-effort : erreur/hors-ligne → NULL (≠ map vide
 *  = vraiment zéro tip), l'appelant garde ce que le miroir local sait déjà
 *  — un échec réseau ne jette JAMAIS les voix déjà miroitées. */
async function chargerTipsCloud(ids: string[]): Promise<Map<string, TipCercle[]> | null> {
  const map = new Map<string, TipCercle[]>()
  if (!ids.length || !monId) return map
  try {
    const { data, error } = await supabase
      .from('tips')
      .select('lieu_id,auteur_id,titre,note')
      .in('lieu_id', ids)
      .order('cree_le')
    if (error) throw error
    const lignes = (data ?? []) as LigneTip[]
    if (!lignes.length) return map
    // qui parle ? le cercle d'abord (déjà chargé/en cache), la vitrine ensuite
    const prenoms = new Map<string, string>()
    for (const m of await monCercle()) prenoms.set(m.id, m.prenom)
    const inconnus = [...new Set(lignes.map((r) => r.auteur_id))].filter((a) => !prenoms.has(a))
    if (inconnus.length) {
      try {
        for (const [pid, p] of await profilsPublics(inconnus)) {
          if (p.prenom) prenoms.set(pid, p.prenom)
        }
      } catch {
        /* vitrine injoignable : prénom de repli ci-dessous */
      }
    }
    for (const r of lignes) {
      const note = (r.note ?? '').trim()
      if (!note) continue
      const arr = map.get(r.lieu_id) ?? []
      arr.push({
        auteur: prenoms.get(r.auteur_id) ?? 'membre',
        titre: r.titre ?? '',
        note,
        auteurId: r.auteur_id,
      })
      map.set(r.lieu_id, arr)
    }
  } catch (e) {
    console.warn('[jeudi] chargerTipsCloud KO (hors-ligne ?)', e)
    return null
  }
  return map
}

/** merge les tips cloud d'un lieu DEVANT son héritage local sans auteurId
 *  (seed / adoption), dédoublonnés — undefined si aucune voix (forme Lieu). */
function mergerTipsLieu(lieu: Lieu, cloud: TipCercle[], local?: Lieu): void {
  const heritage = (local?.tipsCercle ?? []).filter((t) => !t.auteurId)
  const fusion = fusionnerTips(cloud, heritage)
  lieu.tipsCercle = fusion.length ? fusion : undefined
}

/** écrit MON tip sur un lieu (un tip par lieu par auteur) : update s'il
 *  existe, insert sinon, suppression si le texte est vide. Throw = échec
 *  VISIBLE (RLS : le lieu doit m'être visible pour y poser ma voix). */
export async function ecrireTip(lieuId: string, texte: string): Promise<void> {
  await pretAuth
  if (!monId) throw new Error('connecte-toi d’abord.')
  if (!estUuid(lieuId)) throw new Error('ce spot ne vit pas encore dans le cloud.')
  const propre = texte.trim()
  try {
    if (!propre) {
      // texte vidé = mon tip s'efface (0 ligne touchée = déjà parti : ok)
      const { error } = await supabase
        .from('tips')
        .delete()
        .eq('lieu_id', lieuId)
        .eq('auteur_id', monId)
      if (error) throw error
      return
    }
    // un par lieu par auteur : update d'abord (couvre d'éventuels doublons)…
    const { data, error } = await supabase
      .from('tips')
      .update({ note: propre })
      .eq('lieu_id', lieuId)
      .eq('auteur_id', monId)
      .select('id')
    if (error) throw error
    if (Array.isArray(data) && data.length > 0) return
    // …insert sinon (RLS : auteur_id = moi ; FK : le lieu doit exister)
    const { error: eIns } = await supabase
      .from('tips')
      .insert({ lieu_id: lieuId, auteur_id: monId, note: propre })
    if (eIns) throw eIns
  } catch (e) {
    console.warn('[jeudi] ecrireTip KO', lieuId, e)
    const code = (e as { code?: string } | null)?.code
    if (code === '23503') throw new Error('ce spot n’existe plus côté cloud.', { cause: e })
    if (code === '42501')
      throw new Error('ce spot n’est pas (ou plus) partagé avec toi.', { cause: e })
    throw new Error('ton tip n’est pas parti. vérifie le réseau et réessaie.', { cause: e })
  }
}

/** MON tip cloud déjà posé sur ce lieu (pré-remplissage de la validation) */
export function monTipDans(lieu: Lieu): string {
  if (!monId) return ''
  return lieu.tipsCercle?.find((t) => t.auteurId === monId)?.note ?? ''
}

// ════════════════════════════════════════════════════════════════════
// ── la file d'attente offline (write-queue) ──
// Quand une écriture cloud échoue (réseau, timeout, RLS muette), on note QUOI
// resynchroniser ({type, id, date} — jamais le payload : rejouer = relire
// l'état LOCAL actuel et le pousser, le dernier état gagne). Persistée en
// localStorage, rejouée au démarrage (chargerMonId) et au retour en ligne.
// ════════════════════════════════════════════════════════════════════
type TypeTacheSync = 'lieu-upsert' | 'lieu-archive' | 'lieu-suppr' | 'profil'
interface TacheSync {
  type: TypeTacheSync
  id: string
  date: string // ISO — informatif (debug) ; le rejeu relit l'état local
}
const CLE_ATTENTE = 'jeudi-attente-sync'

function lireAttente(): TacheSync[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_ATTENTE) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
function ecrireAttente(taches: TacheSync[]): void {
  localStorage.setItem(CLE_ATTENTE, JSON.stringify(taches))
}
/** enfile une resync. Dédoublonnée par id : le dernier état gagne. */
function enfiler(type: TypeTacheSync, id: string): void {
  const taches = lireAttente().filter((t) => t.id !== id)
  taches.push({ type, id, date: new Date().toISOString() })
  ecrireAttente(taches)
}
/** les ids en attente de sync (spots jamais poussés / modifiés hors-ligne) */
function idsEnAttente(): Set<string> {
  return new Set(lireAttente().map((t) => t.id))
}

let rejeuEnCours = false
/** rejoue la file : relit l'état local de chaque entrée et le pousse au cloud.
 *  Les échecs restent en file pour le prochain passage (démarrage / online). */
export async function rejouerAttente(): Promise<void> {
  if (rejeuEnCours) return
  if (!lireAttente().length) return
  await pretAuth
  if (!monId) return
  rejeuEnCours = true
  try {
    const restantes: TacheSync[] = []
    for (const t of lireAttente()) {
      const rejouee = await rejouerTache(t)
      if (!rejouee.ok) restantes.push({ ...t, id: rejouee.id ?? t.id })
    }
    ecrireAttente(restantes)
    if (restantes.length) {
      console.warn(`[jeudi] resync : ${restantes.length} écriture(s) toujours en attente`)
    }
  } finally {
    rejeuEnCours = false
  }
}

async function rejouerTache(t: TacheSync): Promise<{ ok: boolean; id?: string }> {
  try {
    if (t.type === 'lieu-suppr') {
      // pas d'état local à relire : on rejoue par id. 0 ligne touchée = déjà
      // supprimé (ou jamais poussé) → succès quand même, c'est une suppression.
      const { error } = await supabase
        .from('lieux')
        .delete()
        .eq('id', t.id)
        .eq('owner_id', monId)
      if (error) return { ok: false }
      await nettoyerStorageLieu(t.id)
      return { ok: true }
    }
    if (t.type === 'profil') {
      const db = await getDB()
      const p = await db.get('profil', 'moi')
      if (!p) return { ok: true } // plus rien à pousser
      return { ok: await pousserProfilCloud(p) }
    }
    // lieu-upsert / lieu-archive : l'état local actuel EST la vérité à pousser
    const db = await getDB()
    const local = await db.get('lieux', t.id)
    if (!local || !estAMoi(local)) return { ok: true } // disparu ou pas à moi
    const lieu = await assurerUuid(local)
    if (await pousserLieuCloud(lieu)) {
      await syncPhotosLieu(lieu)
      return { ok: true }
    }
    return { ok: false, id: lieu.id } // l'id a pu être réécrit (legacy → uuid)
  } catch (e) {
    console.warn('[jeudi] resync KO', t.type, t.id, e)
    return { ok: false }
  }
}

/** pousse TOUT le profil local vers le cloud (rejeu de la file). */
async function pousserProfilCloud(p: Profil): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const maj: Record<string, unknown> = {
    prenom: p.prenom,
    critere: p.critere,
    bio: p.bio ?? null,
    insta: p.insta ?? null,
    naissance: p.naissance ?? null,
    score_swipe: p.scoreSwipe,
    couleur: lireCouleur(),
    seuils: lireSeuils(),
  }
  if (p.photo) {
    const chemin = await televerserPhoto(p.photo, `${user.id}/profil.jpg`)
    if (chemin) maj.photo_url = chemin
  } else if (p.photoUrl) {
    const chemin = cheminDepuis(p.photoUrl)
    if (chemin) maj.photo_url = chemin
  }
  const { error } = await supabase.from('profils').update(maj).eq('id', user.id)
  if (error) {
    console.warn('[jeudi] resync profil KO', error)
    return false
  }
  return true
}

// PostgREST plafonne une lecture à 1000 lignes : si on touche ce plafond
// rond, la lecture est probablement PARTIELLE → interdiction de purger.
const PLAFOND_LECTURE = 1000

export async function tousLesLieux(): Promise<Lieu[]> {
  // la course monId : sans cette attente, un appel parti avant la première
  // réponse d'auth sautait la branche cloud et classait mes spots en décor.
  await pretAuth
  const db = await getDB()
  const actifs = await db.getAllFromIndex('lieux', 'par-statut', 'actif')
  // le décor : tout ce qui n'est PAS à moi — le seed local (cercle simulé +
  // spots publics) ET le miroir hors-ligne des spots du cercle réel.
  let decor = actifs.filter((l) => !estAMoi(l))
  // mes spots : source de vérité = le cloud (owner_id = moi). On miroite chaque
  // lecture réussie dans IndexedDB → hors-ligne, on relit ce cache au lieu de
  // perdre mes spots (cache offline, étape 3).
  let miens: Lieu[] = []
  // les spots du CERCLE RÉEL (et les publics d'autres membres) : la RLS les
  // donne d'office dès qu'on lit sans filtre owner_id (étape 5).
  let duCercle: Lieu[] = []
  let cloudOk = false
  try {
    if (monId) {
      // SANS filtre owner_id : la RLS rend mes spots + ceux que j'ai le droit
      // de voir (cercle accepté + publics). On sépare ensuite les miens du reste.
      const { data, error } = await supabase
        .from('lieux')
        .select('*')
        .eq('statut', 'actif')
      if (error) throw error
      if (data) {
        const lignes = data as LigneLieu[]
        miens = lignes.filter((r) => r.owner_id === monId).map(ligneVersLieu)
        duCercle = lignes.filter((r) => r.owner_id !== monId).map(ligneVersLieu)
        // les photos (table photos → Storage), un seul lot pour tout ;
        // best-effort, ne casse pas la lecture
        const photos = await chargerPhotos([...miens, ...duCercle].map((l) => l.id))
        for (const l of miens) l.photos = photos.get(l.id) ?? []
        for (const l of duCercle) l.photos = photos.get(l.id) ?? []
        // les autres voix (table tips), même lot — cloud DEVANT l'héritage
        // local (seed/adoption). Le résultat part dans le miroir IndexedDB
        // ci-dessous → hors-ligne, les voix restent lisibles.
        const tipsCloud = await chargerTipsCloud([...miens, ...duCercle].map((l) => l.id))
        const locauxParId = new Map(actifs.map((l) => [l.id, l] as const))
        for (const l of [...miens, ...duCercle]) {
          const local = locauxParId.get(l.id)
          if (tipsCloud) {
            mergerTipsLieu(l, tipsCloud.get(l.id) ?? [], local)
          } else {
            // SELECT `tips` KO alors que `lieux` a répondu : on garde ce que
            // le miroir sait déjà — sinon le put ci-dessous écraserait les
            // voix des potes (et monTipDans repartirait à vide → DELETE à tort)
            l.tipsCercle = local?.tipsCercle
          }
        }
        cloudOk = true
        const frais = new Set(miens.map((l) => l.id))
        const fraisCercle = new Set(duCercle.map((l) => l.id))
        const enAttente = idsEnAttente()
        // la lecture TOTALE a pu être tronquée (plafond PostgREST) → pas de purge
        const lecturePartielle = lignes.length >= PLAFOND_LECTURE
        const locauxMiens = actifs.filter((l) => estAMoi(l))
        // le miroir des spots du cercle d'un passage précédent : proprietaire =
        // un uuid qui n'est pas moi (le seed, lui, porte 'karim'/'pub-…')
        const locauxCercle = actifs.filter(
          (l) => !estAMoi(l) && !!l.proprietaire && estUuid(l.proprietaire),
        )
        // miroir local : mes spots + ceux du cercle (cache hors-ligne)
        const tx = db.transaction('lieux', 'readwrite')
        for (const l of miens) await tx.store.put(l)
        for (const l of duCercle) await tx.store.put(l)
        // purge des spots cachés absents du cloud (supprimés ailleurs) —
        // SEULEMENT si la lecture est complète et fiable, et JAMAIS un spot
        // encore en file d'attente (pas encore poussé au cloud)
        if (!lecturePartielle) {
          for (const l of locauxMiens) {
            if (!frais.has(l.id) && !enAttente.has(l.id)) await tx.store.delete(l.id)
          }
          // un spot du cercle disparu (retiré, repassé privé, relation rompue)
          // sort aussi du miroir
          for (const l of locauxCercle) {
            if (!fraisCercle.has(l.id)) await tx.store.delete(l.id)
          }
        }
        await tx.done
        // les spots locaux préservés restent visibles dans « les miens »
        for (const l of locauxMiens) {
          if (!frais.has(l.id) && (enAttente.has(l.id) || lecturePartielle)) miens.push(l)
        }
        // le décor ne doit pas DUPLIQUER les spots cloud frais (miroir d'un
        // passage précédent) : la version fraîche fait foi
        decor = decor.filter((l) => !fraisCercle.has(l.id) && !frais.has(l.id))
      }
    }
  } catch {
    /* hors-ligne ou erreur réseau : on retombe sur le cache local ci-dessous
       (les spots du cercle miroités y sont DANS le décor — rien à faire) */
  }
  // hors-ligne : mes spots = ce que le miroir IndexedDB a gardé de la dernière sync
  if (!cloudOk && monId) miens = actifs.filter((l) => estAMoi(l))
  return [...miens, ...duCercle, ...decor].sort((a, b) => b.creeLe.localeCompare(a.creeLe))
}

/** insert LOCAL (IndexedDB) — réservé au seed (le décor). PAS pour tes spots. */
export async function ajouterLieuLocal(lieu: Lieu): Promise<void> {
  const db = await getDB()
  await db.put('lieux', lieu)
}

// ── ids sûrs pour le cloud ──
// La colonne `lieux.id` est un uuid : un id maison (« id-… » de l'ancien
// fallback HTTP, ids du seed d'avant) serait rejeté par Postgres (22P02).
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function estUuid(id: string): boolean {
  return RE_UUID.test(id)
}

/** un lieu à pousser au cloud DOIT porter un uuid : si l'id est legacy, on en
 *  génère un neuf et on réécrit l'enregistrement local + ses références
 *  triviales (favoris, comparer, vus, signalés, sorties, bofs, cache adresse)
 *  AVANT l'écriture cloud. Renvoie le lieu (réécrit, ou tel quel). */
async function assurerUuid(lieu: Lieu): Promise<Lieu> {
  if (estUuid(lieu.id)) return lieu
  const ancien = lieu.id
  const neuf: Lieu = { ...lieu, id: nouvelId() }
  const db = await getDB()
  const tx = db.transaction('lieux', 'readwrite')
  await tx.store.delete(ancien)
  await tx.store.put(neuf)
  await tx.done
  remplacerIdLocal(ancien, neuf.id)
  console.warn(`[jeudi] id legacy réécrit pour le cloud : ${ancien} → ${neuf.id}`)
  return neuf
}

/** remplace un id de lieu dans les petites listes localStorage (best-effort) */
function remplacerIdLocal(ancien: string, neuf: string): void {
  // listes d'ids nus
  for (const cle of ['jeudi-favoris', 'jeudi-comparer', 'jeudi-vus', 'jeudi-signales']) {
    try {
      const v = JSON.parse(localStorage.getItem(cle) ?? '[]')
      if (Array.isArray(v) && v.includes(ancien)) {
        localStorage.setItem(cle, JSON.stringify(v.map((x) => (x === ancien ? neuf : x))))
      }
    } catch {
      /* liste illisible : tant pis */
    }
  }
  // listes d'objets { lieuId }
  for (const cle of ['jeudi-sorties', 'jeudi-bofs']) {
    try {
      const v = JSON.parse(localStorage.getItem(cle) ?? '[]')
      if (Array.isArray(v)) {
        localStorage.setItem(
          cle,
          JSON.stringify(v.map((x) => (x && x.lieuId === ancien ? { ...x, lieuId: neuf } : x))),
        )
      }
    } catch {
      /* idem */
    }
  }
  // le cache d'adresse (+ son index de purge) suit le lieu
  const adr = localStorage.getItem(`jeudi-adr-${ancien}`)
  if (adr !== null) {
    localStorage.removeItem(`jeudi-adr-${ancien}`)
    localStorage.setItem(`jeudi-adr-${neuf}`, adr)
    try {
      const idx = JSON.parse(localStorage.getItem('jeudi-adr-index') ?? '[]')
      if (Array.isArray(idx) && idx.includes(ancien)) {
        localStorage.setItem(
          'jeudi-adr-index',
          JSON.stringify(idx.map((x) => (x === ancien ? neuf : x))),
        )
      }
    } catch {
      /* index illisible : la borne se refera toute seule */
    }
  }
}

/** écrit un de MES lieux au cloud (upsert = insert ou update, idempotent) et
 *  VÉRIFIE qu'au moins une ligne est revenue — 0 ligne (RLS muette) = échec.
 *  Tolère l'absence de la colonne `recos` tant que la migration 0003 n'est
 *  pas passée : retente UNE fois sans elle, avec un warn. */
async function pousserLieuCloud(lieu: Lieu): Promise<boolean> {
  let ligne = lieuVersLigne(lieu)
  for (let essai = 0; essai < 2; essai++) {
    const { data, error } = await supabase.from('lieux').upsert(ligne).select('id')
    if (!error) {
      if (Array.isArray(data) && data.length > 0) return true
      console.warn('[jeudi] écriture cloud : 0 ligne touchée (RLS ?)', lieu.id)
      return false
    }
    if (essai === 0 && /recos/i.test(error.message ?? '')) {
      console.warn('[jeudi] colonne `recos` absente en base (migration 0003 pas passée) — nouvel essai sans elle')
      ligne = { ...ligne }
      delete ligne.recos
      continue
    }
    console.warn('[jeudi] écriture cloud KO', lieu.id, error)
    return false
  }
  return false
}

export async function ajouterLieu(lieu: Lieu): Promise<void> {
  await pretAuth
  // 1) LOCAL D'ABORD, toujours : l'utilisateur ne perd JAMAIS un spot, même si
  //    le cloud tousse avec une session valide (avant : throw = spot perdu).
  const db = await getDB()
  await db.put('lieux', lieu)
  if (!monId) return // pas connecté : le spot vit en local (repli historique)
  // 2) id compatible cloud (colonne uuid) — les ids legacy sont réécrits
  const sur = await assurerUuid(lieu)
  // 3) push vérifié ; échec → file d'attente, rejouée au retour en ligne
  if (await pousserLieuCloud(sur)) {
    await syncPhotosLieu(sur)
  } else {
    enfiler('lieu-upsert', sur.id)
    console.warn('[jeudi] ajouterLieu : cloud KO — spot gardé en local, resync planifiée', sur.id)
  }
}

/** le spot est-il à moi ? (undefined = ancien spot d'avant le marqueur = mien) */
export function estAMoi(lieu: Lieu): boolean {
  // legacy (capture optimiste / anciens locaux) OU mes spots cloud (owner_id = moi)
  if (!lieu.proprietaire || lieu.proprietaire === 'moi') return true
  return monId != null && lieu.proprietaire === monId
}

/** le spot « complet » : au moins une photo ET un mot (la note) — c'est lui
 *  qui mérite le sceau de cire (la récompense du carnet, pas un badge).
 *  PUR (pas de notion de propriété ici : l'UI combine avec estAMoi). */
export function spotComplet(lieu: Pick<Lieu, 'photos' | 'note'>): boolean {
  return lieu.photos.length > 0 && lieu.note.trim() !== ''
}

/** adopter un spot du cercle : on en crée SA PROPRE copie privée. la voix
 *  d'origine reste dans tipsCercle ; ta note se vide pour que tu y mettes la tienne. */
export async function adopterLieu(lieu: Lieu): Promise<Lieu> {
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
    // on conserve la reco d'origine comme première voix du cercle — SANS
    // auteurId : la copie devient un héritage local assumé. Sinon la 1ʳᵉ
    // sync (mergerTipsLieu ne garde en héritage que les tips sans auteurId)
    // jetterait une voix réelle sans rien dire.
    tipsCercle: lieu.tipsCercle?.map((t) => {
      const heritage = { ...t }
      delete heritage.auteurId
      return heritage
    }),
  }
  await ajouterLieu(copie)
  return copie
}

export async function archiverLieu(id: string): Promise<void> {
  await pretAuth
  // le local d'abord (miroir + décor) : l'archivage est TOUJOURS visible
  const db = await getDB()
  const lieu = await db.get('lieux', id)
  if (lieu) await db.put('lieux', { ...lieu, statut: 'archive' })
  // côté cloud : uniquement mes spots (le décor est local par nature)
  const mien = lieu ? estAMoi(lieu) : true // inconnu en local → spot cloud probable
  if (!monId || !mien) return
  if (!estUuid(id)) return // id legacy : jamais poussé au cloud → rien à archiver là-haut
  const { data, error } = await supabase
    .from('lieux')
    .update({ statut: 'archive' })
    .eq('id', id)
    .eq('owner_id', monId)
    .select('id')
  // 0 ligne touchée N'EST PAS un succès (hors-ligne, RLS, spot jamais poussé…)
  if (error || !Array.isArray(data) || data.length === 0) {
    console.warn(
      '[jeudi] archiverLieu cloud KO — archivé en local, resync planifiée',
      id,
      error ?? '0 ligne',
    )
    enfiler('lieu-archive', id)
  }
}

/** suppression définitive — pas de retour en arrière */
export async function supprimerLieu(id: string): Promise<void> {
  await pretAuth
  const db = await getDB()
  const lieu = await db.get('lieux', id)
  const mien = lieu ? estAMoi(lieu) : true
  await db.delete('lieux', id) // le local part dans tous les cas
  if (!monId || !mien) return
  if (!estUuid(id)) {
    // id legacy : jamais poussé au cloud. On retire juste une éventuelle
    // resync en attente pour cet id, et c'est réglé.
    ecrireAttente(lireAttente().filter((t) => t.id !== id))
    return
  }
  const { data, error } = await supabase
    .from('lieux')
    .delete()
    .eq('id', id)
    .eq('owner_id', monId)
    .select('id')
  if (error) {
    console.warn(
      '[jeudi] supprimerLieu cloud KO — supprimé en local, resync planifiée',
      id,
      error,
    )
    enfiler('lieu-suppr', id)
    return
  }
  if (!Array.isArray(data) || data.length === 0) {
    // rien côté cloud (jamais poussé, ou déjà supprimé ailleurs) : acceptable
    // pour une suppression — on nettoie quand même le Storage par acquit.
    console.warn('[jeudi] supprimerLieu : 0 ligne côté cloud', id)
  }
  // une resync en attente pour ce lieu n'a plus d'objet
  ecrireAttente(lireAttente().filter((t) => t.id !== id))
  // le dossier Storage du lieu part aussi (best-effort, warn si KO)
  await nettoyerStorageLieu(id)
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
// ── le carnet éditorial fondateur : « jeudi. » ──
// tout le fond du seed (mes anciens spots google + curated + extra) est signé
// « jeudi. », comme si l'app était le premier éclaireur. proprietaire = 'jeudi'
// → estAMoi() renvoie false : ce carnet n'apparaît JAMAIS comme « à moi » chez
// un nouvel inscrit (avant, ces spots étaient 'moi' → faussement siens).
export const CURATEUR_JEUDI = 'jeudi'
export const NOM_JEUDI = 'jeudi.'

/** le nom AFFICHÉ d'un curateur depuis son id de propriété :
 *  'jeudi' → « jeudi. » (le fondateur) · un vrai membre → son prénom (fourni
 *  par l'appelant, seul à connaître le cercle) · sinon l'id brut en repli. */
export function nomCurateur(proprietaire?: string, prenomReel?: string | null): string {
  if (proprietaire === CURATEUR_JEUDI) return NOM_JEUDI
  return prenomReel ?? proprietaire ?? ''
}

// une teinte stable par curateur (déterministe sur le nom), partagée entre la
// carte (pins) et l'index (tampon de provenance) — même code couleur partout.
// pas de rouge cire (réservé à "toi").
const TEINTES = ['#6b8e9e', '#9e7a6b', '#7d9e6b', '#8e6b9e', '#9e9456', '#6b9e8c']
export function teinteCurateur(nom: string): string {
  // jeudi. — le fondateur : une teinte d'encre réservée, stable partout
  if (nom === NOM_JEUDI || nom === CURATEUR_JEUDI) return '#5f7a91'
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
// ── moteur de dérivation couleur (roue chromatique) ──
// la marque (`--red`) est la graine ; le reste se calcule par relation. Pour
// l'instant on dérive « moi » (le repère GPS) = le COMPLÉMENT vif (H+180°), pour
// qu'il contraste TOUJOURS, que la marque soit chaude (rouge cire) ou néon.
function hslDe(hex: string): { h: number; s: number; l: number } {
  let x = hex.replace('#', '')
  if (x.length === 3)
    x = x
      .split('')
      .map((c) => c + c)
      .join('')
  const r = parseInt(x.slice(0, 2), 16) / 255
  const g = parseInt(x.slice(2, 4), 16) / 255
  const b = parseInt(x.slice(4, 6), 16) / 255
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  const d = mx - mn
  let h = 0
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = (h * 60 + 360) % 360
  }
  const l = (mx + mn) / 2
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0
  return { h, s, l }
}

/** la couleur du repère « moi » : le complément vif de la couleur de marque.
 *  les lieux portent la couleur ; toi tu es son opposé sur la roue → contraste garanti. */
export function couleurMoi(hex: string): string {
  const { h } = hslDe(hex)
  const mh = Math.round((h + 180) % 360)
  return `hsl(${mh} 85% 58%)`
}

export function appliquerCouleur(c: string): void {
  const root = document.documentElement.style
  root.setProperty('--red', c)
  root.setProperty('--moi', couleurMoi(c)) // le repère GPS se dérive de la marque
}
export function ecrireCouleur(c: string): void {
  localStorage.setItem('jeudi-couleur', c)
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
export function ecrireSeuils(s: [number, number]): void {
  localStorage.setItem('jeudi-seuils', JSON.stringify(s))
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

// ── cache d'adresses reverse-geocodées, BORNÉ ──
// une entrée `jeudi-adr-<id>` par lieu + un index d'insertion `jeudi-adr-index`
// pour purger les plus anciennes au-delà de MAX_ADRESSES (localStorage n'est
// pas un puits sans fond).
const MAX_ADRESSES = 300
const CLE_ADR_INDEX = 'jeudi-adr-index'

function noterAdresse(id: string, adresse: string): void {
  localStorage.setItem(`jeudi-adr-${id}`, adresse)
  let index: string[]
  try {
    const v = JSON.parse(localStorage.getItem(CLE_ADR_INDEX) ?? '[]')
    index = Array.isArray(v) ? v : []
  } catch {
    index = []
  }
  index = index.filter((x) => x !== id)
  index.push(id)
  while (index.length > MAX_ADRESSES) {
    const vieux = index.shift()
    if (vieux) localStorage.removeItem(`jeudi-adr-${vieux}`)
  }
  localStorage.setItem(CLE_ADR_INDEX, JSON.stringify(index))
}

/** l'adresse COMPLÈTE (n° + rue, CP + ville) par reverse-geocoding des
 *  coordonnées. Passe par nominatim.ts (adresseDepuis) : file d'attente ~1 r/s,
 *  annulation et erreurs typées mutualisées — plus de fetch direct ici.
 *  Cache localStorage par lieu, borné (FIFO) à MAX_ADRESSES entrées. */
export async function reverseAdresse(id: string, lat: number, lng: number): Promise<string> {
  const cache = localStorage.getItem(`jeudi-adr-${id}`)
  if (cache !== null) return cache
  const r = await adresseDepuis(lat, lng)
  if (r.ok) {
    noterAdresse(id, r.adresse)
    return r.adresse
  }
  return '' // introuvable / réseau / annulé : l'appelant garde l'adresse stockée
}

/** un uuid v4 « à la main » pour les contextes sans crypto.randomUUID (HTTP
 *  sur IP locale). Math.random suffit ici : on veut l'unicité pratique, pas de
 *  la crypto. SURTOUT plus d'id maison (« id-… ») : la colonne uuid de
 *  Postgres les rejetait, et ces spots ne montaient jamais au cloud. */
function uuidV4Manuel(): string {
  let s = ''
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) s += '-'
    else if (i === 14) s += '4' // version 4
    else if (i === 19) s += (((Math.random() * 4) | 0) | 8).toString(16) // variante 8-b
    else s += ((Math.random() * 16) | 0).toString(16)
  }
  return s
}

export function nouvelId(): string {
  // crypto.randomUUID n'existe qu'en contexte sécurisé (HTTPS / localhost).
  // En HTTP sur IP locale (test depuis le tél), on bascule sur le fallback —
  // qui produit AUSSI un uuid v4 valide (compatible colonne uuid).
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      /* contexte non sécurisé : on tombe sur le fallback */
    }
  }
  return uuidV4Manuel()
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
  await pretAuth
  const db = await getDB()
  if (!monId || !estAMoi(lieu)) {
    // décor / pas connecté : le local est la seule vérité
    await db.put('lieux', lieu)
    return
  }
  // id compatible cloud (les spots seed « moi » ou legacy sont réécrits ici)
  const sur = await assurerUuid(lieu)
  await db.put('lieux', sur) // miroir local d'abord — l'édition n'est jamais perdue
  // upsert vérifié : couvre aussi le spot local jamais poussé (0 ligne à updater)
  if (await pousserLieuCloud(sur)) {
    await syncPhotosLieu(sur)
    return
  }
  // l'échec cloud n'est plus silencieux : gardé en local ET marqué à resynchroniser
  console.warn('[jeudi] majLieu : cloud KO — état gardé en local, resync planifiée', sur.id)
  enfiler('lieu-upsert', sur.id)
}

export async function lireLieu(id: string): Promise<Lieu | undefined> {
  try {
    await pretAuth
    if (monId && estUuid(id)) {
      const { data } = await supabase.from('lieux').select('*').eq('id', id).maybeSingle()
      if (data) {
        const lieu = ligneVersLieu(data)
        const photos = await chargerPhotos([id])
        lieu.photos = photos.get(id) ?? []
        // les autres voix : tips cloud devant l'héritage local (seed/adoption)
        // — SELECT `tips` KO (null) → on garde ce que le miroir sait déjà
        const db = await getDB()
        const local = await db.get('lieux', id)
        const tipsCloud = await chargerTipsCloud([id])
        if (tipsCloud) mergerTipsLieu(lieu, tipsCloud.get(id) ?? [], local)
        else lieu.tipsCercle = local?.tipsCercle
        return lieu
      }
    }
  } catch {
    /* repli local */
  }
  const db = await getDB()
  return db.get('lieux', id)
}

// ── le profil : source de vérité = Supabase (table profils), miroir local ──
// (étape 3, tranche 1) — le profil suit le compte sur tous les appareils.
// La photo (Blob) reste en IndexedDB tant que le Storage cloud (étape 4) n'est
// pas branché ; le local sert aussi de cache hors-ligne.
export async function lireProfil(): Promise<Profil | undefined> {
  const db = await getDB()
  const local = await db.get('profil', 'moi')
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profils').select('*').eq('id', user.id).maybeSingle()
      if (data) {
        // prefs d'appareil rapatriées du cloud (nouvel appareil) → localStorage
        if (data.couleur) {
          ecrireCouleur(data.couleur)
          appliquerCouleur(data.couleur)
        }
        if (Array.isArray(data.seuils) && data.seuils.length === 2) {
          ecrireSeuils([data.seuils[0], data.seuils[1]])
        }
        // le portrait : la base stocke un CHEMIN bucket (ou une vieille URL
        // publique d'avant 0003) → on renvoie une URL SIGNÉE, affichable direct
        let photoUrl: string | undefined
        if (typeof data.photo_url === 'string' && data.photo_url) {
          const chemin = cheminDepuis(data.photo_url)
          photoUrl = chemin ? ((await urlPhoto(chemin)) ?? undefined) : data.photo_url
        }
        return {
          scoreSwipe: data.score_swipe ?? local?.scoreSwipe ?? 50,
          critere: data.critere ?? local?.critere ?? 'le feeling',
          prenom: data.prenom ?? local?.prenom ?? 'toi',
          bio: data.bio ?? undefined,
          insta: data.insta ?? undefined,
          naissance: data.naissance ?? undefined,
          depuis: data.cree_le ?? local?.depuis,
          photo: local?.photo, // le blob local sert de cache hors-ligne
          photoUrl, // le portrait cloud signé (prioritaire à l'affichage)
        }
      }
    }
  } catch {
    /* hors-ligne : on retombe sur le cache local */
  }
  // hors-ligne : un photoUrl non affichable (chemin bucket nu, impossible à
  // signer sans réseau) est retiré → l'app retombe sur le blob local.
  if (local?.photoUrl && !/^(https?:|blob:|data:)/.test(local.photoUrl)) {
    return { ...local, photoUrl: undefined }
  }
  return local
}

/** sauvegarde en MERGE : ne touche que les clés PRÉSENTES (≠ undefined) dans
 *  `partiel`, en local comme au cloud. Avant : un appel partiel (ex. changer
 *  la photo) écrasait bio/insta/naissance partout — LE bug perte de données
 *  n°1. Un Profil complet reste un Partial<Profil> valide : les appels
 *  existants d'App.tsx / Onboarding.tsx passent tels quels. */
export async function sauverProfil(partiel: Partial<Profil>): Promise<void> {
  const db = await getDB()
  // 1) fusion locale : l'existant + les clés réellement fournies
  const existant = await db.get('profil', 'moi')
  const fourni: Partial<Profil> = {}
  for (const [k, v] of Object.entries(partiel)) {
    if (v !== undefined) (fourni as Record<string, unknown>)[k] = v
  }
  const fusion: Profil = {
    scoreSwipe: 50,
    critere: 'le feeling',
    prenom: 'toi',
    ...existant,
    ...fourni,
  }
  // le portrait cloud se stocke en CHEMIN (stable) dans le miroir local —
  // jamais une URL signée qui expirerait dans le cache
  if (fusion.photoUrl) {
    const chemin = cheminDepuis(fusion.photoUrl)
    if (chemin) fusion.photoUrl = chemin
  }
  await db.put('profil', fusion, 'moi') // miroir local (+ garde la photo Blob)
  // 2) cloud : UNIQUEMENT les clés du partiel (jamais d'écrasement du reste)
  try {
    await pretAuth
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const maj: Record<string, unknown> = {
      couleur: lireCouleur(), // prefs d'appareil : suivent toujours le compte
      seuils: lireSeuils(),
    }
    if (fourni.prenom !== undefined) maj.prenom = fourni.prenom
    if (fourni.critere !== undefined) maj.critere = fourni.critere
    if (fourni.scoreSwipe !== undefined) maj.score_swipe = fourni.scoreSwipe
    if (fourni.bio !== undefined) maj.bio = fourni.bio || null
    if (fourni.insta !== undefined) maj.insta = fourni.insta || null
    if (fourni.naissance !== undefined) maj.naissance = fourni.naissance || null
    if (fourni.photo) {
      // nouveau portrait → Storage ; la colonne stocke le CHEMIN (l'URL signée
      // se génère à la lecture — plus besoin du ?t= casse-cache CDN)
      const chemin = await televerserPhoto(fourni.photo, `${user.id}/profil.jpg`)
      if (chemin) maj.photo_url = chemin
    } else if (fourni.photoUrl) {
      const chemin = cheminDepuis(fourni.photoUrl)
      if (chemin) maj.photo_url = chemin // jamais une URL signée/blob: en base
    }
    const { error } = await supabase.from('profils').update(maj).eq('id', user.id)
    if (error) {
      console.warn('[jeudi] sauverProfil cloud KO — resync planifiée', error)
      enfiler('profil', 'moi')
    }
  } catch (e) {
    console.warn('[jeudi] sauverProfil hors-ligne — resync planifiée', e)
    enfiler('profil', 'moi')
  }
}

// ════════════════════════════════════════════════════════════════════
// ── le CERCLE RÉEL (chantier cercle, étape 5) ──
// Les vraies relations entre membres (table `relations`) remplacent la
// simulation. Post-0003 : une demande part TOUJOURS en statut 'demande'
// (de moi, jamais vers moi), et SEUL le destinataire accepte — le code
// ci-dessous écrit pour ce monde-là (compatible 0001 aussi).
// Realtime LÉGER : on recharge à l'ouverture et au retour de focus —
// pas de subscription websocket (ça, c'est l'étape 6).
// Écritures SANS write-queue : une demande d'ami ne se rejoue pas des
// heures après sans le dire → l'échec remonte en erreur VISIBLE (throw,
// message affichable tel quel). Lectures : repli sur un cache léger.
// ════════════════════════════════════════════════════════════════════

/** une demande d'ami reçue (relations.statut = 'demande', vers moi) */
export interface DemandeRecue {
  /** l'id du demandeur (relations.de_id) */
  deId: string
  prenom: string
  /** URL signée du portrait, si le membre en a un */
  photoUrl?: string
}

/** un membre de mon cercle réel (relation acceptée, peu importe le sens) */
export interface MembreCercle {
  id: string
  prenom: string
  critere?: string
  bio?: string
  insta?: string
  photoUrl?: string
}

/** ligne de la vue `profils_publics` — la vitrine, JAMAIS naissance/seuils */
interface LigneProfilPublic {
  id: string
  prenom: string | null
  critere: string | null
  bio: string | null
  insta: string | null
  photo_url: string | null
}

const CLE_CERCLE_CACHE = 'jeudi-cercle-cache'
const CLE_INVITE = 'jeudi-invite-attente'
// le domaine public de l'app : c'est LUI qui circule dans les invitations
const URL_APP = 'https://jeudi-seven.vercel.app'

/** signe le portrait d'un profil public (best-effort) */
async function portraitSigne(photoUrl: string | null): Promise<string | undefined> {
  if (!photoUrl) return undefined
  const chemin = cheminDepuis(photoUrl)
  if (!chemin) return /^https?:\/\//i.test(photoUrl) ? photoUrl : undefined
  return (await urlPhoto(chemin)) ?? undefined
}

/** lit la vitrine publique d'une liste d'ids → map id → ligne */
async function profilsPublics(ids: string[]): Promise<Map<string, LigneProfilPublic>> {
  const map = new Map<string, LigneProfilPublic>()
  if (!ids.length) return map
  const { data, error } = await supabase
    .from('profils_publics')
    .select('id,prenom,critere,bio,insta,photo_url')
    .in('id', ids)
  if (error) throw error
  for (const p of (data ?? []) as LigneProfilPublic[]) map.set(p.id, p)
  return map
}

/** cherche des membres par prénom (préfixe, insensible à la casse) — le
 *  geste « je te retrouve » façon annuaire : la vitrine `profils_publics`
 *  est lisible par tout connecté, on n'expose donc que ce qui l'est déjà.
 *  Jamais moi-même dans les résultats. < 2 lettres = rien (pas d'annuaire
 *  complet en une frappe). Hors-ligne / erreur : liste vide, sans casse. */
export async function chercherProfils(terme: string): Promise<MembreCercle[]> {
  await pretAuth
  const q = terme.trim()
  if (!monId || q.length < 2) return []
  try {
    const { data, error } = await supabase
      .from('profils_publics')
      .select('id,prenom,critere,bio,insta,photo_url')
      .ilike('prenom', `${q}%`)
      .neq('id', monId)
      .limit(20)
    if (error) throw error
    const membres: MembreCercle[] = []
    for (const p of (data ?? []) as LigneProfilPublic[]) {
      membres.push({
        id: p.id,
        prenom: p.prenom || 'membre',
        critere: p.critere ?? undefined,
        bio: p.bio ?? undefined,
        insta: p.insta ?? undefined,
        photoUrl: await portraitSigne(p.photo_url),
      })
    }
    return membres
  } catch (e) {
    console.warn('[jeudi] chercherProfils KO (hors-ligne ?)', e)
    return []
  }
}

/** les ids vers qui MA demande est partie et attend — pour que la recherche
 *  affiche « demandé ✓ » au lieu de reproposer le bouton. */
export async function demandesEnvoyees(): Promise<string[]> {
  await pretAuth
  if (!monId) return []
  try {
    const { data, error } = await supabase
      .from('relations')
      .select('vers_id')
      .eq('de_id', monId)
      .eq('statut', 'demande')
    if (error) throw error
    return ((data ?? []) as { vers_id: string }[]).map((r) => r.vers_id)
  } catch (e) {
    console.warn('[jeudi] demandesEnvoyees KO (hors-ligne ?)', e)
    return []
  }
}

/** envoie une demande d'ami. Post-0003 : l'insert part TOUJOURS en 'demande'.
 *  Erreurs PARLANTES — l'UI affiche le message tel quel. */
export async function envoyerDemande(versId: string): Promise<void> {
  await pretAuth
  if (!monId) throw new Error('connecte-toi d’abord.')
  if (versId === monId) throw new Error('c’est toi — pas besoin de demande.')
  if (!estUuid(versId)) throw new Error('lien d’invitation invalide.')
  const { error } = await supabase
    .from('relations')
    .insert({ de_id: monId, vers_id: versId, statut: 'demande' })
  if (error) {
    // 23505 = la paire existe déjà (mon sens, ou le sens inverse post-0003)
    if (error.code === '23505') throw new Error('déjà demandé — ou déjà dans ton cercle.')
    // 23503 = le profil visé n'existe pas (compte supprimé ?)
    if (error.code === '23503') throw new Error('ce compte n’existe plus.')
    console.warn('[jeudi] envoyerDemande KO', error)
    throw new Error('la demande n’est pas partie. réessaie.')
  }
}

/** les demandes reçues (vers moi, statut 'demande'), jointes à la vitrine.
 *  Hors-ligne / erreur : liste vide — une demande ratée réapparaît au
 *  prochain chargement, rien n'est perdu côté serveur. */
export async function demandesRecues(): Promise<DemandeRecue[]> {
  await pretAuth
  if (!monId) return []
  try {
    const { data, error } = await supabase
      .from('relations')
      .select('de_id')
      .eq('vers_id', monId)
      .eq('statut', 'demande')
    if (error) throw error
    const ids = ((data ?? []) as { de_id: string }[]).map((r) => r.de_id)
    const profils = await profilsPublics(ids)
    const demandes: DemandeRecue[] = []
    for (const id of ids) {
      const p = profils.get(id)
      demandes.push({
        deId: id,
        prenom: p?.prenom || 'quelqu’un',
        photoUrl: await portraitSigne(p?.photo_url ?? null),
      })
    }
    return demandes
  } catch (e) {
    console.warn('[jeudi] demandesRecues KO (hors-ligne ?)', e)
    return []
  }
}

/** accepte une demande. Post-0003, SEUL le destinataire (moi) le peut ;
 *  0 ligne touchée = échec visible (RLS muette, demande disparue…). */
export async function accepterDemande(deId: string): Promise<void> {
  await pretAuth
  if (!monId) throw new Error('connecte-toi d’abord.')
  const { data, error } = await supabase
    .from('relations')
    .update({ statut: 'accepte' })
    .eq('de_id', deId)
    .eq('vers_id', monId)
    .eq('statut', 'demande')
    .select('de_id')
  if (error || !Array.isArray(data) || data.length === 0) {
    console.warn('[jeudi] accepterDemande KO', deId, error ?? '0 ligne')
    throw new Error('l’acceptation n’est pas passée. réessaie.')
  }
}

/** refuse (supprime) une demande reçue. 0 ligne = déjà partie : pas grave. */
export async function refuserDemande(deId: string): Promise<void> {
  await pretAuth
  if (!monId) throw new Error('connecte-toi d’abord.')
  const { error } = await supabase
    .from('relations')
    .delete()
    .eq('de_id', deId)
    .eq('vers_id', monId)
    .eq('statut', 'demande')
  if (error) {
    console.warn('[jeudi] refuserDemande KO', deId, error)
    throw new Error('le refus n’est pas passé. réessaie.')
  }
}

/** mon cercle réel : les relations ACCEPTÉES, dans les deux sens, jointes à la
 *  vitrine publique. Lecture réussie → cache léger (identités SANS URLs
 *  signées, elles expirent) ; hors-ligne → on relit ce cache. */
export async function monCercle(): Promise<MembreCercle[]> {
  await pretAuth
  if (!monId) return []
  try {
    const { data, error } = await supabase
      .from('relations')
      .select('de_id,vers_id')
      .eq('statut', 'accepte')
      .or(`de_id.eq.${monId},vers_id.eq.${monId}`)
    if (error) throw error
    const lignes = (data ?? []) as { de_id: string; vers_id: string }[]
    const ids = [...new Set(lignes.map((r) => (r.de_id === monId ? r.vers_id : r.de_id)))].filter(
      (id) => id !== monId,
    )
    const profils = await profilsPublics(ids)
    const membres: MembreCercle[] = []
    for (const id of ids) {
      const p = profils.get(id)
      membres.push({
        id,
        prenom: p?.prenom || 'membre',
        critere: p?.critere ?? undefined,
        bio: p?.bio ?? undefined,
        insta: p?.insta ?? undefined,
        photoUrl: await portraitSigne(p?.photo_url ?? null),
      })
    }
    try {
      localStorage.setItem(
        CLE_CERCLE_CACHE,
        JSON.stringify(membres.map((m) => ({ ...m, photoUrl: undefined }))),
      )
    } catch {
      /* stockage plein : le cache attendra */
    }
    return membres
  } catch (e) {
    console.warn('[jeudi] monCercle KO — repli sur le cache', e)
    try {
      const v = JSON.parse(localStorage.getItem(CLE_CERCLE_CACHE) ?? '[]')
      return Array.isArray(v) ? (v as MembreCercle[]) : []
    } catch {
      return []
    }
  }
}

/** retire quelqu'un de mon cercle : la relation part, dans les deux sens
 *  (une seule ligne existe, mais on couvre les deux pour être sûr). */
export async function retirerDuCercle(id: string): Promise<void> {
  await pretAuth
  if (!monId) throw new Error('connecte-toi d’abord.')
  const { error } = await supabase
    .from('relations')
    .delete()
    .or(`and(de_id.eq.${monId},vers_id.eq.${id}),and(de_id.eq.${id},vers_id.eq.${monId})`)
  if (error) {
    console.warn('[jeudi] retirerDuCercle KO', id, error)
    throw new Error('le retrait n’est pas passé. réessaie.')
  }
  // le cache hors-ligne suit tout de suite
  try {
    const v = JSON.parse(localStorage.getItem(CLE_CERCLE_CACHE) ?? '[]')
    if (Array.isArray(v)) {
      localStorage.setItem(
        CLE_CERCLE_CACHE,
        JSON.stringify((v as MembreCercle[]).filter((m) => m.id !== id)),
      )
    }
  } catch {
    /* cache illisible : il se refera à la prochaine lecture */
  }
}

/** la vitrine publique d'UN membre (écran d'invitation). null = introuvable. */
export async function profilPublic(id: string): Promise<MembreCercle | null> {
  try {
    await pretAuth
    if (!monId || !estUuid(id)) return null
    const { data, error } = await supabase
      .from('profils_publics')
      .select('id,prenom,critere,bio,insta,photo_url')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null
    const p = data as LigneProfilPublic
    return {
      id: p.id,
      prenom: p.prenom || 'membre',
      critere: p.critere ?? undefined,
      bio: p.bio ?? undefined,
      insta: p.insta ?? undefined,
      photoUrl: await portraitSigne(p.photo_url),
    }
  } catch {
    return null
  }
}

// ── l'invitation par lien : LE canal de croissance ──────────────────
// Format : https://jeudi-seven.vercel.app/?invite=<monId> — la SPA lit le
// param au boot, le met de côté, et l'envoi part dès qu'on est connecté.

/** MON lien d'invitation (connecté requis) */
export function lienInvitation(): string {
  if (!monId) throw new Error('connecte-toi d’abord pour inviter.')
  return `${URL_APP}/?invite=${monId}`
}

/** parse le param ?invite= d'une query string → id (uuid) ou null.
 *  PUR (testable) : aucune lecture d'état, que la chaîne fournie. */
export function extraireInvite(search: string): string | null {
  try {
    const id = (new URLSearchParams(search).get('invite') ?? '').trim()
    return estUuid(id) ? id : null
  } catch {
    return null
  }
}

/** au boot : capte ?invite=<id>, le met de côté (localStorage) et NETTOIE
 *  l'URL aussitôt. Consommé par traiterInviteAttente() une fois connecté —
 *  y compris après un premier login plus tard (l'écran Auth ne change pas). */
export function capterInvite(): void {
  const id = extraireInvite(window.location.search)
  if (!id) return
  localStorage.setItem(CLE_INVITE, id)
  try {
    const url = new URL(window.location.href)
    url.searchParams.delete('invite')
    history.replaceState(null, '', url.pathname + url.search + url.hash)
  } catch {
    /* URL illisible : tant pis, l'invite est captée quand même */
  }
}

/** connecté : consomme l'invite en attente → envoie la demande et rend le
 *  PRÉNOM de l'inviteur (pour le bandeau d'accueil). null = rien à faire. */
export async function traiterInviteAttente(): Promise<string | null> {
  await pretAuth
  if (!monId) return null
  const id = localStorage.getItem(CLE_INVITE)
  if (!id) return null
  if (!estUuid(id) || id === monId) {
    // s'auto-inviter / lien cassé : on jette sans bruit
    localStorage.removeItem(CLE_INVITE)
    return null
  }
  try {
    await envoyerDemande(id)
  } catch (e) {
    if (!/déjà/.test((e as Error).message ?? '')) {
      // vrai échec (réseau…) : on GARDE l'invite pour le prochain boot —
      // et on ne dit rien de faux (pas de bandeau « c'est parti »)
      console.warn('[jeudi] invite en attente non envoyée', e)
      return null
    }
    // « déjà demandé / déjà potes » : l'invite est consommée quand même
  }
  localStorage.removeItem(CLE_INVITE)
  const p = await profilPublic(id)
  return p?.prenom ?? null
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
/** « oublie tout » : efface les sorties en attente de validation */
export function viderSorties(): void {
  localStorage.removeItem('jeudi-sorties')
}

// ════════════════════════════════════════════════════════════════════
// ── préférences & état local (chantier 6, étape 2b) ──
// db.ts est le SEUL point d'accès au stockage : tout le reste de l'app passe
// par ces helpers, jamais par localStorage en direct. C'est le prérequis pour
// remplacer IndexedDB/localStorage par Supabase derrière la même frontière.
// ════════════════════════════════════════════════════════════════════

// la ville active (legacy : jeudi est désormais location-native, le « centre »
// suit le GPS. gardé pour compat, plus utilisé comme réglage.)
export function lireVille(): string {
  return localStorage.getItem('jeudi-ville') || 'paris'
}

// où tu es : le nom de la ville/commune déduit de tes coordonnées (GPS).
// jeudi te suit partout — Paris, Annecy, n'importe où. best-effort.
export async function villeDeCoords(
  lat = maPosition.lat,
  lng = maPosition.lng,
): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`
    const r = await fetch(url, { headers: { 'Accept-Language': 'fr' } })
    const a = ((await r.json())?.address ?? {}) as Record<string, string>
    return a.city || a.town || a.village || a.municipality || a.county || ''
  } catch {
    return ''
  }
}

// la météo du porte-monnaie choisie au deck (soleil/nuageux/pluie)
export function lireMeteo(): Meteo {
  return (localStorage.getItem('jeudi-meteo') as Meteo) || 'nuageux'
}
export function ecrireMeteo(m: Meteo): void {
  localStorage.setItem('jeudi-meteo', m)
}

// les lieux déjà consultés (halo « déjà vu » sur la carte)
export function lireVus(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem('jeudi-vus') ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
export function ecrireVus(ids: string[]): void {
  localStorage.setItem('jeudi-vus', JSON.stringify(ids))
}

// l'accueil (onboarding) : fait ou pas
export function onboardingFait(): boolean {
  return !!localStorage.getItem('jeudi-onboard')
}
export function marquerOnboarding(): void {
  localStorage.setItem('jeudi-onboard', 'fait')
}
export function reinitOnboarding(): void {
  localStorage.removeItem('jeudi-onboard')
}

// ── l'import Google : fait ? sinon, relance douce ───────────────
// Le signal « import fait » ne se stocke pas : il se LIT dans les données
// (un spot à moi avec source 'google' = l'import a eu lieu, sur n'importe
// quel appareil). La relance, elle, est locale : tous les 7 jours, 3 fois
// maximum, coupée net au premier import réussi.
const CLE_RELANCE_IMPORT = 'jeudi-relance-import' // JSON { dernier, compteur }
const JOURS_RELANCE_IMPORT = 7
const MAX_RELANCES_IMPORT = 3

export function importGoogleFait(lieux: Lieu[]): boolean {
  return lieux.some((l) => estAMoi(l) && l.source === 'google')
}
export function doitRelancerImport(): boolean {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_RELANCE_IMPORT) ?? 'null') as {
      dernier: string
      compteur: number
    } | null
    if (!v) return true // jamais relancé
    if (v.compteur >= MAX_RELANCES_IMPORT) return false
    return Date.now() - new Date(v.dernier).getTime() > JOURS_RELANCE_IMPORT * 86_400_000
  } catch {
    return true
  }
}
export function marquerRelanceImport(): void {
  let compteur = 0
  try {
    compteur =
      (JSON.parse(localStorage.getItem(CLE_RELANCE_IMPORT) ?? 'null') as { compteur?: number } | null)
        ?.compteur ?? 0
  } catch {
    /* illisible : on repart de zéro */
  }
  localStorage.setItem(
    CLE_RELANCE_IMPORT,
    JSON.stringify({ dernier: new Date().toISOString(), compteur: compteur + 1 }),
  )
}
export function couperRelanceImport(): void {
  localStorage.setItem(
    CLE_RELANCE_IMPORT,
    JSON.stringify({ dernier: new Date().toISOString(), compteur: MAX_RELANCES_IMPORT }),
  )
}

// la tagline du profil (« le roi du dernier verre »)
export function lireTagline(): string {
  return localStorage.getItem('jeudi-tagline') || ''
}
export function ecrireTagline(s: string): void {
  localStorage.setItem('jeudi-tagline', s)
}

// les curateurs suivis, choisis à l'onboarding
export function lireSuivis(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem('jeudi-suivis') ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
export function ecrireSuivis(noms: string[]): void {
  localStorage.setItem('jeudi-suivis', JSON.stringify(noms))
}

// les lieux signalés (flag « on vérifie »)
export function lireSignales(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem('jeudi-signales') ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
export function signalerLieu(id: string): void {
  const liste = lireSignales()
  if (!liste.includes(id)) liste.push(id)
  localStorage.setItem('jeudi-signales', JSON.stringify(liste))
}

// un « bof » reste du signal : on l'archive (lieuId + date ISO)
export function ajouterBof(lieuId: string): void {
  let bofs: { lieuId: string; date: string }[]
  try {
    bofs = JSON.parse(localStorage.getItem('jeudi-bofs') ?? '[]')
    if (!Array.isArray(bofs)) bofs = []
  } catch {
    bofs = []
  }
  bofs.push({ lieuId, date: new Date().toISOString() })
  // borné à 200 entrées (FIFO) : les plus vieux « bof » sortent
  if (bofs.length > 200) bofs = bofs.slice(-200)
  localStorage.setItem('jeudi-bofs', JSON.stringify(bofs))
}

// « effacer mes données » : vide toutes les clés jeudi-* + la base IndexedDB.
// ASYNC : le deleteDatabase est ATTENDU via ses callbacks — avant, un reload
// immédiat derrière l'appel pouvait couper la suppression en plein vol.
export async function effacerTout(): Promise<void> {
  // le balayage par préfixe couvre AUSSI `jeudi-marques` (les marques émoji,
  // marques.ts) — testé : la clé reste dans la famille jeudi-*.
  Object.keys(localStorage)
    .filter((k) => k.startsWith('jeudi-'))
    .forEach((k) => localStorage.removeItem(k))
  // fermer NOTRE connexion d'abord, sinon deleteDatabase reste bloqué
  if (dbPromise) {
    try {
      ;(await dbPromise).close()
    } catch {
      /* connexion déjà fermée / jamais ouverte */
    }
    dbPromise = null
  }
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('jeudi')
    req.onsuccess = () => resolve()
    req.onerror = () => {
      console.warn('[jeudi] deleteDatabase KO', req.error)
      resolve()
    }
    req.onblocked = () => {
      // un autre onglet retient la base : elle partira à sa fermeture
      console.warn('[jeudi] deleteDatabase bloqué (autre onglet ouvert ?)')
      resolve()
    }
  })
}

// ── RGPD (chantier 6, étape 5) ─────────────────────────────────
/** le droit à l'oubli : rpc supprimer_mon_compte() (tout part en cascade côté
 *  serveur, Storage compris — cf. migration 0003), puis déconnexion et
 *  effacement local COMPLET. Throw si le serveur refuse : l'UI doit prévenir,
 *  pas faire semblant. */
export async function supprimerMonCompte(): Promise<void> {
  const { error } = await supabase.rpc('supprimer_mon_compte')
  if (error) throw error
  try {
    // scope local : le compte n'existe plus côté serveur, inutile de l'appeler
    await supabase.auth.signOut({ scope: 'local' })
  } catch (e) {
    console.warn('[jeudi] signOut après suppression du compte', e)
  }
  await effacerTout()
}

// lecture brute d'une clé locale JSON — pour l'export : criteres.ts et
// cercle.ts possèdent ces clés mais importent déjà db.ts (pas d'import croisé)
function lireJsonLocal(cle: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(cle) ?? '[]')
  } catch {
    return []
  }
}

/** portabilité : tout ce que jeudi sait de toi, en un objet JSON sérialisable
 *  (l'UI d'App.tsx le télécharge). Les blobs photo (non sérialisables) sont
 *  omis ; les photos cloud sortent en URLs. */
export async function exporterMesDonnees(): Promise<Record<string, unknown>> {
  const [profil, lieux] = await Promise.all([lireProfil(), tousLesLieux()])
  const miens = lieux
    .filter((l) => estAMoi(l))
    .map((l) => ({
      ...l,
      photos: (l.photos ?? []).filter((p) => !!p.url).map((p) => ({ type: p.type, url: p.url })),
    }))
  return {
    exporteLe: new Date().toISOString(),
    profil: profil ? { ...profil, photo: undefined } : null,
    lieux: miens,
    sorties: sortiesEnAttente(),
    favoris: lireFavoris(),
    vus: lireVus(),
    suivis: lireSuivis(),
    signales: lireSignales(),
    comparer: lireComparer(),
    marques: lireMarques(), // les émojis posés sur les lieux (jeudi-marques)
    tagline: lireTagline(),
    couleur: lireCouleur(),
    seuils: lireSeuils(),
    // les clés locales des autres modules (criteres.ts / cercle.ts) + les bofs
    criteres: lireJsonLocal('jeudi-criteres'),
    proches: lireJsonLocal('jeudi-proches'),
    bofs: lireJsonLocal('jeudi-bofs'),
  }
}

// ── au retour en ligne : rejouer la file d'attente (best-effort) ──
// posé au chargement du module, une seule fois — db.ts est un singleton.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void rejouerAttente()
  })
}
