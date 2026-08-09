// ── la rayure : le jeudi suivant, le serment, le repentir — pur, sans DOM ──
// les tests tournent en node : on stubbe un localStorage minimal (marques.test.ts)
import { describe, it, expect, beforeEach, vi } from 'vitest'

const memoire = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memoire.get(k) ?? null,
  setItem: (k: string, v: string) => {
    memoire.set(k, String(v))
  },
  removeItem: (k: string) => {
    memoire.delete(k)
  },
  clear: () => memoire.clear(),
})

import {
  CLE_RAYURES,
  prochainJeudiMinuit,
  lireRayures,
  rayer,
  deRayer,
  rayureActive,
  rayuresActives,
  rayuresExpirees,
  marquerRayures,
  oublierRayure,
  type Rayure,
} from '../rayure'

beforeEach(() => localStorage.clear())

// des dates locales (le jeudi de l'app est celui du fuseau du téléphone)
const le = (a: number, m: number, j: number, h = 12) => new Date(a, m - 1, j, h)

describe('le jeudi suivant : entre 1 et 7 jours, jamais zéro', () => {
  it('tombe toujours un jeudi, à minuit pile', () => {
    for (let j = 1; j <= 14; j++) {
      const cible = prochainJeudiMinuit(le(2026, 8, j))
      expect(cible.getDay()).toBe(4)
      expect([cible.getHours(), cible.getMinutes(), cible.getSeconds()]).toEqual([0, 0, 0])
    }
  })

  it('le mercredi, c’est demain ; le vendredi, c’est dans six jours', () => {
    // 2026-08-12 est un mercredi, 2026-08-13 un jeudi, 2026-08-14 un vendredi
    expect(le(2026, 8, 12).getDay()).toBe(3)
    expect(prochainJeudiMinuit(le(2026, 8, 12)).getDate()).toBe(13)
    expect(prochainJeudiMinuit(le(2026, 8, 14)).getDate()).toBe(20)
  })

  it('un jeudi ne renvoie JAMAIS à lui-même — sinon la rayure naîtrait morte', () => {
    const jeudi = le(2026, 8, 13)
    expect(jeudi.getDay()).toBe(4)
    const cible = prochainJeudiMinuit(jeudi)
    expect(cible.getDate()).toBe(20) // le jeudi d'après, 7 jours plus tard
    expect(cible.getTime()).toBeGreaterThan(jeudi.getTime())
  })

  it('l’écart tient toujours dans la semaine (1 à 7 jours)', () => {
    for (let j = 1; j <= 14; j++) {
      const depuis = le(2026, 8, j, 0) // minuit : l'écart est un compte de jours rond
      const jours = (prochainJeudiMinuit(depuis).getTime() - depuis.getTime()) / 86400000
      expect(jours).toBeGreaterThanOrEqual(1)
      expect(jours).toBeLessThanOrEqual(7)
    }
  })
})

describe('rayer : signé, daté, une seule fois par lieu', () => {
  it('pose une rayure signée qui expire au jeudi suivant', () => {
    const mercredi = le(2026, 8, 12)
    const table = rayer('a', 'karim', 'trois quarts d’heure pour deux bières', mercredi)
    expect(table.a.qui).toBe('karim')
    expect(table.a.motif).toBe('trois quarts d’heure pour deux bières')
    expect(new Date(table.a.expire).getDate()).toBe(13)
    expect(rayureActive(table.a, mercredi)).toBe(true)
  })

  it('le motif est facultatif — sans lui, pas de champ vide qui traîne', () => {
    const table = rayer('a', 'karim', '   ')
    expect(table.a.motif).toBeUndefined()
  })

  it('rayer deux fois REMPLACE : jamais d’empilement, jamais de compteur', () => {
    rayer('a', 'karim', 'premier')
    const table = rayer('a', 'karim', 'second')
    expect(Object.keys(table)).toEqual(['a'])
    expect(table.a.motif).toBe('second')
  })

  it('une rayure anonyme n’existe pas', () => {
    expect(rayer('a', '  ')).toEqual({})
    expect(lireRayures()).toEqual({})
  })

  it('se dédire efface tout — le lieu revient intact', () => {
    rayer('a', 'karim')
    expect(deRayer('a')).toEqual({})
    expect(lireRayures()).toEqual({})
  })
})

describe('l’expiration : le prix, payé le jeudi', () => {
  const mercredi = le(2026, 8, 12)
  const apres = le(2026, 8, 14) // le vendredi : le jeudi est tombé

  it('la rayure tient jusqu’au jeudi, puis ne dit plus rien', () => {
    rayer('a', 'karim', '', mercredi)
    expect(Object.keys(rayuresActives(mercredi))).toEqual(['a'])
    expect(rayuresExpirees(mercredi)).toEqual([])
    expect(Object.keys(rayuresActives(apres))).toEqual([])
    expect(rayuresExpirees(apres)).toEqual(['a'])
  })

  it('la croix se pose sur le lieu tant qu’elle vit, plus après', () => {
    rayer('a', 'karim', 'bof', mercredi)
    const spots = (): { id: string; raye?: Rayure }[] => [{ id: 'a' }, { id: 'b' }]
    const avant = marquerRayures(spots(), mercredi)
    expect(avant[0].raye?.qui).toBe('karim')
    expect(avant[1].raye).toBeUndefined()
    // une rayure échue ne s'affiche plus : son lieu est en sursis, il partira
    expect(marquerRayures(spots(), apres)[0].raye).toBeUndefined()
  })
})

describe('le stockage abîmé ne casse rien', () => {
  it('valeur illisible, tableau, rayure sans nom ou sans date : jetés', () => {
    localStorage.setItem(CLE_RAYURES, 'pas du json')
    expect(lireRayures()).toEqual({})
    localStorage.setItem(CLE_RAYURES, '["a"]')
    expect(lireRayures()).toEqual({})
    localStorage.setItem(
      CLE_RAYURES,
      JSON.stringify({
        bon: { qui: 'karim', expire: '2026-08-13T00:00:00.000Z' },
        anonyme: { expire: '2026-08-13T00:00:00.000Z' },
        sansDate: { qui: 'karim' },
        dateFolle: { qui: 'karim', expire: 'jeudi prochain' },
      }),
    )
    expect(Object.keys(lireRayures())).toEqual(['bon'])
  })

  it('un lieu effacé n’a plus de rayure à traîner', () => {
    rayer('a', 'karim')
    oublierRayure('a')
    expect(lireRayures()).toEqual({})
  })
})
