// Fusionne "Restaurants Paris.csv" (tes notes) + "Restaurants Paris_02.csv"
// (prix + cuisine) par nom, géocode via Nominatim, et NE GARDE QUE l'Île-de-France.
// Sortie : ersan_merged.json  [{ nom, note, prix, cuisine, lat, lng, adresse }]
import { readFileSync, writeFileSync } from 'node:fs'

const F_NOTES = new URL('./Restaurants Paris.csv', import.meta.url)
const F_RICHE = new URL('./Restaurants Paris_02.csv', import.meta.url)
const OUT = new URL('./ersan_merged.json', import.meta.url)

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
// clé de rapprochement : minuscules, sans accents, alphanum, 12 premiers car.
const cle = (s) =>
  (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '')
    .slice(0, 12)

// notes : nom (col0) -> note (col1)
const notes = new Map()
for (const r of parseCSV(readFileSync(F_NOTES, 'utf8')).slice(1)) {
  const nom = (r[0] || '').trim()
  if (nom) notes.set(cle(nom), (r[1] || '').trim())
}

// fichier riche : nom (col1), prix (col4), cuisine (col5)
const spots = parseCSV(readFileSync(F_RICHE, 'utf8'))
  .slice(1)
  .map((r) => ({
    nom: (r[1] || '').trim(),
    prix: (r[4] || '').trim(),
    cuisine: (r[5] || '').trim(),
    note: notes.get(cle(r[1] || '')) || '',
  }))
  .filter((s) => s.nom && !/n'existe plus/i.test(s.cuisine))

console.log(`${spots.length} lieux fusionnés, géocodage IDF…`)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// boîte Île-de-France (lon min, lat max, lon max, lat min) + bounded=1
const VIEWBOX = '1.44,49.24,3.56,48.12'
// garde-fou bbox IDF pour filtrer (au cas où)
const dansIDF = (lat, lng) => lat > 48.1 && lat < 49.25 && lng > 1.44 && lng < 3.56

const out = []
let ok = 0, horsIDF = 0
for (let i = 0; i < spots.length; i++) {
  const s = spots[i]
  const q = encodeURIComponent(`${s.nom}, Paris`)
  const u = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=fr&viewbox=${VIEWBOX}&bounded=1&email=contact@ersanmusa.com`
  try {
    const res = await fetch(u, { headers: { 'User-Agent': 'jeudi-app/1.0 (contact@ersanmusa.com)' } })
    const data = await res.json()
    if (data[0]) {
      const lat = parseFloat(data[0].lat), lng = parseFloat(data[0].lon)
      if (dansIDF(lat, lng)) {
        out.push({
          nom: s.nom, note: s.note, prix: s.prix, cuisine: s.cuisine,
          lat, lng, adresse: data[0].display_name.split(',').slice(0, 3).join(','),
        })
        ok++
      } else {
        horsIDF++
        console.log(`  (hors IDF, jeté) ${s.nom}`)
      }
    }
  } catch (e) {
    console.log(`  ! ${s.nom}: ${e.message}`)
  }
  if ((i + 1) % 20 === 0 || i === spots.length - 1) console.log(`${i + 1}/${spots.length} — ${ok} gardés`)
  await sleep(1100)
}

writeFileSync(OUT, JSON.stringify(out, null, 1))
console.log(`\nFini : ${ok} gardés (IDF), ${horsIDF} hors IDF jetés, sur ${spots.length}. → ersan_merged.json`)
