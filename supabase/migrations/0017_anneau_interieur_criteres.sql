-- ════════════════════════════════════════════════════════════════
-- jeudi. — 0017 : L'ANNEAU INTÉRIEUR ET LES JUGEMENTS (09/08/2026)
--
-- Deux fondations pour « la lentille » (CONCEPT.md « deux anneaux » et
-- « les critères »). On ne construit pas la lentille elle-même ici — juste
-- ce sans quoi elle n'aurait aucune donnée : où vivent les super potes, et
-- où vit le regard qu'ils portent sur un lieu.
--
-- Rappel important : LE CRITÈRE d'une personne (son obsession — « Karim
-- EST le bruit ») a déjà sa colonne, posée dès 0001 : `public.profils.
-- critere`. Rien à migrer pour lui — cette migration ne porte QUE ce qui
-- manquait : l'anneau intérieur (table 1) et les jugements (table 2).
--
-- ── 1. L'ANNEAU INTÉRIEUR (les « super potes », 10 max) ────────────
--
-- CONCEPT.md distingue déjà deux anneaux — les proches et les suivis — et
-- `public.relations` (0001) porte cette distinction au niveau de la
-- relation elle-même (`type in ('proche','suivi')`, un accord mutuel
-- demande/accepte, comme une demande d'ami). Mais « les super potes »
-- (l'anneau intérieur, 10 max, « les critères ») sont autre chose : un
-- choix PERSONNEL et UNILATÉRAL — TOI qui décide, à la main, lesquels de
-- tes proches pèsent le plus. Pas de mutualité, pas d'accord de l'autre
-- côté (« tu confirmes toujours », jamais lui). Aujourd'hui ce choix ne
-- vit qu'en local (app/src/cercle.ts, clé `jeudi-proches`) : cette table
-- lui donne un foyer cloud, pour qu'il suive le compte d'un appareil à
-- l'autre — même pattern que les autres migrations récentes (favori,
-- pépite, rayure) : local d'abord, synchro ensuite.
--
-- ⚠ Le cap à 10 (CAP_PROCHES, cercle.ts) est une règle D'USAGE côté app,
-- PAS une frontière de sécurité : on ne la met PAS en contrainte SQL. La
-- table accepte n'importe quel nombre de lignes ; c'est l'app qui refuse
-- d'ajouter au-delà de 10 (et qui CURE au lieu d'afficher une erreur —
-- CONCEPT.md : « le cap n'est pas un mur »). Une contrainte serait plus
-- stricte que le produit ne le veut, et casserait le jour où le cap change.
create table if not exists public.super_potes (
  -- qui choisit
  user_id uuid not null references public.profils(id) on delete cascade,
  -- qui est choisi (doit déjà être dans le cercle de user_id — vérifié
  -- côté app au moment du choix, pas ici : la RLS de `relations` suffit à
  -- protéger la donnée, elle n'a pas à rejouer la logique métier)
  pote_id uuid not null references public.profils(id) on delete cascade,
  cree_le timestamptz not null default now(),
  primary key (user_id, pote_id),
  check (user_id <> pote_id)
);
create index if not exists super_potes_user_idx on public.super_potes(user_id);

alter table public.super_potes enable row level security;

-- privé : c'est MON tri de confiance, personne d'autre n'a à le voir (une
-- liste de « qui pèse le plus pour moi » est intime — contrairement à la
-- rayure ou au jugement, ce n'est pas un signal qu'on donne au cercle).
drop policy if exists "mes super potes" on public.super_potes;
create policy "mes super potes" on public.super_potes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── 2. LE JUGEMENT (le regard d'un proche, pas une note) ───────────
--
-- Pastilles 3 niveaux (●○○ · ●●○ · ●●●), jamais d'étoiles, jamais de
-- « /5 », jamais de moyenne, jamais de classement — la mécanique des WC
-- (proprete_wc sur `lieux`) généralisée à n'importe quel critère.
--
-- Conséquence directe de « un membre = un seul critère » (profils.critere,
-- décidé, non renégocié ici) : un jugement n'a pas besoin de porter
-- l'identifiant du critère jugé — il se DÉDUIT de qui juge. D'où la forme
-- minimale (qui, quel lieu, quel niveau), sans colonne critere_id.
--
-- On peut juger TOUT lieu où on est allé (pas seulement ses propres
-- spots) : owner_id du lieu n'entre dans aucune contrainte ici. La preuve
-- du « j'y suis allé » (le tampon) est vérifiée côté app (jugement.ts,
-- peutJuger()) au moment de poser le jugement — pas en RLS, exactement
-- comme la rayure ne vérifie pas non plus qu'on a un tampon avant de
-- rayer (0015) : la RLS protège QUI peut écrire/lire, pas la légitimité
-- métier du contenu.
create table if not exists public.jugements (
  -- qui juge (son critère se lit sur son profil : profils.critere)
  user_id uuid not null references public.profils(id) on delete cascade,
  lieu_id uuid not null references public.lieux(id) on delete cascade,
  -- ●○○ · ●●○ · ●●●
  niveau  int not null check (niveau between 1 and 3),
  juge_le timestamptz not null default now(),
  -- un seul jugement par personne et par lieu : juger deux fois REMPLACE,
  -- jamais un empilement (même esprit que la rayure, 0015)
  primary key (user_id, lieu_id)
);
create index if not exists jugements_lieu_idx on public.jugements(lieu_id);

alter table public.jugements enable row level security;

-- j'écris et j'efface les MIENS (le repentir existe, comme pour la rayure)
drop policy if exists "mes jugements" on public.jugements;
create policy "mes jugements" on public.jugements
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- je LIS les jugements de mon cercle — « voir un lieu à travers leurs
-- yeux » (CONCEPT.md) n'a de sens que si je peux au moins lire le regard
-- de tout mon cercle (le filtre « super potes seulement » se fait côté
-- app, à la lecture — cf. la note sur le cap ci-dessus). On réutilise le
-- helper posé en 0001, comme les autres politiques de partage (rayures,
-- vues_pellicule) : il connaît déjà la règle du cercle.
drop policy if exists "les jugements de mon cercle" on public.jugements;
create policy "les jugements de mon cercle" on public.jugements
  for select to authenticated
  using (public.est_dans_mon_cercle(user_id));

-- ── 3. Rappel du travail restant côté app ──────────────────────────
-- Ce soir : la couche donnée (ce fichier + app/src/cercle.ts::
-- curerEtRemplacer + app/src/jugement.ts) et les fonctions pures
-- correspondantes (testées). PAS construit, volontairement :
--   · le geste de curation à l'écran (« ton cercle est plein. qui tu
--     sors ? », swipe garder/retirer) — la donnée le permet déjà
--     (curerEtRemplacer), l'écran viendra avec « la lentille ».
--   · le geste de juger au pouce (les pastilles qu'on tapote sur une
--     fiche) — jugement.ts est prêt à le recevoir.
--   · la synchro cloud de `super_potes` (aujourd'hui local uniquement,
--     cercle.ts) et de `jugements` (aujourd'hui local uniquement,
--     jugement.ts) — même chantier que rayerLieu()/chargerRayuresCloud()
--     dans db.ts, à faire quand ces gestes s'allument pour de vrai.
-- ════════════════════════════════════════════════════════════════
