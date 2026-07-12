import { type Lieu, type PhotoLieu, ajouterLieuLocal, nouvelId, getDB } from './db'
// les gros fichiers de données (ERSAN/CURATED/EXTRA) sont importés dynamiquement
// DANS importerSeed() : ils ne partent plus dans le chunk principal.

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

// ── vrais profils only (bloc D) : les membres fictifs (Karim/Léa) sont morts.
// leurs bons spots survivent en DÉCOR PUBLIC ci-dessous (PUBLICS) : les tips
// restent — voix éditoriales tamponnées « démo » — mais plus aucun faux
// profil n'existe dans le cercle.

// ── le public : des éclaireurs HORS de ton cercle, dont les spots sont
// publics autour de toi (simulé en V1 — le vrai public-local vient du cloud).
// proprietaire = leur id (pas 'moi', pas un membre du cercle) → ils ne polluent
// pas "ma carte" ni "le cercle", mais peuplent l'onglet "public".
// NB : ce bloc GARDE ses curateurs distincts (Sofia, Yanis, Inès…) — raison
// forte : chacun porte une VOIX éditoriale nommée + titrée dans tipsCercle,
// tamponnée « démo ». Les fondre dans « jeudi. » effacerait cette texture de
// « d'autres voix ». Seuls le fond ersan/curated/extra (sans voix nommée)
// bascule sous le curateur fondateur 'jeudi'.
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
  // ex-spots du faux cercle (Karim/Léa) : gardés en décor public, voix « démo »
  {
    id: 'karim-syndicat', nom: 'Le Syndicat', lat: 48.8714, lng: 2.3551,
    envies: ['incognito', 'turbo'], compagnies: ['duo', 'potos'],
    auteur: 'Karim', titre: 'éclaireur du 10e',
    note: 'cocktails pointus, que des alcools français. niveau bruit : fort mais bon fort.',
  },
  {
    id: 'lea-earlyjune', nom: 'Early June', lat: 48.8722, lng: 2.3705,
    envies: ['apéro', 'tranquilo'], compagnies: ['solo', 'duo'],
    auteur: 'Léa', titre: 'curatrice · 47 spots',
    note: 'vins nature, lumière de fin de journée incroyable. table seule à la fenêtre = bonheur.',
  },
  {
    id: 'lea-buvette', nom: 'La Buvette', lat: 48.8669, lng: 2.3786,
    envies: ['apéro', 'incognito'], compagnies: ['duo'],
    auteur: 'Léa', titre: 'curatrice · 47 spots',
    note: 'minuscule, va-y tôt. les œufs mimosa. lumière de bougie parfaite.',
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
function propreteDefaut(): 1 | 2 | 3 | undefined {
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
  // v20 : le fond du seed (ersan/curated/extra) devient le carnet éditorial
  // « jeudi. » (proprietaire 'jeudi') — avant, les spots ersan étaient 'moi' →
  // ils s'affichaient comme LES SIENS chez chaque nouvel inscrit. Le bump
  // re-seede les installs existantes (purge source==='google', réinsère).
  if (localStorage.getItem('jeudi-seed-v20')) return false
  // poser le drapeau AVANT d'insérer : React StrictMode lance
  // l'effet deux fois en dev, sinon double import (course)
  localStorage.setItem('jeudi-seed-v20', 'fait')
  // données chargées à la demande (chunks séparés du bundle principal)
  const [{ default: ERSAN }, { CURATED }, { EXTRA }] = await Promise.all([
    import('./ersan'),
    import('./spots_curated'),
    import('./spots_extra'),
  ])
  const db = await getDB()
  // purge l'ancien seed (v1) avant de réinsérer la version cercle
  for (const l of await db.getAll('lieux')) {
    if (l.source === 'google') await db.delete('lieux', l.id)
  }
  // ── le fond ERSAN : géocodé depuis Google Maps, désormais le carnet
  //    éditorial fondateur signé « jeudi. » (public, visible par TOUS) ──
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
      propreteWc: propreteDefaut(),
      photos: ph(e.nom),
      statut: 'actif',
      creeLe: new Date().toISOString(),
      source: 'google',
      proprietaire: 'jeudi', // le carnet fondateur, jamais « à moi »
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
      propreteWc: propreteDefaut(),
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
  // attribués à « jeudi. » : un seul éclaireur fondateur cohérent (plus de
  // faux ids pub-cur-* éparpillés, qui n'affichaient aucun curateur).
  for (const s of CURATED) {
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
      proprietaire: 'jeudi',
    })
  }
  // extra : Coupe du monde 2026 (match diffuse) + sur l'eau (péniches, quais…)
  // même curateur fondateur « jeudi. » que le reste du fond.
  for (const s of EXTRA) {
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
      proprietaire: 'jeudi',
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
