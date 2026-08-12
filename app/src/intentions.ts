// ════════════════════════════════════════════════════════════════════════
// jeudi. — LE LEXIQUE D'INTENTIONS
//
// Le problème qu'il règle, dit simplement : aujourd'hui « manger thaï » ne
// trouve que les fiches où les mots « manger » ou « thaï » sont ÉCRITS. Or
// personne n'écrit « manger » dans la description d'un restaurant. La
// recherche cherche donc des mots au lieu de comprendre une envie.
//
// Ce fichier traduit du français libre vers le vocabulaire que l'app connaît
// déjà, et rien d'autre : les 7 ENVIES (db.ts), les 10 TYPES_LIEU
// (typesLieu.ts) et les 21 CUISINES (leur code de tampon). Il n'invente
// aucune catégorie nouvelle.
//
// TROIS PARTIS PRIS
//
//  1. ÉCRIT À LA MAIN, jamais deviné par une machine. C'est la même règle que
//     les horaires : la confiance est le produit. Un lexique de 300 entrées
//     qu'on peut relire vaut mieux qu'un modèle qui se trompe joliment.
//
//  2. ON NE JETTE RIEN. Les mots non reconnus sortent dans `reste` — la
//     recherche texte continue de faire son travail avec eux (un nom de rue,
//     un nom de bar, un plat qu'on n'a pas prévu). Le lexique AJOUTE de la
//     compréhension, il ne filtre pas ce qu'il ne comprend pas.
//
//  3. AUCUNE DÉPENDANCE, aucun état, aucun réseau. Une fonction pure, donc
//     testable, donc relisible. C'est ce qui permettra à l'écran « trouver »
//     de s'appuyer dessus sans rien savoir de tout ça.
//
// ET UN COMPROMIS ASSUMÉ : quelques mots seuls très génériques déclenchent
// une catégorie précise (« vue » → rooftop, « quai » → sur l'eau, « nature »/
// « rouge » → vin, « chef » → gastro). Hors contexte, ce sont des faux
// positifs possibles — jugés rares dans une barre de recherche de sorties, et
// rattrapables : la phrase garde toujours ses autres mots. Ce n'est pas un
// oubli, c'est un choix (documenté à la relecture du 12/08).
//
// ⚠ CE FICHIER NE FAIT QUE TRADUIRE. Il ne cherche pas, il ne trie pas, il ne
// touche pas à la carte. Le branchement dans la recherche vient avec l'écran
// (ordre imposé : enrichissement → lexique → écran).
// ════════════════════════════════════════════════════════════════════════

import { ENVIES, type Envie } from './db'
import { TYPES_LIEU, TAMPONS_CUISINE, type TypeLieu } from './typesLieu'

/** ce qu'une phrase VEUT, une fois traduite */
export type Intention = {
  envies: Envie[]
  types: TypeLieu[]
  /** codes de tampon de cuisine : THA, ITA, JPN… (voir typesLieu.CUISINES) */
  cuisines: string[]
  /** les faits binaires demandés — ils existent déjà sur le lieu */
  faits: Fait[]
  /** les mots qu'on n'a pas compris : ils partent à la recherche texte */
  reste: string[]
}

/** les critères BINAIRES (un fait, pas un avis — cf. « la lentille ») que la
 *  phrase peut réclamer. Ils correspondent à ce que porte déjà un lieu. */
export const FAITS = ['terrasse', 'rooftop', 'surLeau', 'match', 'seul'] as const
export type Fait = (typeof FAITS)[number]

// ── la normalisation ───────────────────────────────────────────────────
// minuscules, sans accent, apostrophes unifiées. On garde les espaces pour
// pouvoir reconnaître les expressions de deux mots (« bo bun », « dim sum »).
export function normaliser(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// ── LE LEXIQUE ─────────────────────────────────────────────────────────
// Chaque entrée : les mots (déjà normalisés, sans accent) → ce qu'ils veulent
// dire. Les EXPRESSIONS de plusieurs mots sont reconnues en premier, sinon
// « pad thai » se ferait manger par « thai » tout seul.
type Regle = {
  mots: string[]
  envies?: Envie[]
  types?: TypeLieu[]
  cuisines?: string[]
  faits?: Fait[]
}

const LEXIQUE: Regle[] = [
  // ── MANGER ───────────────────────────────────────────────────────────
  {
    mots: [
      'manger', 'bouffer', 'bouffe', 'diner', 'dinner', 'dejeuner', 'dej', 'deje',
      'restau', 'resto', 'restaurant', 'a table', 'se restaurer', 'la dalle',
      'faim', 'gueuleton', 'casser la croute', 'croute', 'repas', 'plat',
    ],
    envies: ['resto'],
    types: ['resto'],
  },
  {
    mots: [
      'gastro', 'gastronomique', 'etoile', 'etoilee', 'michelin', 'grande table',
      'haute cuisine', 'chef', 'se faire plaisir', 'grand restaurant', 'raffine',
      'degustation', 'menu degustation',
    ],
    envies: ['gastro'],
    types: ['gastro'],
  },
  {
    // « le grec/taco de quartier, debout » — la glose d'alloco, mot pour mot
    mots: [
      'grec', 'kebab', 'tacos', 'taco', 'sandwich', 'sur le pouce', 'a emporter',
      'emporter', 'street food', 'snack', 'debout', 'fast food', 'food truck',
      'friterie', 'panini', 'durum', 'assiette grecque',
    ],
    envies: ['alloco'],
    types: ['street'],
  },
  {
    mots: ['burger', 'burgers', 'smash', 'hamburger'],
    types: ['street'],
    cuisines: ['USA'],
  },
  {
    mots: ['pizza', 'pizzeria', 'pizzas'],
    types: ['resto'],
    cuisines: ['ITA'],
  },
  {
    mots: ['brunch', 'bruncher', 'petit dejeuner', 'petit dej'],
    types: ['cafe'],
  },

  // ── BOIRE ────────────────────────────────────────────────────────────
  {
    mots: [
      'boire', 'un verre', 'verre', 'verres', 'apero', 'aperitif', 'trinquer',
      'siroter', 'happy hour', 'godet', 'canon', 'prendre un verre',
    ],
    envies: ['apéro'],
    types: ['bar'],
  },
  {
    mots: [
      'bar', 'bars', 'comptoir', 'pub', 'troquet', 'bistrot', 'bistro', 'taverne',
      'biere', 'bieres', 'pinte', 'chope', 'brasserie artisanale', 'ipa',
    ],
    types: ['bar'],
  },
  {
    mots: [
      'cocktail', 'cocktails', 'mixologie', 'spritz', 'negroni', 'mojito',
      'bar a cocktails', 'shaker',
    ],
    types: ['bar'],
    envies: ['apéro'],
  },
  {
    mots: [
      'vin', 'vins', 'cave', 'caviste', 'bar a vin', 'sommelier', 'vin nature',
      'nature', 'rouge', 'blanc', 'pinard', 'quille',
    ],
    types: ['vin'],
  },

  // ── DANSER ───────────────────────────────────────────────────────────
  {
    mots: [
      'danser', 'danse', 'boite', 'boite de nuit', 'club', 'clubbing', 'guincher',
      'dj', 'techno', 'house', 'dancefloor', 'teuf', 'faire la fete', 'fete',
      'warehouse', 'rave', 'sortir en boite', 'bouger', 'transpirer', 'dance',
    ],
    types: ['club'],
  },

  // ── DOUCEURS, CAFÉ, THÉ ──────────────────────────────────────────────
  {
    mots: [
      'cafe', 'coffee', 'expresso', 'espresso', 'latte', 'cappuccino', 'flat white',
      'torrefaction', 'bosser', 'travailler', 'bouquiner', 'lire',
    ],
    types: ['cafe'],
  },
  {
    mots: ['the', 'salon de the', 'matcha', 'chai', 'infusion', 'tisane', 'the glace'],
    types: ['the'],
  },
  {
    mots: ['glace', 'glaces', 'glacier', 'sorbet', 'gelato', 'cornet', 'creme glacee'],
    types: ['glace'],
  },
  {
    mots: [
      'patisserie', 'gateau', 'gateaux', 'dessert', 'sucre', 'eclair', 'croissant',
      'viennoiserie', 'boulangerie', 'flan', 'chou', 'mille feuille', 'tarte',
    ],
    types: ['patisserie'],
  },

  // ── L'AMBIANCE (les envies, pas les types) ───────────────────────────
  {
    mots: [
      'tranquille', 'tranquilo', 'calme', 'au calme', 'se poser', 'poser', 'chill',
      'cosy', 'cocon', 'discuter', 'parler', 'papoter', 'peinard', 'zen',
      'pas trop bruyant', 'sans bruit', 'intimiste',
    ],
    envies: ['tranquilo'],
  },
  {
    mots: [
      'incognito', 'discret', 'cache', 'planque', 'speakeasy', 'secret',
      'sans enseigne', 'confidentiel', 'a voix basse', 'porte derobee',
    ],
    envies: ['incognito'],
  },
  {
    mots: [
      'turbo', 'enchainer', 'plusieurs spots', 'tournee', 'bouger de bar en bar',
      'la nuit est longue', 'jusqu au bout de la nuit', 'apres minuit',
    ],
    envies: ['turbo'],
  },

  // ── LES FAITS (binaires, déjà portés par le lieu) ─────────────────────
  { mots: ['terrasse', 'dehors', 'en terrasse', 'au soleil', 'exterieur'], faits: ['terrasse'] },
  { mots: ['rooftop', 'toit', 'sur les toits', 'vue', 'en hauteur'], faits: ['rooftop'] },
  { mots: ['peniche', 'sur l eau', 'sur la seine', 'quai', 'bateau'], faits: ['surLeau'] },
  { mots: ['match', 'foot', 'football', 'rugby', 'ecran', 'diffusion', 'ligue des champions'], faits: ['match'] },
  // ⚠ pas d'expression « manger seul » ici : elle consommerait le mot
  // « manger » (les expressions longues passent d'abord) et la règle resto ne
  // le verrait jamais — « manger seul » perdait l'envie de manger (relecture
  // 12/08). « seul » suffit, et « manger » reste libre pour sa règle.
  { mots: ['seul', 'solo', 'toute seule', 'tout seul'], faits: ['seul'] },

  // ── LES CUISINES (le tampon de douane) ───────────────────────────────
  { mots: ['italien', 'italienne', 'trattoria', 'osteria', 'pasta', 'pates'], cuisines: ['ITA'] },
  { mots: ['japonais', 'japonaise', 'izakaya', 'ramen', 'sushi', 'udon', 'yakitori', 'donburi', 'omakase'], cuisines: ['JPN'] },
  { mots: ['chinois', 'chinoise', 'sichuan', 'dim sum', 'cantonais', 'dumpling', 'raviolis chinois'], cuisines: ['CHN'] },
  { mots: ['coreen', 'coreenne', 'bibimbap', 'kimchi', 'barbecue coreen'], cuisines: ['KOR'] },
  { mots: ['thai', 'thailandais', 'pad thai'], cuisines: ['THA'] },
  { mots: ['vietnamien', 'vietnamienne', 'pho', 'banh mi', 'bo bun', 'bobun'], cuisines: ['VIE'] },
  { mots: ['indien', 'indienne', 'curry', 'tandoori', 'biryani', 'naan'], cuisines: ['IND'] },
  { mots: ['libanais', 'libanaise', 'mezze'], cuisines: ['LBN'] },
  { mots: ['israelien', 'shakshuka', 'houmous', 'hummus'], cuisines: ['ISR'] },
  { mots: ['turc', 'turque', 'anatolien'], cuisines: ['TUR'] },
  { mots: ['grecque', 'souvlaki'], cuisines: ['GRE'] },
  { mots: ['marocain', 'marocaine', 'couscous', 'tajine', 'tagine'], cuisines: ['MAR'] },
  { mots: ['tunisien', 'tunisienne'], cuisines: ['TUN'] },
  { mots: ['senegalais', 'ivoirien', 'maquis', 'mafe', 'thieb', 'africain', 'afro'], cuisines: ['AFR'] },
  { mots: ['ethiopien', 'injera'], cuisines: ['ETH'] },
  { mots: ['mexicain', 'mexicaine', 'taqueria', 'quesadilla', 'burrito'], cuisines: ['MEX'] },
  { mots: ['peruvien', 'ceviche', 'nikkei'], cuisines: ['PER'] },
  { mots: ['bresilien', 'churrasco', 'caipirinha'], cuisines: ['BRA'] },
  { mots: ['espagnol', 'espagnole', 'tapas', 'basque', 'catalan'], cuisines: ['ESP'] },
  { mots: ['portugais', 'portugaise', 'pasteis'], cuisines: ['POR'] },
  { mots: ['americain', 'americaine', 'diner americain', 'barbecue texan'], cuisines: ['USA'] },
]

// L'ordre de reconnaissance : les expressions LONGUES d'abord. Sans ça,
// « pad thai » perdrait son « pad », « bo bun » deviendrait deux mots inconnus,
// et « bar a vin » serait lu comme un bar.
const ENTREES: { mot: string; regle: Regle }[] = LEXIQUE.flatMap((regle) =>
  regle.mots.map((mot) => ({ mot: normaliser(mot), regle })),
).sort((a, b) => b.mot.split(' ').length - a.mot.split(' ').length || b.mot.length - a.mot.length)

const unique = <T,>(x: T[]): T[] => [...new Set(x)]

/** traduit une phrase libre en intention. Ne cherche rien, ne trie rien :
 *  elle dit seulement ce que la phrase VEUT. */
export function lireIntention(texte: string): Intention {
  const envies: Envie[] = []
  const types: TypeLieu[] = []
  const cuisines: string[] = []
  const faits: Fait[] = []
  // on travaille sur une chaîne bordée d'espaces : les frontières de mots se
  // testent alors sans expression régulière, et « the » ne matche pas
  // « theatre ».
  let restant = ` ${normaliser(texte)} `
  for (const { mot, regle } of ENTREES) {
    const cible = ` ${mot} `
    if (!restant.includes(cible)) continue
    // on retire l'expression reconnue pour qu'elle ne soit pas relue par une
    // règle plus courte, et pour qu'elle ne finisse pas dans `reste`
    restant = restant.split(cible).join(' ')
    if (regle.envies) envies.push(...regle.envies)
    if (regle.types) types.push(...regle.types)
    if (regle.cuisines) cuisines.push(...regle.cuisines)
    if (regle.faits) faits.push(...regle.faits)
  }
  // les mots outils ne sont pas « incompris » : ils ne veulent rien dire seuls
  const VIDES = new Set([
    'un', 'une', 'le', 'la', 'les', 'des', 'du', 'de', 'a', 'au', 'aux', 'en',
    'et', 'ou', 'pour', 'avec', 'sans', 'chez', 'dans', 'sur', 'je', 'j', 'on',
    'veux', 'voudrais', 'cherche', 'envie', 'plutot', 'truc', 'quelque', 'chose',
    'ce', 'soir', 'qui', 'que', 'quoi', 'est', 'ai', 'ca', 'dit', 'y',
  ])
  const reste = unique(restant.split(' ').filter((m) => m.length > 1 && !VIDES.has(m)))
  return {
    envies: unique(envies),
    types: unique(types),
    cuisines: unique(cuisines),
    faits: unique(faits),
    reste,
  }
}

/** la phrase a-t-elle dit quelque chose que l'app comprend ? Utile à l'écran
 *  « trouver » pour savoir s'il doit répondre… ou avouer qu'il n'a pas compris. */
export function intentionVide(i: Intention): boolean {
  return !i.envies.length && !i.types.length && !i.cuisines.length && !i.faits.length
}

// garde-fou de relecture : le lexique ne doit viser que du vocabulaire réel.
// Une faute de frappe dans une cible ('rest0') passerait sinon inaperçue
// jusqu'à ce qu'une recherche ne rende rien. Vérifié par les tests.
export function ciblesInvalides(): string[] {
  const mauvaises: string[] = []
  // les 21 codes réels du tampon de douane — un 'TAH' pour 'THA' passerait
  // sinon inaperçu, exactement comme le 'rest0' du commentaire (relecture 12/08)
  const codesConnus = new Set(TAMPONS_CUISINE.map((c) => c.code))
  for (const r of LEXIQUE) {
    for (const e of r.envies ?? []) if (!ENVIES.includes(e)) mauvaises.push(`envie ${e}`)
    for (const t of r.types ?? []) if (!TYPES_LIEU.includes(t)) mauvaises.push(`type ${t}`)
    for (const f of r.faits ?? []) if (!FAITS.includes(f)) mauvaises.push(`fait ${f}`)
    for (const c of r.cuisines ?? []) if (!codesConnus.has(c)) mauvaises.push(`cuisine ${c}`)
  }
  return unique(mauvaises)
}

/** combien de mots le lexique connaît — pour le suivi, et pour qu'un test
 *  s'aperçoive d'une suppression accidentelle */
export const TAILLE_LEXIQUE = ENTREES.length
