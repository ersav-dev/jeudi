-- ════════════════════════════════════════════════════════════════
-- jeudi. — schéma initial du backend (chantier 6, étape 2)
-- Voie A : la forme `Lieu` est conservée à la frontière de db.ts.
-- Tables : profils · lieux · tips · photos · relations · sorties.
-- RLS = l'esprit du concept en dur (chacun voit ses spots + public +
-- son cercle ; édite que les siens ; les privés ne fuient jamais).
-- À coller tel quel dans Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════

-- ── PROFILS (1:1 avec auth.users) ───────────────────────────────
create table if not exists public.profils (
  id          uuid primary key references auth.users(id) on delete cascade,
  prenom      text,
  critere     text,
  bio         text,
  insta       text,
  naissance   date,
  score_swipe int,
  couleur     text,
  seuils      int[],            -- [s1, s2] météo du porte-monnaie
  photo_url   text,
  cree_le     timestamptz not null default now()
);

-- ── LIEUX (un spot, possédé par UNE personne) ───────────────────
create table if not exists public.lieux (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profils(id) on delete cascade,
  nom           text not null,
  lat           double precision,
  lng           double precision,
  adresse       text,
  description   text,
  note          text,                         -- le tip du propriétaire
  visibilite    text not null default 'prive'
                check (visibilite in ('prive','cercle','public')),
  envies        text[] default '{}',
  compagnies    text[] default '{}',
  meteo         text,
  critere_perso text,
  source        text,                          -- 'rue' | 'google' | 'manuel'
  statut        text not null default 'actif',
  match         text check (match in ('diffuse','refuge')),
  rooftop       boolean default false,
  sur_leau      boolean default false,
  proprete_wc   int check (proprete_wc between 1 and 3),
  horaire_ouv   numeric,                        -- heures décimales (19.5 = 19h30)
  horaire_ferm  numeric,                        -- > 24 = après minuit
  tampon        jsonb,                          -- {v,x,y,qui,date}
  cree_le       timestamptz not null default now(),
  derniere_validation timestamptz
);
create index if not exists lieux_owner_idx on public.lieux(owner_id);
create index if not exists lieux_visibilite_idx on public.lieux(visibilite);

-- ── TIPS (les "autres voix" sur un lieu, ex-tipsCercle) ─────────
create table if not exists public.tips (
  id        uuid primary key default gen_random_uuid(),
  lieu_id   uuid not null references public.lieux(id) on delete cascade,
  auteur_id uuid not null references public.profils(id) on delete cascade,
  titre     text,                               -- "éclaireur du 10e"...
  note      text,
  photo_url text,
  cree_le   timestamptz not null default now()
);
create index if not exists tips_lieu_idx on public.tips(lieu_id);

-- ── PHOTOS (les tirages — l'URL pointe vers Storage) ────────────
create table if not exists public.photos (
  id      uuid primary key default gen_random_uuid(),
  lieu_id uuid not null references public.lieux(id) on delete cascade,
  type    text not null check (type in ('lieu','plat','wc')),
  url     text not null,
  ordre   int default 0,
  cree_le timestamptz not null default now()
);
create index if not exists photos_lieu_idx on public.photos(lieu_id);

-- ── RELATIONS (les 2 anneaux + les demandes d'amis) ─────────────
create table if not exists public.relations (
  id      uuid primary key default gen_random_uuid(),
  de_id   uuid not null references public.profils(id) on delete cascade,
  vers_id uuid not null references public.profils(id) on delete cascade,
  type    text not null default 'suivi' check (type in ('proche','suivi')),
  statut  text not null default 'demande' check (statut in ('demande','accepte')),
  cree_le timestamptz not null default now(),
  unique (de_id, vers_id),
  check (de_id <> vers_id)
);
create index if not exists relations_vers_idx on public.relations(vers_id);

-- ── SORTIES (validations "alors, Le Bisou ?") ───────────────────
create table if not exists public.sorties (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profils(id) on delete cascade,
  lieu_id    uuid not null references public.lieux(id) on delete cascade,
  date       timestamptz not null default now(),
  statut     text not null default 'attente'
             check (statut in ('attente','valide','bof')),
  conditions text[] default '{}',
  cree_le    timestamptz not null default now()
);
create index if not exists sorties_user_idx on public.sorties(user_id);

-- ════════════════════════════════════════════════════════════════
-- Profil auto-créé à l'inscription (magic-link / Google)
-- ════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profils (id, prenom)
  values (new.id, split_part(coalesce(new.email,''), '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════
-- Helper : ce lieu appartient-il à quelqu'un de mon cercle (accepté) ?
-- security definer → contourne la RLS de `relations` proprement.
-- ════════════════════════════════════════════════════════════════
create or replace function public.est_dans_mon_cercle(cible uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.relations r
    where r.statut = 'accepte'
      and ( (r.de_id = auth.uid() and r.vers_id = cible)
         or (r.vers_id = auth.uid() and r.de_id = cible) )
  );
$$;

-- ════════════════════════════════════════════════════════════════
-- RLS — on active partout puis on écrit les règles
-- ════════════════════════════════════════════════════════════════
alter table public.profils   enable row level security;
alter table public.lieux     enable row level security;
alter table public.tips      enable row level security;
alter table public.photos    enable row level security;
alter table public.relations enable row level security;
alter table public.sorties   enable row level security;

-- ── PROFILS : vitrine lisible par tout connecté ; on n'édite que le sien
create policy "profils lisibles" on public.profils
  for select to authenticated using (true);
create policy "mon profil — créer" on public.profils
  for insert to authenticated with check (id = auth.uid());
create policy "mon profil — éditer" on public.profils
  for update to authenticated using (id = auth.uid());

-- ── LIEUX : mes spots + publics + le cercle ; édition réservée au owner
create policy "voir les lieux autorisés" on public.lieux
  for select to authenticated using (
    owner_id = auth.uid()
    or visibilite = 'public'
    or (visibilite = 'cercle' and public.est_dans_mon_cercle(owner_id))
  );
create policy "créer mes lieux" on public.lieux
  for insert to authenticated with check (owner_id = auth.uid());
create policy "éditer mes lieux" on public.lieux
  for update to authenticated using (owner_id = auth.uid());
create policy "supprimer mes lieux" on public.lieux
  for delete to authenticated using (owner_id = auth.uid());

-- ── helper de visibilité d'un lieu (réutilisé par tips & photos)
create or replace function public.lieu_visible(p_lieu uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.lieux l
    where l.id = p_lieu
      and ( l.owner_id = auth.uid()
         or l.visibilite = 'public'
         or (l.visibilite = 'cercle' and public.est_dans_mon_cercle(l.owner_id)) )
  );
$$;
create or replace function public.lieu_a_moi(p_lieu uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.lieux l where l.id = p_lieu and l.owner_id = auth.uid());
$$;

-- ── TIPS : lisibles si le lieu parent l'est ; on n'écrit que les siens
create policy "voir les tips visibles" on public.tips
  for select to authenticated using (public.lieu_visible(lieu_id));
create policy "créer mes tips" on public.tips
  for insert to authenticated with check (auteur_id = auth.uid());
create policy "éditer mes tips" on public.tips
  for update to authenticated using (auteur_id = auth.uid());
create policy "supprimer mes tips" on public.tips
  for delete to authenticated using (auteur_id = auth.uid());

-- ── PHOTOS : lisibles si le lieu parent l'est ; écrites par le owner du lieu
create policy "voir les photos visibles" on public.photos
  for select to authenticated using (public.lieu_visible(lieu_id));
create policy "ajouter photos à mes lieux" on public.photos
  for insert to authenticated with check (public.lieu_a_moi(lieu_id));
create policy "éditer photos de mes lieux" on public.photos
  for update to authenticated using (public.lieu_a_moi(lieu_id));
create policy "supprimer photos de mes lieux" on public.photos
  for delete to authenticated using (public.lieu_a_moi(lieu_id));

-- ── RELATIONS : je vois/gère celles où je suis impliqué
create policy "voir mes relations" on public.relations
  for select to authenticated using (de_id = auth.uid() or vers_id = auth.uid());
create policy "envoyer une demande" on public.relations
  for insert to authenticated with check (de_id = auth.uid());
create policy "accepter/gérer une relation" on public.relations
  for update to authenticated using (de_id = auth.uid() or vers_id = auth.uid());
create policy "retirer une relation" on public.relations
  for delete to authenticated using (de_id = auth.uid() or vers_id = auth.uid());

-- ── SORTIES : strictement les miennes
create policy "voir mes sorties" on public.sorties
  for select to authenticated using (user_id = auth.uid());
create policy "créer mes sorties" on public.sorties
  for insert to authenticated with check (user_id = auth.uid());
create policy "éditer mes sorties" on public.sorties
  for update to authenticated using (user_id = auth.uid());
create policy "supprimer mes sorties" on public.sorties
  for delete to authenticated using (user_id = auth.uid());
