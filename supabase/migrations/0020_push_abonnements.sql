-- ════════════════════════════════════════════════════════════════
-- jeudi. — 0020 : LES ABONNEMENTS PUSH (CHANTIER_PUSH, plan §1)
--
-- Le push web = un message chiffré envoyé à l'ENDPOINT que le
-- navigateur du membre nous confie quand il dit « me prévenir ».
-- Cette table garde ces adresses — une ligne par APPAREIL (le même
-- compte peut vivre sur un téléphone et un ordi), d'où la clé sur
-- l'endpoint, pas sur le user.
--
-- p256dh + auth : les clés de chiffrement fournies par le navigateur
-- avec l'abonnement (Web Push / RFC 8291). Sans elles on ne peut
-- rien envoyer ; elles ne servent à rien sans notre clé VAPID privée,
-- qui vit dans les secrets des Edge Functions — JAMAIS ici.
--
-- RLS : chacun les siens, personne d'autre. L'Edge Function
-- envoyer-push lit TOUT via le service role (au-dessus de la RLS),
-- comme partout.
--
-- (Note : le cadrage du 07/08 disait « migration 0015 » — les
-- numéros ont filé, signaler/bloquer a pris 0018/0019, le push
-- prend 0020.)
--
-- Idempotente. À coller dans Supabase → SQL Editor → Run (APRÈS 0019).
-- ════════════════════════════════════════════════════════════════

create table if not exists public.push_abonnements (
  -- l'adresse unique de CET appareil (URL du service de push du navigateur)
  endpoint text primary key check (char_length(endpoint) between 1 and 1000),
  user_id  uuid not null references public.profils(id) on delete cascade,
  p256dh   text not null check (char_length(p256dh) between 1 and 200),
  auth     text not null check (char_length(auth) between 1 and 100),
  cree_le  timestamptz not null default now()
);
-- « tous les appareils d'un membre » — le chemin de lecture de l'envoyeur
create index if not exists push_abonnements_user_idx
  on public.push_abonnements (user_id);

alter table public.push_abonnements enable row level security;

-- chacun gère les SIENS : s'abonner, se réabonner (upsert), se couper.
drop policy if exists "mes abonnements push" on public.push_abonnements;
create policy "mes abonnements push" on public.push_abonnements
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
