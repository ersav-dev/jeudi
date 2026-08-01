// ════════════════════════════════════════════════════════════════
// jeudi. — LE MOMENT : « ça dit quoi [ce soir] ? »
// Le composant-langage unique du temps (audit du cœur, 01/08) : les
// mêmes presets partout (le deck, le match — et demain la recherche),
// plus « à l'heure près » pour l'heure LIBRE qui manquait à l'app.
// Logique pure ici (testable) ; l'UI vit dans ChoixMoment.tsx.
// ════════════════════════════════════════════════════════════════

export type MomentCle = 'maintenant' | 'soir' | 'demain' | 'jeudi' | 'libre'

export interface Moment {
  cle: MomentCle
  /** ISO local — seulement pour 'libre' (l'heure choisie à la main) */
  iso?: string
}

export const MOMENT_DEFAUT: Moment = { cle: 'maintenant' }

/** la date effective d'un moment, depuis une référence (testable) */
export function dateDuMoment(m: Moment, ref = new Date()): Date {
  const d = new Date(ref)
  if (m.cle === 'soir') {
    d.setHours(22, 0, 0, 0)
    // l'app ouverte après 22h : « ce soir » c'est encore CE soir (pas hier)
    if (d.getTime() < ref.getTime()) return new Date(ref)
    return d
  }
  if (m.cle === 'demain') {
    d.setDate(d.getDate() + 1)
    d.setHours(21, 0, 0, 0)
    return d
  }
  if (m.cle === 'jeudi') {
    // jeudi le plus proche : si on est jeudi avant 22h, c'est CE soir ;
    // jeudi après 22h → celui d'après.
    const brut = (4 - d.getDay() + 7) % 7
    const delta = brut === 0 ? (d.getHours() < 22 ? 0 : 7) : brut
    d.setDate(d.getDate() + delta)
    d.setHours(22, 0, 0, 0)
    return d
  }
  if (m.cle === 'libre' && m.iso) {
    const libre = new Date(m.iso)
    // une heure libre passée est morte : on retombe sur maintenant
    if (isFinite(libre.getTime()) && libre.getTime() > ref.getTime()) return libre
    return new Date(ref)
  }
  return new Date(ref)
}

const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']

/** le libellé court du moment — celui qui s'accorde dans la question
 *  (« ça dit quoi ce soir ? » → « ça dit quoi sam. 20h ? ») et qui
 *  titre le match sur la page des invités. */
export function libelleMoment(m: Moment, ref = new Date()): string {
  if (m.cle === 'maintenant') return 'maintenant'
  if (m.cle === 'soir') return 'ce soir'
  if (m.cle === 'demain') return 'demain soir'
  if (m.cle === 'jeudi') return 'jeudi soir'
  const d = dateDuMoment(m, ref)
  if (d.getTime() <= ref.getTime()) return 'maintenant'
  const h = d.getMinutes() ? `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}` : `${d.getHours()}h`
  return `${JOURS[d.getDay()]} ${h}`
}

/** un moment est « plus tard » s'il vise à plus de 2h d'ici — c'est lui
 *  qui autorise la deadline « avant le rendez-vous » du match. */
export function momentFutur(m: Moment, ref = new Date()): boolean {
  return dateDuMoment(m, ref).getTime() - ref.getTime() > 2 * 3600_000
}

// ── la mémoire : le moment choisi vaut PARTOUT (deck, match…) ────
const CLE = 'jeudi-moment'

export function lireMoment(): Moment {
  try {
    const v = JSON.parse(localStorage.getItem(CLE) ?? '') as Moment
    if (!v || typeof v.cle !== 'string') return MOMENT_DEFAUT
    if (!['maintenant', 'soir', 'demain', 'jeudi', 'libre'].includes(v.cle)) return MOMENT_DEFAUT
    // une heure libre passée est morte : repli silencieux sur maintenant
    if (v.cle === 'libre') {
      const d = v.iso ? new Date(v.iso) : null
      if (!d || !isFinite(d.getTime()) || d.getTime() <= Date.now()) return MOMENT_DEFAUT
    }
    return v
  } catch {
    return MOMENT_DEFAUT
  }
}

export function ecrireMoment(m: Moment): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(m))
  } catch {
    /* navigation privée : le moment vivra le temps de la session */
  }
}
