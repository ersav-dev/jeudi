import { describe, it, expect } from 'vitest'
import { inviteAMontrer, jourCivil } from '../pellicule'

// 8 août 2026, 21 h locales
const SOIR = new Date(2026, 7, 8, 21, 0, 0).getTime()
// 9 août 2026, 1 h du matin — encore « la même soirée » pour l'utilisateur,
// mais déjà un autre jour civil
const NUIT = new Date(2026, 7, 9, 1, 0, 0).getTime()

describe('jourCivil', () => {
  it('rend le jour LOCAL, pas UTC', () => {
    expect(jourCivil(SOIR)).toBe('2026-08-08')
    expect(jourCivil(NUIT)).toBe('2026-08-09')
  })

  it('remplit les zéros', () => {
    expect(jourCivil(new Date(2026, 0, 3, 12).getTime())).toBe('2026-01-03')
  })
})

describe('inviteAMontrer', () => {
  it('ne dit rien quand la pellicule a déjà des soirées', () => {
    expect(inviteAMontrer(false, null, SOIR)).toBe(false)
  })

  it('paraît la première fois de la journée', () => {
    expect(inviteAMontrer(true, null, SOIR)).toBe(true)
  })

  it('ne se répète pas le même jour — une invitation ne se radote pas', () => {
    expect(inviteAMontrer(true, '2026-08-08', SOIR)).toBe(false)
  })

  it('revient le lendemain', () => {
    expect(inviteAMontrer(true, '2026-08-07', SOIR)).toBe(true)
  })

  it('revient après minuit, même en pleine soirée', () => {
    expect(inviteAMontrer(true, '2026-08-08', NUIT)).toBe(true)
  })
})
