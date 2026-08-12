// ════════════════════════════════════════════════════════════════
// jeudi. — COMPLÉTER transport.json (audit du 12/08)
//
// L'audit a trouvé des stations que les lignes réclament et que la
// carte ne connaît pas — dont AUBER et LUXEMBOURG en plein centre,
// Vincennes, la branche Orly de la 14… L'extraction du 07/08 les a
// ratées (tags OSM différents : gares RER souterraines, arrêts de
// tram en petite couronne).
//
// Ce script NE FABRIQUE AUCUNE COORDONNÉE (loi du dépôt) : il
// interroge Overpass (OSM), et n'accepte un candidat que s'il est à
// moins de 600 m du TRACÉ RÉEL d'une ligne qui le réclame — jamais
// un homonyme du mauvais bout de la ville.
//
// Périmètre : Paris + petite couronne (bbox 48.70–49.05 / 2.15–2.65),
// comme le reste de transport.json. La grande couronne reste hors
// carte — su, pas subi (les branches de RER vont jusqu'à Dourdan).
//
// Usage :  node _enrichissement/completer_transport.mjs           (dry-run)
//          node _enrichissement/completer_transport.mjs --ecrire  (écrit)
// Depuis la racine du projet OU app/ — les chemins se débrouillent.
// ════════════════════════════════════════════════════════════════
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ICI = dirname(fileURLToPath(import.meta.url))
const PUB = join(ICI, '..', 'app', 'public')
const ECRIRE = process.argv.includes('--ecrire')

// la même clé souple que lignes.ts (recopiée — ce script est du Node pur)
const clef = (nom) =>
  nom
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s*[-–—]\s*voies?\s+\w+\s*$/i, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

// le nom de base (sans le suffixe de quai) — c'est lui qu'on cherche sur OSM
const nomDeBase = (nom) => nom.replace(/\s*[-–—]\s*voies?\s+\w+\s*$/i, '').trim()

const BBOX = { s: 48.7, o: 2.15, n: 49.05, e: 2.65 }
const dansBbox = (lat, lng) => lat >= BBOX.s && lat <= BBOX.n && lng >= BBOX.o && lng <= BBOX.e

// mètres approchés (petites distances, Paris) — assez juste pour un seuil
const metres = (a, b) => {
  const dy = (a.lat - b.lat) * 111_320
  const dx = (a.lng - b.lng) * 111_320 * Math.cos((a.lat * Math.PI) / 180)
  return Math.hypot(dx, dy)
}

// ── 1. ce qui manque, d'après les lignes ─────────────────────────
const tr = JSON.parse(readFileSync(join(PUB, 'transport.json'), 'utf8'))
const lignes = JSON.parse(readFileSync(join(PUB, 'lignes.json'), 'utf8')).lignes

const connues = new Set()
for (const f of tr.features) connues.add(clef(f.properties.nom))
const situe = (nom) => {
  const k = clef(nom)
  if (connues.has(k)) return true
  if (k.startsWith('paris')) return connues.has(k.slice(5))
  return false
}

/** clef(base) → { nom, modes:Set, ids:Set, brins:[[lng,lat]…] } */
const manquantes = new Map()
for (const l of lignes) {
  for (const nom of l.stations ?? []) {
    if (situe(nom)) continue
    const base = nomDeBase(nom)
    const k = clef(base)
    if (!k) continue
    const e = manquantes.get(k) ?? { nom: base, modes: new Set(), ids: new Set(), brins: [] }
    e.modes.add(l.mode)
    e.ids.add(l.id)
    for (const brin of l.brins ?? []) e.brins.push(...brin)
    manquantes.set(k, e)
  }
}
console.log(`stations réclamées introuvables : ${manquantes.size} (toutes couronnes)`)

// ── 2. Overpass : toutes les stations/arrêts de la bbox, en un coup ──
const MIROIRS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
const REQUETE = `[out:json][timeout:120];
(
  nwr["railway"~"^(station|halt|tram_stop)$"](${BBOX.s},${BBOX.o},${BBOX.n},${BBOX.e});
  nwr["station"="subway"](${BBOX.s},${BBOX.o},${BBOX.n},${BBOX.e});
);
out center tags;`

async function chercherOSM() {
  // 2 tours × 3 miroirs, avec l'attente qui calme les 429 — et les en-têtes
  // sans lesquels overpass-api.de répond 406 (form-urlencoded + User-Agent)
  for (let tour = 0; tour < 2; tour++) {
    for (const url of MIROIRS) {
      try {
        console.log(`Overpass… ${new URL(url).host}${tour ? ' (2e tour)' : ''}`)
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'jeudi-app-enrichissement/1.0 (contact@jeudi.app)',
          },
          body: 'data=' + encodeURIComponent(REQUETE),
        })
        if (!r.ok) {
          console.warn(`  ${r.status} — miroir suivant`)
          continue
        }
        return (await r.json()).elements ?? []
      } catch (e) {
        console.warn(`  KO (${e.message}) — miroir suivant`)
      }
    }
    if (tour === 0) {
      console.log('  tous occupés — on attend 45 s et on refait un tour')
      await new Promise((res) => setTimeout(res, 45_000))
    }
  }
  throw new Error('aucun miroir Overpass n’a répondu (réessaie dans quelques minutes)')
}

const elements = await chercherOSM()
console.log(`OSM : ${elements.length} stations/arrêts dans la bbox`)

// candidats par clé de nom
const parClef = new Map()
for (const el of elements) {
  const nom = el.tags?.name
  if (!nom) continue
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (lat == null || lng == null || !dansBbox(lat, lng)) continue
  const k = clef(nom)
  if (!k) continue
  const liste = parClef.get(k) ?? []
  liste.push({ nom, lat, lng, tags: el.tags })
  parClef.set(k, liste)
}

// le bon TYPE de candidat pour un mode donné
const modeAccepte = (tags, modes) => {
  const rw = tags.railway
  if (modes.has('tram') && rw === 'tram_stop') return true
  if ((modes.has('metro') || modes.has('rer')) && (rw === 'station' || rw === 'halt')) return true
  if (modes.has('metro') && tags.station === 'subway') return true
  return false
}

// ── 3. l'élection : le candidat DOIT toucher le tracé de sa ligne ──
const ajouts = []
const restantes = []
for (const [k, m] of manquantes) {
  const candidats = (parClef.get(k) ?? []).filter((c) => modeAccepte(c.tags, m.modes))
  let elu = null
  let mini = Infinity
  for (const c of candidats) {
    // distance au tracé (échantillonné : 1 point sur 3 suffit à 600 m près)
    for (let i = 0; i < m.brins.length; i += 3) {
      const [lng, lat] = m.brins[i]
      const d = metres(c, { lat, lng })
      if (d < mini) {
        mini = d
        elu = c
      }
      if (d < 60) break // collé au tracé : inutile de chercher mieux
    }
  }
  if (elu && mini <= 600) {
    // le type d'affichage : métro d'abord (le M est la référence de la
    // ville), puis RER, puis tram — même logique que la dédup du 07/08
    const type = m.modes.has('metro') ? 'metro' : m.modes.has('rer') ? 'rer' : 'tram'
    ajouts.push({
      type: 'Feature',
      properties: { type, nom: elu.nom, lignes: [...m.ids].sort() },
      geometry: { type: 'Point', coordinates: [elu.lng, elu.lat] },
    })
  } else {
    restantes.push(`${m.nom} [${[...m.modes].join(',')}]${elu ? ` (plus proche à ${Math.round(mini)} m — rejeté)` : ''}`)
  }
}

ajouts.sort((a, b) => a.properties.nom.localeCompare(b.properties.nom))
console.log(`\nà AJOUTER (${ajouts.length}) :`)
for (const f of ajouts)
  console.log(`  + ${f.properties.type.padEnd(5)} ${f.properties.nom} (${f.properties.lignes.length} variante(s))`)
console.log(`\nrestent introuvables dans la bbox (${restantes.length}) — grande couronne ou tag absent :`)
for (const r of restantes.slice(0, 40)) console.log(`  · ${r}`)
if (restantes.length > 40) console.log(`  … +${restantes.length - 40}`)

// ── 4. écrire (ou pas) ───────────────────────────────────────────
if (ECRIRE && ajouts.length) {
  tr.features.push(...ajouts)
  // compact, UTF-8 sans BOM, comme l'existant — et JAMAIS via PowerShell
  writeFileSync(join(PUB, 'transport.json'), JSON.stringify(tr))
  const rapport = [
    `# complétion transport.json — ${new Date().toISOString().slice(0, 10)}`,
    `ajoutées : ${ajouts.length}`,
    ...ajouts.map((f) => `+ ${f.properties.type} ${f.properties.nom}`),
    `restantes hors bbox/tag (${restantes.length}) :`,
    ...restantes.map((r) => `· ${r}`),
  ].join('\n')
  writeFileSync(join(ICI, `completion_transport_${new Date().toISOString().slice(0, 10)}.md`), rapport)
  console.log(`\nÉCRIT : transport.json (+${ajouts.length}) + rapport dans _enrichissement/`)
} else if (!ECRIRE) {
  console.log('\n(dry-run — relance avec --ecrire pour écrire)')
}
