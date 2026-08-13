// ════════════════════════════════════════════════════════════════
// jeudi. — LE TYPE D'UN LIEU, d'un coup d'œil (refonte carte, volet 1).
// Dérivé de la description (le type/cuisine des 302 spots importés) puis
// des envies en repli. Affiché en GLYPHE À L'ENCRE monoline sur les pins
// de la carte — jamais un émoji dans le chrome (DA), jamais un logo.
// 07/08 (Ersan) : la famille des douceurs entre au carnet — la glace,
// le thé, la pâtisserie — et la cave à vin cesse de se déguiser en bar.
// 13/08 (Ersan) : LA VILLE ENTIÈRE entre au carnet — la culture (musée,
// théâtre, ciné, concert, bibliothèque), les jeux (karaoké, escape,
// bowling, billard, bar à jeux), le corps (sport, piscine, spa), la
// boutique et le plein air (parc, marché). Tout ce qu'un utilisateur
// voudra épingler doit avoir son trait.
// ════════════════════════════════════════════════════════════════
export const TYPES_LIEU = [
  // ── boire & manger (les 10 d'origine) ──
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
  // ── la culture & la scène (13/08) ──
  'musee',
  'theatre',
  'cine',
  'concert',
  'biblio',
  // ── les jeux & la nuit ──
  'karaoke',
  'escape',
  'bowling',
  'billard',
  'jeux',
  // ── le corps ──
  'sport',
  'piscine',
  'spa',
  // ── le reste de la ville ──
  'boutique',
  'parc',
  'marche',
  // la friche / le tiers-lieu (Ersan, 13/08) : Ground Control, la Felicità —
  // le lieu hybride où le groupe indécis atterrit. Ni bar, ni resto : les deux.
  'friche',
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
  // ── la ville entière (13/08) : la culture & la scène ──────────
  if (/musée|musee|galerie d'art|exposition|\bexpo\b|fondation/.test(d)) return 'musee'
  if (/théâtre|theatre|cabaret|comédie|comedy|stand.?up|spectacle|impro/.test(d)) return 'theatre'
  if (/cinéma|cinema|\bciné\b|\bcine\b|film|projection/.test(d)) return 'cine'
  if (/concert|\blive\b|jazz|philharmon|zénith|zenith/.test(d)) return 'concert'
  if (/biblioth|médiath|mediath|librairie|bouquin/.test(d)) return 'biblio'
  // ── les jeux & la nuit (avant « bar » : le bar à jeux est un jeu) ──
  if (/karaok/.test(d)) return 'karaoke'
  if (/escape|énigme|enigme|laser game|réalité virtuelle|virtual/.test(d)) return 'escape'
  if (/bowling|quilles/.test(d)) return 'bowling'
  if (/billard|snooker|\bpool\b/.test(d)) return 'billard'
  if (/bar à jeux|jeux de société|jeux de societe|arcade|flipper|ludothèque|board game|pétanque|petanque/.test(d))
    return 'jeux'
  // ── le corps (« salle de sport » exprès : le bar des sports reste un bar) ──
  if (/salle de sport|club de sport|fitness|\bfive\b|futsal|padel|tennis|escalad|karting|patinoire|squash|ping.?pong|badminton|\bsportif|grimpe/.test(d))
    return 'sport'
  if (/piscine|natation|baignade/.test(d)) return 'piscine'
  if (/\bspa\b|hammam|sauna|thalasso|massage/.test(d)) return 'spa'
  if (/boutique|concept.?store|friperie|fripes|disquaire/.test(d)) return 'boutique'
  // la friche AVANT les grandes familles : un food court est un tiers-lieu,
  // pas du street (Ersan, 13/08)
  if (/friche|tiers.?lieu|food court|halle gourmande/.test(d)) return 'friche'
  // ── puis les grandes familles ─────────────────────────────────
  if (/club|discoth|dancefloor|boîte|boite de nuit|dj /.test(d)) return 'club'
  if (/bar|pub|cocktail|speakeasy|guinguette|brasserie artisanale|cave à manger/.test(d))
    return 'bar'
  if (/café|cafe|coffee|brunch|torréfact/.test(d)) return 'cafe'
  if (/street|kebab|tacos|sandwich|burger|emporter|fast|bao|pita|frites/.test(d))
    return 'street'
  // ── le plein air APRÈS les bars : « jardin » ne vole pas une guinguette ──
  if (/\bparc\b|jardin|\bbois\b|square|pelouse|buttes/.test(d)) return 'parc'
  if (/marché|marche couvert|les halles/.test(d)) return 'marche'
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
  musee: 'musée',
  theatre: 'théâtre',
  cine: 'cinéma',
  concert: 'concert',
  biblio: 'bibliothèque',
  karaoke: 'karaoké',
  escape: 'escape game',
  bowling: 'bowling',
  billard: 'billard',
  jeux: 'bar à jeux',
  sport: 'sport',
  piscine: 'piscine',
  spa: 'spa',
  boutique: 'boutique',
  parc: 'parc',
  marche: 'marché',
  friche: 'tiers-lieu',
}
export function labelTypeLieu(t: TypeLieu): string {
  return MOTS[t]
}

// ── les glyphes monoline (viewBox 24, stroke encre-papier, fill none) ──
// dessinés au trait, comme les icônes de la nav — la carte reste un carnet.
const TRAITS: Record<TypeLieu, string> = {
  // le verre à pied (cocktail) : cône + jambe + socle
  // B1 « la chope » (choix d'Ersan, 13/08 — atelier_glyphes_001) : le verre à
  // pied part au vin, le bar prend l'anse et la mousse soudée
  bar: '<path d="M6 9.4h8.6V19a1.6 1.6 0 0 1-1.6 1.6H7.6A1.6 1.6 0 0 1 6 19z"/><path d="M14.6 11.6h1.8a2.3 2.3 0 0 1 0 4.6h-1.8"/><path d="M6 9.4a2 2 0 0 1 3-1.8 2.6 2.6 0 0 1 4.6-.2 2 2 0 0 1 1 2"/>',
  // la bouteille : col, épaule, corps
  // V3 « la tulipe » (choix d'Ersan, 13/08) : resserrée en haut — la bouteille
  // d'avant se confondait avec un flacon
  vin: '<path d="M8.4 4.6h7.2c.6 2.4.9 4 .3 5.4a4.6 4.6 0 0 1-7.8 0c-.6-1.4-.3-3 .3-5.4z"/><path d="M12 12.4v5.6"/><path d="M8.8 19.6h6.4"/>',
  // la note de musique : tête + hampe
  club: '<circle cx="9" cy="17" r="2.5"/><path d="M11.5 17V6l6.5 2"/>',
  // la tasse : bol + anse
  cafe: '<path d="M5 9h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h2a2 2 0 0 1 0 4h-2"/>',
  // la théière : panse, bec, couvercle
  // T3 « le verre fumant » (choix d'Ersan, 13/08) : deux volutes — l'atelier
  // prévient qu'elles meurent les premières en petit, à surveiller à 18 px
  the: '<path d="M7.4 10.4h9.2l-1.2 8.6a1.6 1.6 0 0 1-1.6 1.4h-3.6a1.6 1.6 0 0 1-1.6-1.4z"/><path d="M10.4 7.4c-1-1.2-.6-2.2.2-3.2"/><path d="M13.6 7.4c-1-1.2-.6-2.2.2-3.2"/>',
  // le cornet à dôme : la boule posée, la jonction, le cône
  // G2 « empilées » (choix d'Ersan, 13/08) : deux boules l'une sur l'autre —
  // la silhouette étroite, celle qui gêne le moins ses voisines
  glace: '<path d="M8.6 12.6h6.8L12 20.8z"/><path d="M8.6 12.6a3.47 3.47 0 0 1 6.8 0"/><path d="M9.7 9.4a2.35 2.35 0 0 1 4.6 0"/>',
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
  // ── la ville entière (13/08) ──────────────────────────────────
  // le tableau encadré : cadre, montagne, soleil
  // la Mona Lisa abstraite (Ersan, 13/08) : un portrait dans son cadre —
  // le paysage encadré d'avant se lisait « photo »
  musee:
    '<rect x="5.2" y="4" width="13.6" height="16" rx="1"/><circle cx="12" cy="9.8" r="2.5"/><path d="M8 17.2c.7-2.6 2.1-3.9 4-3.9s3.3 1.3 4 3.9"/>',
  // le masque de comédie : le front, les yeux, le sourire
  theatre:
    '<path d="M6 5c2 .9 4 1.3 6 1.3S16 5.9 18 5v6.5a6 6 0 0 1-12 0z"/><path d="M9 9.3h1.7M13.3 9.3H15"/><path d="M9.4 12.6a3.2 3.2 0 0 0 5.2 0"/>',
  // le clap : l'ardoise, le bras qui claque, les chevrons
  // la caméra à deux bobines (Ersan, 13/08 : « un projecteur ou une caméra »)
  cine: '<rect x="4.5" y="10.5" width="11.5" height="8" rx="1.5"/><circle cx="7.8" cy="7.2" r="2.7"/><circle cx="13.7" cy="7.2" r="2.7"/><path d="M16 13.2l4.5-2v6.6l-4.5-2z"/>',
  // l'enceinte : la caisse, le tweeter, le boomer (la note est prise
  // par le club — la scène, c'est le son qui sort du mur)
  concert:
    '<rect x="7" y="4" width="10" height="16" rx="1.5"/><circle cx="12" cy="8.5" r="1.4"/><circle cx="12" cy="14.5" r="2.8"/>',
  // le livre ouvert : deux pages, la reliure
  biblio:
    '<path d="M12 6.2C10.2 4.9 7.8 4.3 4 4.3v13.4c3.8 0 6.2.6 8 2 1.8-1.4 4.2-2 8-2V4.3c-3.8 0-6.2.6-8 1.9z"/><path d="M12 6.2v13.5"/>',
  // le Shure à 45° (Ersan, 13/08 : « un micro de chanteur, genre les Shure »)
  // — la boule, la poignée qui descend, un trait de grille. Pas une capsule
  // de studio : celui qu'on TIENT.
  karaoke:
    '<circle cx="8" cy="8" r="3.9"/><path d="M10.7 11.5l6.4 6.4a1.6 1.6 0 0 0 2.3-2.3L13 9.2"/><path d="M5.7 9.1l3.4-3.4"/>',
  // la clé : l'anneau, la tige, les dents
  escape:
    '<circle cx="8.2" cy="8.2" r="3.7"/><path d="M10.9 10.9 19.4 19.4"/><path d="M15.2 15.2l2.3-2.3M17.7 17.7l1.9-1.9"/>',
  // la boule à trois trous
  bowling:
    '<circle cx="12" cy="12.5" r="7.8"/><circle cx="10" cy="10" r=".9"/><circle cx="14" cy="10" r=".9"/><circle cx="12" cy="7.4" r=".9"/>',
  // le triangle de départ, les boules dedans (Ersan, 13/08) — la mise en
  // place que tout le monde reconnaît, pas une queue anonyme
  billard:
    '<path d="M12 4.6 19.9 18.4H4.1z"/><circle cx="12" cy="11" r="1.7"/><circle cx="9.3" cy="15.3" r="1.7"/><circle cx="14.7" cy="15.3" r="1.7"/>',
  // le dé, face cinq
  jeux: '<rect x="4.5" y="4.5" width="15" height="15" rx="3"/><circle cx="8.8" cy="8.8" r=".9"/><circle cx="15.2" cy="8.8" r=".9"/><circle cx="12" cy="12" r=".9"/><circle cx="8.8" cy="15.2" r=".9"/><circle cx="15.2" cy="15.2" r=".9"/>',
  // l'haltère : deux disques, deux poignées, la barre
  sport:
    '<path d="M4.5 9.8v4.4M7.8 7.8v8.4M16.2 7.8v8.4M19.5 9.8v4.4"/><path d="M7.8 12h8.4"/>',
  // le nageur : la tête, le bras tendu, deux vagues
  piscine:
    '<circle cx="16.2" cy="7" r="1.9"/><path d="M4.5 11.5 10 7.8l3 2.6"/><path d="M3.5 15.6c1.4-1.1 2.9-1.1 4.3 0s2.8 1.1 4.2 0 2.9-1.1 4.3 0 2.8 1.1 4.2 0"/><path d="M3.5 19.2c1.4-1.1 2.9-1.1 4.3 0s2.8 1.1 4.2 0 2.9-1.1 4.3 0 2.8 1.1 4.2 0"/>',
  // le bassin qui fume : le bol, trois volutes
  // le lotus (Ersan, 13/08 : le bol fumant se lisait soupe) — trois pétales
  spa: '<path d="M12 4.6c1.9 2.3 1.9 5.2 0 7.6-1.9-2.4-1.9-5.3 0-7.6z"/><path d="M5.4 8.7c2.9.3 5 1.8 6.1 4.5-3 .4-5.4-1-6.1-4.5z"/><path d="M18.6 8.7c-2.9.3-5 1.8-6.1 4.5 3 .4 5.4-1 6.1-4.5z"/><path d="M7.2 17.8h9.6"/>',
  // le cintre : le crochet, les épaules
  boutique:
    '<path d="M10 5a2 2 0 1 1 2 2v1.2"/><path d="M12 8.2 3.8 14.5h16.4z"/>',
  // l'arbre : la couronne, le tronc, le sol
  // l'arbre + le banc SUR LE SOL (Ersan, 13/08 : « arbre + banc ? ») — la
  // couronne est un NUAGE, pas un cercle (un cercle sur un trait fait
  // sucette, v1 et v2 rejetées à l'écran) ; le banc = deux barres + deux
  // pieds posés sur la ligne de sol
  parc: '<path d="M4.9 10a2.7 2.7 0 0 1 1-4.7 3.2 3.2 0 0 1 6.1-.2 2.7 2.7 0 0 1 .6 4.9z"/><path d="M8.1 10v7.6"/><path d="M4 17.6h16"/><path d="M13.6 12.2h6.2M13.6 14.8h6.2M14.6 14.8v2.8M18.8 14.8v2.8"/>',
  // l'étal : l'auvent à festons, la table
  // le panier de courses (Ersan, 13/08 : l'auvent ne parlait pas)
  marche:
    '<path d="M5.5 9.5h13l-1.5 9.2a1.6 1.6 0 0 1-1.6 1.3H8.6A1.6 1.6 0 0 1 7 18.7z"/><path d="M9 9.5V8a3 3 0 0 1 6 0v1.5"/><path d="M6.4 13.4h11.2"/>',
  // la halle industrielle : le toit en dents de scie, la porte — la
  // silhouette des friches reconverties (Ersan, 13/08 : « je suis pour »)
  friche:
    '<path d="M4.5 19V10.6l3.7-3.4v3.4l3.7-3.4v3.4l3.7-3.4v3.4l3.9-3.4V19"/><path d="M4 19h16.5"/><path d="M10.9 19v-4.2h2.8V19"/>',
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

/** les 21 tampons du carnet, dans l'ordre où ils se lisent — pour le
 *  picker de la fiche (code + mot, jamais un drapeau). */
export const TAMPONS_CUISINE: readonly Cuisine[] = CUISINES.map(([, c]) => c)

// ════════════════════════════════════════════════════════════════
// ÉCRIRE LE CHOIX DANS LA DESCRIPTION (08/08 — le carnet se tient à la main)
//
// Le type et le tampon n'ont pas de colonne : ils se DEVINENT de la
// description. Corriger un lieu à la main, c'est donc réécrire la
// description avec des mots que typeDeLieu()/cuisineDeLieu() relisent
// EXACTEMENT — même contrat, mêmes mots que le script de fusion
// (_enrichissement/fusionner_enrichissement.mjs), qui relit chaque
// description avant de l'écrire. Ce qui n'est pas relu n'est pas écrit.
// ════════════════════════════════════════════════════════════════

/** le mot qui DIT un type, une fois relu par typeDeLieu() */
export const MOT_TYPE: Record<TypeLieu, string> = {
  bar: 'Bar',
  vin: 'Bar à vins',
  club: 'Club',
  cafe: 'Café',
  the: 'Salon de thé',
  glace: 'Glacier',
  patisserie: 'Pâtisserie',
  street: 'Street food',
  gastro: 'Cuisine gastronomique',
  resto: 'Restaurant',
  musee: 'Musée',
  theatre: 'Théâtre',
  cine: 'Cinéma',
  concert: 'Salle de concert',
  biblio: 'Bibliothèque',
  karaoke: 'Karaoké',
  escape: 'Escape game',
  bowling: 'Bowling',
  billard: 'Billard',
  jeux: 'Bar à jeux',
  sport: 'Salle de sport',
  piscine: 'Piscine',
  spa: 'Spa',
  boutique: 'Boutique',
  parc: 'Parc',
  marche: 'Marché',
  friche: 'Tiers-lieu',
}

/** l'adjectif qui DIT une cuisine, une fois relu par cuisineDeLieu().
 *  Pas toujours le `mot` du tampon (AFR se dit « afro » à la lecture,
 *  « africain » à l'affichage) : ici, c'est la lecture qui commande. */
export const ADJ_CUISINE: Record<string, string> = {
  ITA: 'italien',
  JPN: 'japonais',
  CHN: 'chinois',
  KOR: 'coréen',
  THA: 'thaï',
  VIE: 'vietnamien',
  IND: 'indien',
  LBN: 'libanais',
  ISR: 'israélien',
  TUR: 'turc',
  GRE: 'grec',
  MAR: 'marocain',
  TUN: 'tunisien',
  AFR: 'afro',
  ETH: 'éthiopien',
  MEX: 'mexicain',
  PER: 'péruvien',
  BRA: 'brésilien',
  ESP: 'espagnol',
  POR: 'portugais',
  USA: 'américain',
}

/** le mot du carnet déjà posé en fin de description, pour ne pas l'empiler
 *  à chaque correction (« Bar · Restaurant · Café » : jamais). Les plus
 *  longs d'abord — « Bar à vins » avant « Bar ». */
const RE_MOT_CARNET = new RegExp(
  `\\s*(?:·|—|-)?\\s*(?:${Object.values(MOT_TYPE)
    .sort((a, b) => b.length - a.length)
    .join('|')})(?:\\s+(?:${Object.values(ADJ_CUISINE).join('|')}))?\\s*$`,
  'i',
)

/** la description d'un lieu corrigé à la main : la prose d'Ersan gardée si
 *  elle ne contredit pas son choix, sinon le mot du carnet, nu.
 *  RELUE avant d'être rendue — c'est tout l'intérêt. */
export function decrireLieu(
  ancienne: string | undefined,
  type: TypeLieu,
  cuisine: string | null,
): string {
  const canon = [MOT_TYPE[type], cuisine ? ADJ_CUISINE[cuisine] : null].filter(Boolean).join(' ')
  const relu = (d: string) =>
    typeDeLieu({ description: d, envies: [] }) === type &&
    (cuisineDeLieu({ description: d })?.code ?? null) === (cuisine ?? null)
  // la prose de l'utilisateur, débarrassée du mot du carnet d'un tour d'avant
  const prose = (ancienne ?? '').replace(RE_MOT_CARNET, '').trim()
  if (prose) {
    const avecProse = `${prose} · ${canon}`
    if (relu(avecProse)) return avecProse
  }
  // la prose disait autre chose (« cocktails » pour un resto) : le choix de
  // la main gagne, la description redevient le mot nu — toujours relu juste.
  return canon
}
