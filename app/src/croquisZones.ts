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

// Les 8 zones = les 8 repères existants (POINTS_REPERE). Le brief listait
// aussi quartier latin / saint-germain / l'ouest… mais AUCUNE chip n'existe
// pour eux : le croquis DOIT correspondre aux filtres réels, donc on découpe
// autour des repères qu'on a. Comptes sur le pool actuel (~336 spots) :
// châtelet 63 · pigalle 32 · bastille 29 · gare de lyon 25 · canal 24 ·
// république 21 · montmartre 13 · nation 0 (pâle, sans nombre — honnête).
export const ZONES_CROQUIS: ZoneCroquis[] = [
  // montmartre : la butte, au nord (inclut abbesses / lamarck)
  { repere: 'Montmartre', etiquette: 'montmartre', bbox: [48.884, 48.9, 2.32, 2.36], cx: 170, cy: 36, rx: 34, ry: 19, graine: 11 },
  // pigalle : sopi + 9e est, sous la butte (rue des martyrs comprise)
  { repere: 'Pigalle', etiquette: 'pigalle', bbox: [48.87, 48.884, 2.315, 2.352], cx: 157, cy: 76, rx: 32, ry: 17, graine: 22 },
  // canal st-martin : les deux rives du canal + haut 10e
  { repere: 'Canal St-Martin', etiquette: 'canal st-martin', bbox: [48.87, 48.884, 2.352, 2.385], cx: 224, cy: 76, rx: 28, ry: 17, graine: 33 },
  // république : la place + haut marais / arts-et-métiers
  { repere: 'République', etiquette: 'république', bbox: [48.862, 48.87, 2.348, 2.368], cx: 204, cy: 107, rx: 21, ry: 12, graine: 44 },
  // châtelet : les halles + marais + montorgueil — le centre, dense
  { repere: 'Châtelet', etiquette: 'châtelet', bbox: [48.846, 48.862, 2.328, 2.368], cx: 183, cy: 138, rx: 34, ry: 18, graine: 55 },
  // bastille : la place + oberkampf / charonne ouest (11e qui sort)
  { repere: 'Bastille', etiquette: 'bastille', bbox: [48.846, 48.87, 2.368, 2.395], cx: 248, cy: 126, rx: 21, ry: 26, graine: 66 },
  // gare de lyon : 12e + bercy + rive gauche est (13e qui monte)
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

/** le périph : une boucle approximative en pointillés, à peine là */
export const TRAIT_PERIPH = 'M 30 12 Q 160 4 310 14 Q 336 100 326 200 Q 320 246 240 250 Q 120 256 40 246 Q 8 240 10 170 Q 6 80 30 12'
