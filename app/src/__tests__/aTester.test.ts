// ── la pile « à tester » : la règle, et les ratures — pur, sans DOM ──────
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
  CLE_A_TESTER,
  lireATester,
  estATester,
  defautATester,
  basculerATester,
  oublierATester,
} from '../aTester'

const spot = (id: string, tampon?: unknown) => ({ id, tampon })

beforeEach(() => localStorage.clear())

describe('la règle par défaut : pas de tampon = pas encore fait', () => {
  it('un spot vierge est dans la pile, un spot tamponné n’y est plus', () => {
    expect(defautATester(spot('a'))).toBe(true)
    expect(estATester(spot('a'))).toBe(true)
    expect(estATester(spot('b', { v: 'valide', x: 50, y: 50 }))).toBe(false)
    // « passé à côté » compte aussi : on y est allé, c'est fait
    expect(estATester(spot('c', { v: 'bof', x: 50, y: 50 }))).toBe(false)
  })
})

describe('la rature : la main contredit la règle, spot par spot', () => {
  it('remet dans la pile un spot déjà tamponné (« j’y retourne »)', () => {
    const tamponne = spot('b', { v: 'valide' })
    basculerATester(tamponne)
    expect(estATester(tamponne)).toBe(true)
    expect(lireATester()).toEqual({ b: 'oui' })
  })

  it('sort de la pile un spot jamais tamponné (« je l’ai rangé »)', () => {
    basculerATester(spot('a'))
    expect(estATester(spot('a'))).toBe(false)
    expect(lireATester()).toEqual({ a: 'non' })
  })

  it('quand le choix rejoint la règle, la rature s’efface (rien ne traîne)', () => {
    basculerATester(spot('a')) // 'non'
    basculerATester(spot('a')) // retour au défaut → plus d'exception
    expect(lireATester()).toEqual({})
    expect(estATester(spot('a'))).toBe(true)
  })

  it('un lieu effacé n’a plus d’exception', () => {
    basculerATester(spot('a'))
    oublierATester('a')
    expect(lireATester()).toEqual({})
  })
})

describe('le stockage abîmé ne casse rien', () => {
  it('valeur illisible, tableau, valeurs inconnues : table vide ou nettoyée', () => {
    localStorage.setItem(CLE_A_TESTER, 'pas du json')
    expect(lireATester()).toEqual({})
    localStorage.setItem(CLE_A_TESTER, '["a"]')
    expect(lireATester()).toEqual({})
    localStorage.setItem(CLE_A_TESTER, '{"a":"oui","b":42,"c":"peut-être"}')
    expect(lireATester()).toEqual({ a: 'oui' })
  })
})
