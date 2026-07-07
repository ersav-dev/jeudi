// ── tests de la fusion des « autres voix » (pur, sans DOM ni Supabase) ──
import { describe, it, expect } from 'vitest'
import { fusionnerTips } from '../tips'
import type { TipCercle } from '../db'

/** un tip cloud (auteurId présent) ou seed (décor, sans auteurId) */
const tip = (auteur: string, note: string, auteurId?: string): TipCercle =>
  auteurId ? { auteur, titre: '', note, auteurId } : { auteur, titre: 'décor', note }

describe('fusionnerTips', () => {
  it('met les tips cloud DEVANT les tips seed', () => {
    const cloud = [tip('Léa', 'banquette du fond', 'id-lea')]
    const seed = [tip('Karim', 'vise le comptoir')]
    const out = fusionnerTips(cloud, seed)
    expect(out.map((t) => t.auteur)).toEqual(['Léa', 'Karim'])
    expect(out[0]?.auteurId).toBe('id-lea')
    expect(out[1]?.auteurId).toBeUndefined()
  })

  it('dédoublonne par auteur+texte — le cloud fait foi', () => {
    const cloud = [tip('Léa', 'banquette du fond', 'id-lea')]
    const seed = [tip('LÉA', '  banquette du fond '), tip('Léa', 'un autre mot')]
    const out = fusionnerTips(cloud, seed)
    // le doublon exact (casse/espaces indifférents) saute, l'autre mot reste
    expect(out).toHaveLength(2)
    expect(out[0]?.auteurId).toBe('id-lea')
    expect(out[1]?.note).toBe('un autre mot')
  })

  it('garde le même texte porté par DEUX voix différentes', () => {
    const out = fusionnerTips([tip('Léa', 'vise le comptoir', 'id-lea')], [tip('Karim', 'vise le comptoir')])
    expect(out).toHaveLength(2)
  })

  it('jette les tips au texte vide (vidé = supprimé)', () => {
    const out = fusionnerTips([tip('Léa', '   ', 'id-lea')], [tip('Karim', '')])
    expect(out).toEqual([])
  })

  it('sans cloud : le seed passe tel quel (et inversement)', () => {
    const seed = [tip('Karim', 'avant 19h30'), tip('Léa', 'lumière douce')]
    expect(fusionnerTips([], seed)).toEqual(seed)
    const cloud = [tip('Zoé', 'demande Momo', 'id-zoe')]
    expect(fusionnerTips(cloud, [])).toEqual(cloud)
  })
})
