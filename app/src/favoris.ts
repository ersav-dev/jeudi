// ════════════════════════════════════════════════════════════════
// jeudi. — LE SIGNET : « celui-là, je le garde sous la main ».
//
// PAS une note, pas un classement : un marque-page. Il existe depuis le
// premier jour, en liste d'ids dans localStorage — l'index le filtre, la
// carte s'en sert pour son rang, l'export l'emporte, la suppression d'un
// spot le nettoie. Rien de tout ça ne change.
//
// Ce qui change le 09/08 : le signet DEVIENT VISIBLE. La carte dessine son
// cœur depuis `Lieu.favori` (Carte.tsx, creerPinLieu) — un champ qui n'avait
// jamais été écrit par personne. Plutôt que d'ouvrir un second système, on
// POSE le champ sur les lieux à la lecture (marquerFavoris) : une seule
// mémoire, deux lectures. Écrire `favori` dans la base serait pire — pour
// mes spots le cloud fait foi et n'a pas cette colonne : il l'effacerait
// à chaque sync.
//
// Ce fichier ne fait que SORTIR ces deux fonctions de db.ts (qui les
// ré-exporte : aucun appelant ne bouge) pour qu'elles soient enfin pures —
// donc testables sans DOM, sans IndexedDB, sans Supabase.
// ════════════════════════════════════════════════════════════════

/** la clé localStorage — préfixe `jeudi-` obligatoire (cf. db.ts) */
export const CLE_FAVORIS = 'jeudi-favoris'

export function lireFavoris(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_FAVORIS) || '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** ce lieu porte-t-il le signet ? `liste` se passe déjà lue quand on en classe
 *  plusieurs (pattern estATester). */
export function estFavori(id: string, liste: string[] = lireFavoris()): boolean {
  return liste.includes(id)
}

/** pose ou retire le signet — renvoie la liste à jour, dont l'appelant fait
 *  son état React (c'est le contrat d'origine, on ne le casse pas). */
export function basculerFavori(id: string): string[] {
  const l = lireFavoris()
  const n = l.includes(id) ? l.filter((x) => x !== id) : [...l, id]
  try {
    localStorage.setItem(CLE_FAVORIS, JSON.stringify(n))
  } catch {
    /* navigation privée / quota : le signet vivra le temps de la session */
  }
  return n
}

/** pose `favori` sur les lieux qui portent le signet — c'est ce champ que la
 *  carte lit pour dessiner son cœur (plein si tu y es allé, creux sinon).
 *  Mute les objets reçus : ils sortent tout juste de la lecture, ils sont à
 *  nous (db.ts → tousLesLieux). */
export function marquerFavoris<T extends { id: string; favori?: boolean }>(
  lieux: T[],
  liste: string[] = lireFavoris(),
): T[] {
  if (liste.length === 0) return lieux
  const signets = new Set(liste)
  for (const l of lieux) {
    if (signets.has(l.id)) l.favori = true
  }
  return lieux
}
