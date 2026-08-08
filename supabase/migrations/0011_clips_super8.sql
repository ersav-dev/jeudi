-- ════════════════════════════════════════════════════════════════
-- 0011 — LE SUPER 8 : la photo qui bouge.
-- Un clip est une LIGNE DE `photos` (son photogramme vit dans `url`),
-- plus un fichier vidéo à côté (bucket `clips`, 10 s max, muet par
-- défaut). Le rendu (grain, vignette, teinte, tremblement) n'est
-- JAMAIS dans le fichier : il vit en JSON (`reglages_rendu`) et se
-- projette à la lecture — la chambre noire rouvre toujours. L'usure
-- (rayures, poussières…) n'est même pas stockée : elle se calcule
-- depuis `prise_le` à chaque projection.
-- À coller tel quel dans Supabase → SQL Editor → Run (APRÈS 0010).
-- ════════════════════════════════════════════════════════════════

-- ── la table : quatre colonnes, et tout le pipeline photo suit ───
alter table public.photos add column if not exists clip_path      text;
alter table public.photos add column if not exists clip_mime      text;
alter table public.photos add column if not exists clip_duree_s   numeric(4,1);
alter table public.photos add column if not exists reglages_rendu jsonb;

-- garde-fou : la durée d'une bobine ne dépasse jamais 10 s
alter table public.photos drop constraint if exists photos_clip_duree_check;
alter table public.photos add constraint photos_clip_duree_check
  check (clip_duree_s is null or (clip_duree_s > 0 and clip_duree_s <= 10));

-- ── le bucket `clips` : PRIVÉ dès le premier jour, comme `photos`
-- depuis la 0003. Même convention de chemins (<uid>/<lieu_id>/…),
-- donc même règle de visibilité : on RÉUTILISE chemin_photo_visible()
-- — elle ne lit que le chemin, pas le bucket. Bucket séparé exprès :
-- le jour où l'egress Supabase pique, les clips basculent sur R2 en
-- changeant une URL de base, pas en triant un bucket mélangé.
insert into storage.buckets (id, name, public)
values ('clips', 'clips', false)
on conflict (id) do update set public = false;

drop policy if exists "clips visibles (bucket privé)" on storage.objects;
create policy "clips visibles (bucket privé)" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'clips'
    and public.chemin_photo_visible(name)
  );

drop policy if exists "déposer mes clips" on storage.objects;
create policy "déposer mes clips" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'clips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "remplacer mes clips" on storage.objects;
create policy "remplacer mes clips" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'clips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "supprimer mes clips" on storage.objects;
create policy "supprimer mes clips" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'clips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── RGPD : le droit à l'oubli emporte AUSSI les bobines ──────────
-- supprimer_mon_compte() (0003) ne vidait que le bucket photos ;
-- on la redéfinit pour couvrir les deux buckets.
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
