import { describe, it, expect } from 'vitest'
import {
  tracesPour,
  bouchesPour,
  elaguer,
  AUCUNE_LIGNE,
  PLAFOND_BOUCHES,
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

describe('elaguer', () => {
  it('coupe la parenthèse — c\'est une précision, jamais l\'adresse', () => {
    expect(elaguer('Place de l\'Opéra (théâtre national de l\'Opéra)')).toBe('Pl. de l\'Opéra')
  })

  it('abrège les génériques de voie comme sur un plan', () => {
    expect(elaguer('Avenue Victoria')).toBe('Av. Victoria')
    expect(elaguer('Rue Saint-Denis')).toBe('R. St-Denis')
    expect(elaguer('Boulevard des Capucines')).toBe('Bd des Capucines')
    expect(elaguer('Théâtre du Châtelet')).toBe('Th. du Châtelet')
    expect(elaguer('Place Sainte-Opportune')).toBe('Pl. Ste-Opportune')
  })

  it('n\'abrège « Rue » qu\'en tête — pas au milieu d\'un nom', () => {
    expect(elaguer('Porte Marguerite de Navarre')).toBe('Porte Marguerite de Navarre')
  })

  it('rend null sur rien, ou sur un nom entièrement entre parenthèses', () => {
    expect(elaguer(null)).toBeNull()
    expect(elaguer('(sortie provisoire)')).toBeNull()
  })
})

const bouches: Record<string, Bouche[]> = {
  Abbesses: [{ p: [2.3383, 48.8844], r: '1', n: null, d: 20 }],
  'Châtelet': Array.from({ length: 10 }, (_, i) => ({
    p: [2.347 + i * 0.001, 48.858] as [number, number],
    r: String(10 + i),
    n: 'Rue de Rivoli ' + i,
    d: 40 + i * 20,
  })),
  // deux escaliers pour la même sortie 1, comme Notre-Dame de Lorette
  Lorette: [
    { p: [2.3386, 48.87619], r: '1', n: 'Rue Bourdaloue (Église)', d: 88 },
    { p: [2.33862, 48.87624], r: '1', n: 'Rue Bourdaloue (Église)', d: 90 },
    { p: [2.33664, 48.87617], r: '2', n: 'Rue de Châteaudun', d: 59 },
  ],
}

describe('bouchesPour', () => {
  it('ne montre rien en dessous de z15 — la ligne suffit', () => {
    expect(bouchesPour('Châtelet', bouches, 14.9)).toHaveLength(0)
  })

  it('ne montre rien tant qu\'aucune station n\'est touchée', () => {
    expect(bouchesPour(null, bouches, 17)).toHaveLength(0)
  })

  it('ne montre rien si les bouches ne sont pas encore chargées', () => {
    expect(bouchesPour('Châtelet', null, 17)).toHaveLength(0)
  })

  it('plafonne à 8, en gardant les plus proches de la station', () => {
    const l = bouchesPour('Châtelet', bouches, 16)
    expect(l).toHaveLength(PLAFOND_BOUCHES)
    expect(l.map((b) => b.num)).toEqual(['10', '11', '12', '13', '14', '15', '16', '17'])
  })

  it('tait le nom de rue entre z15 et z17 — le numéro seul', () => {
    const [b] = bouchesPour('Châtelet', bouches, 16)
    expect(b.num).toBe('10')
    expect(b.nom).toBeNull()
  })

  it('sort le nom élagué à partir de z17', () => {
    const [b] = bouchesPour('Châtelet', bouches, 17)
    expect(b.nom).toBe('R. de Rivoli 0')
  })

  it('accepte une bouche sans nom — 127 n\'en ont pas', () => {
    expect(bouchesPour('Abbesses', bouches, 18)[0].nom).toBeNull()
  })
})
