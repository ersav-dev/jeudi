// ════════════════════════════════════════════════════════════════
// jeudi. — le MATCH DE GROUPE (« trouver un endroit avec ses potes »)
// Moteur PUR, local, sans backend : l'app propose une shortlist (algo de
// triangulation des envies + contraintes), puis le groupe « réagit »
// (langage de réactions agrégé). Aucune dépendance UI ici — que de la logique.
//
// Branché sur « sortir à plusieurs » (onglet cercle) — EcranGroupe.tsx
// (compose → swipe → match).
// ════════════════════════════════════════════════════════════════
import {
  type Lieu,
  type Envie,
  type Meteo,
  distanceM,
  etatHoraire,
  maPosition,
} from './db'

// ── le profil de préférences d'un membre du groupe ──────────────
// (en V1 le cercle est simulé : on déduit ces profils de leurs persos.
//  remplacés par les vraies préférences quand le cloud arrive.)
export interface MembrePref {
  id: string
  prenom: string
  /** ce qu'il cherche, en envies (lexique en -o) */
  envies: Envie[]
  /** le plus qu'il est prêt à dépenser : 0 = ça coûte rien · 1 = milieu · 2 = on flambe */
  budgetMax: 0 | 1 | 2
}

// profils simulés cohérents avec les membres du seed (Karim/Léa)
export const PROFILS_MEMBRES: Record<string, MembrePref> = {
  karim: { id: 'karim', prenom: 'Karim', envies: ['apéro', 'incognito', 'tranquilo'], budgetMax: 1 },
  lea: { id: 'lea', prenom: 'Léa', envies: ['resto', 'gastro', 'tranquilo'], budgetMax: 2 },
}

/** mon propre profil dans le groupe, construit depuis ma sélection du soir */
export function monProfil(envies: Envie[], budgetMax: 0 | 1 | 2 = 1): MembrePref {
  return { id: 'moi', prenom: 'toi', envies, budgetMax }
}

// ── le coût d'un lieu, depuis sa « météo du porte-monnaie » ──────
// soleil = ça coûte (2) · nuageux = milieu (1) · pluie = ça coûte rien (0).
function coutLieu(m?: Meteo): 0 | 1 | 2 | null {
  if (m === 'soleil') return 2
  if (m === 'nuageux') return 1
  if (m === 'pluie') return 0
  return null // coût inconnu → on ne pénalise pas
}

const TROP_LOIN_M = 2500 // au-delà, un pote dira « trop loin »

/** crédit d'envie d'un membre pour un lieu : 1 = une envie couverte ·
 *  0,5 = lieu SANS envie taggée (demi-crédit : les fiches vides ne doivent
 *  pas battre les fiches honnêtes) · 0 = taggé mais rien pour lui. */
function creditEnvie(lieu: Lieu, m: MembrePref): number {
  if (lieu.envies.length === 0) return 0.5
  return lieu.envies.some((e) => m.envies.includes(e)) ? 1 : 0
}

function ouvertMaintenant(lieu: Lieu, maintenant = new Date()): boolean | null {
  return lieu.horaires ? (etatHoraire(lieu.horaires, maintenant)?.ouvert ?? null) : null
}

// ════════════════════════════════════════════════════════════════
// 1) SCORE DE GROUPE — l'app classe les lieux pour LE groupe
// ════════════════════════════════════════════════════════════════
export interface ScoreGroupe {
  lieu: Lieu
  /** 0..1 : à quel point ce lieu convient au groupe entier */
  score: number
  /** combien de membres ce lieu satisfait (envie couverte) */
  satisfaits: number
  total: number
  /** passe pour le porte-monnaie le plus serré du groupe ? */
  budgetOk: boolean
  distance: number
  ouvert: boolean | null
  /** une phrase courte qui explique le classement */
  pourquoi: string
}

/** le point de rendez-vous : le barycentre des points de départ du groupe.
 *  l'app triangule « au milieu » → près de tout le monde.
 *  sans aucun départ : repli sur `repli` (ma position par défaut) — jamais
 *  {0,0}, qui poserait le rendez-vous au large du golfe de Guinée. */
export function triangule(
  departs: { lat: number; lng: number }[],
  repli: { lat: number; lng: number } = maPosition,
): { lat: number; lng: number } {
  if (!departs.length) return { lat: repli.lat, lng: repli.lng }
  const n = departs.length
  return {
    lat: departs.reduce((s, p) => s + p.lat, 0) / n,
    lng: departs.reduce((s, p) => s + p.lng, 0) / n,
  }
}

export function scoreLieuGroupe(
  lieu: Lieu,
  groupe: MembrePref[],
  centre?: { lat: number; lng: number },
  maintenant = new Date(),
): ScoreGroupe {
  const total = groupe.length || 1
  const credits = groupe.map((m) => creditEnvie(lieu, m))
  // satisfaits = envie vraiment couverte (le demi-crédit des fiches vides ne compte pas)
  const satisfaits = credits.filter((c) => c >= 1).length
  const couverture = credits.reduce((s, c) => s + c, 0) / total

  const cout = coutLieu(lieu.meteo)
  // le porte-monnaie le plus serré ; groupe vide → pas de contrainte
  // (garde anti Math.min(...[]) = Infinity)
  const budgetMin = groupe.length ? Math.min(...groupe.map((m) => m.budgetMax)) : 2
  const budgetOk = cout == null || cout <= budgetMin
  // coût inconnu = demi-confiance (0,1 au lieu du bonus plein 0,2) :
  // les fiches vides ne doivent pas battre les fiches honnêtes.
  const bonusBudget = cout == null ? 0.1 : cout <= budgetMin ? 0.2 : 0

  const dist = distanceM(lieu, centre) // distance depuis le point de rendez-vous
  const distScore = Math.max(0, Math.min(1, 1 - dist / 3000))

  const ouvert = ouvertMaintenant(lieu, maintenant)
  const bonusOuvert = ouvert === true ? 1 : ouvert == null ? 0.5 : 0

  const potos = lieu.compagnies.length === 0 || lieu.compagnies.includes('potos') ? 1 : 0

  const score =
    couverture * 0.5 + bonusBudget + bonusOuvert * 0.15 + potos * 0.08 + distScore * 0.07

  // la phrase « pourquoi »
  const bouts: string[] = [`plaît à ${satisfaits}/${total}`]
  if (!budgetOk) bouts.push('trop cher pour le groupe')
  if (ouvert === true) bouts.push('ouvert maintenant')
  else if (ouvert === false) bouts.push('fermé là')

  return { lieu, score, satisfaits, total, budgetOk, distance: dist, ouvert, pourquoi: bouts.join(' · ') }
}

/** classe tous les lieux pour le groupe (meilleur d'abord), top N optionnel */
export function classerPourGroupe(
  lieux: Lieu[],
  groupe: MembrePref[],
  topN?: number,
  centre?: { lat: number; lng: number },
  maintenant = new Date(),
): ScoreGroupe[] {
  const classes = lieux
    .map((l) => scoreLieuGroupe(l, groupe, centre, maintenant))
    .sort((a, b) => b.score - a.score || a.distance - b.distance)
  return topN ? classes.slice(0, topN) : classes
}

// ════════════════════════════════════════════════════════════════
// 2) LANGAGE DE RÉACTIONS — le groupe réagit à la shortlist
// (idée d'Ersan, chantier 8). Icônes ENCRE à l'affichage, jamais d'émoji.
// ════════════════════════════════════════════════════════════════
export type Reaction = 'chaud' | 'pourquoi pas' | 'pas moi' | 'trop cher' | 'trop loin'

export const REACTION_LABELS: Record<Reaction, string> = {
  chaud: 'chaud',
  'pourquoi pas': 'pourquoi pas',
  'pas moi': 'pas moi',
  'trop cher': 'trop cher',
  'trop loin': 'trop loin',
}

/** la réaction (simulée mais déterministe) d'un membre face à un lieu.
 *  `centre` = le point de rendez-vous TRIANGULÉ : « trop loin » se juge depuis
 *  là (le trajet du groupe), pas depuis ma position à moi. */
export function reactionMembre(
  lieu: Lieu,
  m: MembrePref,
  centre: { lat: number; lng: number },
  maintenant = new Date(),
): Reaction {
  const cout = coutLieu(lieu.meteo)
  if (cout != null && cout > m.budgetMax) return 'trop cher'
  if (distanceM(lieu, centre) > TROP_LOIN_M) return 'trop loin'
  if (creditEnvie(lieu, m) === 0) return 'pas moi'
  if (ouvertMaintenant(lieu, maintenant) === false) return 'pourquoi pas'
  return 'chaud'
}

export interface ReactionsLieu {
  lieu: Lieu
  reactions: { membre: string; reaction: Reaction }[]
  /** comptes par réaction, ex. { chaud: 2, 'trop cher': 1 } */
  comptes: Partial<Record<Reaction, number>>
  /** le résumé agrégé en une phrase (« le groupe est chaud, mais… ») */
  resume: string
}

export function reactionsDuGroupe(
  lieu: Lieu,
  groupe: MembrePref[],
  centre: { lat: number; lng: number },
  maintenant = new Date(),
): ReactionsLieu {
  const reactions = groupe.map((m) => ({
    membre: m.prenom,
    reaction: reactionMembre(lieu, m, centre, maintenant),
  }))
  const comptes: Partial<Record<Reaction, number>> = {}
  for (const r of reactions) comptes[r.reaction] = (comptes[r.reaction] ?? 0) + 1

  const total = groupe.length || 1
  const chauds = comptes.chaud ?? 0
  // les freins (qui n'est pas chaud), du plus fréquent au moins fréquent
  const freins = (Object.entries(comptes) as [Reaction, number][])
    .filter(([r]) => r !== 'chaud')
    .sort((a, b) => b[1] - a[1])

  let resume: string
  if (chauds === total) {
    resume = 'tout le monde est chaud.'
  } else if (chauds >= total / 2) {
    const top = freins[0]
    resume = top ? `le groupe est chaud, mais ${top[0]} pour ${top[1]}.` : 'le groupe est plutôt chaud.'
  } else if (chauds > 0) {
    resume = 'tiède : ça hésite.'
  } else {
    const top = freins[0]
    resume = top ? `non : ${top[0]} pour la plupart.` : 'le groupe ne le sent pas.'
  }

  return { lieu, reactions, comptes, resume }
}

// ════════════════════════════════════════════════════════════════
// 3) LE VERDICT — où le groupe converge vraiment
// On croise le score d'algo et l'adhésion (les « chaud ») pour sortir
// le(s) lieu(x) gagnant(s).
// ════════════════════════════════════════════════════════════════
export interface VerdictGroupe {
  gagnant: ScoreGroupe
  reactions: ReactionsLieu
  shortlist: { score: ScoreGroupe; reactions: ReactionsLieu }[]
}

export function verdictDeGroupe(
  lieux: Lieu[],
  groupe: MembrePref[],
  topN = 5,
  centre?: { lat: number; lng: number },
  maintenant = new Date(),
): VerdictGroupe | null {
  const point = centre ?? maPosition // sans rendez-vous fourni : depuis moi
  const classes = classerPourGroupe(lieux, groupe, topN, point, maintenant)
  if (!classes.length) return null
  const shortlist = classes.map((score) => ({
    score,
    reactions: reactionsDuGroupe(score.lieu, groupe, point, maintenant),
  }))
  // gagnant = celui qui combine le mieux score d'algo + nombre de « chaud »
  const gagnant = [...shortlist].sort((a, b) => {
    const ca = a.reactions.comptes.chaud ?? 0
    const cb = b.reactions.comptes.chaud ?? 0
    return cb - ca || b.score.score - a.score.score
  })[0]
  return { gagnant: gagnant.score, reactions: gagnant.reactions, shortlist }
}
