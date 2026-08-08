// ── tests du moment unifié (« quand ? » partout) — pur, sans DOM ──────
import { describe, it, expect } from 'vitest'
import { dateDuMoment, libelleMoment, momentFutur, MOMENT_DEFAUT } from '../moment'

// mardi 4 août 2026, 18h00 locale
const mardi18h = new Date(2026, 7, 4, 18, 0, 0)

describe('dateDuMoment', () => {
  it('maintenant → la référence telle quelle', () => {
    expect(dateDuMoment(MOMENT_DEFAUT, mardi18h).getTime()).toBe(mardi18h.getTime())
  })

  it('ce soir → 20h du même jour (l’heure où une soirée commence)', () => {
    const d = dateDuMoment({ cle: 'soir' }, mardi18h)
    expect([d.getDate(), d.getHours()]).toEqual([4, 20])
  })

  it('ce soir après 20h → reste vivant (jamais hier)', () => {
    const tard = new Date(2026, 7, 4, 21, 30)
    expect(dateDuMoment({ cle: 'soir' }, tard).getTime()).toBe(tard.getTime())
  })

  it('demain soir → lendemain 20h', () => {
    const d = dateDuMoment({ cle: 'demain' }, mardi18h)
    expect([d.getDate(), d.getHours()]).toEqual([5, 20])
  })

  it('jeudi → le jeudi le plus proche à 20h', () => {
    const d = dateDuMoment({ cle: 'jeudi' }, mardi18h)
    expect([d.getDay(), d.getDate(), d.getHours()]).toEqual([4, 6, 20])
  })

  it('jeudi entre 20h et 22h → encore CE soir (repli maintenant)', () => {
    const jeudiSoir = new Date(2026, 7, 6, 21, 0)
    expect(dateDuMoment({ cle: 'jeudi' }, jeudiSoir).getTime()).toBe(jeudiSoir.getTime())
  })

  it('jeudi soir après 22h → le jeudi suivant', () => {
    const jeudiTard = new Date(2026, 7, 6, 22, 30)
    const d = dateDuMoment({ cle: 'jeudi' }, jeudiTard)
    expect(d.getDate()).toBe(13)
  })

  it('heure libre future → respectée · passée → repli maintenant', () => {
    const futur = new Date(2026, 7, 8, 20, 30).toISOString()
    expect(dateDuMoment({ cle: 'libre', iso: futur }, mardi18h).getHours()).toBe(20)
    const passe = new Date(2026, 7, 1, 20, 0).toISOString()
    expect(dateDuMoment({ cle: 'libre', iso: passe }, mardi18h).getTime()).toBe(mardi18h.getTime())
  })
})

describe('libelleMoment — la question qui s’accorde', () => {
  it('les presets parlent la langue du carnet', () => {
    expect(libelleMoment({ cle: 'maintenant' }, mardi18h)).toBe('maintenant')
    expect(libelleMoment({ cle: 'soir' }, mardi18h)).toBe('ce soir')
    expect(libelleMoment({ cle: 'demain' }, mardi18h)).toBe('demain soir')
    expect(libelleMoment({ cle: 'jeudi' }, mardi18h)).toBe('jeudi soir')
  })

  it('heure libre → jour court + heure (sam. 20h30)', () => {
    const iso = new Date(2026, 7, 8, 20, 30).toISOString()
    expect(libelleMoment({ cle: 'libre', iso }, mardi18h)).toBe('sam. 20h30')
  })

  it('minutes rondes → pas de zéro inutile (20h, pas 20h00)', () => {
    const iso = new Date(2026, 7, 8, 20, 0).toISOString()
    expect(libelleMoment({ cle: 'libre', iso }, mardi18h)).toBe('sam. 20h')
  })
})

describe('momentFutur — la porte « avant le rendez-vous »', () => {
  it('maintenant / ce soir proche → non', () => {
    expect(momentFutur({ cle: 'maintenant' }, mardi18h)).toBe(false)
    // 15h → 20h = 5h d'écart : c'est un vrai « plus tard »
    const mardi15h = new Date(2026, 7, 4, 15, 0)
    expect(momentFutur({ cle: 'soir' }, mardi15h)).toBe(true)
    const presque20h = new Date(2026, 7, 4, 19, 0)
    expect(momentFutur({ cle: 'soir' }, presque20h)).toBe(false)
  })
  it('demain / jeudi → oui', () => {
    expect(momentFutur({ cle: 'demain' }, mardi18h)).toBe(true)
    expect(momentFutur({ cle: 'jeudi' }, mardi18h)).toBe(true)
  })
})
