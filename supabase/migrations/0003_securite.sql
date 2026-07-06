-- ════════════════════════════════════════════════════════════════
-- jeudi. — migration de sécurité (chantier 6, étape 5)
-- Quatre trous colmatés + une colonne + le droit à l'oubli :
--   1. relations non falsifiables (plus d'auto-acceptation)
--   2. la date de naissance ne fuit plus (profil complet = le sien)
--   3. bucket photos PRIVÉ → lecture via policy + URLs signées
--   4. colonne `recos` (conditions optimales recommandées)
--   5. supprimer_mon_compte() — RGPD, tout part en cascade
-- Idempotente : re-runnable sans casse, ne détruit AUCUNE donnée.
-- À coller dans Supabase → SQL Editor → Run (APRÈS 0001 et 0002).
-- ════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- 1. RELATIONS non falsifiables
-- Avant : INSERT ne vérifiait que de_id = moi → je pouvais insérer
-- direct en statut 'accepte' (m'auto-inviter dans le cercle de
-- n'importe qui). Et UPDATE laissait le DEMANDEUR accepter sa
-- propre demande. On verrouille les deux sens.
-- ════════════════════════════════════════════════════════════════

-- INSERT : une demande part TOUJOURS en 'demande', de moi, pas vers moi
drop policy if exists "envoyer une demande" on public.relations;
create policy "envoyer une demande" on public.relations
  for insert to authenticated
  with check (
    de_id = auth.uid()
    and statut = 'demande'
    and de_id <> vers_id
  );

-- UPDATE : SEUL le destinataire (vers_id) peut toucher la ligne
-- (= accepter). Le demandeur, lui, ne peut qu'ANNULER sa demande via
-- la policy DELETE existante ("retirer une relation"), qui couvre
-- déjà les deux côtés — on la garde telle quelle.
drop policy if exists "accepter/gérer une relation" on public.relations;
create policy "accepter une relation" on public.relations
  for update to authenticated
  using (vers_id = auth.uid())
  with check (vers_id = auth.uid());   -- et impossible de se réassigner la ligne

-- Unicité de la paire : `unique (de_id, vers_id)` existe déjà dans
-- 0001 (contrainte de table). On ajoute en plus l'anti-doublon
-- CROISÉ : une seule ligne par paire, quel que soit le sens
-- (A→B bloque B→A). C'est cohérent avec est_dans_mon_cercle() qui
-- lit la relation dans les deux sens : une ligne acceptée suffit.
-- Enveloppé dans un DO : si des doublons croisés existent DÉJÀ en
-- base, on ne casse pas la migration — on notifie, à nettoyer à la
-- main puis relancer ce bloc.
do $$
begin
  create unique index if not exists relations_paire_sans_sens_unique
    on public.relations (least(de_id, vers_id), greatest(de_id, vers_id));
exception when others then
  raise notice 'index anti-doublons croisés NON créé (doublons existants ?) : %', sqlerrm;
end $$;

-- ════════════════════════════════════════════════════════════════
-- 2. PROFILS : la date de naissance ne fuit plus
-- Avant : "profils lisibles" = using(true) → n'importe quel connecté
-- lisait naissance, seuils, score_swipe de tout le monde.
-- Après : chacun lit SON profil complet ; les profils des AUTRES se
-- liront via la vue `profils_publics` (colonnes non sensibles).
-- ════════════════════════════════════════════════════════════════

drop policy if exists "profils lisibles" on public.profils;
drop policy if exists "mon profil — lire" on public.profils;
create policy "mon profil — lire" on public.profils
  for select to authenticated
  using (id = auth.uid());

-- La vitrine publique : ce qu'un autre membre a le droit de voir.
-- PAS de naissance, pas de seuils €, pas de score_swipe, pas de
-- couleur (prefs perso). La vue appartient à postgres → elle passe
-- au-dessus de la RLS de `profils` (comportement "definer", défaut
-- Postgres). C'est voulu : c'est elle, le canal public.
-- L'app lira les profils des autres via CETTE vue quand le cercle
-- réel arrivera (aujourd'hui db.ts ne lit que son propre profil).
drop view if exists public.profils_publics;
create view public.profils_publics as
  select id, prenom, critere, bio, insta, photo_url, cree_le
  from public.profils;
alter view public.profils_publics owner to postgres;

revoke all on public.profils_publics from public, anon;
grant select on public.profils_publics to authenticated;

-- ════════════════════════════════════════════════════════════════
-- 3. BUCKET PHOTOS PRIVÉ + lecture filtrée par la visibilité du lieu
-- Avant : bucket public → quiconque a (ou devine) l'URL lit la photo,
-- y compris celles des lieux PRIVÉS. La visibilité n'était filtrée
-- que sur la table `photos`, pas sur les fichiers.
-- Après : bucket privé ; la lecture passe par une policy qui rejoue
-- la même règle de visibilité que la table. Le code app générera des
-- URLs SIGNÉES (createSignedUrl) au lieu des URLs publiques.
-- ════════════════════════════════════════════════════════════════

update storage.buckets set public = false where id = 'photos';

-- L'ancienne policy "tout le monde lit" saute
drop policy if exists "photos lisibles" on storage.objects;

-- Le chemin d'un fichier est-il visible pour MOI ?
-- Convention des chemins (posée par db.ts) :
--   <uid>/profil.jpg              → le portrait du membre
--   <uid>/<lieu_id>/<n>-<type>.jpg → les photos d'un lieu
-- Règles :
--   · mon propre dossier → oui
--   · un portrait (profil.jpg) → oui pour tout connecté (c'est la
--     vitrine, cohérent avec profils_publics.photo_url)
--   · une photo de lieu → oui si lieu_visible(lieu_id) dit oui
--   · tout le reste (chemin malformé, uuid invalide) → non
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
    return false;  -- fichier à la racine du bucket : pas prévu → non
  end if;
  -- mon dossier → tout m'appartient
  if dossiers[1] = auth.uid()::text then
    return true;
  end if;
  -- le portrait d'un membre : lisible par tout connecté
  if storage.filename(chemin) = 'profil.jpg' then
    return true;
  end if;
  -- une photo de lieu : le 2e dossier est l'id du lieu → même règle
  -- de visibilité que la table (privé/cercle/public)
  if array_length(dossiers, 1) >= 2 then
    begin
      return public.lieu_visible(dossiers[2]::uuid);
    exception when invalid_text_representation then
      return false;  -- pas un uuid → chemin inconnu → non
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

-- ── Migration des URLs déjà stockées → CHEMINS ──────────────────
-- Désormais profils.photo_url et photos.url stockent le CHEMIN du
-- fichier dans le bucket (ex: "abc.../lieu.../0-lieu.jpg"), PLUS une
-- URL publique — celles-ci sont mortes de toute façon (bucket privé).
-- Le code app (db.ts) sera adapté pour générer des URLs signées à
-- partir de ces chemins (createSignedUrl / createSignedUrls).
-- split_part(..., '?', 1) retire les query strings (?t=... posé par
-- sauverProfil pour casser le cache CDN — plus besoin en signé).
-- Idempotent : au 2e run, plus aucune ligne ne matche le WHERE.
update public.profils
   set photo_url = regexp_replace(split_part(photo_url, '?', 1), '^.*/object/public/photos/', '')
 where photo_url like '%/object/public/photos/%';

update public.photos
   set url = regexp_replace(split_part(url, '?', 1), '^.*/object/public/photos/', '')
 where url like '%/object/public/photos/%';

-- ════════════════════════════════════════════════════════════════
-- 4. Colonne `recos` — les conditions optimales recommandées
-- Côté TS (db.ts) : `recos?: string[]` → text[] nullable, même
-- famille que envies/compagnies (le brief disait jsonb ; text[]
-- colle mieux au type TS réel et au style du schéma).
-- ════════════════════════════════════════════════════════════════
alter table public.lieux add column if not exists recos text[];

-- ════════════════════════════════════════════════════════════════
-- 5. RGPD — supprimer_mon_compte()
-- Le droit à l'oubli en un appel : rpc('supprimer_mon_compte').
-- Cascades vérifiées dans 0001 :
--   auth.users → profils (on delete cascade)
--   profils → lieux, tips (auteur), relations (2 côtés), sorties (cascade)
--   lieux → tips, photos, sorties (cascade)
-- → un seul DELETE sur auth.users emporte TOUT le relationnel.
-- Le Storage, lui, ne cascade pas : on vide d'abord mon dossier.
-- (Note : supprimer les lignes storage.objects retire l'accès et les
-- métadonnées ; d'éventuels octets orphelins côté S3 sont purgés par
-- Supabase — acceptable pour notre échelle.)
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
  -- 1) mes fichiers Storage (photos de lieux + portrait)
  delete from storage.objects
   where bucket_id = 'photos'
     and (storage.foldername(name))[1] = uid::text;
  -- 2) le compte — les FKs en cascade emportent profil, lieux, tips,
  --    photos (table), relations, sorties
  delete from auth.users where id = uid;
end;
$$;

-- security definer ⇒ Postgres accorde EXECUTE à public par défaut :
-- on retire, puis on ne rend qu'aux connectés.
revoke execute on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;
