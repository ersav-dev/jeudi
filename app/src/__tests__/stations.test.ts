import { describe, it, expect } from 'vitest'
import { chercherStations, formeComparable, distanceMots, type Station } from '../stations'

const s = (nom: string, lat = 48.85, lng = 2.35): Station => ({ nom, type: 'metro', lat, lng })

const table: Station[] = [
  s('Edgar Quinet', 48.84111, 2.32507),
  s('Opéra'),
  s('Opéra Bastille'),
  s('Château d’Eau'),
  s('Saint-Paul'),
  s('Charles de Gaulle — Étoile'),
  s('Quinconces'),
]

describe('formeComparable', () => {
  it('efface accents, casse et ponctuation', () => {
    expect(formeComparable('Château d’Eau')).toBe('chateau d eau')
    expect(formeComparable('Charles de Gaulle — Étoile')).toBe('charles de gaulle etoile')
  })

  it('coupe les parenthèses', () => {
    expect(formeComparable('Opéra (Garnier)')).toBe('opera')
  })

  it('fait converger « st » et « Saint » vers la même forme', () => {
    expect(formeComparable('St-Paul')).toBe(formeComparable('Saint-Paul'))
    expect(formeComparable('Ste-Opportune')).toBe(formeComparable('Sainte-Opportune'))
  })

  it('n’abîme pas un mot qui commence par st', () => {
    expect(formeComparable('Stalingrad')).toBe('stalingrad')
  })
})

describe('distanceMots', () => {
  it('compte les fautes', () => {
    expect(distanceMots('edgar quinet', 'edgar quinet')).toBe(0)
    expect(distanceMots('edgar quinet', 'edgard quinet')).toBe(1)
  })

  it('abandonne au-delà du plafond au lieu de tout calculer', () => {
    expect(distanceMots('opera', 'chateau d eau', 2)).toBeGreaterThan(2)
  })
})

describe('chercherStations', () => {
  it('ne répond pas à une seule lettre — ce serait toute la ville', () => {
    expect(chercherStations('e', table)).toHaveLength(0)
  })

  it('trouve pendant la frappe', () => {
    expect(chercherStations('edg', table)[0].nom).toBe('Edgar Quinet')
  })

  it('rend les coordonnées, pas seulement le nom', () => {
    const [r] = chercherStations('edgar quinet', table)
    expect(r).toMatchObject({ lat: 48.84111, lng: 2.32507 })
  })

  it('pardonne une faute de frappe — « Edgard » pour « Edgar »', () => {
    expect(chercherStations('edgard quinet', table)[0].nom).toBe('Edgar Quinet')
  })

  it('accepte qu’on tape la fin du nom', () => {
    expect(chercherStations('quinet', table)[0].nom).toBe('Edgar Quinet')
  })

  it('met le nom exact devant le nom plus long qui le contient', () => {
    expect(chercherStations('opera', table).map((x) => x.nom))
      .toEqual(['Opéra', 'Opéra Bastille'])
  })

  it('se moque des accents et des apostrophes', () => {
    expect(chercherStations('chateau d eau', table)[0].nom).toBe('Château d’Eau')
    expect(chercherStations('etoile', table)[0].nom).toBe('Charles de Gaulle — Étoile')
  })

  it('comprend « st » pour « saint » — c’est comme ça qu’on tape', () => {
    expect(chercherStations('st paul', table)[0].nom).toBe('Saint-Paul')
    expect(chercherStations('saint paul', table)[0].nom).toBe('Saint-Paul')
  })

  it('ne rend rien quand ça ne ressemble à aucune station', () => {
    expect(chercherStations('boulangerie du coin', table)).toHaveLength(0)
  })

  it('borne le nombre de réponses', () => {
    expect(chercherStations('o', table, 2).length).toBeLessThanOrEqual(2)
  })
})
