-- ════════════════════════════════════════════════════════════════
-- jeudi. — 0018 : SIGNALER (CHANTIER_SIGNALER_BLOQUER, plan §1)
--
-- Aujourd'hui, signaler un lieu pose un drapeau en localStorage et
-- signaler une photo ouvre un mailto: vers une boîte qui n'existe
-- pas. Rien ne remonte. Cette table est la première des quatre
-- obligations des stores (Apple 1.2, Google UGC) qui devient vraie :
-- un signalement S'ÉCRIT quelque part, et quelqu'un peut le lire.
--
-- Les règles, décidées le 12/08 :
--   · un signalement est un SIGNAL, pas un verdict : aucune
--     suppression automatique, jamais de compteur, pas de seuil.
--   · chacun crée les siens et ne lit QUE les siens. Personne ne
--     voit les signalements des autres — ni combien, ni de qui.
--   · pas de FK vers la cible : un lieu supprimé par son auteur ne
--     doit pas emporter le signalement qui le visait. La colonne
--     `contexte` fige ce qu'il faut pour comprendre après coup.
--   · le destinataire est contact@jeudi.app (décision d'Ersan,
--     12/08) — la boîte est à créer AVANT la porte 2 ; en attendant
--     la table se lit dans le dashboard Supabase.
--   · pas d'UPDATE côté membre : l'état (`ouvert` → `traite`) se
--     gère côté admin (service role / dashboard), jamais en app.
--
-- Idempotente. À coller dans Supabase → SQL Editor → Run (APRÈS 0017).
-- NOTE numérotation : CHANTIER_PUSH.md réservait 0018 — le push
-- glisse en 0020, ce chantier-ci est parti le premier.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.signalements (
  id         uuid primary key default gen_random_uuid(),
  auteur_id  uuid not null references public.profils(id) on delete cascade,
  cible_type text not null check (cible_type in ('lieu','photo','tip','profil')),
  -- l'id de la cible, en texte : jamais de FK (voir en-tête). Un uuid
  -- pour lieu/photo/tip/profil ; le chemin du fichier pour une photo
  -- de storage si l'app préfère.
  cible_id   text not null check (char_length(cible_id) between 1 and 200),
  -- le motif, court et choisi dans l'app (le vocabulaire exact est un
  -- mot de marque, pas une contrainte SQL — il pourra changer sans
  -- migration). On borne juste la taille.
  motif      text not null check (char_length(motif) between 1 and 60),
  -- les mots de la personne, optionnels. « c'est noté. » — pas un
  -- formulaire d'interrogatoire, donc pas de champ obligatoire de plus.
  texte      text check (texte is null or char_length(texte) <= 1000),
  -- la photographie de la cible au moment du signalement (nom du lieu,
  -- chemin de la photo, extrait du tip…) : posée par l'app, pour que
  -- le signalement reste lisible même si la cible disparaît.
  contexte   jsonb,
  etat       text not null default 'ouvert' check (etat in ('ouvert','traite')),
  cree_le    timestamptz not null default now()
);

-- la lecture admin trie par état puis par date ; l'app ne lit que les
-- siens (rarement) — un seul index suffit à notre échelle.
create index if not exists signalements_etat_idx
  on public.signalements (etat, cree_le desc);

alter table public.signalements enable row level security;

-- chacun crée les SIENS — et un signalement naît toujours 'ouvert'
-- (personne ne pré-classe son propre signalement).
drop policy if exists "signaler — créer" on public.signalements;
create policy "signaler — créer" on public.signalements
  for insert to authenticated
  with check (auteur_id = auth.uid() and etat = 'ouvert');

-- chacun ne lit que les SIENS (« c'est noté. » — et c'est tout).
drop policy if exists "signaler — lire les miens" on public.signalements;
create policy "signaler — lire les miens" on public.signalements
  for select to authenticated
  using (auteur_id = auth.uid());

-- pas de policy UPDATE ni DELETE : côté membre un signalement ne se
-- retire pas et ne s'édite pas (c'est un signal daté) ; côté admin le
-- service role passe au-dessus de la RLS, comme partout.
