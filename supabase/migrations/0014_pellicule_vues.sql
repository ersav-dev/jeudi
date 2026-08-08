-- ════════════════════════════════════════════════════════════════
-- 0014 — LA PELLICULE : le « vu / pas vu » (CHANTIER_PELLICULE §3)
-- Une ligne par (moi, spot, SOIRÉE) : le sceau de cire se brise à
-- l'OUVERTURE du tas, et il se rallume à la soirée SUIVANTE — jamais
-- une fenêtre glissante de 24 h (on annonce un événement, on ne
-- notifie pas une personne). Chacun ne lit et n'écrit que SES vues.
-- Les colonnes de date des photos existent déjà (0010).
-- À coller tel quel dans Supabase → SQL Editor → Run (APRÈS 0013).
-- ════════════════════════════════════════════════════════════════

create table if not exists public.vues_pellicule (
  user_id  uuid not null references public.profils(id) on delete cascade,
  lieu_id  uuid not null references public.lieux(id) on delete cascade,
  -- la SOIRÉE lue (la nuit à laquelle appartient le dernier tirage vu,
  -- format YYYY-MM-DD calculé côté app : date - 6 h)
  soiree   date not null,
  vu_le    timestamptz not null default now(),
  primary key (user_id, lieu_id, soiree)
);

alter table public.vues_pellicule enable row level security;

drop policy if exists "mes vues" on public.vues_pellicule;
create policy "mes vues" on public.vues_pellicule
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
