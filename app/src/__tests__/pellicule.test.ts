// ── tests de la pellicule (pur : ni DOM, ni Supabase, ni horloge réelle) ──
// Les bornes 6h/24h/48h décident de TOUT ce qui se voit sur la carte (la
// taille d'un tas, la fonte d'une feuille, le passage au souvenir) : elles
// se testent au dixième d'heure, pas à l'œil.
import { describe, it, expect } from 'vitest'

import {
  SEUIL_MEMOIRE,
  boussole,
  cleVue,
  construireTas,
  directionCardinale,
  estVu,
  heuresDepuis,
  libelleAge,
  libelleAgeFlou,
  soireeDe,
  taillePolaroid,
  tasVivants,
} from '../pellicule'
import type { Lieu, PhotoLieu } from '../db'

const MAINTENANT = Date.parse('2026-08-03T22:00:00.000Z')
const ilYA = (h: number) => new Date(MAINTENANT - h * 3_600_000).toISOString()

function mkLieu(id: string, photos: PhotoLieu[], partiel: Partial<Lieu> = {}): Lieu {
  return {
    id,
    nom: id,
    lat: 48.87,
    lng: 2.35,
    note: '',
    visibilite: 'cercle',
    envies: [],
    compagnies: [],
    photos,
    statut: 'actif',
    creeLe: '2026-01-01T00:00:00.000Z',
    source: 'manuel',
    ...partiel,
  }
}

const ph = (h: number, qui = 'karim'): PhotoLieu => ({
  type: 'salle',
  url: `p${h}`,
  priseLe: ilYA(h),
  auteurPrenom: qui,
})

describe('heuresDepuis', () => {
  it('compte les heures écoulées', () => {
    expect(heuresDepuis(ilYA(3), MAINTENANT)).toBeCloseTo(3, 6)
  })
  it('ne renvoie jamais un âge négatif (horloge en avance)', () => {
    expect(heuresDepuis(ilYA(-5), MAINTENANT)).toBe(0)
  })
  it('une date illisible est infiniment vieille', () => {
    expect(heuresDepuis('jamais', MAINTENANT)).toBe(Infinity)
  })
})

describe('taillePolaroid — les trois bornes', () => {
  it('pile sur les bornes, le tas reste dans le palier du dessus', () => {
    expect(taillePolaroid(0)).toBe(80)
    expect(taillePolaroid(6)).toBe(80)
    expect(taillePolaroid(6.1)).toBe(60)
    expect(taillePolaroid(24)).toBe(60)
    expect(taillePolaroid(24.1)).toBe(45)
    expect(taillePolaroid(48)).toBe(45)
    expect(taillePolaroid(48.1)).toBe(34)
    expect(taillePolaroid(24 * 30)).toBe(34)
  })
})

describe('libelleAge — un fait, pas un signal', () => {
  it('dit l’heure, puis hier, puis les jours', () => {
    expect(libelleAge(0.4)).toBe('à l’instant')
    expect(libelleAge(2)).toBe('il y a 2h')
    expect(libelleAge(23.6)).toBe('il y a 24h')
    expect(libelleAge(30)).toBe('hier')
    expect(libelleAge(72)).toBe('il y a 3j')
  })
  it('la version publique reste floue (vie privée)', () => {
    expect(libelleAgeFlou(2)).toBe('ce soir')
    expect(libelleAgeFlou(30)).toBe('hier soir')
    expect(libelleAgeFlou(72)).toBe('il y a 3j')
  })
})

describe('soireeDe — la nuit ne s’arrête pas à minuit', () => {
  it('2h du matin appartient à la soirée de la veille', () => {
    expect(soireeDe('2026-08-03T02:00:00')).toBe('2026-08-02')
  })
  it('23h appartient à sa propre soirée', () => {
    expect(soireeDe('2026-08-03T23:00:00')).toBe('2026-08-03')
  })
  it('6h du matin bascule sur la journée qui commence', () => {
    expect(soireeDe('2026-08-03T06:00:00')).toBe('2026-08-03')
    expect(soireeDe('2026-08-03T05:59:00')).toBe('2026-08-02')
  })
  it('une date illisible ne casse rien', () => {
    expect(soireeDe('n’importe quoi')).toBe('')
  })
})

describe('construireTas', () => {
  const lieux = [
    mkLieu('perchoir', [ph(30), ph(2, 'karim'), ph(5, 'léa')]),
    mkLieu('jeannette', [ph(16, 'marie')]),
    mkLieu('bambino', [ph(200, 'léa'), ph(210, 'léa')]),
    mkLieu('vide', []),
    mkLieu('sans-date', [{ type: 'salle', url: 'x' }]),
  ]

  it('ne garde que les spots avec au moins une photo datée', () => {
    const t = construireTas(lieux, MAINTENANT)
    expect(t.map((x) => x.lieu.id)).toEqual(['perchoir', 'jeannette', 'bambino'])
  })

  it('trie du plus frais au plus ancien — la nuit, pas le quartier', () => {
    const t = construireTas(lieux, MAINTENANT)
    expect(t[0].fraicheur).toBeLessThan(t[1].fraicheur)
    expect(t[1].fraicheur).toBeLessThan(t[2].fraicheur)
  })

  it('le tirage du dessus est le plus frais, et il signe le tas', () => {
    const [perchoir] = construireTas(lieux, MAINTENANT)
    expect(perchoir.auteur).toBe('karim')
    expect(perchoir.fraicheur).toBeCloseTo(2, 6)
    expect(perchoir.taille).toBe(80)
    expect(perchoir.vivantes).toBe(3)
    expect(perchoir.photos).toHaveLength(3)
  })

  it('au-delà de 48h : un seul tirage, en souvenir, jamais “pas vu”', () => {
    const bambino = construireTas(lieux, MAINTENANT).find((t) => t.lieu.id === 'bambino')!
    expect(bambino.souvenir).toBe(true)
    expect(bambino.photos).toHaveLength(1)
    expect(bambino.taille).toBe(34)
    expect(bambino.vu).toBe(true)
  })

  it('les feuilles mortes (>48h) tombent d’un tas encore vivant', () => {
    const t = construireTas([mkLieu('mixte', [ph(3), ph(60), ph(80)])], MAINTENANT)[0]
    expect(t.souvenir).toBe(false)
    expect(t.vivantes).toBe(1)
    expect(t.photos).toHaveLength(1)
  })

  it('une feuille qui vient de mourir tombe encore à l’écran (1h de deuil)', () => {
    const t = construireTas([mkLieu('chute', [ph(3), ph(48.5)])], MAINTENANT)[0]
    expect(t.mortes).toHaveLength(1)
    expect(t.photos).toHaveLength(1)
  })

  it('une feuille morte depuis plus d’une heure n’est plus rendue', () => {
    const t = construireTas([mkLieu('vieille-chute', [ph(3), ph(70)])], MAINTENANT)[0]
    expect(t.mortes).toHaveLength(0)
  })

  it('un souvenir ne rejoue aucune chute', () => {
    const t = construireTas([mkLieu('souvenir', [ph(49), ph(48.5)])], MAINTENANT)[0]
    expect(t.souvenir).toBe(true)
    expect(t.mortes).toHaveLength(0)
  })

  it('une photo qui sèche encore est en développement', () => {
    const t = construireTas(
      [
        mkLieu('neuf', [
          { ...ph(0.2), visibleLe: new Date(MAINTENANT + 2_800_000).toISOString() },
        ]),
      ],
      MAINTENANT,
    )[0]
    expect(t.enDeveloppement).toBe(true)
  })

  it('le sceau se lit par (lieu, soirée)', () => {
    const t0 = construireTas(lieux, MAINTENANT)[0]
    const vues = new Set([cleVue('perchoir', t0.soiree)])
    const t = construireTas(lieux, MAINTENANT, vues)
    expect(t[0].vu).toBe(true)
    expect(t[1].vu).toBe(false)
    expect(estVu(t[0], vues)).toBe(true)
  })

  it('le sceau d’HIER ne vaut pas pour la soirée d’aujourd’hui', () => {
    const t0 = construireTas(lieux, MAINTENANT)[0]
    const vues = new Set([cleVue('perchoir', '2026-01-01')])
    expect(construireTas(lieux, MAINTENANT, vues)[0].vu).toBe(false)
    expect(t0.soiree).not.toBe('2026-01-01')
  })

  it('tasVivants écarte les souvenirs', () => {
    const t = construireTas(lieux, MAINTENANT)
    expect(tasVivants(t).map((x) => x.lieu.id)).toEqual(['perchoir', 'jeannette'])
  })

  it('un tirage pile à 48h vit encore, à 48h01 c’est un souvenir', () => {
    expect(construireTas([mkLieu('a', [ph(SEUIL_MEMOIRE)])], MAINTENANT)[0].souvenir).toBe(false)
    expect(construireTas([mkLieu('b', [ph(SEUIL_MEMOIRE + 0.2)])], MAINTENANT)[0].souvenir).toBe(
      true,
    )
  })
})

describe('directionCardinale', () => {
  const paris = { lat: 48.86, lng: 2.35 }
  it('nomme les quatre points', () => {
    expect(directionCardinale(paris, { lat: 48.9, lng: 2.35 })).toBe('au nord')
    expect(directionCardinale(paris, { lat: 48.82, lng: 2.35 })).toBe('au sud')
    expect(directionCardinale(paris, { lat: 48.86, lng: 2.42 })).toBe('à l’est')
    expect(directionCardinale(paris, { lat: 48.86, lng: 2.28 })).toBe('à l’ouest')
  })
  it('nomme les diagonales', () => {
    expect(directionCardinale(paris, { lat: 48.9, lng: 2.42 })).toBe('au nord-est')
  })
})

describe('boussole — elle ne parle que de ce qu’on ne voit pas', () => {
  const centre = { lat: 48.86, lng: 2.35 }
  const auNord = mkLieu('perchoir', [ph(2)], { lat: 48.92, lng: 2.35, nom: 'Le Perchoir' })
  const ici = mkLieu('jeannette', [ph(4, 'marie')], { lat: 48.861, lng: 2.351, nom: 'Chez Jeannette' })

  it('sans le moindre tirage : une invitation, jamais un constat', () => {
    const b = boussole([], new Set(), centre)
    expect(b.texte).toContain('c’est toi qui shootes')
    expect(b.cible).toBeUndefined()
  })

  it('un souvenir seul ne fait pas une nuit', () => {
    const t = construireTas([mkLieu('vieux', [ph(300)])], MAINTENANT)
    expect(boussole(t, new Set(), centre).texte).toContain('la ville se recharge')
  })

  it('du non-lu hors écran : la direction et le nombre de TIRAGES', () => {
    const t = construireTas([auNord, ici], MAINTENANT)
    const b = boussole(t, new Set(['jeannette']), centre)
    expect(b.texte).toBe('au nord, un tirage que tu n’as pas vu →')
    expect(b.cible?.lieu.id).toBe('perchoir')
  })

  it('tout est à l’écran : on nomme la personne et le lieu, on ne compte pas', () => {
    const t = construireTas([auNord, ici], MAINTENANT)
    const b = boussole(t, new Set(['perchoir', 'jeannette']), centre)
    expect(b.texte).toBe('karim a laissé quelque chose à le perchoir.')
    expect(b.cible?.lieu.id).toBe('perchoir')
  })

  it('tout est lu : elle rend la main', () => {
    const t = construireTas([auNord, ici], MAINTENANT)
    const vues = new Set(t.map((x) => cleVue(x.lieu.id, x.soiree)))
    const b = boussole(construireTas([auNord, ici], MAINTENANT, vues), new Set(), centre)
    expect(b.texte).toBe('tout est lu. à toi d’écrire la suite.')
    expect(b.cible).toBeUndefined()
  })
})
