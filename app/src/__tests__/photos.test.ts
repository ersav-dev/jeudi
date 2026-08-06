// ── le retrait d'une photo : la porte de sortie doit toujours s'ouvrir ──
// jeudi ne masque pas les visages ; la contrepartie est ce lien, qui doit
// marcher même avec un nom de lieu tordu (apostrophes, &, accents).
import { describe, it, expect } from 'vitest'
import { lienSignalement, CONTACT_RETRAIT } from '../photos'

describe('lienSignalement', () => {
  it('vise l’adresse de retrait annoncée dans la politique', () => {
    expect(lienSignalement('le bisou', 1, 3).startsWith(`mailto:${CONTACT_RETRAIT}?`)).toBe(true)
  })

  it('porte le lieu et la position de la photo dans le message', () => {
    const l = lienSignalement('le bisou', 2, 4)
    expect(decodeURIComponent(l)).toContain('le bisou')
    expect(decodeURIComponent(l)).toContain('Photo : 2/4')
  })

  it('encode les noms qui casseraient l’URL', () => {
    const l = lienSignalement("chez l'Ami Jean & Co", 1, 1)
    // ni & ni espace nu : sinon le corps du mail est tronqué au premier &
    expect(l.split('body=')[1]).not.toContain('&')
    expect(l).not.toMatch(/ /)
    expect(decodeURIComponent(l)).toContain("chez l'Ami Jean & Co")
  })
})
