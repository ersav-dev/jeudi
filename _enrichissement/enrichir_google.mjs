// ════════════════════════════════════════════════════════════════
// ENRICHISSEMENT DES SPOTS — étape 1bis : Google Places API (officiel)
// Complète ce qu'OSM n'a pas trouvé : horaires, niveau de prix, catégorie,
// site, téléphone. Cible UNIQUEMENT les spots sans horaires après OSM.
//
// PRÉREQUIS (une fois, ~5 min, projet existant jeudi-499418) :
//   1. console.cloud.google.com → projet jeudi → « APIs & Services »
//      → Enable APIs → activer « Places API (New) »
//   2. Credentials → Create credentials → API key
//      (restreindre la clé à Places API (New) = bonne pratique)
//   3. Billing doit être activé sur le projet (carte) — le palier gratuit
//      mensuel couvre largement nos ~340 appels : coût réel 0 €.
//   4. Colle la clé dans _enrichissement/.google_key (fichier texte, 1 ligne)
//
// Lancer depuis app/ :  node ../_enrichissement/enrichir_google.mjs
// Sortie : google_resultats.json (même format d'intention qu'osm_resultats)
// ════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ICI = dirname(fileURLToPath(import.meta.url))
const CLE_FICHIER = join(ICI, '.google_key')
if (!existsSync(CLE_FICHIER)) {
  console.error('⚠ pas de clé : colle ta clé API dans _enrichissement/.google_key (voir l\'en-tête du script)')
  process.exit(1)
}
const CLE = readFileSync(CLE_FICHIER, 'utf8').trim()

// ── qui doit-on compléter ? tout spot sans horaires après la passe OSM ──
const osm = JSON.parse(readFileSync(join(ICI, 'osm_resultats.json'), 'utf8'))
const matchesSansHoraires = osm.filter((r) => !r.osm.horaires)
const idsMatches = new Set(osm.map((r) => r.id))
const rapport = readFileSync(join(ICI, 'rapport.md'), 'utf8') // juste pour compter
// les non-matchés OSM : on les recharge depuis les packs GPT (source de vérité des trous)
import { readdirSync } from 'node:fs'
const packs = readdirSync(join(ICI, 'gpt_packs')).filter((f) => f.endsWith('.md'))
const nonMatches = []
for (const p of packs) {
  const txt = readFileSync(join(ICI, 'gpt_packs', p), 'utf8')
  const json = txt.slice(txt.indexOf('['))
  for (const l of JSON.parse(json)) if (l.quoi === 'tout') nonMatches.push(l)
}
// besoin des coords : on les retrouve dans le seed via le même chargeur qu'OSM
// (raccourci : osm_resultats n'a pas les coords des non-matchés → relire le seed)
import { createRequire } from 'node:module'
const APP = join(ICI, '..', 'app')
const { build } = createRequire(join(APP, 'package.json'))('esbuild')
async function chargerTS(chemin) {
  const r = await build({ entryPoints: [chemin], bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent' })
  const tmp = join(ICI, `.tmp_${Math.random().toString(36).slice(2)}.cjs`)
  writeFileSync(tmp, r.outputFiles[0].text)
  const require_ = createRequire(import.meta.url)
  const mod = require_(tmp)
  const { unlinkSync } = await import('node:fs')
  unlinkSync(tmp)
  return mod
}
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const slug = (nom) => 'nom:' + norm(nom).replace(/ /g, '-')
const curated = await chargerTS(join(APP, 'src', 'spots_curated.ts'))
const extra = await chargerTS(join(APP, 'src', 'spots_extra.ts'))
const ersan = await chargerTS(join(APP, 'src', 'ersan.ts'))
const seed = new Map()
for (const arr of [curated.CURATED ?? [], extra.EXTRA ?? [], ersan.default ?? ersan.ERSAN ?? []])
  for (const s of arr) seed.set(s.id ?? slug(s.nom), s)

const cibles = [
  ...nonMatches.map((l) => ({ id: l.id, raison: 'non-matché OSM' })),
  ...matchesSansHoraires.map((r) => ({ id: r.id, raison: 'matché OSM sans horaires' })),
].filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i && seed.has(c.id))
console.log(`${cibles.length} spots à compléter via Google Places`)

// ── Places API (New) : text search (biaisé coords) puis details ──
const CHAMPS_DETAILS = 'id,displayName,regularOpeningHours,priceLevel,types,websiteUri,nationalPhoneNumber,rating'
async function chercher(spot) {
  const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': CLE,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.location',
    },
    body: JSON.stringify({
      textQuery: `${spot.nom} Paris`,
      locationBias: { circle: { center: { latitude: spot.lat, longitude: spot.lng }, radius: 400 } },
      maxResultCount: 3,
      languageCode: 'fr',
    }),
  })
  if (!r.ok) throw new Error(`searchText ${r.status}: ${await r.text()}`)
  const j = await r.json()
  // garde le candidat le plus proche à moins de 300 m
  const distM = (a, b) => {
    const R = 6371000, rad = Math.PI / 180
    const dLat = (b.latitude - a.lat) * rad, dLng = (b.longitude - a.lng) * rad
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(h))
  }
  const cands = (j.places || [])
    .map((p) => ({ ...p, distance: distM(spot, p.location) }))
    .filter((p) => p.distance < 300)
    .sort((a, b) => a.distance - b.distance)
  return cands[0] ?? null
}
async function details(placeId) {
  const r = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: { 'X-Goog-Api-Key': CLE, 'X-Goog-FieldMask': CHAMPS_DETAILS },
  })
  if (!r.ok) throw new Error(`details ${r.status}: ${await r.text()}`)
  return r.json()
}

// prix Google → météo du porte-monnaie jeudi
const PRIX = { PRICE_LEVEL_INEXPENSIVE: '€', PRICE_LEVEL_MODERATE: '€€', PRICE_LEVEL_EXPENSIVE: '€€€', PRICE_LEVEL_VERY_EXPENSIVE: '€€€' }

const resultats = []
let ratés = 0
for (const [i, c] of cibles.entries()) {
  const spot = seed.get(c.id)
  try {
    const cand = await chercher(spot)
    if (!cand) { ratés++; continue }
    const d = await details(cand.id)
    resultats.push({
      id: c.id, nom: spot.nom, raison: c.raison,
      google: {
        placeId: d.id,
        nomGoogle: d.displayName?.text ?? null,
        distance: Math.round(cand.distance),
        horaires: d.regularOpeningHours?.periods ?? null,
        horairesTexte: d.regularOpeningHours?.weekdayDescriptions ?? null,
        prix: PRIX[d.priceLevel] ?? null,
        types: d.types ?? null,
        site: d.websiteUri ?? null,
        tel: d.nationalPhoneNumber ?? null,
        // rating volontairement IGNORÉ à la fusion : jamais d'étoiles dans jeudi.
      },
    })
    if ((i + 1) % 20 === 0) {
      console.log(`  ${i + 1}/${cibles.length}…`)
      writeFileSync(join(ICI, 'google_resultats.json'), JSON.stringify(resultats, null, 1))
    }
    await new Promise((res) => setTimeout(res, 120)) // douceur sur le quota
  } catch (e) {
    console.error(`  ✗ ${spot.nom}: ${e.message.slice(0, 120)}`)
    ratés++
    if (String(e.message).includes('403') || String(e.message).includes('PERMISSION_DENIED')) {
      console.error('⚠ clé refusée — vérifie que Places API (New) est activée et le billing en place.')
      break
    }
  }
}
writeFileSync(join(ICI, 'google_resultats.json'), JSON.stringify(resultats, null, 1))
console.log(`\n✓ ${resultats.length} complétés via Google · ${ratés} introuvables`)
console.log(`  horaires : ${resultats.filter((r) => r.google.horaires).length} · prix : ${resultats.filter((r) => r.google.prix).length}`)
console.log('→ dis à Claude « fusionne l\'enrichissement » (OSM prime, Google comble, GPT en dernier)')