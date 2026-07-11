// ════════════════════════════════════════════════════════════════
// jeudi. — LE MODE « JE SAIS PAS » (bloc B)
// Trois mini-plans tirés du carnet quand on ne sait pas quoi faire :
// une ZONE (des lieux qui vivent à portée de marche l'un de l'autre),
// deux spots complémentaires (apéro → assiettes, assiettes → verres,
// ou solo : un spot + un plan B à côté) et une accroche mono.
//
// Moteur PUR : pas de stockage, pas de DOM. L'aléatoire passe par une
// GRAINE injectable (les tests la fixent ; l'app tire la sienne au
// Math.random, autorisé côté app seulement). Même graine = mêmes plans.
// Branché sur « ce soir » — CeSoir.tsx (l'étiquette « je sais pas »).
// ════════════════════════════════════════════════════════════════
import { type Lieu, distanceM, etatHoraire, formatDistance, tempsMarche } from './db'

/** le tirage ne connaît que les trois compagnies du soir (pas « pro ») */
export type CompagnieTirage = 'solo' | 'duo' | 'potos'

export interface SpotDePlan {
  lieu: Lieu
  /** la ligne mono sous le nom (« d'abord · apéro · 450 m de toi · ferme à 2h ») */
  ligne: string
}

export interface Plan {
  /** le nom de la zone : le quartier du pivot, sinon sa rue, sinon autour du lieu */
  zone: string
  /** l'accroche mono du plan (« au feeling · apéro puis assiettes ») */
  accroche: string
  /** les 2 spots complémentaires, dans l'ordre de la soirée */
  spots: SpotDePlan[]
}

// la soirée se fait à pied : un plan tient dans ~600 m autour du pivot —
// le pivot étant le 1ᵉʳ spot, les deux spots d'un plan restent < 800 m
const RAYON_ZONE_M = 600
// deux plans = deux zones : les pivots s'écartent d'au moins ça (tant que possible)
const ECART_PIVOTS_M = 900

// le genre d'un lieu, déduit de ses envies : on assemble des paires variées
const MANGER = new Set<string>(['resto', 'gastro', 'alloco', 'tranquilo'])
const BOIRE = new Set<string>(['apéro', 'incognito', 'disco', 'turbo'])
type Genre = 'manger' | 'boire' | 'autre'

function genreDe(l: Lieu): Genre {
  const es = l.envies as readonly string[]
  const m = es.filter((e) => MANGER.has(e)).length
  const b = es.filter((e) => BOIRE.has(e)).length
  if (!m && !b) return 'autre'
  if (m === b) return MANGER.has(es[0]) ? 'manger' : 'boire'
  return m > b ? 'manger' : 'boire'
}

function enviePrincipale(l: Lieu): string {
  return (l.envies as readonly string[])[0] ?? ''
}

// ── l'aléatoire par graine : mulberry32, déterministe et suffisant ──
function mulberry32(a: number): () => number {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// la compagnie plie la graine : solo et potos ne tirent pas la même soirée
const CODE_COMPAGNIE: Record<CompagnieTirage, number> = { solo: 0x0353, duo: 0x0a21, potos: 0x1b47 }

/** tirage pondéré SANS remise implicite (le caller filtre son vivier) */
function tirerPondere(items: Lieu[], poids: (l: Lieu) => number, rnd: () => number): Lieu | null {
  if (!items.length) return null
  const total = items.reduce((s, l) => s + poids(l), 0)
  let t = rnd() * total
  for (const l of items) {
    t -= poids(l)
    if (t <= 0) return l
  }
  return items[items.length - 1]
}

/** le nom de la zone : le « Quartier … » de l'adresse du pivot (article viré),
 *  sinon la rue, sinon « autour de {nom du lieu} » */
export function nomZone(pivot: Lieu): string {
  const parts = (pivot.adresse ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const p of parts) {
    const m = p.match(/^quartier\s+(?:de\s+la\s+|de\s+l['’]\s*|du\s+|des\s+|de\s+|d['’]\s*)?(.+)$/i)
    if (m) return m[1]
  }
  const rue = parts.find((p) =>
    /^(rue|avenue|boulevard|quai|place|passage|cours|allée|impasse|villa|cité)\b/i.test(p),
  )
  if (rue) return rue.charAt(0).toLowerCase() + rue.slice(1)
  return `autour de ${pivot.nom}`
}

// l'accroche : un mood tiré + la séquence de la soirée, tout en mono minuscule
type Sequence = 'apero-assiettes' | 'assiettes-verres' | 'voisins' | 'solo'
const MOODS = ['en douceur', 'au feeling', 'sans se presser', "l'air de rien", 'sans détour', 'la belle heure']
const PHRASES: Record<Sequence, string> = {
  'apero-assiettes': 'apéro puis assiettes',
  'assiettes-verres': 'assiettes puis verres',
  voisins: 'deux spots à deux pas',
  solo: 'ton spot, un plan B à côté',
}

/** la bribe d'horaire qui vaut la peine : « ferme à 2h » quand c'est sûr d'être ouvert */
function bribeHoraire(l: Lieu, maintenant: Date): string {
  const h = etatHoraire(l.horaires, maintenant)
  return h?.ouvert === true ? h.texte.replace('ouvert · ', '') : ''
}

function ligneSpot(role: string, l: Lieu, complement: string, maintenant: Date): string {
  return [role, enviePrincipale(l), complement, bribeHoraire(l, maintenant)].filter(Boolean).join(' · ')
}

/** le 2ᵉ spot du plan : le complément du pivot (jamais deux restos identiques) */
function choisirSuite(
  pivot: Lieu,
  voisins: Lieu[],
  compagnie: CompagnieTirage,
  poids: (l: Lieu) => number,
  rnd: () => number,
): { suite: Lieu; sequence: Sequence } | null {
  if (compagnie === 'solo') {
    // le plan B : le plus proche, à envie différente si possible (tri stable par id)
    const autres = voisins.filter((l) => enviePrincipale(l) !== enviePrincipale(pivot))
    const vivier = autres.length ? autres : voisins
    const suite = [...vivier].sort(
      (a, b) => distanceM(a, pivot) - distanceM(b, pivot) || a.id.localeCompare(b.id),
    )[0]
    return suite ? { suite, sequence: 'solo' } : null
  }

  const g = genreDe(pivot)
  if (g === 'boire') {
    const suite = tirerPondere(voisins.filter((l) => genreDe(l) === 'manger'), poids, rnd)
    if (suite) return { suite, sequence: 'apero-assiettes' }
  }
  if (g === 'manger') {
    const suite = tirerPondere(voisins.filter((l) => genreDe(l) === 'boire'), poids, rnd)
    if (suite) return { suite, sequence: 'assiettes-verres' }
  }
  // pas de complément parfait : deux voisins aux envies VARIÉES. même envie
  // principale + même genre = deux restos identiques → on refuse (sauf fiches
  // sans envies, qu'on ne peut pas départager honnêtement).
  const varies = voisins.filter((l) => enviePrincipale(l) !== enviePrincipale(pivot) || genreDe(l) !== g)
  const vivier = varies.length ? varies : g === 'autre' ? voisins : []
  const suite = tirerPondere(vivier, poids, rnd)
  return suite ? { suite, sequence: 'voisins' } : null
}

/** tire jusqu'à 3 mini-plans depuis le carnet. `graine` : même graine = mêmes
 *  plans (le « re-tire » de l'app en change). `favoris`/`maintenant` injectés
 *  par le caller — le moteur ne lit rien lui-même. */
export function tirerPlans(
  lieux: Lieu[],
  compagnie: CompagnieTirage,
  graine?: number,
  options: { favoris?: string[]; maintenant?: Date } = {},
): Plan[] {
  const g = graine ?? Math.floor(Math.random() * 0x7fffffff) // app seulement — les tests injectent
  const rnd = mulberry32((Math.imul(g | 0, 2654435761) ^ CODE_COMPAGNIE[compagnie]) | 0)
  const maintenant = options.maintenant ?? new Date()
  const favoris = new Set(options.favoris ?? [])

  // le vivier : actifs, pas fermés (horaires inconnus = on garde), bons pour la compagnie
  const candidats = lieux.filter((l) => {
    if (l.statut !== 'actif') return false
    if (etatHoraire(l.horaires, maintenant)?.ouvert === false) return false
    return l.compagnies.length === 0 || l.compagnies.includes(compagnie)
  })

  // la pondération : les tips du cercle devant, les favoris un peu boostés,
  // la distance raisonnable (au-delà de 4 km le bonus s'éteint)
  const poids = (l: Lieu): number => {
    let p = 1
    if (l.tipsCercle?.length) p += 0.9
    if (favoris.has(l.id)) p += 0.35
    p += Math.max(0, 1 - distanceM(l) / 4000) * 0.4
    return p
  }
  // en solo le pivot penche vers les spots où l'on est bien seul
  const poidsPivotSolo = (l: Lieu): number =>
    poids(l) *
    (l.compagnies.includes('solo') || l.envies.some((e) => e === 'incognito' || e === 'tranquilo')
      ? 1.6
      : 1)

  const plans: Plan[] = []
  const pris = new Set<string>() // jamais deux fois le même spot entre les plans
  const pivots: Lieu[] = []

  for (let essai = 0; plans.length < 3 && essai < 40; essai++) {
    const pool = candidats.filter((l) => !pris.has(l.id))
    if (pool.length < 2) break

    // le pivot (= le 1ᵉʳ spot) : tiré au sort pondéré, au large des zones déjà
    // tirées tant que c'est possible (après 20 essais on lâche la contrainte)
    const auLarge = pool.filter((l) => pivots.every((p) => distanceM(l, p) >= ECART_PIVOTS_M))
    const vivier = essai < 20 && auLarge.length ? auLarge : pool
    const pivot = tirerPondere(vivier, compagnie === 'solo' ? poidsPivotSolo : poids, rnd)
    if (!pivot) break

    // la zone : ce qui vit à ~600 m du pivot
    const voisins = pool.filter((l) => l.id !== pivot.id && distanceM(l, pivot) <= RAYON_ZONE_M)
    if (!voisins.length) continue

    const paire = choisirSuite(pivot, voisins, compagnie, poids, rnd)
    if (!paire) continue
    const { suite, sequence } = paire

    const [role1, role2] = compagnie === 'solo' ? ['le spot', 'le plan B'] : ["d'abord", 'ensuite']
    const mood = MOODS[Math.floor(rnd() * MOODS.length)]
    plans.push({
      zone: nomZone(pivot),
      accroche: `${mood} · ${PHRASES[sequence]}`,
      spots: [
        {
          lieu: pivot,
          ligne: ligneSpot(role1, pivot, `${formatDistance(distanceM(pivot))} de toi`, maintenant),
        },
        {
          lieu: suite,
          ligne: ligneSpot(role2, suite, `à ${tempsMarche(distanceM(suite, pivot))} min du premier`, maintenant),
        },
      ],
    })
    pris.add(pivot.id)
    pris.add(suite.id)
    pivots.push(pivot)
  }

  return plans
}
