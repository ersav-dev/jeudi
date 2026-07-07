// ── la fusion des « autres voix » : tips cloud + tips seed ─────────────
// PUR (testable sans Supabase ni DOM) : db.ts s'en sert pour merger les
// vrais tips (table `tips`) avec le décor (seed / héritage d'adoption).
import type { TipCercle } from './db'

/** clé de dédoublonnage : auteur + texte (casse et espaces indifférents) */
function cleTip(t: TipCercle): string {
  return `${t.auteur.trim().toLowerCase()}|${t.note.trim().toLowerCase()}`
}

/** fusionne les voix d'un lieu : les tips CLOUD passent DEVANT les tips
 *  seed, dédoublonnés par auteur+texte — le cloud fait foi, le décor
 *  complète. Les tips au texte vide sont jetés (vidé = supprimé). */
export function fusionnerTips(cloud: TipCercle[], seed: TipCercle[]): TipCercle[] {
  const vus = new Set<string>()
  const fusion: TipCercle[] = []
  for (const t of [...cloud, ...seed]) {
    if (!t.note.trim()) continue
    const cle = cleTip(t)
    if (vus.has(cle)) continue
    vus.add(cle)
    fusion.push(t)
  }
  return fusion
}
