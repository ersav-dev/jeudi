// ── tests du grand jeudi (helpers purs, sans DOM ni horloge truquée) ────
import { describe, it, expect } from 'vitest'
import { estCeLeGrandJeudi, prochainGrandJeudi, joursAvantGrandJeudi } from '../grandJeudi'

// midi local : à l'abri des surprises de fuseaux/minuit
const d = (iso: string) => new Date(`${iso}T12:00:00`)
const isoDe = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`

describe('estCeLeGrandJeudi — le 1ᵉʳ jeudi du mois, rien d’autre', () => {
  it('oui : le 1ᵉʳ jeudi (2026-07-02, 2026-08-06, 2026-01-01)', () => {
    expect(estCeLeGrandJeudi(d('2026-07-02'))).toBe(true)
    expect(estCeLeGrandJeudi(d('2026-08-06'))).toBe(true)
    expect(estCeLeGrandJeudi(d('2026-01-01'))).toBe(true) // le mois commence un jeudi
  })
  it('non : le 2ᵉ jeudi du mois (2026-07-09)', () => {
    expect(estCeLeGrandJeudi(d('2026-07-09'))).toBe(false)
  })
  it('non : un autre jour de la semaine (2026-07-11, samedi)', () => {
    expect(estCeLeGrandJeudi(d('2026-07-11'))).toBe(false)
  })
  it("l'heure ne compte pas : le jour J à 23h59 reste le grand jeudi", () => {
    expect(estCeLeGrandJeudi(new Date('2026-07-02T23:59:00'))).toBe(true)
  })
})

describe('prochainGrandJeudi — le jour même compris', () => {
  it('le jour J → cette date même', () => {
    expect(isoDe(prochainGrandJeudi(d('2026-07-02')))).toBe('2026-07-02')
  })
  it('après le rendez-vous du mois → celui du mois suivant', () => {
    expect(isoDe(prochainGrandJeudi(d('2026-07-11')))).toBe('2026-08-06')
  })
  it('avant le rendez-vous du mois → celui de CE mois (2026-12-01 → 2026-12-03)', () => {
    expect(isoDe(prochainGrandJeudi(d('2026-12-01')))).toBe('2026-12-03')
  })
  it("le passage d'année : après le 3 décembre 2026 → 7 janvier 2027", () => {
    expect(isoDe(prochainGrandJeudi(d('2026-12-04')))).toBe('2027-01-07')
  })
})

describe('joursAvantGrandJeudi — la promesse « dans N jours »', () => {
  it('0 le jour J', () => {
    expect(joursAvantGrandJeudi(d('2026-07-02'))).toBe(0)
  })
  it('26 jours entre le 11 juillet et le 6 août 2026', () => {
    expect(joursAvantGrandJeudi(d('2026-07-11'))).toBe(26)
  })
  it('1 jour la veille (2026-12-02 → 2026-12-03)', () => {
    expect(joursAvantGrandJeudi(d('2026-12-02'))).toBe(1)
  })
})
