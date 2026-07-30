// ════════════════════════════════════════════════════════════════
// jeudi. — « AUTOUR DE » : chercher depuis un point choisi
// Le geste « pull / intention précise » : pas « ma position » par défaut,
// mais un repère que TU choisis — un métro, une gare, un quartier, une adresse.
// Change le centre de calcul des distances (distanceM accepte déjà `depuis`).
// Pur logique + un géocodage via nominatim.ts (le seul point d'accès OSM).
// ════════════════════════════════════════════════════════════════
import { type Lieu, maPosition, distanceM } from './db'
import { chercherAdresse } from './nominatim'

export interface Repere {
  nom: string
  lat: number
  lng: number
}

// « ma position » comme repère (live binding)
export function repereMaPosition(): Repere {
  return { nom: 'ma position', lat: maPosition.lat, lng: maPosition.lng }
}

// les repères parisiens → dispo instantanément, sans réseau. TOUT Paris :
// chaque repère est aussi une zone du croquis (croquisZones.ts) — les deux
// listes vivent ensemble, le test croquis.test.ts garantit la correspondance.
export const POINTS_REPERE: Repere[] = [
  { nom: 'Châtelet', lat: 48.8584, lng: 2.3470 },
  { nom: 'Le Marais', lat: 48.857, lng: 2.361 },
  { nom: 'Bastille', lat: 48.8532, lng: 2.3692 },
  { nom: 'République', lat: 48.8675, lng: 2.3636 },
  { nom: 'Canal St-Martin', lat: 48.8715, lng: 2.3650 },
  { nom: 'Belleville', lat: 48.872, lng: 2.377 },
  { nom: 'Opéra', lat: 48.871, lng: 2.332 },
  { nom: 'Pigalle', lat: 48.8821, lng: 2.3375 },
  { nom: 'Montmartre', lat: 48.8867, lng: 2.3431 },
  { nom: 'La Villette', lat: 48.889, lng: 2.382 },
  { nom: 'Batignolles', lat: 48.8865, lng: 2.308 },
  { nom: 'Champs-Élysées', lat: 48.8698, lng: 2.3076 },
  { nom: 'Tour Eiffel', lat: 48.8584, lng: 2.2945 },
  { nom: 'Passy', lat: 48.8575, lng: 2.2765 },
  { nom: 'Saint-Germain', lat: 48.8535, lng: 2.333 },
  { nom: 'Quartier Latin', lat: 48.845, lng: 2.347 },
  { nom: 'Montparnasse', lat: 48.842, lng: 2.329 },
  { nom: 'Le 15e', lat: 48.84, lng: 2.296 },
  { nom: 'Butte-aux-Cailles', lat: 48.8265, lng: 2.3495 },
  { nom: 'Gare de Lyon', lat: 48.8443, lng: 2.3743 },
  { nom: 'Nation', lat: 48.8483, lng: 2.3958 },
]

// géocodage texte → point (partout en France — jeudi te suit où tu es).
// passe par nominatim.ts (file d'attente + annulation). best-effort : renvoie
// null si rien / hors-ligne — les appelants qui veulent le DÉTAIL de l'échec
// (introuvable ? réseau ?) utilisent chercherAdresse directement.
export async function geocoderRepere(texte: string): Promise<Repere | null> {
  const q = texte.trim()
  if (!q) return null
  const r = await chercherAdresse(q)
  if (!r.ok) return null
  return { nom: q, lat: r.lieux[0].lat, lng: r.lieux[0].lng }
}

/** classe les lieux par distance croissante depuis un repère (avec la distance) */
export function classerAutour(lieux: Lieu[], depuis: Repere): { lieu: Lieu; distance: number }[] {
  return lieux
    .map((lieu) => ({ lieu, distance: distanceM(lieu, depuis) }))
    .sort((a, b) => a.distance - b.distance)
}
