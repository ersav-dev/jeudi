-- ════════════════════════════════════════════════════════════════
-- jeudi. — 0019 : BLOQUER (CHANTIER_SIGNALER_BLOQUER, plan §2-§3)
--
-- « Il n'y a aujourd'hui aucun moyen, dans jeudi, d'empêcher
-- quelqu'un de te voir. » Cette migration le crée, et le fait
-- respecter LÀ où ça compte : dans les policies, pas dans l'écran
-- (piège n°1 du cadrage — un filtre client, un devtools le révèle).
--
-- Les règles, décidées le 10-12/08 :
--   · un blocage est SYMÉTRIQUE en lecture : ni lui ne me voit, ni
--     je ne le vois. Une seule ligne suffit, sont_bloques() lit les
--     deux sens.
--   · un blocage est SILENCIEUX : la personne n'est pas prévenue et
--     ne peut pas lire qu'elle est bloquée (la RLS de `blocages` ne
--     montre que MES blocages, jamais ceux qui me visent).
--   · le blocage EMPORTE LE PASSÉ (décision d'Ersan, 12/08) : ses
--     photos sur mes spots adoptés disparaissent — c'est automatique,
--     les fichiers vivent dans SON dossier du bucket et
--     chemin_photo_visible() dit désormais non.
--   · un match de groupe EN COURS finit, puis plus jamais (décision
--     d'Ersan, 12/08) : on ne casse pas une soirée engagée avec
--     d'autres gens ; le blocage prend effet au match suivant.
--   · se dédire est aussi facile que bloquer (debloquer()), mais la
--     relation ne revient pas — on se redemande.
--
-- LE LEVIER : presque toutes les lectures partagées passent par deux
-- fonctions posées en 0001 — est_dans_mon_cercle() (lieux cercle,
-- rayures 0015, jugements 0017) et lieu_visible() (tips, photos,
-- buckets photos ET clips via chemin_photo_visible). En glissant le
-- blocage dans ces fonctions, il se propage partout d'un coup, sans
-- récrire quinze policies.
--
-- RÉPARÉ AU PASSAGE (découvert le 12/08) : la 0013 a posé la règle
-- d'ancienneté (« le carnet public se mérite à 50 membres ») dans
-- lieu_visible(), mais la policy SELECT de `lieux` gardait ses
-- conditions en dur de la 0001 et ne l'appelait pas — la règle
-- gardait les tips/photos mais PAS les lieux eux-mêmes. La policy
-- passe ici par lieu_visible() : une seule vérité, la 0013 devient
-- vraie, et le blocage est dedans. Sans effet visible aujourd'hui
-- (moins de 50 profils : le carnet public reste ouvert à tous).
--
-- Idempotente. À coller dans Supabase → SQL Editor → Run (APRÈS 0018).
-- ════════════════════════════════════════════════════════════════

-- ── 1. LA TABLE — une porte qu'on ferme, datée ──────────────────
create table if not exists public.blocages (
  bloqueur_id uuid not null references public.profils(id) on delete cascade,
  bloque_id   uuid not null references public.profils(id) on delete cascade,
  -- le prénom qu'il portait au moment du geste. Nécessaire : après le
  -- blocage, profils_publics ne montre plus cette personne — la liste
  -- des réglages (pour se dédire) lirait un trou sans cet instantané.
  prenom_fige text,
  cree_le     timestamptz not null default now(),
  primary key (bloqueur_id, bloque_id),
  check (bloqueur_id <> bloque_id)
);
-- la PK sert le sens (a,b) ; l'index inverse sert le sens (b,a) —
-- sont_bloques() interroge toujours les deux (piège n°2 du cadrage).
create index if not exists blocages_inverse_idx
  on public.blocages (bloque_id, bloqueur_id);

alter table public.blocages enable row level security;

-- je ne lis que MES blocages (la liste des réglages, pour se dédire).
-- Surtout PAS ceux qui me visent : le silence est une règle produit.
drop policy if exists "mes blocages" on public.blocages;
create policy "mes blocages" on public.blocages
  for select to authenticated
  using (bloqueur_id = auth.uid());

-- pas de policy INSERT/DELETE : l'écriture passe par bloquer() /
-- debloquer() (plus bas), qui font AUSSI le ménage (relations,
-- anneau intérieur). Un insert direct laisserait la relation en vie.

-- ── 2. sont_bloques(a, b) — la condition, écrite UNE fois ────────
create or replace function public.sont_bloques(a uuid, b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.blocages
    where (bloqueur_id = a and bloque_id = b)
       or (bloqueur_id = b and bloque_id = a)
  );
$$;
revoke execute on function public.sont_bloques(uuid, uuid) from public, anon;
grant execute on function public.sont_bloques(uuid, uuid) to authenticated;

-- ── 3. bloquer() / debloquer() — le geste, et son ménage ─────────
-- bloquer coupe TOUT de suite ce qui peut l'être sans casser une
-- soirée : la relation (les deux sens) et l'anneau intérieur (les
-- deux côtés — le sien ne doit plus me proposer, cf. cadrage).
create or replace function public.bloquer(cible uuid)
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
  if cible is null or cible = uid then
    raise exception 'cible invalide';
  end if;
  insert into public.blocages (bloqueur_id, bloque_id, prenom_fige)
    values (uid, cible,
            (select prenom from public.profils where id = cible))
    on conflict (bloqueur_id, bloque_id) do nothing;
  -- la relation saute, dans les deux sens (demande OU acceptée)
  delete from public.relations
   where (de_id = uid and vers_id = cible)
      or (de_id = cible and vers_id = uid);
  -- l'anneau intérieur des deux côtés oublie l'autre
  delete from public.super_potes
   where (user_id = uid and pote_id = cible)
      or (user_id = cible and pote_id = uid);
end;
$$;

-- se dédire : le blocage part, la relation ne revient PAS (on se
-- redemande — le cercle est un accord, pas un état qu'on restaure).
create or replace function public.debloquer(cible uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'non connecté';
  end if;
  delete from public.blocages
   where bloqueur_id = auth.uid() and bloque_id = cible;
end;
$$;

revoke execute on function public.bloquer(uuid) from public, anon;
revoke execute on function public.debloquer(uuid) from public, anon;
grant execute on function public.bloquer(uuid) to authenticated;
grant execute on function public.debloquer(uuid) to authenticated;

-- ── 4. est_dans_mon_cercle() apprend le blocage ──────────────────
-- (0001, même signature.) Propage d'un coup : lieux « cercle »,
-- rayures (0015), jugements (0017), et la branche cercle de
-- lieu_visible(). Un bloqué n'est dans le cercle de personne — de
-- toute façon bloquer() a supprimé la relation ; ceci est la
-- ceinture ET les bretelles.
create or replace function public.est_dans_mon_cercle(cible uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not public.sont_bloques(auth.uid(), cible)
     and exists (
       select 1 from public.relations r
       where r.statut = 'accepte'
         and ( (r.de_id = auth.uid() and r.vers_id = cible)
            or (r.vers_id = auth.uid() and r.de_id = cible) )
     );
$$;

-- ── 5. lieu_visible() apprend le blocage ─────────────────────────
-- (0013, même signature — la règle d'ancienneté est conservée telle
-- quelle.) Gate : tips, photos (table), buckets photos et clips.
create or replace function public.lieu_visible(p_lieu uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_owner uuid;
  v_visibilite text;
begin
  if v_uid is null then
    return false;
  end if;
  select owner_id, visibilite into v_owner, v_visibilite
    from public.lieux where id = p_lieu;
  if v_owner is null then
    return false;
  end if;
  -- les miens : toujours
  if v_owner = v_uid then
    return true;
  end if;
  -- bloqués : plus rien ne passe, ni public ni cercle
  if public.sont_bloques(v_uid, v_owner) then
    return false;
  end if;
  -- le cercle : comme avant
  if v_visibilite = 'cercle' and public.est_dans_mon_cercle(v_owner) then
    return true;
  end if;
  -- le public : ouvert à tous tant qu'on est petits (< 50 profils),
  -- puis réservé aux 6 mois d'ancienneté (0013)
  if v_visibilite = 'public' then
    if (select count(*) from public.profils) < 50 then
      return true;
    end if;
    return exists (
      select 1 from public.profils
       where id = v_uid
         and cree_le <= now() - interval '6 months'
    );
  end if;
  return false;
end;
$$;

revoke execute on function public.lieu_visible(uuid) from public, anon;
grant execute on function public.lieu_visible(uuid) to authenticated;

-- ── 6. la policy SELECT de `lieux` passe par lieu_visible() ──────
-- Une seule vérité (voir l'en-tête : ça rend la 0013 vraie, et le
-- blocage est dedans). Le raccourci owner_id = auth.uid() reste en
-- première position : mes spots ne paient jamais l'appel de fonction.
drop policy if exists "voir les lieux autorisés" on public.lieux;
create policy "voir les lieux autorisés" on public.lieux
  for select to authenticated
  using (
    owner_id = auth.uid()
    or public.lieu_visible(id)
  );

-- ── 7. chemin_photo_visible() apprend le blocage ─────────────────
-- (0003, même signature.) Gate les DEUX buckets (photos + clips,
-- 0011). Le premier dossier d'un chemin est l'uid du déposant : si
-- on est bloqués, rien ne se lit — ni ses photos de lieux, ni son
-- portrait, ni les fichiers de ses spots que j'ai adoptés (la copie
-- adoptée pointe encore vers SON dossier : « le blocage emporte le
-- passé » tombe ici tout seul).
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
  -- le dossier de quelqu'un avec qui on est bloqués → rien, jamais
  begin
    if public.sont_bloques(auth.uid(), dossiers[1]::uuid) then
      return false;
    end if;
  exception when invalid_text_representation then
    return false;  -- premier dossier pas un uuid → chemin inconnu → non
  end;
  -- le portrait d'un membre : lisible par tout connecté (non bloqué)
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

-- ── 8. les TIPS : sa voix disparaît, et on n'écrit plus à l'aveugle
-- Lecture : le filtre lieu ne suffit pas — ses tips sur MON spot
-- adopté passent lieu_visible (le spot est à moi). On filtre AUSSI
-- l'auteur.
drop policy if exists "voir les tips visibles" on public.tips;
create policy "voir les tips visibles" on public.tips
  for select to authenticated
  using (
    public.lieu_visible(lieu_id)
    and not public.sont_bloques(auth.uid(), auteur_id)
  );

-- Écriture : on ne tippe que ce qu'on VOIT. (Colmate au passage un
-- trou de la 0001 : rien n'empêchait d'écrire un tip sur n'importe
-- quel id de lieu, même privé — spam en écriture aveugle.)
drop policy if exists "créer mes tips" on public.tips;
create policy "créer mes tips" on public.tips
  for insert to authenticated
  with check (
    auteur_id = auth.uid()
    and public.lieu_visible(lieu_id)
  );

-- ── 9. la vitrine `profils_publics` : introuvables l'un pour l'autre
-- (0013, mêmes colonnes — anniversaire MM-DD conservé.) La recherche
-- d'amis et l'écran d'invitation lisent cette vue : après blocage,
-- chacun a simplement cessé d'exister pour l'autre. Ma propre ligne
-- reste (sont_bloques(moi, moi) est faux).
drop view if exists public.profils_publics;
create view public.profils_publics as
  select
    id, prenom, critere, bio, insta, photo_url, cree_le,
    to_char(naissance, 'MM-DD') as anniversaire
  from public.profils
  where not public.sont_bloques(auth.uid(), id);
alter view public.profils_publics owner to postgres;

revoke all on public.profils_publics from public, anon;
grant select on public.profils_publics to authenticated;

-- ── 10. les RELATIONS : plus de demande possible, dans aucun sens ─
-- (0003, même forme + le blocage.) bloquer() a déjà supprimé la
-- ligne existante ; ceci empêche d'en recréer une. L'UI du bloqué ne
-- propose de toute façon plus le profil (vue filtrée) : cette policy
-- est la défense en profondeur, pas le message.
drop policy if exists "envoyer une demande" on public.relations;
create policy "envoyer une demande" on public.relations
  for insert to authenticated
  with check (
    de_id = auth.uid()
    and statut = 'demande'
    and de_id <> vers_id
    and not public.sont_bloques(de_id, vers_id)
  );

-- ── 11. le MATCH DE GROUPE : le prochain ne les réunit plus ───────
-- Décision : un match en cours FINIT (on n'y touche pas) ; un match
-- futur ne doit jamais réunir deux bloqués. Le test vit dans une
-- fonction definer : un candidat au match ne peut pas encore LIRE
-- sg_participants (il n'est pas membre), une sous-requête directe
-- dans la policy ne verrait donc rien.
create or replace function public.sg_conflit_blocage(p_sortie uuid, p_uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.sorties_groupe s
    where s.id = p_sortie
      and public.sont_bloques(p_uid, s.createur_id)
  ) or exists (
    select 1 from public.sg_participants p
    where p.sortie_id = p_sortie
      and p.profil_id is not null
      and public.sont_bloques(p_uid, p.profil_id)
  );
$$;
revoke execute on function public.sg_conflit_blocage(uuid, uuid) from public, anon;
grant execute on function public.sg_conflit_blocage(uuid, uuid) to authenticated;

drop policy if exists "rejoindre en inscrit" on public.sg_participants;
create policy "rejoindre en inscrit" on public.sg_participants
  for insert to authenticated
  with check (
    profil_id = auth.uid()
    and not public.sg_conflit_blocage(sortie_id, auth.uid())
  );

-- sg_rejoindre (0009, recopiée entière + la garde) : un INSCRIT
-- bloqué-avec-quelqu'un-du-match reçoit « sortie introuvable ou
-- close » — le même message que pour un lien mort : rien à déduire.
-- Un INVITÉ sans compte n'est pas concerné (pas d'identité à bloquer).
create or replace function public.sg_rejoindre(p_token text, p_prenom text)
returns jsonb language plpgsql security definer
set search_path = public as $$
declare
  v_sortie uuid;
  v_uid    uuid := auth.uid();
  v_prenom text := trim(coalesce(p_prenom, ''));
  v_id     uuid;
  v_cle    uuid;
begin
  select id into v_sortie from public.sorties_groupe
    where token = p_token and statut = 'ouvert'
      and (deadline is null or now() < deadline);
  if v_sortie is null then
    raise exception 'sortie introuvable ou close';
  end if;
  -- la garde blocage : même message qu'un lien mort (silence)
  if v_uid is not null and public.sg_conflit_blocage(v_sortie, v_uid) then
    raise exception 'sortie introuvable ou close';
  end if;
  -- inscrit sans prénom fourni : celui de son profil
  if v_prenom = '' and v_uid is not null then
    select coalesce(prenom, '') into v_prenom from public.profils where id = v_uid;
  end if;
  if length(v_prenom) < 1 or length(v_prenom) > 30 then
    raise exception 'prenom invalide';
  end if;

  -- ① un INSCRIT déjà participant : on lui rend sa clé (idempotent)
  if v_uid is not null then
    select id, cle into v_id, v_cle from public.sg_participants
      where sortie_id = v_sortie and profil_id = v_uid;
    if v_id is not null then
      return jsonb_build_object('participant_id', v_id, 'cle', v_cle);
    end if;
  end if;

  -- ② un INVITÉ qui revient (clé perdue) : même prénom sur la même sortie
  --    → on rend SA place, ses votes restent les siens. Le doublon est mort.
  if v_uid is null then
    select id, cle into v_id, v_cle from public.sg_participants
      where sortie_id = v_sortie
        and profil_id is null
        and lower(trim(prenom)) = lower(v_prenom)
      order by cree_le asc
      limit 1;
    if v_id is not null then
      return jsonb_build_object('participant_id', v_id, 'cle', v_cle);
    end if;
  end if;

  insert into public.sg_participants (sortie_id, profil_id, prenom)
    values (v_sortie, v_uid, v_prenom)
    returning id, cle into v_id, v_cle;
  return jsonb_build_object('participant_id', v_id, 'cle', v_cle);
end;
$$;

grant execute on function public.sg_rejoindre(text, text) to anon, authenticated;

-- ════════════════════════════════════════════════════════════════
-- MESURER, PAS DEVINER (piège n°2 du cadrage)
-- `lieux` est lu à chaque ouverture. Avant/après cette migration,
-- dans le SQL Editor (en se faisant passer pour un membre) :
--
--   set role authenticated;
--   set request.jwt.claims to '{"sub":"<un-uuid-de-profil>","role":"authenticated"}';
--   explain analyze select id from public.lieux;
--   reset role;
--
-- Ordre de grandeur attendu à notre échelle (~600 lieux, ~30
-- profils) : quelques ms. Si ça dépasse ~50 ms, le suspect n°1 est
-- l'appel par ligne de lieu_visible() → revenir poser les conditions
-- en dur dans la policy (avec le blocage), c'est prévu et documenté.
--
-- VÉRIFIER PAR L'ATTAQUE, PAS PAR L'UI (plan §4) : deux comptes qui
-- se bloquent, puis, avec le jeton de l'autre, sur l'API REST :
--   /rest/v1/lieux?select=id,owner_id          → aucun spot de l'autre
--   /rest/v1/tips?select=id,auteur_id          → aucun tip de l'autre
--   /rest/v1/profils_publics?id=eq.<autre>     → []
--   /rest/v1/rayures / jugements               → rien de l'autre
--   /rest/v1/blocages (côté bloqué)            → [] (le silence)
--   storage : createSignedUrl sur un fichier de l'autre → 400/404
--   rpc/sg_rejoindre sur un match de l'autre   → « introuvable ou close »
-- ════════════════════════════════════════════════════════════════
