// ════════════════════════════════════════════════════════════════
// jeudi. — LES FÊTES DU CALENDRIER (pur, testable)
// Deux choses que le carnet sait souhaiter :
//   · les ANNIVERSAIRES du cercle — jour+mois seulement (la vue
//     profils_publics n'expose JAMAIS l'année : pas d'âge qui fuit,
//     migration 0013) ;
//   · les FÊTES à sortir — la Saint-Amour du 9 août en tête (Ersan,
//     07/08). Une fête = une date, un nom, un mot d'accroche : la
//     mécanique est prête pour le reste du calendrier des occasions.
// ════════════════════════════════════════════════════════════════

export interface Fete {
  /** « MM-DD » — le format de profils_publics.anniversaire */
  mmdd: string
  nom: string
  /** le mot d'accroche, dans la voix de jeudi (minuscules) */
  mot: string
}

export const FETES: Fete[] = [
  { mmdd: '08-09', nom: 'la Saint-Amour', mot: 'emmène quelqu’un.' },
  { mmdd: '06-21', nom: 'la fête de la musique', mot: 'la ville joue — sors écouter.' },
  { mmdd: '11-19', nom: 'le Beaujolais nouveau', mot: 'il est arrivé — trinque.' },
  { mmdd: '12-31', nom: 'la Saint-Sylvestre', mot: 'la dernière page de l’année.' },
]

/** « MM-DD » d'une date locale */
export function mmddDe(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** la fête du jour, s'il y en a une — null les 361 autres soirs */
export function feteDuJour(maintenant: Date): Fete | null {
  const jour = mmddDe(maintenant)
  return FETES.find((f) => f.mmdd === jour) ?? null
}

// ── les anniversaires ───────────────────────────────────────────

/** dans combien de jours tombe un « MM-DD » (0 = aujourd'hui).
 *  null si le format ne ressemble pas à un anniversaire. */
export function joursAvant(mmdd: string | undefined, maintenant: Date): number | null {
  if (!mmdd) return null
  const m = mmdd.match(/^(\d{2})-(\d{2})$/)
  if (!m) return null
  const mois = +m[1]
  const jour = +m[2]
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return null
  const minuit = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate())
  let cible = new Date(maintenant.getFullYear(), mois - 1, jour)
  // le 29 février une année sans : on fête le 1er mars (Date déborde tout seul)
  if (cible < minuit) cible = new Date(maintenant.getFullYear() + 1, mois - 1, jour)
  return Math.round((cible.getTime() - minuit.getTime()) / 86400000)
}

export interface AnniversaireAVenir {
  prenom: string
  /** 0 = aujourd'hui, 1 = demain… */
  dans: number
}

/** les anniversaires du cercle dans les `horizon` prochains jours,
 *  triés du plus proche au plus lointain */
export function anniversairesAVenir(
  membres: { prenom: string; anniversaire?: string }[],
  maintenant: Date,
  horizon = 30,
): AnniversaireAVenir[] {
  const venir: AnniversaireAVenir[] = []
  for (const m of membres) {
    const dans = joursAvant(m.anniversaire, maintenant)
    if (dans != null && dans <= horizon) venir.push({ prenom: m.prenom, dans })
  }
  return venir.sort((a, b) => a.dans - b.dans)
}

/** la phrase au crayon : « c'est l'anniversaire de ninon ! » /
 *  « l'anniversaire de karim dans 12 jours » */
export function motAnniversaire(a: AnniversaireAVenir): string {
  if (a.dans === 0) return `c’est l’anniversaire de ${a.prenom} !`
  if (a.dans === 1) return `l’anniversaire de ${a.prenom}, c’est demain.`
  return `l’anniversaire de ${a.prenom} dans ${a.dans} jours.`
}
