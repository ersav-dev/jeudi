// ── tests du tuto « notes en marge » — logique PURE, sans DOM ──
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

import { NOTES, noteVue, effacerNote, toutRelire, texteNote, sAbonnerNotes } from '../tuto'

const CLE = 'jeudi-notes-marge'

beforeEach(() => {
  memoire.clear()
})

describe('NOTES (la liste des notes de l’ancien proprio)', () => {
  it('chaque note a un id unique, un texte et un écran', () => {
    expect(new Set(NOTES.map((n) => n.id)).size).toBe(NOTES.length)
    for (const n of NOTES) {
      expect(n.id).toBeTruthy()
      expect(n.texte).toBeTruthy()
      expect(n.ecran).toBeTruthy()
    }
  })

  it('texteNote retrouve le texte ; id inconnu → chaîne vide', () => {
    expect(texteNote('deck-swipe')).toBe('à droite si ça te tente. à gauche, on oublie.')
    expect(texteNote('note-fantome')).toBe('')
  })
})

describe('la séquence : chaque geste efface SA note, les autres restent', () => {
  it('au départ, aucune note n’est vue', () => {
    expect(NOTES.every((n) => !noteVue(n.id))).toBe(true)
  })

  it('effacer une note ne touche pas les autres, l’ordre des gestes est gardé', () => {
    effacerNote('deck-swipe')
    expect(noteVue('deck-swipe')).toBe(true)
    expect(noteVue('deck-tape')).toBe(false)
    expect(noteVue('reglages-differes')).toBe(false)

    effacerNote('deck-tape')
    expect(noteVue('deck-swipe')).toBe(true)
    expect(noteVue('deck-tape')).toBe(true)
    // l'ordre stocké = l'ordre des gestes accomplis
    expect(JSON.parse(memoire.get(CLE)!)).toEqual(['deck-swipe', 'deck-tape'])
  })
})

describe('une-fois : une note effacée le reste, sans doublon', () => {
  it('effacer deux fois = une seule trace (idempotent)', () => {
    effacerNote('carte-point')
    effacerNote('carte-point')
    expect(JSON.parse(memoire.get(CLE)!)).toEqual(['carte-point'])
    expect(noteVue('carte-point')).toBe(true)
  })
})

describe('toutRelire (l’entrée discrète des réglages)', () => {
  it('toutes les notes reviennent, le stockage repart à neuf', () => {
    for (const n of NOTES) effacerNote(n.id)
    expect(NOTES.every((n) => noteVue(n.id))).toBe(true)

    toutRelire()
    expect(NOTES.every((n) => !noteVue(n.id))).toBe(true)
    expect(memoire.has(CLE)).toBe(false)
  })
})

describe('stockage abîmé : on repart de zéro, sans crash', () => {
  it('un JSON pourri → rien de vu, et on peut ré-effacer', () => {
    memoire.set(CLE, '{pas du json')
    expect(noteVue('deck-swipe')).toBe(false)
    effacerNote('deck-swipe')
    expect(noteVue('deck-swipe')).toBe(true)
  })

  it('un contenu qui n’est pas un tableau de strings → filtré', () => {
    memoire.set(CLE, '"coucou"')
    expect(noteVue('deck-swipe')).toBe(false)
    memoire.set(CLE, JSON.stringify(['deck-swipe', 42, null]))
    expect(noteVue('deck-swipe')).toBe(true)
    effacerNote('deck-tape')
    expect(JSON.parse(memoire.get(CLE)!)).toEqual(['deck-swipe', 'deck-tape'])
  })
})

describe('sAbonnerNotes (React écoute les changements)', () => {
  it('prévenu à l’effacement et au reset — plus rien après désabonnement', () => {
    let signaux = 0
    const off = sAbonnerNotes(() => {
      signaux++
    })

    effacerNote('deck-swipe')
    expect(signaux).toBe(1)
    effacerNote('deck-swipe') // déjà effacée → pas de signal
    expect(signaux).toBe(1)
    toutRelire()
    expect(signaux).toBe(2)

    off()
    effacerNote('deck-tape')
    expect(signaux).toBe(2)
  })
})
