import { describe, it, expect } from 'vitest'
import { gesteMeteo } from '../db'

// Le chip de la « situation du portefeuille » a changé trois fois en deux
// jours : double-tap sur l'icône (08/08) → tap simple (10/08) → bascule
// (10/08, « je ne veux pas que le prix reste »). Ces tests figent la version
// retenue pour qu'un quatrième changement ne casse pas les trois autres cas.

describe('gesteMeteo', () => {
  it('taper une AUTRE météo la choisit et montre son prix', () => {
    expect(gesteMeteo('pluie', 'soleil', false)).toBe('choisir-et-montrer')
    // même si les prix sont déjà affichés : on vient de changer de budget,
    // c'est précisément le moment de voir ce qu'il donne
    expect(gesteMeteo('pluie', 'soleil', true)).toBe('choisir-et-montrer')
  })

  it('retaper la MÊME météo éteint les prix affichés', () => {
    expect(gesteMeteo('soleil', 'soleil', true)).toBe('cacher')
  })

  it('retaper la MÊME météo les remontre s’ils étaient cachés', () => {
    expect(gesteMeteo('soleil', 'soleil', false)).toBe('montrer')
  })

  it('bascule vraiment : deux taps de suite reviennent à l’état de départ', () => {
    let visibles = false
    const taper = (m: 'soleil' | 'nuageux' | 'pluie', choisie: typeof m) => {
      const g = gesteMeteo(m, choisie, visibles)
      if (g === 'cacher') visibles = false
      else visibles = true
      return g
    }
    expect(taper('soleil', 'soleil')).toBe('montrer')
    expect(visibles).toBe(true)
    expect(taper('soleil', 'soleil')).toBe('cacher')
    expect(visibles).toBe(false)
    expect(taper('soleil', 'soleil')).toBe('montrer')
    expect(visibles).toBe(true)
  })

  it('ne rend jamais autre chose que les trois gestes prévus', () => {
    const meteos = ['soleil', 'nuageux', 'pluie'] as const
    const attendus = ['choisir-et-montrer', 'montrer', 'cacher']
    for (const a of meteos)
      for (const b of meteos)
        for (const v of [true, false]) expect(attendus).toContain(gesteMeteo(a, b, v))
  })
})
