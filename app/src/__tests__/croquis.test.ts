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

import { ZONES_CROQUIS, compterSpotsZones, poserMarqueur, projeterSurCroquis } from '../croquisZones'
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

describe('croquis de paris — poserMarqueur (le lieu reconnu se pose)', () => {
  it('un point dans paris tombe DEDANS, à sa projection exacte', () => {
    // edgar quinet (montparnasse) — LE cas d'usage : « comme ça on est sûr »
    const m = poserMarqueur(48.8408, 2.3252)
    expect(m.dedans).toBe(true)
    const p = projeterSurCroquis(48.8408, 2.3252)
    expect(m.x).toBe(p.x)
    expect(m.y).toBe(p.y)
  })

  it('un lieu hors du carnet se colle au bord (jamais hors cadre)', () => {
    // marseille : très au sud → borné en bas du dessin
    const m = poserMarqueur(43.2965, 5.3698)
    expect(m.dedans).toBe(false)
    expect(m.x).toBeGreaterThanOrEqual(14)
    expect(m.x).toBeLessThanOrEqual(326)
    expect(m.y).toBeGreaterThanOrEqual(14)
    expect(m.y).toBeLessThanOrEqual(246)
  })

  it('hors cadre : la flèche pointe vers le vrai lieu', () => {
    // saint-denis, plein nord → le signe au bord haut, tourné vers le haut
    const nord = poserMarqueur(48.9362, 2.3574)
    expect(nord.dedans).toBe(false)
    expect(nord.angle).toBeLessThan(0) // y SVG vers le bas : le haut = angle négatif
    // versailles, à l'ouest → tourné vers la gauche (|angle| > 90°)
    const ouest = poserMarqueur(48.8049, 2.1204)
    expect(ouest.dedans).toBe(false)
    expect(Math.abs(ouest.angle)).toBeGreaterThan(90)
  })

  it('dedans : angle neutre (0) — la flèche ne sert pas', () => {
    expect(poserMarqueur(48.8584, 2.347).angle).toBe(0) // châtelet
  })
})
