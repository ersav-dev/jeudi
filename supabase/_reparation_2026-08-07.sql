-- ════════════════════════════════════════════════════════════════
-- RÉPARATION du 7 août 2026 — un seul Run, tout se remet en place.
-- Le contrôle du jour a montré que 0002 (bucket photos) et 0004
-- (événements) n'avaient JAMAIS été appliquées : les photos ne
-- montaient pas au cloud (en silence) depuis le début.
-- Ce fichier enchaîne : 0002 → 0003 (re-run, idempotente, verrouille
-- le bucket) → 0004 → complément RGPD (le bucket clips de la 0011
-- entre dans supprimer_mon_compte) → la requête de contrôle.
-- À coller tel quel dans Supabase → SQL Editor → Run.
-- Résultat attendu tout en bas : 11 colonnes, toutes à TRUE.
-- ════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════
-- ① = 0002 — Storage des photos
-- Un bucket `photos` (public ici, la 0003 le verrouille juste après).
-- Les fichiers vivent sous le dossier de leur propriétaire.
-- ════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos lisibles" on storage.objects;
create policy "photos lisibles" on storage.objects
  for select to public
  using (bucket_id = 'photos');

drop policy if exists "déposer mes photos" on storage.objects;
create policy "déposer mes photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "remplacer mes photos" on storage.objects;
create policy "remplacer mes photos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "supprimer mes photos" on storage.objects;
create policy "supprimer mes photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ════════════════════════════════════════════════════════════════
-- ② = 0003 — sécurité (re-run COMPLET : idempotente par conception)
-- L'essentiel ici : passer le bucket photos en PRIVÉ + la lecture
-- filtrée par la visibilité du lieu. Le reste repasse sans rien casser.
-- ════════════════════════════════════════════════════════════════

drop policy if exists "envoyer une demande" on public.relations;
create policy "envoyer une demande" on public.relations
  for insert to authenticated
  with check (
    de_id = auth.uid()
    and statut = 'demande'
    and de_id <> vers_id
  );

drop policy if exists "accepter/gérer une relation" on public.relations;
drop policy if exists "accepter une relation" on public.relations;
create policy "accepter une relation" on public.relations
  for update to authenticated
  using (vers_id = auth.uid())
  with check (vers_id = auth.uid());

do $$
begin
  create unique index if not exists relations_paire_sans_sens_unique
    on public.relations (least(de_id, vers_id), greatest(de_id, vers_id));
exception when others then
  raise notice 'index anti-doublons croisés NON créé (doublons existants ?) : %', sqlerrm;
end $$;

drop policy if exists "profils lisibles" on public.profils;
drop policy if exists "mon profil — lire" on public.profils;
create policy "mon profil — lire" on public.profils
  for select to authenticated
  using (id = auth.uid());

drop view if exists public.profils_publics;
create view public.profils_publics as
  select id, prenom, critere, bio, insta, photo_url, cree_le
  from public.profils;
alter view public.profils_publics owner to postgres;

revoke all on public.profils_publics from public, anon;
grant select on public.profils_publics to authenticated;

update storage.buckets set public = false where id = 'photos';

drop policy if exists "photos lisibles" on storage.objects;

create or replace function public.chemin_photo_visible(chemin text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  dossiers text[];
begin
  if auth.uid() is null then
    return false;
  end if;
  dossiers := storage.foldername(chemin);
  if dossiers is null or array_length(dossiers, 1) is null then
    return false;
  end if;
  if dossiers[1] = auth.uid()::text then
    return true;
  end if;
  if storage.filename(chemin) = 'profil.jpg' then
    return true;
  end if;
  if array_length(dossiers, 1) >= 2 then
    begin
      return public.lieu_visible(dossiers[2]::uuid);
    exception when invalid_text_representation then
      return false;
    end;
  end if;
  return false;
end;
$$;

revoke execute on function public.chemin_photo_visible(text) from public, anon;
grant execute on function public.chemin_photo_visible(text) to authenticated;

drop policy if exists "photos visibles (bucket privé)" on storage.objects;
create policy "photos visibles (bucket privé)" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'photos'
    and public.chemin_photo_visible(name)
  );

update public.profils
   set photo_url = regexp_replace(split_part(photo_url, '?', 1), '^.*/object/public/photos/', '')
 where photo_url like '%/object/public/photos/%';

update public.photos
   set url = regexp_replace(split_part(url, '?', 1), '^.*/object/public/photos/', '')
 where url like '%/object/public/photos/%';

alter table public.lieux add column if not exists recos text[];


-- ════════════════════════════════════════════════════════════════
-- ③ = 0004 — la mesure (table d'événements)
-- ════════════════════════════════════════════════════════════════

create table if not exists public.evenements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profils(id) on delete cascade,
  nom text not null,
  detail jsonb,
  cree_le timestamptz not null default now()
);
create index if not exists evenements_nom_idx on public.evenements (nom, cree_le);
alter table public.evenements enable row level security;
drop policy if exists "ecrire mes evenements" on public.evenements;
create policy "ecrire mes evenements" on public.evenements
  for insert with check (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════════
-- ④ Complément RGPD (avec la 0011) — supprimer_mon_compte() vide
-- désormais AUSSI le bucket `clips` : le droit à l'oubli emporte
-- les bobines comme les tirages.
-- ════════════════════════════════════════════════════════════════

create or replace function public.supprimer_mon_compte()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'non connecté';
  end if;
  delete from storage.objects
   where bucket_id in ('photos', 'clips')
     and (storage.foldername(name))[1] = uid::text;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;


-- ════════════════════════════════════════════════════════════════
-- ⑤ LE CONTRÔLE — le résultat affiché en bas doit être 11 × true
-- ════════════════════════════════════════════════════════════════

select
  to_regclass('public.lieux')          is not null as m0001_init,
  exists(select 1 from storage.buckets where id = 'photos' and public = false) as m0002_storage,
  exists(select 1 from pg_proc where proname = 'chemin_photo_visible')     as m0003_securite,
  to_regclass('public.evenements')     is not null as m0004_evenements,
  to_regclass('public.sorties_groupe') is not null as m0005_match,
  exists(select 1 from information_schema.columns
         where table_name = 'sg_candidats'  and column_name = 'propose_par') as m0006_candidats,
  exists(select 1 from information_schema.columns
         where table_name = 'sorties_groupe' and column_name = 'rematch_id') as m0007_rejoue,
  exists(select 1 from pg_constraint where conname = 'photos_type_check')  as m0008_types,
  exists(select 1 from pg_proc
         where proname = 'sg_rejoindre'
           and pg_get_functiondef(oid) like '%rend sa clé%')               as m0009_invite,
  exists(select 1 from information_schema.columns
         where table_name = 'photos' and column_name = 'prise_le')         as m0010_datees,
  exists(select 1 from information_schema.columns
         where table_name = 'photos' and column_name = 'clip_path')        as m0011_super8;
