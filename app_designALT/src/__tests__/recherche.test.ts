// ── tests du moteur de recherche (pur, sans DOM ni Supabase) ───────────
import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}))

import { rechercher } from '../recherche'
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

const ids = (r: { lieu: Lieu }[]) => r.map((x) => x.lieu.id)

describe('recherche texte — accents et casse', () => {
  it('« Café » trouve « cafe » (et inversement)', () => {
    const lieux = [mkLieu({ id: 'c', nom: 'Le cafe du coin' }), mkLieu({ id: 'z', nom: 'Bar Zinc' })]
    expect(ids(rechercher(lieux, { texte: 'Café' }))).toEqual(['c'])
    const lieux2 = [mkLieu({ id: 'c2', nom: 'Café Central' }), mkLieu({ id: 'z2', nom: 'Bar Zinc' })]
    expect(ids(rechercher(lieux2, { texte: 'cafe' }))).toEqual(['c2'])
  })
})

describe('cache du foin (WeakMap par référence)', () => {
  it('une nouvelle liste (nouveaux objets) → nouveau calcul, pas de résultat périmé', () => {
    const avant = mkLieu({ id: 'x', nom: 'Ancienne Enseigne' })
    expect(ids(rechercher([avant], { texte: 'ancienne' }))).toEqual(['x'])
    // « mutation » réaliste : la liste est rechargée, l'objet est NEUF
    const apres = { ...avant, nom: 'Nouvelle Enseigne' }
    expect(ids(rechercher([apres], { texte: 'nouvelle' }))).toEqual(['x'])
    expect(ids(rechercher([apres], { texte: 'ancienne' }))).toEqual([])
  })
})

describe('filtre ouvertSeulement', () => {
  // un lundi midi : 12h00
  const midi = new Date('2026-07-06T12:00:00')

  it('garde les horaires inconnus avec la raison « horaires inconnus », exclut les fermés', () => {
    const ouvert = mkLieu({ id: 'ouv', nom: 'ouvert', horaires: [10, 20] })
    const ferme = mkLieu({ id: 'fer', nom: 'fermé', horaires: [18, 26] })
    const inconnu = mkLieu({ id: 'inc', nom: 'inconnu' }) // pas d'horaires
    const res = rechercher([ferme, inconnu, ouvert], { ouvertSeulement: true }, undefined, [], undefined, midi)
    expect(ids(res)).toContain('ouv')
    expect(ids(res)).toContain('inc')
    expect(ids(res)).not.toContain('fer')
    // le vrai ouvert passe devant l'inconnu, et l'inconnu est annoncé comme tel
    expect(ids(res)[0]).toBe('ouv')
    const rInc = res.find((r) => r.lieu.id === 'inc')
    expect(rInc?.raisons).toContain('horaires inconnus')
    expect(rInc?.ouvert).toBeNull()
  })
})
