// ── tests du type d'un lieu (glyphes de la carte) — pur, sans DOM ──────
import { describe, it, expect } from 'vitest'
import { typeDeLieu, labelTypeLieu, svgTypeLieu, TYPES_LIEU } from '../typesLieu'

const lieu = (description: string | undefined, envies: string[] = []) => ({ description, envies })

describe('typeDeLieu — la description fait foi', () => {
  it('reconnaît les grandes familles depuis le texte importé', () => {
    expect(typeDeLieu(lieu('Bar à cocktails, ambiance prohibition'))).toBe('bar')
    expect(typeDeLieu(lieu('disco / club'))).toBe('club')
    expect(typeDeLieu(lieu('Salon de thé et brunch'))).toBe('cafe')
    expect(typeDeLieu(lieu('street-food / tacos'))).toBe('street')
    expect(typeDeLieu(lieu('gastro palace'))).toBe('gastro')
    expect(typeDeLieu(lieu('Restaurant de nouilles au sarrasin (soba)'))).toBe('resto')
  })

  it('sans description parlante : les envies décident', () => {
    expect(typeDeLieu(lieu(undefined, ['apéro']))).toBe('bar')
    expect(typeDeLieu(lieu('', ['tranquilo']))).toBe('cafe')
    expect(typeDeLieu(lieu('93100 Montreuil', ['alloco']))).toBe('street')
  })

  it('défaut : resto (jamais d’inconnu sur la carte)', () => {
    expect(typeDeLieu(lieu(undefined, []))).toBe('resto')
  })
})

describe('les glyphes et les mots', () => {
  it('chaque type a son glyphe monoline et son mot', () => {
    for (const t of TYPES_LIEU) {
      expect(svgTypeLieu(t)).toContain('<svg')
      expect(svgTypeLieu(t)).toContain('stroke')
      expect(labelTypeLieu(t).length).toBeGreaterThan(2)
    }
  })
  it('jamais d’émoji dans le chrome — que du trait SVG', () => {
    for (const t of TYPES_LIEU) {
      expect(svgTypeLieu(t)).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
    }
  })
})
