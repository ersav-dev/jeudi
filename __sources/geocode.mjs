// Géocode "Restaurants Paris.csv" via Nominatim (1 req/s, biais Paris).
// Sortie : ersan_geocoded.json  [{ nom, note, url, lat, lng, adresse, trouve }]
import { readFileSync, writeFileSync } from 'node:fs'

const SRC = new URL('./Restaurants Paris.csv', import.meta.url)
const OUT = new URL('./ersan_geocoded.json', import.meta.url)

// --- mini parseur CSV (gère les champs entre guillemets avec virgules) ---
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
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
      else if (c === '\r') { /* ignore */ }
      else cur += c
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row) }
  return rows
}

const txt = readFileSync(SRC, 'utf8')
const rows = parseCSV(txt).slice(1) // enlève l'entête
const spots = rows
  .map((r) => ({ nom: (r[0] || '').trim(), note: (r[1] || '').trim(), url: (r[2] || '').trim() }))
  .filter((s) => s.nom)

console.log(`${spots.length} lignes à géocoder…`)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// boîte Paris large (intra + petite couronne) : lon/lat
const VIEWBOX = '2.20,48.92,2.47,48.80'
const out = []
let ok = 0

for (let i = 0; i < spots.length; i++) {
  const s = spots[i]
  const q = encodeURIComponent(`${s.nom}, Paris`)
  const u = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=fr&viewbox=${VIEWBOX}&bounded=1&email=contact@ersanmusa.com`
  let lat = 0, lng = 0, adresse = '', trouve = false
  try {
    const res = await fetch(u, { headers: { 'User-Agent': 'jeudi-app/1.0 (contact@ersanmusa.com)' } })
    const data = await res.json()
    if (data[0]) {
      lat = parseFloat(data[0].lat); lng = parseFloat(data[0].lon)
      adresse = data[0].display_name.split(',').slice(0, 3).join(',')
      trouve = true; ok++
    }
  } catch (e) {
    console.log(`  ! erreur ${s.nom}: ${e.message}`)
  }
  out.push({ ...s, lat, lng, adresse, trouve })
  console.log(`${i + 1}/${spots.length} ${trouve ? 'OK ' : '?? '} ${s.nom}`)
  await sleep(1100) // politique Nominatim : 1 req/s
}

writeFileSync(OUT, JSON.stringify(out, null, 2))
console.log(`\nFini : ${ok}/${spots.length} géocodés. → ersan_geocoded.json`)
