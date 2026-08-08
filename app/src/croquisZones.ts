// ════════════════════════════════════════════════════════════════
// jeudi. — les ZONES du croquis de Paris (pur, sans React — testable)
// Le découpage de la ville en ~8 coins, chacun mappé sur un repère
// EXISTANT de « autour de » (autour.ts / POINTS_REPERE) : le croquis
// active les mêmes filtres que les chips, jamais un filtre fantôme.
// Le dessin lui-même (SVG) vit dans CroquisParis.tsx.
// ════════════════════════════════════════════════════════════════

export interface ZoneCroquis {
  /** nom EXACT du repère (la chip « autour de ») que la zone active */
  repere: string
  /** l'étiquette manuscrite posée sur le croquis (minuscules assumées) */
  etiquette: string
  /** bbox approximative [latMin, latMax[ × [lngMin, lngMax[ pour COMPTER
   *  les spots — demi-ouverte : un spot pile sur une frontière ne compte
   *  qu'une seule fois. Découpage posé à la main sur la densité réelle des
   *  spots (pas les limites administratives — c'est un carnet, pas l'INSEE). */
  bbox: [latMin: number, latMax: number, lngMin: number, lngMax: number]
  /** géométrie du dessin (espace 340×260) : centre + rayons de la patatoïde */
  cx: number
  cy: number
  rx: number
  ry: number
  /** graine du tremblé : le trait est irrégulier mais STABLE d'un rendu à
   *  l'autre — un croquis posé, pas un gribouillage vivant */
  graine: number
}

// TOUT Paris en 21 zones — chacune mappée sur un repère de POINTS_REPERE
// (autour.ts) : le croquis DOIT correspondre aux filtres réels, jamais un
// filtre fantôme. Les bboxes sont deux à deux DISJOINTES (frontières
// demi-ouvertes, elles se touchent sans se recouvrir) — le test croquis.test
// le garantit. Une zone sans spot reste dessinée, pâle et sans nombre :
// le carnet montre la ville entière, pas juste là où il a des adresses.
// Projection du croquis (espace 340×260, posée sur les 8 zones d'origine) :
//   x = 183 + (lng − 2.348) × 1900 · y = 138 − (lat − 48.854) × 2684
export const ZONES_CROQUIS: ZoneCroquis[] = [
  // ── le nord ──
  // montmartre : la butte (abbesses / lamarck)
  { repere: 'Montmartre', etiquette: 'montmartre', bbox: [48.884, 48.9, 2.32, 2.36], cx: 170, cy: 36, rx: 34, ry: 19, graine: 11 },
  // la villette : le bassin + l'ourcq, le 19e qui trinque au bord de l'eau
  { repere: 'La Villette', etiquette: 'la villette', bbox: [48.884, 48.9, 2.36, 2.405], cx: 249, cy: 38, rx: 26, ry: 15, graine: 121 },
  // batignolles : le village du 17e, derrière les voies
  { repere: 'Batignolles', etiquette: 'batignolles', bbox: [48.878, 48.895, 2.3, 2.315], cx: 106, cy: 51, rx: 15, ry: 14, graine: 209 },
  // pigalle : sopi + martyrs, sous la butte
  { repere: 'Pigalle', etiquette: 'pigalle', bbox: [48.874, 48.884, 2.315, 2.352], cx: 156, cy: 71, rx: 30, ry: 15, graine: 22 },
  // canal st-martin : les deux rives + haut 10e
  { repere: 'Canal St-Martin', etiquette: 'canal st-martin', bbox: [48.87, 48.884, 2.352, 2.372], cx: 210, cy: 76, rx: 19, ry: 16, graine: 33 },
  // belleville : la colline de l'est, ménilmontant compris
  { repere: 'Belleville', etiquette: 'belleville', bbox: [48.866, 48.884, 2.372, 2.405], cx: 264, cy: 88, rx: 24, ry: 15, graine: 110 },
  // ── le centre ──
  // opéra : grands boulevards + madeleine, le 2e/9e qui sort tard
  { repere: 'Opéra', etiquette: 'opéra', bbox: [48.862, 48.874, 2.315, 2.348], cx: 152, cy: 100, rx: 24, ry: 13, graine: 176 },
  // république : la place + haut marais / arts-et-métiers
  { repere: 'République', etiquette: 'république', bbox: [48.862, 48.87, 2.348, 2.368], cx: 204, cy: 107, rx: 21, ry: 12, graine: 44 },
  // châtelet : les halles + montorgueil — le centre, dense
  { repere: 'Châtelet', etiquette: 'châtelet', bbox: [48.85, 48.862, 2.335, 2.352], cx: 174, cy: 128, rx: 17, ry: 13, graine: 55 },
  // le marais : du bhv aux vosges, le 4e qui veille
  { repere: 'Le Marais', etiquette: 'le marais', bbox: [48.85, 48.862, 2.352, 2.368], cx: 214, cy: 138, rx: 15, ry: 11, graine: 99 },
  // bastille : la place + oberkampf / charonne ouest
  { repere: 'Bastille', etiquette: 'bastille', bbox: [48.846, 48.866, 2.368, 2.395], cx: 247, cy: 130, rx: 20, ry: 22, graine: 66 },
  // ── l'ouest ──
  // les champs : l'étoile + le triangle d'or, le 8e qui brille
  { repere: 'Champs-Élysées', etiquette: 'les champs', bbox: [48.862, 48.878, 2.28, 2.315], cx: 90, cy: 95, rx: 28, ry: 16, graine: 187 },
  // tour eiffel : le 7e + trocadéro rive droite du champ-de-mars
  { repere: 'Tour Eiffel', etiquette: 'tour eiffel', bbox: [48.846, 48.862, 2.28, 2.32], cx: 92, cy: 139, rx: 32, ry: 16, graine: 198 },
  // passy : le 16e village, chaillot → auteuil
  { repere: 'Passy', etiquette: 'passy', bbox: [48.845, 48.87, 2.25, 2.28], cx: 26, cy: 128, rx: 17, ry: 20, graine: 220 },
  // ── la rive gauche ──
  // saint-germain : flore, odéon, la rive gauche qui cause
  { repere: 'Saint-Germain', etiquette: 'st-germain', bbox: [48.846, 48.858, 2.32, 2.335], cx: 130, cy: 150, rx: 14, ry: 12, graine: 143 },
  // quartier latin : panthéon + mouffetard, le 5e étudiant
  { repere: 'Quartier Latin', etiquette: 'quartier latin', bbox: [48.84, 48.85, 2.335, 2.352], cx: 182, cy: 162, rx: 18, ry: 11, graine: 132 },
  // montparnasse : vavin + edgar-quinet, la rive gauche qui dîne
  { repere: 'Montparnasse', etiquette: 'montparnasse', bbox: [48.83, 48.846, 2.31, 2.335], cx: 135, cy: 181, rx: 19, ry: 13, graine: 154 },
  // le 15e : commerce + convention, le village d'à côté
  { repere: 'Le 15e', etiquette: 'le 15e', bbox: [48.83, 48.846, 2.28, 2.31], cx: 82, cy: 181, rx: 19, ry: 13, graine: 231 },
  // butte-aux-cailles : le 13e qui trinque en pente
  { repere: 'Butte-aux-Cailles', etiquette: 'butte-aux-cailles', bbox: [48.82, 48.835, 2.335, 2.352], cx: 174, cy: 209, rx: 16, ry: 12, graine: 165 },
  // ── l'est ──
  // gare de lyon : 12e + bercy + la rive gauche est qui monte
  { repere: 'Gare de Lyon', etiquette: 'gare de lyon', bbox: [48.825, 48.846, 2.352, 2.395], cx: 232, cy: 188, rx: 34, ry: 22, graine: 77 },
  // nation : la place + cours de vincennes / charonne est
  { repere: 'Nation', etiquette: 'nation', bbox: [48.84, 48.86, 2.395, 2.42], cx: 296, cy: 148, rx: 20, ry: 23, graine: 88 },
]

/** compte les spots par zone (clé = nom du repère). Demi-ouvert et zones
 *  disjointes : un spot appartient à UNE zone au plus — jamais compté deux
 *  fois. Les spots hors zones (saint-germain, l'ouest, hors Paris…) ne
 *  comptent nulle part : le croquis dit « dans ce coin, il y en a N ». */
export function compterSpotsZones(lieux: { lat: number; lng: number }[]): Record<string, number> {
  const comptes: Record<string, number> = {}
  for (const z of ZONES_CROQUIS) comptes[z.repere] = 0
  for (const l of lieux) {
    for (const z of ZONES_CROQUIS) {
      const [latMin, latMax, lngMin, lngMax] = z.bbox
      if (l.lat >= latMin && l.lat < latMax && l.lng >= lngMin && l.lng < lngMax) {
        comptes[z.repere]++
        break // zones disjointes : inutile de continuer
      }
    }
  }
  return comptes
}

// ── le tremblé du trait ─────────────────────────────────────────
// petit générateur pseudo-aléatoire déterministe (mulberry32) : même graine
// → même tracé. Le tremblé est un choix de dessin, pas du bruit de rendu.
function alea(graine: number): () => number {
  let a = graine >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** une patatoïde au trait tremblé : n points autour d'une ellipse, rayons et
 *  angles légèrement déréglés, lissés en quadratiques par les milieux —
 *  fermée, sans angle dur, coins non parfaits (la DA l'exige). */
function cheminPatatoide(cx: number, cy: number, rx: number, ry: number, graine: number, n = 9): string {
  const r = alea(graine)
  const pts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.25
    const kx = 1 + (r() - 0.5) * 0.28
    const ky = 1 + (r() - 0.5) * 0.28
    pts.push([cx + Math.cos(angle) * rx * kx, cy + Math.sin(angle) * ry * ky])
  }
  const milieu = (p: [number, number], q: [number, number]): [number, number] => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  const m0 = milieu(pts[n - 1], pts[0])
  let d = `M ${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`
  for (let i = 0; i < n; i++) {
    const m = milieu(pts[i], pts[(i + 1) % n])
    d += ` Q ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`
  }
  return d + ' Z'
}

/** tracés des zones, figés au chargement du module : zéro calcul au rendu */
export const CHEMINS_ZONES = ZONES_CROQUIS.map((z) => cheminPatatoide(z.cx, z.cy, z.rx, z.ry, z.graine))

/** la seine : un seul trait sinueux, du sud-est (bercy) vers le sud-ouest —
 *  elle frôle châtelet et passe sous bastille, comme dans la vraie ville */
export const TRAIT_SEINE = 'M 333 241 Q 300 224 272 205 Q 236 178 205 159 Q 172 139 138 128 Q 108 119 86 130 Q 62 143 44 165 Q 28 185 12 199'

// ── les monuments : des repères à l'encre, dessinés à la main ───
// Pas des icônes : des petits croquis au trait (comme on gribouille la tour
// eiffel dans la marge d'un carnet). Chaque chemin est dessiné base en (0,0),
// vers le haut (y négatif) — posé sur le croquis par translate(x, y).
// Décoratifs : pas cliquables, à l'encre discrète, sous les étiquettes.
export interface MonumentCroquis {
  nom: string
  /** position sur le croquis (espace 340×260) — le géo projeté, puis décalé
   *  à la main pour ne jamais mordre une étiquette */
  x: number
  y: number
  chemin: string
}

export const MONUMENTS_CROQUIS: MonumentCroquis[] = [
  {
    nom: 'la tour eiffel',
    x: 76,
    y: 124,
    // deux jambes en courbe, deux plateformes, la flèche
    chemin: 'M -5.2 0 Q -1.8 -5.5 -1.1 -10.5 L -0.7 -14 M 5.2 0 Q 1.8 -5.5 1.1 -10.5 L 0.7 -14 M -3.6 -4.6 L 3.6 -4.6 M -1.7 -9.6 L 1.7 -9.6 M 0 -14 L 0 -16.5',
  },
  {
    nom: "l'arc de triomphe",
    x: 70,
    y: 78,
    // le bloc, l'arche, la corniche
    chemin: 'M -5.5 0 L -5.5 -12.5 L 5.5 -12.5 L 5.5 0 M -2.4 0 L -2.4 -5.5 Q -2.4 -8 0 -8 Q 2.4 -8 2.4 -5.5 L 2.4 0 M -5.5 -9.8 L 5.5 -9.8',
  },
  {
    nom: 'le sacré-cœur',
    x: 190,
    y: 54,
    // trois dômes (le grand au centre) + la croix
    chemin: 'M -7.2 0 L -7.2 -2.8 Q -7.2 -6.6 -4.8 -6.6 Q -2.6 -6.6 -2.6 -2.8 L -2.6 0 M 2.6 0 L 2.6 -2.8 Q 2.6 -6.6 4.8 -6.6 Q 7.2 -6.6 7.2 -2.8 L 7.2 0 M -2.9 0 L -2.9 -4.6 Q -2.9 -9.8 0 -9.8 Q 2.9 -9.8 2.9 -4.6 L 2.9 0 M 0 -9.8 L 0 -12.4 M -1.3 -11.3 L 1.3 -11.3',
  },
  {
    nom: 'notre-dame',
    x: 187,
    y: 148,
    // les deux tours, la galerie, la rosace — posée sur la seine (l'île)
    chemin: 'M -6 0 L -6 -8.6 L -2.6 -8.6 L -2.6 0 M 2.6 0 L 2.6 -8.6 L 6 -8.6 L 6 0 M -2.6 -4.8 L 2.6 -4.8 M 1.35 -2.4 A 1.35 1.35 0 1 0 -1.35 -2.4 A 1.35 1.35 0 1 0 1.35 -2.4',
  },
  {
    nom: 'les invalides',
    x: 116,
    y: 124,
    // le dôme doré et sa flèche
    chemin: 'M -5 0 L -5 -3.8 L 5 -3.8 L 5 0 M -3.9 -3.8 Q -3.9 -9.6 0 -9.6 Q 3.9 -9.6 3.9 -3.8 M 0 -9.6 L 0 -13 M -0.9 -12 L 0.9 -12',
  },
  {
    nom: 'la tour montparnasse',
    x: 110,
    y: 168,
    // la dalle — reconnaissable à sa seule silhouette
    chemin: 'M -2.9 0 L -2.9 -12.6 Q -2.9 -13.8 0 -13.8 Q 2.9 -13.8 2.9 -12.6 L 2.9 0 M -2.9 -4.4 L 2.9 -4.4',
  },
]

/** le périph : une boucle approximative en pointillés, à peine là */
export const TRAIT_PERIPH = 'M 30 12 Q 160 4 310 14 Q 336 100 326 200 Q 320 246 240 250 Q 120 256 40 246 Q 8 240 10 170 Q 6 80 30 12'

// ── projeter un point réel sur le dessin ────────────────────────
// LA projection du croquis (celle qui a posé les 21 zones, documentée
// au-dessus de ZONES_CROQUIS) : linéaire, centrée sur Châtelet.
// Sert aux épingles précises (les plans de « je sais pas », « toi »).
export function projeterSurCroquis(lat: number, lng: number): { x: number; y: number } {
  return {
    x: 183 + (lng - 2.348) * 1900,
    y: 138 - (lat - 48.854) * 2684,
  }
}

// ── le marqueur de recherche : l'accusé de réception spatial ────
// Quand « autour de » est un lieu géocodé (un métro tapé, une adresse),
// un signe se pose sur le croquis À L'ENDROIT reconnu : « comme ça on
// est sûr » que jeudi a compris de quel coin on parle. Si le lieu sort
// du carnet (hors Paris), le signe se colle au bord, tourné vers lui.
export interface Marqueur {
  x: number
  y: number
  /** vrai si le point tombe dans le cadre du dessin (marge comprise) */
  dedans: boolean
  /** direction du vrai point quand il est hors cadre (degrés, 0 = est) */
  angle: number
}

const MARGE_MARQUEUR = 14 // le signe ne mord jamais le bord du carnet

export function poserMarqueur(lat: number, lng: number): Marqueur {
  const p = projeterSurCroquis(lat, lng)
  const x = Math.min(340 - MARGE_MARQUEUR, Math.max(MARGE_MARQUEUR, p.x))
  const y = Math.min(260 - MARGE_MARQUEUR, Math.max(MARGE_MARQUEUR, p.y))
  const dedans = x === p.x && y === p.y
  return {
    x,
    y,
    dedans,
    angle: dedans ? 0 : (Math.atan2(p.y - y, p.x - x) * 180) / Math.PI,
  }
}

/** le rond du marqueur : on ENTOURE l'endroit au crayon (une patatoïde
 *  serrée, graine fixe → même coup de crayon à chaque pose), centré (0,0) */
export const CHEMIN_MARQUEUR = cheminPatatoide(0, 0, 8, 7, 47, 7)
