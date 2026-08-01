-- ════════════════════════════════════════════════════════════════
-- 0007 — « ON REJOUE. » (le rematch)
-- Un match clos peut se rejouer : mêmes spots, nouveau vote. L'ancienne
-- sortie pointe vers la nouvelle (rematch_id) et sg_voir expose le token
-- du rejeu : la page des invités de l'ANCIEN lien affiche « ça se
-- rejoue — revote ici → » et rapatrie tout le monde.
-- À coller tel quel dans Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════

alter table public.sorties_groupe
  add column if not exists rematch_id uuid references public.sorties_groupe(id) on delete set null;

-- sg_voir : on ajoute 'rematch_token' à l'objet sortie (le reste inchangé)
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
        'rematch_token', (select r.token from public.sorties_groupe r where r.id = s.rematch_id),
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
