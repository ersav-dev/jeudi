import { describe, it, expect } from 'vitest'
import { metres, plusProches } from '../rentrer'

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
