import { describe, it, expect } from 'vitest'
import { tracesPour, AUCUNE_LIGNE, type Ligne } from '../lignes'

const ligne = (id: string, couleur: string, ref: string, n = 3): Ligne => ({
  id,
  ref,
  mode: 'metro',
  couleur,
  stations: ['A', 'B', 'C'].slice(0, n),
  points: Array.from({ length: n }, (_, i) => [2.3 + i * 0.01, 48.85 + i * 0.01] as [number, number]),
})

const table = new Map<string, Ligne>([
  ['metro-1', ligne('metro-1', '#ffbe00', '1')],
  ['metro-4', ligne('metro-4', '#a0006e', '4')],
  ['tronque', ligne('tronque', '#000000', '9', 1)],
])

describe('tracesPour', () => {
  it('ne trace rien quand aucune ligne n\'est demandée', () => {
    expect(tracesPour(undefined, table)).toBe(AUCUNE_LIGNE)
    expect(tracesPour([], table).features).toHaveLength(0)
  })

  it('allume TOUTES les lignes de la station, pas une seule', () => {
    const fc = tracesPour(['metro-1', 'metro-4'], table)
    expect(fc.features).toHaveLength(2)
    expect(fc.features.map((f) => f.properties.ref)).toEqual(['1', '4'])
  })

  it('porte la couleur RATP dans la donnée (un seul layer les peint toutes)', () => {
    const fc = tracesPour(['metro-1', 'metro-4'], table)
    expect(fc.features.map((f) => f.properties.couleur)).toEqual(['#ffbe00', '#a0006e'])
  })

  it('ignore une ligne inconnue sans casser le reste', () => {
    const fc = tracesPour(['metro-1', 'ligne-fantome'], table)
    expect(fc.features).toHaveLength(1)
    expect(fc.features[0].properties.ref).toBe('1')
  })

  it('écarte un tracé à moins de deux points — une LineString ne se dessine pas', () => {
    expect(tracesPour(['tronque'], table).features).toHaveLength(0)
  })

  it('rend bien une géométrie LineString ordonnée', () => {
    const [f] = tracesPour(['metro-1'], table).features
    expect(f.geometry.type).toBe('LineString')
    expect(f.geometry.coordinates).toHaveLength(3)
    expect(f.geometry.coordinates[0][0]).toBeLessThan(f.geometry.coordinates[2][0])
  })
})
