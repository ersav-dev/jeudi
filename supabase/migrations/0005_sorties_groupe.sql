-- ════════════════════════════════════════════════════════════════
-- 0005 — le MATCH DE GROUPE (« on se voit où » — panel n°1)
-- Un objet central « sortie de groupe » : des spots candidats + des votes.
-- DEUX portes, UN moteur : les inscrits votent in-app (RLS classique),
-- les invités votent par UN lien /sortie/<token> SANS compte, via des RPC
-- security definer où le token est la capacité — les tables ne sont
-- JAMAIS ouvertes au rôle anon. Pas de messagerie : le langage de
-- réactions (un tap), agrégé en totaux. Les budgets ne sont stockés
-- nulle part : chacun filtre depuis SA météo, en silence.
-- À coller tel quel dans Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════

-- ── LA SORTIE (l'objet match) ───────────────────────────────────
create table if not exists public.sorties_groupe (
  id          uuid primary key default gen_random_uuid(),
  -- le token public du lien WhatsApp : 22 caractères url-safe (~128 bits)
  token       text not null unique
              default translate(encode(gen_random_bytes(16), 'base64'), '+/=', '-_'),
  createur_id uuid not null references public.profils(id) on delete cascade,
  titre       text,                          -- « jeudi soir » (v1 : le soir est décidé)
  envies      text[] not null default '{}',  -- l'envie du groupe (le cap du classement)
  centre_lat  double precision,              -- le rendez-vous triangulé
  centre_lng  double precision,
  statut      text not null default 'ouvert' check (statut in ('ouvert','clos')),
  -- la deadline, posée par le créateur au lancement (null = pas de limite,
  -- il clôt à la main). Minimum 15 min : en dessous, le lien WhatsApp n'a
  -- pas le temps d'atteindre le dernier pote.
  deadline    timestamptz check (deadline is null or deadline >= cree_le + interval '15 minutes'),
  gagnant_id  uuid,                          -- fk posée après sg_candidats
  cree_le     timestamptz not null default now(),
  clos_le     timestamptz
);
create index if not exists sg_createur_idx on public.sorties_groupe(createur_id);

-- ── LES CANDIDATS (instantanés des spots, pas des jointures) ────
-- Copiés au lancement : la RLS de `lieux` reste intacte, un spot privé ne
-- révèle que ce que le créateur choisit de montrer, et le match survit si
-- le spot est édité ou supprimé pendant le vote.
create table if not exists public.sg_candidats (
  id        uuid primary key default gen_random_uuid(),
  sortie_id uuid not null references public.sorties_groupe(id) on delete cascade,
  lieu_id   uuid references public.lieux(id) on delete set null, -- le lien in-app, optionnel
  nom       text not null,
  lat       double precision,
  lng       double precision,
  adresse   text,
  note      text,                             -- le tip du carnet, choisi par le créateur
  envies    text[] not null default '{}',
  meteo     text,                             -- le coût du LIEU (public) — jamais un budget perso
  ordre     int not null default 0
);
create index if not exists sg_candidats_sortie_idx on public.sg_candidats(sortie_id);

alter table public.sorties_groupe
  drop constraint if exists sg_gagnant_fk;
alter table public.sorties_groupe
  add constraint sg_gagnant_fk foreign key (gagnant_id)
  references public.sg_candidats(id) on delete set null;

-- ── LES PARTICIPANTS (inscrits OU invités sans compte) ──────────
create table if not exists public.sg_participants (
  id        uuid primary key default gen_random_uuid(),
  sortie_id uuid not null references public.sorties_groupe(id) on delete cascade,
  profil_id uuid references public.profils(id) on delete cascade, -- null = invité
  prenom    text not null,
  -- la clé secrète du participant (localStorage de l'invité) : elle signe
  -- SES votes sans compte — jamais montrée aux autres
  cle       uuid not null default gen_random_uuid(),
  cree_le   timestamptz not null default now(),
  unique (sortie_id, profil_id)
);
create index if not exists sg_participants_sortie_idx on public.sg_participants(sortie_id);

-- ── LES VOTES (le langage de réactions : un tap par spot) ───────
create table if not exists public.sg_votes (
  id             uuid primary key default gen_random_uuid(),
  sortie_id      uuid not null references public.sorties_groupe(id) on delete cascade,
  participant_id uuid not null references public.sg_participants(id) on delete cascade,
  candidat_id    uuid not null references public.sg_candidats(id) on delete cascade,
  reaction       text not null check (reaction in
                 ('chaud','pourquoi pas','pas moi','trop cher','trop loin','juste boire')),
  cree_le        timestamptz not null default now(),
  unique (participant_id, candidat_id)         -- un tap par spot, modifiable (upsert)
);
create index if not exists sg_votes_sortie_idx on public.sg_votes(sortie_id);

-- ════════════════════════════════════════════════════════════════
-- « LE VOTE EST-IL OUVERT ? » — une seule vérité SQL, réutilisée partout.
-- C'est le serveur qui fait foi, pas l'horloge du téléphone.
-- ════════════════════════════════════════════════════════════════
create or replace function public.sg_ouverte(p_sortie uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.sorties_groupe s
    where s.id = p_sortie
      and s.statut = 'ouvert'
      and (s.deadline is null or now() < s.deadline)
  );
$$;

-- la deadline ne bouge plus après le premier vote (sinon on coupe l'herbe
-- sous le pied de ceux qui n'ont pas encore voté)
create or replace function public.sg_garde_deadline()
returns trigger language plpgsql
set search_path = public as $$
begin
  if new.deadline is distinct from old.deadline
     and exists (select 1 from public.sg_votes v where v.sortie_id = old.id) then
    raise exception 'la deadline ne se change plus une fois le vote lancé';
  end if;
  return new;
end;
$$;
drop trigger if exists sg_deadline_figee on public.sorties_groupe;
create trigger sg_deadline_figee
  before update on public.sorties_groupe
  for each row execute function public.sg_garde_deadline();

-- ════════════════════════════════════════════════════════════════
-- RLS CÔTÉ INSCRITS (l'app) — créateur + participants du match
-- ════════════════════════════════════════════════════════════════
create or replace function public.sg_membre(p_sortie uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.sorties_groupe s
    where s.id = p_sortie and s.createur_id = auth.uid()
  ) or exists (
    select 1 from public.sg_participants p
    where p.sortie_id = p_sortie and p.profil_id = auth.uid()
  );
$$;

alter table public.sorties_groupe  enable row level security;
alter table public.sg_candidats    enable row level security;
alter table public.sg_participants enable row level security;
alter table public.sg_votes        enable row level security;

create policy "voir mes matchs" on public.sorties_groupe
  for select to authenticated using (public.sg_membre(id));
create policy "creer mes matchs" on public.sorties_groupe
  for insert to authenticated with check (createur_id = auth.uid());
create policy "gerer mes matchs" on public.sorties_groupe
  for update to authenticated using (createur_id = auth.uid());

create policy "voir les candidats" on public.sg_candidats
  for select to authenticated using (public.sg_membre(sortie_id));
create policy "poser les candidats" on public.sg_candidats
  for insert to authenticated with check (
    exists (select 1 from public.sorties_groupe s
            where s.id = sortie_id and s.createur_id = auth.uid()));

create policy "voir les participants" on public.sg_participants
  for select to authenticated using (public.sg_membre(sortie_id));
create policy "rejoindre en inscrit" on public.sg_participants
  for insert to authenticated with check (profil_id = auth.uid());

-- votes : lisibles par les membres du match — nécessaire au realtime
-- « 3/8 ont voté ». L'UI n'affiche QUE les totaux agrégés, jamais les noms.
create policy "voir les votes du match" on public.sg_votes
  for select to authenticated using (public.sg_membre(sortie_id));
create policy "voter en inscrit" on public.sg_votes
  for insert to authenticated with check (
    public.sg_ouverte(sortie_id)
    and exists (select 1 from public.sg_participants p
                where p.id = participant_id and p.profil_id = auth.uid()));
create policy "changer mon vote" on public.sg_votes
  for update to authenticated using (
    public.sg_ouverte(sortie_id)
    and exists (select 1 from public.sg_participants p
                where p.id = participant_id and p.profil_id = auth.uid()));

-- le realtime « 3/8 ont voté » (in-app) écoute les INSERT/UPDATE sur sg_votes
do $$
begin
  alter publication supabase_realtime add table public.sg_votes;
exception when duplicate_object then null;
end $$;

-- ════════════════════════════════════════════════════════════════
-- LES 3 PORTES DE L'INVITÉ (RPC security definer, token = capacité)
-- Aucune table n'est exposée à `anon` : c'est la fonction qui filtre.
-- ════════════════════════════════════════════════════════════════

-- 1) VOIR : la sortie, ses candidats, qui a voté (prénoms), et les comptes
--    agrégés par candidat — JAMAIS les votes nominatifs.
create or replace function public.sg_voir(p_token text)
returns jsonb language sql security definer stable
set search_path = public as $$
  select jsonb_build_object(
    'sortie', (select jsonb_build_object(
        'titre', s.titre, 'envies', s.envies, 'statut', s.statut,
        'deadline', s.deadline,
        'ouverte', (s.statut = 'ouvert' and (s.deadline is null or now() < s.deadline)),
        'centre_lat', s.centre_lat, 'centre_lng', s.centre_lng,
        'gagnant_id', s.gagnant_id,
        'createur', (select prenom from public.profils where id = s.createur_id))
      from public.sorties_groupe s where s.token = p_token),
    'candidats', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'lieu_id', c.lieu_id, 'nom', c.nom, 'lat', c.lat, 'lng', c.lng,
        'adresse', c.adresse, 'note', c.note, 'envies', c.envies,
        'meteo', c.meteo, 'ordre', c.ordre) order by c.ordre), '[]'::jsonb)
      from public.sg_candidats c
      join public.sorties_groupe s on s.id = c.sortie_id and s.token = p_token),
    'participants', (select coalesce(jsonb_agg(jsonb_build_object(
        'prenom', p.prenom,
        'a_vote', exists (select 1 from public.sg_votes v where v.participant_id = p.id))
        order by p.cree_le), '[]'::jsonb)
      from public.sg_participants p
      join public.sorties_groupe s on s.id = p.sortie_id and s.token = p_token),
    'comptes', (select coalesce(jsonb_agg(jsonb_build_object(
        'candidat_id', t.candidat_id, 'reaction', t.reaction, 'n', t.n)), '[]'::jsonb)
      from (select v.candidat_id, v.reaction, count(*) as n
            from public.sg_votes v
            join public.sorties_groupe s on s.id = v.sortie_id and s.token = p_token
            group by v.candidat_id, v.reaction) t)
  );
$$;

-- 2) REJOINDRE : l'invité pose son prénom, reçoit sa clé secrète.
--    Un INSCRIT qui passe par le lien devient participant relié à son
--    profil (profil_id) : le match apparaît alors aussi dans son app.
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
  -- inscrit sans prénom fourni : celui de son profil
  if v_prenom = '' and v_uid is not null then
    select coalesce(prenom, '') into v_prenom from public.profils where id = v_uid;
  end if;
  if length(v_prenom) < 1 or length(v_prenom) > 30 then
    raise exception 'prenom invalide';
  end if;
  -- un inscrit déjà participant : on lui rend sa clé (idempotent)
  if v_uid is not null then
    select id, cle into v_id, v_cle from public.sg_participants
      where sortie_id = v_sortie and profil_id = v_uid;
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

-- 3) VOTER : un tap par spot, modifiable tant que le vote est ouvert.
create or replace function public.sg_voter(
  p_token text, p_cle uuid, p_candidat uuid, p_reaction text)
returns void language plpgsql security definer
set search_path = public as $$
declare
  v_sortie uuid;
  v_part   uuid;
begin
  select id into v_sortie from public.sorties_groupe
    where token = p_token and statut = 'ouvert'
      and (deadline is null or now() < deadline);
  if v_sortie is null then
    raise exception 'sortie introuvable ou close';
  end if;
  select id into v_part from public.sg_participants
    where sortie_id = v_sortie and cle = p_cle;
  if v_part is null then
    raise exception 'participant inconnu';
  end if;
  if not exists (select 1 from public.sg_candidats
                 where id = p_candidat and sortie_id = v_sortie) then
    raise exception 'candidat inconnu';
  end if;
  insert into public.sg_votes (sortie_id, participant_id, candidat_id, reaction)
    values (v_sortie, v_part, p_candidat, p_reaction)
    on conflict (participant_id, candidat_id)
    do update set reaction = excluded.reaction, cree_le = now();
end;
$$;

grant execute on function public.sg_voir(text) to anon, authenticated;
grant execute on function public.sg_rejoindre(text, text) to anon, authenticated;
grant execute on function public.sg_voter(text, uuid, uuid, text) to anon, authenticated;
