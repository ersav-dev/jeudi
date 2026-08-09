// ── tests des doublons : un lieu, une épingle — mais jamais deux lieux
//    voisins fondus en un seul ──────────────────────────────────────────
import { describe, it, expect } from 'vitest'
import {
  normaliserNom,
  memeLieu,
  dedoublonner,
  distanceEntre,
  type LieuComparable,
} from '../doublons'

// un lieu de test : le strict nécessaire, le reste par défaut
const L = (
  id: string,
  nom: string,
  lat: number,
  lng: number,
  extra: Partial<LieuComparable> = {},
): LieuComparable => ({ id, nom, lat, lng, creeLe: '2026-01-01T00:00:00.000Z', ...extra })

// les vraies coordonnées du fond importé (supabase/imports/…_v2_tout.sql)
const HARRY_GOOGLE = L('a', "Harry's Bar Paris", 48.8692089, 2.3321714)
const HARRY_CURATED = L('b', "Harry's New York Bar", 48.8692491, 2.3321281)
const ANTIPODE_1 = L('c', 'Peniche Antipode', 48.8836, 2.3745)
const ANTIPODE_2 = L('d', 'Péniche Antipode', 48.8836, 2.3745)
const KODAWARI_1 = L('e', 'Kodawari Ramen (Yokochō)', 48.8532, 2.3382)
const KODAWARI_2 = L('f', 'Kodawari Ramen', 48.85317, 2.33823)
// le piège des quais : quatre péniches DIFFÉRENTES au même point géocodé
const DAME_CANTON = L('g', 'La Dame de Canton', 48.8366207, 2.3754059)
const BATEAU_PHARE = L('h', 'Bateau Phare', 48.8366207, 2.3754059)
const NIX_NOX = L('i', 'Nix Nox', 48.8366207, 2.3754059)
// deux voisins de palier : Septime et sa cave, à ~38 m
const SEPTIME = L('j', 'Septime', 48.8535, 2.3818)
const SEPTIME_CAVE = L('k', 'Septime La Cave', 48.85384, 2.3818)

describe('normaliserNom — casse, accents et ponctuation ne font pas un autre lieu', () => {
  it('rabat les variantes d’écriture sur la même clé', () => {
    expect(normaliserNom('Péniche Antipode')).toBe(normaliserNom('Peniche Antipode'))
    expect(normaliserNom('Bisou.')).toBe(normaliserNom('Bisou'))
    expect(normaliserNom('La Cité Fertile')).toBe(normaliserNom('La Cite Fertile'))
    expect(normaliserNom('Le Mary Céleste')).toBe('le mary celeste')
  })
})

describe('memeLieu — la plainte d’Ersan', () => {
  it('Harry’s : deux noms, 5 m d’écart → un seul bar', () => {
    expect(Math.round(distanceEntre(HARRY_GOOGLE, HARRY_CURATED))).toBeLessThan(15)
    expect(memeLieu(HARRY_GOOGLE, HARRY_CURATED)).toBe(true)
  })

  it('« les trucs du genre » : l’accent, la parenthèse, le préfixe', () => {
    expect(memeLieu(ANTIPODE_1, ANTIPODE_2)).toBe(true)
    expect(memeLieu(KODAWARI_1, KODAWARI_2)).toBe(true)
    expect(
      memeLieu(
        L('x', 'Club Coca-Cola - Quai de la Photo', 48.8366207, 2.3754059),
        L('y', 'Quai de la Photo', 48.8366207, 2.3754059),
      ),
    ).toBe(true)
  })
})

describe('memeLieu — ce qu’il ne faut SURTOUT pas fondre', () => {
  it('les péniches du même quai restent des lieux distincts', () => {
    expect(memeLieu(DAME_CANTON, BATEAU_PHARE)).toBe(false)
    expect(memeLieu(DAME_CANTON, NIX_NOX)).toBe(false)
    expect(memeLieu(BATEAU_PHARE, NIX_NOX)).toBe(false)
  })

  it('deux voisins de trottoir à 38 m ne sont pas le même lieu', () => {
    expect(memeLieu(SEPTIME, SEPTIME_CAVE)).toBe(false)
  })

  it('un mot passe-partout en commun ne suffit pas', () => {
    expect(
      memeLieu(L('x', 'Rosa Bonheur sur Seine', 48.8637, 2.3), L('y', 'Flow Paris', 48.8637, 2.3)),
    ).toBe(false)
    expect(memeLieu(L('x', 'Le 404', 48.865, 2.36), L('y', 'Le 1905', 48.865, 2.36))).toBe(false)
  })

  it('même enseigne, autre adresse : deux lieux (au-delà de 200 m)', () => {
    expect(
      memeLieu(L('x', 'Bouillon Chartier', 48.8718, 2.3434), L('y', 'Bouillon Chartier', 48.8434, 2.325)),
    ).toBe(false)
  })
})

describe('dedoublonner — une épingle par lieu', () => {
  it('ne laisse plus aucun doublon dans le fond réel', () => {
    const fond = [
      HARRY_GOOGLE, HARRY_CURATED, ANTIPODE_1, ANTIPODE_2, KODAWARI_1, KODAWARI_2,
      DAME_CANTON, BATEAU_PHARE, NIX_NOX, SEPTIME, SEPTIME_CAVE,
    ]
    const propre = dedoublonner(fond)
    // 11 fiches, 3 grappes de 2 → 8 lieux
    expect(propre).toHaveLength(8)
    // et le test qui compte : plus une seule paire « même lieu »
    for (let i = 0; i < propre.length; i++)
      for (let j = i + 1; j < propre.length; j++)
        expect([propre[i].nom, propre[j].nom, memeLieu(propre[i], propre[j])]).toEqual([
          propre[i].nom,
          propre[j].nom,
          false,
        ])
    // les péniches, elles, sont toutes restées
    expect(propre.map((l) => l.id)).toEqual(expect.arrayContaining(['g', 'h', 'i', 'j', 'k']))
  })

  it('mon spot bat le fond éditorial, même s’il est plus pauvre', () => {
    const decor = L('fond', "Harry's New York Bar", 48.8692491, 2.3321281, {
      description: 'institution des cocktails',
      note: 'un tip du fond',
    })
    const mien = L('moi', "Harry's Bar Paris", 48.8692089, 2.3321714)
    const rang = (l: LieuComparable) => (l.id === 'moi' ? 2 : 0)
    expect(dedoublonner([decor, mien], rang).map((l) => l.id)).toEqual(['moi'])
    // l'ordre d'entrée ne change rien au vainqueur
    expect(dedoublonner([mien, decor], rang).map((l) => l.id)).toEqual(['moi'])
  })

  it('à rang égal, la fiche la plus riche gagne', () => {
    const pauvre = L('pauvre', 'Péniche Antipode', 48.8836, 2.3745)
    const riche = L('riche', 'Peniche Antipode', 48.8836, 2.3745, {
      photos: [{}, {}],
      note: 'le meilleur coucher de soleil du canal',
    })
    expect(dedoublonner([pauvre, riche]).map((l) => l.id)).toEqual(['riche'])
  })

  it('à rang et richesse égaux, la plus ancienne gagne (c’est elle qu’on référence)', () => {
    const vieux = L('vieux', 'Bisou', 48.865, 2.365, { creeLe: '2025-01-01T00:00:00.000Z' })
    const neuf = L('neuf', 'Bisou.', 48.865, 2.365, { creeLe: '2026-08-01T00:00:00.000Z' })
    expect(dedoublonner([neuf, vieux]).map((l) => l.id)).toEqual(['vieux'])
  })

  it('conserve l’ordre d’entrée des survivants et ne touche à rien sans doublon', () => {
    const liste = [DAME_CANTON, BATEAU_PHARE, NIX_NOX]
    expect(dedoublonner(liste)).toEqual(liste)
    expect(dedoublonner([])).toEqual([])
    expect(dedoublonner([HARRY_GOOGLE])).toEqual([HARRY_GOOGLE])
  })

  it('une chaîne de trois fiches du même lieu ne laisse qu’une épingle', () => {
    const trois = [
      L('1', 'Le Bateau Phare', 48.8366207, 2.3754059),
      L('2', 'Bateau Phare', 48.8366207, 2.3754059),
      L('3', 'bateau phare', 48.83663, 2.3754),
    ]
    expect(dedoublonner(trois)).toHaveLength(1)
  })
})
