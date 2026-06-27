-- ════════════════════════════════════════════════════════════════
-- jeudi. — Storage des photos (chantier 6, étape 4)
-- Un bucket public `photos`. Les fichiers vivent sous le dossier de leur
-- propriétaire : `<auth.uid()>/...` → chacun n'écrit que dans le sien,
-- tout le monde peut lire (les URL publiques sont déjà filtrées par la
-- visibilité du lieu côté table `photos`).
-- À coller dans Supabase → SQL Editor → Run (après 0001).
-- ════════════════════════════════════════════════════════════════

-- ── le bucket (public en lecture) ───────────────────────────────
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- ── policies sur storage.objects, restreintes au bucket `photos` ──
-- lecture : ouverte (bucket public). on garde une policy explicite par clarté.
drop policy if exists "photos lisibles" on storage.objects;
create policy "photos lisibles" on storage.objects
  for select to public
  using (bucket_id = 'photos');

-- écriture : seulement dans MON dossier (1er segment du chemin = mon uid)
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
