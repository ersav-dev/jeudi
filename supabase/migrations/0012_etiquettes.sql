-- ════════════════════════════════════════════════════════════════
-- 0012 — LES ÉTIQUETTES PERSO : l'organisation appartient aux gens.
-- Deux étages qui ne se mélangent pas :
--   · les ENVIES (le lexique en -o) = la langue COMMUNE, fermée —
--     c'est elle qui fait tourner le deck, les filtres, le match ;
--   · les ÉTIQUETTES = le rangement PERSO, libre et privé — jamais
--     montré au cercle ni au public, jamais utilisé par une mécanique
--     partagée. À l'import Takeout, le nom de chaque liste Google
--     (« Rooftops », « Dates »…) devient l'étiquette de ses spots :
--     les gens retrouvent leur carnet rangé comme ils l'avaient laissé.
-- Même famille que envies/recos : text[] nullable, RLS inchangée
-- (les étiquettes voyagent avec la ligne `lieux`, que seul le
-- propriétaire écrit — et la lecture publique/cercle les expose à
-- l'écran UNIQUEMENT sur MES spots, choix fait côté app).
-- À coller tel quel dans Supabase → SQL Editor → Run (APRÈS 0011).
-- ════════════════════════════════════════════════════════════════

alter table public.lieux add column if not exists etiquettes text[];
