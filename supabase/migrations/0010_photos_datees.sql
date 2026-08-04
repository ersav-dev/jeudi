-- ════════════════════════════════════════════════════════════════
-- 0010 — DATER LES PREUVES : le tirage du soir.
-- Une photo doit savoir QUAND elle a été prise et PAR QUI, sinon la carte
-- ne peut pas la faire vieillir (« la pellicule fraîche »).
-- `visible_le` = la publication différée d'une heure : la photo « sèche »
-- avant d'apparaître — ça tue l'inférence de position en temps réel.
-- Le type 'soir' est le SOUVENIR repêché dans la pellicule du téléphone :
-- il ne bouche aucun trou de l'album des 5 preuves.
-- À coller tel quel dans Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════

alter table public.photos add column if not exists prise_le   timestamptz;
alter table public.photos add column if not exists visible_le timestamptz;
alter table public.photos add column if not exists auteur_id  uuid
  references public.profils(id) on delete set null;

-- le 6e type (la 0008 en listait 5 + l'ancien générique 'lieu')
alter table public.photos drop constraint if exists photos_type_check;
alter table public.photos add constraint photos_type_check
  check (type in ('facade', 'salle', 'terrasse', 'plat', 'wc', 'lieu', 'soir'));

-- l'existant devient SOUVENIR, jamais frais : aucune vieille photo ne doit
-- apparaître demain sur la carte comme si la nuit venait de se passer
update public.photos
   set prise_le   = coalesce(prise_le,   now() - interval '30 days'),
       visible_le = coalesce(visible_le, now() - interval '30 days')
 where prise_le is null;

create index if not exists photos_pellicule_idx
  on public.photos (visible_le desc) where visible_le is not null;
