import { supabase } from './supabase'

// ── la mesure, sobre : 6 événements, zéro tiers, zéro cookie ────
// Best-effort ABSOLU : si la table `evenements` n'existe pas encore
// (migration 0004 pas appliquée) ou si on est hors-ligne, on se tait.
// La mesure ne doit JAMAIS casser une soirée.
export function suivre(nom: string, detail?: Record<string, unknown>): void {
  void (async () => {
    try {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user.id
      if (!uid) return
      await supabase.from('evenements').insert({ user_id: uid, nom, detail: detail ?? null })
    } catch {
      /* silencieux, toujours */
    }
  })()
}
