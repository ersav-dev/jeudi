// ── tests du croquis de paris : zones ↔ chips, comptage bbox ───────────
import { describe, it, expect, vi } from 'vitest'

// autour.ts importe db.ts qui importe supabase : on neutralise (comme recherche.test)
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}))

import { ZONES_CROQUIS, compterSpotsZones } from '../croquisZones'
import { POINTS_REPERE } from '../autour'

describe('croquis de paris — zones ↔ chips « autour de »', () => {
  it('chaque zone active un repère qui EXISTE (jamais un filtre fantôme)', () => {
    const noms = new Set(POINTS_REPERE.map((p) => p.nom))
    for (const z of ZONES_CROQUIS) {
      expect(noms.has(z.repere), `zone « ${z.etiquette} » → repère inconnu « ${z.repere} »`).toBe(true)
    }
  })

  it('une zone par repère, pas de doublon', () => {
    const reperes = ZONES_CROQUIS.map((z) => z.repere)
    expect(new Set(reperes).size).toBe(reperes.length)
  })

  it('chaque repère tombe dans la bbox de sa propre zone (le croquis dit vrai)', () => {
    for (const z of ZONES_CROQUIS) {
      const p = POINTS_REPERE.find((r) => r.nom === z.repere)!
      const [latMin, latMax, lngMin, lngMax] = z.bbox
      expect(p.lat, `${z.repere} : lat hors bbox`).toBeGreaterThanOrEqual(latMin)
      expect(p.lat, `${z.repere} : lat hors bbox`).toBeLessThan(latMax)
      expect(p.lng, `${z.repere} : lng hors bbox`).toBeGreaterThanOrEqual(lngMin)
      expect(p.lng, `${z.repere} : lng hors bbox`).toBeLessThan(lngMax)
    }
  })

  it('les bboxes sont deux à deux disjointes (un spot = une seule zone)', () => {
    for (let i = 0; i < ZONES_CROQUIS.length; i++) {
      for (let j = i + 1; j < ZONES_CROQUIS.length; j++) {
        const [aLatMin, aLatMax, aLngMin, aLngMax] = ZONES_CROQUIS[i].bbox
        const [bLatMin, bLatMax, bLngMin, bLngMax] = ZONES_CROQUIS[j].bbox
        // demi-ouvert : [min, max[ — se toucher sur une frontière n'est PAS se recouvrir
        const disjoint = aLatMax <= bLatMin || bLatMax <= aLatMin || aLngMax <= bLngMin || bLngMax <= aLngMin
        expect(disjoint, `${ZONES_CROQUIS[i].repere} recouvre ${ZONES_CROQUIS[j].repere}`).toBe(true)
      }
    }
  })
})

describe('croquis de paris — compterSpotsZones', () => {
  it('compte dedans, ignore dehors', () => {
    const comptes = compterSpotsZones([
      { lat: 48.8584, lng: 2.347 }, // châtelet même
      { lat: 48.8532, lng: 2.3692 }, // bastille même
      { lat: 48.8555, lng: 2.34 }, // les halles → châtelet
      { lat: 48.8535, lng: 2.29 }, // le champ-de-mars → tour eiffel (Paris couvert !)
      { lat: 48.828, lng: 2.435 }, // bois de vincennes : hors du carnet
      { lat: 43.2965, lng: 5.3698 }, // marseille : très loin du carnet
    ])
    expect(comptes['Châtelet']).toBe(2)
    expect(comptes['Bastille']).toBe(1)
    expect(comptes['Tour Eiffel']).toBe(1)
    const total = Object.values(comptes).reduce((a, b) => a + b, 0)
    expect(total).toBe(4) // les deux hors zones ne comptent nulle part
  })

  it('frontière demi-ouverte : un spot pile sur la limite compte UNE fois', () => {
    // lng 2.368 = frontière république/châtelet (exclu) ↔ bastille (inclus)
    const comptes = compterSpotsZones([{ lat: 48.865, lng: 2.368 }])
    expect(comptes['Bastille']).toBe(1)
    expect(comptes['République']).toBe(0)
    expect(Object.values(comptes).reduce((a, b) => a + b, 0)).toBe(1)
  })

  it('sans lieux : toutes les zones à 0 (rendu pâle, pas de nombre)', () => {
    const comptes = compterSpotsZones([])
    for (const z of ZONES_CROQUIS) expect(comptes[z.repere]).toBe(0)
  })
})
