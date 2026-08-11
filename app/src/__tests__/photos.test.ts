// ── le retrait d'une photo : la porte de sortie doit toujours s'ouvrir ──
// Depuis la 0018 le signalement s'écrit en base (signalerCible) — le mailto:
// et son test sont morts avec lui. Reste l'adresse publiée : elle est une
// obligation des stores (Apple 1.2 §4), elle ne doit pas changer par accident.
import { describe, it, expect } from 'vitest'
import { CONTACT_RETRAIT } from '../photos'

describe('CONTACT_RETRAIT', () => {
  it('reste l’adresse annoncée dans la politique de confidentialité', () => {
    expect(CONTACT_RETRAIT).toBe('contact@jeudi.app')
  })
})
