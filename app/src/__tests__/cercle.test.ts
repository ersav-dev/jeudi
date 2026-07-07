// ── tests du cercle réel (étape 5) — logique PURE, sans DOM ni réseau ──
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

import { extraireInvite } from '../db'
import { fusionnerCercle, prenomDe } from '../cercle'
import { MEMBRES } from '../seed'

const UUID_A = '123e4567-e89b-42d3-a456-426614174000'
const UUID_B = '9b2f0c31-4a6d-4e5f-8a7b-2c3d4e5f6a7b'

describe('extraireInvite (parsing du lien d’invitation)', () => {
  it('extrait un uuid valide de ?invite=', () => {
    expect(extraireInvite(`?invite=${UUID_A}`)).toBe(UUID_A)
  })

  it('marche aussi sans le « ? » et au milieu d’autres params', () => {
    expect(extraireInvite(`invite=${UUID_A}`)).toBe(UUID_A)
    expect(extraireInvite(`?utm=x&invite=${UUID_A}&y=2`)).toBe(UUID_A)
  })

  it('rejette un id qui n’est pas un uuid (pas d’injection par le lien)', () => {
    expect(extraireInvite('?invite=karim')).toBeNull()
    expect(extraireInvite('?invite=id-1234')).toBeNull()
    expect(extraireInvite(`?invite=${UUID_A}extra`)).toBeNull()
  })

  it('sans param invite (ou query vide) → null', () => {
    expect(extraireInvite('')).toBeNull()
    expect(extraireInvite('?autre=1')).toBeNull()
    expect(extraireInvite('?invite=')).toBeNull()
  })
})

describe('fusionnerCercle (cercle réel + décor seed)', () => {
  const reel = { id: UUID_A, prenom: 'Nina', bio: 'la vraie', insta: 'nina' }

  it('les vrais membres passent DEVANT le seed, et sont marqués reel', () => {
    const fusion = fusionnerCercle([reel])
    expect(fusion[0]).toMatchObject({ id: UUID_A, prenom: 'Nina', reel: true })
    // le décor seed suit, marqué non réel (tampon démo à l'affichage)
    expect(fusion.slice(1).map((m) => m.id)).toEqual(MEMBRES.map((m) => m.id))
    expect(fusion.slice(1).every((m) => !m.reel)).toBe(true)
  })

  it('dédoublonne par id : un vrai membre gagne toujours sur un seed homonyme', () => {
    const seed = [
      { id: 'karim', prenom: 'Karim', critere: 'le bruit' },
      { id: UUID_A, prenom: 'Nina (seed)' },
    ]
    const fusion = fusionnerCercle([reel], seed)
    expect(fusion).toHaveLength(2)
    expect(fusion[0]).toMatchObject({ id: UUID_A, prenom: 'Nina', reel: true })
    expect(fusion[1]).toMatchObject({ id: 'karim', reel: false })
  })

  it('dédoublonne aussi les vrais entre eux (deux relations vers le même id)', () => {
    const fusion = fusionnerCercle([reel, { id: UUID_A, prenom: 'Nina bis' }], [])
    expect(fusion).toHaveLength(1)
    expect(fusion[0].prenom).toBe('Nina')
  })

  it('cercle vide → que le décor, rien ne casse', () => {
    const fusion = fusionnerCercle([])
    expect(fusion.map((m) => m.id)).toEqual(MEMBRES.map((m) => m.id))
  })
})

describe('prenomDe (owner_id → prénom, « chez untel »)', () => {
  const membres = [
    { id: UUID_A, prenom: 'Nina' },
    { id: UUID_B, prenom: 'Marc' },
  ]

  it('mappe un owner_id du cercle vers son prénom', () => {
    expect(prenomDe(UUID_A, membres)).toBe('Nina')
    expect(prenomDe(UUID_B, membres)).toBe('Marc')
  })

  it('hors cercle (ou sans proprietaire) → null, jamais un prénom inventé', () => {
    expect(prenomDe('9e107d9d-7f4a-4c3b-8a2b-111111111111', membres)).toBeNull()
    expect(prenomDe(undefined, membres)).toBeNull()
    expect(prenomDe(UUID_A, [])).toBeNull()
  })
})
