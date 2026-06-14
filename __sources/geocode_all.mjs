// Géocode "Mager-a-Paris.csv" via Nominatim (1 req/s, biais Paris).
// Colonnes Google : photo, nom, note⭐(ignorée), avis(ignoré), prix, cuisine.
// Sortie : ersan_all_geocoded.json  [{ nom, prix, cuisine, lat, lng, adresse, trouve }]
import { readFileSync, writeFileSync } from 'node:fs'

const SRC = new URL('./Mager-a-Paris.csv', import.meta.url)
const OUT = new URL('./ersan_all_geocoded.json', import.meta.url)

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
      else if (c === '\r') { /* skip */ }
      else cur += c
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row) }
  return rows
}

const rows = parseCSV(readFileSync(SRC, 'utf8')).slice(1)
const spots = rows
  .map((r) => ({
    nom: (r[1] || '').trim(),
    prix: (r[4] || '').trim(),
    cuisine: (r[5] || '').trim(),
  }))
  // on saute les lignes vides et les lieux morts
  .filter((s) => s.nom && !/n'existe plus/i.test(s.cuisine) && !/n'existe plus/i.test(s.prix))

console.log(`${spots.length} lieux à géocoder…`)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
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
    console.log(`  ! ${s.nom}: ${e.message}`)
  }
  out.push({ ...s, lat, lng, adresse, trouve })
  if ((i + 1) % 25 === 0 || i === spots.length - 1) {
    console.log(`${i + 1}/${spots.length} — ${ok} trouvés`)
  }
  await sleep(1100)
}

writeFileSync(OUT, JSON.stringify(out, null, 1))
console.log(`\nFini : ${ok}/${spots.length} géocodés → ersan_all_geocoded.json`)
