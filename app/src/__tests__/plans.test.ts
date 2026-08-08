// ── tests du mode « je sais pas » (moteur pur : graine INJECTÉE, jamais Math.random) ──
import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}))

import { tirerPlans, nomZone, type Plan } from '../plans'
import { type Lieu, distanceM } from '../db'

function mkLieu(partiel: Partial<Lieu> & { id: string; nom: string; lat: number; lng: number }): Lieu {
  return {
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

// trois grappes bien distinctes (canal ~2,9 km · sorbonne · batignolles),
// chacune avec 2 spots « potos » et 2 spots « solo » à moins de 400 m.
// un spot fermé (10h-14h) traîne dans la première grappe : il ne doit JAMAIS sortir.
function grappe(prefixe: string, lat: number, lng: number, quartier: string): Lieu[] {
  return [
    mkLieu({
      id: `${prefixe}-bar`, nom: `bar ${prefixe}`, lat, lng,
      envies: ['apéro'], compagnies: ['potos'],
      adresse: `Bar, Rue Test, Quartier ${quartier}`,
    }),
    mkLieu({
      id: `${prefixe}-resto`, nom: `resto ${prefixe}`, lat: lat + 0.001, lng,
      envies: ['resto'], compagnies: ['potos'],
    }),
    mkLieu({
      id: `${prefixe}-comptoir`, nom: `comptoir ${prefixe}`, lat, lng: lng + 0.0015,
      envies: ['incognito'], compagnies: ['solo'],
    }),
    mkLieu({
      id: `${prefixe}-table`, nom: `table ${prefixe}`, lat: lat + 0.001, lng: lng + 0.0015,
      envies: ['tranquilo'], compagnies: ['solo'],
    }),
  ]
}

const LIEUX: Lieu[] = [
  ...grappe('canal', 48.872, 2.366, 'du Canal'),
  ...grappe('sorbonne', 48.846, 2.344, 'de la Sorbonne'),
  ...grappe('batignolles', 48.885, 2.315, 'des Batignolles'),
  mkLieu({
    id: 'ferme', nom: 'fermé le soir', lat: 48.8715, lng: 2.3665,
    envies: ['resto'], horaires: [10, 14], // déjeuner seulement → fermé à 22h
  }),
]

const SOIR = new Date('2026-07-10T22:00:00')
const ids = (plans: Plan[]) => plans.flatMap((p) => p.spots.map((s) => s.lieu.id))

describe('tirerPlans', () => {
  it('même graine = mêmes plans (zones, spots, accroches)', () => {
    const a = tirerPlans(LIEUX, 'potos', 42, { maintenant: SOIR })
    const b = tirerPlans(LIEUX, 'potos', 42, { maintenant: SOIR })
    expect(a).toEqual(b)
    expect(a.length).toBe(3)
  })

  it('zones cohérentes : les 2 spots d’un plan restent à moins de 800 m', () => {
    for (const graine of [1, 7, 99]) {
      for (const p of tirerPlans(LIEUX, 'potos', graine, { maintenant: SOIR })) {
        expect(p.spots.length).toBe(2)
        expect(distanceM(p.spots[0].lieu, p.spots[1].lieu)).toBeLessThan(800)
      }
    }
  })

  it('pas de doublon de spot entre les plans d’un même tirage', () => {
    for (const graine of [3, 12, 77]) {
      const tous = ids(tirerPlans(LIEUX, 'solo', graine, { maintenant: SOIR }))
      expect(new Set(tous).size).toBe(tous.length)
    }
  })

  it('solo ≠ potos : la compagnie change la sélection', () => {
    const solo = ids(tirerPlans(LIEUX, 'solo', 42, { maintenant: SOIR }))
    const potos = ids(tirerPlans(LIEUX, 'potos', 42, { maintenant: SOIR }))
    expect(solo.length).toBeGreaterThan(0)
    expect(potos.length).toBeGreaterThan(0)
    // les spots « solo » et « potos » du jeu de données sont disjoints
    expect(solo.filter((id) => potos.includes(id))).toEqual([])
  })

  it('un lieu fermé à cette heure ne sort jamais', () => {
    for (let graine = 1; graine <= 15; graine++) {
      expect(ids(tirerPlans(LIEUX, 'potos', graine, { maintenant: SOIR }))).not.toContain('ferme')
      expect(ids(tirerPlans(LIEUX, 'solo', graine, { maintenant: SOIR }))).not.toContain('ferme')
    }
  })

  it('les paires sont complémentaires : jamais deux envies principales identiques', () => {
    for (const graine of [5, 21, 63]) {
      for (const p of tirerPlans(LIEUX, 'potos', graine, { maintenant: SOIR })) {
        const [e1, e2] = p.spots.map((s) => s.lieu.envies[0])
        expect(e1).not.toBe(e2)
      }
    }
  })

  // LA RÈGLE (07/08) : on ne dîne qu'une fois — jamais deux « manger »
  // dans un plan, quelle que soit la compagnie. Deux « boire », oui.
  const MANGER = new Set(['resto', 'gastro', 'alloco', 'tranquilo'])
  it('jamais deux « manger » dans un même plan (solo compris)', () => {
    for (const compagnie of ['solo', 'duo', 'potos'] as const) {
      for (const graine of [3, 17, 44, 90]) {
        for (const p of tirerPlans(LIEUX, compagnie, graine, { maintenant: SOIR })) {
          const tables = p.spots.filter((s) => MANGER.has(s.lieu.envies[0] ?? '')).length
          expect(tables).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('un coin qui n’a QUE des restos ne produit aucun plan à deux tables', () => {
    // deux restos voisins, rien d'autre à portée : plutôt aucun plan qu'un
    // plan à deux tables
    const queDesTables: Lieu[] = [
      mkLieu({ id: 'r1', nom: 'resto un', lat: 48.86, lng: 2.35, envies: ['resto'] }),
      mkLieu({ id: 'r2', nom: 'resto deux', lat: 48.8605, lng: 2.35, envies: ['gastro'] }),
    ]
    for (const graine of [1, 9, 33]) {
      expect(tirerPlans(queDesTables, 'solo', graine, { maintenant: SOIR })).toHaveLength(0)
    }
  })

  it('deux « boire » restent une soirée valable (bar puis bar/boîte)', () => {
    // deux bars voisins : le plan a le droit d'exister
    const queDesBars: Lieu[] = [
      mkLieu({ id: 'b1', nom: 'bar un', lat: 48.86, lng: 2.35, envies: ['apéro'] }),
      mkLieu({ id: 'b2', nom: 'boîte deux', lat: 48.8605, lng: 2.35, envies: ['turbo'] }),
    ]
    const plans = tirerPlans(queDesBars, 'solo', 7, { maintenant: SOIR })
    expect(plans.length).toBe(1)
    expect(plans[0].spots).toHaveLength(2)
  })
})

describe('nomZone', () => {
  it('prend le quartier de l’adresse, article viré', () => {
    const l = mkLieu({
      id: 'z', nom: 'Suan Thai', lat: 0, lng: 0,
      adresse: 'Suan Thai, Rue de Bretagne, Quartier des Enfants-Rouges',
    })
    expect(nomZone(l)).toBe('Enfants-Rouges')
  })

  it('sinon la rue, sinon « autour de » le lieu', () => {
    const rue = mkLieu({ id: 'r', nom: 'X', lat: 0, lng: 0, adresse: 'X, Rue Lecourbe' })
    expect(nomZone(rue)).toBe('rue Lecourbe')
    const nu = mkLieu({ id: 'n', nom: 'Chez Momo', lat: 0, lng: 0 })
    expect(nomZone(nu)).toBe('autour de Chez Momo')
  })
})
