// génère app/src/rooftops.ts depuis rooftops_paris_app_v01.csv
// mapping déjà fait par GPT dans les colonnes ; on géocode les coords manquantes (Nominatim).
import { readFileSync, writeFileSync } from 'node:fs'

const csv = readFileSync(new URL('./rooftops_paris_app_v01.csv', import.meta.url), 'utf8')

// --- petit parseur CSV (gère les guillemets + virgules internes) ---
function parseCSV(txt) {
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
      else if (c === ',') { row.push(cur); cur = '' }
      else if (c === '\r') {}
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
      else cur += c
    }
  }
  if (cur || row.length) { row.push(cur); rows.push(row) }
  return rows
}

const rows = parseCSV(csv.trim())
const head = rows[0]
const objs = rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])))

const meteoMap = { 'grand soleil': 'soleil', nuageux: 'nuageux', pluie: 'pluie' }
const ENVIES = [
  ['pour_tranquillo', 'tranquilo'], ['pour_allocco', 'alloco'], ['pour_resto', 'resto'],
  ['pour_gastro', 'gastro'], ['pour_incognito', 'incognito'], ['pour_apero', 'apéro'],
]
const COMPS = [['avec_solo', 'solo'], ['avec_duo', 'duo'], ['avec_potos', 'potos'], ['avec_pro', 'pro']]

// on garde : inclure_app=1 ET fiabilite=bonne (on écarte les 'a verifier'/pop-up)
const gardes = objs.filter((o) => o.inclure_app === '1' && o.fiabilite === 'bonne')

async function geocode(adresse) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(adresse)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'jeudi-app/1.0 (rooftops)' } })
  const j = await res.json()
  if (j[0]) return { lat: +j[0].lat, lng: +j[0].lon }
  return null
}

const out = []
for (const o of gardes) {
  let lat = parseFloat(o.lat), lng = parseFloat(o.lng)
  if (!lat || !lng) {
    process.stdout.write(`géocode ${o.nom}… `)
    const g = await geocode(o.adresse_complete)
    if (g) { lat = g.lat; lng = g.lng; console.log('ok') }
    else { console.log('ÉCHEC — ignoré'); continue }
    await new Promise((r) => setTimeout(r, 1100)) // 1 req/s Nominatim
  }
  out.push({
    nom: o.nom,
    adresse: o.adresse_complete,
    lat, lng,
    description: o.description_courte,
    meteo: meteoMap[o.budget_meteo] || 'nuageux',
    envies: ENVIES.filter(([k]) => o[k] === '1').map(([, v]) => v),
    compagnies: COMPS.filter(([k]) => o[k] === '1').map(([, v]) => v),
    source: o.source_url || undefined,
  })
}

const ts = `// GÉNÉRÉ par __sources/gen_rooftops.mjs — ne pas éditer à la main.
// ${out.length} rooftops parisiens (fiabilité « bonne », vérifiés ${objs[0].date_verification}).
export interface RooftopSeed {
  nom: string
  adresse: string
  lat: number
  lng: number
  description: string
  meteo: 'soleil' | 'nuageux' | 'pluie'
  envies: string[]
  compagnies: string[]
  source?: string
}
export const ROOFTOPS: RooftopSeed[] = ${JSON.stringify(out, null, 2)}
`
writeFileSync(new URL('../app/src/rooftops.ts', import.meta.url), ts)
console.log(`\n→ ${out.length} rooftops écrits dans app/src/rooftops.ts`)
