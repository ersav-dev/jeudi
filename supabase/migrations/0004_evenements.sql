-- 0004 — la mesure (panel : « vous pilotez à l'aveugle »)
-- Une table d'événements minimaliste : qui (uid), quoi (nom), quand.
-- Lecture réservée au dashboard (aucune policy SELECT) ; chacun n'écrit
-- que ses propres événements. À appliquer dans le SQL Editor Supabase.
create table if not exists public.evenements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profils(id) on delete cascade,
  nom text not null,
  detail jsonb,
  cree_le timestamptz not null default now()
);
create index if not exists evenements_nom_idx on public.evenements (nom, cree_le);
alter table public.evenements enable row level security;
create policy "ecrire mes evenements" on public.evenements
  for insert with check (user_id = auth.uid());
