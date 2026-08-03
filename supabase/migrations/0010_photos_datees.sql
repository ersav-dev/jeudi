-- ════════════════════════════════════════════════════════════════
-- 0010 — LA PELLICULE : dater les preuves.
-- Une photo doit savoir QUAND elle a été prise et PAR QUI, pour que la
-- carte puisse la faire vieillir (le tas de polaroids qui fond).
-- `visible_le` = la publication différée d'1h : la photo « sèche » avant
-- d'apparaître aux autres — et ça tue l'inférence de position en temps
-- réel (« karim est AU perchoir MAINTENANT »).
-- À coller tel quel dans Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════

alter table public.photos add column if not exists prise_le timestamptz;
alter table public.photos add column if not exists visible_le timestamptz;
alter table public.photos add column if not exists auteur_id uuid
  references public.profils(id) on delete set null;

-- les photos existantes : on les considère ANCIENNES (des souvenirs, sépia),
-- jamais fraîches — sinon la carte s'allumerait d'un coup au déploiement.
update public.photos
   set prise_le   = coalesce(prise_le,   now() - interval '30 days'),
       visible_le = coalesce(visible_le, now() - interval '30 days')
 where prise_le is null or visible_le is null;

-- les photos d'un lieu appartiennent à celui qui possède le lieu tant qu'on
-- n'a pas mieux (le client réécrit auteur_id à chaque sync de ses propres photos)
update public.photos p
   set auteur_id = l.owner_id
  from public.lieux l
 where p.lieu_id = l.id and p.auteur_id is null;

-- la carte lit « les tirages récents visibles », dans cet ordre
create index if not exists photos_pellicule_idx
  on public.photos (visible_le desc) where visible_le is not null;

-- ── le vu / pas vu : UNE ligne par (moi, spot, soirée) ──
-- Un sceau par SOIRÉE, pas par photo : si karim reposte 20 min plus tard,
-- l'étiquette de cire ne se rallume pas — elle se rallume à la soirée
-- suivante. On annonce un événement, on ne notifie pas une personne.
create table if not exists public.vues_pellicule (
  user_id  uuid not null references public.profils(id) on delete cascade,
  lieu_id  uuid not null references public.lieux(id) on delete cascade,
  -- la soirée lue = la date locale du dernier tirage vu (une photo de 2h du
  -- matin appartient à la soirée de la veille : voir soireeDe() côté client)
  soiree   date not null,
  vu_le    timestamptz not null default now(),
  primary key (user_id, lieu_id, soiree)
);

alter table public.vues_pellicule enable row level security;

-- mes vues ne regardent que moi : personne ne sait ce que j'ai ouvert
-- (l'inverse serait un accusé de lecture — l'app n'en veut à aucun prix)
drop policy if exists "mes vues" on public.vues_pellicule;
create policy "mes vues" on public.vues_pellicule
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists vues_pellicule_user_idx
  on public.vues_pellicule (user_id, vu_le desc);
