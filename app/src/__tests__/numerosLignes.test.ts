import { describe, it, expect } from 'vitest'
import { encreSur, etiquettesLignes, type Ligne } from '../lignes'

/** le contraste WCAG réel entre deux couleurs — c'est LUI qu'on teste, pas
 *  la couleur choisie : ce qui compte est qu'on puisse lire le numéro. */
const contraste = (a: string, b: string): number => {
  const lum = (hex: string) => {
    const v = hex.replace('#', '')
    const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    const [r, g, bl] = [0, 2, 4].map((i) => lin(parseInt(v.slice(i, i + 2), 16) / 255))
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// les 21 couleurs officielles réellement servies (référentiel IDFM, 10/08)
const OFFICIELLES = [
  '#FFBE00', '#0055C8', '#6E6E00', '#82C8E6', '#A0006E', '#FF5A00', '#82DC73',
  '#FF82B4', '#D282BE', '#D2D200', '#DC9600', '#6E491E', '#00643C', '#640082',
  '#EB2132', '#5091CB', '#FFCC30', '#008B5B', '#B94E9A', '#FF0000', '#3C91DC',
]

describe('encreSur — le numéro doit se LIRE sur chaque ligne', () => {
  it('passe le seuil AA (4,5:1) sur les 21 couleurs officielles', () => {
    const pires = OFFICIELLES.map((c) => ({ c, r: contraste(c, encreSur(c)) }))
      .filter((x) => x.r < 4.5)
      .map((x) => `${x.c} → ${x.r.toFixed(2)}:1`)
    expect(pires).toEqual([])
  })

  it('choisit TOUJOURS l’encre la plus contrastée des deux', () => {
    for (const c of OFFICIELLES) {
      const choisie = encreSur(c)
      const autre = choisie === '#000000' ? '#FFFFFF' : '#000000'
      expect(contraste(c, choisie)).toBeGreaterThanOrEqual(contraste(c, autre))
    }
  })

  it('le cas qui avait piégé la première version : le rose du métro 7', () => {
    // un seuil de luminance donnait du BLANC ici → 1,9:1, illisible
    expect(encreSur('#FF82B4')).toBe('#000000')
    expect(contraste('#FF82B4', '#000000')).toBeGreaterThan(8)
  })

  it('garde l’évidence : noir sur le jaune du 1, blanc sur le violet du 14', () => {
    expect(encreSur('#FFBE00')).toBe('#000000')
    expect(encreSur('#640082')).toBe('#FFFFFF')
  })

  it('ne casse pas sur une couleur mal formée', () => {
    expect(encreSur('')).toBe('#FFFFFF')
    expect(encreSur('#abc')).toBe('#FFFFFF')
    expect(encreSur('pas une couleur')).toBe('#FFFFFF')
  })
})

// un tracé nord-sud à Paris : un point tous les ~111 m en latitude
const brinDroit = (n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => [2.35, 48.85 + i * 0.001] as [number, number])

const ligne = (ref: string, couleur: string, brins: [number, number][][]): Ligne => ({
  id: 'id-' + ref,
  ref,
  mode: 'metro',
  couleur,
  stations: [],
  brins,
})

describe('etiquettesLignes', () => {
  const table = new Map<string, Ligne>([
    ['id-1', ligne('1', '#FFBE00', [brinDroit(20)])],
    ['id-4', ligne('4', '#A0006E', [brinDroit(20)])],
  ])
  const station: [number, number] = [2.35, 48.85]

  it('rend une pastille par ligne allumée', () => {
    const e = etiquettesLignes(['id-1', 'id-4'], table, station)
    expect(e).toHaveLength(2)
    expect(e.map((x) => x.ref)).toEqual(['1', '4'])
  })

  it('porte la couleur de la ligne et l’encre déjà calculée', () => {
    const [un] = etiquettesLignes(['id-1'], table, station)
    expect(un.couleur).toBe('#FFBE00')
    expect(un.encre).toBe('#000000') // le jaune veut du noir
    expect(contraste(un.couleur, un.encre)).toBeGreaterThan(4.5)
  })

  it('s’éloigne de la station d’environ 190 m — ni dessus, ni au bout du monde', () => {
    const [un] = etiquettesLignes(['id-1'], table, station)
    const dm = Math.hypot((un.p[0] - station[0]) * 73180, (un.p[1] - station[1]) * 111320)
    expect(dm).toBeGreaterThan(150)
    expect(dm).toBeLessThan(320)
  })

  it('ne compte qu’UNE fois une ligne à deux brins (7 et 7bis)', () => {
    const t = new Map<string, Ligne>([
      ['a', ligne('7', '#FF82B4', [brinDroit(20)])],
      ['b', ligne('7', '#FF82B4', [brinDroit(20)])],
    ])
    expect(etiquettesLignes(['a', 'b'], t, station)).toHaveLength(1)
  })

  it('trouve quand même un point si la station est au TERMINUS', () => {
    // station au dernier point du brin : impossible d'avancer, il faut reculer
    const fin: [number, number] = [2.35, 48.85 + 19 * 0.001]
    const [un] = etiquettesLignes(['id-1'], table, fin)
    expect(un).toBeDefined()
    const dm = Math.hypot((un.p[0] - fin[0]) * 73180, (un.p[1] - fin[1]) * 111320)
    expect(dm).toBeGreaterThan(150)
  })

  it('rend une liste vide plutôt que de deviner, quand il manque une pièce', () => {
    expect(etiquettesLignes(undefined, table, station)).toEqual([])
    expect(etiquettesLignes(['id-1'], null, station)).toEqual([])
    expect(etiquettesLignes(['id-1'], table, null)).toEqual([])
    expect(etiquettesLignes(['inconnu'], table, station)).toEqual([])
  })

  it('se rabat sur le point le plus proche si le brin est trop court', () => {
    const court = new Map<string, Ligne>([['c', ligne('X', '#FF0000', [brinDroit(2)])]])
    const e = etiquettesLignes(['c'], court, station)
    expect(e).toHaveLength(1)
    expect(e[0].p).toBeDefined()
  })
})
