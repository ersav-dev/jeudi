// ════════════════════════════════════════════════════════════════
// jeudi. — LE TIRAGE DU SOIR
// Le geste qui remplit le carnet de VRAIES preuves : au lendemain d'une
// sortie, on ouvre la pellicule du téléphone et on repêche les photos de
// la nuit. Tout le reste (la carte qui vit, les stories, la carte de
// membre) est vide sans lui.
//
// Aucune API web ne sait FILTRER la galerie par date — le système, lui,
// l'ouvre déjà sur les photos les plus récentes. Le tri, c'est donc jeudi
// qui le fait APRÈS : on lit la date de prise de vue dans l'EXIF, on la
// compare à la fenêtre de la soirée, et on le DIT quand une photo n'en
// est pas. Jamais de rejet muet.
//
// Effet de bord voulu du passage par un canvas : l'EXIF est effacé.
// Le GPS inscrit dans les photos ne part JAMAIS au cloud.
// ════════════════════════════════════════════════════════════════

// ── la fenêtre d'une soirée : 17h → 6h du matin ─────────────────
export const HEURE_OUVRE = 17
export const HEURE_FERME = 6

export interface FenetreSoiree {
  debut: Date
  fin: Date
}

/** la nuit à laquelle appartient une sortie. Une sortie enregistrée APRÈS
 *  minuit (« 2h du matin ») appartient à la soirée de la VEILLE — sinon la
 *  fenêtre s'ouvrirait quinze heures trop tard et toutes les photos de la
 *  nuit passeraient pour des intruses. */
export function fenetreSoiree(dateSortie: Date | string): FenetreSoiree {
  const d = new Date(dateSortie)
  const debut = new Date(d)
  if (d.getHours() < HEURE_FERME) debut.setDate(debut.getDate() - 1)
  debut.setHours(HEURE_OUVRE, 0, 0, 0)
  const fin = new Date(debut)
  fin.setDate(fin.getDate() + 1)
  fin.setHours(HEURE_FERME, 0, 0, 0)
  return { debut, fin }
}

export function estDeLaSoiree(prise: Date, f: FenetreSoiree): boolean {
  const t = prise.getTime()
  return t >= f.debut.getTime() && t <= f.fin.getTime()
}

/** l'heure au crayon sous un tirage : « 21h24 » (jamais de secondes) */
export function heureTirage(d: Date): string {
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`
}

// ── EXIF : on ne lit QU'UNE chose, la date de prise de vue ──────
// JPEG → segment APP1 « Exif\0\0 » → en-tête TIFF → IFD0 → pointeur
// Exif (0x8769) → DateTimeOriginal (0x9003), au format « YYYY:MM:DD hh:mm:ss ».
// Repli sur DateTime (0x0132) d'IFD0 quand l'original manque (photo retouchée).
const TAG_EXIF_IFD = 0x8769
const TAG_DATE_ORIGINALE = 0x9003
const TAG_DATE = 0x0132
/** 128 Ko : l'EXIF vit toujours en tête de fichier, on ne lit jamais plus */
const TETE_OCTETS = 131072

interface EntreeIFD {
  valeur: number
}

/** parse une date EXIF « 2026:08:01 21:24:07 » en Date LOCALE (l'EXIF n'a pas
 *  de fuseau : l'heure inscrite est celle du téléphone au moment du clic —
 *  c'est exactement celle qu'on veut écrire sous le tirage). */
function dateExif(s: string): Date | null {
  const m = s.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
  if (!m) return null
  // « 0000:00:00 00:00:00 » : la date vide que posent les appareils sans
  // horloge réglée — elle vaut moins que `lastModified`, on la refuse.
  if (+m[1] < 1900) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
  return Number.isNaN(d.getTime()) ? null : d
}

/** la date de prise de vue inscrite dans le fichier — null si illisible.
 *  Ne jette jamais : un fichier tordu retombe sur `lastModified`. */
export async function lireDatePrise(f: Blob): Promise<Date | null> {
  try {
    const buf = await f.slice(0, TETE_OCTETS).arrayBuffer()
    const v = new DataView(buf)
    if (v.byteLength < 16 || v.getUint16(0) !== 0xffd8) return null // pas un JPEG
    let p = 2
    while (p + 4 <= v.byteLength) {
      const marqueur = v.getUint16(p)
      if ((marqueur & 0xff00) !== 0xff00) return null // flux désynchronisé
      if (marqueur === 0xffda || marqueur === 0xffd9) return null // début image : fini
      const taille = v.getUint16(p + 2)
      if (taille < 2) return null
      if (marqueur === 0xffe1 && p + 10 <= v.byteLength && v.getUint32(p + 4) === 0x45786966) {
        return lireTiff(v, buf, p + 10)
      }
      p += 2 + taille
    }
  } catch {
    /* fichier illisible / tronqué : l'appelant a son repli */
  }
  return null
}

function lireTiff(v: DataView, buf: ArrayBuffer, tiff: number): Date | null {
  if (tiff + 8 > v.byteLength) return null
  const ordre = v.getUint16(tiff)
  if (ordre !== 0x4949 && ordre !== 0x4d4d) return null
  const li = ordre === 0x4949 // intel = little endian
  const u16 = (o: number) => (o + 2 <= v.byteLength ? v.getUint16(o, li) : 0)
  const u32 = (o: number) => (o + 4 <= v.byteLength ? v.getUint32(o, li) : 0)
  if (u16(tiff + 2) !== 42) return null

  const chercher = (base: number, tag: number): EntreeIFD | null => {
    if (base + 2 > v.byteLength) return null
    const n = u16(base)
    // un IFD sain tient dans le fichier : au-delà, on abandonne
    if (n > 512 || base + 2 + n * 12 > v.byteLength) return null
    for (let i = 0; i < n; i++) {
      const e = base + 2 + i * 12
      if (u16(e) === tag) return { valeur: u32(e + 8) }
    }
    return null
  }
  const texte = (offset: number): string | null => {
    const debut = tiff + offset
    if (debut < 0 || debut + 19 > v.byteLength) return null
    return new TextDecoder().decode(new Uint8Array(buf, debut, 19))
  }

  const ifd0 = tiff + u32(tiff + 4)
  const ptr = chercher(ifd0, TAG_EXIF_IFD)
  if (ptr) {
    const dto = chercher(tiff + ptr.valeur, TAG_DATE_ORIGINALE)
    const s = dto ? texte(dto.valeur) : null
    const d = s ? dateExif(s) : null
    if (d) return d
  }
  const brut = chercher(ifd0, TAG_DATE)
  const s = brut ? texte(brut.valeur) : null
  return s ? dateExif(s) : null
}

// ── le développement : on réduit AVANT d'envoyer ────────────────
// Une photo de galerie pèse 3 à 8 Mo ; le pipeline téléverse le blob brut.
// Sans cette étape, quatre tirages = 25 Mo par soirée, et la carte du cercle
// serait injouable en 4G.
export const COTE_MAX = 1600
export const QUALITE = 0.82

export interface Tirage {
  blob: Blob
  priseLe: Date
  /** la date vient-elle de l'EXIF (sûre) ou de `lastModified` (approximative) ? */
  dateSure: boolean
  poidsAvant: number
  poidsApres: number
}

/** lit la date, redresse l'orientation, réduit à 1600 px, réencode en JPEG.
 *  Jette si l'image est illisible — l'appelant écarte le fichier en le disant. */
export async function preparerTirage(f: File): Promise<Tirage> {
  const exif = await lireDatePrise(f)
  const priseLe = exif ?? new Date(f.lastModified)
  const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' })
  const r = Math.min(1, COTE_MAX / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(bmp.width * r))
  c.height = Math.max(1, Math.round(bmp.height * r))
  const ctx = c.getContext('2d')
  if (!ctx) {
    bmp.close()
    throw new Error('canvas indisponible')
  }
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', QUALITE))
  if (!blob) throw new Error('développement impossible')
  return { blob, priseLe, dateSure: exif != null, poidsAvant: f.size, poidsApres: blob.size }
}

// ── la place dans le carnet : deux budgets qui ne se mangent pas ─
// Les PREUVES (porte/salle/terrasse/verre/wc) documentent le lieu et doivent
// survivre à toutes les soirées ; les TIRAGES du soir s'empilent et les plus
// vieux tombent. Un seul plafond commun aurait fini par chasser les preuves.
export const CAP_PREUVES = 12
export const CAP_TIRAGES = 8

/** fusionne anciennes + nouvelles photos en gardant les preuves devant
 *  (la première photo reste la couverture de la fiche, comme aujourd'hui). */
export function fusionnerPhotos<T extends { type: string }>(anciennes: T[], nouvelles: T[]): T[] {
  const toutes = [...anciennes, ...nouvelles]
  const preuves = toutes.filter((p) => p.type !== 'soir').slice(-CAP_PREUVES)
  const tirages = toutes.filter((p) => p.type === 'soir').slice(-CAP_TIRAGES)
  return [...preuves, ...tirages]
}
