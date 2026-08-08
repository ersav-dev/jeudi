// les points de rendez-vous de Paris : places, ponts, fontaines, jardins —
// les endroits qu'on NOMME quand on se donne rendez-vous. Chacun porte son
// POINT PRÉCIS en toutes lettres (« au pied de la statue ») : c'est lui qui
// évite le « t'es où ? ». Sélection v1 (25), le reste de la liste attend en
// réserve dans la conversation du 09/08.
//
// Coordonnées géocodées le 09/08 (Nominatim + Overpass), vérifiées une à une,
// FIGÉES ici — jamais recalculées à l'exécution. Les stations de métro n'y
// sont pas (elles ont leur propre table), les 8 monuments du croquis non plus
// (monuments.ts). Les trois familles se retrouvent dans la même recherche.
export type PointRdv = {
  nom: string
  rdv: string
  lat: number
  lng: number
  /** la vignette carnet, si la planche en a une — posée sur la carte (test 08/08) */
  img?: string
}

export const REPERES: PointRdv[] = [
  // ── les places qui commandent ──
  { nom: 'république', img: '/monuments/republique.png', rdv: 'au pied de la statue', lat: 48.86754, lng: 2.36396 },
  { nom: 'bastille', img: '/monuments/bastille.png', rdv: 'au pied de la colonne', lat: 48.85317, lng: 2.36914 },
  { nom: 'nation', rdv: 'près de la statue centrale', lat: 48.84837, lng: 2.39587 },
  { nom: 'concorde', rdv: "au pied de l'obélisque", lat: 48.86548, lng: 2.32113 },
  { nom: 'place vendôme', img: '/monuments/colonne-vendome.png', rdv: 'au pied de la colonne', lat: 48.86746, lng: 2.32943 },
  { nom: 'hôtel de ville', img: '/monuments/hotel-de-ville.png', rdv: 'sur le parvis', lat: 48.85643, lng: 2.35253 },
  { nom: 'fontaine saint-michel', img: '/monuments/fontaine-saint-michel.png', rdv: 'devant la fontaine', lat: 48.85329, lng: 2.34364 },
  { nom: 'saint-sulpice', img: '/monuments/saint-sulpice.png', rdv: 'à la fontaine', lat: 48.85087, lng: 2.33328 },
  { nom: 'pyramide du louvre', img: '/monuments/pyramide-du-louvre.png', rdv: 'devant la pyramide', lat: 48.86099, lng: 2.33584 },
  { nom: 'colonnes de buren', img: '/monuments/palais-royal.png', rdv: 'au milieu des colonnes', lat: 48.8636, lng: 2.33707 },
  { nom: 'trocadéro', img: '/monuments/trocadero.png', rdv: 'sur le parvis, face à la tour', lat: 48.86208, lng: 2.28854 },
  { nom: 'denfert-rochereau', rdv: 'au lion de belfort', lat: 48.83498, lng: 2.33197 },
  // ── les ponts et la Seine ──
  { nom: 'pont des arts', rdv: "côté institut de france", lat: 48.85841, lng: 2.33755 },
  { nom: 'pont neuf', rdv: "à la statue d'henri iv", lat: 48.8578, lng: 2.34192 },
  { nom: 'pont alexandre iii', img: '/monuments/pont-alexandre-iii.png', rdv: 'au pied des pylônes dorés', lat: 48.86347, lng: 2.31352 },
  { nom: 'bir-hakeim', img: '/monuments/station-bir-hakeim.png', rdv: 'sous les arcades', lat: 48.85573, lng: 2.28755 },
  { nom: 'vert-galant', rdv: "à la pointe de l'île", lat: 48.85741, lng: 2.34033 },
  // ── les jardins, au repère précis ──
  { nom: 'fontaine médicis', img: '/monuments/jardin-du-luxembourg.png', rdv: 'devant le bassin', lat: 48.84806, lng: 2.33929 },
  { nom: 'temple de la sibylle', rdv: 'au temple, en haut des buttes', lat: 48.88109, lng: 2.38307 },
  { nom: 'belvédère de belleville', rdv: 'au belvédère, la vue', lat: 48.87155, lng: 2.38423 },
  { nom: 'rotonde de la villette', rdv: 'devant la rotonde, côté bassin', lat: 48.88346, lng: 2.36955 },
  // ── les très jeudi ──
  { nom: "mur des je t'aime", rdv: 'devant le mur', lat: 48.88486, lng: 2.33869 },
  { nom: 'fontaine stravinsky', rdv: 'devant la fontaine', lat: 48.85948, lng: 2.35148 },
  { nom: 'maison rose', rdv: 'devant la façade', lat: 48.88799, lng: 2.33965 },
  { nom: 'porte saint-denis', rdv: "sous l'arche", lat: 48.86979, lng: 2.35269 },
]
