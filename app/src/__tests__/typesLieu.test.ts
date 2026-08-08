// ── tests du type d'un lieu (glyphes de la carte) — pur, sans DOM ──────
import { describe, it, expect } from 'vitest'
import {
  typeDeLieu,
  labelTypeLieu,
  svgTypeLieu,
  TYPES_LIEU,
  cuisineDeLieu,
  TAMPONS_CUISINE,
  MOT_TYPE,
  ADJ_CUISINE,
  decrireLieu,
} from '../typesLieu'

const lieu = (description: string | undefined, envies: string[] = []) => ({ description, envies })

describe('typeDeLieu — la description fait foi', () => {
  it('reconnaît les grandes familles depuis le texte importé', () => {
    expect(typeDeLieu(lieu('Bar à cocktails, ambiance prohibition'))).toBe('bar')
    expect(typeDeLieu(lieu('disco / club'))).toBe('club')
    expect(typeDeLieu(lieu('Coffee shop, brunch le week-end'))).toBe('cafe')
    expect(typeDeLieu(lieu('street-food / tacos'))).toBe('street')
    expect(typeDeLieu(lieu('gastro palace'))).toBe('gastro')
    expect(typeDeLieu(lieu('Restaurant de nouilles au sarrasin (soba)'))).toBe('resto')
  })

  it('les douceurs (07/08) : la glace, le thé, la pâtisserie — et le vin', () => {
    expect(typeDeLieu(lieu('Glacier artisanal, sorbets maison'))).toBe('glace')
    expect(typeDeLieu(lieu('Gelato e caffè'))).toBe('glace')
    expect(typeDeLieu(lieu('Salon de thé et brunch'))).toBe('the') // le thé gagne sur le brunch
    expect(typeDeLieu(lieu('Bubble tea / boba'))).toBe('the')
    expect(typeDeLieu(lieu('Pâtisserie fine, gâteaux de saison'))).toBe('patisserie')
    expect(typeDeLieu(lieu('Crêperie bretonne'))).toBe('patisserie')
    expect(typeDeLieu(lieu('Cave à vins naturels'))).toBe('vin') // plus déguisée en bar
    expect(typeDeLieu(lieu('Bar à vin, planches'))).toBe('vin')
  })

  it('le spécifique gagne sur le générique (l’ordre des regex)', () => {
    // « bar » ET « vins » dans la même description → la bouteille, pas le verre
    expect(typeDeLieu(lieu('Bar à vins et cocktails'))).toBe('vin')
    // « café » ET « glacier » → la glace (plus pointu que le café)
    expect(typeDeLieu(lieu('Café glacier en terrasse'))).toBe('glace')
  })

  it('sans description parlante : les envies décident', () => {
    expect(typeDeLieu(lieu(undefined, ['apéro']))).toBe('bar')
    expect(typeDeLieu(lieu('', ['tranquilo']))).toBe('cafe')
    expect(typeDeLieu(lieu('93100 Montreuil', ['alloco']))).toBe('street')
  })

  it('défaut : resto (jamais d’inconnu sur la carte)', () => {
    expect(typeDeLieu(lieu(undefined, []))).toBe('resto')
  })
})

describe('les glyphes et les mots', () => {
  it('chaque type a son glyphe monoline et son mot', () => {
    for (const t of TYPES_LIEU) {
      expect(svgTypeLieu(t)).toContain('<svg')
      expect(svgTypeLieu(t)).toContain('stroke')
      expect(labelTypeLieu(t).length).toBeGreaterThan(2)
    }
  })
  it('jamais d’émoji dans le chrome — que du trait SVG', () => {
    for (const t of TYPES_LIEU) {
      expect(svgTypeLieu(t)).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u)
    }
  })
})

describe('cuisineDeLieu — le tampon de douane (jamais un drapeau émoji)', () => {
  it('lit la nationalité dans la description', () => {
    expect(cuisineDeLieu({ description: 'Trattoria familiale' })).toEqual({ code: 'ITA', mot: 'italien' })
    expect(cuisineDeLieu({ description: 'Ramen et donburi' })).toEqual({ code: 'JPN', mot: 'japonais' })
    expect(cuisineDeLieu({ description: 'Cantine libanaise, mezze' })).toEqual({ code: 'LBN', mot: 'libanais' })
    expect(cuisineDeLieu({ description: 'Bo bun et banh mi' })).toEqual({ code: 'VIE', mot: 'vietnamien' })
    expect(cuisineDeLieu({ description: 'Couscous royal, tajines' })).toEqual({ code: 'MAR', mot: 'marocain' })
  })
  it('la maison n’a pas de tampon : cuisine française (ou muette) → null', () => {
    expect(cuisineDeLieu({ description: 'Bistrot de quartier, cuisine française' })).toBeNull()
    expect(cuisineDeLieu({ description: 'Bouillon historique' })).toBeNull()
    expect(cuisineDeLieu({})).toBeNull()
  })
  it('les codes font toujours 3 lettres majuscules (façon scoreboard) — un tampon, pas un texte', () => {
    for (const desc of ['pizzeria', 'sushi', 'tapas', 'taqueria', 'injera', 'pho']) {
      const c = cuisineDeLieu({ description: desc })
      expect(c).not.toBeNull()
      expect(c!.code).toMatch(/^[A-Z]{3}$/)
    }
  })
  it('les 21 tampons du picker sont ceux que la lecture connaît', () => {
    expect(TAMPONS_CUISINE).toHaveLength(21)
    for (const c of TAMPONS_CUISINE) {
      expect(ADJ_CUISINE[c.code]).toBeTruthy()
      expect(c.code).toMatch(/^[A-Z]{3}$/)
    }
  })
})

// ── corriger à la main : ce qui est écrit doit se relire ────────────────
// le garde-fou du script de fusion, porté dans les tests : chaque couple
// (type, tampon) écrit par decrireLieu() DOIT se relire à l'identique.
describe('decrireLieu — écrire un choix que la lecture rend exactement', () => {
  it('les 10 mots de type se relisent, seuls', () => {
    for (const type of TYPES_LIEU) {
      expect(typeDeLieu({ description: MOT_TYPE[type], envies: [] })).toBe(type)
    }
  })

  it('les 21 adjectifs de cuisine se relisent, posés sur un resto', () => {
    for (const [code, adj] of Object.entries(ADJ_CUISINE)) {
      expect(cuisineDeLieu({ description: `Restaurant ${adj}` })?.code).toBe(code)
    }
  })

  it('les 10 types × les 22 tampons (aucun compris) : 220 couples relus juste', () => {
    const tampons: (string | null)[] = [null, ...Object.keys(ADJ_CUISINE)]
    for (const type of TYPES_LIEU) {
      for (const cuisine of tampons) {
        const d = decrireLieu(undefined, type, cuisine)
        expect(`${type}/${cuisine ?? '—'} → « ${d} » → ${typeDeLieu({ description: d, envies: [] })}`).toBe(
          `${type}/${cuisine ?? '—'} → « ${d} » → ${type}`,
        )
        expect(cuisineDeLieu({ description: d })?.code ?? null).toBe(cuisine)
      }
    }
  })

  it('la prose survit quand elle ne contredit pas le choix', () => {
    const d = decrireLieu('table du fond, ambiance prohibition', 'bar', null)
    expect(d).toBe('table du fond, ambiance prohibition · Bar')
    expect(typeDeLieu({ description: d, envies: [] })).toBe('bar')
  })

  it('la prose qui contredit le choix cède : le mot du carnet, nu', () => {
    // « cocktails » se relit bar ; si la main dit resto, c'est resto
    const d = decrireLieu('cocktails et planches', 'resto', null)
    expect(d).toBe('Restaurant')
  })

  it('on n’empile pas les mots du carnet à chaque correction', () => {
    let d = decrireLieu('Bar à vins italien', 'cafe', 'JPN')
    expect(d).toBe('Café japonais')
    d = decrireLieu(d, 'glace', null)
    expect(d).toBe('Glacier')
  })

  it('retirer le tampon retire vraiment le tampon', () => {
    const d = decrireLieu('Trattoria familiale', 'resto', null)
    expect(cuisineDeLieu({ description: d })).toBeNull()
  })
})
