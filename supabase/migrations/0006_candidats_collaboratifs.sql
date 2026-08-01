-- ════════════════════════════════════════════════════════════════
-- 0006 — les CANDIDATS COLLABORATIFS du match de groupe
-- Trois rôles : le créateur compose depuis TOUTE sa carte ; les
-- participants qui ont l'app PROPOSENT leurs spots tant que le vote
-- est ouvert ; les invités WhatsApp votent parmi tout ça (leur page
-- se met à jour seule). Chaque spot proposé porte le prénom de qui
-- l'a mis (« proposé par marie »).
-- À coller tel quel dans Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════

-- qui a proposé ce spot (prénom instantané, comme le reste du snapshot)
alter table public.sg_candidats add column if not exists propose_par text;

-- ── les participants inscrits peuvent proposer, tant que c'est ouvert
create policy "proposer un spot" on public.sg_candidats
  for insert to authenticated with check (
    public.sg_ouverte(sortie_id)
    and exists (select 1 from public.sg_participants p
                where p.sortie_id = sg_candidats.sortie_id
                  and p.profil_id = auth.uid())
  );

-- ── le plafond : 12 candidats max par sortie (un vote, pas un catalogue)
create or replace function public.sg_garde_cap_candidats()
returns trigger language plpgsql
set search_path = public as $$
begin
  if (select count(*) from public.sg_candidats c where c.sortie_id = new.sortie_id) >= 12 then
    raise exception 'le match est plein — 12 spots max, on vote maintenant';
  end if;
  return new;
end;
$$;
drop trigger if exists sg_cap_candidats on public.sg_candidats;
create trigger sg_cap_candidats
  before insert on public.sg_candidats
  for each row execute function public.sg_garde_cap_candidats();

-- ── sg_voir : les invités voient qui a proposé quoi
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
        'meteo', c.meteo, 'ordre', c.ordre, 'propose_par', c.propose_par) order by c.ordre), '[]'::jsonb)
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
