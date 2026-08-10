// les monuments-repères du carnet : silhouettes monoline (viewBox 24, trait
// graphite), coordonnées vraies. Ils servent DEUX surfaces : le croquis de la
// grande carte (Carte.tsx les dessine) et la recherche du « où » (stations.ts
// les comprend — « rdv à la tour eiffel » vaut « rdv à Edgar Quinet »).
// Sortis de Carte.tsx le 09/08 pour être partagés sans dupliquer une virgule.
const trait = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`

export type Monument = {
  nom: string
  lat: number
  lng: number
  trait: string
  /** la vignette carnet (planches GPT du 08/08, découpées) — /monuments/… */
  img?: string
  /** son cartouche (l'étiquette parchemin au texte rouge), quand il est
   *  séparé — sinon il est déjà incorporé dans la vignette */
  etq?: string
}

export const MONUMENTS: Monument[] = [
  // la tour : deux jambes qui se croisent, l'arche
  { nom: 'tour eiffel', img: '/monuments/tour-eiffel.webp', etq: '/monuments/tour-eiffel-etq.webp', lat: 48.8584, lng: 2.2945, trait: trait('<path d="M9 21c2-7 2-12 3-17 1 5 1 10 3 17"/><path d="M7 21h4a3 3 0 0 1 2 0h4"/><path d="M9.5 13h5"/>') },
  // l'étoile : l'arche pleine
  { nom: 'arc de triomphe', img: '/monuments/arc-de-triomphe.webp', etq: '/monuments/arc-de-triomphe-etq.webp', lat: 48.8738, lng: 2.295, trait: trait('<path d="M5 20V7a7 7 0 0 1 14 0v13"/><path d="M9 20v-6a3 3 0 0 1 6 0v6"/>') },
  // la butte : le dôme et ses deux petits
  { nom: 'sacré-cœur', img: '/monuments/sacre-coeur.webp', etq: '/monuments/sacre-coeur-etq.webp', lat: 48.8867, lng: 2.3431, trait: trait('<path d="M8 20v-6a4 4 0 0 1 8 0v6"/><path d="M12 10V7"/><path d="M4 20v-3a2 2 0 0 1 4 0"/><path d="M16 17a2 2 0 0 1 4 0v3"/><path d="M3 20h18"/>') },
  // l'île : les deux tours carrées
  { nom: 'notre-dame', img: '/monuments/notre-dame.webp', etq: '/monuments/notre-dame-etq.webp', lat: 48.853, lng: 2.3499, trait: trait('<path d="M6 20V8h4v12"/><path d="M14 20V8h4v12"/><path d="M10 12h4"/><path d="M4 20h16"/>') },
  // la montagne : le dôme sur colonnes
  { nom: 'panthéon', img: '/monuments/pantheon.webp', lat: 48.8462, lng: 2.3464, trait: trait('<path d="M7 20v-7M12 20v-7M17 20v-7"/><path d="M5 13a7 5 0 0 1 14 0"/><path d="M4 20h16"/>') },
  // l'opéra : le fronton
  { nom: 'opéra', img: '/monuments/palais-garnier.webp', etq: '/monuments/palais-garnier-etq.webp', lat: 48.872, lng: 2.3316, trait: trait('<path d="M4 20l8-12 8 12z"/><path d="M8 20v-4M12 20v-6M16 20v-4"/>') },
  // le dôme doré
  { nom: 'invalides', img: '/monuments/invalides.webp', etq: '/monuments/invalides-etq.webp', lat: 48.856, lng: 2.3126, trait: trait('<path d="M9 20v-5a3 5 0 0 1 6 0v5"/><path d="M12 9V5l2 1"/><path d="M5 20h14"/>') },
  // la tour noire (le repère du sud)
  { nom: 'montparnasse', img: '/monuments/tour-montparnasse.webp', etq: '/monuments/tour-montparnasse-etq.webp', lat: 48.8421, lng: 2.3219, trait: trait('<path d="M9 21V5a6 8 0 0 1 6 0v16"/><path d="M9 9h6M9 14h6"/>') },
]
