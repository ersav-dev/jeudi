// ════════════════════════════════════════════════════════════════
// jeudi. — LE TYPE D'UN LIEU, d'un coup d'œil (refonte carte, volet 1).
// Dérivé de la description (le type/cuisine des 302 spots importés) puis
// des envies en repli. Affiché en GLYPHE À L'ENCRE monoline sur les pins
// de la carte — jamais un émoji dans le chrome (DA), jamais un logo.
// ════════════════════════════════════════════════════════════════
export const TYPES_LIEU = ['bar', 'club', 'cafe', 'street', 'gastro', 'resto'] as const
export type TypeLieu = (typeof TYPES_LIEU)[number]

/** devine le type d'un lieu — description d'abord (la vérité du fond
 *  importé), envies en repli. Défaut : resto (le cas le plus commun).
 *  `envies` en string[] large : le lexique étendu (disco…) vit dans les
 *  données cloud au-delà du type Envie de base. */
export function typeDeLieu(l: { description?: string; envies: readonly string[] }): TypeLieu {
  const d = (l.description ?? '').toLowerCase()
  if (/club|discoth|dancefloor|boîte|boite de nuit|dj /.test(d)) return 'club'
  if (/bar|pub|cocktail|speakeasy|guinguette|brasserie artisanale|cave à manger|à vins|wine/.test(d))
    return 'bar'
  if (/café|cafe|coffee|salon de thé|brunch|glac|torréfact/.test(d)) return 'cafe'
  if (/street|kebab|tacos|sandwich|burger|emporter|fast|bao|pita|frites|food court/.test(d))
    return 'street'
  if (/gastrono|étoil|palace|grande table/.test(d)) return 'gastro'
  if (/resto|restaurant|cuisine|bistro|bouillon|cantine|trattoria|izakaya|ramen|soba|udon/.test(d))
    return 'resto'
  // pas de description parlante : les envies décident
  if (l.envies.includes('disco')) return 'club'
  if (l.envies.includes('apéro') || l.envies.includes('incognito')) return 'bar'
  if (l.envies.includes('tranquilo')) return 'cafe'
  if (l.envies.includes('alloco')) return 'street'
  if (l.envies.includes('gastro')) return 'gastro'
  return 'resto'
}

/** le mot à l'écran (bottom-sheet, fiche…) */
export function labelTypeLieu(t: TypeLieu): string {
  return t === 'bar'
    ? 'bar'
    : t === 'club'
      ? 'club'
      : t === 'cafe'
        ? 'café'
        : t === 'street'
          ? 'sur le pouce'
          : t === 'gastro'
            ? 'grande table'
            : 'resto'
}

// ── les glyphes monoline (viewBox 24, stroke encre-papier, fill none) ──
// dessinés au trait, comme les icônes de la nav — la carte reste un carnet.
const TRAITS: Record<TypeLieu, string> = {
  // le verre à pied (cocktail) : cône + jambe + socle
  bar: '<path d="M6 5h12l-6 7z"/><path d="M12 12v6"/><path d="M9 20h6"/>',
  // la note de musique : tête + hampe
  club: '<circle cx="9" cy="17" r="2.5"/><path d="M11.5 17V6l6.5 2"/>',
  // la tasse : bol + anse
  cafe: '<path d="M5 9h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/>',
  // le cornet (sur le pouce)
  street: '<path d="M8 4l9 3-6 13z"/>',
  // la cloche de service
  gastro: '<path d="M5 16a7 7 0 0 1 14 0z"/><path d="M12 9V7"/><path d="M4 19h16"/>',
  // l'assiette : cercle + cœur
  resto: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',
}

/** le SVG inline du glyphe (pour les pins DOM de la carte) */
export function svgTypeLieu(t: TypeLieu): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#15130f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TRAITS[t]}</svg>`
}
