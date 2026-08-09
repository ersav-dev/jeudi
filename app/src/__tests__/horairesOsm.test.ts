// ── tests du traducteur d'horaires OSM (pur, sans réseau) ──────────────
import { describe, it, expect } from 'vitest'
import { traduireHorairesOsm } from '../horairesOsm'

describe('traduireHorairesOsm — cas simples', () => {
  it('une seule plage qui couvre le soir', () => {
    expect(traduireHorairesOsm('Mo-Su 18:00-23:00')).toEqual([18, 23])
  })

  it('plage qui traverse minuit', () => {
    expect(traduireHorairesOsm('Mo-Su 18:00-02:00')).toEqual([18, 26])
  })

  it('fermeture exactement à minuit reste 24, pas 0', () => {
    expect(traduireHorairesOsm('Mo-Su 12:00-24:00')).toEqual([12, 24])
  })

  it('horaires décimaux avec minutes (19:30)', () => {
    expect(traduireHorairesOsm('Mo-Su 19:30-22:30')).toEqual([19.5, 22.5])
  })

  it('24/7 → ouvert de 0h à minuit', () => {
    expect(traduireHorairesOsm('24/7')).toEqual([0, 24])
  })

  it('sensible à la casse pour 24/7 et espaces autour', () => {
    expect(traduireHorairesOsm('  24/7  ')).toEqual([0, 24])
  })
})

describe('traduireHorairesOsm — plages multiples dans une même règle', () => {
  it('garde la plage du soir parmi plusieurs plages du même jour', () => {
    expect(traduireHorairesOsm('Mo-Fr 09:00-12:00,14:00-18:00,19:00-23:00')).toEqual([19, 23])
  })

  it('aucune des plages ne couvre 20h → undefined', () => {
    expect(traduireHorairesOsm('Mo-Fr 09:00-12:00,14:00-18:00')).toBeUndefined()
  })

  it('deux plages du même jour se chevauchent sur 20h (donnée incohérente) → undefined', () => {
    expect(traduireHorairesOsm('Mo-Fr 18:00-21:00,19:00-23:00')).toBeUndefined()
  })
})

describe('traduireHorairesOsm — jours variables', () => {
  it('jours différents, même plage du soir → la plage commune', () => {
    expect(traduireHorairesOsm('Mo-Fr 18:00-23:00; Sa-Su 18:00-23:00')).toEqual([18, 23])
  })

  it('un jour fermé ne casse pas les autres', () => {
    expect(traduireHorairesOsm('Mo off; Tu-Su 18:00-02:00')).toEqual([18, 26])
  })

  it('jours fériés fermés (PH off) ignorés', () => {
    expect(traduireHorairesOsm('Mo-Su 18:00-23:00; PH off')).toEqual([18, 23])
  })

  it('horaires du soir vraiment différents selon le jour → undefined (pas de choix arbitraire)', () => {
    expect(traduireHorairesOsm('Mo-Fr 18:00-23:00; Sa-Su 12:00-02:00')).toBeUndefined()
  })

  it('un jour ouvre plus tôt mais couvre le même soir → même plage, accepté', () => {
    // Sa ouvre à midi mais ferme à la même heure que la semaine : la plage
    // qui couvre 20h est différente (12h≠18h d'ouverture) → refusé.
    expect(traduireHorairesOsm('Mo-Fr 18:00-23:00; Sa 12:00-23:00')).toBeUndefined()
  })
})

describe('traduireHorairesOsm — cas qu’on refuse plutôt que deviner', () => {
  it('fermé tout le temps → undefined', () => {
    expect(traduireHorairesOsm('off')).toBeUndefined()
  })

  it('fermé tous les jours listés → undefined', () => {
    expect(traduireHorairesOsm('Mo-Su off')).toBeUndefined()
  })

  it('sunset-sunrise → undefined (pas d’heure fixe connaissable)', () => {
    expect(traduireHorairesOsm('Mo-Su sunset-sunrise')).toBeUndefined()
  })

  it('dawn/dusk → undefined', () => {
    expect(traduireHorairesOsm('Mo-Su dusk-dawn')).toBeUndefined()
  })

  it('chaîne vide → undefined', () => {
    expect(traduireHorairesOsm('')).toBeUndefined()
  })

  it('null/undefined en entrée → undefined', () => {
    expect(traduireHorairesOsm(null)).toBeUndefined()
    expect(traduireHorairesOsm(undefined)).toBeUndefined()
  })

  it('uniquement des espaces → undefined', () => {
    expect(traduireHorairesOsm('   ')).toBeUndefined()
  })

  it('ouverture sans fermeture connue ("18:00+") → undefined', () => {
    expect(traduireHorairesOsm('Mo-Su 18:00+')).toBeUndefined()
  })

  it('syntaxe non reconnue (texte libre) → undefined', () => {
    expect(traduireHorairesOsm('sur rendez-vous uniquement')).toBeUndefined()
  })
})
