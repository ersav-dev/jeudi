// ── COMMENT TU RENTRES ────────────────────────────────────────────────
// Décidé le 10/08/2026 après un panel de 10 personnes (5 professionnels,
// 5 utilisateurs) — rapport dans PANEL_VELIB_BUS_2026-08-10.md.
//
// Le panel a écarté à l'unanimité le calque « afficher les Vélib' / les bus »
// (0 voix sur 10) et retenu la forme CONTEXTUELLE : rien sur la carte, une
// ligne dans la fiche du spot, au moment où la question se pose vraiment.
//
// Deux règles nées de ce panel, et elles commandent tout ce fichier :
//
//  1. UNE STATION SANS SA DISPONIBILITÉ EST UN MENSONGE. « Ça sert à rien de
//     savoir qu'il y a une station si je sais pas si elle est vide. » On
//     n'affiche donc JAMAIS une station Vélib' sans son nombre de vélos —
//     si le temps réel ne répond pas, on n'affiche rien du tout.
//
//  2. UN ARRÊT DE BUS DE JOUR MONTRÉ LA NUIT EST UNE FAUSSE PROMESSE. Quatre
//     panélistes l'ont dit séparément, dont une pour qui c'est une question
//     de sécurité : marcher seule vers un arrêt mort. Les 3 107 arrêts de
//     jour ont donc quitté le produit ; seuls restent les 1 756 arrêts
//     NOCTILIEN (network=Noctilien dans OSM), qui eux roulent la nuit.
//
// Aucune de ces deux données n'est chargée tant qu'on n'ouvre pas une fiche.

const GBFS = 'https://velib-metropole-opendata.smovengo.cloud/opendata/Velib_Metropole'

export type StationVelib = {
  nom: string
  lat: number
  lng: number
  /** vélos disponibles à l'instant — jamais affiché sans lui */
  velos: number
  /** places libres pour REPOSER un vélo (l'autre moitié du problème) */
  places: number
  /** mètres depuis le point demandé */
  m: number
}

export type ArretNoctilien = {
  nom: string
  lat: number
  lng: number
  lignes: string[]
  m: number
}

/** haversine, en mètres — la même formule que db.distanceM, recopiée ici
 *  pour que ce module reste pur et testable sans toucher à IndexedDB. */
export function metres(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** les n plus proches d'une liste, sous un plafond de distance. Pur : c'est
 *  lui qu'on teste, le reste n'est que du réseau. */
export function plusProches<T extends { lat: number; lng: number }>(
  liste: T[],
  depuis: { lat: number; lng: number },
  n: number,
  maxM: number,
): (T & { m: number })[] {
  return liste
    .map((x) => ({ ...x, m: Math.round(metres(depuis, x)) }))
    .filter((x) => x.m <= maxM)
    .sort((a, b) => a.m - b.m)
    .slice(0, n)
}

// ── VÉLIB' : positions + disponibilité, en une passe ───────────────────
// Les positions viennent du même open data que la dispo : rien à embarquer
// dans le dépôt, donc rien qui pourrit (une station qui ferme disparaît
// toute seule). Cache de 60 s : on ne rappelle pas à chaque fiche ouverte,
// mais on ne sert jamais un chiffre vieux d'une soirée.
type Brut = { lat: number; lng: number; nom: string }
let velibCache: { t: number; v: StationVelib[] } | null = null
const FRAICHEUR_MS = 60_000

export async function chargerVelib(): Promise<StationVelib[] | null> {
  if (velibCache && Date.now() - velibCache.t < FRAICHEUR_MS) return velibCache.v
  try {
    const [infoR, statR] = await Promise.all([
      fetch(`${GBFS}/station_information.json`),
      fetch(`${GBFS}/station_status.json`),
    ])
    if (!infoR.ok || !statR.ok) return null
    const info = (await infoR.json()) as {
      data: { stations: { station_id: string; name: string; lat: number; lon: number }[] }
    }
    const stat = (await statR.json()) as {
      data: {
        stations: {
          station_id: string
          num_bikes_available: number
          num_docks_available: number
          is_renting: number
          is_installed: number
        }[]
      }
    }
    const par = new Map<string, Brut>()
    for (const s of info.data.stations) par.set(s.station_id, { nom: s.name, lat: s.lat, lng: s.lon })
    const v: StationVelib[] = []
    for (const s of stat.data.stations) {
      // une station fermée ou désinstallée ne doit pas apparaître : c'est
      // exactement le déplacement pour rien qu'on veut éviter.
      if (!s.is_renting || !s.is_installed) continue
      const p = par.get(s.station_id)
      if (!p) continue
      v.push({
        nom: p.nom,
        lat: p.lat,
        lng: p.lng,
        velos: s.num_bikes_available,
        places: s.num_docks_available,
        m: 0,
      })
    }
    velibCache = { t: Date.now(), v }
    return v
  } catch {
    return null // hors ligne : on n'affiche rien plutôt qu'un chiffre faux
  }
}

// ── NOCTILIEN : figé dans le dépôt (les lignes de nuit ne bougent pas) ──
let noctiCache: ArretNoctilien[] | null = null

export async function chargerNoctilien(): Promise<ArretNoctilien[] | null> {
  if (noctiCache) return noctiCache
  try {
    const r = await fetch('/noctilien.json')
    if (!r.ok) return null
    const brut = (await r.json()) as { nom: string; lat: number; lng: number; lignes: string[] }[]
    noctiCache = brut.map((a) => ({ ...a, m: 0 }))
    return noctiCache
  } catch {
    return null
  }
}

export type CommentRentrer = {
  velib: StationVelib[]
  noctilien: ArretNoctilien | null
}

/** Ce qu'on montre sous un spot. Les deux moitiés sont indépendantes : si le
 *  Vélib' ne répond pas, le Noctilien s'affiche quand même, et l'inverse. */
export async function commentRentrer(
  depuis: { lat: number; lng: number },
): Promise<CommentRentrer> {
  const [v, n] = await Promise.all([chargerVelib(), chargerNoctilien()])
  return {
    // 2 stations : la plus proche peut être vide, la seconde sauve la mise.
    // 400 m — au-delà, autant marcher jusqu'au métro.
    velib: v ? plusProches(v, depuis, 2, 400).filter((s) => s.velos > 0) : [],
    // un seul arrêt : le panel a prévenu qu'une LISTE redeviendrait un calque
    // déguisé. 600 m, un arrêt de nuit se mérite un peu.
    noctilien: n ? (plusProches(n, depuis, 1, 600)[0] ?? null) : null,
  }
}
