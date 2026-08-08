// ════════════════════════════════════════════════════════════════
// ENRICHISSEMENT DES SPOTS — étape 2 : LA FUSION
//
// Croise ce que les trois sources savent d'un même lieu (Google Places,
// OpenStreetMap, les packs GPT) et en tire, pour chaque spot du carnet,
// un TYPE et une CUISINE fiables — plus les horaires encore manquants.
//
// Le carnet ne stocke ni type ni cuisine : il les DEVINE de la
// description, à la lecture, via typeDeLieu() et cuisineDeLieu()
// (app/src/typesLieu.ts). Poser un type, ici, ça veut donc dire :
// écrire une description qui le dit. C'est pour ça que ce script
// importe les vraies fonctions du carnet au lieu d'en recopier les
// règles — et qu'il RELIT chaque description qu'il propose pour
// vérifier qu'elle rend bien le type et la cuisine visés. Une
// proposition qui ne se relit pas juste n'est pas écrite.
//
// CE SCRIPT N'ÉCRIT RIEN DANS LA BASE. Jamais. Il pose deux fichiers
// sur la table :
//   _enrichissement/fusion_<date>.sql  → à coller dans le SQL Editor
//   _enrichissement/fusion_rapport.md  → ce qui change, nom par nom
//
// LES TROIS RÈGLES, dans l'ordre où elles s'appliquent :
//   1. une saisie existante prime TOUJOURS. Le script ne touche qu'aux
//      descriptions vides ou aux étiquettes brutes ramenées de Google
//      Maps (« Turque », « Restaurant »). Une phrase rédigée n'est
//      jamais réécrite, même si une source la contredit — on note le
//      désaccord et on passe. Et le SQL lui-même reporte la garde :
//      chaque UPDATE exige de retrouver la description EXACTE sur
//      laquelle il a été décidé. Si Ersan est passé par là entre-temps,
//      la ligne ne bouge pas. La base a toujours le dernier mot.
//   2. en désaccord entre sources : Google > OSM > GPT. Google n'a pas
//      encore de clé ; la logique l'attend déjà, il suffira de poser
//      google_resultats.json à côté et de relancer.
//   3. tout se justifie. Chaque décision, chaque abstention, chaque
//      désaccord part dans le rapport avec le nom du lieu.
//
// Lancer depuis n'importe où :  node _enrichissement/fusionner_enrichissement.mjs
// ════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const ICI = dirname(fileURLToPath(import.meta.url))
const RACINE = join(ICI, '..')
const APP = join(RACINE, 'app')

// ════════════════════════════════════════════════════════════════
// 1. LE VOCABULAIRE OFFICIEL — on va le chercher dans le carnet
// ════════════════════════════════════════════════════════════════
// Pas de copie des regex ici : les 10 glyphes et les 21 tampons vivent
// dans app/src/typesLieu.ts, et c'est cette version-là qui décide. Si
// Ersan ajoute un type demain, ce script suit sans qu'on y touche.
// (esbuild vit dans app/node_modules — le script, lui, vit hors de app/)
const { build } = createRequire(join(APP, 'package.json'))('esbuild')

async function chargerTS(chemin) {
  const r = await build({
    entryPoints: [chemin],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    logLevel: 'silent',
  })
  const tmp = join(ICI, `.tmp_${Math.random().toString(36).slice(2)}.cjs`)
  writeFileSync(tmp, r.outputFiles[0].text)
  const mod = createRequire(import.meta.url)(tmp)
  const { unlinkSync } = await import('node:fs')
  unlinkSync(tmp)
  return mod
}

const carnet = await chargerTS(join(APP, 'src', 'typesLieu.ts'))
const { TYPES_LIEU, typeDeLieu, cuisineDeLieu, labelTypeLieu } = carnet
const TYPES = new Set(TYPES_LIEU)
console.log(`vocabulaire du carnet : ${TYPES_LIEU.length} types — ${TYPES_LIEU.join(', ')}`)

// ── les mots qui DISENT un type, une fois relus par typeDeLieu() ──
// (l'ordre des regex compte, dans typesLieu.ts : ces tournures-là ont
//  été choisies pour tomber sur la bonne, et le script le revérifie)
const MOT_TYPE = {
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
}

// ── l'adjectif qui DIT une cuisine, une fois relu par cuisineDeLieu() ──
// La France n'a pas de tampon : on ne tamponne pas son propre passeport
// (typesLieu.ts). Un lieu français reste donc sans code, exprès.
const ADJ_CUISINE = {
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

// garde-fou de démarrage : si un tampon du carnet n'a pas son adjectif
// ici, on préfère le savoir tout de suite plutôt qu'à la relecture.
{
  const manquants = []
  for (const [code, adj] of Object.entries(ADJ_CUISINE)) {
    const relu = cuisineDeLieu({ description: `Restaurant ${adj}` })
    if (!relu || relu.code !== code) manquants.push(`${code} (« ${adj} » → ${relu?.code ?? 'rien'})`)
  }
  if (manquants.length) {
    console.error('⚠ adjectifs de cuisine qui ne se relisent pas :', manquants.join(', '))
    process.exit(1)
  }
  const typesFaux = []
  for (const [t, mot] of Object.entries(MOT_TYPE)) {
    const relu = typeDeLieu({ description: mot, envies: [] })
    if (relu !== t) typesFaux.push(`${t} (« ${mot} » → ${relu})`)
  }
  if (typesFaux.length) {
    console.error('⚠ mots de type qui ne se relisent pas :', typesFaux.join(', '))
    process.exit(1)
  }
  console.log(`  ${Object.keys(ADJ_CUISINE).length} tampons et ${Object.keys(MOT_TYPE).length} types : tous relus juste ✓`)
}

// ════════════════════════════════════════════════════════════════
// 2. L'ÉTAT SUPPOSÉ DE LA BASE
// ════════════════════════════════════════════════════════════════
// Personne ici ne parle à Supabase. Ce qu'on connaît de la base, c'est
// ce qu'on lui a collé : l'import v2 (les 302 lignes du fond) et la
// fusion des horaires du 02/08. On raisonne là-dessus — et le SQL
// vérifiera de lui-même, ligne par ligne, que la base n'a pas bougé.
const SQL_IMPORT = join(RACINE, 'supabase', 'imports', '2026-08-01_import_ersan_v2_tout.sql')
const SQL_HORAIRES = join(RACINE, 'supabase', 'imports', '2026-08-02_fusion_horaires_osm.sql')

/** découpe une ligne `('a', 1.2, null, 'b''c', …)` en champs bruts.
 *  Les apostrophes doublées de SQL redeviennent des apostrophes. */
function champsSQL(ligne) {
  const out = []
  let i = 0, cur = '', enChaine = false, etaitChaine = false
  while (i < ligne.length) {
    const c = ligne[i]
    if (enChaine) {
      if (c === "'") {
        if (ligne[i + 1] === "'") { cur += "'"; i += 2; continue }
        enChaine = false; i++; continue
      }
      cur += c; i++; continue
    }
    if (c === "'") { enChaine = true; etaitChaine = true; i++; continue }
    if (c === ',') { out.push({ txt: cur.trim(), chaine: etaitChaine }); cur = ''; etaitChaine = false; i++; continue }
    cur += c; i++
  }
  out.push({ txt: cur.trim(), chaine: etaitChaine })
  return out
}

function lignesValues(chemin) {
  return readFileSync(chemin, 'utf8')
    .split('\n')
    .filter((l) => /^\s*\('/.test(l))
    .map((l) => l.trim().replace(/^\(/, '').replace(/\),?\s*$/, ''))
}

// l'import v2 : (nom, lat, lng, adresse, description, note, envies, …)
const base = new Map() // clé = nom en minuscules
const collisionsNom = []
for (const l of lignesValues(SQL_IMPORT)) {
  const f = champsSQL(l)
  const nom = f[0].txt
  const desc = f[4].chaine ? f[4].txt : null // `null` non quoté = pas de description
  // les envies servent de repli à typeDeLieu() quand la description se tait
  const envies = [...(f[6]?.txt ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1])
  const cle = nom.toLowerCase()
  if (base.has(cle)) { collisionsNom.push(nom); continue } // on n'écrit jamais sur un nom ambigu
  base.set(cle, { nom, description: desc, envies })
}
console.log(`base supposée : ${base.size} lieux (import v2)${collisionsNom.length ? ` · ${collisionsNom.length} noms en double écartés` : ''}`)

// la fusion du 02/08 : qui a déjà ses horaires
const horairesDejaPosees = new Set()
for (const l of lignesValues(SQL_HORAIRES)) {
  const f = champsSQL(l)
  if (f.length === 3 && f[0].chaine) horairesDejaPosees.add(f[0].txt.toLowerCase())
}
console.log(`  dont ${horairesDejaPosees.size} avec des horaires posés le 02/08`)

// ════════════════════════════════════════════════════════════════
// 3. LES TROIS SOURCES
// ════════════════════════════════════════════════════════════════

// ── 3a. OSM : amenity → type, cuisine → tampon ────────────────────
// Les amenity muets sont volontairement absents : `hotel`, `theatre`,
// `cinema`, `parking`, `ferry_terminal`… ne disent pas ce qu'on sert
// dans le lieu (souvent le match OSM a attrapé le bâtiment autour, pas
// le bar dedans). Mieux vaut ne rien conclure que conclure faux.
const OSM_TYPE = {
  restaurant: 'resto',
  bar: 'bar',
  pub: 'bar',
  biergarten: 'bar',
  cafe: 'cafe',
  nightclub: 'club',
  fast_food: 'street',
  food_court: 'street',
  ice_cream: 'glace',
  bakery: 'patisserie',
  pastry: 'patisserie',
  confectionery: 'patisserie',
  tea: 'the',
  wine: 'vin',
  alcohol: 'vin',
}

// `french` est un ARRÊT, pas un trou : OSM affirme « cuisine française »,
// et le carnet répond « pas de tampon pour la maison ». Rencontré en
// premier, il clôt la question — c'est ce qui fait que
// « coffee_shop;french;tapas » ne finit pas tamponné espagnol.
const ARRET_MAISON = Symbol('maison')
const OSM_CUISINE = {
  french: ARRET_MAISON,
  regional: ARRET_MAISON,
  italian: 'ITA', pizza: 'ITA', pasta: 'ITA', sicilian: 'ITA',
  japanese: 'JPN', ramen: 'JPN', sushi: 'JPN', udon: 'JPN', soba: 'JPN',
  yakitori: 'JPN', izakaya: 'JPN', donburi: 'JPN',
  chinese: 'CHN', dim_sum: 'CHN', dumpling: 'CHN', cantonese: 'CHN', sichuan: 'CHN',
  korean: 'KOR',
  thai: 'THA',
  vietnamese: 'VIE', pho: 'VIE',
  indian: 'IND', tandoori: 'IND', biryani: 'IND',
  lebanese: 'LBN',
  israeli: 'ISR', falafel: 'ISR',
  turkish: 'TUR', kebab: 'TUR', anatolian: 'TUR',
  greek: 'GRE', souvlaki: 'GRE',
  moroccan: 'MAR', couscous: 'MAR', tajine: 'MAR',
  tunisian: 'TUN',
  african: 'AFR', senegalese: 'AFR', ivorian: 'AFR',
  ethiopian: 'ETH',
  mexican: 'MEX', taqueria: 'MEX', quesadilla: 'MEX',
  peruvian: 'PER', ceviche: 'PER', nikkei: 'PER',
  brazilian: 'BRA',
  spanish: 'ESP', tapas: 'ESP', basque: 'ESP', catalan: 'ESP',
  portuguese: 'POR',
  american: 'USA', diner: 'USA',
}
// Ce que ces mots-là disent du TYPE et pas de la nationalité.
// (`burger` n'est pas une nationalité : c'est de la street food. Le
//  tamponner USA serait faux — un smash parisien n'est pas américain.)
const OSM_CUISINE_TYPE = {
  fine_dining: 'gastro',
  coffee_shop: 'cafe',
  burger: 'street',
  sandwich: 'street',
  friture: 'street',
  ice_cream: 'glace',
  cake: 'patisserie',
  pastry: 'patisserie',
  bubble_tea: 'the',
}

function lireOSM() {
  const f = join(ICI, 'osm_resultats.json')
  if (!existsSync(f)) return []
  return JSON.parse(readFileSync(f, 'utf8')).map((r) => {
    const o = r.osm ?? {}
    let type = OSM_TYPE[o.amenity] ?? null
    let cuisine = null
    // la cuisine OSM est une liste : « japanese;ramen », « thai;french »
    for (const brut of String(o.cuisine ?? '').split(';').map((s) => s.trim().toLowerCase()).filter(Boolean)) {
      if (!type && OSM_CUISINE_TYPE[brut]) type = OSM_CUISINE_TYPE[brut]
      if (cuisine === null && brut in OSM_CUISINE) {
        const v = OSM_CUISINE[brut]
        cuisine = v === ARRET_MAISON ? 'MAISON' : v
      }
    }
    // un amenity « restaurant » que la cuisine dit gastronomique : la
    // cuisine est plus précise, elle gagne.
    for (const brut of String(o.cuisine ?? '').split(';').map((s) => s.trim().toLowerCase())) {
      if (OSM_CUISINE_TYPE[brut] && (type === 'resto' || type === null)) type = OSM_CUISINE_TYPE[brut]
    }
    return {
      nom: r.nom,
      type,
      cuisine,
      horaires: plageDuSoir(o.horaires),
      confiance: r.score ?? 1,
      brut: `amenity=${o.amenity ?? '—'}${o.cuisine ? ` cuisine=${o.cuisine}` : ''}`,
    }
  })
}

// ── 3b. Google Places : la source la plus fiable, quand elle existe ──
// Pas de clé aujourd'hui → google_resultats.json est absent et cette
// branche ne rend rien. Le jour où le fichier sera là, la fusion le
// prendra sans qu'on retouche une ligne : c'est tout l'intérêt de
// l'écrire maintenant. (`rating` reste ignoré : jamais d'étoiles dans
// jeudi — même règle que dans enrichir_google.mjs.)
const GOOGLE_TYPE = {
  bar: 'bar', wine_bar: 'vin', pub: 'bar', night_club: 'club',
  cafe: 'cafe', coffee_shop: 'cafe', tea_house: 'the',
  ice_cream_shop: 'glace', dessert_shop: 'patisserie', bakery: 'patisserie',
  fast_food_restaurant: 'street', meal_takeaway: 'street', sandwich_shop: 'street',
  hamburger_restaurant: 'street', pizza_restaurant: 'resto',
  fine_dining_restaurant: 'gastro', restaurant: 'resto',
}
const GOOGLE_CUISINE = {
  italian_restaurant: 'ITA', japanese_restaurant: 'JPN', ramen_restaurant: 'JPN',
  sushi_restaurant: 'JPN', chinese_restaurant: 'CHN', korean_restaurant: 'KOR',
  thai_restaurant: 'THA', vietnamese_restaurant: 'VIE', indian_restaurant: 'IND',
  lebanese_restaurant: 'LBN', middle_eastern_restaurant: 'LBN',
  turkish_restaurant: 'TUR', greek_restaurant: 'GRE', mexican_restaurant: 'MEX',
  brazilian_restaurant: 'BRA', spanish_restaurant: 'ESP', tapas_restaurant: 'ESP',
  portuguese_restaurant: 'POR', american_restaurant: 'USA',
  african_restaurant: 'AFR', french_restaurant: 'MAISON',
}

function lireGoogle() {
  const f = join(ICI, 'google_resultats.json')
  if (!existsSync(f)) return []
  return JSON.parse(readFileSync(f, 'utf8')).map((r) => {
    const g = r.google ?? {}
    const types = g.types ?? []
    let type = null, cuisine = null
    for (const t of types) if (!type && GOOGLE_TYPE[t]) type = GOOGLE_TYPE[t]
    for (const t of types) if (!cuisine && GOOGLE_CUISINE[t]) cuisine = GOOGLE_CUISINE[t]
    // un « japanese_restaurant » sans type explicite reste un resto
    if (!type && cuisine) type = 'resto'
    return {
      nom: r.nom,
      type,
      cuisine,
      horaires: plageGoogle(g.horaires),
      confiance: 1,
      brut: `types=${types.slice(0, 4).join(',') || '—'}`,
    }
  })
}

// ── 3c. les packs GPT : le dernier mot, et seulement s'il est sûr ────
// Les réponses ne sont pas encore revenues (gpt_reponses/ n'existe pas).
// La lecture est prête : dépose les JSON, relance, ils entrent dans
// l'arbitrage — en dernier, et sous le seuil de confiance.
const SEUIL_GPT = 0.5
const GPT_ENVIE_TYPE = { disco: 'club', apéro: 'bar', apero: 'bar', incognito: 'bar', tranquilo: 'cafe', alloco: 'street', gastro: 'gastro', resto: 'resto' }

function lireGPT() {
  const dossier = join(ICI, 'gpt_reponses')
  if (!existsSync(dossier)) return { lignes: [], ignoresConfiance: 0, fichiers: 0 }
  // le pack dit le nom, la réponse dit l'id : on relie les deux
  const nomParId = new Map()
  for (const p of readdirSync(join(ICI, 'gpt_packs')).filter((f) => f.endsWith('.md'))) {
    const txt = readFileSync(join(ICI, 'gpt_packs', p), 'utf8')
    // on vise le tableau final, pas le « [18,26] » de la consigne :
    // le seul crochet en début de ligne (d'où indexOf('\n[\n')).
    const i = txt.indexOf('\n[\n')
    if (i < 0) continue
    for (const l of JSON.parse(txt.slice(i))) nomParId.set(l.id, l.nom)
  }
  const lignes = []
  let ignoresConfiance = 0
  const fichiers = readdirSync(dossier).filter((f) => f.endsWith('.json'))
  for (const f of fichiers) {
    let arr
    try { arr = JSON.parse(readFileSync(join(dossier, f), 'utf8')) } catch { continue }
    for (const r of Array.isArray(arr) ? arr : []) {
      const nom = r.nom ?? nomParId.get(r.id)
      if (!nom) continue
      if ((r.confiance ?? 0) < SEUIL_GPT) { ignoresConfiance++; continue }
      let type = null
      for (const c of r.categories ?? []) if (!type && GPT_ENVIE_TYPE[c]) type = GPT_ENVIE_TYPE[c]
      lignes.push({
        nom,
        type,
        cuisine: null, // les packs ne demandent pas la nationalité : on n'invente pas
        horaires: plageGPT(r.horaires),
        confiance: r.confiance ?? 0,
        brut: `categories=${(r.categories ?? []).join(',') || '—'} confiance=${r.confiance ?? '?'}`,
      })
    }
  }
  return { lignes, ignoresConfiance, fichiers: fichiers.length }
}

// ════════════════════════════════════════════════════════════════
// 4. LES HORAIRES — tout aplatir sur UNE plage, celle du jeudi soir
// ════════════════════════════════════════════════════════════════
// La base ne garde qu'un couple (horaire_ouv, horaire_ferm) : pas de
// jours. On retient donc la plage qui contient 20 h le jeudi — celle
// qui compte, dans une app qui s'appelle jeudi. Fermeture après minuit
// = on ajoute 24 (2 h du matin → 26), convention posée le 02/08.
const JOURS_OSM = { Mo: 0, Tu: 1, We: 2, Th: 3, Fr: 4, Sa: 5, Su: 6 }
const JEUDI = 3

function retenirLaPlage(plages) {
  if (!plages.length) return null
  const duSoir = plages.filter(([o, f]) => o <= 20 && f > 20)
  const [ouv, ferm] = duSoir.length ? duSoir[duSoir.length - 1] : plages[plages.length - 1]
  return [Math.round(ouv * 100) / 100, Math.round(ferm * 100) / 100]
}

/** opening_hours OSM → [ouv, ferm], ou null si le jeudi n'est pas servi */
function plageDuSoir(oh) {
  if (!oh) return null
  if (/24\/7/.test(oh)) return [0, 24]
  const plages = []
  for (let bloc of oh.split(';')) {
    bloc = bloc.trim()
    if (!bloc || /\boff\b|closed/i.test(bloc)) continue
    // un préfixe de saison (« May-Oct 12:00-23:30 ») ne dit rien du jour
    bloc = bloc.replace(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))?\s+/, '')
    const m = bloc.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su|PH)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?[,\s]*)+)\s+(.*)$/)
    const joursTxt = m ? m[1] : null
    const horTxt = m ? m[2] : bloc
    // pas de jours écrits = tous les jours ; sinon le jeudi doit y être
    let couvreJeudi = true
    if (joursTxt) {
      couvreJeudi = false
      for (const tok of joursTxt.split(/[,\s]+/).filter(Boolean)) {
        const mm = tok.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?$/)
        if (!mm) continue // « PH » (jours fériés) : ni oui ni non
        const a = JOURS_OSM[mm[1]], b = mm[2] ? JOURS_OSM[mm[2]] : JOURS_OSM[mm[1]]
        // « Sa-Mo » enjambe le dimanche : l'intervalle boucle
        if (a <= b ? JEUDI >= a && JEUDI <= b : JEUDI >= a || JEUDI <= b) couvreJeudi = true
      }
    }
    if (!couvreJeudi) continue
    for (const r of horTxt.split(',')) {
      const t = r.trim().match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/)
      if (!t) continue
      const ouv = +t[1] + +t[2] / 60
      let ferm = +t[3] + +t[4] / 60
      if (ferm <= ouv) ferm += 24 // ferme après minuit
      plages.push([ouv, ferm])
    }
  }
  return retenirLaPlage(plages)
}

/** periods Google Places → [ouv, ferm] du jeudi (day 4 = jeudi chez eux) */
function plageGoogle(periods) {
  if (!Array.isArray(periods)) return null
  const plages = []
  for (const p of periods) {
    if (p?.open?.day !== 4) continue
    const ouv = (p.open.hour ?? 0) + (p.open.minute ?? 0) / 60
    let ferm = (p.close?.hour ?? 24) + (p.close?.minute ?? 0) / 60
    if (p.close && p.close.day !== p.open.day) ferm += 24
    else if (ferm <= ouv) ferm += 24
    plages.push([ouv, ferm])
  }
  return retenirLaPlage(plages)
}

/** {"lun":[18,26],…} des packs GPT → la ligne du jeudi */
function plageGPT(h) {
  if (!h || typeof h !== 'object') return null
  const j = h.jeu ?? h.jeudi
  if (!Array.isArray(j) || j.length < 2) return null
  const [ouv, ferm] = j
  if (typeof ouv !== 'number' || typeof ferm !== 'number') return null
  return [ouv, ferm > ouv ? ferm : ferm + 24]
}

// ════════════════════════════════════════════════════════════════
// 5. LIRE UNE DESCRIPTION EXISTANTE — et savoir si on a le droit
// ════════════════════════════════════════════════════════════════
// Aucune colonne ne dit « écrit à la main ». Le seul indice honnête,
// c'est la forme du texte. Les trois origines du fond n'écrivent pas
// pareil :
//   · Google Maps a déversé des étiquettes nues, capitalisées, 1 à 3
//     mots — « Restaurant », « Turque », « Bar à cocktails ». Ça, ce
//     n'est la voix de personne : on peut le préciser.
//   · le reste du fond est rédigé : une phrase en minuscule, un point
//     final, un ou deux repères concrets. Ça, on n'y touche pas.
// Dans le doute, on classe REDIGEE — c'est-à-dire : on s'abstient.
const MAX_ETIQUETTE = 40

function classerDescription(d) {
  if (d == null || d.trim() === '') return 'VIDE'
  const t = d.trim()
  // « 93100 Montreuil » atterri dans la description : un code postal
  // n'est pas une description. On la traite comme absente.
  if (/^\d{5}\b/.test(t) || /^\d{1,3}[,\s]+(rue|avenue|bd|boulevard|place|quai)\b/i.test(t)) return 'ABERRANTE'
  if (t.length > MAX_ETIQUETTE) return 'REDIGEE'
  if (t.endsWith('.')) return 'REDIGEE' // la phrase rédigée finit par un point
  if (/[,;:]|\b(avec|dans|pour|sur|vue|ambiance)\b/i.test(t)) return 'REDIGEE'
  if (t[0] !== t[0].toUpperCase()) return 'REDIGEE' // minuscule initiale = style rédigé
  return 'ETIQUETTE'
}

/** une étiquette « pure » se résume à un type + une cuisine : la
 *  réécrire ne perd rien. Une étiquette qui dit autre chose
 *  (« Stand de hot-dog », « Bar gay ») porte une info qu'on ne sait
 *  pas reformuler → on la laisse à Ersan. */
function etiquettePure(t) {
  const nu = t
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  const PURES = new Set([
    'restaurant', 'bar', 'cafe', 'bistro', 'bistrot', 'brasserie', 'pub', 'club',
    'glacier', 'patisserie', 'boulangerie', 'salon de the', 'cave a vin', 'bar a vins',
    'bar a cocktails', 'bar a tapas', 'bar a bieres', 'buffet', 'bio', 'sushis', 'ramen',
    'francaise', 'italienne', 'japonaise', 'chinoise', 'coreenne', 'thai', 'thailandaise',
    'vietnamienne', 'indienne', 'libanaise', 'israelienne', 'turque', 'grecque',
    'marocaine', 'tunisienne', 'africaine', 'ethiopienne', 'mexicaine', 'peruvienne',
    'bresilienne', 'espagnole', 'portugaise', 'americaine', 'mediterraneenne',
    'cuisine gastronomique', 'fusion asiatique', 'moyenne orientale', 'cambodgienne',
  ])
  return PURES.has(nu)
}

// ════════════════════════════════════════════════════════════════
// 6. L'ARBITRAGE — Google > OSM > GPT
// ════════════════════════════════════════════════════════════════
const google = lireGoogle()
const osm = lireOSM()
const gpt = lireGPT()
console.log(`sources : Google ${google.length} · OSM ${osm.length} · GPT ${gpt.lignes.length} (${gpt.fichiers} fichier(s))`)
if (!google.length) console.log('  (pas de google_resultats.json — la branche Google reste en attente de clé)')
if (!gpt.lignes.length) console.log('  (pas de gpt_reponses/*.json — les packs n\'ont pas encore été renvoyés)')

// index par nom : c'est la seule clé qu'on partage avec la base
const parNom = (arr) => {
  const m = new Map()
  for (const r of arr) if (!m.has(r.nom.toLowerCase())) m.set(r.nom.toLowerCase(), r)
  return m
}
const SOURCES = [
  { nom: 'Google', rang: 1, index: parNom(google) },
  { nom: 'OSM', rang: 2, index: parNom(osm) },
  { nom: 'GPT', rang: 3, index: parNom(gpt.lignes) },
]

/** ramasse les avis des trois sources sur un champ, dans l'ordre de
 *  priorité. Le premier qui parle décide ; les autres, s'ils disent
 *  autre chose, sont notés comme désaccord — jamais effacés en silence. */
function arbitrer(cle, avis) {
  const parlent = avis.filter((a) => a.valeur != null)
  if (!parlent.length) return { valeur: null, source: null, confiance: 0, desaccord: null }
  const gagnant = parlent[0]
  const contre = parlent.slice(1).filter((a) => a.valeur !== gagnant.valeur)
  return {
    valeur: gagnant.valeur,
    source: gagnant.source,
    confiance: gagnant.confiance ?? 0,
    desaccord: contre.length
      ? `${cle} : ${gagnant.source} dit « ${gagnant.valeur} », ${contre.map((c) => `${c.source} dit « ${c.valeur} »`).join(', ')} → ${gagnant.source} tranche`
      : null,
  }
}

// ── LES DEUX GARDE-FOUS, appris en relisant les premiers résultats ──
//
// 1. UN MATCH TIÈDE NE RENVERSE RIEN. Le score d'appariement d'OSM
//    (nom + distance) sépare mal le vrai du faux entre 0,6 et 0,85 :
//    « Le Hibou » à 0,8 est le bon lieu, mais « Restaurant À la maison »
//    à 0,8 a été apparié au pub « La Maison », et « Café des Arts et
//    Métiers » aux « Arts et Métiers » à 72 m — deux établissements
//    différents. Alors on module l'exigence selon ce qu'on risque :
//    renverser un type déjà écrit demande une quasi-certitude, remplir
//    un vide se contente de moins. Ça coûte quelques vrais positifs
//    (Le Hibou reste « Brasserie ») ; ça évite d'écrire des faussetés,
//    ce qui coûte bien plus cher dans un carnet.
const SEUIL_CHANGER_TYPE = 0.9
const SEUIL_POSER_CUISINE = 0.8 // un tag cuisine est une donnée précise, rarement volée au voisin
const SEUIL_REMPLIR_VIDE = 0.7

// 2. ON NE RECULE JAMAIS VERS LE GÉNÉRIQUE. `resto` est la valeur par
//    défaut de typeDeLieu() : c'est ce qu'il répond quand il ne sait
//    pas. Un `amenity=restaurant` d'OSM dit la même chose — « c'est un
//    endroit où on mange », pas plus. Laisser ça écraser un type déjà
//    précis, c'est comme ça qu'on transforme Akrame, étoilé, en
//    « Restaurant ». Une source ne peut donc pas rétrograder vers
//    `resto` un lieu qui disait déjà mieux.
const TYPE_GENERIQUE = 'resto'

const decisions = []
for (const [cle, lieu] of base) {
  const avis = SOURCES.map((s) => ({ source: s.nom, r: s.index.get(cle) })).filter((a) => a.r)
  const classe = classerDescription(lieu.description)
  const typeActuel = typeDeLieu({ description: lieu.description ?? '', envies: lieu.envies })
  const cuisineActuelle = cuisineDeLieu({ description: lieu.description ?? '' })

  const aType = arbitrer('type', avis.map((a) => ({ source: a.source, valeur: a.r.type, confiance: a.r.confiance })))
  const aCuisine = arbitrer('cuisine', avis.map((a) => ({ source: a.source, valeur: a.r.cuisine, confiance: a.r.confiance })))
  const aHoraires = arbitrer('horaires', avis.map((a) => ({ source: a.source, valeur: a.r.horaires ? a.r.horaires.join('–') : null, confiance: a.r.confiance })))

  const d = {
    nom: lieu.nom,
    classe,
    descriptionActuelle: lieu.description,
    typeActuel,
    cuisineActuelle: cuisineActuelle?.code ?? null,
    sources: avis.map((a) => `${a.source}(${a.r.brut})`).join(' · ') || '—',
    desaccords: [aType.desaccord, aCuisine.desaccord, aHoraires.desaccord].filter(Boolean),
    typeVise: aType.valeur, sourceType: aType.source, confianceType: aType.confiance,
    cuisineVisee: aCuisine.valeur === 'MAISON' ? null : aCuisine.valeur, sourceCuisine: aCuisine.source,
    confianceCuisine: aCuisine.confiance,
    maison: aCuisine.valeur === 'MAISON',
    freins: [],
    horaires: null, sourceHoraires: null,
    action: 'RIEN', motif: '', descriptionNouvelle: null,
  }

  // ── les garde-fous, avant toute décision ──
  // (on les applique ici pour que même les motifs d'abstention soient
  //  honnêtes : inutile d'écrire « OSM aurait dit X » si, de toute
  //  façon, on n'aurait pas suivi OSM sur ce X-là.)
  const vide = classe === 'VIDE' || classe === 'ABERRANTE'
  let typeRetenu = null
  if (d.typeVise) {
    const seuil = vide ? SEUIL_REMPLIR_VIDE : SEUIL_CHANGER_TYPE
    if (d.typeVise === typeActuel) typeRetenu = d.typeVise // rien à renverser
    else if (d.confianceType < seuil)
      d.freins.push(`type ${typeActuel} → ${d.typeVise} refusé : appariement ${d.sourceType} à ${d.confianceType} (< ${seuil})`)
    else if (!vide && d.typeVise === TYPE_GENERIQUE && typeActuel !== TYPE_GENERIQUE)
      d.freins.push(`type ${typeActuel} → ${TYPE_GENERIQUE} refusé : on ne rétrograde pas vers le générique`)
    else typeRetenu = d.typeVise
  }
  let cuisineRetenue = null
  if (d.cuisineVisee) {
    if (d.confianceCuisine < SEUIL_POSER_CUISINE)
      d.freins.push(`tampon ${d.cuisineVisee} refusé : appariement ${d.sourceCuisine} à ${d.confianceCuisine} (< ${SEUIL_POSER_CUISINE})`)
    else cuisineRetenue = d.cuisineVisee
  }

  // ── les horaires : la source la mieux classée qui en a ──
  for (const s of SOURCES) {
    const r = s.index.get(cle)
    if (r?.horaires) { d.horaires = r.horaires; d.sourceHoraires = s.nom; break }
  }
  if (d.horaires && horairesDejaPosees.has(cle)) { d.horairesDejaPosees = true; d.horaires = null }

  // ── la description ──
  if (!avis.length) {
    d.motif = 'aucune source ne connaît ce lieu'
  } else if (classe === 'REDIGEE') {
    // règle 1 : ce qui est écrit reste écrit.
    const contredit = (typeRetenu && typeRetenu !== typeActuel) || (cuisineRetenue && cuisineRetenue !== d.cuisineActuelle)
    d.action = contredit ? 'ABSTENTION' : 'RIEN'
    d.motif = contredit
      ? `description rédigée conservée — ${d.sourceType ?? d.sourceCuisine} aurait dit ${typeRetenu ?? typeActuel}${cuisineRetenue ? '/' + cuisineRetenue : ''}`
      : 'description rédigée, déjà d\'accord avec les sources'
  } else if (classe === 'ETIQUETTE' && !etiquettePure(lieu.description)) {
    d.action = 'ABSTENTION'
    d.motif = `étiquette porteuse d'un détail qu'on ne sait pas reformuler — à trancher à la main`
  } else {
    // VIDE, ABERRANTE, ou étiquette pure : on a le droit de préciser.
    const type = typeRetenu ?? typeActuel
    const cuisine = d.maison ? null : (cuisineRetenue ?? d.cuisineActuelle)
    if (!TYPES.has(type)) { d.motif = `type « ${type} » hors vocabulaire — ignoré`; decisions.push(d); continue }
    const proposee = [MOT_TYPE[type], cuisine ? ADJ_CUISINE[cuisine] : null].filter(Boolean).join(' ')

    // ── la relecture : la description proposée rend-elle bien ce qu'on vise ? ──
    const reluType = typeDeLieu({ description: proposee, envies: lieu.envies })
    const reluCuisine = cuisineDeLieu({ description: proposee })?.code ?? null
    if (reluType !== type || reluCuisine !== (cuisine ?? null)) {
      d.action = 'ABSTENTION'
      d.motif = `« ${proposee} » se relit ${reluType}/${reluCuisine ?? '—'} au lieu de ${type}/${cuisine ?? '—'} — pas écrit`
    } else if (proposee === (lieu.description ?? '').trim()) {
      d.motif = 'la description dit déjà exactement ça'
    } else if (reluType === typeActuel && reluCuisine === d.cuisineActuelle && classe === 'ETIQUETTE') {
      // on ne réécrit pas pour le plaisir de réécrire
      d.motif = `« ${lieu.description} » donne déjà ${typeActuel}${d.cuisineActuelle ? '/' + d.cuisineActuelle : ''}`
    } else {
      d.action = 'ECRIRE'
      d.descriptionNouvelle = proposee
      d.gainType = reluType !== typeActuel
      d.gainCuisine = reluCuisine !== d.cuisineActuelle && reluCuisine != null
      d.motif = [
        d.gainType ? `type ${typeActuel} → ${reluType}` : null,
        d.gainCuisine ? `tampon ${d.cuisineActuelle ?? '—'} → ${reluCuisine}` : null,
        classe === 'VIDE' ? 'description absente' : classe === 'ABERRANTE' ? 'description aberrante remplacée' : null,
      ].filter(Boolean).join(', ') || 'précision'
      d.motif += ` (source ${d.sourceType ?? d.sourceCuisine})`
    }
  }
  decisions.push(d)
}

// ════════════════════════════════════════════════════════════════
// 7. LE SQL — sur le modèle du 02/08 : one-shot, rejouable, gardé
// ════════════════════════════════════════════════════════════════
// `null::text` et pas `null` tout court : dans un VALUES, Postgres doit
// pouvoir typer la colonne même si la première ligne est vide.
const q = (s) => (s == null ? 'null::text' : `'${String(s).replace(/'/g, "''")}'`)

const aEcrire = decisions.filter((d) => d.action === 'ECRIRE')
const aHoraires = decisions.filter((d) => d.horaires)
const DATE = new Date().toISOString().slice(0, 10)

let sql = `-- ════════════════════════════════════════════════════════════════
-- FUSION DE L'ENRICHISSEMENT — ${DATE} (one-shot, rejouable)
-- Généré par _enrichissement/fusionner_enrichissement.mjs.
-- Sources croisées : ${[google.length && 'Google Places', osm.length && 'OpenStreetMap', gpt.lignes.length && 'packs GPT'].filter(Boolean).join(' + ') || 'aucune'}.
-- Priorite en cas de desaccord : Google > OSM > GPT.
--
-- LA GARDE : chaque UPDATE exige de retrouver la description EXACTE
-- sur laquelle il a ete decide (colonne "avant"). Si tu as retouche un
-- lieu depuis, la ligne ne bouge pas — tes saisies priment, toujours.
-- Les horaires ne sont poses que la ou il n'y en a aucun.
-- Rejouer ce fichier deux fois ne change rien la seconde fois.
--
-- À coller dans Supabase → SQL Editor → Run.
-- ${aEcrire.length} description(s) · ${aHoraires.length} horaire(s)
-- ════════════════════════════════════════════════════════════════

`

if (aEcrire.length) {
  sql += `-- ── 1. LES DESCRIPTIONS (le type et le tampon en decoulent) ──────
with moi as (
  select id from public.profils
  where lower(prenom) = 'ersan'
  order by cree_le asc limit 1
),
d (nom, avant, apres) as (
  values
${aEcrire.map((x) => `  (${q(x.nom)}, ${q(x.descriptionActuelle)}, ${q(x.descriptionNouvelle)})`).join(',\n')}
)
update public.lieux l
set description = d.apres
from d, moi
where l.owner_id = moi.id
  and lower(l.nom) = lower(d.nom)
  -- la garde : rien ne bouge si la description a change depuis
  and l.description is not distinct from d.avant;

`
} else {
  sql += `-- ── 1. LES DESCRIPTIONS ──────────────────────────────────────────
-- Rien a ecrire : aucune description ne peut etre precisee sans
-- ecraser une saisie existante. Voir fusion_rapport.md.

`
}

if (aHoraires.length) {
  sql += `-- ── 2. LES HORAIRES MANQUANTS (plage du jeudi soir, >24 = apres minuit) ──
with moi as (
  select id from public.profils
  where lower(prenom) = 'ersan'
  order by cree_le asc limit 1
),
h (nom, ouv, ferm) as (
  values
${aHoraires.map((x) => `  (${q(x.nom)}, ${x.horaires[0].toFixed(2)}, ${x.horaires[1].toFixed(2)})`).join(',\n')}
)
update public.lieux l
set horaire_ouv = h.ouv, horaire_ferm = h.ferm
from h, moi
where l.owner_id = moi.id
  and lower(l.nom) = lower(h.nom)
  and l.horaire_ouv is null and l.horaire_ferm is null;

`
} else {
  sql += `-- ── 2. LES HORAIRES ──────────────────────────────────────────────
-- Rien a ajouter : OSM a deja tout donne le 02/08, et ni Google ni les
-- packs GPT n'ont encore repondu. Cette section se remplira toute seule
-- le jour ou l'un des deux arrive — relance le script.

`
}

sql += `-- ── 3. CONTROLE (a lire apres le Run) ────────────────────────────
select
  count(*)                                            as lieux_du_fond,
  count(*) filter (where description is not null)     as avec_description,
  count(*) filter (where horaire_ouv is not null)     as avec_horaires
from public.lieux
where owner_id = (select id from public.profils where lower(prenom)='ersan' order by cree_le asc limit 1);
`

const cheminSQL = join(ICI, `fusion_${DATE}.sql`)
writeFileSync(cheminSQL, sql)

// ════════════════════════════════════════════════════════════════
// 8. LE RAPPORT — chaque décision, nommée
// ════════════════════════════════════════════════════════════════
const parAction = (a) => decisions.filter((d) => d.action === a)
const abstentions = parAction('ABSTENTION')
const gainsType = aEcrire.filter((d) => d.gainType)
const gainsCuisine = aEcrire.filter((d) => d.gainCuisine)
const desaccords = decisions.filter((d) => d.desaccords.length)
const freinés = decisions.filter((d) => d.freins.length)
const inconnus = decisions.filter((d) => d.sources === '—')

const compte = (arr, cle) => {
  const m = new Map()
  for (const d of arr) m.set(d[cle], (m.get(d[cle]) ?? 0) + 1)
  return [...m].sort((a, b) => b[1] - a[1])
}

const rapport = `# Fusion de l'enrichissement — ${DATE}

Croisement OSM + packs GPT + Google Places sur le fond du carnet, pour
poser un **type** et une **cuisine** fiables sur chaque spot, et combler
les horaires manquants. Rien n'a été appliqué à la base : ce rapport
accompagne \`${`fusion_${DATE}.sql`}\`, à coller à la main dans le SQL Editor.

## Ce qui rentre

| source | lieux connus | état |
|---|---|---|
| Google Places | ${google.length} | ${google.length ? 'lu' : '**pas de clé** — `google_resultats.json` absent, la branche existe et attend'} |
| OpenStreetMap | ${osm.length} | ${osm.length ? 'lu (`osm_resultats.json`)' : 'absent'} |
| packs GPT | ${gpt.lignes.length} | ${gpt.fichiers ? `${gpt.fichiers} fichier(s) lus, ${gpt.ignoresConfiance} réponse(s) écartées sous confiance ${SEUIL_GPT}` : '**pas encore renvoyés** — `gpt_reponses/` absent, la lecture est prête'} |

Base supposée : les ${base.size} lieux de \`2026-08-01_import_ersan_v2_tout.sql\`,
dont ${horairesDejaPosees.size} ont déjà reçu leurs horaires le 02/08.

## Les chiffres

| | |
|---|---|
| spots du fond examinés | **${decisions.length}** |
| couverts par au moins une source | **${decisions.length - inconnus.length}** (${Math.round((100 * (decisions.length - inconnus.length)) / decisions.length)} %) |
| descriptions réécrites | **${aEcrire.length}** |
| — dont changement de type (donc de glyphe) | **${gainsType.length}** |
| — dont pose d'un tampon de cuisine | **${gainsCuisine.length}** |
| horaires ajoutés | **${aHoraires.length}** |
| abstentions (saisie existante protégée) | **${abstentions.length}** |
| désaccords entre sources arbitrés | **${desaccords.length}** |
| aucune source | ${inconnus.length} |

## Comment les désaccords sont tranchés

Priorité **Google > OSM > GPT**, champ par champ (type, cuisine, horaires
sont arbitrés séparément — une source peut gagner sur l'un et perdre sur
l'autre). La source la mieux classée qui a un avis décide ; les autres
sont notées, jamais effacées en silence.

${desaccords.length ? desaccords.map((d) => `- **${d.nom}** — ${d.desaccords.join(' ; ')}`).join('\n') : `Aucun désaccord ce tour-ci : une seule source parle à la fois (Google et GPT sont absents). C'est le cas facile — la règle est en place pour le jour où ils arrivent.`}

## Ce qui change, nom par nom

${aEcrire.length ? `### Descriptions réécrites (${aEcrire.length})

| lieu | avant | après | ce que ça gagne | appariement |
|---|---|---|---|---|
${aEcrire.map((d) => `| ${d.nom} | ${d.descriptionActuelle == null ? '_(vide)_' : `\`${d.descriptionActuelle}\``} | \`${d.descriptionNouvelle}\` | ${d.motif} | ${Math.max(d.confianceType, d.confianceCuisine).toFixed(2)} |`).join('\n')}` : '### Descriptions réécrites\n\nAucune.'}

${aHoraires.length ? `### Horaires ajoutés (${aHoraires.length})

| lieu | ouverture | fermeture | source |
|---|---|---|---|
${aHoraires.map((d) => `| ${d.nom} | ${d.horaires[0]} | ${d.horaires[1]} | ${d.sourceHoraires} |`).join('\n')}` : `### Horaires ajoutés

Aucun. OSM avait 137 lieux horodatés et la fusion du 02/08 en a déjà posé
${horairesDejaPosees.size} ; le reste ne sert pas le jeudi (clubs du vendredi,
lieux saisonniers). Ce gisement est épuisé — les prochains horaires
viendront de Google ou des packs GPT.`}

## Les abstentions — ce qu'on refuse de toucher

Une description déjà écrite prime **toujours**, même contre une source.
Elle en dit plus qu'une étiquette, et ce n'est pas au script de décider
qu'il écrit mieux qu'Ersan.

${abstentions.length ? abstentions.map((d) => `- **${d.nom}** — ${d.motif}`).join('\n') : 'Aucune.'}

## Les freins — ce que les sources ont proposé et qu'on a refusé

Un appariement OSM n'est pas une preuve : il repose sur un nom
approchant et une distance. Entre 0,60 et 0,85 il se trompe de voisin
(« Restaurant À la maison » apparié au pub « La Maison », « Café des
Arts et Métiers » aux « Arts et Métiers » à 72 m). Deux règles filtrent
donc les propositions avant écriture :

- **renverser un type déjà écrit exige ${SEUIL_CHANGER_TYPE}** d'appariement, poser un
  tampon de cuisine ${SEUIL_POSER_CUISINE}, remplir une description vide ${SEUIL_REMPLIR_VIDE} ;
- **jamais de retour au générique** : \`resto\` est ce que \`typeDeLieu()\`
  répond quand il ne sait pas, et \`amenity=restaurant\` n'en dit pas plus.
  Une source ne peut donc pas rétrograder en \`resto\` un lieu qui disait
  déjà mieux — c'est ce qui aurait transformé Akrame, étoilé, en
  « Restaurant ».

${freinés.length ? `${freinés.length} proposition(s) écartée(s) :\n\n${freinés.map((d) => `- **${d.nom}** — ${d.freins.join(' ; ')}`).join('\n')}` : 'Aucune proposition écartée.'}

## La double sécurité

1. **Au moment de décider** : le script ne réécrit que les descriptions
   vides, aberrantes (un code postal égaré) ou les étiquettes brutes
   ramenées de Google Maps — reconnaissables à leur forme (≤ ${MAX_ETIQUETTE} caractères,
   capitalisées, sans point final) et présentes dans une liste blanche
   explicite. Tout le reste est classé « rédigée » et laissé tel quel.
   Dans le doute, il classe « rédigée ».
2. **Au moment d'appliquer** : chaque \`UPDATE\` porte
   \`and l.description is not distinct from d.avant\`. Si la base a bougé
   depuis la génération, la ligne est simplement sautée. Le SQL peut être
   rejoué sans risque : la seconde fois, il ne trouve plus rien à faire.

Les horaires gardent la même prudence que le 02/08 :
\`and l.horaire_ouv is null and l.horaire_ferm is null\`.

## Vocabulaire respecté

Les types écrits sont pris dans les ${TYPES_LIEU.length} de \`app/src/typesLieu.ts\`
(${TYPES_LIEU.join(', ')}) et les tampons dans les ${Object.keys(ADJ_CUISINE).length} codes trois lettres du même fichier.
Le script **importe** ces fonctions au lieu d'en recopier les règles, puis
**relit** chaque description qu'il propose avec \`typeDeLieu()\` et
\`cuisineDeLieu()\` : si la relecture ne rend pas exactement le type et le
tampon visés, la ligne n'est pas écrite. ${decisions.filter((d) => /se relit/.test(d.motif)).length} proposition(s) écartée(s) ainsi.

La cuisine française ne reçoit pas de tampon — on ne tamponne pas son
propre passeport (${decisions.filter((d) => d.maison).length} lieu(x) concerné(s) ce tour-ci).

## Répartition des types visés

${compte(decisions.filter((d) => d.typeVise), 'typeVise').map(([t, n]) => `- ${labelTypeLieu(t)} (\`${t}\`) : ${n}`).join('\n') || '—'}

${collisionsNom.length ? `## Noms en double écartés\n\nLa table \`lieux\` n'a aucune contrainte d'unicité sur le nom : un \`UPDATE\`\nsur un nom porté par deux lignes toucherait les deux. Ces noms sont donc\nsortis de la fusion :\n\n${collisionsNom.map((n) => `- ${n}`).join('\n')}\n` : ''}
## Et quand Google arrivera

Poser la clé dans \`.google_key\`, lancer \`enrichir_google.mjs\`, puis
relancer ce script : \`google_resultats.json\` sera lu automatiquement et
passera devant OSM dans tous les arbitrages. Même chose pour les packs :
déposer les réponses dans \`gpt_reponses/pack_NN.json\` et relancer. Aucune
ligne de ce script n'est à retoucher.
`

const cheminRapport = join(ICI, 'fusion_rapport.md')
writeFileSync(cheminRapport, rapport)

console.log(`
─────────────────────────────────────────────
${decisions.length} spots examinés · ${decisions.length - inconnus.length} couverts par une source
${aEcrire.length} descriptions réécrites (${gainsType.length} changent de type, ${gainsCuisine.length} gagnent un tampon)
${aHoraires.length} horaires ajoutés · ${abstentions.length} abstentions · ${desaccords.length} désaccords
─────────────────────────────────────────────
SQL      → ${cheminSQL}
rapport  → ${cheminRapport}

Rien n'a été appliqué à la base. À toi de coller le SQL.`)
