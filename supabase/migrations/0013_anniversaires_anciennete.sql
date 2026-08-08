-- ════════════════════════════════════════════════════════════════
-- 0013 — LES ANNIVERSAIRES + LA RÈGLE D'ANCIENNETÉ (Ersan, 07/08)
--
-- ① L'ANNIVERSAIRE dans la vitrine : profils_publics gagne une
--    colonne `anniversaire` = « MM-DD » — le JOUR et le MOIS
--    seulement, JAMAIS l'année. La naissance complète (et donc
--    l'âge) reste cachée comme depuis la 0003 : on peut souhaiter
--    un anniversaire sans savoir lequel c'est.
--
-- ② LA RÈGLE D'ANCIENNETÉ sur le carnet PUBLIC :
--    · tant que l'app compte MOINS DE 50 profils → tout le carnet
--      public est ouvert à tous, même aux arrivés d'hier (on est
--      entre nous, la ville se montre entière) ;
--    · à partir de 50 profils → il faut 6 MOIS d'ancienneté pour
--      lire le carnet public entier. Les plus jeunes membres vivent
--      sur leurs spots + ceux de leur cercle : le carnet public
--      se MÉRITE quand l'app devient grande.
--    Les spots PRIVÉS et CERCLE ne changent pas d'un poil.
--
-- Idempotente : re-runnable sans casse.
-- À coller tel quel dans Supabase → SQL Editor → Run (APRÈS 0012).
-- ════════════════════════════════════════════════════════════════

-- ── ① la vitrine gagne l'anniversaire (MM-DD, sans année) ────────
drop view if exists public.profils_publics;
create view public.profils_publics as
  select
    id, prenom, critere, bio, insta, photo_url, cree_le,
    to_char(naissance, 'MM-DD') as anniversaire
  from public.profils;
alter view public.profils_publics owner to postgres;

revoke all on public.profils_publics from public, anon;
grant select on public.profils_publics to authenticated;

-- ── ② lieu_visible : le carnet public se mérite à 50 membres ─────
-- (fonction posée par 0001, réécrite ici — même signature, RLS et
-- policies existantes inchangées : elles l'appellent déjà)
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
  -- le cercle : comme avant
  if v_visibilite = 'cercle' and public.est_dans_mon_cercle(v_owner) then
    return true;
  end if;
  -- le public : ouvert à tous tant qu'on est petits (< 50 profils),
  -- puis réservé aux 6 mois d'ancienneté
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
