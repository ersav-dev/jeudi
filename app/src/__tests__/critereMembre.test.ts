// ── le critère du membre (son obsession, singulier) — logique PURE ──
import { describe, it, expect } from 'vitest'
import { normaliserCritere, critereDeclare, CRITERE_MAX } from '../critereMembre'

describe('normaliserCritere : trim + plafond, jamais undefined', () => {
  it('trim les espaces autour', () => {
    expect(normaliserCritere('  le bruit  ')).toBe('le bruit')
  })

  it('vide (ou blanc) → chaîne vide, jamais une exception', () => {
    expect(normaliserCritere('')).toBe('')
    expect(normaliserCritere('   ')).toBe('')
  })

  it('plafonne à CRITERE_MAX caractères', () => {
    const long = 'x'.repeat(CRITERE_MAX + 20)
    expect(normaliserCritere(long)).toHaveLength(CRITERE_MAX)
  })
})

describe('critereDeclare : le distingue du défaut d’onboarding', () => {
  it('le défaut ("le feeling", jamais touché) ne compte pas comme déclaré', () => {
    expect(critereDeclare('le feeling')).toBe(false)
    expect(critereDeclare('  Le Feeling  ')).toBe(false) // insensible à la casse/espaces
  })

  it('un vrai critère (« Karim EST le bruit ») compte comme déclaré', () => {
    expect(critereDeclare('le bruit')).toBe(true)
    expect(critereDeclare('la lumière')).toBe(true)
  })

  it('vide ou absent → jamais déclaré', () => {
    expect(critereDeclare('')).toBe(false)
    expect(critereDeclare('   ')).toBe(false)
    expect(critereDeclare(undefined)).toBe(false)
  })

  it('un défaut personnalisé (autre profil) est respecté', () => {
    expect(critereDeclare('la playlist', 'la playlist')).toBe(false)
    expect(critereDeclare('le bruit', 'la playlist')).toBe(true)
  })
})
