// ════════════════════════════════════════════════════════════════
// jeudi. — LA RAYURE : « celui-là, n'y allez pas ». (09/08)
//
// Le seul signal NÉGATIF de jeudi, et le plus cher de tous. Les règles ont
// été tranchées avec Ersan, elles tiennent en cinq lignes :
//
//   · elle COÛTE : rayer efface le lieu de ton carnet. Pas tout de suite —
//     au jeudi suivant. L'attente EST le repentir : tant que le jeudi n'est
//     pas tombé, tu peux te dédire, et le lieu revient intact.
//   · elle EXPIRE le jeudi suivant à minuit — entre 1 et 7 jours selon le
//     jour où tu rayes. L'app bat au rythme du jeudi, ses serments aussi.
//   · elle est SIGNÉE, jamais anonyme : une rayure sans nom n'est qu'une
//     rumeur, et jeudi ne fait pas de rumeurs.
//   · elle ne se COMPTE JAMAIS. Pas de total, pas de moyenne, pas de score :
//     on lit « rayé par karim — trois quarts d'heure pour deux bières », pas
//     « 4 rayures ». Un lieu ne se note pas, on en témoigne.
//   · une seule rayure par personne et par lieu (la table est indexée par
//     lieu : rayer deux fois n'ajoute rien, ça remplace).
//
// CE FICHIER EST LE CARNET LOCAL, PAS LE RÉSEAU. Il tient MES serments, tout
// de suite, hors-ligne compris (l'app est une PWA : on raye dans le métro).
// La table `public.rayures` (migration 0015, appliquée le 09/08) porte le
// voyage vers le cercle — écriture, repentir et lecture signée vivent dans
// db.ts (rayerLieu / deRayerLieu / chargerRayuresCloud), qui appelle ce
// module en premier et le réseau ensuite. Les rayures des AUTRES ne
// s'écrivent jamais ici : elles arrivent à chaque lecture, ou pas du tout.
//
// localStorage, pattern aTester.ts / marques.ts : préfixe `jeudi-` →
// effacerTout (db.ts) la balaie et exporterMesDonnees l'emporte.
// Logique PURE : testable sans DOM, sans base, sans réseau.
// ════════════════════════════════════════════════════════════════

/** la clé localStorage — préfixe `jeudi-` obligatoire (cf. db.ts) */
export const CLE_RAYURES = 'jeudi-rayures'

/** ce qu'une rayure dit. Structurellement identique à `Lieu['raye']` (db.ts) :
 *  la fiche et la carte lisent ce champ tel quel. */
export interface Rayure {
  /** qui l'a posée — un prénom, jamais un identifiant, jamais vide */
  qui: string
  /** ISO 8601 : le jeudi suivant à minuit. Passé cette date, le lieu s'en va. */
  expire: string
  /** la ligne qui explique — facultative, mais c'est elle qu'on lira */
  motif?: string
}

/** le jeudi suivant, à minuit pile. Toujours à 1 à 7 jours de `depuis` : un
 *  jeudi ne renvoie pas à lui-même (sinon la rayure serait déjà morte). */
export function prochainJeudiMinuit(depuis: Date = new Date()): Date {
  const j = new Date(depuis)
  j.setHours(0, 0, 0, 0)
  // getDay() : 0 = dimanche … 4 = jeudi
  const delta = (4 - j.getDay() + 7) % 7 || 7
  j.setDate(j.getDate() + delta)
  return j
}

/** toutes les rayures posées, échues comprises — {} si le stockage est abîmé */
export function lireRayures(): Record<string, Rayure> {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_RAYURES) ?? '{}')
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
    const propre: Record<string, Rayure> = {}
    for (const [id, r] of Object.entries(v as Record<string, unknown>)) {
      // une rayure sans nom ou sans date n'en est pas une : on la jette
      if (!r || typeof r !== 'object') continue
      const { qui, expire, motif } = r as Partial<Rayure>
      if (typeof qui !== 'string' || !qui) continue
      if (typeof expire !== 'string' || Number.isNaN(Date.parse(expire))) continue
      propre[id] = { qui, expire, ...(typeof motif === 'string' && motif ? { motif } : {}) }
    }
    return propre
  } catch {
    return {}
  }
}

/** la rayure tient-elle encore ? (le jeudi n'est pas tombé) */
export function rayureActive(r: Rayure | undefined, maintenant: Date = new Date()): boolean {
  return !!r && Date.parse(r.expire) > maintenant.getTime()
}

/** les rayures encore debout, prêtes à être posées sur les lieux */
export function rayuresActives(
  maintenant: Date = new Date(),
  table: Record<string, Rayure> = lireRayures(),
): Record<string, Rayure> {
  const vivantes: Record<string, Rayure> = {}
  for (const [id, r] of Object.entries(table)) {
    if (rayureActive(r, maintenant)) vivantes[id] = r
  }
  return vivantes
}

function ecrire(table: Record<string, Rayure>): Record<string, Rayure> {
  try {
    localStorage.setItem(CLE_RAYURES, JSON.stringify(table))
  } catch {
    /* navigation privée / quota : le serment vivra le temps de la session */
  }
  return table
}

/** rayer : on signe, on date au jeudi suivant, on dit pourquoi (si on veut).
 *  Renvoie la table à jour — l'appelant en fait son état (pattern aTester). */
export function rayer(
  lieuId: string,
  qui: string,
  motif = '',
  maintenant: Date = new Date(),
): Record<string, Rayure> {
  const nom = qui.trim()
  if (!nom) return lireRayures() // une rayure anonyme n'existe pas
  const propre = motif.trim()
  const table = { ...lireRayures() }
  table[lieuId] = {
    qui: nom,
    expire: prochainJeudiMinuit(maintenant).toISOString(),
    ...(propre ? { motif: propre } : {}),
  }
  return ecrire(table)
}

/** se dédire avant le jeudi — le lieu revient intact, sans trace du serment */
export function deRayer(lieuId: string): Record<string, Rayure> {
  const table = { ...lireRayures() }
  if (!(lieuId in table)) return table
  delete table[lieuId]
  return ecrire(table)
}

/** les lieux dont la rayure est échue : leur page doit être arrachée pour de
 *  bon (db.ts → balayerRayures). C'est le prix du geste, payé à retardement. */
export function rayuresExpirees(
  maintenant: Date = new Date(),
  table: Record<string, Rayure> = lireRayures(),
): string[] {
  return Object.entries(table)
    .filter(([, r]) => !rayureActive(r, maintenant))
    .map(([id]) => id)
}

/** pose `raye` sur les lieux encore rayés — c'est ce champ que la carte lit
 *  pour tracer sa croix (Carte.tsx : elle bat tout le reste, le lieu est mort
 *  pour toi). Une rayure échue ne se pose PAS : son lieu est en sursis, le
 *  balayage suivant l'emportera. Mute les objets reçus : ils sortent tout
 *  juste de la lecture, ils sont à nous (db.ts → tousLesLieux). */
export function marquerRayures<T extends { id: string; raye?: Rayure }>(
  lieux: T[],
  maintenant: Date = new Date(),
  table: Record<string, Rayure> = lireRayures(),
): T[] {
  for (const l of lieux) {
    const r = table[l.id]
    if (rayureActive(r, maintenant)) l.raye = r
  }
  return lieux
}

/** un lieu effacé n'a plus de rayure à traîner (cf. effacerIdLocal, db.ts) */
export function oublierRayure(id: string): void {
  const table = lireRayures()
  if (!(id in table)) return
  delete table[id]
  ecrire(table)
}
