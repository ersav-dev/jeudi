import { describe, it, expect } from 'vitest'
import {
  tracesPour,
  bouchesPour,
  elaguer,
  arretsPour,
  clefStation,
  indexerStations,
  situerStation,
  stationsIntrouvables,
  AUCUNE_LIGNE,
  AUCUN_ARRET,
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

// ── les points de quai ──────────────────────────────────────────────────
// deux référentiels OSM qui n'écrivent pas pareil : les lignes disent
// « Gare du Nord », transport.json dit « Gare du Nord (Métro) ».
const quais = indexerStations([
  { nom: 'Abbesses', p: [2.3383, 48.8844] },
  { nom: 'Gare du Nord (Métro)', p: [2.3553, 48.8809] },
  { nom: 'Saint-Denis - Université', p: [2.3639, 48.9463] },
  { nom: 'Château de Vincennes', p: [2.4405, 48.8443] },
])

const desservie = (id: string, couleur: string, stations: string[]): Ligne => ({
  id, ref: id, mode: 'metro', couleur, stations, brins: [brin(3)],
})

const reseau = new Map<string, Ligne>([
  ['a', desservie('a', '#FFCE00', ['Abbesses', 'Gare du Nord', 'Nulle Part'])],
  ['b', desservie('b', '#C04191', ['Gare du Nord', 'Château de Vincennes'])],
])

describe('clefStation', () => {
  it('efface la parenthèse de désambiguïsation', () => {
    expect(clefStation('Gare du Nord (Métro)')).toBe(clefStation('Gare du Nord'))
  })

  it('efface accents, casse et ponctuation', () => {
    expect(clefStation('Saint-Denis - Université')).toBe(clefStation('saint denis universite'))
  })

  it('ne rapproche pas deux stations qui ne sont pas la même', () => {
    expect(clefStation('Saint-Michel')).not.toBe(clefStation('Saint-Michel Notre-Dame'))
  })
})

describe('situerStation', () => {
  it('trouve par le nom exact d\'abord', () => {
    expect(situerStation('Abbesses', quais)).toEqual([2.3383, 48.8844])
  })

  it('retombe sur la clé souple quand la graphie diffère', () => {
    expect(situerStation('Gare du Nord', quais)).toEqual([2.3553, 48.8809])
    expect(situerStation('Saint-Denis-Université', quais)).toEqual([2.3639, 48.9463])
  })

  it('rend null plutôt qu\'un quai inventé', () => {
    expect(situerStation('Nulle Part', quais)).toBeNull()
  })
})

describe('arretsPour', () => {
  it('ne pose rien tant qu\'aucune ligne n\'est allumée', () => {
    expect(arretsPour(undefined, reseau, quais, null)).toBe(AUCUN_ARRET)
    expect(arretsPour([], reseau, quais, null)).toBe(AUCUN_ARRET)
  })

  it('ne pose rien tant que les quais ne sont pas situés', () => {
    expect(arretsPour(['a'], reseau, null, null)).toBe(AUCUN_ARRET)
  })

  it('pose une pastille par station située, et tait celles qu\'on ne sait pas placer', () => {
    const fc = arretsPour(['a'], reseau, quais, null)
    expect(fc.features).toHaveLength(2)
    expect(fc.features.map((f) => f.geometry.coordinates)).toEqual([
      [2.3383, 48.8844],
      [2.3553, 48.8809],
    ])
  })

  it('porte la couleur de la ligne — la grammaire du plan de métro', () => {
    const fc = arretsPour(['b'], reseau, quais, null)
    expect(fc.features.map((f) => f.properties.couleur)).toEqual(['#C04191', '#C04191'])
  })

  it('ne dessine qu\'une pastille sur un quai partagé par deux lignes allumées', () => {
    const fc = arretsPour(['a', 'b'], reseau, quais, null)
    // Abbesses + Gare du Nord (ligne a) + Château de Vincennes (ligne b)
    expect(fc.features).toHaveLength(3)
    expect(fc.features.filter((f) => f.properties.couleur === '#FFCE00')).toHaveLength(2)
  })

  it('grossit la station touchée, quelle que soit sa graphie', () => {
    const fc = arretsPour(['a'], reseau, quais, 'Gare du Nord (Métro)')
    expect(fc.features.map((f) => f.properties.ech)).toEqual([1, 1.6])
  })

  it('traite le tram et le RER comme le métro', () => {
    const mixte = new Map<string, Ligne>([
      ['t', { ...desservie('t', '#66a933', ['Abbesses']), mode: 'tram' }],
      ['r', { ...desservie('r', '#0055c8', ['Château de Vincennes']), mode: 'rer' }],
    ])
    expect(arretsPour(['t', 'r'], mixte, quais, null).features).toHaveLength(2)
  })
})

describe('stationsIntrouvables', () => {
  it('compte les trous par ligne, les pires en tête', () => {
    const bilan = stationsIntrouvables(reseau, quais)
    expect(bilan).toEqual([{ ref: 'a', mode: 'metro', total: 3, perdues: 1 }])
  })

  it('ne signale rien quand tout est situé', () => {
    const propre = new Map<string, Ligne>([['b', reseau.get('b')!]])
    expect(stationsIntrouvables(propre, quais)).toEqual([])
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

describe('le sens de passage', () => {
  const sens: Record<string, Bouche[]> = {
    Gare: [
      { p: [2.3, 48.8], r: '1', n: 'Rue A', d: 10 },
      { p: [2.31, 48.8], r: '2', n: 'Rue B', d: 20, s: 's' },
      { p: [2.32, 48.8], r: '3', n: 'Rue C', d: 30, s: 'e' },
    ],
  }

  it('laisse le sens absent quand on passe dans les deux — le cas courant', () => {
    expect(bouchesPour('Gare', sens, 17)[0].sens).toBeUndefined()
  })

  it('marque la sortie seule et l\'entrée seule', () => {
    const l = bouchesPour('Gare', sens, 17)
    expect(l[1].sens).toBe('s')
    expect(l[2].sens).toBe('e')
  })

  it('garde le sens sur CHAQUE escalier, même quand l\'étiquette est tue', () => {
    const paire: Record<string, Bouche[]> = {
      X: [
        { p: [2.3, 48.8], r: '1', n: 'Rue A', d: 10 },
        { p: [2.3001, 48.8], r: '1', n: 'Rue A', d: 12, s: 's' },
      ],
    }
    const l = bouchesPour('X', paire, 17)
    expect(l[1].num).toBeNull()
    expect(l[1].sens).toBe('s')
  })
})
