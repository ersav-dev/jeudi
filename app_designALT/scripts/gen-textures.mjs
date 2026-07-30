// génère les textures papier optimisées pour mobile → public/papier/*.webp
// source : ../_maquettes/textures (détourées main par Ersan)
// usage : node scripts/gen-textures.mjs
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(ici, '../../_maquettes/textures');
const OUT = path.resolve(ici, '../public/papier');

// [source, sortie, largeur max, qualité]
// - kraft/ivoire : fonds répétés → assez petits, la compression lisse le grain
// - déchirures : gardent l'alpha (WebP le supporte), 800px suffit à 430px CSS
// - cire : petit sceau (~80-120px affiché) → 320px @2x large
const JOBS = [
  ['kraft.jpg', 'kraft.webp', 800, 62],
  ['ivoire.jpg', 'ivoire.webp', 600, 70],
  ['papier-dechire.png', 'papier-dechire.webp', 800, 70],
  ['papier-dechire-long.png', 'papier-dechire-long.webp', 800, 70],
  ['cire-rouge.png', 'cire-rouge.webp', 320, 72],
];

await mkdir(OUT, { recursive: true });
let total = 0;
for (const [src, out, width, quality] of JOBS) {
  const dest = path.join(OUT, out);
  await sharp(path.join(SRC, src))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, alphaQuality: 80, effort: 6 })
    .toFile(dest);
  const { size } = await stat(dest);
  total += size;
  console.log(`${out.padEnd(26)} ${(size / 1024).toFixed(1)} Ko`);
}
console.log(`total ${(total / 1024).toFixed(1)} Ko`);
