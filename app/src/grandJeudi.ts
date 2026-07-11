// ── le grand jeudi : le 1ᵉʳ jeudi du mois, automatique ─────────────────
// le rendez-vous n'est PAS une option : pas de réglage, pas de bouton dans
// la nav — la date décide. le jour J, la bannière tombe dans « ce soir » et
// « trouver » ; les autres jours, « trouver » porte la promesse (« dans N
// jours »). helpers purs : testables sans DOM, sans horloge truquée.

const JEUDI = 4 // Date.getDay() : 0 = dimanche … 4 = jeudi

/** minuit local du jour donné — on compare des JOURS, jamais des heures */
function jourLocal(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** le 1ᵉʳ jeudi d'un mois (année + mois 0-11 ; mois 12 déborde sur janvier) */
function premierJeudiDuMois(annee: number, mois: number): Date {
  const premier = new Date(annee, mois, 1)
  const decalage = (JEUDI - premier.getDay() + 7) % 7
  return new Date(annee, mois, 1 + decalage)
}

/** est-ce le grand jeudi ? (un jeudi dans les 7 premiers jours du mois) */
export function estCeLeGrandJeudi(date: Date): boolean {
  return date.getDay() === JEUDI && date.getDate() <= 7
}

/** le prochain grand jeudi — le jour même compris (jour J → cette date) */
export function prochainGrandJeudi(date: Date): Date {
  const jour = jourLocal(date)
  const ceMois = premierJeudiDuMois(jour.getFullYear(), jour.getMonth())
  if (ceMois.getTime() >= jour.getTime()) return ceMois
  return premierJeudiDuMois(jour.getFullYear(), jour.getMonth() + 1)
}

/** « dans N jours » : jours calendaires jusqu'au prochain grand jeudi (0 = jour J) */
export function joursAvantGrandJeudi(date: Date): number {
  return Math.round(
    (prochainGrandJeudi(date).getTime() - jourLocal(date).getTime()) / 86_400_000,
  )
}
