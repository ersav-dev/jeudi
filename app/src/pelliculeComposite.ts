// ════════════════════════════════════════════════════════════════
// jeudi. — L'APLATISSEMENT DU TAS (CHANTIER_PELLICULE.md §5.3)
// Le panel : « ne PAS charger 4 <img> par tas × 300 spots ». Ici on
// peint l'éventail entier — feuilles + photo du dessus + leurs cadres —
// dans UN canvas offscreen, à 2× la taille affichée (168 px max), et on
// rend une seule image au tas. La géométrie vient du moteur pur
// (couchesComposite), le pinceau est ici.
//
// BEST-EFFORT, toujours : un tirage distant sans en-tête CORS souille le
// canvas et `toDataURL` lève. Dans ce cas on rend `null` et la carte garde
// ses <img> d'origine — jamais un tas vide.
// ════════════════════════════════════════════════════════════════
import {
  couchesComposite,
  tailleMiniature,
  MARGE_COMPOSITE,
  type CoucheTas,
} from './pellicule'

// le cadre du polaroid, en fraction de la taille du tas — les valeurs du
// CSS (.tas .f : border 3px, pied 12px) rapportées à la taille de base 80
const BORDURE = 3 / 80
const PIED = 12 / 80
const PAPIER = '#f7f3e8'

// une composition par (taille, sources) : un tas qui renaît (pan, sceau
// brisé, fonte d'une feuille) ne repeint rien
const cache = new Map<string, Promise<string | null>>()

function charger(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resoudre) => {
    const img = new Image()
    // sans ça, un tirage servi par le cloud souille le canvas à la peinture
    img.crossOrigin = 'anonymous'
    img.onload = () => resoudre(img)
    img.onerror = () => resoudre(null)
    img.src = src
  })
}

/** object-fit: cover, en coordonnées source */
function cadrer(img: HTMLImageElement, l: number, h: number) {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih) return { sx: 0, sy: 0, sl: iw, sh: ih }
  const k = Math.max(l / iw, h / ih)
  const sl = l / k
  const sh = h / k
  return { sx: (iw - sl) / 2, sy: (ih - sh) / 2, sl, sh }
}

/** peint une couche : le cadre ivoire, puis la photo dans sa fenêtre */
function peindreCouche(
  g: CanvasRenderingContext2D,
  img: HTMLImageElement,
  couche: CoucheTas,
  cote: number,
) {
  const b = Math.max(1, cote * BORDURE)
  const pied = Math.max(2, cote * PIED)
  g.save()
  g.rotate((couche.rot * Math.PI) / 180)
  g.translate(couche.tx * cote, couche.ty * cote)
  g.shadowColor = 'rgba(0,0,0,.5)'
  g.shadowBlur = Math.max(1, cote * 0.025)
  g.shadowOffsetY = Math.max(1, cote * 0.012)
  g.fillStyle = PAPIER
  g.fillRect(-cote / 2, -cote / 2, cote, cote)
  g.shadowColor = 'transparent'
  const l = cote - 2 * b
  const h = cote - b - pied
  const c = cadrer(img, l, h)
  g.drawImage(img, c.sx, c.sy, c.sl, c.sh, -cote / 2 + b, -cote / 2 + b, l, h)
  g.restore()
}

async function peindre(couches: CoucheTas[], taille: number): Promise<string | null> {
  const images = await Promise.all(couches.map((c) => charger(c.src)))
  // une seule image manquante et l'éventail serait faux : on renonce, la
  // carte garde ses <img> (qui, eux, savent gérer l'erreur photo par photo)
  if (images.some((i) => !i)) return null
  const cote = tailleMiniature(taille)
  const marge = Math.round(cote * MARGE_COMPOSITE)
  const toile = document.createElement('canvas')
  toile.width = cote + marge * 2
  toile.height = cote + marge * 2
  const g = toile.getContext('2d')
  if (!g) return null
  g.translate(toile.width / 2, toile.height / 2)
  for (let i = 0; i < couches.length; i++) {
    peindreCouche(g, images[i]!, couches[i], cote)
  }
  try {
    return toile.toDataURL('image/webp', 0.85)
  } catch {
    return null // canvas souillé (CORS) : repli sur les <img> d'origine
  }
}

/** l'éventail d'un tas en UNE image. `null` = impossible ici et
 *  maintenant (photo illisible, canvas souillé) → la carte ne change rien. */
export function composerTas(
  srcs: readonly string[],
  vivantes: number,
  taille: number,
): Promise<string | null> {
  const couches = couchesComposite(srcs, vivantes)
  // une seule photo : aucun éventail à aplatir, l'<img> d'origine suffit
  if (couches.length < 2) return Promise.resolve(null)
  const cle = `${taille}|${couches.map((c) => c.src).join('|')}`
  let p = cache.get(cle)
  if (!p) {
    p = peindre(couches, taille)
    cache.set(cle, p)
  }
  return p
}

/** vide le cache (changement de compte, « effacer mes données ») */
export function oublierComposites(): void {
  cache.clear()
}
