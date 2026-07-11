// ── tests des marques émoji (chantier 2) — logique PURE, sans DOM ──
// les tests tournent en node : on stubbe un localStorage minimal en mémoire.
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
  CLE_MARQUES,
  lireMarques,
  poserMarque,
  retirerMarque,
  premierEmoji,
  sAbonnerMarques,
} from '../marques'

beforeEach(() => {
  memoire.clear()
})

describe('poser / retirer / lire', () => {
  it('pose une marque et la relit', () => {
    expect(poserMarque('lieu-a', '🍺')).toBe(true)
    expect(lireMarques()).toEqual({ 'lieu-a': '🍺' })
  })

  it('re-poser remplace la marque du lieu (une seule par lieu)', () => {
    poserMarque('lieu-a', '🍺')
    poserMarque('lieu-a', '🍷')
    expect(lireMarques()).toEqual({ 'lieu-a': '🍷' })
  })

  it('retirer efface la marque, sans toucher les autres — et reste idempotent', () => {
    poserMarque('lieu-a', '🍺')
    poserMarque('lieu-b', '☕')
    retirerMarque('lieu-a')
    expect(lireMarques()).toEqual({ 'lieu-b': '☕' })
    retirerMarque('lieu-a') // déjà partie : rien ne casse
    expect(lireMarques()).toEqual({ 'lieu-b': '☕' })
  })

  it('stockage abîmé → objet vide, et on peut reposer', () => {
    memoire.set(CLE_MARQUES, '{pas du json')
    expect(lireMarques()).toEqual({})
    memoire.set(CLE_MARQUES, '["un", "tableau"]')
    expect(lireMarques()).toEqual({})
    expect(poserMarque('lieu-a', '🌿')).toBe(true)
    expect(lireMarques()).toEqual({ 'lieu-a': '🌿' })
  })
})

describe('premierEmoji : le PREMIER émoji, en graphème complet', () => {
  it('retrouve un émoji simple, où qu’il soit dans la saisie', () => {
    expect(premierEmoji('🍕')).toBe('🍕')
    expect(premierEmoji('la pizza du 🍕 mardi')).toBe('🍕')
  })

  it('un graphème COMPOSÉ (ZWJ) sort entier, jamais coupé', () => {
    expect(premierEmoji('👨‍🍳 le chef')).toBe('👨‍🍳')
    // deux émojis : le premier gagne
    expect(premierEmoji('👨‍🍳🍺')).toBe('👨‍🍳')
  })

  it('un drapeau (deux Regional Indicators) sort entier', () => {
    expect(premierEmoji('🇫🇷 cocorico')).toBe('🇫🇷')
  })

  it('poserMarque garde le graphème composé complet', () => {
    poserMarque('lieu-a', '👨‍🍳 et du texte autour')
    expect(lireMarques()['lieu-a']).toBe('👨‍🍳')
  })
})

describe('rejet du texte sans émoji', () => {
  it('lettres, chiffres, ponctuation : null — et la pose est refusée', () => {
    expect(premierEmoji('abc')).toBe(null)
    expect(premierEmoji('123 !?')).toBe(null)
    expect(premierEmoji('')).toBe(null)
    expect(poserMarque('lieu-a', 'que du texte')).toBe(false)
    expect(lireMarques()).toEqual({})
    expect(memoire.has(CLE_MARQUES)).toBe(false) // rien d’écrit du tout
  })
})

describe('la clé de stockage (le contrat avec db.ts)', () => {
  it('reste `jeudi-marques` : préfixe jeudi- → effacerTout la balaie, et exporterMesDonnees l’exporte via lireMarques', () => {
    expect(CLE_MARQUES).toBe('jeudi-marques')
    expect(CLE_MARQUES.startsWith('jeudi-')).toBe(true)
    poserMarque('lieu-a', '❤️')
    expect(memoire.has(CLE_MARQUES)).toBe(true)
  })
})

describe('sAbonnerMarques (React écoute les changements)', () => {
  it('prévenu à la pose et au retrait — jamais sur un rejet, plus rien après désabonnement', () => {
    let signaux = 0
    const off = sAbonnerMarques(() => {
      signaux++
    })

    poserMarque('lieu-a', '🎶')
    expect(signaux).toBe(1)
    poserMarque('lieu-a', 'pas un émoji') // rejeté → pas de signal
    expect(signaux).toBe(1)
    retirerMarque('lieu-a')
    expect(signaux).toBe(2)
    retirerMarque('lieu-a') // déjà partie → pas de signal
    expect(signaux).toBe(2)

    off()
    poserMarque('lieu-b', '💃')
    expect(signaux).toBe(2)
  })
})
