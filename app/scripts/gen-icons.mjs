// génère les icônes PWA + l'image OG depuis public/icon.svg (la source de marque).
// usage : node scripts/gen-icons.mjs   (depuis app/)
//
// texte rendu avec les vraies polices (Instrument Serif / Caveat) : le script
// télécharge les TTF dans scripts/.fonts-cache/ au premier lancement, puis
// pointe fontconfig dessus AVANT de charger sharp (sinon libvips ne les voit pas).

import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url))) // app/
const PUB = path.join(ROOT, 'public')
const CACHE = path.join(ROOT, 'scripts', '.fonts-cache')
const CHARBON = '#15130F'

// TTF nécessaires au rendu du texte (mêmes familles que l'app)
const TTFS = {
  'instrument-serif-italic.ttf':
    'https://fonts.gstatic.com/s/instrumentserif/v5/jizHRFtNs2ka5fXjeivQ4LroWlx-6zAjjH7J.ttf',
  'instrument-serif-regular.ttf':
    'https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-6zUTiw.ttf',
  'caveat-600.ttf':
    'https://fonts.gstatic.com/s/caveat/v23/WnznHAc5bAfYB2QRah7pcpNvOx-pjSx6eIWpZA.ttf',
}

mkdirSync(CACHE, { recursive: true })
for (const [nom, url] of Object.entries(TTFS)) {
  const dest = path.join(CACHE, nom)
  if (existsSync(dest)) continue
  const r = await fetch(url)
  if (!r.ok) throw new Error(`téléchargement police ${nom} : HTTP ${r.status}`)
  writeFileSync(dest, Buffer.from(await r.arrayBuffer()))
  console.log('police téléchargée :', nom)
}

// fontconfig : nos TTF + les polices système (Georgia pour icon.svg)
const slash = (p) => p.replaceAll('\\', '/')
const fontsConf = path.join(CACHE, 'fonts.conf')
writeFileSync(
  fontsConf,
  `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
<dir>${slash(CACHE)}</dir>
<dir>C:/Windows/Fonts</dir>
<dir>/usr/share/fonts</dir>
<cachedir>${slash(path.join(CACHE, 'fc'))}</cachedir>
</fontconfig>
`,
)
// libvips lit FONTCONFIG_FILE au chargement du process : on se relance
// une fois avec la bonne variable d'env (la poser dans le process courant
// arrive trop tard — les polices custom seraient ignorées).
if (process.env.FONTCONFIG_FILE !== fontsConf) {
  const { spawnSync } = await import('node:child_process')
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
    stdio: 'inherit',
    env: { ...process.env, FONTCONFIG_FILE: fontsConf },
  })
  process.exit(r.status ?? 1)
}

const { default: sharp } = await import('sharp')

const SRC = path.join(PUB, 'icon.svg')
const out = (n) => path.join(PUB, n)

// icônes standard (fond charbon + coins arrondis inclus dans le SVG)
await sharp(SRC, { density: 300 }).resize(192, 192).png().toFile(out('icon-192.png'))
await sharp(SRC, { density: 300 }).resize(512, 512).png().toFile(out('icon-512.png'))

// maskable : logo à ~60% centré sur un carré charbon plein (safe zone)
const inner = await sharp(SRC, { density: 300 }).resize(308, 308).png().toBuffer()
await sharp({ create: { width: 512, height: 512, channels: 4, background: CHARBON } })
  .composite([{ input: inner, gravity: 'centre' }])
  .png()
  .toFile(out('icon-512-maskable.png'))

// apple-touch-icon : 180×180, fond charbon PLEIN (pas de transparence — iOS mettrait du noir)
await sharp(SRC, { density: 300 })
  .resize(180, 180)
  .flatten({ background: CHARBON })
  .png()
  .toFile(out('apple-touch-icon.png'))

// og.png 1200×630 : le tampon du carnet + la question du soir
const ogSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${CHARBON}"/>
  <g transform="rotate(-3 600 265)">
    <rect x="370" y="150" width="460" height="190" rx="20" fill="none" stroke="#A8322A" stroke-width="10"/>
    <text x="600" y="292" text-anchor="middle" font-family="Instrument Serif" font-style="italic" font-size="130" fill="#A8322A">jeudi.</text>
  </g>
  <text x="600" y="480" text-anchor="middle" font-family="Caveat" font-weight="600" font-size="72" fill="#F0EAD9">ça dit quoi ce soir ?</text>
</svg>`)
await sharp(ogSvg).png().toFile(out('og.png'))

console.log('OK → icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png, og.png')
