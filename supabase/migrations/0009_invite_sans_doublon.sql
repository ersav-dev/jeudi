-- ════════════════════════════════════════════════════════════════
-- 0009 — L'INVITÉ NE VOTE PLUS EN DOUBLE
-- Le bug : en navigation privée, la clé de l'invité meurt avec l'onglet.
-- Il rouvre le lien, on lui redemande son prénom, sg_rejoindre créait un
-- SECOND participant — le compteur « x/y ont voté » gonflait et ses deux
-- séries de votes comptaient à la fois (le verdict pouvait basculer).
-- Correctif : à prénom identique (casse et espaces pliés) sur la même
-- sortie, on REND le participant existant au lieu d'en créer un autre.
-- À coller tel quel dans Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════

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
