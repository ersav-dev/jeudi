// ════════════════════════════════════════════════════════════════
// jeudi. — LE JUGEMENT : « le regard d'un proche, pas une note »
// (CONCEPT.md « Les critères » § gradué, 09/08/2026).
//
// Trois niveaux, en pastilles (●○○ · ●●○ · ●●●). JAMAIS d'étoiles, JAMAIS
// de « /5 », JAMAIS de moyenne, JAMAIS de classement, JAMAIS de compteur.
// Un jugement est TOUJOURS signé et singulier — c'est une loi du concept.
//
// Puisqu'un membre = UN SEUL critère (son obsession, `critereMembre.ts` /
// `profils.critere`), un jugement n'a pas besoin de porter l'identifiant
// du critère : le critère se DÉDUIT de qui juge (« le bruit selon Karim »
// = Karim a jugé, donc c'est forcément SON critère, le bruit). D'où la
// forme minimale : (qui, quel lieu, quel niveau). Pas de critere_id ici.
//
// Règle du concept : on peut juger TOUT lieu où on est allé (donc qui
// porte notre tampon — `Lieu['tampon']`, db.ts), pas seulement ses
// propres spots. peutJuger() porte cette règle, en pur.
//
// CE FICHIER EST LE CARNET LOCAL (pattern rayure.ts) : mes jugements,
// tout de suite, hors-ligne compris. La table `public.jugements`
// (migration 0017, PAS ENCORE APPLIQUÉE) porte le voyage vers le cercle.
// Le GESTE de juger (le tap sur les pastilles) n'est PAS construit ce
// soir — seulement la couche donnée + les fonctions pures qui le
// porteront. Rien ici n'appelle le réseau.
// ════════════════════════════════════════════════════════════════

/** la clé localStorage — préfixe `jeudi-` obligatoire (cf. db.ts) */
export const CLE_JUGEMENTS = 'jeudi-jugements'

/** les trois niveaux permis — jamais un 4e, jamais une demi-pastille */
export type Niveau = 1 | 2 | 3
const NIVEAUX: readonly Niveau[] = [1, 2, 3]

export function niveauValide(n: unknown): n is Niveau {
  return typeof n === 'number' && (NIVEAUX as readonly number[]).includes(n)
}

/** un jugement posé sur UN lieu (la table est déjà indexée par lieu — le
 *  qui-juge, c'est toujours moi ici, cf. l'en-tête de rayure.ts) */
export interface Jugement {
  niveau: Niveau
  /** ISO 8601 : quand j'ai posé ce jugement */
  le: string
}

/** ●○○ / ●●○ / ●●● — jamais une étoile, jamais un « /5 » (mécanique des
 *  WC généralisée à n'importe quel critère, CONCEPT.md) */
export function pastille(n: Niveau): string {
  return '●'.repeat(n) + '○'.repeat(3 - n)
}

/** ai-je le droit de juger ce lieu ? Seulement s'il porte MON tampon — la
 *  preuve que j'y suis allé (CONCEPT.md : « on peut juger tout lieu où on
 *  est allé »). Comparaison par prénom, insensible à la casse et aux
 *  espaces — le même « qui » que celui posé au moment de la validation
 *  (App.tsx, tampon: { …, qui: prenom }). */
export function peutJuger(
  lieu: { tampon?: { qui?: string } } | undefined | null,
  moi: string,
): boolean {
  const q = lieu?.tampon?.qui?.trim().toLowerCase()
  const m = moi.trim().toLowerCase()
  return !!q && !!m && q === m
}

/** tous les jugements posés — {} si le stockage est abîmé (pattern rayure.ts) */
export function lireJugements(): Record<string, Jugement> {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_JUGEMENTS) ?? '{}')
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
    const propre: Record<string, Jugement> = {}
    for (const [id, j] of Object.entries(v as Record<string, unknown>)) {
      if (!j || typeof j !== 'object') continue
      const { niveau, le } = j as Partial<Jugement>
      if (!niveauValide(niveau)) continue
      if (typeof le !== 'string' || Number.isNaN(Date.parse(le))) continue
      propre[id] = { niveau, le }
    }
    return propre
  } catch {
    return {}
  }
}

function ecrire(table: Record<string, Jugement>): Record<string, Jugement> {
  try {
    localStorage.setItem(CLE_JUGEMENTS, JSON.stringify(table))
  } catch {
    /* navigation privée / quota : le jugement vivra le temps de la session */
  }
  return table
}

/** POSER mon jugement sur un lieu — refuse silencieusement (table
 *  inchangée, jamais d'exception) si le niveau est invalide OU si je n'y
 *  suis pas allé (peutJuger). Juger deux fois REMPLACE : un seul jugement
 *  par personne et par lieu, jamais d'empilement, jamais une moyenne. */
export function jugerLieu(
  lieuId: string,
  niveau: Niveau,
  lieu: { tampon?: { qui?: string } } | undefined | null,
  moi: string,
  maintenant: Date = new Date(),
): Record<string, Jugement> {
  if (!lieuId || !niveauValide(niveau) || !peutJuger(lieu, moi)) return lireJugements()
  const table = { ...lireJugements() }
  table[lieuId] = { niveau, le: maintenant.toISOString() }
  return ecrire(table)
}

/** se dédire — le jugement disparaît, sans trace (comme se dédire d'une rayure) */
export function retirerJugement(lieuId: string): Record<string, Jugement> {
  const table = { ...lireJugements() }
  if (!(lieuId in table)) return table
  delete table[lieuId]
  return ecrire(table)
}

/** mon jugement sur un lieu donné, s'il existe */
export function monJugement(
  lieuId: string,
  table: Record<string, Jugement> = lireJugements(),
): Jugement | undefined {
  return table[lieuId]
}

/** un lieu effacé n'a plus de jugement à traîner (cf. oublierRayure, rayure.ts) */
export function oublierJugement(id: string): void {
  const table = lireJugements()
  if (!(id in table)) return
  delete table[id]
  ecrire(table)
}
