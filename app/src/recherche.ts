// ════════════════════════════════════════════════════════════════
// jeudi. — le MOTEUR DE RECHERCHE / RECO personnalisé
// Classe les lieux selon : la REQUÊTE du moment (envies, compagnie, météo,
// texte libre) ET les HABITUDES apprises du spectateur (ce qu'il valide
// souvent vs ce qu'il « bof »). Renvoie une liste classée + les raisons.
//
// Moteur PUR : il ne lit pas le stockage lui-même. Le caller lui passe
// l'historique (construit depuis db.ts) → reste testable et sans couplage.
// ⚠️ ISOLÉ : importé nulle part tant que la logique n'est pas validée.
// ════════════════════════════════════════════════════════════════
import {
  type Lieu,
  type Envie,
  type Compagnie,
  type Meteo,
  distanceM,
  etatHoraire,
} from './db'
import { signalProche } from './deck'

// ── normalisation texte (minuscule + sans accent) pour la recherche ──
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function coutLieu(m?: Meteo): 0 | 1 | 2 | null {
  if (m === 'soleil') return 2
  if (m === 'nuageux') return 1
  if (m === 'pluie') return 0
  return null
}

function ouvertMaintenant(lieu: Lieu, maintenant = new Date()): boolean | null {
  return lieu.horaires ? (etatHoraire(lieu.horaires, maintenant)?.ouvert ?? null) : null
}

// ════════════════════════════════════════════════════════════════
// 1) LE PROFIL DE GOÛT — les habitudes apprises
// On accumule des affinités (envie/compagnie/budget) depuis ce que le
// spectateur a VALIDÉ (aimé, +) et BOF (passé à côté, −).
// ════════════════════════════════════════════════════════════════
export interface Historique {
  /** les lieux validés (tampon « validé ») — ce qu'il aime */
  valides: Lieu[]
  /** les lieux « bof » — ce qui ne lui va pas */
  bofs: Lieu[]
  /** ids des favoris (signet) */
  favoris: string[]
  /** ids déjà consultés (pour favoriser la découverte) */
  vus: string[]
}

export interface ProfilGout {
  envies: Partial<Record<Envie, number>>
  compagnies: Partial<Record<Compagnie, number>>
  /** budget habituel (0 ça coûte rien · 2 on flambe), moyenne des validés */
  budget: number | null
}

const POIDS_VALIDE = 1
const POIDS_BOF = -0.7

export function profilDeGout(h: Historique): ProfilGout {
  const envies: Partial<Record<Envie, number>> = {}
  const compagnies: Partial<Record<Compagnie, number>> = {}
  const couts: number[] = []

  const verser = (lieux: Lieu[], poids: number) => {
    for (const l of lieux) {
      for (const e of l.envies) envies[e] = (envies[e] ?? 0) + poids
      for (const c of l.compagnies) compagnies[c] = (compagnies[c] ?? 0) + poids
      if (poids > 0) {
        const c = coutLieu(l.meteo)
        if (c != null) couts.push(c)
      }
    }
  }
  verser(h.valides, POIDS_VALIDE)
  verser(h.bofs, POIDS_BOF)

  const budget = couts.length ? couts.reduce((a, b) => a + b, 0) / couts.length : null
  return { envies, compagnies, budget }
}

// ════════════════════════════════════════════════════════════════
// 2) LA RECHERCHE — requête du moment × habitudes
// ════════════════════════════════════════════════════════════════
export interface Requete {
  envies?: Envie[]
  compagnie?: Compagnie
  meteo?: Meteo
  /** texte libre : nom, quartier, ambiance… */
  texte?: string
  /** ne garder que les lieux ouverts maintenant */
  ouvertSeulement?: boolean
}

export interface Resultat {
  lieu: Lieu
  score: number
  /** ce qui a fait remonter ce lieu, en clair */
  raisons: string[]
}

/** score de correspondance au texte libre (0..1) sur nom/desc/note/adresse */
function scoreTexte(lieu: Lieu, q: string): number {
  const tokens = norm(q).split(/\s+/).filter(Boolean)
  if (!tokens.length) return 1
  const foin = norm([lieu.nom, lieu.description ?? '', lieu.note ?? '', lieu.adresse ?? ''].join(' '))
  const nomNorm = norm(lieu.nom)
  let hits = 0
  let bonusNom = 0
  for (const t of tokens) {
    if (foin.includes(t)) hits++
    if (nomNorm.includes(t)) bonusNom += 0.15
  }
  return Math.min(1, hits / tokens.length + bonusNom)
}

export function rechercher(
  lieux: Lieu[],
  requete: Requete = {},
  gout?: ProfilGout,
  /** ton cercle (prénoms/ids) : la CONFIANCE D'ABORD — un spot public porté
   *  par quelqu'un de ton cercle remonte au-dessus d'un public anonyme. */
  cercle: string[] = [],
  /** « autour de » : le repère depuis lequel mesurer les distances (sinon ma position) */
  depuis?: { lat: number; lng: number },
  maintenant = new Date(),
): Resultat[] {
  const out: Resultat[] = []

  for (const lieu of lieux) {
    const ouvert = ouvertMaintenant(lieu, maintenant)
    if (requete.ouvertSeulement && ouvert === false) continue

    // recherche texte : si présente, on exige une correspondance minimale
    let tScore = 1
    if (requete.texte && requete.texte.trim()) {
      tScore = scoreTexte(lieu, requete.texte)
      if (tScore === 0) continue
    }

    const raisons: string[] = []

    // — la requête explicite du moment —
    let reqScore = 0
    if (requete.envies?.length) {
      const communes = lieu.envies.filter((e) => requete.envies!.includes(e))
      if (communes.length) {
        reqScore += 0.5
        raisons.push(`colle à ton envie ${communes[0]}`)
      }
    }
    if (requete.compagnie && (lieu.compagnies.length === 0 || lieu.compagnies.includes(requete.compagnie))) {
      reqScore += 0.2
    }
    if (requete.meteo) {
      const c = coutLieu(lieu.meteo)
      if (c != null && c <= coutLieu(requete.meteo)!) reqScore += 0.15
    }

    // — les habitudes (profil de goût) —
    let goutScore = 0
    if (gout) {
      let g = 0
      for (const e of lieu.envies) g += gout.envies[e] ?? 0
      for (const c of lieu.compagnies) g += gout.compagnies[c] ?? 0
      goutScore = Math.max(-0.4, Math.min(0.4, g * 0.1)) // borné
      if (goutScore > 0.15) {
        const top = lieu.envies.find((e) => (gout.envies[e] ?? 0) > 0)
        if (top) raisons.push(`tu valides souvent les ${top}`)
      } else if (goutScore < -0.1) {
        raisons.push('moins ton genre')
      }
    }

    // — la confiance d'abord : porté par ton cercle ? (le garde-fou anti-Google) —
    let confScore = 0
    if (cercle.length) {
      const sp = signalProche(lieu, cercle)
      if (sp.porteParProche) {
        confScore = 0.3
        raisons.unshift(`porté par ${sp.qui[0]} (ton cercle)`)
      }
    }

    // — signaux —
    let sig = 0
    if (ouvert === true) {
      sig += 0.12
      raisons.push('ouvert maintenant')
    } else if (ouvert === false) {
      sig -= 0.1
    }

    const dist = distanceM(lieu, depuis)
    const distScore = Math.max(0, Math.min(1, 1 - dist / 4000)) * 0.12
    if (dist < 600) raisons.push('tout près')

    const score = (reqScore + goutScore + confScore + sig + distScore) * tScore
    out.push({ lieu, score, raisons })
  }

  return out.sort((a, b) => b.score - a.score || distanceM(a.lieu, depuis) - distanceM(b.lieu, depuis))
}

// ════════════════════════════════════════════════════════════════
// 3) « POUR TOI » — reco sans requête, pilotée par les seules habitudes
// ════════════════════════════════════════════════════════════════
export function pourToi(
  lieux: Lieu[],
  gout: ProfilGout,
  options: {
    exclureVus?: string[]
    topN?: number
    cercle?: string[]
    depuis?: { lat: number; lng: number }
  } = {},
  maintenant = new Date(),
): Resultat[] {
  const vus = new Set(options.exclureVus ?? [])
  const base = options.exclureVus ? lieux.filter((l) => !vus.has(l.id)) : lieux
  const res = rechercher(base, {}, gout, options.cercle ?? [], options.depuis, maintenant)
  return options.topN ? res.slice(0, options.topN) : res
}
