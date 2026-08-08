// ════════════════════════════════════════════════════════════════
// jeudi. — LA MOISSON TAKEOUT : tout ce que Google sait rendre.
// Google éparpille les adresses d'un membre dans DEUX exports :
//   · « Maps (vos adresses) » → Saved Places.json (GeoJSON, AVEC
//     coordonnées) — les étoiles et lieux enregistrés ;
//   · « Saved » → un CSV PAR LISTE (Favoris, Envie d'y aller…),
//     SANS coordonnées — juste Title / Note / URL.
// Ici on accepte TOUT : le .zip Takeout entier, le .json seul, les
// .csv un par un. Ce module est PUR (parsing seulement, testable) —
// le géocodage des CSV sans coordonnées et l'écriture en base se
// font dans ImportGoogle.tsx / db.ts.
// ════════════════════════════════════════════════════════════════
import { unzipSync } from 'fflate'

/** une adresse moissonnée, prête à devenir un Lieu (coords parfois à
 *  retrouver par géocodage — c'est le chantier de l'appelant) */
export interface EntreeImport {
  nom: string
  note: string
  lat?: number
  lng?: number
  adresse?: string
  /** l'URL Google Maps d'origine (source possible de coordonnées) */
  url?: string
}

/** une liste « Saved » de Google (Favoris, Envie d'y aller…) — la
 *  future CATÉGORIE : l'utilisateur la rangera vers des envies/favoris */
export interface ListeImport {
  nom: string
  entrees: EntreeImport[]
}

export interface Moisson {
  /** Saved Places.json — coordonnées incluses */
  spots: EntreeImport[]
  /** les listes CSV — coordonnées à retrouver */
  listes: ListeImport[]
  /** fichiers ni json ni csv reconnus (on le DIT, jamais de rejet muet) */
  ignores: string[]
}

// ── GeoJSON : les deux variantes vues dans la nature ────────────
interface TakeoutFeature {
  geometry?: { coordinates?: number[] }
  properties?: {
    Title?: string
    Comment?: string
    Location?: {
      'Business Name'?: string
      Address?: string
      Geo?: { coordinates?: number[] }
    }
  }
}

/** parse un Saved Places.json → entrées AVEC coordonnées.
 *  null si le JSON n'est pas une FeatureCollection reconnaissable. */
export function parserGeoJson(json: unknown): EntreeImport[] | null {
  const fc = json as { features?: TakeoutFeature[] }
  if (!fc || !Array.isArray(fc.features)) return null
  const entrees: EntreeImport[] = []
  for (const f of fc.features) {
    const props = f.properties ?? {}
    const coords = f.geometry?.coordinates ?? props.Location?.Geo?.coordinates
    const nom = props.Title || props.Location?.['Business Name']
    if (!coords || coords.length < 2 || !nom) continue
    entrees.push({
      nom,
      note: props.Comment ?? '',
      // GeoJSON : [lng, lat]
      lng: coords[0],
      lat: coords[1],
      adresse: props.Location?.Address,
    })
  }
  return entrees
}

// ── CSV : un parseur RFC 4180 minimal (guillemets, virgules,
//    retours à la ligne DANS les champs, CRLF) ───────────────────
export function parserCsv(texte: string): string[][] {
  const lignes: string[][] = []
  let champ = ''
  let ligne: string[] = []
  let entreGuillemets = false
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i]
    if (entreGuillemets) {
      if (c === '"') {
        if (texte[i + 1] === '"') {
          champ += '"'
          i++
        } else {
          entreGuillemets = false
        }
      } else {
        champ += c
      }
    } else if (c === '"') {
      entreGuillemets = true
    } else if (c === ',') {
      ligne.push(champ)
      champ = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texte[i + 1] === '\n') i++
      ligne.push(champ)
      champ = ''
      lignes.push(ligne)
      ligne = []
    } else {
      champ += c
    }
  }
  if (champ !== '' || ligne.length) {
    ligne.push(champ)
    lignes.push(ligne)
  }
  // les lignes entièrement vides ne comptent pas
  return lignes.filter((l) => l.some((v) => v.trim() !== ''))
}

// ── les coordonnées cachées dans une URL Google Maps ────────────
// Trois cachettes connues : `!3d<lat>!4d<lng>` (données du lieu),
// `@lat,lng` (position de la carte) et `q=lat,lng` / `ll=lat,lng`.
export function coordsDepuisUrl(url: string | undefined): { lat: number; lng: number } | null {
  if (!url) return null
  const essais: [RegExp, number, number][] = [
    [/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, 1, 2],
    [/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, 1, 2],
    [/[?&](?:q|ll)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, 1, 2],
  ]
  for (const [re, iLat, iLng] of essais) {
    const m = url.match(re)
    if (!m) continue
    const lat = parseFloat(m[iLat])
    const lng = parseFloat(m[iLng])
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180)
      return { lat, lng }
  }
  return null
}

/** parse un CSV de liste « Saved » → la liste nommée d'après le
 *  fichier (« Envie d'y aller.csv » → « Envie d'y aller »).
 *  null si l'en-tête ne ressemble pas à une liste Google. */
export function parserListeCsv(nomFichier: string, texte: string): ListeImport | null {
  const lignes = parserCsv(texte)
  if (lignes.length < 1) return null
  const tete = lignes[0].map((c) => c.trim().toLowerCase())
  const iTitre = tete.indexOf('title')
  if (iTitre < 0) return null // pas une liste Google
  const iNote = tete.indexOf('note')
  const iUrl = tete.indexOf('url')
  const iComment = tete.indexOf('comment')
  const entrees: EntreeImport[] = []
  for (const l of lignes.slice(1)) {
    const nom = (l[iTitre] ?? '').trim()
    if (!nom) continue
    const url = iUrl >= 0 ? (l[iUrl] ?? '').trim() : undefined
    const note =
      ((iNote >= 0 ? l[iNote] : '') || (iComment >= 0 ? l[iComment] : '') || '').trim()
    const coords = coordsDepuisUrl(url)
    entrees.push({ nom, note, url: url || undefined, ...(coords ?? {}) })
  }
  const nomListe = (nomFichier.split('/').pop() ?? nomFichier).replace(/\.csv$/i, '').trim()
  return { nom: nomListe || 'liste', entrees }
}

// ── la moisson : on donne des fichiers, on récolte tout ─────────
export interface FichierFourni {
  nom: string
  /** texte pour .json/.csv, octets pour .zip */
  contenu: string | Uint8Array
}

const decodeur = new TextDecoder()

/** avale .zip / .json / .csv dans n'importe quel ordre et n'importe
 *  quelle quantité. Ne jette jamais : l'illisible finit en `ignores`. */
export function moissonner(fichiers: FichierFourni[]): Moisson {
  const moisson: Moisson = { spots: [], listes: [], ignores: [] }

  const avalerTexte = (nom: string, texte: string) => {
    if (/\.json$/i.test(nom)) {
      try {
        const spots = parserGeoJson(JSON.parse(texte))
        if (spots) {
          moisson.spots.push(...spots)
          return
        }
      } catch {
        /* pas un JSON lisible → ignoré, dit plus bas */
      }
      moisson.ignores.push(nom)
    } else if (/\.csv$/i.test(nom)) {
      const liste = parserListeCsv(nom, texte)
      if (liste && liste.entrees.length) moisson.listes.push(liste)
      else moisson.ignores.push(nom)
    } else {
      moisson.ignores.push(nom)
    }
  }

  for (const f of fichiers) {
    if (/\.zip$/i.test(f.nom) && f.contenu instanceof Uint8Array) {
      try {
        const dedans = unzipSync(f.contenu)
        for (const [chemin, octets] of Object.entries(dedans)) {
          if (!/\.(json|csv)$/i.test(chemin)) continue // dossiers, html d'accueil…
          avalerTexte(chemin, decodeur.decode(octets))
        }
      } catch {
        moisson.ignores.push(f.nom)
      }
    } else if (typeof f.contenu === 'string') {
      avalerTexte(f.nom, f.contenu)
    } else {
      moisson.ignores.push(f.nom)
    }
  }

  // deux listes du même nom (zip + csv seul) : on fusionne
  const parNom = new Map<string, ListeImport>()
  for (const l of moisson.listes) {
    const deja = parNom.get(l.nom)
    if (deja) deja.entrees.push(...l.entrees)
    else parNom.set(l.nom, l)
  }
  moisson.listes = [...parNom.values()]
  return moisson
}

/** combien d'entrées de listes devront passer par le géocodage
 *  (aucune coordonnée trouvée dans l'URL) — pour annoncer la durée */
export function aGeocoder(listes: ListeImport[]): number {
  return listes.reduce((n, l) => n + l.entrees.filter((e) => e.lat == null).length, 0)
}
