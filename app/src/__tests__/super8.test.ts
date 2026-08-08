// ── tests du super 8 : la date moov, l'usure, les réglages ───────
// Pur, sans DOM (le développement canvas/MediaRecorder vit seul dans
// bobine.ts, comme preparerTirage pour le tirage).
import { describe, it, expect } from 'vitest'
import {
  dateQuickTime,
  lireDateCreation,
  dateBobine,
  usureDe,
  ageEnJours,
  habillageVersStyle,
  normaliserReglages,
  reglagesParDefaut,
  extensionClip,
  libelleDuree,
  DUREE_MAX_S,
} from '../super8'

// ── fabrique un petit MP4 synthétique : ftyp + [mdat] + moov/mvhd ──
const EPOQUE_QUICKTIME_S = 2082844800

function boite(type: string, corps: Uint8Array): Uint8Array {
  const b = new Uint8Array(8 + corps.length)
  new DataView(b.buffer).setUint32(0, b.length)
  for (let i = 0; i < 4; i++) b[4 + i] = type.charCodeAt(i)
  b.set(corps, 8)
  return b
}

function mvhd(creationS: number, version: 0 | 1 = 0): Uint8Array {
  if (version === 0) {
    const corps = new Uint8Array(100)
    // version 0 + flags 0 ; creation_time u32 à l'offset 4 du corps
    new DataView(corps.buffer).setUint32(4, creationS)
    return boite('mvhd', corps)
  }
  const corps = new Uint8Array(112)
  corps[0] = 1 // version 1 : creation_time u64
  new DataView(corps.buffer).setBigUint64(4, BigInt(creationS))
  return boite('mvhd', corps)
}

function mp4(creationS: number, opts?: { moovALaFin?: boolean; version?: 0 | 1 }): Blob {
  const ftyp = boite('ftyp', new Uint8Array([0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 1]))
  const mdat = boite('mdat', new Uint8Array(4096)) // du « film »
  const moov = boite('moov', mvhd(creationS, opts?.version ?? 0))
  const morceaux = opts?.moovALaFin ? [ftyp, mdat, moov] : [ftyp, moov, mdat]
  return new Blob(morceaux as BlobPart[], { type: 'video/mp4' })
}

/** secondes QuickTime pour une date donnée */
const qt = (d: Date) => Math.floor(d.getTime() / 1000) + EPOQUE_QUICKTIME_S

describe('dateQuickTime — l’époque 1904', () => {
  it('convertit des secondes QuickTime en date', () => {
    const d = new Date(Date.UTC(2026, 7, 1, 21, 30, 0))
    expect(dateQuickTime(qt(d))?.getTime()).toBe(d.getTime())
  })
  it('refuse la date vide des appareils sans horloge (0)', () => {
    expect(dateQuickTime(0)).toBeNull()
  })
  it('refuse une date aberrante d’avant 1971', () => {
    expect(dateQuickTime(1000)).toBeNull() // 1904 + rien
  })
})

describe('lireDateCreation — l’atome moov, où qu’il soit', () => {
  const soir = new Date(2026, 7, 1, 21, 24, 7)

  it('lit la date quand le moov est en tête (faststart)', async () => {
    expect((await lireDateCreation(mp4(qt(soir))))?.getTime()).toBe(soir.getTime())
  })

  it('lit la date quand le moov est EN FIN de fichier (téléphones)', async () => {
    expect((await lireDateCreation(mp4(qt(soir), { moovALaFin: true })))?.getTime()).toBe(
      soir.getTime(),
    )
  })

  it('lit un mvhd version 1 (creation_time 64 bits)', async () => {
    expect((await lireDateCreation(mp4(qt(soir), { version: 1 })))?.getTime()).toBe(soir.getTime())
  })

  it('rend null sur un fichier qui n’est pas un MP4', async () => {
    expect(await lireDateCreation(new Blob([new Uint8Array(64)]))).toBeNull()
  })

  it('rend null (jamais une exception) sur un fichier tronqué', async () => {
    const entier = mp4(qt(soir), { moovALaFin: true })
    expect(await lireDateCreation(entier.slice(0, 20))).toBeNull()
  })
})

describe('dateBobine — la chaîne de repli : moov → lastModified → now', () => {
  it('préfère le moov quand il est lisible (date sûre)', async () => {
    const soir = new Date(2026, 7, 1, 21, 0, 0)
    const f = new File([mp4(qt(soir))], 'clip.mp4', { lastModified: Date.now() })
    const r = await dateBobine(f)
    expect(r.sure).toBe(true)
    expect(r.date.getTime()).toBe(soir.getTime())
  })

  it('retombe sur lastModified quand le moov manque (date approximative)', async () => {
    const lm = new Date(2026, 6, 14, 23, 0, 0).getTime()
    const f = new File([new Uint8Array(64)], 'clip.mp4', { lastModified: lm })
    const r = await dateBobine(f)
    expect(r.sure).toBe(false)
    expect(r.date.getTime()).toBe(lm)
  })
})

describe('usureDe — le barème du §1.6, dans l’ordre des traces', () => {
  it('un clip frais (< 48h) est intact', () => {
    const u = usureDe(1)
    expect(u.poussieres).toBe(0)
    expect(u.rayures).toBe(0)
    expect(u.sautillement).toBe(0)
    expect(u.halos).toBe(0)
    expect(u.sepia).toBe(0)
  })

  it('à une semaine : les premières poussières, rien d’autre', () => {
    const u = usureDe(8)
    expect(u.poussieres).toBeGreaterThan(0)
    expect(u.rayures).toBeGreaterThan(0) // les rayures commencent à 7 j
    expect(u.sautillement).toBe(0)
    expect(u.sepia).toBe(0)
  })

  it('à un mois : poussières pleines, rayures en route, pas de sépia', () => {
    const u = usureDe(31)
    expect(u.poussieres).toBe(0.5)
    expect(u.rayures).toBeGreaterThan(0)
    expect(u.rayures).toBeLessThan(0.7)
    expect(u.sepia).toBe(0)
  })

  it('à un an et demi : super rayé — tout est là, au plafond', () => {
    const u = usureDe(547)
    expect(u.poussieres).toBe(0.5)
    expect(u.rayures).toBe(0.7)
    expect(u.sautillement).toBe(0.6)
    expect(u.halos).toBe(0.5)
    expect(u.sepia).toBe(0.35)
  })

  it('PLAFONNE : un clip de 3 ans n’est pas plus détruit qu’à 1,5 an', () => {
    expect(usureDe(1100)).toEqual(usureDe(547))
  })

  it('monte de façon monotone : plus vieux = jamais moins abîmé', () => {
    let prec = usureDe(0)
    for (const j of [1, 5, 10, 40, 120, 300, 600]) {
      const u = usureDe(j)
      expect(u.rayures).toBeGreaterThanOrEqual(prec.rayures)
      expect(u.poussieres).toBeGreaterThanOrEqual(prec.poussieres)
      expect(u.sepia).toBeGreaterThanOrEqual(prec.sepia)
      prec = u
    }
  })
})

describe('ageEnJours', () => {
  it('compte depuis prise_le', () => {
    const maintenant = new Date(2026, 7, 7, 12, 0)
    expect(ageEnJours(new Date(2026, 7, 5, 12, 0), maintenant)).toBeCloseTo(2)
  })
  it('sans date : âge zéro (le doute profite à l’utilisateur)', () => {
    expect(ageEnJours(undefined)).toBe(0)
  })
})

describe('habillageVersStyle — deux couches qui s’ajoutent', () => {
  it('un clip frais ne porte que les réglages de la chambre noire', () => {
    const s = habillageVersStyle(reglagesParDefaut(), 0)
    expect(s['--s8-grain']).toBe('0.60')
    expect(s['--s8-ray']).toBe('0.00')
    expect(s['--s8-filtre']).toContain('saturate') // la teinte délavée
    expect(s['--s8-filtre']).not.toContain('sepia')
  })

  it('le temps ajoute ses traces SANS toucher au grain choisi', () => {
    const r = { ...reglagesParDefaut(), grain: 0.2 }
    const vieux = habillageVersStyle(r, 547)
    expect(vieux['--s8-grain']).toBe('0.20') // le sien, intact
    expect(vieux['--s8-ray']).toBe('0.70')
    expect(vieux['--s8-filtre']).toContain('sepia')
  })

  it('teinte « couleur » + clip frais : aucun filtre', () => {
    const s = habillageVersStyle({ ...reglagesParDefaut(), teinte: 'couleur' }, 0)
    expect(s['--s8-filtre']).toBe('none')
  })
})

describe('normaliserReglages — le jsonb du cloud ne casse jamais', () => {
  it('null → le préréglage super 8', () => {
    expect(normaliserReglages(null)).toEqual(reglagesParDefaut())
  })
  it('borne les valeurs aberrantes dans 0..1', () => {
    const r = normaliserReglages({ grain: 42, vignette: -3, teinte: 'nb', tremblement: 0.5 })
    expect(r.grain).toBe(1)
    expect(r.vignette).toBe(0)
    expect(r.teinte).toBe('nb')
    expect(r.tremblement).toBe(0.5)
  })
  it('une teinte inconnue retombe sur le préréglage', () => {
    expect(normaliserReglages({ teinte: 'technicolor' }).teinte).toBe('delave')
  })
})

describe('les petits outils', () => {
  it('extensionClip suit le mime', () => {
    expect(extensionClip('video/mp4')).toBe('mp4')
    expect(extensionClip('video/webm;codecs=vp9')).toBe('webm')
  })
  it('libelleDuree arrondit en secondes', () => {
    expect(libelleDuree(9.6)).toBe('10 s')
    expect(libelleDuree(undefined)).toBe('')
  })
  it('la cartouche fait 10 secondes', () => {
    expect(DUREE_MAX_S).toBe(10)
  })
})
