import { type Lieu, type TipCercle, type PhotoLieu, ajouterLieuLocal, nouvelId, getDB } from './db'
import ERSAN from './ersan'
import { CURATED } from './spots_curated'
import { EXTRA } from './spots_extra'

// ── mapping des vraies données Google → langage jeudi ──
// le type de cuisine devient une envie
function cuisineVersEnvies(cuisine: string): Lieu['envies'] {
  const c = cuisine.toLowerCase()
  if (/bar|pub|cocktail|discoth|club|guinguette/.test(c)) return ['apéro']
  if (/café|cafe|salon de th|brunch|glac|coffee/.test(c)) return ['tranquilo']
  if (/gastrono|étoil|grande table/.test(c)) return ['gastro']
  if (/emporter|street|kebab|grec|tacos|fast|sandwich/.test(c)) return ['alloco']
  return ['resto']
}
// la fourchette de prix Google devient une situation du portefeuille
function prixVersMeteo(prix: string): Lieu['meteo'] {
  if (!prix) return undefined
  const sym = (prix.match(/€/g) || []).length
  const num = parseInt((prix.match(/\d+/) || ['0'])[0], 10)
  let val = num
  if (/\+ de 100/.test(prix)) val = 100
  else if (num === 0 && sym) val = sym === 1 ? 12 : sym === 2 ? 35 : 80
  if (val <= 0) return undefined
  if (val < 20) return 'pluie'
  if (val <= 50) return 'nuageux'
  return 'soleil'
}

// fausses photos de test (distantes) : 3 tirages lieu/verre/wc par spot.
// picsum donne une image stable par "seed". remplacé par les vraies photos.
// images de test = vrais types de lieux (resto/bar/plat/wc), pas des paysages.
// loremflickr sert une image Flickr par mots-clés ; lock = stable par spot.
const hashNum = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % 100000
}
// #8 : 2-3 tirages PAR catégorie (le produit s'axe sur la preuve photo, WC compris)
const ph = (s: string): PhotoLieu[] => [
  { type: 'lieu', url: `https://loremflickr.com/440/320/restaurant,bar,interior/all?lock=${hashNum(s + 'l1')}` },
  { type: 'lieu', url: `https://loremflickr.com/440/320/restaurant,dining,room/all?lock=${hashNum(s + 'l2')}` },
  { type: 'plat', url: `https://loremflickr.com/440/320/food,plate/all?lock=${hashNum(s + 'p1')}` },
  { type: 'plat', url: `https://loremflickr.com/440/320/cocktail,drink/all?lock=${hashNum(s + 'p2')}` },
  { type: 'wc', url: `https://loremflickr.com/440/320/toilet,bathroom/all?lock=${hashNum(s + 'w1')}` },
  { type: 'wc', url: `https://loremflickr.com/440/320/restroom,sink/all?lock=${hashNum(s + 'w2')}` },
]

// ── le cercle simulé : deux membres fictifs pour voir l'app finale
// (remplacés par de vrais comptes quand le cloud arrive)
export const MEMBRES = [
  {
    id: 'karim',
    prenom: 'Karim',
    titre: 'éclaireur du 10e',
    critere: 'le bruit',
    tagline: 'le mec qui connaît toujours un dernier rade',
    bio: 'premier sur les spots du canal. juge tout au bruit.',
    spots: 23,
    proche: true, // inner ring (apparaît dans "proches" ET "potes")
  },
  {
    id: 'lea',
    prenom: 'Léa',
    titre: 'curatrice · 47 spots',
    critere: 'la lumière',
    tagline: 'mange seule, partout, sans gêne',
    bio: 'sa collection "comptoirs où manger seule" fait référence.',
    spots: 47,
    proche: false, // pote (apparaît dans "potes" seulement)
  },
]

const TIP = (auteur: string, titre: string, note: string): TipCercle => ({ auteur, titre, note })

// ── l'amorce : les premiers spots d'Ersan, repris de sa liste
// Google Maps (notes perso conservées telles quelles — ce sont
// déjà des tips). Coordonnées approximatives, à affiner.
// Remplacé par le vrai import Takeout dès que le zip arrive.

const SPOTS: Array<Partial<Lieu> & { nom: string; note: string; auteurCercle?: number }> = [
  {
    nom: "Le Robinet d'Or",
    note: 'restaurant avec Christophe, JS, Ben, Stephan et sa copine.',
    lat: 48.8712, lng: 2.3633,
    envies: ['resto'], compagnies: ['potos'],
  },
  {
    nom: "L'Abysse Paris — Yannick Alléno",
    note: 'le grand jeu. + de 100 balles, japonais.',
    lat: 48.8661, lng: 2.3164,
    envies: ['gastro'], meteo: 'soleil',
  },
  {
    nom: 'The Office',
    note: 'à tester !!',
    lat: 48.8721, lng: 2.3472,
    envies: ['resto'],
  },
  {
    nom: 'Glacier — 215 rue de Paris, Montreuil',
    note: 'glace à tester.',
    lat: 48.8576, lng: 2.4405,
    envies: ['tranquilo'],
  },
  {
    nom: 'Chez Michel',
    note: 'super resto : François et Christophe.',
    lat: 48.88, lng: 2.351,
    envies: ['resto', 'gastro'], compagnies: ['potos'],
    tipsCercle: [
      TIP('Karim', 'éclaireur du 10e', 'le kig ha farz du jeudi. niveau bruit : parfait avant 20h30, blindé après.'),
      TIP('Léa', 'curatrice · 47 spots', 'banquette du fond, lumière douce. parfait même seule.'),
    ],
  },
  {
    nom: 'Abri Soba',
    note: 'à tester. nouilles au sarrasin.',
    lat: 48.8745, lng: 2.3441,
    envies: ['resto'],
    tipsCercle: [
      TIP('Karim', 'éclaireur du 10e', 'vas-y AVANT 19h30 ou oublie. comptoir nickel en solo.'),
    ],
  },
  {
    nom: 'Bistro Volnay',
    note: 'à tester.',
    lat: 48.8693, lng: 2.3309,
    envies: ['resto'],
  },
  {
    nom: 'Happatei',
    note: 'resto Lisa & Théo.',
    lat: 48.868, lng: 2.336,
    envies: ['resto'], compagnies: ['potos'],
    photos: ph('happatei'),
  },
  {
    nom: 'Aki Café',
    note: 'bon resto. japonais, 10-20 balles.',
    lat: 48.8665, lng: 2.3357,
    envies: ['resto', 'alloco'], meteo: 'pluie',
    tipsCercle: [
      TIP('Léa', 'curatrice · 47 spots', 'le katsu sando à emporter. lumière triste à l\'intérieur, prends-le et va au jardin du Palais-Royal.'),
    ],
  },
  // fournée 2 (screenshots Google Maps du 11/06)
  { nom: 'La Coquille', note: 'bar, 10-20 balles.', lat: 48.8721, lng: 2.3528, envies: ['apéro'] },
  { nom: 'Kehribar', note: 'à tester insta. turc.', lat: 48.8694, lng: 2.3585, envies: ['resto'] },
  { nom: 'Mian Fan', note: 'à tester. fusion asiatique, 10-20 balles.', lat: 48.8674, lng: 2.3461, envies: ['resto'], meteo: 'pluie' },
  { nom: 'Naï Naï — Bistrot chic asiatique', note: 'à tester. fondue chinoise.', lat: 48.8682, lng: 2.3449, envies: ['resto'], compagnies: ['duo'] },
  { nom: 'Duplex Bar', note: 'bar gay à tester.', lat: 48.8597, lng: 2.3547, envies: ['apéro', 'turbo'] },
  { nom: "Vingt Vins d'Art", note: 'reco xtof. bistro à vins.', lat: 48.8632, lng: 2.3691, envies: ['apéro', 'tranquilo'], compagnies: ['potos'] },
  { nom: 'Le Louchebem', note: 'viande, les halles. 20-60 balles.', lat: 48.8625, lng: 2.3454, envies: ['resto', 'gastro'] },
  { nom: 'Chez Marius', note: 'reco xtof. 20-70 balles.', lat: 48.8569, lng: 2.3162, envies: ['resto', 'gastro'], compagnies: ['potos'] },
  { nom: 'Restaurant À la maison', note: 'resto reco xtof. 40-70 balles.', lat: 48.8702, lng: 2.3401, envies: ['gastro'], compagnies: ['potos'], meteo: 'soleil' },
  { nom: 'Pacifique', note: 'chinois, 20-30 balles.', lat: 48.8722, lng: 2.3771, envies: ['resto'], photos: ph('pacifique') },
  { nom: 'Brasserie — Rdv Dina', note: 'rdv Dina. brasserie 20-30.', lat: 48.8705, lng: 2.3433, envies: ['resto'], compagnies: ['duo'] },
  { nom: 'Au top', note: 'à test. rooftop, français.', lat: 48.8606, lng: 2.3522, envies: ['apéro', 'turbo'], meteo: 'soleil' },
  { nom: 'JanTchi', note: 'bobun Sainte-Anne. coréen.', lat: 48.8667, lng: 2.3354, envies: ['resto'], meteo: 'pluie' },
  { nom: "Au P'tit Garage", note: 'dans un garage. bar 1-10 balles.', lat: 48.8639, lng: 2.3768, envies: ['apéro', 'incognito'], meteo: 'pluie' },
  { nom: 'Poni', note: 'restaurant à tester. brasserie.', lat: 48.8712, lng: 2.3445, envies: ['resto'] },
  { nom: 'Le Hibou — Paris', note: 'brasserie Odéon, 20-70.', lat: 48.8521, lng: 2.3389, envies: ['resto', 'apéro'] },
  { nom: 'AVESTA — cuisine kurde', note: 'authentique, 10-20 balles.', lat: 48.8716, lng: 2.3568, envies: ['resto', 'alloco'], meteo: 'pluie' },
  { nom: 'Pide Paris', note: 'turc, 10-20 balles.', lat: 48.8698, lng: 2.3551, envies: ['alloco', 'resto'], meteo: 'pluie' },
  { nom: 'Hanoï Cà Phê Opéra', note: 'café/resto sympa. vietnamien.', lat: 48.8701, lng: 2.3327, envies: ['resto', 'tranquilo'] },
  { nom: 'Restaurant Godjo', note: 'éthiopien, 20-30 balles.', lat: 48.8472, lng: 2.3508, envies: ['resto'], compagnies: ['potos'] },
  // les spots des membres du cercle (leurs cartes, visibles par toi)
  {
    nom: 'Le Syndicat',
    note: 'cocktails pointus, que des alcools français. niveau bruit : fort mais bon fort.',
    lat: 48.8714, lng: 2.3551,
    envies: ['incognito', 'turbo'], compagnies: ['duo', 'potos'],
    auteurCercle: 0, // Karim
    photos: ph('syndicat'),
  },
  {
    nom: 'Early June',
    note: 'vins nature, lumière de fin de journée incroyable. table seule à la fenêtre = bonheur.',
    lat: 48.8722, lng: 2.3705,
    envies: ['apéro', 'tranquilo'], compagnies: ['solo', 'duo'],
    auteurCercle: 1, // Léa
    photos: ph('earlyjune'),
  },
  {
    nom: 'La Buvette',
    note: 'minuscule, va-y tôt. les œufs mimosa. lumière de bougie parfaite.',
    lat: 48.8669, lng: 2.3786,
    envies: ['apéro', 'incognito'], compagnies: ['duo'],
    auteurCercle: 1, // Léa
  },
]

// ── le public : des éclaireurs HORS de ton cercle, dont les spots sont
// publics autour de toi (simulé en V1 — le vrai public-local vient du cloud).
// proprietaire = leur id (pas 'moi', pas un membre du cercle) → ils ne polluent
// pas "ma carte" ni "le cercle", mais peuplent l'onglet "public".
const PUBLICS: Array<{
  id: string
  nom: string
  lat: number
  lng: number
  envies: Lieu['envies']
  compagnies?: Lieu['compagnies']
  meteo?: Lieu['meteo']
  auteur: string
  titre: string
  note: string
}> = [
  {
    id: 'sofia', nom: 'Le Mary Céleste', lat: 48.8627, lng: 2.3637,
    envies: ['apéro', 'incognito'], compagnies: ['duo', 'potos'], meteo: 'nuageux',
    auteur: 'Sofia', titre: 'éclaireuse du 3e',
    note: 'huîtres + cocktails, debout au comptoir rond. va-y à 18h pile, après c\'est blindé.',
  },
  {
    id: 'yanis', nom: 'Le Comptoir Général', lat: 48.8702, lng: 2.3633,
    envies: ['tranquilo', 'apéro'], compagnies: ['potos'], meteo: 'pluie',
    auteur: 'Yanis', titre: 'éclaireur du 10e',
    note: 'le "ghetto muséum" sur le canal. entrée discrète, jus de gingembre maison. immense.',
  },
  {
    id: 'ines', nom: 'Bisou', lat: 48.8635, lng: 2.3672,
    envies: ['apéro', 'incognito'], compagnies: ['duo'], meteo: 'soleil',
    auteur: 'Inès', titre: 'curatrice · 61 spots',
    note: 'pas de carte : tu dis ton humeur, ils inventent ton cocktail. lumière bougie parfaite.',
  },
  {
    id: 'tomas', nom: 'Septime La Cave', lat: 48.8533, lng: 2.3812,
    envies: ['apéro', 'gastro'], compagnies: ['solo', 'duo'], meteo: 'nuageux',
    auteur: 'Tomas', titre: 'fiable',
    note: 'vins nature, planche parfaite. minuscule, on s\'y serre — c\'est le charme.',
  },
]

// horaires plausibles dérivés de l'envie, tant qu'on n'a pas les vrais
// (l'import Google/OSM les remplacera). bars/apéro ferment tard, gastro tôt.
function horairesDefaut(envies: string[]): [number, number] {
  if (envies.includes('apéro') || envies.includes('turbo')) return [18, 26]
  if (envies.includes('gastro')) return [19, 23.5]
  if (envies.includes('alloco')) return [11, 23]
  if (envies.includes('tranquilo')) return [10, 22]
  return [12, 23]
}

// Coupe du monde : qui diffuse, qui est un refuge anti-foot.
// déterministe sur le nom (stable) — les bars diffusent souvent les matchs,
// les tables calmes sont des refuges. (à terme : déclaré par le membre.)
// #22 : la propreté des WC, déterministe sur le nom (le seul score autorisé).
// (à terme : déclarée par le membre à la capture.)
function propreteDefaut(_nom: string): 1 | 2 | 3 | undefined {
  // la propreté des WC ne s'invente pas : elle vient des membres (photos WC).
  // tant qu'on n'a pas la vraie donnée, on n'affiche rien (pas de faux score).
  return undefined
}

// rooftop : détecté sur le texte (nom/tip/cuisine). on ne tague que ce qui est
// explicite — les VRAIES adresses de rooftops vérifiées viendront d'une source.
function estRooftop(...textes: (string | undefined)[]): boolean {
  return /rooftop|roof|sur le toit|terrasse panoramique|perchoir/i.test(textes.filter(Boolean).join(' '))
}

function matchDefaut(envies: string[], nom: string): Lieu['match'] {
  const h = hashNum(nom)
  const bar = envies.includes('apéro') || envies.includes('turbo')
  const calme =
    envies.includes('gastro') || envies.includes('tranquilo') || envies.includes('incognito')
  if (bar) return h % 10 < 7 ? 'diffuse' : undefined // ~70% des bars diffusent
  if (calme) return h % 10 < 4 ? 'refuge' : undefined // ~40% des spots calmes = refuge
  return undefined
}

export async function importerSeed(): Promise<boolean> {
  await dedoublonner()
  if (localStorage.getItem('jeudi-seed-v18')) return false
  // poser le drapeau AVANT d'insérer : React StrictMode lance
  // l'effet deux fois en dev, sinon double import (course)
  localStorage.setItem('jeudi-seed-v18', 'fait')
  const db = await getDB()
  // purge l'ancien seed (v1) avant de réinsérer la version cercle
  for (const l of await db.getAll('lieux')) {
    if (l.source === 'google') await db.delete('lieux', l.id)
  }
  // les spots du cercle simulé (Karim/Léa) : on ne garde QUE ceux-là de l'ancien
  // seed ; mes spots approximatifs sont remplacés par les vraies données (ERSAN).
  for (const s of SPOTS) {
    const membre = s.auteurCercle !== undefined ? MEMBRES[s.auteurCercle] : null
    if (!membre) continue
    await ajouterLieuLocal({
      id: nouvelId(),
      nom: s.nom,
      lat: s.lat ?? 0,
      lng: s.lng ?? 0,
      note: '',
      visibilite: 'cercle',
      envies: s.envies ?? [],
      compagnies: s.compagnies ?? [],
      meteo: s.meteo,
      horaires: s.horaires ?? horairesDefaut(s.envies ?? []),
      match: matchDefaut(s.envies ?? [], s.nom),
      rooftop: estRooftop(s.nom, s.note),
      propreteWc: propreteDefaut(s.nom),
      photos: s.photos ?? [],
      statut: 'actif',
      creeLe: new Date().toISOString(),
      source: 'google',
      proprietaire: membre.id,
      tipsCercle: [{ auteur: membre.prenom, titre: membre.titre, note: s.note }],
    })
  }
  // ── le profil ERSAN : ta vraie collection (Google Maps géocodé), en PUBLIC ──
  for (const e of ERSAN) {
    const envies = cuisineVersEnvies(e.cuisine)
    await ajouterLieuLocal({
      id: nouvelId(),
      nom: e.nom,
      lat: e.lat,
      lng: e.lng,
      adresse: e.adresse || undefined,
      description: e.cuisine || undefined, // description factuelle de base (≈ type de lieu)
      note: e.note, // ton tip Google, conservé tel quel
      visibilite: 'public',
      envies,
      compagnies: [],
      meteo: prixVersMeteo(e.prix),
      horaires: horairesDefaut(envies),
      match: matchDefaut(envies, e.nom),
      rooftop: estRooftop(e.nom, e.note, e.cuisine),
      propreteWc: propreteDefaut(e.nom),
      photos: ph(e.nom),
      statut: 'actif',
      creeLe: new Date().toISOString(),
      source: 'google',
      proprietaire: 'moi',
    })
  }
  // les spots publics d'éclaireurs hors cercle (peuplent l'onglet "public")
  for (const p of PUBLICS) {
    await ajouterLieuLocal({
      id: nouvelId(),
      nom: p.nom,
      lat: p.lat,
      lng: p.lng,
      note: '',
      visibilite: 'public',
      envies: p.envies,
      compagnies: p.compagnies ?? [],
      meteo: p.meteo,
      horaires: horairesDefaut(p.envies),
      match: matchDefaut(p.envies, p.nom),
      rooftop: estRooftop(p.nom, p.note),
      propreteWc: propreteDefaut(p.nom),
      photos: ph(p.id),
      statut: 'actif',
      creeLe: new Date().toISOString(),
      source: 'google',
      proprietaire: `pub-${p.id}`,
      tipsCercle: [{ auteur: p.auteur, titre: p.titre, note: p.note }],
    })
  }
  // les spots curated (liste GPT v02, géocodés) — toutes catégories, publics.
  // inclut rooftop + sur l'eau + speakeasy(incognito) + disco + guinguette + street-food…
  for (const [i, s] of CURATED.entries()) {
    await ajouterLieuLocal({
      id: nouvelId(),
      nom: s.nom,
      lat: s.lat,
      lng: s.lng,
      adresse: s.adresse,
      description: s.description,
      note: '',
      visibilite: 'public',
      envies: s.envies as Lieu['envies'],
      compagnies: s.compagnies as Lieu['compagnies'],
      meteo: s.meteo,
      rooftop: s.rooftop || undefined,
      surLeau: s.surLeau || undefined,
      photos: ph(s.nom),
      statut: 'actif',
      creeLe: new Date().toISOString(),
      source: 'google',
      proprietaire: `pub-cur-${i}`,
    })
  }
  // extra : Coupe du monde 2026 (match diffuse) + sur l'eau (péniches, quais…)
  for (const [i, s] of EXTRA.entries()) {
    await ajouterLieuLocal({
      id: nouvelId(),
      nom: s.nom,
      lat: s.lat,
      lng: s.lng,
      adresse: s.adresse,
      description: s.description,
      note: '',
      visibilite: 'public',
      envies: s.envies as Lieu['envies'],
      compagnies: s.compagnies as Lieu['compagnies'],
      meteo: s.meteo,
      surLeau: s.surLeau || undefined,
      match: s.match,
      photos: ph(s.nom),
      statut: 'actif',
      creeLe: new Date().toISOString(),
      source: 'google',
      proprietaire: `pub-x-${i}`,
    })
  }
  return true
}

// retire les doublons (même nom + même source google) laissés par
// la course du double-effet en dev
async function dedoublonner() {
  const db = await getDB()
  const tous = await db.getAll('lieux')
  const vus = new Set<string>()
  for (const l of tous) {
    const cle = `${l.nom}|${l.source}`
    if (l.source === 'google' && vus.has(cle)) {
      await db.delete('lieux', l.id)
    } else {
      vus.add(cle)
    }
  }
}
