// ── tests du rayon : du temps, adaptatif, jamais un mur ────────────────
import { describe, it, expect } from 'vitest'
import {
  retenirParRayon,
  plafondRayon,
  trajetMin,
  libelleTrajet,
  PALIERS_M,
  MARCHE_MAX_M,
} from '../rayon'

// un « spot » de test = sa seule distance
const spots = (...d: number[]) => d.map((x) => ({ d: x }))
const dist = (s: { d: number }) => s.d

describe('retenirParRayon — l’anneau s’arrête au premier palier plein', () => {
  it('grande ville : 8 spots proches → le premier palier suffit, rien ne dépasse', () => {
    const a = retenirParRayon(spots(100, 200, 300, 400, 500, 600, 700, 800, 9000), dist, 8)
    expect(a.rayonM).toBe(1200)
    expect(a.retenus).toHaveLength(8)
    expect(a.elargi).toBe(false)
  })

  it('campagne : les petits cercles sont vides → l’anneau s’ouvre tout seul', () => {
    // Rambouillet : 2 spots au bourg, 6 vers Versailles (~22 km)
    const a = retenirParRayon(
      spots(300, 900, 21000, 22000, 23000, 24000, 25000, 26000),
      dist,
      8,
    )
    expect(a.rayonM).toBe(30000)
    expect(a.retenus).toHaveLength(8)
    expect(a.elargi).toBe(true)
    expect(a.loinM).toBe(26000)
  })

  it('le plafond du moment est respecté — jamais dépassé, jamais un écran vide', () => {
    const a = retenirParRayon(spots(500, 800, 15000, 20000), dist, 8, 12000)
    expect(a.rayonM).toBe(12000)
    expect(a.retenus).toHaveLength(2) // ce qui existe sous le plafond, pas du vide menteur
  })

  it('les retenus sortent triés du plus proche au plus loin', () => {
    const a = retenirParRayon(spots(900, 100, 500), dist, 8)
    expect(a.retenus.map((s) => s.d)).toEqual([100, 500, 900])
  })

  it('peu de spots mais tous à pied : rien à annoncer', () => {
    const a = retenirParRayon(spots(200, 600, 1100), dist, 8)
    expect(a.retenus).toHaveLength(3)
    expect(a.elargi).toBe(false) // 3 spots à 500 m ≠ « j’ai poussé loin »
  })

  it('aucun spot nulle part : liste vide, pas de plantage', () => {
    const a = retenirParRayon([], dist, 8)
    expect(a.retenus).toEqual([])
    expect(a.elargi).toBe(false)
  })

  it('un plafond entre deux paliers devient le dernier cercle', () => {
    const a = retenirParRayon(spots(6000, 9000, 11000), dist, 8, 10000)
    expect(a.rayonM).toBe(10000)
    expect(a.retenus.map((s) => s.d)).toEqual([6000, 9000])
  })
})

describe('plafondRayon — la limite vient du moment, pas des km', () => {
  const jeudiSoir = new Date(2026, 7, 6, 19, 0)
  it('« maintenant » ne traverse pas la région', () => {
    expect(plafondRayon({ cle: 'maintenant' }, jeudiSoir)).toBe(12000)
  })
  it('« ce soir » laisse le temps du trajet', () => {
    expect(plafondRayon({ cle: 'soir' }, jeudiSoir)).toBe(30000)
  })
  it('un autre jour : on planifie, pas de limite', () => {
    expect(plafondRayon({ cle: 'demain' }, jeudiSoir)).toBe(Infinity)
  })
  it('une heure libre AUJOURD’HUI reste bornée au soir même', () => {
    const ce = new Date(2026, 7, 6, 22, 30).toISOString()
    expect(plafondRayon({ cle: 'libre', iso: ce }, jeudiSoir)).toBe(30000)
  })
})

describe('trajetMin / libelleTrajet — le temps dit toujours SON MODE', () => {
  it('marchable : des minutes à pied, au pas par défaut', () => {
    expect(libelleTrajet(800)).toBe('10 min à pied')
    expect(trajetMin(2500).mode).toBe('pied')
  })
  it('la ville moyenne : le vélo (le cas « 4,5 km · ~11 min » qui mentait)', () => {
    const t = trajetMin(4500)
    expect(t.mode).toBe('velo')
    expect(t.min).toBe(19) // ~14 km/h, feux compris
    expect(libelleTrajet(4500)).toBe('~19 min à vélo')
  })
  it('au-delà de 8 km : la voiture, annoncée comme telle', () => {
    const t = trajetMin(25000)
    expect(t.mode).toBe('voiture')
    expect(t.min).toBe(60) // ~25 km/h
    expect(libelleTrajet(25000)).toBe('~60 min en voiture')
  })
  it('les frontières sont les seuils de marche et de vélo, pas des chiffres magiques', () => {
    expect(trajetMin(MARCHE_MAX_M).mode).toBe('pied')
    expect(trajetMin(MARCHE_MAX_M + 1).mode).toBe('velo')
    expect(trajetMin(8000).mode).toBe('velo')
    expect(trajetMin(8001).mode).toBe('voiture')
  })
  it('les paliers commencent à la marche et finissent ouverts', () => {
    expect(PALIERS_M[0]).toBeLessThanOrEqual(MARCHE_MAX_M)
    expect(PALIERS_M[PALIERS_M.length - 1]).toBe(Infinity)
  })
})
