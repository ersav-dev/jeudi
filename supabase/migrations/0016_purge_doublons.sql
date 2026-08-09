-- ════════════════════════════════════════════════════════════════
-- jeudi. — 0016 : LA PURGE DES DOUBLONS (09/08/2026)
--
-- LA CAUSE (voir app/src/doublons.ts pour le détail) : l'import
-- supabase/imports/2026-08-01_import_ersan_v2_tout.sql dédoublonnait
-- par nom EXACT (`lower(nom) = lower(nom)`). Deux fiches du même lieu
-- écrites différemment passent donc toutes les deux. L'app les MASQUE
-- déjà à la lecture (app/src/doublons.ts, memeLieu()/dedoublonner()) —
-- ce fichier applique EXACTEMENT la même règle, en dur, à la base :
--
--   (A) même nom normalisé (minuscules, sans accent ni ponctuation) et
--       moins de 200 m — c'est ce qui attrape « Péniche Antipode » /
--       « Peniche Antipode », « La Cité/Cite Fertile », « Le Mary
--       Céleste/Celeste », « Bisou. » / « Bisou ».
--   (B) moins de 15 m ET au moins un mot fort commun (≥ 4 lettres, hors
--       mots passe-partout) — c'est ce qui attrape « Harry's Bar Paris »
--       / « Harry's New York Bar », les deux « Kodawari Ramen », le
--       « Club Coca-Cola - Quai de la Photo » / « Quai de la Photo »,
--       « Bateau Phare » / « Le Bateau Phare ».
--
-- ⚠ CE FICHIER NE RE-SCANNE PAS TOUTE LA CARTE. Il ne traite QUE les
-- 8 paires listées ci-dessous, nommément. On ne fait JAMAIS tourner ce
-- genre de règle en aveugle sur l'ensemble des lieux : sur les quais,
-- La Dame de Canton / Bateau Phare / Nix Nox / PLAT-FORM partagent le
-- même point géocodé (Port de la Gare) sans être le même bateau, et
-- Septime / Clamato sont mitoyens (0 m) sans être le même resto —
-- fusionner sur la seule proximité serait une vraie casse. Chaque
-- paire ci-dessous est en plus revérifiée à l'exécution par la même
-- fonction meme_lieu() que l'app : si une paire ne matche plus (nom ou
-- distance ont changé depuis), elle est silencieusement ignorée.
--
-- QUI GAGNE, dans l'ordre (identique à gagne() dans doublons.ts) :
--   1. le rang de l'appelant (mon spot > cercle > fond éditorial) —
--      SANS OBJET ici : les 349 lignes du fond ont toutes été versées
--      sous le même owner_id (le compte d'Ersan) par le même import,
--      donc les deux fiches de chaque paire sont toujours au même
--      rang. On ne modélise donc pas de rang en SQL (il n'y a rien à
--      départager avec).
--   2. la fiche la plus RICHE (photos*3 + tips*2 + note?2 + description?1)
--   3. la plus ANCIENNE (cree_le) — en pratique toujours à égalité ici :
--      les 349 lignes viennent d'un seul INSERT, donc d'un seul now().
--   4. le nom le mieux écrit (le plus de lettres accentuées)
--   5. l'id le plus petit (déterministe, arbitraire au-delà)
--
-- CE QUI EST RÉATTRIBUÉ (rien n'est perdu en silence) :
--   · tips, photos, sorties (validations), vues_pellicule, rayures,
--     sg_candidats (lien in-app d'un match de groupe passé) : tout
--     lieu_id qui pointait vers le PERDANT est reposé sur le GAGNANT.
--   · favori / pepite (colonnes sur lieux) : fusionnés par OR — si tu
--     avais mis le perdant en favori, le gagnant le devient.
--   · horaire_ouv / horaire_ferm / proprete_wc / tampon : recopiés du
--     perdant vers le gagnant UNIQUEMENT si le gagnant ne les a pas
--     déjà (coalesce) — on ne remplace jamais une donnée déjà saisie.
--
-- CE QUI PEUT SE PERDRE (cas rares, documentés, pas de surprise) :
--   · vues_pellicule / rayures : leur clé primaire inclut (user_id,
--     lieu_id[, soirée]). Si TOI (ou un pote du cercle) aviez déjà une
--     ligne sur le gagnant ET sur le perdant pour la même clé, la
--     réattribution du perdant entrerait en conflit — dans ce cas
--     (rarissime : il faudrait avoir vu/rayé les DEUX fiches du même
--     doublon) la ligne du perdant s'efface avec lui plutôt que
--     d'écraser celle du gagnant. Elle ne disait de toute façon rien
--     de plus (même personne, même lieu réel).
--   · tout le reste du perdant (adresse, critère perso, statut...) :
--     le perdant est déjà invisible à la lecture depuis le 09/08
--     (doublons.ts), donc sa suppression physique ne fait disparaître
--     AUCUNE information que tu peux voir aujourd'hui dans l'app.
--
-- IDEMPOTENT : si tu relances ce fichier après l'avoir déjà appliqué,
-- les paires ne matchent plus (un seul nom subsiste par paire) → la
-- table temporaire est vide → toutes les étapes suivantes ne touchent
-- 0 ligne. Peut se recoller sans risque.
--
-- ⚠ ERSAN : NE PAS APPLIQUER AUTOMATIQUEMENT. Colle ce fichier dans
-- Supabase → SQL Editor. Lance-le UNE PREMIÈRE FOIS : l'ÉTAPE 1 (le
-- contrôle) s'affiche, RELIS-LA. Si c'est ce que tu attends, relance
-- (le fichier entier, ou juste l'ÉTAPE 2) pour purger réellement.
-- ════════════════════════════════════════════════════════════════

-- ── fonctions utilitaires, scoped à la session (pg_temp) — copie
-- fidèle de app/src/doublons.ts, rien n'est laissé dans le schéma
-- public une fois la session fermée.
-- ────────────────────────────────────────────────────────────────

create or replace function pg_temp.normaliser_nom(p text) returns text
language sql immutable as $$
  select trim(regexp_replace(
    translate(lower(coalesce(p, '')),
      'àâäáãåèéêëìíîïòóôöõùúûüçñýÿ',
      'aaaaaaeeeeiiiiooooouuuucnyy'),
    '[^a-z0-9]+', ' ', 'g'
  ))
$$;

create or replace function pg_temp.distance_m(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql immutable as $$
  select 2 * 6371000 * asin(least(1, sqrt(
    sin(radians(lat2 - lat1) / 2) ^ 2 +
    cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lng2 - lng1) / 2) ^ 2
  )))
$$;

-- mots passe-partout (identique à MOTS_PASSE_PARTOUT dans doublons.ts)
create or replace function pg_temp.mots_forts(p text) returns text[]
language sql immutable as $$
  select coalesce(array_agg(distinct mot), '{}')
  from unnest(string_to_array(p, ' ')) as mot
  where length(mot) >= 4
    and mot not in ('paris','bar','club','cafe','restaurant','resto','brasserie',
                     'bistro','bistrot','chez','maison','grand','grande','petit',
                     'petite','nouveau','nouvelle','france','french','house')
$$;

-- règles (A) et (B) de memeLieu() — le garde-fou de fond de ce fichier
create or replace function pg_temp.meme_lieu(
  nom_a text, lat_a double precision, lng_a double precision,
  nom_b text, lat_b double precision, lng_b double precision
) returns boolean
language sql immutable as $$
  select case
    when lat_a is null or lng_a is null or lat_b is null or lng_b is null then false
    when pg_temp.distance_m(lat_a, lng_a, lat_b, lng_b) > 200 then false
    when pg_temp.normaliser_nom(nom_a) = '' or pg_temp.normaliser_nom(nom_b) = '' then false
    when pg_temp.normaliser_nom(nom_a) = pg_temp.normaliser_nom(nom_b) then true
    when pg_temp.distance_m(lat_a, lng_a, lat_b, lng_b) > 15 then false
    else exists (
      select 1
      from unnest(pg_temp.mots_forts(pg_temp.normaliser_nom(nom_a))) fa
      where fa = any(pg_temp.mots_forts(pg_temp.normaliser_nom(nom_b)))
    )
  end
$$;

-- richesse() de doublons.ts : photos*3 + tips*2 + note?2 + description?1
create or replace function pg_temp.richesse(p_lieu uuid, p_note text, p_description text)
returns int
language sql stable as $$
  select (select count(*) from public.photos where lieu_id = p_lieu)::int * 3
       + (select count(*) from public.tips where lieu_id = p_lieu)::int * 2
       + (case when p_note is not null then 2 else 0 end)
       + (case when p_description is not null then 1 else 0 end)
$$;

-- accents() de doublons.ts : combien de lettres accentuées dans le NOM
-- (proxy ASCII, suffisant pour du français — pas une NFD générique)
create or replace function pg_temp.accents(p text) returns int
language sql immutable as $$
  select length(coalesce(p, '')) - length(translate(coalesce(p, ''),
    'àâäáãåÀÂÄÁÃÅèéêëÈÉÊËìíîïÌÍÎÏòóôöõÒÓÔÖÕùúûüÙÚÛÜçÇñÑýÿÝ', ''))
$$;

-- ── les 8 paires connues, et LEUR VERDICT (gagnant/perdant) ────────
-- (le verdict est calculé une fois ici, puis réutilisé par toutes les
-- étapes suivantes — pour que le contrôle et la purge disent la même
-- chose)
create temporary table _purge_0016 as
with moi as (
  select id from public.profils
  where lower(prenom) = 'ersan'
  order by cree_le asc limit 1
),
paires (nom_a, nom_b) as (
  values
    ('Harry''s Bar Paris',                'Harry''s New York Bar'),
    ('Kodawari Ramen (Yokochō)',          'Kodawari Ramen'),
    ('Club Coca-Cola - Quai de la Photo', 'Quai de la Photo'),
    ('Bateau Phare',                      'Le Bateau Phare'),
    ('Péniche Antipode',                  'Peniche Antipode'),
    ('La Cité Fertile',                   'La Cite Fertile'),
    ('Le Mary Céleste',                   'Le Mary Celeste'),
    ('Bisou.',                            'Bisou')
),
brut as (
  select
    la.id as id_a, la.nom as nom_a_reel, la.lat as lat_a, la.lng as lng_a,
    la.note as note_a, la.description as description_a, la.favori as favori_a,
    la.pepite as pepite_a, la.horaire_ouv as horaire_ouv_a,
    la.horaire_ferm as horaire_ferm_a, la.proprete_wc as proprete_wc_a,
    la.tampon as tampon_a,
    lb.id as id_b, lb.nom as nom_b_reel, lb.lat as lat_b, lb.lng as lng_b,
    lb.note as note_b, lb.description as description_b, lb.favori as favori_b,
    lb.pepite as pepite_b, lb.horaire_ouv as horaire_ouv_b,
    lb.horaire_ferm as horaire_ferm_b, lb.proprete_wc as proprete_wc_b,
    lb.tampon as tampon_b
  from paires p
  cross join moi
  cross join lateral (
    select * from public.lieux l
    where l.owner_id = moi.id and lower(l.nom) = lower(p.nom_a)
    order by l.cree_le asc, l.id asc limit 1
  ) la
  cross join lateral (
    select * from public.lieux l
    where l.owner_id = moi.id and lower(l.nom) = lower(p.nom_b)
    order by l.cree_le asc, l.id asc limit 1
  ) lb
  where la.id <> lb.id
),
verifie as (
  select b.*,
    pg_temp.richesse(b.id_a, b.note_a, b.description_a) as rich_a,
    pg_temp.richesse(b.id_b, b.note_b, b.description_b) as rich_b,
    pg_temp.accents(b.nom_a_reel) as acc_a,
    pg_temp.accents(b.nom_b_reel) as acc_b
  from brut b
  where pg_temp.meme_lieu(b.nom_a_reel, b.lat_a, b.lng_a, b.nom_b_reel, b.lat_b, b.lng_b)
),
decide as (
  select *,
    -- le même cascade que gagne(a,b,rang) dans doublons.ts, sans le
    -- rang (sans objet ici, voir l'en-tête)
    (case
      when rich_a <> rich_b then rich_a > rich_b
      when acc_a  <> acc_b  then acc_a  > acc_b
      else id_a < id_b
    end) as a_gagne
  from verifie
)
select
  nom_a_reel as nom_a, nom_b_reel as nom_b,
  case when a_gagne then id_a else id_b end as gagnant_id,
  case when a_gagne then id_b else id_a end as perdant_id,
  case when a_gagne then nom_a_reel else nom_b_reel end as gagnant_nom,
  case when a_gagne then nom_b_reel else nom_a_reel end as perdant_nom,
  case when a_gagne then favori_b else favori_a end as favori_perdant,
  case when a_gagne then pepite_b else pepite_a end as pepite_perdant,
  case when a_gagne then horaire_ouv_b else horaire_ouv_a end as horaire_ouv_perdant,
  case when a_gagne then horaire_ferm_b else horaire_ferm_a end as horaire_ferm_perdant,
  case when a_gagne then proprete_wc_b else proprete_wc_a end as proprete_wc_perdant,
  case when a_gagne then tampon_b else tampon_a end as tampon_perdant
from decide;

-- ════════════════════════════════════════════════════════════════
-- ÉTAPE 1 — CONTRÔLE. Lance CE bloc seul d'abord et RELIS le résultat
-- avant d'aller plus loin. 0 ligne = rien à purger (déjà fait, ou les
-- 8 paires ne matchent plus tel quel).
-- ════════════════════════════════════════════════════════════════
select
  d.gagnant_nom, d.perdant_nom, d.gagnant_id, d.perdant_id,
  (select count(*) from public.tips where lieu_id = d.perdant_id)            as tips_a_reattribuer,
  (select count(*) from public.photos where lieu_id = d.perdant_id)          as photos_a_reattribuer,
  (select count(*) from public.sorties where lieu_id = d.perdant_id)         as sorties_a_reattribuer,
  (select count(*) from public.vues_pellicule where lieu_id = d.perdant_id)  as vues_a_reattribuer,
  (select count(*) from public.rayures where lieu_id = d.perdant_id)         as rayures_a_reattribuer,
  (select count(*) from public.sg_candidats where lieu_id = d.perdant_id)    as candidats_match_a_relier,
  d.favori_perdant, d.pepite_perdant,
  d.horaire_ouv_perdant, d.horaire_ferm_perdant, d.proprete_wc_perdant
from _purge_0016 d
order by d.gagnant_nom;

-- ════════════════════════════════════════════════════════════════
-- ÉTAPE 2 — LA PURGE. Ne lance ce bloc qu'après avoir relu l'étape 1.
-- ════════════════════════════════════════════════════════════════
begin;

-- 1. fusionner ce qui appartient au LIEU (pas à une ligne liée) :
--    favori/pepite par OR, le reste par coalesce (jamais d'écrasement
--    d'une donnée déjà saisie sur le gagnant).
update public.lieux l
set
  favori       = l.favori or d.favori_perdant,
  pepite       = l.pepite or d.pepite_perdant,
  horaire_ouv  = coalesce(l.horaire_ouv, d.horaire_ouv_perdant),
  horaire_ferm = coalesce(l.horaire_ferm, d.horaire_ferm_perdant),
  proprete_wc  = coalesce(l.proprete_wc, d.proprete_wc_perdant),
  tampon       = coalesce(l.tampon, d.tampon_perdant)
from _purge_0016 d
where l.id = d.gagnant_id;

-- 2. tips
update public.tips t
set lieu_id = d.gagnant_id
from _purge_0016 d
where t.lieu_id = d.perdant_id;

-- 3. photos (réattribuées telles quelles ; renumérotation de l'ordre
--    juste après, pour ne pas avoir deux photos à ordre=0 sur le
--    même lieu)
update public.photos ph
set lieu_id = d.gagnant_id
from _purge_0016 d
where ph.lieu_id = d.perdant_id;

with renum as (
  select id, row_number() over (partition by lieu_id order by ordre, cree_le) - 1 as nouvel_ordre
  from public.photos
  where lieu_id in (select gagnant_id from _purge_0016)
)
update public.photos ph
set ordre = renum.nouvel_ordre
from renum
where renum.id = ph.id and ph.ordre is distinct from renum.nouvel_ordre;

-- 4. sorties (mes validations "alors, Le Bisou ?")
update public.sorties s
set lieu_id = d.gagnant_id
from _purge_0016 d
where s.lieu_id = d.perdant_id;

-- 5. sg_candidats — le lien in-app (optionnel) d'un match de groupe
--    passé ; sans cette réattribution, ON DELETE SET NULL l'aurait de
--    toute façon rendu orphelin proprement, mais on préfère le
--    reposer sur le gagnant pour ne pas perdre le lien.
update public.sg_candidats c
set lieu_id = d.gagnant_id
from _purge_0016 d
where c.lieu_id = d.perdant_id;

-- 6. vues_pellicule — clé (user_id, lieu_id, soirée) : on ne réattribue
--    que ce qui ne rentre pas en conflit avec une ligne déjà présente
--    sur le gagnant (même personne, même soirée) ; le reliquat s'efface
--    avec le perdant au moment du delete (étape 8) — il ne disait de
--    toute façon rien de plus.
update public.vues_pellicule v
set lieu_id = d.gagnant_id
from _purge_0016 d
where v.lieu_id = d.perdant_id
  and not exists (
    select 1 from public.vues_pellicule v2
    where v2.user_id = v.user_id and v2.lieu_id = d.gagnant_id and v2.soiree = v.soiree
  );

-- 7. rayures — clé (user_id, lieu_id) : même logique.
update public.rayures r
set lieu_id = d.gagnant_id
from _purge_0016 d
where r.lieu_id = d.perdant_id
  and not exists (
    select 1 from public.rayures r2
    where r2.user_id = r.user_id and r2.lieu_id = d.gagnant_id
  );

-- 8. le perdant disparaît. Le cascade (on delete cascade) nettoie ce
--    qui n'a pas pu être réattribué aux étapes 6-7 (conflits rarissimes,
--    documentés en en-tête) ; sg_candidats.lieu_id restant, s'il y en
--    avait, part en null (on delete set null) — ne devrait plus arriver
--    grâce à l'étape 5.
delete from public.lieux l
using _purge_0016 d
where l.id = d.perdant_id;

commit;

-- ── contrôle final ──────────────────────────────────────────────
select
  count(*) as paires_traitees,
  count(*) filter (
    where not exists (select 1 from public.lieux l where l.id = d.perdant_id)
  ) as perdants_bien_supprimes
from _purge_0016 d;

drop table if exists _purge_0016;
