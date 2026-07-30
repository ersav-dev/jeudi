// ════════════════════════════════════════════════════════════════
// jeudi. — SEUL point d'accès Nominatim — db.ts et App.tsx migreront dessus.
// Politique d'usage OSM oblige : au plus ~1 requête/seconde, identifiée, en fr.
// - FILE D'ATTENTE : min 1,1 s entre deux requêtes, quelle que soit l'origine
// - un AbortController par TYPE d'appel (search / reverse) : l'appel suivant
//   annule le précédent du même type (frappe rapide → une seule réponse utile)
// - erreurs TYPÉES : les appelants ne voient jamais un throw, seulement
//   { ok: false, raison: 'introuvable' | 'reseau' | 'annule' }
// ════════════════════════════════════════════════════════════════

const BASE = 'https://nominatim.openstreetmap.org'
const EMAIL = 'contact@ersanmusa.com' // requêtes identifiées (politique d'usage)
const INTERVALLE_MS = 1100

// le biais géographique par défaut : l'Île-de-France (lng ouest, lat nord,
// lng est, lat sud). biais, pas clôture : pas de bounded=1.
const VIEWBOX_IDF = '1.45,49.25,3.56,48.12'

export type RaisonEchec = 'introuvable' | 'reseau' | 'annule'

export interface AdresseTrouvee {
  nom: string
  adresse: string
  lat: number
  lng: number
}

export type RetourRecherche =
  | { ok: true; lieux: AdresseTrouvee[] }
  | { ok: false; raison: RaisonEchec }

export type RetourReverse =
  | { ok: true; adresse: string }
  | { ok: false; raison: RaisonEchec }

// ── la file d'attente : min 1,1 s entre deux tirs, tous appels confondus ──
let file: Promise<void> = Promise.resolve()
let dernierTir = 0
function attendreSonTour(): Promise<void> {
  const tour = file.then(async () => {
    const reste = dernierTir + INTERVALLE_MS - Date.now()
    if (reste > 0) await new Promise((r) => setTimeout(r, reste))
    dernierTir = Date.now()
  })
  file = tour
  return tour
}

// ── un contrôleur par type d'appel : le suivant annule le précédent ──
type TypeAppel = 'search' | 'reverse'
const controleurs: Partial<Record<TypeAppel, AbortController>> = {}

async function appeler(
  type: TypeAppel,
  url: string,
): Promise<{ ok: true; data: unknown } | { ok: false; raison: RaisonEchec }> {
  controleurs[type]?.abort()
  const ctl = new AbortController()
  controleurs[type] = ctl

  await attendreSonTour()
  // annulé pendant l'attente de son tour (un appel plus récent est passé devant)
  if (ctl.signal.aborted) return { ok: false, raison: 'annule' }

  try {
    const r = await fetch(url, { signal: ctl.signal })
    if (!r.ok) return { ok: false, raison: 'reseau' }
    let data: unknown
    try {
      data = await r.json()
    } catch {
      return { ok: false, raison: 'reseau' } // réponse illisible = réseau qui déraille
    }
    return { ok: true, data }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { ok: false, raison: 'annule' }
    }
    return { ok: false, raison: 'reseau' }
  }
}

/** géocodage texte → point(s). biais Île-de-France par défaut, ou autour d'un
 *  point donné (viewbox ±0,1° comme la recherche d'adresse actuelle d'App.tsx). */
export async function chercherAdresse(
  texte: string,
  options: { autour?: { lat: number; lng: number }; limite?: number } = {},
): Promise<RetourRecherche> {
  const q = texte.trim()
  if (!q) return { ok: false, raison: 'introuvable' }

  const limite = options.limite ?? 1
  const viewbox = options.autour
    ? `${options.autour.lng - 0.1},${options.autour.lat + 0.1},${options.autour.lng + 0.1},${options.autour.lat - 0.1}`
    : VIEWBOX_IDF
  const url =
    `${BASE}/search?format=json&limit=${limite}&countrycodes=fr&accept-language=fr` +
    `&email=${EMAIL}&viewbox=${viewbox}&q=${encodeURIComponent(q)}`

  const r = await appeler('search', url)
  if (!r.ok) return r

  const brut = Array.isArray(r.data) ? (r.data as Record<string, unknown>[]) : []
  const lieux: AdresseTrouvee[] = []
  for (const d of brut) {
    const lat = parseFloat(String(d.lat))
    const lng = parseFloat(String(d.lon))
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue // garde NaN : on jette
    const affichage = typeof d.display_name === 'string' ? d.display_name : ''
    const nom = typeof d.name === 'string' && d.name ? d.name : affichage.split(',')[0] || q
    lieux.push({ nom, adresse: affichage, lat, lng })
  }
  if (!lieux.length) return { ok: false, raison: 'introuvable' }
  return { ok: true, lieux }
}

/** reverse : coordonnées → adresse lisible (« 12 Rue Daunou, 75002 Paris »).
 *  même format que le reverseAdresse historique de db.ts, pour la migration. */
export async function adresseDepuis(lat: number, lng: number): Promise<RetourReverse> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false, raison: 'introuvable' }

  const url =
    `${BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1` +
    `&accept-language=fr&email=${EMAIL}`
  const r = await appeler('reverse', url)
  if (!r.ok) return r

  const a =
    r.data && typeof r.data === 'object'
      ? (((r.data as Record<string, unknown>).address ?? {}) as Record<string, string>)
      : {}
  const num = a.house_number ? `${a.house_number} ` : ''
  const rue = a.road || a.pedestrian || a.footway || a.square || ''
  const cp = a.postcode || ''
  const ville = a.city || a.town || a.village || a.municipality || a.suburb || ''
  const adresse =
    `${num}${rue}${rue && (cp || ville) ? ', ' : ''}${cp}${cp && ville ? ' ' : ''}${ville}`.trim()
  if (!adresse) return { ok: false, raison: 'introuvable' }
  return { ok: true, adresse }
}
