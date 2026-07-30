// ── tests du moteur de groupe (pur, sans DOM ni Supabase) ──────────────
// on mocke ../supabase : db.ts appelle onAuthStateChange au chargement.
import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}))

import { triangule, scoreLieuGroupe, reactionMembre, verdictDeGroupe, type MembrePref } from '../groupe'
import { maPosition, type Lieu } from '../db'

// fabrique un lieu minimal valide (les champs optionnels restent absents)
function mkLieu(partiel: Partial<Lieu> & { id: string; nom: string }): Lieu {
  return {
    lat: 48.87,
    lng: 2.35,
    note: '',
    visibilite: 'cercle',
    envies: [],
    compagnies: [],
    photos: [],
    statut: 'actif',
    creeLe: '2026-01-01T00:00:00.000Z',
    source: 'manuel',
    ...partiel,
  }
}

const membre = (id: string, envies: MembrePref['envies'], budgetMax: MembrePref['budgetMax'] = 2): MembrePref => ({
  id,
  prenom: id,
  envies,
  budgetMax,
})

describe('triangule', () => {
  it('rend le barycentre des points de départ', () => {
    const c = triangule([
      { lat: 48.0, lng: 2.0 },
      { lat: 50.0, lng: 4.0 },
    ])
    expect(c.lat).toBeCloseTo(49.0, 10)
    expect(c.lng).toBeCloseTo(3.0, 10)
  })

  it('liste vide → repli fourni, jamais {0,0}', () => {
    const repli = { lat: 48.86, lng: 2.35 }
    const c = triangule([], repli)
    expect(c).toEqual(repli)
    expect(c).not.toEqual({ lat: 0, lng: 0 })
  })
})

describe('scoreLieuGroupe', () => {
  const groupe = [membre('a', ['apéro']), membre('b', ['apéro'])]
  const centre = { lat: 48.87, lng: 2.35 }

  it('demi-crédit fiche vide : un lieu sans envies ne bat pas un lieu taggé qui plaît à tous', () => {
    const tagge = mkLieu({ id: 't', nom: 'taggé', envies: ['apéro'] })
    const vide = mkLieu({ id: 'v', nom: 'vide', envies: [] })
    const sT = scoreLieuGroupe(tagge, groupe, centre)
    const sV = scoreLieuGroupe(vide, groupe, centre)
    expect(sT.score).toBeGreaterThan(sV.score)
    expect(sT.satisfaits).toBe(2)
    expect(sV.satisfaits).toBe(0) // le demi-crédit ne compte pas comme « satisfait »
  })

  it('budget inconnu < budget ok (demi-confiance des fiches sans météo)', () => {
    const budgetOk = mkLieu({ id: 'ok', nom: 'ok', envies: ['apéro'], meteo: 'pluie' })
    const inconnu = mkLieu({ id: 'inc', nom: 'inconnu', envies: ['apéro'] })
    const sOk = scoreLieuGroupe(budgetOk, groupe, centre)
    const sInc = scoreLieuGroupe(inconnu, groupe, centre)
    expect(sOk.score).toBeGreaterThan(sInc.score)
    expect(sOk.budgetOk).toBe(true)
    expect(sInc.budgetOk).toBe(true) // inconnu = pas pénalisé, juste moins bonifié
  })
})

describe('reactionMembre', () => {
  it('« trop loin » se juge depuis le centre passé, pas depuis maPosition', () => {
    // lieu posé PILE sur ma position : si le moteur jugeait depuis maPosition,
    // la distance serait 0 et il ne dirait jamais « trop loin ».
    const lieu = mkLieu({ id: 'l', nom: 'lieu', lat: maPosition.lat, lng: maPosition.lng, envies: ['apéro'] })
    const m = membre('a', ['apéro'])
    const centreLoin = { lat: maPosition.lat + 0.1, lng: maPosition.lng } // ~11 km
    expect(reactionMembre(lieu, m, centreLoin)).toBe('trop loin')
    // même lieu, centre sur place → pas trop loin
    expect(reactionMembre(lieu, m, { lat: lieu.lat, lng: lieu.lng })).toBe('chaud')
  })
})

describe('verdictDeGroupe', () => {
  it('cas simple 2 membres : le lieu qui plaît aux deux gagne', () => {
    const groupe = [membre('a', ['apéro']), membre('b', ['apéro', 'resto'])]
    const centre = { lat: 48.87, lng: 2.35 }
    const bon = mkLieu({ id: 'bon', nom: 'bon', envies: ['apéro'], meteo: 'pluie' })
    const mauvais = mkLieu({ id: 'mauvais', nom: 'mauvais', envies: ['gastro'], meteo: 'soleil' })
    const v = verdictDeGroupe([mauvais, bon], groupe, 5, centre)
    expect(v).not.toBeNull()
    if (!v) return
    expect(v.gagnant.lieu.id).toBe('bon')
    expect(v.shortlist).toHaveLength(2)
    expect(v.reactions.comptes.chaud).toBe(2)
  })

  it('aucun lieu → null', () => {
    expect(verdictDeGroupe([], [membre('a', ['apéro'])])).toBeNull()
  })
})
