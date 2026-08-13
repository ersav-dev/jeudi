// ════════════════════════════════════════════════════════════════
// jeudi. — MES QUARTIERS : le rangement, scopé par compte.
//
// La leçon du 12/08, appliquée sans discuter : TOUT ce qui se range en
// local se range PAR COMPTE (`<uid>:<id>`), sinon un second compte sur le
// même téléphone voit les zones du premier.
//
// Et la règle n°1 du chantier, qui n'est pas négociable : ces zones ne
// quittent pas l'appareil. Une zone dit où tu vas, où tu ne vas pas, et
// souvent où tu habites. Il n'y a AUCUN chemin de sortie dans ce fichier —
// pas de fetch, pas de Supabase, rien. Le partage au super cercle (10 max)
// viendra un jour ; il passera par un module à part, et une zone reçue sera
// une proposition, jamais un filtre.
// ════════════════════════════════════════════════════════════════
import { getDB, idCompteActuel } from './db'
import { CAP_ZONES, type Quartier } from './quartiers'

const prefixe = async (): Promise<string> => `${(await idCompteActuel()) ?? 'anonyme'}:`

/** tous mes quartiers, du plus ancien au plus récent */
export async function lireQuartiers(): Promise<Quartier[]> {
  const db = await getDB()
  const p = await prefixe()
  const cles = (await db.getAllKeys('quartiers')) as string[]
  const miennes = cles.filter((c) => c.startsWith(p))
  const zones = await Promise.all(miennes.map((c) => db.get('quartiers', c)))
  return (zones.filter(Boolean) as Quartier[]).sort((a, b) => a.creeLe.localeCompare(b.creeLe))
}

/** pose (ou remplace) une zone */
export async function poserQuartier(q: Quartier): Promise<void> {
  const db = await getDB()
  await db.put('quartiers', q, (await prefixe()) + q.id)
}

/** rature une zone — le geste est irréversible côté données, l'annulation
    vit dans l'écran (le bandeau qui reste quelques secondes) */
export async function raturerQuartier(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('quartiers', (await prefixe()) + id)
}

/** reste-t-il de la place ? (le cap n'est pas un mur : on cure) */
export function placeLibre(zones: Quartier[]): boolean {
  return zones.length < CAP_ZONES
}
