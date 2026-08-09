// ── le jugement : le regard d'un proche, pas une note — logique PURE ──
// (pattern rayure.test.ts : localStorage minimal stubbé, tests en node)
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
  CLE_JUGEMENTS,
  niveauValide,
  pastille,
  peutJuger,
  lireJugements,
  jugerLieu,
  retirerJugement,
  monJugement,
  oublierJugement,
  type Jugement,
} from '../jugement'

beforeEach(() => localStorage.clear())

describe('niveauValide : seulement 1, 2 ou 3', () => {
  it('accepte 1, 2, 3', () => {
    expect(niveauValide(1)).toBe(true)
    expect(niveauValide(2)).toBe(true)
    expect(niveauValide(3)).toBe(true)
  })

  it('rejette tout le reste — jamais un 4e niveau, jamais une demi-pastille', () => {
    expect(niveauValide(0)).toBe(false)
    expect(niveauValide(4)).toBe(false)
    expect(niveauValide(1.5)).toBe(false)
    expect(niveauValide('2')).toBe(false)
    expect(niveauValide(undefined)).toBe(false)
    expect(niveauValide(null)).toBe(false)
  })
})

describe('pastille : ●○○ / ●●○ / ●●● — jamais une étoile', () => {
  it('dessine le bon nombre de pleins/vides', () => {
    expect(pastille(1)).toBe('●○○')
    expect(pastille(2)).toBe('●●○')
    expect(pastille(3)).toBe('●●●')
  })
})

describe('peutJuger : seulement les lieux qui portent MON tampon', () => {
  it('mon tampon dessus → je peux juger', () => {
    expect(peutJuger({ tampon: { qui: 'Karim' } }, 'Karim')).toBe(true)
  })

  it('insensible à la casse et aux espaces (même "qui" que le tampon posé à la validation)', () => {
    expect(peutJuger({ tampon: { qui: '  Karim  ' } }, 'karim')).toBe(true)
    expect(peutJuger({ tampon: { qui: 'KARIM' } }, '  karim  ')).toBe(true)
  })

  it('le tampon d’un autre → je ne peux pas juger', () => {
    expect(peutJuger({ tampon: { qui: 'Léa' } }, 'Karim')).toBe(false)
  })

  it('pas de tampon du tout (jamais visité) → je ne peux pas juger', () => {
    expect(peutJuger({}, 'Karim')).toBe(false)
    expect(peutJuger(undefined, 'Karim')).toBe(false)
    expect(peutJuger(null, 'Karim')).toBe(false)
    expect(peutJuger({ tampon: {} }, 'Karim')).toBe(false)
  })

  it('un "moi" vide ne peut jamais juger, même sur un lieu tamponné vide', () => {
    expect(peutJuger({ tampon: { qui: '' } }, '')).toBe(false)
  })
})

describe('jugerLieu : pose, remplace, refuse — jamais d’exception', () => {
  const spot = { tampon: { qui: 'Karim' } }

  it('pose un jugement signé et daté quand j’ai le droit', () => {
    const maintenant = new Date('2026-08-09T20:00:00.000Z')
    const table = jugerLieu('bisou', 2, spot, 'Karim', maintenant)
    expect(table.bisou).toEqual<Jugement>({ niveau: 2, le: maintenant.toISOString() })
    expect(lireJugements()).toEqual(table)
  })

  it('refuse (silencieusement, table inchangée) si je n’y suis pas allé — pas de tampon', () => {
    const avant = lireJugements()
    const table = jugerLieu('bisou', 2, undefined, 'Karim')
    expect(table).toEqual(avant)
    expect(lireJugements()).toEqual({})
  })

  it('refuse si le tampon est celui de quelqu’un d’autre', () => {
    const table = jugerLieu('bisou', 3, { tampon: { qui: 'Léa' } }, 'Karim')
    expect(table).toEqual({})
  })

  it('refuse un niveau invalide même si j’ai le droit de juger', () => {
    expect(jugerLieu('bisou', 0 as never, spot, 'Karim')).toEqual({})
    expect(jugerLieu('bisou', 4 as never, spot, 'Karim')).toEqual({})
  })

  it('juger deux fois REMPLACE : jamais d’empilement, jamais une moyenne', () => {
    jugerLieu('bisou', 1, spot, 'Karim', new Date('2026-08-09T20:00:00.000Z'))
    const table = jugerLieu('bisou', 3, spot, 'Karim', new Date('2026-08-09T21:00:00.000Z'))
    expect(Object.keys(table)).toEqual(['bisou'])
    expect(table.bisou.niveau).toBe(3)
  })

  it('un lieu où l’on est allé, mais pas les autres : chaque lieu se juge pour lui-même', () => {
    jugerLieu('bisou', 2, spot, 'Karim')
    const table = jugerLieu('antipode', 3, undefined, 'Karim') // pas allé là-bas
    expect(Object.keys(table)).toEqual(['bisou'])
  })
})

describe('retirerJugement / monJugement / oublierJugement', () => {
  it('retire mon jugement — le lieu revient intact', () => {
    const spot = { tampon: { qui: 'Karim' } }
    jugerLieu('bisou', 2, spot, 'Karim')
    expect(retirerJugement('bisou')).toEqual({})
    expect(lireJugements()).toEqual({})
  })

  it('retirer un jugement absent ne casse rien', () => {
    expect(retirerJugement('inconnu')).toEqual({})
  })

  it('monJugement retrouve le bon lieu, undefined sinon', () => {
    const spot = { tampon: { qui: 'Karim' } }
    jugerLieu('bisou', 1, spot, 'Karim')
    expect(monJugement('bisou')?.niveau).toBe(1)
    expect(monJugement('autre-lieu')).toBeUndefined()
  })

  it('oublierJugement efface silencieusement (id inconnu ou pas)', () => {
    const spot = { tampon: { qui: 'Karim' } }
    jugerLieu('bisou', 1, spot, 'Karim')
    oublierJugement('bisou')
    expect(lireJugements()).toEqual({})
    expect(() => oublierJugement('jamais-vu')).not.toThrow()
  })
})

describe('le stockage abîmé ne casse rien (pattern rayure.ts)', () => {
  it('valeur illisible, tableau, niveau hors bornes ou date folle : jetés', () => {
    localStorage.setItem(CLE_JUGEMENTS, 'pas du json')
    expect(lireJugements()).toEqual({})
    localStorage.setItem(CLE_JUGEMENTS, '["a"]')
    expect(lireJugements()).toEqual({})
    localStorage.setItem(
      CLE_JUGEMENTS,
      JSON.stringify({
        bon: { niveau: 2, le: '2026-08-09T20:00:00.000Z' },
        hors_bornes: { niveau: 5, le: '2026-08-09T20:00:00.000Z' },
        sans_niveau: { le: '2026-08-09T20:00:00.000Z' },
        date_folle: { niveau: 1, le: 'jeudi prochain' },
      }),
    )
    expect(Object.keys(lireJugements())).toEqual(['bon'])
  })
})
