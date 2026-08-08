// ════════════════════════════════════════════════════════════════
// jeudi. — LE TYPE D'UN LIEU, d'un coup d'œil (refonte carte, volet 1).
// Dérivé de la description (le type/cuisine des 302 spots importés) puis
// des envies en repli. Affiché en GLYPHE À L'ENCRE monoline sur les pins
// de la carte — jamais un émoji dans le chrome (DA), jamais un logo.
// 07/08 (Ersan) : la famille des douceurs entre au carnet — la glace,
// le thé, la pâtisserie — et la cave à vin cesse de se déguiser en bar.
// ════════════════════════════════════════════════════════════════
export const TYPES_LIEU = [
  'bar',
  'vin',
  'club',
  'cafe',
  'the',
  'glace',
  'patisserie',
  'street',
  'gastro',
  'resto',
] as const
export type TypeLieu = (typeof TYPES_LIEU)[number]

/** devine le type d'un lieu — description d'abord (la vérité du fond
 *  importé), envies en repli. Défaut : resto (le cas le plus commun).
 *  L'ORDRE COMPTE : le spécifique avant le générique (« bar à vins »
 *  doit tomber sur la bouteille avant que « bar » ne l'attrape).
 *  `envies` en string[] large : le lexique étendu (disco…) vit dans les
 *  données cloud au-delà du type Envie de base. */
export function typeDeLieu(l: { description?: string; envies: readonly string[] }): TypeLieu {
  const d = (l.description ?? '').toLowerCase()
  // ── les familles pointues d'abord ─────────────────────────────
  if (/glac|gelato|sorbet|ice cream/.test(d)) return 'glace'
  if (/salon de thé|maison de thé|tea ?room|teahouse|matcha|bubble tea|boba|chai/.test(d))
    return 'the'
  if (/pâtisser|patisser|boulanger|dessert|gâteau|gateau|cookie|donut|beignet|churros|crêperie|creperie|gaufre/.test(d))
    return 'patisserie'
  if (/cave à vin|à vins|bar à vin|vin nature|œnolog|oenolog|wine/.test(d)) return 'vin'
  // ── puis les grandes familles ─────────────────────────────────
  if (/club|discoth|dancefloor|boîte|boite de nuit|dj /.test(d)) return 'club'
  if (/bar|pub|cocktail|speakeasy|guinguette|brasserie artisanale|cave à manger/.test(d))
    return 'bar'
  if (/café|cafe|coffee|brunch|torréfact/.test(d)) return 'cafe'
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
const MOTS: Record<TypeLieu, string> = {
  bar: 'bar',
  vin: 'cave à vin',
  club: 'club',
  cafe: 'café',
  the: 'salon de thé',
  glace: 'glacier',
  patisserie: 'pâtisserie',
  street: 'rapido',
  gastro: 'grande table',
  resto: 'resto',
}
export function labelTypeLieu(t: TypeLieu): string {
  return MOTS[t]
}

// ── les glyphes monoline (viewBox 24, stroke encre-papier, fill none) ──
// dessinés au trait, comme les icônes de la nav — la carte reste un carnet.
const TRAITS: Record<TypeLieu, string> = {
  // le verre à pied (cocktail) : cône + jambe + socle
  bar: '<path d="M6 5h12l-6 7z"/><path d="M12 12v6"/><path d="M9 20h6"/>',
  // la bouteille : col, épaule, corps
  vin: '<path d="M10.6 4h2.8v3.6c1.3.9 2.1 2.1 2.1 3.9V19a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-7.5c0-1.8.8-3 2.1-3.9z"/><path d="M10.6 5.6h2.8"/>',
  // la note de musique : tête + hampe
  club: '<circle cx="9" cy="17" r="2.5"/><path d="M11.5 17V6l6.5 2"/>',
  // la tasse : bol + anse
  cafe: '<path d="M5 9h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/>',
  // la théière : panse, bec, couvercle
  the: '<path d="M7 12h10l-.8 4.2a4.5 4.5 0 0 1-4.4 3.8h.4a4.5 4.5 0 0 1-4.4-3.8z"/><path d="M7 13l-2.6-1.8"/><path d="M9.4 12a2.6 2.6 0 0 1 5.2 0"/><path d="M12 9.4V8"/>',
  // le cornet à dôme : la boule posée, la jonction, le cône
  glace: '<path d="M8 10h8l-4 10z"/><path d="M8 10a4 4 0 0 1 8 0"/>',
  // le cupcake : la caissette, le dôme, la cerise
  patisserie:
    '<path d="M7 13h10l-1.3 6.5H8.3z"/><path d="M7 13a5 5 0 0 1 10 0"/><path d="M10.4 13.2v6"/><path d="M13.6 13.2v6"/><circle cx="12" cy="6.6" r="1.2"/>',
  // le burger : pain, garniture, pain (rien ne dit street-food plus vite)
  street: '<path d="M5 11a7 5.5 0 0 1 14 0z"/><path d="M5 14h14"/><path d="M5.8 17h12.4"/>',
  // la cloche de service
  gastro: '<path d="M5 16a7 7 0 0 1 14 0z"/><path d="M12 9V7"/><path d="M4 19h16"/>',
  // les couverts : la fourchette et le couteau, francs et grands
  // (07/08 : l'assiette diluait — les couverts seuls, choix d'Ersan)
  resto:
    '<path d="M9 4v16"/><path d="M7 4v4a2 2 0 0 0 4 0V4"/><path d="M15.5 20V4c-2.4 1.8-2.4 6 0 7.8"/>',
}

/** le SVG inline du glyphe (pour les pins DOM de la carte) */
export function svgTypeLieu(t: TypeLieu): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#15130f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TRAITS[t]}</svg>`
}

// ── LE TAMPON DE DOUANE (07/08, Ersan : « des drapeaux à côté des
// restos ») — la nationalité de la cuisine, d'un coup d'œil. Pas un
// drapeau émoji (DA : jamais d'émoji dans le chrome) : un CODE à trois
// lettres au crayon, comme tamponné sur un passeport. Déduit de la
// description ; la cuisine française n'a pas de tampon — c'est la
// maison, on ne tamponne pas son propre passeport.
export interface Cuisine {
  code: string
  mot: string
}

const CUISINES: [RegExp, Cuisine][] = [
  [/italien|trattoria|osteria|pizzeria|pizza|pasta|sicilien|napolitain/, { code: 'ITA', mot: 'italien' }],
  [/japonais|izakaya|ramen|sushi|udon|soba|yakitori|omakase|donburi/, { code: 'JPN', mot: 'japonais' }],
  [/chinois|sichuan|szechuan|dim sum|cantonais|dumpling|xiao long/, { code: 'CHN', mot: 'chinois' }],
  [/coréen|korean|bibimbap|barbecue coréen|kimchi/, { code: 'KOR', mot: 'coréen' }],
  [/thaï|thai|pad thai/, { code: 'THA', mot: 'thaï' }],
  [/vietnamien|pho|bánh|banh mi|bo bun|bobun/, { code: 'VIE', mot: 'vietnamien' }],
  [/indien|curry house|tandoori|biryani/, { code: 'IND', mot: 'indien' }],
  [/libanais|mezze|mezzé/, { code: 'LBN', mot: 'libanais' }],
  [/israélien|shakshuka|houmous|hummus/, { code: 'ISR', mot: 'israélien' }],
  [/turc|anatolien|meze turc/, { code: 'TUR', mot: 'turc' }],
  [/grec|taverne|souvlaki/, { code: 'GRE', mot: 'grec' }],
  [/marocain|couscous|tajine|tagine|oriental/, { code: 'MAR', mot: 'marocain' }],
  [/tunisien/, { code: 'TUN', mot: 'tunisien' }],
  [/sénégalais|ivoirien|maquis|mafé|thieb|afro/, { code: 'AFR', mot: 'africain' }],
  [/éthiopien|injera/, { code: 'ETH', mot: 'éthiopien' }],
  [/mexicain|taqueria|taquería|quesadilla/, { code: 'MEX', mot: 'mexicain' }],
  [/péruvien|ceviche|nikkei/, { code: 'PER', mot: 'péruvien' }],
  [/brésilien|churrasc/, { code: 'BRA', mot: 'brésilien' }],
  [/espagnol|tapas|basque|catalan/, { code: 'ESP', mot: 'espagnol' }],
  [/portugais|pastéis|pasteis/, { code: 'POR', mot: 'portugais' }],
  [/américain|diner|smash|barbecue texan|nyc/, { code: 'USA', mot: 'américain' }],
]

/** la cuisine d'un lieu — null si la description ne dit rien (ou si
 *  c'est de la cuisine française : la maison n'a pas de tampon) */
export function cuisineDeLieu(l: { description?: string }): Cuisine | null {
  const d = (l.description ?? '').toLowerCase()
  if (!d) return null
  for (const [re, c] of CUISINES) if (re.test(d)) return c
  return null
}
