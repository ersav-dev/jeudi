// ── le signet : la bascule, et le cœur posé sur les lieux — pur, sans DOM ──
// les tests tournent en node : on stubbe un localStorage minimal (marques.test.ts)
import { describe, it, expect, beforeEach, vi } from 'vitest'

const memoire = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memoire.get(k) ?? null,
  setItem: (k: string, v: string) => {
    memoire.set(k, String(v))
  },
  removeItem: (k: string) => {
    memoire.delete(k)
  },
  clear: () => memoire.clear(),
})

import {
  CLE_FAVORIS,
  lireFavoris,
  estFavori,
  basculerFavori,
  marquerFavoris,
} from '../favoris'

beforeEach(() => localStorage.clear())

describe('la bascule : posé, retiré, et rien qui traîne', () => {
  it('pose le signet, puis le retire', () => {
    expect(estFavori('a')).toBe(false)
    expect(basculerFavori('a')).toEqual(['a'])
    expect(estFavori('a')).toBe(true)
    expect(basculerFavori('a')).toEqual([])
    expect(estFavori('a')).toBe(false)
  })

  it('n’écrase pas les autres signets', () => {
    basculerFavori('a')
    basculerFavori('b')
    expect(lireFavoris()).toEqual(['a', 'b'])
    basculerFavori('a')
    expect(lireFavoris()).toEqual(['b'])
  })

  it('la liste survit à un stockage abîmé', () => {
    localStorage.setItem(CLE_FAVORIS, 'pas du json')
    expect(lireFavoris()).toEqual([])
    localStorage.setItem(CLE_FAVORIS, '{"a":true}')
    expect(lireFavoris()).toEqual([])
    // des entrées qui ne sont pas des ids ne sont pas des signets
    localStorage.setItem(CLE_FAVORIS, '["a",42,null]')
    expect(lireFavoris()).toEqual(['a'])
  })
})

describe('le cœur de la carte : `favori` posé sur les lieux', () => {
  it('marque ceux qui portent le signet, et EUX SEULS', () => {
    basculerFavori('a')
    const lieux = marquerFavoris([{ id: 'a' }, { id: 'b' }] as { id: string; favori?: boolean }[])
    expect(lieux[0].favori).toBe(true)
    expect(lieux[1].favori).toBeUndefined()
  })

  it('sans aucun signet, aucun lieu n’est touché', () => {
    const lieux = [{ id: 'a', favori: true }, { id: 'b' }] as { id: string; favori?: boolean }[]
    marquerFavoris(lieux)
    // le cœur venu d'ailleurs (la colonne cloud) n'est jamais effacé ici :
    // marquerFavoris AJOUTE le signet local, il ne fait pas le ménage.
    expect(lieux[0].favori).toBe(true)
    expect(lieux[1].favori).toBeUndefined()
  })
})
