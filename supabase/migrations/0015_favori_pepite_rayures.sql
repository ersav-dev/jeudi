-- ════════════════════════════════════════════════════════════════
-- jeudi. — 0015 : LE FAVORI, LA PÉPITE, ET LA RAYURE (09/08/2026)
--
-- La grammaire de la carte (design/dictionnaire_carte_001.html) prévoit
-- six marqueurs sous le glyphe. Trois attendaient leur donnée :
--
--   ♥  favori  — pour TOI. Plein si tu y es allé, creux sinon.
--   ◇  pépite  — pour les AUTRES. La trouvaille que tu donnes au cercle.
--   ✕  rayure  — tu as été déçu et tu préviens ton cercle.
--
-- favori et pépite sont des drapeaux sur le lieu : ils appartiennent à
-- son propriétaire, comme le tampon. La RAYURE, elle, ne peut pas être
-- une colonne : elle est SIGNÉE (on doit savoir QUI a été déçu — un pote
-- dont tu connais le goût ne pèse pas comme un inconnu) et elle EXPIRE.
-- D'où sa table.
--
-- Les règles de la rayure, décidées le 09/08 :
--   · elle COÛTE — pour l'émettre tu supprimes le lieu de ton carnet.
--     C'est un serment, pas un clic. C'est ce qui protège tout le reste.
--   · elle ne se COMPTE JAMAIS. Trois croix empilées sur un lieu, ce
--     n'est plus un carnet, c'est un tribunal. Une rayure est toujours
--     singulière et signée.
--   · elle tient jusqu'au JEUDI SUIVANT (l'app bat à ce rythme), puis
--     elle s'efface et le lieu disparaît.
--   · une seule par personne et par lieu (d'où la clé primaire).
--   · elle reste DANS LE CERCLE. Jamais publique, jamais anonyme.
--
-- À coller tel quel dans Supabase → SQL Editor → Run (APRÈS 0014).
-- ════════════════════════════════════════════════════════════════

-- ── 1. Les deux drapeaux, sur le lieu ──────────────────────────────
alter table public.lieux
  add column if not exists favori boolean not null default false,
  add column if not exists pepite boolean not null default false;

-- on ne lit jamais « tous les favoris de tout le monde » : toujours les
-- MIENS. L'index est donc partiel et porte le propriétaire.
create index if not exists lieux_favori_idx
  on public.lieux (owner_id) where favori;
create index if not exists lieux_pepite_idx
  on public.lieux (owner_id) where pepite;

-- ── 2. La rayure : signée, datée, périssable ───────────────────────
create table if not exists public.rayures (
  -- qui a été déçu. La rayure porte son encre sur la carte de ses potes :
  -- c'est l'information la plus utile du signal.
  user_id  uuid not null references public.profils(id) on delete cascade,
  lieu_id  uuid not null references public.lieux(id) on delete cascade,
  -- une ligne, pas un pavé. « trois quarts d'heure pour deux bières. »
  -- Sans le pourquoi c'est de l'humeur ; avec, c'est un service.
  motif    text check (motif is null or char_length(motif) <= 140),
  raye_le  timestamptz not null default now(),
  -- le jeudi suivant à minuit, calculé côté app (fuseau de Paris).
  -- Après ça la rayure ne dit plus rien : le lieu s'efface pour de bon.
  expire   timestamptz not null,
  -- une seule rayure par personne et par lieu : pas d'empilement
  primary key (user_id, lieu_id)
);

alter table public.rayures enable row level security;

-- j'écris et j'efface les MIENNES (l'effacement = le repentir, tant que
-- la rayure n'a pas expiré)
drop policy if exists "mes rayures" on public.rayures;
create policy "mes rayures" on public.rayures
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- je LIS celles de mon cercle, et SEULEMENT tant qu'elles vivent —
-- une rayure expirée ne dit plus rien, elle ne doit même pas se lire.
-- On réutilise le helper posé en 0001, comme les autres politiques de
-- partage : il connaît déjà la règle du cercle, on ne la réécrit pas.
drop policy if exists "les rayures de mon cercle" on public.rayures;
create policy "les rayures de mon cercle" on public.rayures
  for select to authenticated
  using (expire > now() and public.est_dans_mon_cercle(user_id));

-- ── 3. Le ménage : une rayure expirée n'a plus rien à dire ─────────
-- Pas de cron : on nettoie à la lecture (la politique filtre déjà sur
-- expire) et on peut passer ceci de temps en temps à la main.
-- delete from public.rayures where expire < now();

-- ── 4. Rappel du travail restant côté app ──────────────────────────
-- L'app écrit aujourd'hui la rayure EN LOCAL (le cercle est simulé).
-- Le jour où tu colles cette migration, il reste à brancher :
--   · l'écriture dans public.rayures au moment de rayer
--   · la lecture des rayures du cercle dans la synchro des lieux
--   · le mapping favori/pepite dans versLigne()/deLigne() (db.ts)
