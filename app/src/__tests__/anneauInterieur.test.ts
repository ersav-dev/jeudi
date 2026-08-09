// ── l'anneau intérieur (super potes) : le cap des 10 et sa curation ──
// logique PURE — localStorage minimal stubbé (pattern rayure.test.ts)
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

import { lesProches, estProche, nbProches, basculerProche, curerEtRemplacer, CAP_PROCHES } from '../cercle'

beforeEach(() => localStorage.clear())

// des uuid v4-shape valides (cercle.ts filtre tout ce qui n'y ressemble pas)
const uuid = (n: number) => `123e4567-e89b-42d3-a456-42661417${String(n).padStart(4, '0')}`

describe('lesProches / estProche / nbProches : au démarrage, personne', () => {
  it('jamais touché → liste vide (les vrais proches arriveront)', () => {
    expect(lesProches()).toEqual([])
    expect(nbProches()).toBe(0)
    expect(estProche(uuid(1))).toBe(false)
  })
})

describe('basculerProche : ajoute, retire, jamais au-delà du cap', () => {
  it('ajoute un super pote', () => {
    const r = basculerProche(uuid(1))
    expect(r.pleinAtteint).toBe(false)
    expect(r.proches).toEqual([uuid(1)])
    expect(estProche(uuid(1))).toBe(true)
  })

  it('bascule deux fois de suite = ajoute puis retire', () => {
    basculerProche(uuid(1))
    const r = basculerProche(uuid(1))
    expect(r.proches).toEqual([])
    expect(r.pleinAtteint).toBe(false)
  })

  it('remplit jusqu’au cap (10) sans broncher', () => {
    for (let i = 0; i < CAP_PROCHES; i++) basculerProche(uuid(i))
    expect(nbProches()).toBe(CAP_PROCHES)
  })

  it('le cap n’est pas un mur qui plante : au-delà, on REFUSE sans écrire — jamais d’exception', () => {
    for (let i = 0; i < CAP_PROCHES; i++) basculerProche(uuid(i))
    const avant = lesProches()
    expect(() => basculerProche(uuid(99))).not.toThrow()
    const r = basculerProche(uuid(99))
    expect(r.pleinAtteint).toBe(true)
    expect(r.proches).toEqual(avant) // rien n'a bougé — pas de 11e entrée
    expect(nbProches()).toBe(CAP_PROCHES)
  })

  it('retirer quelqu’un quand l’anneau est plein libère une place normalement', () => {
    for (let i = 0; i < CAP_PROCHES; i++) basculerProche(uuid(i))
    const r = basculerProche(uuid(0)) // retrait, pas ajout
    expect(r.pleinAtteint).toBe(false)
    expect(r.proches).toHaveLength(CAP_PROCHES - 1)
  })
})

describe('curerEtRemplacer : LE geste de curation — jamais une erreur', () => {
  it('anneau plein : retire un et ajoute l’autre EN UN SEUL geste, sans jamais dépasser le cap', () => {
    for (let i = 0; i < CAP_PROCHES; i++) basculerProche(uuid(i))
    expect(nbProches()).toBe(CAP_PROCHES)

    const n = curerEtRemplacer(uuid(0), uuid(99))
    expect(n).toHaveLength(CAP_PROCHES) // jamais 11
    expect(n).not.toContain(uuid(0)) // le sorti est bien sorti
    expect(n).toContain(uuid(99)) // le nouveau est bien entré
    expect(estProche(uuid(0))).toBe(false)
    expect(estProche(uuid(99))).toBe(true)
  })

  it('marche même si l’anneau n’était pas plein (retire, puis ajoute)', () => {
    basculerProche(uuid(1))
    basculerProche(uuid(2))
    const n = curerEtRemplacer(uuid(1), uuid(3))
    expect(n.sort()).toEqual([uuid(2), uuid(3)].sort())
  })

  it('si le nouveau était déjà dedans, le retrait joue mais rien ne double', () => {
    basculerProche(uuid(1))
    basculerProche(uuid(2))
    const n = curerEtRemplacer(uuid(1), uuid(2))
    expect(n).toEqual([uuid(2)])
  })

  it('sortant absent de l’anneau : l’ajout se fait quand même s’il reste de la place', () => {
    basculerProche(uuid(1))
    const n = curerEtRemplacer(uuid(999), uuid(2))
    expect(n.sort()).toEqual([uuid(1), uuid(2)].sort())
  })

  it('ne dépasse jamais le cap, même dans un cas limite (sortant absent, anneau déjà plein)', () => {
    for (let i = 0; i < CAP_PROCHES; i++) basculerProche(uuid(i))
    const n = curerEtRemplacer(uuid(999), uuid(100)) // uuid(999) n'est pas dedans
    expect(n.length).toBeLessThanOrEqual(CAP_PROCHES)
  })
})
