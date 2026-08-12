import { describe, it, expect } from 'vitest'
import { metres, plusProches, heureDeNuit, etatNoctilien, stationsAMontrer } from '../rentrer'

// un 10 août 2026 à l'heure locale — on ne teste que l'heure, pas la date
const a = (h: number, m = 0) => new Date(2026, 7, 10, h, m, 0)

describe('l’heure du Noctilien', () => {
  it('ne montre RIEN en pleine journée — la faute inverse de celle des bus de jour', () => {
    for (const h of [7, 9, 11, 12, 15, 18, 21]) {
      expect(etatNoctilien(a(h))).toBeNull()
      expect(heureDeNuit(a(h))).toBe(false)
    }
  })

  it('ouvre à 22 h, quand on prépare son retour — mais annonce « bientôt »', () => {
    expect(etatNoctilien(a(21, 59))).toBeNull()
    expect(etatNoctilien(a(22, 0))).toBe('bientot')
    expect(etatNoctilien(a(23, 45))).toBe('bientot')
    expect(etatNoctilien(a(0, 29))).toBe('bientot')
  })

  it('dit « ça roule » exactement de 0h30 à 5h30', () => {
    expect(etatNoctilien(a(0, 30))).toBe('roule')
    expect(etatNoctilien(a(2, 0))).toBe('roule')
    expect(etatNoctilien(a(5, 30))).toBe('roule')
  })

  it('se referme NET après 5h30 — le piège de la fausse promesse inversée', () => {
    // il est 5h45, le service est fini : annoncer « dès 0h30 » enverrait
    // quelqu'un attendre un bus qui ne viendra plus. Rien, donc.
    expect(etatNoctilien(a(5, 31))).toBeNull()
    expect(etatNoctilien(a(5, 45))).toBeNull()
    expect(etatNoctilien(a(6, 0))).toBeNull()
    expect(heureDeNuit(a(5, 45))).toBe(false)
  })

  it('n’a rien à dire entre 6 h et 22 h — toute la journée', () => {
    for (const h of [6, 8, 13, 17, 20]) expect(etatNoctilien(a(h, 30))).toBeNull()
  })

  it('compte minuit comme la nuit d’avant, jamais comme un nouveau jour', () => {
    expect(heureDeNuit(a(0, 5))).toBe(true)
    expect(heureDeNuit(a(3, 0))).toBe(true)
  })
})

// Place Vendôme, le point de repli de l'app
const VENDOME = { lat: 48.86746, lng: 2.32943 }

describe('metres', () => {
  it('rend zéro sur soi-même', () => {
    expect(metres(VENDOME, VENDOME)).toBe(0)
  })

  it('mesure juste une distance connue (Vendôme → Opéra, ~530 m)', () => {
    // vérifié à la main : 505 m de latitude, 159 m de longitude → 529 m
    const opera = { lat: 48.872, lng: 2.3316 }
    const d = metres(VENDOME, opera)
    expect(d).toBeGreaterThan(480)
    expect(d).toBeLessThan(580)
  })

  it('est symétrique', () => {
    const a = { lat: 48.8584, lng: 2.2945 }
    expect(Math.round(metres(VENDOME, a))).toBe(Math.round(metres(a, VENDOME)))
  })
})

describe('plusProches', () => {
  const liste = [
    { nom: 'à 100 m', lat: 48.86836, lng: 2.32943 },
    { nom: 'à 300 m', lat: 48.87016, lng: 2.32943 },
    { nom: 'à 1 km', lat: 48.87646, lng: 2.32943 },
  ]

  it('trie du plus proche au plus loin', () => {
    const r = plusProches(liste, VENDOME, 3, 5000)
    expect(r.map((x) => x.nom)).toEqual(['à 100 m', 'à 300 m', 'à 1 km'])
  })

  it('coupe au plafond de distance', () => {
    const r = plusProches(liste, VENDOME, 3, 400)
    expect(r).toHaveLength(2)
    expect(r.every((x) => x.m <= 400)).toBe(true)
  })

  it('respecte le nombre demandé', () => {
    expect(plusProches(liste, VENDOME, 1, 5000)).toHaveLength(1)
  })

  it('rend une liste vide si rien n’est assez près — jamais null', () => {
    expect(plusProches(liste, VENDOME, 2, 10)).toEqual([])
  })

  it('pose une distance entière en mètres sur chaque résultat', () => {
    const r = plusProches(liste, VENDOME, 1, 5000)
    expect(Number.isInteger(r[0].m)).toBe(true)
    expect(r[0].m).toBeGreaterThan(80)
    expect(r[0].m).toBeLessThan(130)
  })

  it('ne perd pas les champs de l’objet d’origine', () => {
    const r = plusProches([{ nom: 'x', lat: 48.8675, lng: 2.3294, lignes: ['N14'] }], VENDOME, 1, 500)
    expect(r[0].lignes).toEqual(['N14'])
  })
})

describe('les stations à montrer (loi n°1 : jamais une station sans dispo)', () => {
  // le point de départ, et trois stations : les DEUX plus proches sont vides,
  // la troisième — plus loin mais toujours < 400 m — a des vélos.
  const depuis = { lat: 48.842, lng: 2.322 }
  const st = (nom: string, dLat: number, velos: number) => ({
    nom,
    lat: depuis.lat + dLat,
    lng: depuis.lng,
    velos,
    places: 10,
    m: 0, // recalculé par plusProches — la valeur d'entrée n'a aucun poids
  })

  it('deux stations vides côte à côte ne masquent pas la pleine juste derrière', () => {
    // la régression du 12/08 : le filtre « velos > 0 » passait APRÈS le top-2
    // par distance → deux vides devant = résultat vide, la pleine invisible.
    const stations = [st('vide-1', 0.0005, 0), st('vide-2', 0.001, 0), st('pleine', 0.002, 5)]
    const rendues = stationsAMontrer(stations, depuis)
    expect(rendues.map((s) => s.nom)).toEqual(['pleine'])
    expect(rendues[0].velos).toBe(5)
  })

  it('ne montre jamais une station vide, même seule au monde', () => {
    expect(stationsAMontrer([st('vide', 0.0005, 0)], depuis)).toEqual([])
  })

  it('au-delà de 400 m, une station pleine reste hors jeu (autant marcher au métro)', () => {
    expect(stationsAMontrer([st('trop-loin', 0.02, 8)], depuis)).toEqual([])
  })

  it('deux pleines : les deux plus proches, dans l’ordre', () => {
    const stations = [st('b', 0.001, 2), st('a', 0.0005, 1), st('c', 0.0015, 9)]
    expect(stationsAMontrer(stations, depuis).map((s) => s.nom)).toEqual(['a', 'b'])
  })
})
