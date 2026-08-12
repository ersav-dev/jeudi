// ── le push : la clé VAPID doit devenir des octets EXACTS ──────────
// applicationServerKey mal décodée = subscribe qui échoue en silence sur
// certains navigateurs. On fige le décodage base64url (padding, -/_).
import { describe, it, expect } from 'vitest'
import { cleVersOctets } from '../push'

describe('cleVersOctets', () => {
  it('décode le base64url standard (sans padding)', () => {
    // 'Man' = [77, 97, 110] — le grand classique
    expect([...cleVersOctets('TWFu')]).toEqual([77, 97, 110])
  })

  it('rajoute le padding manquant (les clés VAPID n’en ont jamais)', () => {
    // 'Ma' = [77, 97] : base64 'TWE=' → base64url 'TWE'
    expect([...cleVersOctets('TWE')]).toEqual([77, 97])
    // 'M' = [77] : base64 'TQ==' → base64url 'TQ'
    expect([...cleVersOctets('TQ')]).toEqual([77])
  })

  it('traduit - et _ (l’alphabet url) vers + et /', () => {
    // 0xFB 0xFF encode en base64 '+/8=' → base64url '-_8'
    expect([...cleVersOctets('-_8')]).toEqual([0xfb, 0xff])
  })

  it('avale une vraie clé VAPID (65 octets, préfixe 0x04 non compressé)', () => {
    const octets = cleVersOctets(
      'BMTt-po-84qJttP9CA4JnXGS9pAKCojnOuAfDOJcYGwc9m5vZi_tzwCx9Wo_mJ6yRZyLqig_yXoxzbmMgR1-lls',
    )
    expect(octets.length).toBe(65)
    expect(octets[0]).toBe(0x04)
  })
})
