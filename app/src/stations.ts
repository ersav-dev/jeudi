// ════════════════════════════════════════════════════════════════
// jeudi. — reconnaître une station DANS L'APPAREIL, sans réseau.
//
// « Edgar Quinet » partait jusqu'à Nominatim : un aller-retour, une file
// d'attente d'1,1 s imposée par la politique d'usage d'OSM, et rien du tout
// sans réseau. Or les 581 stations sont dans transport.json depuis le 08/08,
// avec leurs coordonnées. Autant répondre tout de suite.
//
// Nominatim reste le filet : il sait les adresses, les monuments, tout ce qui
// n'est pas une station. Ici on ne traite QUE les stations, et vite.
// ════════════════════════════════════════════════════════════════
import { donneesTransport, type TypeTransport } from './transport'
import { MONUMENTS } from './monuments'
import { REPERES } from './reperes'

// un repère cherchable : une station de transport, un monument du croquis…
// ou un point de rendez-vous (place, pont, fontaine — reperes.ts). « Rdv au
// pont des arts » vaut « rdv à Edgar Quinet » : trois familles, une recherche.
export type Station = {
  nom: string
  type: TypeTransport | 'monument' | 'repere'
  lat: number
  lng: number
  /** la silhouette monoline (monuments seulement) — pour la suggestion */
  trait?: string
  /** le point précis du rendez-vous (repères seulement) — « au pied de la statue » */
  rdv?: string
}

/** la forme comparable d'un nom : sans accent, sans ponctuation, sans casse.
 *  « Château d'Eau » et « chateau d eau » doivent se rencontrer.
 *
 *  Les deux côtés passent par ici, donc les abréviations n'ont qu'à converger :
 *  « st paul » et « Saint-Paul » deviennent tous deux « saint paul ». C'est le
 *  raccourci le plus courant en français, et sans lui la recherche restait
 *  muette sur une bonne part des stations parisiennes. */
export const formeComparable = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bste\b/g, 'sainte')
    .replace(/\bst\b/g, 'saint')
    .replace(/\bpl\b/g, 'place')
    .replace(/\bbd\b/g, 'boulevard')
    .trim()

/** distance d'édition, bornée : au-delà de `max` on abandonne (inutile de
 *  finir le calcul pour savoir que c'est trop loin). Sert au rattrapage des
 *  fautes de frappe — « Edgard Quinet » doit trouver « Edgar Quinet ». */
export function distanceMots(a: string, b: string, max = 2): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prec = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let mini = i
    for (let j = 1; j <= b.length; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prec[j] + 1, cur[j - 1] + 1, prec[j - 1] + cout)
      if (cur[j] < mini) mini = cur[j]
    }
    if (mini > max) return max + 1
    prec = cur
  }
  return prec[b.length]
}

/** les stations qui répondent à ce qu'on tape, les meilleures d'abord.
 *
 *  L'ordre est celui de la certitude, pas de l'alphabet :
 *  1. le nom exact       — « edgar quinet »
 *  2. ça commence par    — « edgar » pendant la frappe
 *  3. un mot commence par— « quinet », on tape la fin
 *  4. ça contient        — au cas où
 *  5. à une faute près   — « edgard quinet »
 *  À égalité, le nom le plus court gagne : « Opéra » avant « Opéra Bastille ». */
export function chercherStations(q: string, stations: readonly Station[], limite = 6): Station[] {
  const r = formeComparable(q)
  if (r.length < 2) return []
  const notes: { s: Station; rang: number }[] = []
  for (const s of stations) {
    const n = formeComparable(s.nom)
    let rang = -1
    if (n === r) rang = 0
    else if (n.startsWith(r)) rang = 1
    else if (n.split(' ').some((mot) => mot.startsWith(r))) rang = 2
    else if (n.includes(r)) rang = 3
    else if (r.length >= 4 && distanceMots(n, r) <= (r.length >= 8 ? 2 : 1)) rang = 4
    if (rang >= 0) notes.push({ s, rang })
  }
  notes.sort((a, b) => a.rang - b.rang || a.s.nom.length - b.s.nom.length)
  return notes.slice(0, limite).map((x) => x.s)
}

// ── la table locale, tirée de transport.json (déjà chargé par la carte) ──
let cache: Station[] | null = null
let promesse: Promise<Station[]> | null = null

const NOMMABLES: TypeTransport[] = ['metro', 'rer', 'tram']

// monuments + points de rdv : les entrées qui vivent dans le bundle, posées
// en tête de table — à rang et longueur égaux (« bastille » repère vs station),
// l'ordre de table départage, et le point de rdv passe devant : il est plus
// précis que le barycentre des quais.
const horsTransport = (): Station[] => [
  ...MONUMENTS.map((m) => ({
    nom: m.nom, type: 'monument' as const, lat: m.lat, lng: m.lng, trait: m.trait,
  })),
  ...REPERES.map((r) => ({
    nom: r.nom, type: 'repere' as const, lat: r.lat, lng: r.lng, rdv: r.rdv,
  })),
]

export const chargerStations = (): Promise<Station[]> => {
  if (cache) return Promise.resolve(cache)
  if (promesse) return promesse
  promesse = donneesTransport()
    .then((geo) => {
      cache = [...horsTransport(), ...geo.features
        .filter((f) => NOMMABLES.includes(f.properties.type))
        .map((f) => ({
          nom: f.properties.nom,
          type: f.properties.type,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }))]
      return cache
    })
    .catch(() => {
      // pas de transport.json : l'appelant retombera sur Nominatim pour les
      // stations — mais monuments et points de rdv, eux, sont dans le bundle
      cache = horsTransport()
      promesse = null
      return cache
    })
  return promesse
}

/** la table si elle est déjà là, sinon rien — pour un rendu synchrone qui ne
 *  doit surtout pas attendre le réseau. */
export const stationsChargees = (): readonly Station[] => cache ?? []
