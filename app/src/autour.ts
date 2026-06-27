// ════════════════════════════════════════════════════════════════
// jeudi. — « AUTOUR DE » : chercher depuis un point choisi
// Le geste « pull / intention précise » : pas « ma position » par défaut,
// mais un repère que TU choisis — un métro, une gare, un quartier, une adresse.
// Change le centre de calcul des distances (distanceM accepte déjà `depuis`).
// Pur logique + un géocodage Nominatim. Isolé.
// ════════════════════════════════════════════════════════════════
import { type Lieu, maPosition, distanceM } from './db'

export interface Repere {
  nom: string
  lat: number
  lng: number
}

// « ma position » comme repère (live binding)
export function repereMaPosition(): Repere {
  return { nom: 'ma position', lat: maPosition.lat, lng: maPosition.lng }
}

// quelques repères parisiens bien connus → dispo instantanément, sans réseau
export const POINTS_REPERE: Repere[] = [
  { nom: 'Châtelet', lat: 48.8584, lng: 2.3470 },
  { nom: 'Bastille', lat: 48.8532, lng: 2.3692 },
  { nom: 'République', lat: 48.8675, lng: 2.3636 },
  { nom: 'Canal St-Martin', lat: 48.8715, lng: 2.3650 },
  { nom: 'Pigalle', lat: 48.8821, lng: 2.3375 },
  { nom: 'Gare de Lyon', lat: 48.8443, lng: 2.3743 },
  { nom: 'Nation', lat: 48.8483, lng: 2.3958 },
  { nom: 'Montmartre', lat: 48.8867, lng: 2.3431 },
]

// géocodage texte → point (Nominatim, biaisé sur l'Île-de-France).
// best-effort : renvoie null si rien / hors-ligne.
export async function geocoderRepere(texte: string): Promise<Repere | null> {
  const q = texte.trim()
  if (!q) return null
  try {
    const url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr' +
      '&viewbox=2.10,49.00,2.55,48.70&bounded=1&q=' +
      encodeURIComponent(q)
    const r = await fetch(url, { headers: { 'Accept-Language': 'fr' } })
    const data = (await r.json()) as { lat: string; lon: string; display_name: string }[]
    if (!data?.length) return null
    const d = data[0]
    return {
      nom: q,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }
  } catch {
    return null
  }
}

/** classe les lieux par distance croissante depuis un repère (avec la distance) */
export function classerAutour(lieux: Lieu[], depuis: Repere): { lieu: Lieu; distance: number }[] {
  return lieux
    .map((lieu) => ({ lieu, distance: distanceM(lieu, depuis) }))
    .sort((a, b) => a.distance - b.distance)
}
