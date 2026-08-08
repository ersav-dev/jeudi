// ── tests des fêtes du calendrier + anniversaires — pur, sans DOM ──
import { describe, it, expect } from 'vitest'
import {
  feteDuJour,
  mmddDe,
  joursAvant,
  anniversairesAVenir,
  motAnniversaire,
  FETES,
} from '../fetes'

describe('feteDuJour', () => {
  it('le 9 août, c’est la Saint-Amour (Ersan, 07/08)', () => {
    const f = feteDuJour(new Date(2026, 7, 9, 21, 0))
    expect(f?.nom).toBe('la Saint-Amour')
    expect(f?.mot).toContain('emmène')
  })
  it('un soir ordinaire : rien à fêter', () => {
    expect(feteDuJour(new Date(2026, 7, 7))).toBeNull()
  })
  it('toutes les fêtes ont un format MM-DD valide', () => {
    for (const f of FETES) expect(f.mmdd).toMatch(/^\d{2}-\d{2}$/)
  })
})

describe('joursAvant — jour+mois, jamais l’année', () => {
  const auj = new Date(2026, 7, 7) // 7 août 2026
  it('aujourd’hui = 0, demain = 1', () => {
    expect(joursAvant('08-07', auj)).toBe(0)
    expect(joursAvant('08-08', auj)).toBe(1)
  })
  it('une date passée cette année bascule sur l’an prochain', () => {
    expect(joursAvant('01-15', auj)).toBe(161) // 15 janvier 2027
  })
  it('mmddDe fabrique le bon format', () => {
    expect(mmddDe(new Date(2026, 7, 9))).toBe('08-09')
  })
  it('formats tordus → null, jamais une exception', () => {
    expect(joursAvant(undefined, auj)).toBeNull()
    expect(joursAvant('1990-08-09', auj)).toBeNull()
    expect(joursAvant('13-40', auj)).toBeNull()
  })
})

describe('anniversairesAVenir — le cercle d’abord', () => {
  const auj = new Date(2026, 7, 7)
  const cercle = [
    { prenom: 'ninon', anniversaire: '08-09' },
    { prenom: 'karim', anniversaire: '08-07' },
    { prenom: 'léa', anniversaire: '12-25' }, // hors horizon 30 j
    { prenom: 'sans-date' },
  ]
  it('trie du plus proche au plus lointain, horizon 30 jours', () => {
    const v = anniversairesAVenir(cercle, auj)
    expect(v.map((a) => a.prenom)).toEqual(['karim', 'ninon'])
    expect(v[0].dans).toBe(0)
    expect(v[1].dans).toBe(2)
  })
  it('les phrases au crayon', () => {
    expect(motAnniversaire({ prenom: 'karim', dans: 0 })).toBe('c’est l’anniversaire de karim !')
    expect(motAnniversaire({ prenom: 'ninon', dans: 1 })).toBe('l’anniversaire de ninon, c’est demain.')
    expect(motAnniversaire({ prenom: 'léa', dans: 12 })).toBe('l’anniversaire de léa dans 12 jours.')
  })
})
