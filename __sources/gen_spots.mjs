// génère app/src/spots_curated.ts depuis paris_spots_app_curated_v02_FR_semicolon.csv
// (séparateur « ; »). Mapping déjà fait par GPT dans les colonnes pour_* / avec_*.
// On géocode les coords manquantes (Nominatim) et on adapte les descriptions à la
// voix « jeudi » (minuscule en tête, ton direct).
import { readFileSync, writeFileSync } from 'node:fs'

const csv = readFileSync(new URL('./paris_spots_app_curated_v02_FR_semicolon.csv', import.meta.url), 'utf8')

function parseCSV(txt, sep) {
  const rows = []
  let row = [], cur = '', q = false
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i]
    if (q) {
      if (c === '"' && txt[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') q = false
      else cur += c
    } else {
      if (c === '"') q = true
      else if (c === sep) { row.push(cur); cur = '' }
      else if (c === '\r') {}
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
      else cur += c
    }
  }
  if (cur || row.length) { row.push(cur); rows.push(row) }
  return rows
}

const rows = parseCSV(csv.trim(), ';')
const head = rows[0]
const objs = rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])))

const meteoMap = { 'grand soleil': 'soleil', nuageux: 'nuageux', pluie: 'pluie' }
const ENVIES = [
  ['pour_tranquillo', 'tranquilo'], ['pour_allocco', 'alloco'], ['pour_resto', 'resto'],
  ['pour_gastro', 'gastro'], ['pour_incognito', 'incognito'], ['pour_apero', 'apéro'],
  ['pour_street_food', 'alloco'],
]
const COMPS = [['avec_solo', 'solo'], ['avec_duo', 'duo'], ['avec_potos', 'potos'], ['avec_pro', 'pro']]

// on garde : inclure_app=1 ET fiabilite=bonne
const gardes = objs.filter((o) => o.inclure_app === '1' && o.fiabilite === 'bonne')

// voix jeudi : minuscule en tête (les noms propres internes gardent leur casse)
function voixJeudi(d) {
  let s = (d || '').trim().replace(/^(Adresse|Lieu|Restaurant|Bar)\s+/i, '')
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s
}

async function geocode(adresse) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(adresse)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'jeudi-app/1.0 (spots)' } })
  const j = await res.json()
  return j[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null
}

const out = []
for (const o of gardes) {
  let lat = parseFloat(o.lat), lng = parseFloat(o.lng)
  if (!lat || !lng) {
    process.stdout.write(`géocode ${o.nom}… `)
    const g = await geocode(o.adresse_complete)
    if (g) { lat = g.lat; lng = g.lng; console.log('ok') }
    else { console.log('ÉCHEC — ignoré'); continue }
    await new Promise((r) => setTimeout(r, 1100))
  }
  const envies = [...new Set(ENVIES.filter(([k]) => o[k] === '1').map(([, v]) => v))]
  out.push({
    nom: o.nom,
    categorie: o.categorie_principale,
    adresse: o.adresse_complete,
    lat, lng,
    description: voixJeudi(o.description_courte),
    meteo: meteoMap[o.budget_meteo] || 'nuageux',
    envies,
    compagnies: COMPS.filter(([k]) => o[k] === '1').map(([, v]) => v),
    rooftop: o.pour_rooftop === '1',
    surLeau: o.pour_eau === '1',
    source: o.source_url || undefined,
  })
}

const cats = {}
out.forEach((s) => { cats[s.categorie] = (cats[s.categorie] || 0) + 1 })

const ts = `// GÉNÉRÉ par __sources/gen_spots.mjs — ne pas éditer à la main.
// ${out.length} spots curated (fiabilité « bonne »). Catégories : ${JSON.stringify(cats)}
export interface SpotCurated {
  nom: string
  categorie: string
  adresse: string
  lat: number
  lng: number
  description: string
  meteo: 'soleil' | 'nuageux' | 'pluie'
  envies: string[]
  compagnies: string[]
  rooftop: boolean
  surLeau: boolean
  source?: string
}
export const CURATED: SpotCurated[] = ${JSON.stringify(out, null, 2)}
`
writeFileSync(new URL('../app/src/spots_curated.ts', import.meta.url), ts)
console.log(`\n→ ${out.length} spots écrits dans app/src/spots_curated.ts`)
console.log('catégories:', cats)
