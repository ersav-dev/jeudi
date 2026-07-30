// ════════════════════════════════════════════════════════════════
// ENRICHISSEMENT DES SPOTS — étape 1 : OpenStreetMap (gratuit, réel)
// Télécharge les lieux nommés de Paris via Overpass, matche les spots
// du seed par nom normalisé + distance GPS, et écrit :
//   _enrichissement/osm_resultats.json   (les matchs + données OSM)
//   _enrichissement/rapport.md           (couverture, non-matchés)
//   _enrichissement/gpt_packs/pack_NN.md (prompts prêts à coller dans GPT
//                                         pour les trous restants)
// AUCUNE fusion automatique dans le seed : la fusion se fait après
// validation, en étape 2.
// Lancer depuis app/ :  node ../_enrichissement/enrichir_osm.mjs
// ════════════════════════════════════════════════════════════════
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const ICI = dirname(fileURLToPath(import.meta.url))
const APP = join(ICI, '..', 'app')
const SORTIE = ICI

// esbuild vit dans app/node_modules — le script, lui, vit hors de app/
const { build } = createRequire(join(APP, 'package.json'))('esbuild')

// ── 1. charge les données seed (fichiers TS → bundle CJS en mémoire) ──
async function chargerTS(chemin) {
  const r = await build({
    entryPoints: [chemin],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    logLevel: 'silent',
  })
  const tmp = join(SORTIE, `.tmp_${Math.random().toString(36).slice(2)}.cjs`)
  writeFileSync(tmp, r.outputFiles[0].text)
  const require_ = createRequire(import.meta.url)
  const mod = require_(tmp)
  const { unlinkSync } = await import('node:fs')
  unlinkSync(tmp)
  return mod
}

const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(le|la|les|l|au|aux|du|de|des|chez|cafe|bar|restaurant|brasserie)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const distM = (a, b) => {
  const R = 6371000, rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// ── 2. Overpass : UNIQUEMENT les alentours de nos spots (rayon 200 m) ──
// les requêtes « tout Paris » font tomber les serveurs publics (504) ;
// interroger autour de 306 points connus est 100× plus léger.
const RAYON = 200
const PAR_PAQUET = 50

// plusieurs serveurs publics : si l'un sature (504), on bascule sur le suivant
const SERVEURS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

async function requeteOverpass(q) {
  let derniereErreur = null
  for (let essai = 0; essai < 3; essai++) {
    const url = SERVEURS[essai % SERVEURS.length]
    try {
      const r = await fetch(url, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(q),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Overpass exige une identification (406 sinon) — politique d'usage OSM
          'User-Agent': 'jeudi-app-enrichissement/1.0 (ersan.musa.contact@gmail.com)',
          Accept: 'application/json',
        },
      })
      if (r.ok) return await r.json()
      derniereErreur = new Error(`${url} → ${r.status}`)
    } catch (e) {
      derniereErreur = e
    }
    console.log(`  échec (${derniereErreur.message}) — nouvel essai dans 15 s…`)
    await new Promise((res) => setTimeout(res, 15000))
  }
  throw derniereErreur
}

async function telechargerOSM(spots) {
  const cache = join(SORTIE, 'osm_paris_cache.json')
  if (existsSync(cache)) {
    console.log('cache OSM trouvé — réutilisé (supprime osm_paris_cache.json pour re-télécharger)')
    return JSON.parse(readFileSync(cache, 'utf8'))
  }
  // cache incrémental : chaque paquet réussi est sauvé — un crash ne perd rien
  const cachePartiel = join(SORTIE, 'osm_partiel_cache.json')
  const partiel = existsSync(cachePartiel) ? JSON.parse(readFileSync(cachePartiel, 'utf8')) : { faits: [], tous: [] }
  const tous = partiel.tous
  const valides = spots.filter((s) => s.lat && !(s.lat === 0 && s.lng === 0))
  const nbPaquets = Math.ceil(valides.length / PAR_PAQUET)
  for (let i = 0; i < nbPaquets; i++) {
    if (partiel.faits.includes(i)) { console.log(`overpass ${i + 1}/${nbPaquets} — déjà en cache partiel`); continue }
    const paquet = valides.slice(i * PAR_PAQUET, (i + 1) * PAR_PAQUET)
    const centres = paquet.map((s) => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`).join(',')
    const autour = `(around:${RAYON},${centres})`
    const q = `[out:json][timeout:60];(
      nwr["name"]["amenity"]${autour};
      nwr["name"]["leisure"]${autour};
      nwr["name"]["tourism"]${autour};
      nwr["name"]["shop"]${autour};
    );out center tags;`
    console.log(`overpass ${i + 1}/${nbPaquets}…`)
    const j = await requeteOverpass(q)
    for (const el of j.elements || []) {
      const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon
      if (!lat || !el.tags?.name) continue
      tous.push({
        nom: el.tags.name, lat, lng,
        horaires: el.tags.opening_hours || null,
        amenity: el.tags.amenity || el.tags.leisure || el.tags.tourism || el.tags.shop || null,
        cuisine: el.tags.cuisine || null,
        site: el.tags.website || el.tags['contact:website'] || null,
        tel: el.tags.phone || el.tags['contact:phone'] || null,
        terrasse: el.tags.outdoor_seating === 'yes' ? true : null,
      })
    }
    partiel.faits.push(i)
    writeFileSync(cachePartiel, JSON.stringify(partiel)) // un crash ne perd rien
    await new Promise((res) => setTimeout(res, 3000)) // politesse entre requêtes
  }
  writeFileSync(cache, JSON.stringify(tous))
  const { unlinkSync: efface } = await import('node:fs')
  if (existsSync(cachePartiel)) efface(cachePartiel)
  console.log(`${tous.length} lieux OSM téléchargés (cache écrit)`)
  return tous
}

// ── 3. matching nom+distance ──
function apparier(spots, osm) {
  // index spatial grossier (grille 300 m) pour ne pas faire 750×80000 comparaisons
  const CASE = 0.003
  const grille = new Map()
  for (const o of osm) {
    const k = `${Math.round(o.lat / CASE)}:${Math.round(o.lng / CASE)}`
    if (!grille.has(k)) grille.set(k, [])
    grille.get(k).push(o)
  }
  const voisins = (s) => {
    const cy = Math.round(s.lat / CASE), cx = Math.round(s.lng / CASE)
    const out = []
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
      out.push(...(grille.get(`${cy + dy}:${cx + dx}`) || []))
    return out
  }
  const resultats = [], sansMatch = []
  for (const s of spots) {
    if (!s.lat || (s.lat === 0 && s.lng === 0)) { sansMatch.push(s); continue }
    const ns = norm(s.nom)
    let meilleur = null, scoreMax = 0
    for (const o of voisins(s)) {
      const d = distM(s, o)
      if (d > 200) continue
      const no = norm(o.nom)
      if (!ns || !no) continue
      let score = 0
      if (ns === no) score = 1
      else if (ns.includes(no) || no.includes(ns)) score = 0.8
      else {
        const ms = new Set(ns.split(' ')), mo = no.split(' ')
        const commun = mo.filter((m) => m.length > 2 && ms.has(m)).length
        score = commun >= 2 ? 0.6 : commun === 1 ? 0.35 : 0
      }
      score *= d < 60 ? 1 : d < 120 ? 0.85 : 0.7
      if (score > scoreMax) { scoreMax = score; meilleur = { ...o, distance: Math.round(d) } }
    }
    if (meilleur && scoreMax >= 0.5) resultats.push({ id: s.id, nom: s.nom, score: +scoreMax.toFixed(2), osm: meilleur })
    else sansMatch.push(s)
  }
  return { resultats, sansMatch }
}

// ── 4. packs GPT pour les trous ──
const ENTETE_PACK = (n, total) => `# PACK ${n}/${total} — enrichissement spots jeudi (à coller dans ChatGPT/Gemini)

Tu es un assistant de données STRICT sur des lieux parisiens. Pour CHAQUE lieu ci-dessous,
renvoie un objet JSON. RÈGLES ABSOLUES :
- N'INVENTE RIEN. Si tu n'es pas sûr d'une info pour CE lieu précis : null.
- "tarif" : "€" (<10€ la conso/entrée), "€€" (10-25€), "€€€" (>25€), ou null.
- "horaires" : uniquement si tu CONNAIS ce lieu précis, au format
  {"lun":[18,26],"mar":[18,26],...} (26 = 2h du matin), sinon null. Dans le doute : null.
- "categories" : 1 à 3 parmi : apéro, resto, gastro, tranquilo, alloco, disco, incognito,
  turbo, culture, plein-air.
- "confiance" : 0 à 1 (ta certitude que tu connais VRAIMENT ce lieu, pas le type de lieu).
Réponds UNIQUEMENT le tableau JSON, sans commentaire, même ordre que la liste :

`

function ecrirePacks(sansMatch, aCompleterTarif) {
  const dossier = join(SORTIE, 'gpt_packs')
  mkdirSync(dossier, { recursive: true })
  const tous = [
    ...sansMatch.map((s) => ({ id: s.id, nom: s.nom, adresse: s.adresse || null, quoi: 'tout' })),
    ...aCompleterTarif.map((s) => ({ id: s.id, nom: s.nom, adresse: s.adresse || null, quoi: 'tarif+categories' })),
  ]
  const TAILLE = 60
  const nb = Math.ceil(tous.length / TAILLE)
  for (let i = 0; i < nb; i++) {
    const lot = tous.slice(i * TAILLE, (i + 1) * TAILLE)
    writeFileSync(
      join(dossier, `pack_${String(i + 1).padStart(2, '0')}.md`),
      ENTETE_PACK(i + 1, nb) + JSON.stringify(lot, null, 1),
    )
  }
  return { nb, total: tous.length }
}

// ── exécution ──
// clé stable même sans id (les spots ERSAN n'en ont pas : le seed les génère à l'import)
const slug = (nom) => 'nom:' + norm(nom).replace(/ /g, '-')
const curated = await chargerTS(join(APP, 'src', 'spots_curated.ts'))
const extra = await chargerTS(join(APP, 'src', 'spots_extra.ts'))
const ersan = await chargerTS(join(APP, 'src', 'ersan.ts'))
const sources = [
  ['curated', curated.CURATED ?? []],
  ['extra', extra.EXTRA ?? []],
  ['ersan', ersan.default ?? ersan.ERSAN ?? []],
]
const listes = []
for (const [origine, arr] of sources) {
  console.log(`  ${origine}: ${arr.length} spots`)
  for (const s of arr) listes.push({ ...s, id: s.id ?? slug(s.nom), origine })
}
console.log(`${listes.length} spots chargés depuis le seed`)

const osm = await telechargerOSM(listes)
const { resultats, sansMatch } = apparier(listes, osm)
const avecHoraires = resultats.filter((r) => r.osm.horaires)
writeFileSync(join(SORTIE, 'osm_resultats.json'), JSON.stringify(resultats, null, 1))

const packs = ecrirePacks(sansMatch, resultats.filter((r) => !r.osm.horaires))

const rapport = `# Enrichissement OSM — rapport ${new Date().toISOString().slice(0, 10)}

- spots du seed : **${listes.length}**
- matchés sur OSM : **${resultats.length}** (${Math.round((100 * resultats.length) / listes.length)} %)
  - dont avec HORAIRES réels : **${avecHoraires.length}**
  - avec catégorie/amenity : **${resultats.filter((r) => r.osm.amenity).length}**
  - avec site web : **${resultats.filter((r) => r.osm.site).length}**
- non matchés : **${sansMatch.length}** → packs GPT

## Étape suivante (toi)
1. Ouvre \`gpt_packs/pack_01.md\` … (${packs.nb} packs, ${packs.total} lieux), colle chacun dans ChatGPT/Gemini.
2. Sauve chaque réponse JSON dans \`gpt_reponses/pack_NN.json\` (même numéro).
3. Dis à Claude « fusionne l'enrichissement » — le script de fusion validera tout
   (les horaires OSM priment toujours sur les horaires GPT ; confiance < 0.5 = ignoré).

## Les 20 premiers non-matchés (contrôle visuel)
${sansMatch.slice(0, 20).map((s) => `- ${s.nom}`).join('\n')}
`
writeFileSync(join(SORTIE, 'rapport.md'), rapport)
console.log(rapport)