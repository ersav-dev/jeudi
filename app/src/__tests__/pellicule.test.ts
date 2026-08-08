// ── tests de la pellicule : bornes, soirée, sceau — pur, sans DOM ──
import { describe, it, expect } from 'vitest'
import { vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}))

import {
  construireTas,
  photosPellicule,
  taillePolaroid,
  libelleAge,
  soireeDe,
  cleVue,
  estVu,
  estSouvenir,
  construireCarnet,
  libelleNuit,
  parNuits,
  tipDeLaSoiree,
  enDeveloppement,
  directionCardinale,
  ligneBoussole,
  texteBoussole,
  aLieu,
  nombreEnMots,
  grouperTas,
  eventailGrappe,
  couchesComposite,
  tailleMiniature,
  MINIATURE_MAX,
  type CandidatBoussole,
  type PointTas,
} from '../pellicule'
import type { Lieu, PhotoLieu } from '../db'

const MAINTENANT = new Date(2026, 7, 7, 22, 0) // 7 août, 22 h

function mkLieu(id: string, photos: PhotoLieu[]): Lieu {
  return {
    id,
    nom: id,
    lat: 48.86,
    lng: 2.35,
    note: '',
    visibilite: 'cercle',
    envies: [],
    compagnies: [],
    photos,
    statut: 'actif',
    creeLe: '2026-01-01T00:00:00.000Z',
    source: 'manuel',
  }
}
/** une photo prise il y a `h` heures, déjà sèche */
function ph(h: number, extra: Partial<PhotoLieu> = {}): PhotoLieu {
  const prise = new Date(MAINTENANT.getTime() - h * 3600000)
  return {
    type: 'soir',
    url: `x-${h}`,
    priseLe: prise.toISOString(),
    visibleLe: new Date(prise.getTime() + 3600000).toISOString(),
    ...extra,
  }
}

describe('photosPellicule — datée ET sèche, sinon rien', () => {
  it('écarte les photos sans date (les preuves de l’album)', () => {
    const l = mkLieu('a', [{ type: 'salle', url: 'x' }, ph(2)])
    expect(photosPellicule(l, MAINTENANT)).toHaveLength(1)
  })
  it('écarte les preuves MÊME datées (le backfill 0010 les date toutes)', () => {
    const l = mkLieu('a', [ph(700, { type: 'salle' }), ph(2)])
    expect(photosPellicule(l, MAINTENANT)).toHaveLength(1)
  })
  it('une photo qui sèche encore (visible_le futur) n’apparaît pas', () => {
    const l = mkLieu('a', [ph(0.5)]) // visible dans 30 min
    expect(photosPellicule(l, MAINTENANT)).toHaveLength(0)
  })
  it('trie la plus récente d’abord', () => {
    const l = mkLieu('a', [ph(30), ph(2), ph(10)])
    const p = photosPellicule(l, MAINTENANT)
    expect(p.map((x) => x.url)).toEqual(['x-2', 'x-10', 'x-30'])
  })
})

describe('construireTas — du plus frais au plus ancien', () => {
  it('regroupe, mesure la fraîcheur et compte les vivantes', () => {
    const tas = construireTas(
      [mkLieu('vieux', [ph(80)]), mkLieu('chaud', [ph(2), ph(5), ph(60)]), mkLieu('sans', [])],
      MAINTENANT,
    )
    expect(tas.map((t) => t.lieu.id)).toEqual(['chaud', 'vieux'])
    expect(tas[0].vivantes).toBe(2) // la photo de 60 h est morte
    expect(Math.round(tas[0].fraicheurH)).toBe(2)
    expect(tas[0].soiree).toBe('2026-08-07')
  })
})

describe('taillePolaroid — l’échelle du panel (6h/24h/48h)', () => {
  it('80 · 60 · 45 · 34, aux bornes exactes', () => {
    expect(taillePolaroid(2)).toBe(80)
    expect(taillePolaroid(6)).toBe(80)
    expect(taillePolaroid(6.1)).toBe(60)
    expect(taillePolaroid(24)).toBe(60)
    expect(taillePolaroid(30)).toBe(45)
    expect(taillePolaroid(48)).toBe(45)
    expect(taillePolaroid(49)).toBe(34)
  })
  it('estSouvenir au-delà de 48 h', () => {
    expect(estSouvenir(48)).toBe(false)
    expect(estSouvenir(49)).toBe(true)
  })
})

describe('libelleAge — un fait, pas un compteur', () => {
  it('ça se développe… · il y a Xh · hier · il y a Xj', () => {
    expect(libelleAge(0.4)).toBe('ça se développe…')
    expect(libelleAge(3)).toBe('il y a 3h')
    expect(libelleAge(30)).toBe('hier')
    expect(libelleAge(75)).toBe('il y a 3j')
  })
  it('le développement s’arrête pile à 1 h (§1.7)', () => {
    expect(enDeveloppement(0.99)).toBe(true)
    expect(enDeveloppement(1)).toBe(false)
    expect(libelleAge(1)).toBe('il y a 1h')
  })
})

describe('soireeDe — la règle des 6 h du matin', () => {
  it('2 h du matin appartient à la soirée de la VEILLE', () => {
    expect(soireeDe(new Date(2026, 7, 8, 2, 10).toISOString())).toBe('2026-08-07')
  })
  it('22 h appartient à sa propre soirée', () => {
    expect(soireeDe(new Date(2026, 7, 7, 22, 0).toISOString())).toBe('2026-08-07')
  })
  it('7 h du matin bascule sur le jour même', () => {
    expect(soireeDe(new Date(2026, 7, 8, 7, 0).toISOString())).toBe('2026-08-08')
  })
})

describe('le sceau — un par soirée', () => {
  it('estVu lit la clé (lieu, soirée)', () => {
    const [tas] = construireTas([mkLieu('a', [ph(2)])], MAINTENANT)
    expect(estVu(tas, new Set())).toBe(false)
    expect(estVu(tas, new Set([cleVue('a', '2026-08-07')]))).toBe(true)
    // une soirée PRÉCÉDENTE vue ne compte pas : le sceau s'est rallumé
    expect(estVu(tas, new Set([cleVue('a', '2026-08-06')]))).toBe(false)
  })
})

// ── §1.9 · LA LIGNE-BOUSSOLE ─────────────────────────────────────
const CENTRE = { lng: 2.35, lat: 48.86 }
function cand(p: Partial<CandidatBoussole> & { lieuId: string }): CandidatBoussole {
  return {
    nom: p.lieuId,
    lng: CENTRE.lng,
    lat: CENTRE.lat,
    prenom: 'karim',
    vu: false,
    fraicheurH: 3,
    aLEcran: true,
    ...p,
  }
}

describe('directionCardinale — corrigée de la latitude', () => {
  it('les quatre caps', () => {
    expect(directionCardinale(CENTRE, { lng: 2.35, lat: 48.92 })).toBe('nord')
    expect(directionCardinale(CENTRE, { lng: 2.35, lat: 48.8 })).toBe('sud')
    expect(directionCardinale(CENTRE, { lng: 2.45, lat: 48.86 })).toBe('est')
    expect(directionCardinale(CENTRE, { lng: 2.25, lat: 48.86 })).toBe('ouest')
  })
  it('un delta de longitude vaut MOINS qu’un delta de latitude à Paris', () => {
    // 0,05° de longitude ≈ 3,7 km · 0,04° de latitude ≈ 4,4 km → c'est au nord
    expect(directionCardinale(CENTRE, { lng: 2.4, lat: 48.9 })).toBe('nord')
  })
})

describe('ligneBoussole — elle ne parle que de l’invisible', () => {
  it('pellicule vide : elle se tait (l’invitation §1.8 parle seule)', () => {
    expect(ligneBoussole([], CENTRE)).toBeNull()
  })
  it('tout lu → la fin, et une invitation', () => {
    const b = ligneBoussole([cand({ lieuId: 'a', vu: true })], CENTRE)
    expect(b).toEqual({ genre: 'tout-lu' })
    expect(texteBoussole(b!)).toBe('tout est lu. à toi d’écrire la suite.')
  })
  it('non lu HORS écran → le cap le plus chargé, et la carte y va', () => {
    const b = ligneBoussole(
      [
        cand({ lieuId: 'n1', lat: 48.95, aLEcran: false, fraicheurH: 9 }),
        cand({ lieuId: 'n2', lat: 48.94, aLEcran: false, fraicheurH: 2 }),
        cand({ lieuId: 's1', lat: 48.7, aLEcran: false, fraicheurH: 1 }),
      ],
      CENTRE,
    )
    expect(b).toMatchObject({ genre: 'hors-ecran', direction: 'nord', n: 2 })
    // la cible = le plus FRAIS de ce cap-là (n2), jamais un centroïde
    expect(b).toMatchObject({ cible: { lat: 48.94 } })
    expect(texteBoussole(b!)).toBe('au nord, deux tirages que tu n’as pas vus →')
  })
  it('un seul tirage hors champ : la ligne reste au singulier', () => {
    const b = ligneBoussole([cand({ lieuId: 'o', lng: 2.1, aLEcran: false })], CENTRE)
    expect(texteBoussole(b!)).toBe('à l’ouest, un tirage que tu n’as pas vu →')
  })
  it('le hors-champ PASSE AVANT le pas-lu visible', () => {
    const b = ligneBoussole(
      [
        cand({ lieuId: 'ici', fraicheurH: 0.5 }),
        cand({ lieuId: 'loin', lat: 48.95, aLEcran: false, fraicheurH: 20 }),
      ],
      CENTRE,
    )
    expect(b).toMatchObject({ genre: 'hors-ecran' })
  })
  it('tout est à l’écran mais pas lu → elle NOMME une chose', () => {
    const b = ligneBoussole(
      [
        cand({ lieuId: 'p', nom: 'le perchoir', prenom: 'karim', fraicheurH: 2 }),
        cand({ lieuId: 'v', nom: 'la villette', prenom: 'léa', fraicheurH: 12 }),
      ],
      CENTRE,
    )
    expect(b).toMatchObject({ genre: 'nomme', prenom: 'karim', nom: 'le perchoir' })
    expect(texteBoussole(b!)).toBe('karim a laissé quelque chose au perchoir.')
  })
  it('elle ne compte JAMAIS des gens — aucun « potes » nulle part', () => {
    const lignes = [
      texteBoussole(ligneBoussole([cand({ lieuId: 'a', lat: 48.95, aLEcran: false })], CENTRE)!),
      texteBoussole(ligneBoussole([cand({ lieuId: 'b' })], CENTRE)!),
      texteBoussole(ligneBoussole([cand({ lieuId: 'c', vu: true })], CENTRE)!),
    ]
    for (const l of lignes) expect(l).not.toMatch(/potes?|personnes?|sont sorti/)
  })
})

describe('aLieu / nombreEnMots — on écrit du français', () => {
  it('les articles se contractent', () => {
    expect(aLieu('le perchoir')).toBe('au perchoir')
    expect(aLieu('les puces')).toBe('aux puces')
    expect(aLieu('la villette')).toBe('à la villette')
    expect(aLieu('l’escale')).toBe('à l’escale')
    expect(aLieu('Bambino')).toBe('à Bambino')
  })
  it('les petits nombres s’écrivent en toutes lettres', () => {
    expect(nombreEnMots(2)).toBe('deux')
    expect(nombreEnMots(9)).toBe('neuf')
    expect(nombreEnMots(12)).toBe('12')
  })
})

// ── §5.2 · LE CLUSTERING DES TAS ─────────────────────────────────
const pt = (lieuId: string, x: number, y: number, fraicheurH = 1, taille = 60): PointTas => ({
  lieuId,
  x,
  y,
  taille,
  fraicheurH,
})

describe('grouperTas — deux tas qui se chevauchent n’en font qu’un', () => {
  it('des tas éloignés restent seuls', () => {
    const g = grouperTas([pt('a', 0, 0), pt('b', 400, 400)])
    expect(g).toHaveLength(2)
    expect(g.every((x) => x.lieux.length === 1)).toBe(true)
  })
  it('deux tas superposés fusionnent, meneuse = la plus FRAÎCHE', () => {
    const g = grouperTas([pt('vieux', 100, 100, 30), pt('frais', 110, 105, 2)])
    expect(g).toHaveLength(1)
    expect(g[0].lieux).toEqual(['frais', 'vieux'])
    expect(g[0]).toMatchObject({ x: 110, y: 105 })
  })
  it('la fusion est TRANSITIVE : A touche B, B touche C → une grappe', () => {
    const g = grouperTas([pt('a', 0, 0, 1), pt('b', 40, 0, 2), pt('c', 80, 0, 3)])
    expect(g).toHaveLength(1)
    expect(g[0].lieux).toEqual(['a', 'b', 'c'])
  })
  it('le bloc prénom/heure compte dans l’encombrement (deux blocs illisibles)', () => {
    // 20 px sous l'autre : les carrés ne se touchent pas, les blocs si
    const g = grouperTas([pt('a', 0, 0, 1), pt('b', 0, 80, 2)])
    expect(g).toHaveLength(1)
  })
  it('les grappes sortent de la plus fraîche à la plus ancienne', () => {
    const g = grouperTas([pt('vieille', 0, 0, 40), pt('fraiche', 500, 0, 1)])
    expect(g.map((x) => x.lieux[0])).toEqual(['fraiche', 'vieille'])
  })
})

describe('eventailGrappe — le déploiement s’ouvre avec le nombre', () => {
  it('une seule suiveuse part droit en haut', () => {
    expect(eventailGrappe(1, 60)).toEqual([{ dx: 0, dy: -60 }])
  })
  it('l’éventail est symétrique et monte toujours', () => {
    const e = eventailGrappe(3, 60)
    expect(e).toHaveLength(3)
    expect(e[0].dx).toBe(-e[2].dx)
    expect(e[1].dx).toBe(0)
    for (const p of e) expect(p.dy).toBeLessThan(0)
  })
  it('rien à déployer = rien', () => {
    expect(eventailGrappe(0)).toEqual([])
  })
})

// ── §5.3 · LA PERF ───────────────────────────────────────────────
describe('couchesComposite — l’ordre du pinceau, et rien de mort', () => {
  it('la feuille la plus lointaine d’abord, la photo du dessus en dernier', () => {
    const c = couchesComposite(['h', 'a', 'b', 'c'], 4)
    expect(c.map((x) => x.src)).toEqual(['c', 'b', 'a', 'h'])
    expect(c[c.length - 1].rot).toBe(-2) // .haut
  })
  it('les feuilles mortes (>48 h) ne sont pas peintes du tout', () => {
    expect(couchesComposite(['h', 'a', 'b', 'c'], 2).map((x) => x.src)).toEqual(['a', 'h'])
    expect(couchesComposite(['h', 'a', 'b'], 1).map((x) => x.src)).toEqual(['h'])
  })
  it('un tas vide ne peint rien', () => {
    expect(couchesComposite([], 3)).toEqual([])
  })
})

describe('tailleMiniature — 2× l’affichage, 168 px plafond (panel)', () => {
  it('jamais au-delà du plafond', () => {
    expect(tailleMiniature(34)).toBe(68)
    expect(tailleMiniature(80)).toBe(160)
    expect(tailleMiniature(120)).toBe(MINIATURE_MAX)
  })
})

// ── LES SOIRS DU CERCLE (§7) : une entrée = le résultat d'UNE soirée ──
describe('construireCarnet — par NUIT, 7 jours, chronologique', () => {
  it('redécoupe un même lieu en une entrée par nuit', () => {
    // 2 h et 5 h = la même nuit (celle du 7) ; 30 h = la nuit du 6
    const l = mkLieu('a', [ph(2), ph(5), ph(30)])
    const c = construireCarnet([l], MAINTENANT)
    expect(c).toHaveLength(2)
    expect(c[0].photos).toHaveLength(2)
    expect(c[0].soiree).toBe('2026-08-07')
    expect(c[1].soiree).toBe('2026-08-06')
  })

  it('s’arrête à 7 jours — la semaine, pas un jour de plus', () => {
    const l = mkLieu('a', [ph(2), ph(24 * 8)])
    const c = construireCarnet([l], MAINTENANT)
    expect(c).toHaveLength(1)
  })

  it('chronologique pur : la nuit la plus fraîche en haut, rien ne la double', () => {
    const vieux = mkLieu('vieux', [ph(50)])
    const frais = mkLieu('frais', [ph(3)])
    const c = construireCarnet([vieux, frais], MAINTENANT)
    expect(c.map((e) => e.lieu.id)).toEqual(['frais', 'vieux'])
  })

  it('porte le verdict du lieu — le « bof » est du signal, pas un vide', () => {
    const l = mkLieu('a', [ph(2)])
    l.tampon = { v: 'bof', x: 50, y: 35 }
    expect(construireCarnet([l], MAINTENANT)[0].verdict).toBe('bof')
    expect(construireCarnet([mkLieu('b', [ph(2)])], MAINTENANT)[0].verdict).toBeUndefined()
  })

  it('la photo de 2 h du matin reste dans la soirée de la veille', () => {
    const nuit = new Date(2026, 7, 8, 2, 0) // 8 août, 2 h
    const l = mkLieu('a', [
      { type: 'soir', url: 'x', priseLe: nuit.toISOString(), visibleLe: nuit.toISOString() },
    ])
    const c = construireCarnet([l], new Date(2026, 7, 8, 12, 0))
    expect(c[0].soiree).toBe('2026-08-07')
  })
})

describe('libelleNuit — l’intertitre au crayon', () => {
  const nuitDe = (h: number) => soireeDe(new Date(MAINTENANT.getTime() - h * 3600000).toISOString())
  it('la nuit en cours, puis la veille', () => {
    expect(libelleNuit(nuitDe(2), MAINTENANT)).toBe('ce soir')
    expect(libelleNuit(nuitDe(26), MAINTENANT)).toBe('hier soir')
  })
  it('dans la semaine : le jour se nomme, il ne se date pas', () => {
    expect(libelleNuit('2026-08-03', MAINTENANT)).toBe('lundi')
  })
  it('au-delà de la semaine : la date, faute de mieux', () => {
    expect(libelleNuit('2026-07-20', MAINTENANT)).toBe('le 20/07')
  })
})

describe('parNuits — les pages se tournent, l’ordre ne bouge pas', () => {
  it('groupe les entrées consécutives d’une même nuit', () => {
    const a = mkLieu('a', [ph(2)])
    const b = mkLieu('b', [ph(4)])
    const vieux = mkLieu('c', [ph(30)])
    const nuits = parNuits(construireCarnet([a, b, vieux], MAINTENANT), MAINTENANT)
    expect(nuits.map((n) => n.libelle)).toEqual(['ce soir', 'hier soir'])
    expect(nuits[0].entrees.map((e) => e.lieu.id)).toEqual(['a', 'b'])
  })
})

describe('tipDeLaSoiree — la voix de celui qui y est allé', () => {
  it('son tip cloud passe devant la note du spot', () => {
    const l = mkLieu('a', [ph(2)])
    l.note = 'la note du proprio'
    l.tipsCercle = [{ auteur: 'karim', auteurId: 'k', titre: '', note: 'monte au fond' }]
    expect(tipDeLaSoiree(l, 'k')).toBe('monte au fond')
    expect(tipDeLaSoiree(l, 'autre')).toBe('la note du proprio')
  })
  it('pas de tip du tout : une chaîne vide, jamais un « undefined » à l’écran', () => {
    expect(tipDeLaSoiree(mkLieu('a', [ph(2)]))).toBe('')
  })
})
