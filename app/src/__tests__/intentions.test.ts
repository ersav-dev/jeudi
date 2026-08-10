import { describe, it, expect } from 'vitest'
import {
  lireIntention,
  intentionVide,
  normaliser,
  ciblesInvalides,
  TAILLE_LEXIQUE,
} from '../intentions'

describe('le lexique lui-même', () => {
  it('ne vise QUE du vocabulaire qui existe dans l’app', () => {
    // une faute de frappe dans une cible ('rest0') ne se verrait sinon qu'au
    // moment où une recherche ne rendrait rien
    expect(ciblesInvalides()).toEqual([])
  })

  it('connaît un nombre de mots plausible — une suppression se verrait', () => {
    expect(TAILLE_LEXIQUE).toBeGreaterThan(250)
  })
})

describe('normaliser', () => {
  it('enlève les accents et la ponctuation', () => {
    expect(normaliser('Thaï')).toBe('thai')
    expect(normaliser('l’apéro !')).toBe('l apero')
    expect(normaliser('  Pâtisserie  ')).toBe('patisserie')
  })
})

describe('lireIntention — la phrase d’Ersan', () => {
  it('« manger thaï » : le cas qui justifie tout ce fichier', () => {
    const i = lireIntention('manger thaï')
    expect(i.envies).toContain('resto')
    expect(i.types).toContain('resto')
    expect(i.cuisines).toEqual(['THA'])
    expect(i.reste).toEqual([]) // tout a été compris
  })

  it('« boire un verre en terrasse » : une envie, un type, un fait', () => {
    const i = lireIntention('boire un verre en terrasse')
    expect(i.envies).toContain('apéro')
    expect(i.types).toContain('bar')
    expect(i.faits).toContain('terrasse')
  })

  it('« danser » ne devient pas un resto', () => {
    const i = lireIntention('je veux danser')
    expect(i.types).toEqual(['club'])
    expect(i.envies).toEqual([])
  })

  it('« un truc tranquille pour discuter » : l’ambiance sans le type', () => {
    const i = lireIntention('un truc tranquille pour discuter')
    expect(i.envies).toContain('tranquilo')
    expect(i.types).toEqual([])
  })
})

describe('les expressions de plusieurs mots', () => {
  it('« pad thai » ne se fait pas manger par « thai »', () => {
    const i = lireIntention('pad thai')
    expect(i.cuisines).toEqual(['THA'])
    expect(i.reste).toEqual([]) // « pad » n'est pas resté orphelin
  })

  it('« bo bun » est reconnu comme vietnamien', () => {
    expect(lireIntention('bo bun').cuisines).toEqual(['VIE'])
    expect(lireIntention('bo bun').reste).toEqual([])
  })

  it('« bar à vin » est une cave, pas un bar', () => {
    const i = lireIntention('un bar à vin')
    expect(i.types).toContain('vin')
    expect(i.types).not.toContain('bar')
  })

  it('« dim sum » ne laisse pas « sum » derrière lui', () => {
    const i = lireIntention('dim sum')
    expect(i.cuisines).toEqual(['CHN'])
    expect(i.reste).toEqual([])
  })
})

describe('les frontières de mots — le piège classique', () => {
  it('« théâtre » n’est pas un salon de thé', () => {
    const i = lireIntention('théâtre')
    expect(i.types).not.toContain('the')
  })

  it('« barbecue » tout seul n’est pas un bar', () => {
    expect(lireIntention('barbecue').types).not.toContain('bar')
  })

  it('« glacier » est bien une glace, « glaciere » non', () => {
    expect(lireIntention('glacier').types).toContain('glace')
    expect(lireIntention('glaciere').types).not.toContain('glace')
  })
})

describe('on ne jette rien', () => {
  it('les mots inconnus partent dans `reste` pour la recherche texte', () => {
    const i = lireIntention('manger chez Septime')
    expect(i.envies).toContain('resto')
    expect(i.reste).toContain('septime')
  })

  it('les mots outils ne polluent pas `reste`', () => {
    const i = lireIntention('je cherche un truc pour ce soir')
    expect(i.reste).toEqual([])
  })

  it('une phrase vide ne casse rien', () => {
    const i = lireIntention('')
    expect(intentionVide(i)).toBe(true)
    expect(i.reste).toEqual([])
  })

  it('une phrase que personne ne comprend est annoncée comme telle', () => {
    const i = lireIntention('zblurg qwerty')
    expect(intentionVide(i)).toBe(true)
    expect(i.reste).toEqual(['zblurg', 'qwerty'])
  })
})

describe('les phrases qu’on dira vraiment', () => {
  const cas: [string, (i: ReturnType<typeof lireIntention>) => void][] = [
    ['j’ai la dalle', (i) => expect(i.envies).toContain('resto')],
    ['un kebab', (i) => expect(i.envies).toContain('alloco')],
    ['une grande table pour se faire plaisir', (i) => expect(i.envies).toContain('gastro')],
    ['un rooftop avec vue', (i) => expect(i.faits).toContain('rooftop')],
    ['voir le match', (i) => expect(i.faits).toContain('match')],
    ['manger seul', (i) => expect(i.faits).toContain('seul')],
    ['un speakeasy', (i) => expect(i.envies).toContain('incognito')],
    ['une péniche', (i) => expect(i.faits).toContain('surLeau')],
    ['bosser au café', (i) => expect(i.types).toContain('cafe')],
    ['une glace', (i) => expect(i.types).toContain('glace')],
    ['des tapas', (i) => expect(i.cuisines).toContain('ESP')],
    ['un ramen', (i) => expect(i.cuisines).toContain('JPN')],
    ['brunch', (i) => expect(i.types).toContain('cafe')],
    ['pizza', (i) => expect(i.cuisines).toContain('ITA')],
  ]
  for (const [phrase, verif] of cas) {
    it(`« ${phrase} »`, () => {
      const i = lireIntention(phrase)
      expect(intentionVide(i)).toBe(false)
      verif(i)
    })
  }
})

describe('les phrases composées', () => {
  it('« manger italien en terrasse pas loin » garde tout', () => {
    const i = lireIntention('manger italien en terrasse pas loin')
    expect(i.envies).toContain('resto')
    expect(i.cuisines).toContain('ITA')
    expect(i.faits).toContain('terrasse')
    expect(i.reste).toContain('pas')
    expect(i.reste).toContain('loin')
  })

  it('ne répète jamais une valeur, même si deux mots la désignent', () => {
    const i = lireIntention('manger un resto restaurant')
    expect(i.envies).toEqual(['resto'])
    expect(i.types).toEqual(['resto'])
  })
})
