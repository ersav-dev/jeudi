// génère app/src/spots_extra.ts depuis 2 CSV GPT (séparateur « ; ») :
//  - coupe_du_monde_2026_GPT_FR_semicolon.csv  → match:'diffuse' (foot/fan zones)
//  - surleau_GTP_FR_semicolon.csv              → surLeau:true
// géocode les coords manquantes (Nominatim), descriptions en voix jeudi.
import { readFileSync, writeFileSync } from 'node:fs'

function parseCSV(txt, sep) {
  const rows = []; let row = [], cur = '', q = false
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i]
    if (q) { if (c === '"' && txt[i + 1] === '"') { cur += '"'; i++ } else if (c === '"') q = false; else cur += c }
    else {
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
function load(file) {
  const txt = readFileSync(new URL('./' + file, import.meta.url), 'utf8').replace(/^﻿/, '').trim()
  const rows = parseCSV(txt, ';')
  const head = rows[0].map((h) => h.replace(/^﻿/, '').trim())
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])))
}

const meteoMap = { 'grand soleil': 'soleil', nuageux: 'nuageux', pluie: 'pluie' }
const ENVIES = [
  ['pour_tranquillo', 'tranquilo'], ['pour_allocco', 'alloco'], ['pour_resto', 'resto'],
  ['pour_gastro', 'gastro'], ['pour_incognito', 'incognito'], ['pour_apero', 'apéro'],
  ['pour_street_food', 'alloco'],
]
const COMPS = [['avec_solo', 'solo'], ['avec_duo', 'duo'], ['avec_potos', 'potos'], ['avec_pro', 'pro']]
const voixJeudi = (d) => { let s = (d || '').trim().replace(/^(Adresse|Lieu|Restaurant|Bar)\s+/i, ''); return s ? s[0].toLowerCase() + s.slice(1) : s }

async function geocode(adresse) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(adresse)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'jeudi-app/1.0 (extra)' } })
  const j = await res.json()
  return j[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null
}

const out = []
async function traiter(file, kind) {
  const objs = load(file).filter((o) => o.inclure_app === '1')
  for (const o of objs) {
    let lat = parseFloat(o.lat), lng = parseFloat(o.lng)
    if (!lat || !lng) {
      process.stdout.write(`géocode ${o.nom}… `)
      const g = await geocode(o.adresse_complete)
      if (g) { lat = g.lat; lng = g.lng; console.log('ok') } else { console.log('ÉCHEC — ignoré'); continue }
      await new Promise((r) => setTimeout(r, 1100))
    }
    const foot = kind === 'foot' && (o.pour_football === '1' || o.fan_zone === '1' || o.pour_worldcup_2026 === '1')
    out.push({
      nom: o.nom,
      adresse: o.adresse_complete,
      lat, lng,
      description: voixJeudi(o.description_courte),
      meteo: meteoMap[o.budget_meteo] || 'nuageux',
      envies: [...new Set(ENVIES.filter(([k]) => o[k] === '1').map(([, v]) => v))],
      compagnies: COMPS.filter(([k]) => o[k] === '1').map(([, v]) => v),
      surLeau: kind === 'eau' || o.pour_eau === '1' || o.sur_eau === '1',
      match: foot ? 'diffuse' : undefined,
      source: o.source_url || undefined,
    })
  }
}

await traiter('coupe_du_monde_2026_GPT_FR_semicolon.csv', 'foot')
await traiter('surleau_GTP_FR_semicolon.csv', 'eau')

const ts = `// GÉNÉRÉ par __sources/gen_extra.mjs — ne pas éditer à la main.
// ${out.length} spots (Coupe du monde 2026 → match diffuse · sur l'eau → surLeau).
export interface SpotExtra {
  nom: string
  adresse: string
  lat: number
  lng: number
  description: string
  meteo: 'soleil' | 'nuageux' | 'pluie'
  envies: string[]
  compagnies: string[]
  surLeau: boolean
  match?: 'diffuse'
  source?: string
}
export const EXTRA: SpotExtra[] = ${JSON.stringify(out, null, 2)}
`
writeFileSync(new URL('../app/src/spots_extra.ts', import.meta.url), ts)
console.log(`\n→ ${out.length} spots écrits dans app/src/spots_extra.ts`)
