import { createClient } from '@supabase/supabase-js'

// ── Le client Supabase de jeudi ───────────────────────────────
// Backend social (auth + Postgres + Storage), région EU (RGPD).
// L'URL et la clé anon (publique, protégée par les règles RLS) viennent
// de app/.env.local (gitignoré) ; voir .env.example pour le gabarit.

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anon) {
  throw new Error(
    'Config Supabase manquante : crée app/.env.local depuis .env.example (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY).',
  )
}

export const supabase = createClient(url, anon, {
  auth: {
    // garde la session en localStorage et la rafraîchit toute seule → on
    // reste connecté entre deux ouvertures de l'app (PWA installée).
    persistSession: true,
    autoRefreshToken: true,
    // récupère la session depuis l'URL au retour du magic-link / OAuth.
    detectSessionInUrl: true,
  },
})
