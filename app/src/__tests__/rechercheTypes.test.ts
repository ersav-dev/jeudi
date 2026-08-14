// ── la recherche PAR CATÉGORIE (13/08) ─────────────────────────────────
// Ce que l'audit du 13/08 a trouvé : on ne pouvait pas chercher un
// tiers-lieu. Le type était deviné à chaque affichage (jamais stocké, donc
// jamais filtrable) et `lireIntention()` — qui sait lire la phrase — n'était
// appelé nulle part. Ces tests tiennent les deux bouts du correctif.
import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}))

import { rechercher } from '../recherche'
import { lireIntention } from '../intentions'
import { typeDuLieu } from '../typesLieu'
import type { Lieu } from '../db'

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
const ids = (r: { lieu: Lieu }[]) => r.map((x) => x.lieu.id)

const VILLE = [
  mkLieu({ id: 'friche', nom: 'La Halle', description: 'Tiers-lieu' }),
  mkLieu({ id: 'bar', nom: 'Le Comptoir', description: 'Bar à cocktails' }),
  mkLieu({ id: 'musee', nom: 'La Fondation', description: 'Musée' }),
  mkLieu({ id: 'thai', nom: 'Chez Nok', description: 'Restaurant · thaïlandaise' }),
  mkLieu({ id: 'toit', nom: 'Le Perchoir', description: 'Bar', rooftop: true }),
  mkLieu({ id: 'peniche', nom: 'La Barge', description: 'Bar', surLeau: true }),
]

describe('le type est une donnée, plus une devinette', () => {
  it('le type STOCKÉ gagne sur la description', () => {
    // le cas qui cassait tout : la prose parle d'un bar, mais la main a dit
    // « musée » — c'est la main qui a raison
    const l = mkLieu({ id: 'x', nom: 'X', description: 'on a bu un verre au bar du musée', type: 'musee' })
    expect(typeDuLieu(l)).toBe('musee')
  })
  it('sans type stocké, on déduit encore (les lieux d’avant)', () => {
    expect(typeDuLieu(mkLieu({ id: 'y', nom: 'Y', description: 'Tiers-lieu' }))).toBe('friche')
  })
  it('la déduction ne tourne qu’une fois par lieu (mémoïsée)', () => {
    const l = mkLieu({ id: 'z', nom: 'Z', description: 'Musée' })
    expect(typeDuLieu(l)).toBe('musee')
    // on tord la description APRÈS la première lecture : le cache tient
    l.description = 'Bar'
    expect(typeDuLieu(l)).toBe('musee')
  })
})

describe('chercher par catégorie — ce qui était impossible', () => {
  it('« un tiers-lieu » ne rend QUE le tiers-lieu', () => {
    const lu = lireIntention('un tiers-lieu')
    expect(lu.types).toEqual(['friche'])
    const r = rechercher(VILLE, { types: lu.types })
    expect(ids(r)).toEqual(['friche'])
  })
  it('le filtre EXCLUT, il ne pondère pas : pas de bar bien classé en réponse à « musée »', () => {
    const r = rechercher(VILLE, { types: ['musee'] })
    expect(ids(r)).toEqual(['musee'])
  })
  it('la cuisine filtre aussi — « manger thaï »', () => {
    const lu = lireIntention('manger thaï')
    expect(lu.cuisines).toContain('THA')
    expect(ids(rechercher(VILLE, { cuisines: lu.cuisines }))).toEqual(['thai'])
  })
  it('les faits binaires filtrent — « un rooftop », « une péniche »', () => {
    expect(ids(rechercher(VILLE, { faits: ['rooftop'] }))).toEqual(['toit'])
    expect(ids(rechercher(VILLE, { faits: ['surLeau'] }))).toEqual(['peniche'])
  })
  it('sans filtre de catégorie, tout le monde reste dans la course', () => {
    expect(rechercher(VILLE, {}).length).toBe(VILLE.length)
  })
})

describe('la phrase, de bout en bout', () => {
  it('« un tiers-lieu tranquille ce soir » : le type filtre, le RESTE seul part au texte', () => {
    const lu = lireIntention('un tiers-lieu tranquille ce soir')
    expect(lu.types).toEqual(['friche'])
    expect(lu.envies).toContain('tranquilo')
    // rien d'incompris : donc aucune exigence de texte — c'est ce qui
    // rendait la recherche vide quand on cherchait le mot dans la prose
    expect(lu.reste).toEqual([])
    const r = rechercher(VILLE, {
      types: lu.types,
      envies: lu.envies,
      texte: lu.reste.join(' ') || undefined,
    })
    expect(ids(r)).toEqual(['friche'])
  })
  it('un mot inconnu reste un mot : il part en recherche texte, il ne bloque rien', () => {
    const lu = lireIntention('Nok')
    expect(lu.types).toEqual([])
    expect(lu.reste.join(' ')).toContain('nok')
    expect(ids(rechercher(VILLE, { texte: lu.reste.join(' ') }))).toEqual(['thai'])
  })
  it('⚠ le lexique peut avaler un nom propre — c’est connu, et c’est borné', () => {
    // « Le Comptoir » est un NOM de bar, mais « comptoir » est aussi un mot du
    // lexique : la phrase est lue comme une catégorie. Ici ça tombe juste (le
    // lieu cherché EST un bar), mais un jour un lieu s'appellera « Le Bowling »
    // et la recherche filtrera les bowlings. Le jour où ça gêne, la sortie est
    // écrite d'avance : un nom de lieu connu, trouvé tel quel, doit gagner sur
    // le lexique. On le documente ici plutôt que de le découvrir en prod.
    const lu = lireIntention('le Comptoir')
    expect(lu.types).toEqual(['bar'])
    const r = rechercher(VILLE, { types: lu.types, texte: lu.reste.join(' ') || undefined })
    expect(ids(r)).toContain('bar')
  })
})
