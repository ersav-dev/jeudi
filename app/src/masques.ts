// ════════════════════════════════════════════════════════════════
// jeudi. — SUPPRIMER LE SPOT D'UN POTE (09/08).
//
// Le modèle est clair : les spots du cercle sont en lecture seule, on ne les
// « adopte » qu'en les copiant. Donc « supprimer » un spot qui n'est pas à
// moi ne peut pas effacer SA ligne dans le cloud — seulement le retirer de
// MA carte. Sans ça, tousLesLieux() le retéléchargerait à la synchro
// suivante (RLS : la ligne du pote reste 'actif' pour LUI) et la suppression
// n'aurait tenu qu'une session.
//
// D'où cette petite table locale, à part : une liste d'ids masqués. Rien à
// voir avec `statut` (qui, lui, appartient au propriétaire) — un masque ne
// regarde QUE moi, ne se pousse jamais au cloud, et ne connaît pas de
// retour prévu (pour le remettre sur ma carte, on l'adopte à nouveau s'il
// repasse sous les yeux — pas de bouton « je le remets » ici).
//
// localStorage, pattern aTester.ts/favoris.ts : préfixe `jeudi-` obligatoire
// → effacerTout (db.ts) le balaie, exporterMesDonnees l'emporte.
// ════════════════════════════════════════════════════════════════

/** la clé localStorage — préfixe `jeudi-` obligatoire (cf. db.ts) */
export const CLE_MASQUES = 'jeudi-masques'

function lire(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_MASQUES) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** tous les ids masqués — un Set, prêt pour un `.has()` en boucle */
export function lireMasques(): Set<string> {
  return new Set(lire())
}

/** ce spot est-il masqué ? `table` se passe déjà lue quand on classe toute
 *  une liste (comme estATester). */
export function estMasque(id: string, table: Set<string> = lireMasques()): boolean {
  return table.has(id)
}

/** retire ce spot de MA carte, pour de bon — jamais pour un spot à MOI :
 *  ceux-là s'effacent pour de vrai (supprimerLieu, db.ts), pas de raison de
 *  les masquer en plus. */
export function masquerLieu(id: string): void {
  const table = lire()
  if (table.includes(id)) return
  table.push(id)
  try {
    localStorage.setItem(CLE_MASQUES, JSON.stringify(table))
  } catch {
    /* navigation privée / quota : le masque vivra le temps de la session */
  }
}
