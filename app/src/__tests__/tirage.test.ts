// ── tests du tirage du soir : la fenêtre, l'EXIF, les deux budgets ────
// Pur, sans DOM (le développement canvas n'est pas testable ici et vit seul
// dans preparerTirage).
import { describe, it, expect } from 'vitest'
import {
  fenetreSoiree,
  estDeLaSoiree,
  heureTirage,
  lireDatePrise,
  fusionnerPhotos,
  CAP_PREUVES,
  CAP_TIRAGES,
} from '../tirage'

describe('fenetreSoiree — la nuit, pas la journée', () => {
  it('ouvre à 17h le soir de la sortie et ferme à 6h le lendemain', () => {
    const f = fenetreSoiree(new Date(2026, 7, 1, 22, 30))
    expect(f.debut).toEqual(new Date(2026, 7, 1, 17, 0, 0, 0))
    expect(f.fin).toEqual(new Date(2026, 7, 2, 6, 0, 0, 0))
  })

  it('une sortie enregistrée à 2h du matin appartient à la veille', () => {
    const f = fenetreSoiree(new Date(2026, 7, 2, 2, 10))
    expect(f.debut).toEqual(new Date(2026, 7, 1, 17, 0, 0, 0))
    expect(f.fin).toEqual(new Date(2026, 7, 2, 6, 0, 0, 0))
  })

  it('accepte une date ISO (c’est ce que stocke SortieEnAttente)', () => {
    const f = fenetreSoiree(new Date(2026, 7, 1, 21, 0).toISOString())
    expect(f.debut.getDate()).toBe(1)
    expect(f.fin.getDate()).toBe(2)
  })

  it('passe un changement de mois sans broncher', () => {
    const f = fenetreSoiree(new Date(2026, 6, 31, 23, 0))
    expect(f.debut).toEqual(new Date(2026, 6, 31, 17, 0, 0, 0))
    expect(f.fin).toEqual(new Date(2026, 7, 1, 6, 0, 0, 0))
  })
})

describe('estDeLaSoiree — qui entre, qui reste dehors', () => {
  const f = fenetreSoiree(new Date(2026, 7, 1, 22, 0))
  it('garde la soirée et le petit matin', () => {
    expect(estDeLaSoiree(new Date(2026, 7, 1, 21, 24), f)).toBe(true)
    expect(estDeLaSoiree(new Date(2026, 7, 2, 0, 48), f)).toBe(true)
    expect(estDeLaSoiree(new Date(2026, 7, 2, 5, 59), f)).toBe(true)
  })
  it('écarte l’après-midi, le lendemain midi et les jours d’avant', () => {
    expect(estDeLaSoiree(new Date(2026, 7, 1, 14, 12), f)).toBe(false)
    expect(estDeLaSoiree(new Date(2026, 7, 2, 11, 30), f)).toBe(false)
    expect(estDeLaSoiree(new Date(2026, 6, 30, 22, 0), f)).toBe(false)
  })
  it('les bornes sont incluses', () => {
    expect(estDeLaSoiree(new Date(2026, 7, 1, 17, 0), f)).toBe(true)
    expect(estDeLaSoiree(new Date(2026, 7, 2, 6, 0), f)).toBe(true)
  })
})

describe('heureTirage — l’heure au crayon', () => {
  it('sans zéro devant, avec deux chiffres aux minutes', () => {
    expect(heureTirage(new Date(2026, 7, 1, 21, 24))).toBe('21h24')
    expect(heureTirage(new Date(2026, 7, 2, 0, 8))).toBe('0h08')
  })
})

// ── un vrai JPEG minimal, avec l'EXIF qu'on sait lire ────────────
function jpegAvecDate(texte: string, bigEndian = false): Blob {
  const CORPS = 64 // en-tête TIFF (8) + IFD0 (18) + IFD Exif (18) + chaîne (20)
  const buf = new ArrayBuffer(12 + CORPS)
  const v = new DataView(buf)
  const li = !bigEndian
  v.setUint16(0, 0xffd8) // SOI
  v.setUint16(2, 0xffe1) // APP1
  v.setUint16(4, 2 + 6 + CORPS) // taille du segment
  new Uint8Array(buf, 6, 6).set([0x45, 0x78, 0x69, 0x66, 0, 0]) // « Exif\0\0 »
  const tiff = 12
  v.setUint16(tiff, bigEndian ? 0x4d4d : 0x4949)
  v.setUint16(tiff + 2, 42, li)
  v.setUint32(tiff + 4, 8, li) // IFD0 à tiff+8
  // IFD0 : une entrée, le pointeur vers l'IFD Exif
  v.setUint16(tiff + 8, 1, li)
  v.setUint16(tiff + 10, 0x8769, li)
  v.setUint16(tiff + 12, 4, li) // LONG
  v.setUint32(tiff + 14, 1, li)
  v.setUint32(tiff + 18, 26, li) // IFD Exif à tiff+26
  v.setUint32(tiff + 22, 0, li) // pas d'IFD1
  // IFD Exif : une entrée, DateTimeOriginal
  v.setUint16(tiff + 26, 1, li)
  v.setUint16(tiff + 28, 0x9003, li)
  v.setUint16(tiff + 30, 2, li) // ASCII
  v.setUint32(tiff + 32, 20, li)
  v.setUint32(tiff + 36, 44, li) // la chaîne à tiff+44
  v.setUint32(tiff + 40, 0, li)
  new Uint8Array(buf, tiff + 44, 20).set(new TextEncoder().encode(texte.padEnd(19, ' ') + '\0'))
  return new Blob([buf], { type: 'image/jpeg' })
}

describe('lireDatePrise — la date inscrite dans le fichier', () => {
  it('lit DateTimeOriginal en little endian (le cas courant)', async () => {
    const d = await lireDatePrise(jpegAvecDate('2026:08:01 21:24:07'))
    expect(d).toEqual(new Date(2026, 7, 1, 21, 24, 7))
  })

  it('lit aussi le big endian (Nikon & co)', async () => {
    const d = await lireDatePrise(jpegAvecDate('2026:08:01 23:36:00', true))
    expect(d).toEqual(new Date(2026, 7, 1, 23, 36, 0))
  })

  it('rend null sur un fichier qui n’est pas un JPEG', async () => {
    expect(await lireDatePrise(new Blob([new Uint8Array([1, 2, 3, 4, 5, 6])]))).toBeNull()
  })

  it('rend null sur un JPEG sans EXIF (capture d’écran, image du web)', async () => {
    const buf = new ArrayBuffer(24)
    const v = new DataView(buf)
    v.setUint16(0, 0xffd8)
    v.setUint16(2, 0xffe0) // APP0 JFIF, aucune date
    v.setUint16(4, 16)
    v.setUint16(20, 0xffda) // début de l'image
    expect(await lireDatePrise(new Blob([buf]))).toBeNull()
  })

  it('rend null sur un EXIF tronqué au lieu de jeter', async () => {
    const entier = jpegAvecDate('2026:08:01 21:24:07')
    expect(await lireDatePrise(entier.slice(0, 30))).toBeNull()
  })

  it('rend null sur la date vide que posent certains appareils', async () => {
    expect(await lireDatePrise(jpegAvecDate('0000:00:00 00:00:00'))).toBeNull()
  })
})

describe('fusionnerPhotos — les preuves ne se font pas chasser', () => {
  const p = (type: string, n: number) => Array.from({ length: n }, () => ({ type }))

  it('garde les preuves devant : la couverture de la fiche ne bouge pas', () => {
    const out = fusionnerPhotos([{ type: 'facade' }, { type: 'wc' }], [{ type: 'soir' }])
    expect(out.map((x) => x.type)).toEqual(['facade', 'wc', 'soir'])
  })

  it('les deux budgets sont indépendants', () => {
    const out = fusionnerPhotos(p('salle', CAP_PREUVES), p('soir', CAP_TIRAGES))
    expect(out.filter((x) => x.type === 'salle')).toHaveLength(CAP_PREUVES)
    expect(out.filter((x) => x.type === 'soir')).toHaveLength(CAP_TIRAGES)
  })

  it('au-delà du plafond, ce sont les PLUS ANCIENS tirages qui tombent', () => {
    const anciens = Array.from({ length: CAP_TIRAGES }, (_, i) => ({ type: 'soir', n: i }))
    const out = fusionnerPhotos(anciens, [{ type: 'soir', n: 99 }])
    expect(out).toHaveLength(CAP_TIRAGES)
    expect(out[0].n).toBe(1) // le n°0 est tombé
    expect(out.at(-1)!.n).toBe(99)
  })

  it('vingt preuves d’un coup ne débordent pas le carnet', () => {
    expect(fusionnerPhotos([], p('salle', 20))).toHaveLength(CAP_PREUVES)
  })
})
