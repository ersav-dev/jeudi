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

// ── L'HEURE DU NOCTILIEN (10/08, demande d'Ersan) ──────────────────────
// Le réseau roule de 0h30 à 5h30 — c'est le titre du plan officiel d'IDFM
// (« Plan du réseau Noctilien de 0h30 à 5h30 »), 48 lignes autour de cinq
// points de correspondance dans Paris. Les horaires varient à la marge selon
// la ligne et le jour ; on ne prétend donc jamais donner un passage.
//
// Pourquoi 22 h et pas 0h30 : la loi du panel vaut dans LES DEUX SENS. On a
// retiré 3 107 arrêts de jour parce qu'un bus qui ne roule pas la nuit est
// une fausse promesse ; afficher un bus de nuit à midi est la même faute
// retournée. Mais on décide de rentrer AVANT que le service commence — à
// 23 h on prépare sa sortie. On ouvre donc à 22 h, et c'est le LIBELLÉ qui
// dit la vérité : « dès 0h30 » tant que ça ne roule pas.
export const DEBUT_NOCTILIEN = '0h30'
export const FIN_NOCTILIEN = '5h30'

/** ça roule maintenant, ou seulement plus tard dans la nuit ?
 *    'roule'   entre 0h30 et 5h30 (le service, d'après IDFM)
 *    'bientot' de 22h à 0h29 — on prépare son retour, ça ne roule pas encore
 *    null      le reste du temps : on n'affiche RIEN
 *
 *  ⚠ Le piège que j'ai failli livrer : entre 5h31 et 5h59 on est encore de
 *  nuit, mais le service est FINI. Renvoyer 'bientot' aurait affiché « dès
 *  0h30 » à quelqu'un qui rentre à 5h45 — la même fausse promesse que les
 *  bus de jour, retournée. Après 5h30, plus rien. */
export function etatNoctilien(d = new Date()): 'roule' | 'bientot' | null {
  const min = d.getHours() * 60 + d.getMinutes()
  if (min >= 30 && min <= 330) return 'roule' // 0h30 → 5h30
  if (min >= 22 * 60 || min < 30) return 'bientot' // 22h → 0h29
  return null
}

/** l'heure est-elle une heure où le Noctilien a quelque chose à dire ? */
export function heureDeNuit(d = new Date()): boolean {
  return etatNoctilien(d) !== null
}

export type CommentRentrer = {
  velib: StationVelib[]
  noctilien: ArretNoctilien | null
  /** null = on n'affiche pas le Noctilien du tout (on est en journée) */
  etatNoctilien: 'roule' | 'bientot' | null
}

/** Les 2 stations à montrer : les plus proches PARMI celles qui ont des
 *  vélos. Le filtre passe AVANT le top-2 — c'est la loi n°1 (jamais une
 *  station sans dispo) : dans Paris dense les stations vont par grappes, et
 *  deux vides côte à côte masquaient la pleine juste derrière (bug trouvé à
 *  la relecture du 12/08 — le filtre venait APRÈS le top-2). 400 m : au-delà,
 *  autant marcher jusqu'au métro. Le Vélib' roule 24 h/24, aucune condition
 *  d'heure. PURE — testée. */
export function stationsAMontrer(
  stations: StationVelib[],
  depuis: { lat: number; lng: number },
): (StationVelib & { m: number })[] {
  return plusProches(
    stations.filter((s) => s.velos > 0),
    depuis,
    2,
    400,
  )
}

/** Ce qu'on montre sous un spot. Les deux moitiés sont indépendantes : si le
 *  Vélib' ne répond pas, le Noctilien s'affiche quand même, et l'inverse. */
export async function commentRentrer(
  depuis: { lat: number; lng: number },
  maintenant = new Date(),
): Promise<CommentRentrer> {
  const etat = etatNoctilien(maintenant)
  // en journée on ne charge même pas le fichier : un bus de nuit à midi ne
  // s'affiche pas, donc il n'a pas à être téléchargé.
  const [v, n] = await Promise.all([
    chargerVelib(),
    etat ? chargerNoctilien() : Promise.resolve(null),
  ])
  return {
    velib: v ? stationsAMontrer(v, depuis) : [],
    // un seul arrêt : le panel a prévenu qu'une LISTE redeviendrait un calque
    // déguisé. 600 m, un arrêt de nuit se mérite un peu.
    noctilien: n ? (plusProches(n, depuis, 1, 600)[0] ?? null) : null,
    etatNoctilien: etat,
  }
}
