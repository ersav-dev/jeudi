-- ════════════════════════════════════════════════════════════════
-- FUSION DE L'ENRICHISSEMENT — 2026-08-08 (one-shot, rejouable)
-- Généré par _enrichissement/fusionner_enrichissement.mjs.
-- Sources croisées : OpenStreetMap.
-- Priorite en cas de desaccord : Google > OSM > GPT.
--
-- LA GARDE : chaque UPDATE exige de retrouver la description EXACTE
-- sur laquelle il a ete decide (colonne "avant"). Si tu as retouche un
-- lieu depuis, la ligne ne bouge pas — tes saisies priment, toujours.
-- Les horaires ne sont poses que la ou il n'y en a aucun.
-- Rejouer ce fichier deux fois ne change rien la seconde fois.
--
-- À coller dans Supabase → SQL Editor → Run.
-- 12 description(s) · 2 horaire(s)
-- ════════════════════════════════════════════════════════════════

-- ── 1. LES DESCRIPTIONS (le type et le tampon en decoulent) ──────
with moi as (
  select id from public.profils
  where lower(prenom) = 'ersan'
  order by cree_le asc limit 1
),
d (nom, avant, apres) as (
  values
  ('Menekse', 'Restaurant', 'Restaurant turc'),
  ('Le Louis XVI', null::text, 'Restaurant'),
  ('Pide Paris', 'Turque', 'Street food turc'),
  ('Hanoï Cà Phê Opéra', 'Vietnamienne', 'Bar vietnamien'),
  ('Express de Lyon', 'Brasserie', 'Café'),
  ('DAROCO 16', null::text, 'Restaurant italien'),
  ('Ebis', 'Fusion asiatique', 'Restaurant japonais'),
  ('L''Auberge Café', null::text, 'Restaurant'),
  ('Atelier du veau', null::text, 'Street food turc'),
  ('Café Blanc', 'Française', 'Café'),
  ('Griffon', 'Restaurant', 'Café'),
  ('Cheper', null::text, 'Restaurant')
)
update public.lieux l
set description = d.apres
from d, moi
where l.owner_id = moi.id
  and lower(l.nom) = lower(d.nom)
  -- la garde : rien ne bouge si la description a change depuis
  and l.description is not distinct from d.avant;

-- ── 2. LES HORAIRES MANQUANTS (plage du jeudi soir, >24 = apres minuit) ──
with moi as (
  select id from public.profils
  where lower(prenom) = 'ersan'
  order by cree_le asc limit 1
),
h (nom, ouv, ferm) as (
  values
  ('Club Coca-Cola - Quai de la Photo', 12.00, 23.50),
  ('Quai de la Photo', 12.00, 23.50)
)
update public.lieux l
set horaire_ouv = h.ouv, horaire_ferm = h.ferm
from h, moi
where l.owner_id = moi.id
  and lower(l.nom) = lower(h.nom)
  and l.horaire_ouv is null and l.horaire_ferm is null;

-- ── 3. CONTROLE (a lire apres le Run) ────────────────────────────
select
  count(*)                                            as lieux_du_fond,
  count(*) filter (where description is not null)     as avec_description,
  count(*) filter (where horaire_ouv is not null)     as avec_horaires
from public.lieux
where owner_id = (select id from public.profils where lower(prenom)='ersan' order by cree_le asc limit 1);
