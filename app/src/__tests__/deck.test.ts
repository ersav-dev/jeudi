// ── tests du deck pondéré par les proches (pur, sans DOM ni Supabase) ──
import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}))

import { signalProche, pondererParProches } from '../deck'
import type { Lieu } from '../db'

function mkLieu(partiel: Partial<Lieu> & { id: string; nom: string }): Lieu {
  return {
    lat: 48.87,
    lng: 2.35,
    note: '',
    visibilite: 'cercle',
    envies: [],
    compagnies: [],
    photos: [],
    statut: 'actif',
    creeLe: '2026-01-01T00:00:00.000Z',
    source: 'manuel',
    ...partiel,
  }
}

describe('signalProche', () => {
  it('matche le propriétaire insensible accents/casse', () => {
    const lieu = mkLieu({ id: 'l', nom: 'lieu', proprietaire: 'Léa' })
    expect(signalProche(lieu, ['lea']).porteParProche).toBe(true)
    expect(signalProche(lieu, ['LÉA']).porteParProche).toBe(true)
    expect(signalProche(lieu, ['zoe']).porteParProche).toBe(false)
  })

  it('matche l’auteur d’un tip insensible accents/casse', () => {
    const lieu = mkLieu({
      id: 'l',
      nom: 'lieu',
      tipsCercle: [{ auteur: 'KARIM', titre: 'éclaireur', note: 'top' }],
    })
    const sig = signalProche(lieu, ['karim'])
    expect(sig.porteParProche).toBe(true)
    expect(sig.qui).toEqual(['KARIM'])
  })
})

describe('pondererParProches', () => {
  it('booste un lieu porté par un proche au-dessus d’un non-porté à distance égale', () => {
    // même coordonnées → distance identique : seul le boost départage
    const porte = mkLieu({
      id: 'porte',
      nom: 'porté',
      tipsCercle: [{ auteur: 'Léa', titre: 'curatrice', note: 'banquette du fond' }],
    })
    const anonyme = mkLieu({ id: 'anon', nom: 'anonyme' })
    const out = pondererParProches([anonyme, porte], ['lea'])
    expect(out[0]?.lieu.id).toBe('porte')
    expect(out[0]?.parProches).toEqual(['Léa'])
    expect(out[0]?.score).toBeGreaterThan(out[1]?.score ?? Infinity)
    expect(out[1]?.raison).toBeUndefined()
  })
})
