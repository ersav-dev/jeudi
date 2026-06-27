// ════════════════════════════════════════════════════════════════
// jeudi. — le MATCH DE GROUPE (« trouver un endroit avec ses potes »)
// Moteur PUR, local, sans backend : l'app propose une shortlist (algo de
// triangulation des envies + contraintes), puis le groupe « réagit »
// (langage de réactions agrégé). Aucune dépendance UI ici — que de la logique.
//
// ⚠️ ISOLÉ : ce fichier n'est importé nulle part tant que la logique n'est
// pas validée. Il ne touche donc pas à l'app existante.
// ════════════════════════════════════════════════════════════════
import {
  type Lieu,
  type Envie,
  type Meteo,
  distanceM,
  etatHoraire,
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

function veutCeLieu(lieu: Lieu, m: MembrePref): boolean {
  // un lieu sans envie taggée plaît faiblement à tout le monde (neutre)
  return lieu.envies.length === 0 || lieu.envies.some((e) => m.envies.includes(e))
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

export function scoreLieuGroupe(
  lieu: Lieu,
  groupe: MembrePref[],
  maintenant = new Date(),
): ScoreGroupe {
  const total = groupe.length || 1
  const satisfaits = groupe.filter((m) => veutCeLieu(lieu, m)).length
  const couverture = satisfaits / total

  const cout = coutLieu(lieu.meteo)
  const budgetMin = Math.min(...groupe.map((m) => m.budgetMax)) // le plus serré
  const budgetOk = cout == null || cout <= budgetMin

  const dist = distanceM(lieu)
  const distScore = Math.max(0, Math.min(1, 1 - dist / 3000))

  const ouvert = ouvertMaintenant(lieu, maintenant)
  const bonusOuvert = ouvert === true ? 1 : ouvert == null ? 0.5 : 0

  const potos = lieu.compagnies.length === 0 || lieu.compagnies.includes('potos') ? 1 : 0

  const score =
    couverture * 0.5 + (budgetOk ? 1 : 0) * 0.2 + bonusOuvert * 0.15 + potos * 0.08 + distScore * 0.07

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
  maintenant = new Date(),
): ScoreGroupe[] {
  const classes = lieux
    .map((l) => scoreLieuGroupe(l, groupe, maintenant))
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

/** la réaction (simulée mais déterministe) d'un membre face à un lieu */
export function reactionMembre(lieu: Lieu, m: MembrePref, maintenant = new Date()): Reaction {
  const cout = coutLieu(lieu.meteo)
  if (cout != null && cout > m.budgetMax) return 'trop cher'
  if (distanceM(lieu) > TROP_LOIN_M) return 'trop loin'
  if (!veutCeLieu(lieu, m)) return 'pas moi'
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
  maintenant = new Date(),
): ReactionsLieu {
  const reactions = groupe.map((m) => ({ membre: m.prenom, reaction: reactionMembre(lieu, m, maintenant) }))
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
  maintenant = new Date(),
): VerdictGroupe | null {
  const classes = classerPourGroupe(lieux, groupe, topN, maintenant)
  if (!classes.length) return null
  const shortlist = classes.map((score) => ({
    score,
    reactions: reactionsDuGroupe(score.lieu, groupe, maintenant),
  }))
  // gagnant = celui qui combine le mieux score d'algo + nombre de « chaud »
  const gagnant = [...shortlist].sort((a, b) => {
    const ca = a.reactions.comptes.chaud ?? 0
    const cb = b.reactions.comptes.chaud ?? 0
    return cb - ca || b.score.score - a.score.score
  })[0]
  return { gagnant: gagnant.score, reactions: gagnant.reactions, shortlist }
}
