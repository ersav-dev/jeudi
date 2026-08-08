// ════════════════════════════════════════════════════════════════
// jeudi. — « À TESTER » : la pile de ceux où je ne suis pas encore allé.
//
// Ça existait déjà, mais SUBI : le filtre « à tester » (App.tsx) montrait
// les spots sans tampon, et c'est tout. Pas de tampon = pas encore fait :
// la règle est juste, on la garde comme DÉFAUT. Ce qui manquait, c'est de
// pouvoir la contredire à la main — « celui-là j'y suis allé, mais je veux
// y retourner », « celui-là je l'ai rangé, il n'est plus dans ma pile ».
//
// D'où une seule chose ici : une TABLE D'EXCEPTIONS. Pas un second système
// de statut — un carnet où l'on rature la règle, spot par spot. Quand le
// choix rejoint le défaut, l'exception s'efface (rien ne traîne).
//
// localStorage, pattern marques.ts : préfixe `jeudi-` → effacerTout (db.ts)
// la balaie, et exporterMesDonnees l'emporte. Logique PURE, testable sans DOM.
// ════════════════════════════════════════════════════════════════

/** la clé localStorage — préfixe `jeudi-` obligatoire (cf. db.ts) */
export const CLE_A_TESTER = 'jeudi-a-tester'

/** ce qu'une exception peut dire : « si, à tester » ou « non, plus à tester » */
export type MarqueATester = 'oui' | 'non'

/** ce qu'un lieu doit montrer pour qu'on sache le classer : son id, et
 *  s'il porte un tampon (validé / passé à côté). Pas besoin du reste. */
export interface LieuClassable {
  id: string
  tampon?: unknown
}

/** toutes les exceptions : Record<lieuId, 'oui' | 'non'> — {} si stockage abîmé */
export function lireATester(): Record<string, MarqueATester> {
  try {
    const v = JSON.parse(localStorage.getItem(CLE_A_TESTER) ?? '{}')
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {}
    const propre: Record<string, MarqueATester> = {}
    for (const [id, m] of Object.entries(v)) {
      if (m === 'oui' || m === 'non') propre[id] = m
    }
    return propre
  } catch {
    return {}
  }
}

/** la règle du carnet, sans exception : pas de tampon = pas encore fait */
export function defautATester(lieu: LieuClassable): boolean {
  return !lieu.tampon
}

/** ce lieu est-il dans ma pile « à tester » ? l'exception d'abord, la règle
 *  ensuite. `table` se passe déjà lue quand on classe toute une liste. */
export function estATester(lieu: LieuClassable, table: Record<string, MarqueATester> = lireATester()): boolean {
  const m = table[lieu.id]
  return m ? m === 'oui' : defautATester(lieu)
}

function ecrire(table: Record<string, MarqueATester>): Record<string, MarqueATester> {
  try {
    localStorage.setItem(CLE_A_TESTER, JSON.stringify(table))
  } catch {
    /* navigation privée / quota : le choix vivra le temps de la session */
  }
  return table
}

/** pose ou retire le lieu de la pile — renvoie la table à jour (pattern
 *  basculerFavori de db.ts : l'appelant en fait son état React).
 *  Si le choix retombe sur la règle, l'exception disparaît : le carnet ne
 *  garde pas la trace d'une rature qui ne rature plus rien. */
export function basculerATester(lieu: LieuClassable): Record<string, MarqueATester> {
  const table = { ...lireATester() }
  const vise = !estATester(lieu, table)
  if (vise === defautATester(lieu)) delete table[lieu.id]
  else table[lieu.id] = vise ? 'oui' : 'non'
  return ecrire(table)
}

/** un lieu effacé n'a plus d'exception à traîner */
export function oublierATester(id: string): void {
  const table = lireATester()
  if (!(id in table)) return
  delete table[id]
  ecrire(table)
}
