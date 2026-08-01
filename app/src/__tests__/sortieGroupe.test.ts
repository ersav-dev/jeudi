// ── tests du match de groupe cloud (pur, sans DOM ni réseau) ───────────
// on mocke ../supabase : sortieGroupe.ts (et db.ts) l'importent au chargement.
import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}))

import {
  extraireTokenSortie,
  budgetDepuisMeteo,
  parseSortieVue,
  gagnantSG,
  resumeSG,
  libelleRestant,
  lienSortie,
  type CandidatSG,
  type ComptesSG,
} from '../sortieGroupe'

const candidat = (id: string, ordre: number): CandidatSG => ({
  id,
  nom: id,
  lat: 48.87,
  lng: 2.35,
  envies: [],
  ordre,
})

describe('extraireTokenSortie', () => {
  it('extrait le token d’un chemin /sortie/<token>', () => {
    expect(extraireTokenSortie('/sortie/abcDEF123456')).toBe('abcDEF123456')
    expect(extraireTokenSortie('/sortie/abcDEF123456/')).toBe('abcDEF123456')
  })
  it('refuse les autres chemins (et les tokens trop courts)', () => {
    expect(extraireTokenSortie('/')).toBeNull()
    expect(extraireTokenSortie('/sortie/')).toBeNull()
    expect(extraireTokenSortie('/sortie/court')).toBeNull()
    expect(extraireTokenSortie('/autre/abcDEF123456')).toBeNull()
    expect(extraireTokenSortie('/sortie/abc/def12345678')).toBeNull()
  })
  it('le lien produit se ré-extrait (aller-retour)', () => {
    const token = 'k7xq_-AbCdEf012345'
    const url = new URL(lienSortie(token))
    expect(extraireTokenSortie(url.pathname)).toBe(token)
  })
})

describe('budgetDepuisMeteo', () => {
  it('pluie = 0 · nuageux = 1 · soleil = 2 (jamais révélé)', () => {
    expect(budgetDepuisMeteo('pluie')).toBe(0)
    expect(budgetDepuisMeteo('nuageux')).toBe(1)
    expect(budgetDepuisMeteo('soleil')).toBe(2)
  })
})

describe('parseSortieVue', () => {
  it('parse le jsonb de sg_voir (comptes agrégés par candidat)', () => {
    const vue = parseSortieVue({
      sortie: {
        titre: 'jeudi soir',
        envies: ['apéro'],
        statut: 'ouvert',
        deadline: '2026-08-01T21:00:00Z',
        ouverte: true,
        centre_lat: 48.87,
        centre_lng: 2.35,
        gagnant_id: null,
        createur: 'clément',
      },
      candidats: [
        { id: 'c2', nom: 'chez jeannette', lat: 1, lng: 2, envies: [], ordre: 1 },
        { id: 'c1', nom: 'le perchoir', lat: 1, lng: 2, envies: ['apéro'], ordre: 0, meteo: 'soleil' },
      ],
      participants: [
        { prenom: 'clément', a_vote: true },
        { prenom: 'marie', a_vote: false },
      ],
      comptes: [
        { candidat_id: 'c1', reaction: 'chaud', n: 2 },
        { candidat_id: 'c1', reaction: 'trop cher', n: 1 },
        { candidat_id: 'c1', reaction: 'pas une réaction', n: 9 },
      ],
    })
    expect(vue).not.toBeNull()
    expect(vue!.createur).toBe('clément')
    expect(vue!.ouverte).toBe(true)
    // les candidats reviennent triés par ordre
    expect(vue!.candidats.map((c) => c.id)).toEqual(['c1', 'c2'])
    expect(vue!.candidats[0].meteo).toBe('soleil')
    expect(vue!.comptes.c1).toEqual({ chaud: 2, 'trop cher': 1 })
    expect(vue!.participants.filter((p) => p.aVote)).toHaveLength(1)
  })

  it('sortie absente (mauvais token) → null', () => {
    expect(parseSortieVue({ sortie: null, candidats: [] })).toBeNull()
    expect(parseSortieVue(undefined)).toBeNull()
  })
})

describe('gagnantSG — le verdict déterministe', () => {
  const [a, b, c] = [candidat('a', 0), candidat('b', 1), candidat('c', 2)]

  it('1er critère : le plus de « chaud »', () => {
    const comptes: ComptesSG = { a: { chaud: 1 }, b: { chaud: 3 }, c: { chaud: 2 } }
    expect(gagnantSG([a, b, c], comptes)!.id).toBe('b')
  })

  it('2e critère : les partants (chaud + pourquoi pas + juste boire)', () => {
    const comptes: ComptesSG = {
      a: { chaud: 2, 'pas moi': 3 },
      b: { chaud: 2, 'pourquoi pas': 1, 'juste boire': 1 },
    }
    expect(gagnantSG([a, b, c], comptes)!.id).toBe('b')
  })

  it('3e critère : l’ordre du classement (déterministe, jamais aléatoire)', () => {
    const comptes: ComptesSG = { b: { chaud: 1 }, c: { chaud: 1 } }
    expect(gagnantSG([a, b, c], comptes)!.id).toBe('b')
    // sans aucun vote : le mieux classé par l'algo
    expect(gagnantSG([c, b, a], {})!.id).toBe('a')
  })

  it('mêmes votes → même gagnant, quel que soit l’ordre du tableau', () => {
    const comptes: ComptesSG = { a: { chaud: 1 }, c: { chaud: 1, 'pourquoi pas': 2 } }
    expect(gagnantSG([a, b, c], comptes)!.id).toBe('c')
    expect(gagnantSG([c, b, a], comptes)!.id).toBe('c')
  })

  it('aucun candidat → null', () => {
    expect(gagnantSG([], {})).toBeNull()
  })
})

describe('resumeSG — « 5 chauds · 2 trop cher »', () => {
  it('chaud d’abord, puis les freins par poids', () => {
    expect(resumeSG({ chaud: 5, 'trop cher': 2, 'trop loin': 3 })).toBe(
      '5 chauds · 3 trop loin · 2 trop cher',
    )
  })
  it('singulier / pluriel de chaud', () => {
    expect(resumeSG({ chaud: 1 })).toBe('1 chaud')
    expect(resumeSG({ chaud: 2 })).toBe('2 chauds')
  })
  it('personne n’a réagi → chaîne vide', () => {
    expect(resumeSG(undefined)).toBe('')
    expect(resumeSG({})).toBe('')
  })
})

describe('libelleRestant — le compte à rebours', () => {
  const maintenant = new Date('2026-08-01T18:00:00Z')
  it('moins d’une heure → minutes', () => {
    expect(libelleRestant('2026-08-01T18:42:30Z', maintenant)).toBe('43 min')
  })
  it('au-delà → heures + minutes sur deux chiffres', () => {
    expect(libelleRestant('2026-08-01T19:05:00Z', maintenant)).toBe('1 h 05')
    expect(libelleRestant('2026-08-01T21:00:00Z', maintenant)).toBe('3 h')
  })
  it('passée ou sans limite → vide', () => {
    expect(libelleRestant('2026-08-01T17:59:00Z', maintenant)).toBe('')
    expect(libelleRestant(null, maintenant)).toBe('')
    expect(libelleRestant('pas une date', maintenant)).toBe('')
  })
})
