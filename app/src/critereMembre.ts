// ════════════════════════════════════════════════════════════════
// jeudi. — LE CRITÈRE DU MEMBRE (son obsession, singulier — CONCEPT.md
// « Les critères » : « Karim EST le bruit, Léa EST la lumière »).
//
// ⚠ À NE PAS CONFONDRE (trois choses qui portent presque le même nom) :
//   · CE fichier : LE critère d'UNE PERSONNE — un seul, texte libre,
//     stocké sur `profils.critere` (colonne posée dès la migration 0001,
//     lue/écrite par lireProfil()/sauverProfil(), db.ts). Déclaré dans le
//     bloc « mes infos » du profil (App.tsx), skippable — la valeur
//     d'onboarding ('le feeling') suffit tant qu'on n'y touche pas.
//   · `criteres.ts` : une LISTE de dimensions de jugement (binaire/gradué)
//     que le membre définit pour lui-même — fonctionnalité distincte,
//     antérieure, qu'on ne touche pas ici.
//   · `Lieu.criterePerso` (db.ts) : le verdict d'UN membre SUR UN LIEU
//     (ex. « lumière : parfaite à 19h »). Ça appartient au LIEU, pas à
//     la personne.
//
// Logique PURE : testable sans DOM, sans base, sans réseau. La
// persistance (locale + cloud) existe déjà — sauverProfil()/lireProfil()
// gèrent `critere` comme n'importe quel autre champ du profil.
// ════════════════════════════════════════════════════════════════

/** un critère est une ligne du carnet, pas un roman — même plafond que la
 *  vitrine (tagline) : court, lisible d'un coup d'œil sur une fiche. */
export const CRITERE_MAX = 60

/** ce qu'on s'apprête à sauver comme critère : trim, plafonné. Une chaîne
 *  vide après normalisation = « pas (encore) déclaré » — c'est skippable,
 *  jamais une erreur. */
export function normaliserCritere(texte: string): string {
  return texte.trim().slice(0, CRITERE_MAX)
}

/** le critère est-il réellement déclaré (≠ juste le défaut d'onboarding
 *  qu'on n'a jamais changé) ? Utile pour distinguer « l'obsession de Karim »
 *  d'un simple champ resté à sa valeur de départ. */
export function critereDeclare(texte: string | undefined, defaut = 'le feeling'): boolean {
  if (!texte) return false
  const n = normaliserCritere(texte)
  return n.length > 0 && n.toLowerCase() !== defaut.trim().toLowerCase()
}
