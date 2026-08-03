// ════════════════════════════════════════════════════════════════════
// LA PELLICULE FRAÎCHE — la logique pure du tas de polaroids
//
// La carte cesse d'être un plan de spots : elle devient la page du carnet
// où la nuit d'hier sèche encore. Chaque endroit où quelqu'un du cercle a
// shooté récemment porte un TAS de tirages piqué sur la carte — plus c'est
// frais, plus le tas est grand ; plus ça date, plus il fond, jusqu'au petit
// tirage souvenir qui, lui, ne part jamais (la carte a toujours une mémoire).
//
// Ce module ne connaît ni le DOM ni le réseau : que des dates et des lieux.
// Tout ce qui se voit à l'écran (taille, sépia, prénom, heure, ordre du
// carrousel, la ligne-boussole) se décide ICI et se teste au dixième d'heure.
// ════════════════════════════════════════════════════════════════════
import type { Lieu, PhotoLieu } from './db'

/** les trois seuils de la fonte (heures) — l'échelle modulaire ~1,33 */
export const SEUIL_CHAUD = 6
export const SEUIL_JOUR = 24
/** au-delà : la feuille tombe, il ne reste que le tirage souvenir */
export const SEUIL_MEMOIRE = 48

/** une photo datée, prête à être posée sur la carte */
export interface PhotoPellicule extends PhotoLieu {
  /** ISO 8601 — sans elle, une photo n'entre pas dans la pellicule */
  priseLe: string
}

/** un tas de tirages sur un spot : ce qu'un marqueur doit savoir dessiner */
export interface Tas {
  lieu: Lieu
  /** de la plus fraîche à la plus ancienne (la 1re est celle du dessus) */
  photos: PhotoPellicule[]
  /** âge en heures de la plus récente */
  fraicheur: number
  /** combien de tirages encore vivants (≤ 48 h) — l'épaisseur de l'éventail.
   *  JAMAIS affiché en chiffre : c'est un compteur de likes déguisé. */
  vivantes: number
  /** le prénom de celui qui a shooté le tirage du dessus */
  auteur: string
  /** la soirée du tirage du dessus (YYYY-MM-DD) — la clé du sceau */
  soiree: string
  /** la largeur du tas en px, avant facteur de zoom */
  taille: 80 | 60 | 45 | 34
  /** les feuilles qui viennent de dépasser 48 h : elles pâlissent, virent
   *  sépia et TOMBENT (jamais un `opacity:0 + scale(.6)` — ça se lirait
   *  comme un delete, pas comme un souvenir qui s'efface). Passé l'heure de
   *  la chute, elles ne sont plus rendues du tout. */
  mortes: PhotoPellicule[]
  /** au-delà de 48 h : un seul tirage, sépia. Le souvenir. */
  souvenir: boolean
  /** ma photo sèche encore (visible_le pas atteint) : elle se développe */
  enDeveloppement: boolean
  /** l'étiquette de cire est-elle brisée pour CETTE soirée ? */
  vu: boolean
}

/** l'âge en heures d'un instant ISO (négatif ramené à 0 : pas de futur) */
export function heuresDepuis(iso: string, maintenant: number): number {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return Infinity
  return Math.max(0, (maintenant - t) / 3_600_000)
}

/** la taille du tas = la fraîcheur du tirage du dessus (échelle ~1,33) */
export function taillePolaroid(h: number): 80 | 60 | 45 | 34 {
  if (h <= SEUIL_CHAUD) return 80
  if (h <= SEUIL_JOUR) return 60
  if (h <= SEUIL_MEMOIRE) return 45
  return 34
}

/** l'heure au crayon sous le tas — un FAIT, jamais un signal (elle ne bouge
 *  plus une fois écrite : « il y a 2h » · « hier » · « il y a 3j ») */
export function libelleAge(h: number): string {
  if (!Number.isFinite(h)) return ''
  if (h < 1) return 'à l’instant'
  if (h < SEUIL_JOUR) return `il y a ${Math.round(h)}h`
  if (h < SEUIL_MEMOIRE) return 'hier'
  return `il y a ${Math.round(h / 24)}j`
}

/** la même heure, FLOUE — la granularité due au public (vie privée §1.10) :
 *  hors du cercle, on ne donne jamais l'heure précise d'un tirage. */
export function libelleAgeFlou(h: number): string {
  if (!Number.isFinite(h)) return ''
  if (h < SEUIL_JOUR) return 'ce soir'
  if (h < SEUIL_MEMOIRE) return 'hier soir'
  return `il y a ${Math.round(h / 24)}j`
}

/** la SOIRÉE à laquelle appartient un instant : une photo de 2 h du matin
 *  appartient à la nuit de la veille → on recule de 6 h avant de dater.
 *  Date LOCALE (la nuit se vit à l'heure de la ville, pas en UTC). */
export function soireeDe(iso: string, decalageH = 6): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const d = new Date(t - decalageH * 3_600_000)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const jj = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${jj}`
}

/** la clé d'un sceau : un lieu × une soirée (jamais une photo) */
export function cleVue(lieuId: string, soiree: string): string {
  return `${lieuId}|${soiree}`
}

/** ce tas a-t-il déjà été ouvert POUR CETTE soirée ? */
export function estVu(tas: Pick<Tas, 'lieu' | 'soiree'>, vues: Set<string>): boolean {
  return vues.has(cleVue(tas.lieu.id, tas.soiree))
}

/** les photos datées d'un lieu, de la plus fraîche à la plus ancienne */
function photosDatees(lieu: Lieu): PhotoPellicule[] {
  const datees = (lieu.photos ?? []).filter(
    (p): p is PhotoPellicule => typeof p.priseLe === 'string' && !Number.isNaN(Date.parse(p.priseLe)),
  )
  return [...datees].sort((a, b) => Date.parse(b.priseLe) - Date.parse(a.priseLe))
}

/**
 * LE constructeur : des lieux → les tas à piquer sur la carte, du plus frais
 * au plus ancien (c'est aussi l'ordre vertical du carrousel : *la nuit*, pas
 * *ton quartier* — la distance ne pondère rien ici).
 *
 * `vues` = les sceaux déjà brisés (clés `lieuId|soiree`).
 */
export function construireTas(lieux: Lieu[], maintenant: number, vues?: Set<string>): Tas[] {
  const tas: Tas[] = []
  for (const lieu of lieux) {
    const photos = photosDatees(lieu)
    if (!photos.length) continue
    const haute = photos[0]
    const fraicheur = heuresDepuis(haute.priseLe, maintenant)
    const souvenir = fraicheur > SEUIL_MEMOIRE
    const vivantes = photos.filter((p) => heuresDepuis(p.priseLe, maintenant) <= SEUIL_MEMOIRE).length
    const soiree = soireeDe(haute.priseLe)
    // la chute se joue à l'écran pendant l'heure qui suit la mort d'une
    // feuille — au-delà, elle n'existe plus (on ne rejoue pas un deuil)
    const mortes = souvenir
      ? []
      : photos
          .filter((p) => {
            const h = heuresDepuis(p.priseLe, maintenant)
            return h > SEUIL_MEMOIRE && h <= SEUIL_MEMOIRE + 1
          })
          .slice(0, 2)
    tas.push({
      lieu,
      // passé 48 h il ne reste qu'un tirage : le souvenir, seul et sépia
      photos: souvenir ? [haute] : photos.filter((p) => heuresDepuis(p.priseLe, maintenant) <= SEUIL_MEMOIRE),
      mortes,
      fraicheur,
      vivantes,
      auteur: (haute.auteurPrenom ?? '').trim().toLowerCase(),
      soiree,
      taille: taillePolaroid(fraicheur),
      souvenir,
      enDeveloppement:
        typeof haute.visibleLe === 'string' && Date.parse(haute.visibleLe) > maintenant,
      vu: souvenir || (vues ? vues.has(cleVue(lieu.id, soiree)) : false),
    })
  }
  return tas.sort((a, b) => a.fraicheur - b.fraicheur)
}

/** les tas encore vivants (≤ 48 h) — ceux qui font la nuit du cercle.
 *  Les souvenirs restent sur la carte mais ne peuplent pas le carrousel. */
export function tasVivants(tas: Tas[]): Tas[] {
  return tas.filter((t) => !t.souvenir)
}

// ── la ligne du bas : une BOUSSOLE, pas un compteur ──────────────────
// Elle ne parle que de ce qu'on ne peut PAS voir (hors écran, ou pas encore
// lu), et elle NOMME une chose plutôt que de compter des gens. Jamais
// « karim y est encore » : ça, c'est de la surveillance.

const CARDINAUX = ['au nord', 'au nord-est', 'à l’est', 'au sud-est', 'au sud', 'au sud-ouest', 'à l’ouest', 'au nord-ouest'] as const

/** la direction d'un point par rapport à un autre, en mots */
export function directionCardinale(
  depuis: { lat: number; lng: number },
  vers: { lat: number; lng: number },
): string {
  const dy = vers.lat - depuis.lat
  const dx = (vers.lng - depuis.lng) * Math.cos((depuis.lat * Math.PI) / 180)
  // angle horaire depuis le nord, ramené sur 8 secteurs de 45°
  const angle = (Math.atan2(dx, dy) * 180) / Math.PI
  const secteur = Math.round(((angle + 360) % 360) / 45) % 8
  return CARDINAUX[secteur]
}

export interface Boussole {
  texte: string
  /** le tas à rejoindre au tap (la carte y vole) */
  cible?: Tas
}

/**
 * Le mot de la fin, en bas de la carte. Ordre de priorité :
 *   1. des tirages pas lus HORS de l'écran → on donne la direction
 *   2. des tirages pas lus À l'écran → on nomme la personne et le lieu
 *   3. tout est lu → on rend la main
 *   4. rien du tout → une invitation, jamais un constat (l'état vide)
 */
export function boussole(
  tas: Tas[],
  idsALEcran: Set<string>,
  centre: { lat: number; lng: number },
): Boussole {
  const vivants = tasVivants(tas)
  if (!vivants.length) {
    return { texte: 'la ville se recharge — ce soir, c’est toi qui shootes.' }
  }
  const nonLus = vivants.filter((t) => !t.vu)
  if (!nonLus.length) return { texte: 'tout est lu. à toi d’écrire la suite.' }

  const dehors = nonLus.filter((t) => !idsALEcran.has(t.lieu.id))
  if (dehors.length) {
    const cible = dehors[0]
    const ou = directionCardinale(centre, cible.lieu)
    const quoi =
      dehors.length === 1
        ? 'un tirage que tu n’as pas vu'
        : `${dehors.length} tirages que tu n’as pas vus`
    return { texte: `${ou}, ${quoi} →`, cible }
  }
  const cible = nonLus[0]
  const qui = cible.auteur || 'quelqu’un'
  return { texte: `${qui} a laissé quelque chose à ${cible.lieu.nom.toLowerCase()}.`, cible }
}

/** l'état vide d'un spot sans le moindre tirage (dans sa fiche) */
export const VIDE_SPOT = 'aucun polaroid ici. le premier sera le tien.'
