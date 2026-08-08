// ════════════════════════════════════════════════════════════════
// jeudi. — LE SUPER 8 (la logique pure — voir CHANTIER_SUPER8.md)
// Un clip est une photo qui bouge : 10 s max, muet par défaut, importé
// de la galerie comme le tirage. AUCUN refus — on lit la date de
// création (l'atome moov, l'équivalent vidéo de l'EXIF) uniquement
// pour que le carnet dise la vérité : un clip de ce soir naît frais,
// un clip du mois dernier naît souvenir, marqué par l'usure.
//
// Deux couches de rendu, JAMAIS cuites dans le fichier :
//   · la chambre noire — les réglages de l'utilisateur (JSON), qu'il
//     peut rouvrir et changer des mois plus tard ;
//   · l'usure — calculée depuis l'âge à CHAQUE projection : le même
//     clip est plus rayé à 2 mois qu'à 2 semaines, sans qu'aucun
//     fichier n'ait bougé. Abîmé, jamais détruit (plafond).
// ════════════════════════════════════════════════════════════════

// ── les bornes de la cartouche ──────────────────────────────────
export const DUREE_MAX_S = 10
/** côté max du réencodage (720p vertical ou horizontal) */
export const COTE_MAX_CLIP = 1280
/** qualité du photogramme (même chiffre que le tirage) */
export const QUALITE_PHOTOGRAMME = 0.82

// ── le format de sortie : mp4 si la machine sait, sinon webm ────
// Safari/iOS enregistre en mp4 (lisible partout), Chrome/Android en
// webm. On stocke le mime avec le clip — pas d'usine à transcodage
// tant qu'un vrai problème de lecture n'est pas constaté (§7.4).
const MIMES_PREFERES = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm']

export function choisirMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'video/webm'
  return MIMES_PREFERES.find((m) => MediaRecorder.isTypeSupported(m)) ?? 'video/webm'
}

/** l'extension de fichier qui va avec le mime du clip */
export function extensionClip(mime: string): string {
  return /mp4/i.test(mime) ? 'mp4' : 'webm'
}

// ── la date de création : l'atome moov, l'EXIF de la vidéo ──────
// Un MP4/MOV est une suite de boîtes [taille u32][type 4cc]. La date
// vit dans moov → mvhd → creation_time (secondes depuis 1904-01-01
// UTC — l'époque QuickTime). Le moov est souvent EN FIN de fichier
// (téléphones) : on marche de boîte en boîte par File.slice, on ne
// lit jamais le fichier entier.
// Ne sert QU'À `prise_le` (la fraîcheur) — jamais à refuser (§1.1).

/** l'écart entre l'époque QuickTime (1904) et l'époque Unix (1970) */
const EPOQUE_QUICKTIME_S = 2082844800

const fourCC = (v: DataView, o: number): string =>
  String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3))

/** parse un creation_time QuickTime (secondes depuis 1904, UTC) —
 *  null si vide ou aberrant (appareil sans horloge : 0, ou < 1971) */
export function dateQuickTime(secondes: number): Date | null {
  if (!Number.isFinite(secondes) || secondes <= 0) return null
  const d = new Date((secondes - EPOQUE_QUICKTIME_S) * 1000)
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 1971) return null
  return d
}

/** cherche mvhd dans un buffer moov déjà en mémoire → Date | null */
export function lireMvhd(buf: ArrayBuffer): Date | null {
  const v = new DataView(buf)
  let p = 0
  while (p + 8 <= v.byteLength) {
    const taille = v.getUint32(p)
    const type = fourCC(v, p + 4)
    if (type === 'mvhd') {
      const version = v.getUint8(p + 8)
      if (version === 0 && p + 16 <= v.byteLength) return dateQuickTime(v.getUint32(p + 12))
      if (version === 1 && p + 20 <= v.byteLength)
        return dateQuickTime(Number(v.getBigUint64(p + 12)))
      return null
    }
    if (taille < 8) return null // boîte malformée : on abandonne proprement
    p += taille
  }
  return null
}

/** la date de création inscrite dans le fichier vidéo — null si
 *  illisible. Ne jette jamais : l'appelant a son repli
 *  (lastModified, puis now — le doute profite à l'utilisateur). */
export async function lireDateCreation(f: Blob): Promise<Date | null> {
  try {
    let p = 0
    let boites = 0
    while (p + 8 <= f.size && boites < 64) {
      boites++
      const tete = new DataView(await f.slice(p, p + 16).arrayBuffer())
      if (tete.byteLength < 8) return null
      let taille: number = tete.getUint32(0)
      const type = fourCC(tete, 4)
      if (taille === 1) {
        // largesize 64 bits (gros fichiers)
        if (tete.byteLength < 16) return null
        taille = Number(tete.getBigUint64(8))
      } else if (taille === 0) {
        taille = f.size - p // « jusqu'à la fin du fichier »
      }
      if (taille < 8) return null
      if (type === 'moov') {
        // mvhd vit en tête du moov : 64 Ko suffisent toujours
        const moov = await f.slice(p + 8, p + Math.min(taille, 65536)).arrayBuffer()
        return lireMvhd(moov)
      }
      p += taille
    }
  } catch {
    /* fichier tordu / tronqué : l'appelant a son repli */
  }
  return null
}

/** la date d'une bobine, avec la chaîne de repli du §1.1 : moov →
 *  lastModified → maintenant. `sure` = lue dans le fichier. */
export async function dateBobine(f: File): Promise<{ date: Date; sure: boolean }> {
  const moov = await lireDateCreation(f)
  if (moov) return { date: moov, sure: true }
  const lm = new Date(f.lastModified)
  if (!Number.isNaN(lm.getTime()) && lm.getTime() > 0) return { date: lm, sure: false }
  return { date: new Date(), sure: false }
}

// ── la chambre noire : les réglages de l'utilisateur ────────────
export const TEINTES = ['couleur', 'delave', 'nb', 'sepia'] as const
export type Teinte = (typeof TEINTES)[number]

export interface ReglagesRendu {
  prereglage?: string
  /** 0..1 chacun */
  grain: number
  vignette: number
  tremblement: number
  teinte: Teinte
}

/** le rendu signature — celui qui ne touche à rien obtient le super 8 */
export function reglagesParDefaut(): ReglagesRendu {
  return { prereglage: 'super8', grain: 0.6, vignette: 0.4, tremblement: 0.3, teinte: 'delave' }
}

/** relit des réglages venus du cloud (jsonb) sans jamais jeter :
 *  champ manquant ou aberrant → la valeur du préréglage */
export function normaliserReglages(brut: unknown): ReglagesRendu {
  const r = reglagesParDefaut()
  if (!brut || typeof brut !== 'object') return r
  const o = brut as Record<string, unknown>
  const n = (x: unknown, defaut: number) =>
    typeof x === 'number' && Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : defaut
  return {
    prereglage: typeof o.prereglage === 'string' ? o.prereglage : r.prereglage,
    grain: n(o.grain, r.grain),
    vignette: n(o.vignette, r.vignette),
    tremblement: n(o.tremblement, r.tremblement),
    teinte: TEINTES.includes(o.teinte as Teinte) ? (o.teinte as Teinte) : r.teinte,
  }
}

// ── l'usure : le temps dépose ses traces, dans cet ordre ────────
// poussières → rayures → sautillement → halos → dérive sépia.
// Chaque trace monte linéairement entre son début et son plafond,
// puis S'ARRÊTE : un clip de 3 ans n'est pas deux fois plus détruit
// qu'un clip d'un an et demi — abîmé, jamais illisible.
export interface Usure {
  poussieres: number
  rayures: number
  sautillement: number
  halos: number
  sepia: number
}

/** monte de 0 (à `debutJ`) à `max` (à `pleinJ`), puis plafonne */
function rampe(ageJours: number, debutJ: number, pleinJ: number, max: number): number {
  if (ageJours <= debutJ) return 0
  if (ageJours >= pleinJ) return max
  return ((ageJours - debutJ) / (pleinJ - debutJ)) * max
}

export function usureDe(ageJours: number): Usure {
  const a = Math.max(0, ageJours)
  return {
    poussieres: rampe(a, 2, 30, 0.5),
    rayures: rampe(a, 7, 180, 0.7),
    sautillement: rampe(a, 30, 365, 0.6),
    halos: rampe(a, 90, 540, 0.5),
    sepia: rampe(a, 180, 540, 0.35),
  }
}

/** l'âge d'un clip en jours, depuis sa date de prise */
export function ageEnJours(priseLe: string | Date | undefined, maintenant = new Date()): number {
  if (!priseLe) return 0
  const d = new Date(priseLe)
  if (Number.isNaN(d.getTime())) return 0
  return Math.max(0, (maintenant.getTime() - d.getTime()) / 86400000)
}

// ── réglages + usure → variables CSS de l'écran de projection ───
// Deux couches distinctes qui S'AJOUTENT : le grain choisi reste le
// sien, le temps dépose ses traces dessus (§1.6).
const FILTRES_TEINTE: Record<Teinte, string> = {
  couleur: '',
  delave: 'saturate(0.78) contrast(0.94)',
  nb: 'grayscale(1) contrast(1.05)',
  sepia: 'sepia(0.55) saturate(0.8)',
}

export function habillageVersStyle(
  r: ReglagesRendu,
  ageJours: number,
): Record<string, string> {
  const us = usureDe(ageJours)
  const filtres = [FILTRES_TEINTE[r.teinte]]
  if (us.sepia > 0.005)
    filtres.push(`sepia(${us.sepia.toFixed(2)}) saturate(${(1 - us.sepia * 0.6).toFixed(2)})`)
  return {
    '--s8-grain': r.grain.toFixed(2),
    '--s8-vignette': r.vignette.toFixed(2),
    // tremblement voulu + sautillement du projecteur : même geste à l'écran
    '--s8-trem': `${(r.tremblement * 1.4 + us.sautillement * 2).toFixed(2)}px`,
    '--s8-pouss': us.poussieres.toFixed(2),
    '--s8-ray': us.rayures.toFixed(2),
    '--s8-halo': us.halos.toFixed(2),
    '--s8-filtre': filtres.filter(Boolean).join(' ') || 'none',
  }
}

/** la durée au crayon sous un photogramme : « 8 s » */
export function libelleDuree(s: number | undefined): string {
  if (!s || s <= 0) return ''
  return `${Math.round(s)} s`
}
