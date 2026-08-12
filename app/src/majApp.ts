// ════════════════════════════════════════════════════════════════
// jeudi. — « une nouvelle version attend » : un ÉTAT, pas un cri.
//
// Avant (bug trouvé au test du 12/08, bascule injectManifest) : main.tsx
// criait un événement au moment où le service worker détectait la mise à
// jour. Deux trous :
//   1. la COURSE — au reload, la détection peut finir AVANT que App ait
//      accroché son écouteur : le cri part dans le vide, le toast ne
//      vient jamais ;
//   2. l'écran d'auth ne rendait pas le toast du tout (il vivait dans la
//      branche « connecté » de App).
// Ce module retient l'état ; l'événement ne sert plus qu'à réveiller un
// écouteur déjà monté. Qui monte APRÈS relit l'état ici.
// ════════════════════════════════════════════════════════════════

let dispo = false

/** appelé par main.tsx (onNeedRefresh du service worker) */
export function signalerMajDispo(): void {
  dispo = true
  window.dispatchEvent(new Event('jeudi:maj-dispo'))
}

/** lu au montage par le toast — pour rattraper un signal parti trop tôt */
export function majEnAttente(): boolean {
  return dispo
}
