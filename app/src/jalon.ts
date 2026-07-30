// ── Journal de bord du démarrage ──────────────────────────────
// Pour diagnostiquer les plantages iOS SANS câble ni console : l'app note
// chaque étape franchie ('boot' → 'session' → 'seed' → 'spots' → … → 'stable').
// Si le navigateur meurt (WebKit tué : fond blanc « envoyer le rapport »),
// aucun code ne tourne plus — mais le dernier jalon écrit RESTE en
// localStorage. Au lancement suivant, on sait où c'est mort.

const CLE = 'jeudi-jalon'
const CLE_CRASH = 'jeudi-crash'

/** À appeler tout premier au boot : si la session précédente n'a jamais
 *  atteint 'stable', on garde une trace du dernier jalon franchi. */
export function releverCrash(): string | null {
  try {
    const prec = localStorage.getItem(CLE)
    if (prec && prec !== 'stable') {
      localStorage.setItem(CLE_CRASH, prec)
      return prec
    }
    return null
  } catch {
    return null
  }
}

/** Note l'étape franchie. Jamais bloquant (stockage plein → tant pis). */
export function jalonner(etape: string) {
  try {
    localStorage.setItem(CLE, etape)
  } catch {
    /* stockage indisponible : le journal est best-effort */
  }
}

/** Note l'écran affiché — mais SEULEMENT tant que la session n'est pas
 *  'stable' (après, une fermeture normale passerait pour un crash). */
export function jalonnerVue(etape: string) {
  try {
    if (localStorage.getItem(CLE) !== 'stable') localStorage.setItem(CLE, etape)
  } catch {
    /* best-effort */
  }
}

export function lireCrash(): string | null {
  try {
    return localStorage.getItem(CLE_CRASH)
  } catch {
    return null
  }
}

export function effacerCrash() {
  try {
    localStorage.removeItem(CLE_CRASH)
  } catch {
    /* rien */
  }
}
