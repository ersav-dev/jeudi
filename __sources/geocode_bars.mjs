// Géocode les bars NOUVEAUX de "Bar Paris_02.csv" (ceux pas déjà dans
// ersan_merged.json), filtre IDF, et les AJOUTE à ersan_merged.json.
import { readFileSync, writeFileSync } from 'node:fs'

const F_BAR = new URL('./Bar Paris_02.csv', import.meta.url)
const MERGED = new URL('./ersan_merged.json', import.meta.url)

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
const cle = (s) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)

const existant = JSON.parse(readFileSync(MERGED, 'utf8'))
const dejaVus = new Set(existant.map((s) => cle(s.nom)))

const bars = parseCSV(readFileSync(F_BAR, 'utf8'))
  .slice(1)
  .map((r) => ({ nom: (r[1] || '').trim(), prix: (r[4] || '').trim(), cuisine: (r[5] || '').trim() }))
  .filter((s) => s.nom && !/n'existe plus/i.test(s.cuisine) && !dejaVus.has(cle(s.nom)))

console.log(`${bars.length} bars nouveaux à géocoder…`)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const VIEWBOX = '1.44,49.24,3.56,48.12'
const dansIDF = (lat, lng) => lat > 48.1 && lat < 49.25 && lng > 1.44 && lng < 3.56
let ok = 0

for (let i = 0; i < bars.length; i++) {
  const s = bars[i]
  const q = encodeURIComponent(`${s.nom}, Paris`)
  const u = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=fr&viewbox=${VIEWBOX}&bounded=1&email=contact@ersanmusa.com`
  try {
    const res = await fetch(u, { headers: { 'User-Agent': 'jeudi-app/1.0 (contact@ersanmusa.com)' } })
    const data = await res.json()
    if (data[0]) {
      const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon)
      if (dansIDF(lat, lng)) {
        existant.push({
          nom: s.nom, note: '', prix: s.prix, cuisine: s.cuisine,
          lat, lng, adresse: data[0].display_name.split(',').slice(0, 3).join(','),
        })
        ok++
      }
    }
  } catch (e) {
    console.log(`  ! ${s.nom}: ${e.message}`)
  }
  console.log(`${i + 1}/${bars.length} ${s.nom}`)
  await sleep(1100)
}

writeFileSync(MERGED, JSON.stringify(existant, null, 1))
console.log(`\nFini : ${ok} bars ajoutés. Total ersan_merged.json = ${existant.length} lieux.`)
