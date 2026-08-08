import { describe, it, expect } from 'vitest'
import {
  tracesPour,
  bouchesPour,
  AUCUNE_LIGNE,
  AUCUNE_BOUCHE,
  type Ligne,
  type Bouche,
} from '../lignes'

const brin = (n: number, dep = 0): [number, number][] =>
  Array.from({ length: n }, (_, i) => [2.3 + (dep + i) * 0.01, 48.85 + (dep + i) * 0.01])

const ligne = (id: string, couleur: string, ref: string, brins: [number, number][][]): Ligne => ({
  id, ref, mode: 'metro', couleur, stations: ['A', 'B'], brins,
})

const table = new Map<string, Ligne>([
  ['1', ligne('1', '#FFCE00', '1', [brin(4)])],
  ['4', ligne('4', '#C04191', '4', [brin(3)])],
  // une ligne à branches : deux brins séparés, comme la 7 ou la 13
  ['13', ligne('13', '#98D4E2', '13', [brin(3), brin(3, 10)])],
  // un brin dégénéré : un seul point ne fait pas une ligne
  ['abime', ligne('abime', '#000000', '9', [brin(1)])],
])

describe('tracesPour', () => {
  it('ne trace rien quand aucune ligne n\'est demandée', () => {
    expect(tracesPour(undefined, table)).toBe(AUCUNE_LIGNE)
    expect(tracesPour([], table).features).toHaveLength(0)
  })

  it('allume TOUTES les lignes de la station, pas une seule', () => {
    const fc = tracesPour(['1', '4'], table)
    expect(fc.features).toHaveLength(2)
    expect(fc.features.map((f) => f.properties.ref)).toEqual(['1', '4'])
  })

  it('porte la couleur de la charte dans la donnée (un layer les peint toutes)', () => {
    const fc = tracesPour(['1', '4'], table)
    expect(fc.features.map((f) => f.properties.couleur)).toEqual(['#FFCE00', '#C04191'])
  })

  it('garde les deux brins d\'une ligne à branches', () => {
    const [f] = tracesPour(['13'], table).features
    expect(f.geometry.type).toBe('MultiLineString')
    expect(f.geometry.coordinates).toHaveLength(2)
  })

  it('ignore une ligne inconnue sans casser le reste', () => {
    const fc = tracesPour(['1', 'ligne-fantome'], table)
    expect(fc.features).toHaveLength(1)
    expect(fc.features[0].properties.ref).toBe('1')
  })

  it('écarte un tracé sans brin dessinable', () => {
    expect(tracesPour(['abime'], table).features).toHaveLength(0)
  })

  it('rend une géométrie ordonnée', () => {
    const [f] = tracesPour(['1'], table).features
    expect(f.geometry.coordinates[0]).toHaveLength(4)
    expect(f.geometry.coordinates[0][0][0]).toBeLessThan(f.geometry.coordinates[0][3][0])
  })
})

const bouches: Record<string, Bouche[]> = {
  Abbesses: [{ p: [2.3383, 48.8844], n: null }],
  'Châtelet': [
    { p: [2.3470, 48.8580], n: 'Rue de Rivoli' },
    { p: [2.3480, 48.8585], n: null },
  ],
}

describe('bouchesPour', () => {
  it('ne montre rien tant qu\'aucune station n\'est touchée', () => {
    expect(bouchesPour(null, bouches)).toBe(AUCUNE_BOUCHE)
  })

  it('ne montre rien si les bouches ne sont pas encore chargées', () => {
    expect(bouchesPour('Châtelet', null)).toBe(AUCUNE_BOUCHE)
  })

  it('ne montre rien pour une station sans bouche connue', () => {
    expect(bouchesPour('Gare de Lyon', bouches)).toBe(AUCUNE_BOUCHE)
  })

  it('sort toutes les bouches de la station touchée', () => {
    const fc = bouchesPour('Châtelet', bouches)
    expect(fc.features).toHaveLength(2)
    expect(fc.features[0].geometry.coordinates).toEqual([2.347, 48.858])
  })

  it('accepte une bouche sans nom — la plupart n\'en ont pas', () => {
    const fc = bouchesPour('Abbesses', bouches)
    expect(fc.features[0].properties.nom).toBeNull()
  })
})
