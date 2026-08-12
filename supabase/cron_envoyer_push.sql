-- ════════════════════════════════════════════════════════════════
-- jeudi. — LE CRON du push (chantier push, 12/08/2026)
-- Une passe par jour à 16 h UTC (= 18 h à Paris l'été, 17 h l'hiver —
-- assumé : « vers 18 h », jamais du temps réel harcelant).
-- À coller dans Supabase → SQL Editor → Run, APRÈS avoir déployé
-- l'Edge Function envoyer-push (voir CHANTIER_PUSH.md).
-- La clé ci-dessous est la clé ANON (publique par nature — la même
-- que dans l'app) : la fonction vérifie le JWT, pas plus.
-- Idempotent : re-runnable, l'ancien job est remplacé.
-- ════════════════════════════════════════════════════════════════
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  perform cron.unschedule('jeudi-envoyer-push');
exception when others then
  null; -- pas encore de job : tant mieux
end $$;

select cron.schedule(
  'jeudi-envoyer-push',
  '0 16 * * *',
  $$
  select net.http_post(
    url := 'https://pksiepuiamuesugackpf.supabase.co/functions/v1/envoyer-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrc2llcHVpYW11ZXN1Z2Fja3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTI4MjEsImV4cCI6MjA5NzAyODgyMX0.MosqvTCdLI0w-PN0dC-wn-PhP19VC522ijcYXrgorlU'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- contrôle : le job existe ?
select jobname, schedule from cron.job where jobname = 'jeudi-envoyer-push';
