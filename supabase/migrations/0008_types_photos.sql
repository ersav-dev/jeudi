-- ════════════════════════════════════════════════════════════════
-- 0008 — UNE PHOTO DIT CE QU'ELLE PROUVE
-- Les types passent de 3 à 5, dans l'ordre du parcours d'une soirée :
-- facade (je trouve la porte — l'or des speakeasies) · salle (l'ambiance
-- vraie) · terrasse (rooftops & péniches, l'obsession de l'app) ·
-- plat (ce que j'ai consommé) · wc (la vérité).
-- 'lieu' (l'ancien générique) reste accepté pour les vieux clients et
-- s'affiche comme « la salle » ; les données existantes basculent.
-- À coller tel quel dans Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════
alter table public.photos drop constraint if exists photos_type_check;
alter table public.photos add constraint photos_type_check
  check (type in ('facade', 'salle', 'terrasse', 'plat', 'wc', 'lieu'));
update public.photos set type = 'salle' where type = 'lieu';
