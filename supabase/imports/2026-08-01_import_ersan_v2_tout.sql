-- ════════════════════════════════════════════════════════════════
-- IMPORT v2 (one-shot, re-runnable) — TOUT le fond du carnet sous le
-- vrai compte d'Ersan : ses 81 spots Google + 129 curated + 96 extra
-- + le décor public — visibilité PUBLIQUE (la RLS les sert à tous les
-- inscrits, signés du fondateur). Les fausses voix (« Karim, éclaireur
-- du 10e »…) ne sont PAS reprises. Remplace l'import v1 (les spots
-- posés en 'cercle' par v1 passent en 'public').
-- À coller dans Supabase → SQL Editor → Run.
--
-- ── CORRIGÉ LE 09/08/2026 (voir supabase/migrations/0016_purge_doublons.sql
-- pour le nettoyage des doublons déjà versés) : le dédoublonnage se
-- faisait par nom EXACT (`lower(nom) = lower(nom)`), ce qui a laissé
-- passer 8 doublons (« Harry's Bar Paris » / « Harry's New York Bar »,
-- « Bisou. » / « Bisou »…). On dédoublonne désormais par la MÊME règle
-- que la lecture côté app (app/src/doublons.ts, memeLieu()) : nom
-- normalisé (accents/ponctuation/casse ignorés) + garde de distance —
-- jamais sur la seule proximité (deux péniches voisines au même point
-- géocodé restent deux lieux si leurs noms ne se répondent pas).
-- ════════════════════════════════════════════════════════════════

-- ── copie fidèle de app/src/doublons.ts, scoped à la session ───────
create or replace function pg_temp.normaliser_nom(p text) returns text
language sql immutable as $$
  select trim(regexp_replace(
    translate(lower(coalesce(p, '')),
      'àâäáãåèéêëìíîïòóôöõùúûüçñýÿ',
      'aaaaaaeeeeiiiiooooouuuucnyy'),
    '[^a-z0-9]+', ' ', 'g'
  ))
$$;

create or replace function pg_temp.distance_m(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql immutable as $$
  select 2 * 6371000 * asin(least(1, sqrt(
    sin(radians(lat2 - lat1) / 2) ^ 2 +
    cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lng2 - lng1) / 2) ^ 2
  )))
$$;

create or replace function pg_temp.mots_forts(p text) returns text[]
language sql immutable as $$
  select coalesce(array_agg(distinct mot), '{}')
  from unnest(string_to_array(p, ' ')) as mot
  where length(mot) >= 4
    and mot not in ('paris','bar','club','cafe','restaurant','resto','brasserie',
                     'bistro','bistrot','chez','maison','grand','grande','petit',
                     'petite','nouveau','nouvelle','france','french','house')
$$;

-- même nom normalisé (≤200 m) OU quasi même point + mot fort commun
-- (≤15 m) — jamais la seule proximité (voir doublons.ts pour le détail)
create or replace function pg_temp.meme_lieu(
  nom_a text, lat_a double precision, lng_a double precision,
  nom_b text, lat_b double precision, lng_b double precision
) returns boolean
language sql immutable as $$
  select case
    when lat_a is null or lng_a is null or lat_b is null or lng_b is null then false
    when pg_temp.distance_m(lat_a, lng_a, lat_b, lng_b) > 200 then false
    when pg_temp.normaliser_nom(nom_a) = '' or pg_temp.normaliser_nom(nom_b) = '' then false
    when pg_temp.normaliser_nom(nom_a) = pg_temp.normaliser_nom(nom_b) then true
    when pg_temp.distance_m(lat_a, lng_a, lat_b, lng_b) > 15 then false
    else exists (
      select 1
      from unnest(pg_temp.mots_forts(pg_temp.normaliser_nom(nom_a))) fa
      where fa = any(pg_temp.mots_forts(pg_temp.normaliser_nom(nom_b)))
    )
  end
$$;

with moi as (
  select id from public.profils
  where lower(prenom) = 'ersan'
  order by cree_le asc
  limit 1
),
donnees (nom, lat, lng, adresse, description, note, envies, compagnies, meteo, rooftop, sur_leau, match) as (
  values
  ('The Office', 48.8391435, 2.3486007, 'The Office, Rue Claude Bernard, Quartier du Val-de-Grâce', 'Restaurant', 'A tester !!', array['resto']::text[], '{}'::text[], null, false, false, null),
  ('215 Rue de Paris', 48.8293133, 2.4015281, 'Rue de Paris, Valmy, Paris 12e Arrondissement', '93100 Montreuil', 'Glace a tester', array['resto']::text[], '{}'::text[], null, false, false, null),
  ('Chez Michel', 48.8795704, 2.3522406, 'Chez Michel, Rue de Belzunce, Quartier Saint-Vincent-de-Paul', 'Française', 'Super resto : François et Christophe', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Abri Soba', 48.875021, 2.3444958, 'Abri Soba, 10, Rue Saulnier', 'Restaurant de nouilles au sarrasin (soba)', 'À Tester', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Happatei', 48.8685831, 2.3366834, 'Happa Teï, 64, Rue Sainte-Anne', 'Japonaise', 'Resto Lisa Théo', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Aki Café', 48.8687275, 2.3365482, 'Aki Café, 75, Rue Sainte-Anne', 'Japonaise', 'Bon resto', array['resto']::text[], '{}'::text[], 'pluie', false, false, null),
  ('La Coquille', 48.8642141, 2.3417384, 'La coquille, Rue Coquillière, Quartier Les Halles', 'Bar', null, array['apéro']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Kehribar', 48.8460828, 2.3432882, 'Kehribar, Rue des Fossés Saint-Jacques, Quartier de la Sorbonne', 'Turque', 'A tester insta', array['resto']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Mian Fan', 48.8716074, 2.3412011, 'Mian Fan, Boulevard Montmartre, Quartier Vivienne', 'Fusion asiatique', 'A tester', array['resto']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Duplex Bar', 48.8624459, 2.3550899, 'Duplex, Rue Michel le Comte, Quartier Sainte-Avoye', 'Bar gay', 'Var gay a tester', array['apéro']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Vingt Vins d''Art', 48.8552343, 2.3580088, 'Vingt Vins d''Art, Rue de Jouy, Quartier Saint-Gervais', 'Bistro', 'Reco xtof', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Le Louchebem', 48.8616443, 2.3443874, 'Le Louchébem, 31, Rue Berger', 'Française', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Chez Marius', 48.8765271, 2.3549639, 'Chez Marius, Rue de Chabrol, Quartier de la Porte-Saint-Denis', 'Restaurant', 'Reco xtof', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Restaurant À la maison', 48.8830175, 2.3184119, 'Nouilles ceintures, 99, Rue des Dames', 'Restaurant', 'Resto reco Xtof', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Pacifique', 48.873054, 2.3796868, 'Pacifique, Rue Rampal, Quartier du Combat', 'Chinoise', 'Resto chinois avevamos Bressuire', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Restaurant Le Céladon', 48.8696738, 2.3309961, 'Le Céladon, Rue Daunou, Quartier Gaillon', 'Française', 'Restaurant Corée chicos', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Orson', 48.8536233, 2.3312702, 'Orson, Rue du Dragon, Quartier de Saint-Germain-des-Prés', 'Restaurant', null, array['resto']::text[], '{}'::text[], 'soleil', false, false, null),
  ('On Restaurant', 48.8662857, 2.3327705, 'On, Rue Saint-Roch, Quartier Vendôme', 'Coréenne', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Menekse', 48.8516114, 2.3778571, 'Menekse, 7, Passage de la Main d''Or', 'Restaurant', 'Restaurant kurde', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Le Louis XVI', 48.8732901, 2.3235381, 'Le Louis XVI, Rue des Mathurins, Quartier de la Madeleine', null, null, array['resto']::text[], '{}'::text[], null, false, false, null),
  ('Go Oun', 48.8663515, 2.3353302, 'Go-Oun, 14, Rue Thérèse', 'Coréenne', 'Resto Charlotte', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Brasserie Rosie', 48.8521994, 2.3730393, 'Rosie, 53, Rue du Faubourg Saint-Antoine', 'Brasserie', 'Rdv Dina', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('JanTchi', 48.8660361, 2.335991, 'Jantchi, Rue Thérèse, Quartier du Palais Royal', 'Coréenne', 'Bobun Saint Anne', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Poni', 48.8767991, 2.3369941, 'Poni, 24, Rue Saint-Lazare', 'Brasserie', 'Restaurant a tester', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Le Hibou - Paris', 48.8516588, 2.3385244, 'Le Hibou, 16, Rue de l''Odéon', 'Brasserie', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Pide Paris', 48.8717766, 2.3539306, 'Pidè Paris, Rue du Faubourg Saint-Denis, Quartier de la Porte-Saint-Denis', 'Turque', null, array['resto']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Hanoï Cà Phê Opéra', 48.8714582, 2.3357136, 'Hanoi Cà Phê Opéra, Boulevard des Italiens, Quartier de la Chaussée-d''Antin', 'Vietnamienne', 'Cafe/ Resto sympa', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Restaurant Godjo', 48.8476363, 2.3480323, 'Godjo, 8, Rue de l''École Polytechnique', 'Éthiopienne', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Les Antiquaires', 48.8587025, 2.3288305, 'Les Antiquaires, Rue de Lille, Quartier Saint-Thomas-d''Aquin', 'Bistro', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Restaurant Akrame', 48.8714228, 2.3251829, 'Akrame, Rue Tronchet, Quartier de la Madeleine', 'Cuisine gastronomique', 'restaurant avec cheval dans l entree (Juliette)', array['gastro']::text[], '{}'::text[], 'soleil', false, false, null),
  ('MÛRE', 48.8746195, 2.3386851, 'Mûre, 37, Rue La Fayette', 'Bio', 'Travail sur Paris', array['resto']::text[], '{}'::text[], 'pluie', false, false, null),
  ('El Guacamole République', 48.8713675, 2.3621526, 'El Guacamole, 37, Rue Yves Toudic', 'Mexicaine', 'Guzcolmoleee', array['resto']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Le Petit Cambodge', 48.8738666, 2.3705269, 'Le petit Cambodge, 24, Avenue Claude Vellefaux', 'Cambodgienne', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Tarántula Paris', 48.8543271, 2.3760595, 'Tarántula, 13bis, Rue Keller', 'Restaurant', 'A tester absolutely', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Yo', 48.8696781, 2.3341013, 'Yo !, Rue de Port Mahon, Quartier Gaillon', 'Thaï', 'Resto petit gastro fr/thai', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('No Scrum No Win - Bar Rugby', 48.8776425, 2.3278674, 'No Scrum No Win - Bar Rugby, 32, Rue de Londres', 'Bar sportif', null, array['apéro']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('La Renommée', 48.8612719, 2.343211, 'La Renommée, Rue Saint-Honoré, Quartier Les Halles', 'Française', 'A tester, paris 1900', array['resto']::text[], '{}'::text[], 'soleil', false, false, null),
  ('The Hood Paris', 48.833898, 2.3154421, 'the Hood, Rue de l''Ouest, Quartier de Plaisance', 'Café', 'Singaporean restaurant', array['tranquilo']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Express de Lyon', 48.8459544, 2.3720667, 'Express de Lyon, Rue de Lyon, Quartier des Quinze-Vingts', 'Brasserie', null, array['resto']::text[], '{}'::text[], 'pluie', false, false, null),
  ('DAROCO 16', 48.8515008, 2.2778254, 'Daroco 16, 3, Place Clément Ader', null, null, array['resto']::text[], '{}'::text[], null, false, false, null),
  ('Eunoé', 48.8608257, 2.3789798, 'Eunoé, 6, Rue Rochebrune', 'Restaurant', 'Petit gastro proche du travail à tester', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Le Bar Chaumont', 48.866209, 2.344963, 'Le Bar Chaumont, 18, Rue Bachaumont', 'Bar à cocktails', 'A tester', array['apéro']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Le 404', 48.8588897, 2.320041, 'Paris, Île-de-France, France métropolitaine', 'Marocaine', 'A tester', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Suan Thaï', 48.8619943, 2.3640317, 'Suan Thai, Rue de Bretagne, Quartier des Enfants-Rouges', 'Thaï', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Sushi-B', 48.8677062, 2.337428, 'Sushi B, Rue Rameau, Quartier Vivienne', 'Sushis', null, array['resto']::text[], '{}'::text[], 'soleil', false, false, null),
  ('Ebis', 48.8653963, 2.3321572, 'Ebis, Rue Saint-Roch, Quartier Vendôme', 'Fusion asiatique', 'Super resto a tester', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Chimère', 48.8698899, 2.3355082, 'Chimère, 22, Rue du Quatre Septembre', 'Restaurant', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('L''Auberge Café', 48.8582612, 2.3447141, 'L''Auberge Café, Rue Saint-Germain l''Auxerrois, Quartier Saint-Germain-l''Auxerrois', null, null, array['resto']::text[], '{}'::text[], null, false, false, null),
  ('Brique Machine - Paris 2', 48.8709276, 2.3427137, 'Brique Machine - Brique House, 161, Rue Montmartre', 'Buffet', 'Grand resto pr match', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('JJAN! 짠', 48.8757857, 2.3276025, 'Jjan !, Rue Saint-Lazare, Quartier Saint-Georges', 'Coréenne', 'Coréen proche de st laz/ plat fromage poulet pr 2- gino-', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Dar Mima', 48.8489962, 2.3573756, 'Dar Mima - Zyriab, 1, Rue des Fossés Saint-Bernard', 'Moyenne-orientale', 'Resto rooftop Marocain - vu a l Aeroport', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Atelier du veau', 48.8676812, 2.3326549, 'Atelier Du Veau, Rue Danielle Casanova, Quartier Vendôme', null, 'Kébab gastro', array['resto']::text[], '{}'::text[], null, false, false, null),
  ('Loup', 48.8639344, 2.342597, 'Loup, 44, Rue du Louvre', 'Française', 'Loup', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Le Grand Colbert', 48.8664844, 2.3389311, 'Le Grand Colbert, Rue Vivienne, Quartier Vivienne', 'Brasserie', 'Grand Colbert', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Kodawari Ramen (Tsukiji)', 48.8643846, 2.3362784, 'Kodawari Ramen (Tsukiji), 12, Rue de Richelieu', 'Ramen', 'Décor de marche aux poissons??', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Le Général', 48.8662657, 2.366892, 'Le Général, Rue Rampon, Quartier de la Folie-Méricourt', 'Restaurant', 'Reco Uber', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Pendino', 48.8639457, 2.3345528, 'Pendino, Rue de l''Échelle, Quartier du Palais Royal', 'Italienne', 'Pizza bonne deux de bois', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Kodawari Ramen (Yokochō)', 48.8546284, 2.3381142, 'Kodawari Ramen (Yokochō), 29, Rue Mazarine', 'Ramen', 'Décor de marche aux poissons??', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Café Blanc', 48.8627417, 2.3395806, 'Café Blanc, 12, Rue Croix des Petits Champs', 'Française', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Brasserie Dubillot', 48.868095, 2.3519457, 'Brasserie Dubillot, 222, Rue Saint-Denis', 'Française', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('La Mezcaleria Paris', 48.8638472, 2.3656384, 'La Mezcaleria Paris, Rue de Saintonge, Quartier des Enfants-Rouges', 'Bar', null, array['apéro']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Moonshiner', 48.8556625, 2.3711461, 'Moonshiner, Rue Sedaine, Quartier de la Roquette', 'Bar à cocktails', null, array['apéro']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Le 1905', 48.8588897, 2.320041, 'Paris, Île-de-France, France métropolitaine', 'Bar à cocktails', null, array['apéro']::text[], '{}'::text[], 'pluie', false, false, null),
  ('LA JAJA', 48.8660564, 2.3440191, 'La Jaja, 56, Rue d''Argout', 'Bar', null, array['apéro']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Griffon', 48.8596119, 2.3572985, 'Griffon, 55 bis, Rue des Francs Bourgeois', 'Restaurant', 'Proche Félix', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Les 4 soupes', 48.8264183, 2.3594835, 'Song Huong, Avenue de Choisy, Quartier de la Maison-Blanche', null, null, array['resto']::text[], '{}'::text[], null, false, false, null),
  ('Baan Issan', 48.833747, 2.3546338, 'Baan Issan, Rue Véronèse, Quartier de la Salpêtrière', 'Thaï', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Le Village', 48.8501678, 2.2864502, 'Le Village, 34-40, Rue Emeriau', 'Restaurant', 'To test', array['resto']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Cheper', 48.8592147, 2.3578986, 'Chéper, Rue des Francs Bourgeois, Quartier Saint-Gervais', null, 'A tester!!', array['resto']::text[], '{}'::text[], null, false, false, null),
  ('Fabula', 48.8506326, 2.3732696, 'Fabula, Rue de Charenton, Quartier des Quinze-Vingts', 'Restaurant', 'A tester, dans le musée Carnavalet', array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Clark Hot Dog', 48.8557065, 2.3604385, 'Clark hot dog and coffee, Rue du Roi de Sicile, Quartier Saint-Gervais', 'Stand de hot-dog', 'Hot dogs Marais', array['resto']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Le Petit Dakar', 48.8580531, 2.361319, 'Le Petit Dakar, 6, Rue Elzévir', 'Spécialités d''Afrique de l''Ouest', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Miznon Paris', 48.872949, 2.3426102, 'Miznon, Rue de la Grange Batelière, Quartier du Faubourg-Montmartre', 'Méditerranéenne', null, array['resto']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Café des Arts et Métiers', 48.8648026, 2.355226, 'Le Puy des Arts, 103, Rue Beaubourg', 'Restaurant', null, array['resto']::text[], '{}'::text[], 'pluie', false, false, null),
  ('doublevie', 48.8864163, 2.3479153, 'doublevie, 2, Rue Poulet', 'Restaurant', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Harry''s Bar Paris', 48.8692089, 2.3321714, 'Harry''s Bar, Rue Daunou, Quartier Gaillon', 'Bar à cocktails', null, array['apéro']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Bistrot Victoires', 48.865508, 2.3403568, 'Bistrot Victoires, Rue Catinat, Quartier du Palais Royal', 'Bistro', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Balou Paris 3', 48.8630437, 2.3518446, 'Balou Paris 3, 11, Rue aux Ours', 'Bar à tapas', null, array['apéro']::text[], '{}'::text[], 'pluie', false, false, null),
  ('The Highlander Pub', 48.856041, 2.3398038, 'The Highlander, 6, Rue de Nevers', 'Pub', null, array['apéro']::text[], '{}'::text[], 'pluie', false, false, null),
  ('Maison Lautrec', 48.8811814, 2.3359631, 'La Maison Lautrec, Rue Jean-Baptiste Pigalle, Quartier Saint-Georges', 'Française', null, array['resto']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Bar Hemingway', 48.8687856, 2.3275106, 'Bar Hemingway, Rue Cambon, Quartier Vendôme', 'Bar', null, array['apéro']::text[], '{}'::text[], 'nuageux', false, false, null),
  ('Le Tout-Paris', 48.859121, 2.342073, '8 Quai du Louvre, 75001 Paris', 'palace du Cheval Blanc avec terrasse et vue Seine / Pont-Neuf.', null, array['resto','gastro','apéro']::text[], array['duo','pro']::text[], 'soleil', true, false, null),
  ('ROOF Paris', 48.864884, 2.344227, '43 Rue Étienne Marcel, 75001 Paris', 'grand rooftop végétalisé de Madame Rêve, central, beau panorama et ambiance mode.', null, array['alloco','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', true, false, null),
  ('Sequoia Rooftop Bar', 48.868548, 2.31829, '27-29 Bd des Capucines, 75002 Paris', 'rooftop chic du Kimpton St Honoré, vue centrale, ambiance premium et cocktails.', null, array['alloco','incognito','apéro']::text[], array['duo','pro']::text[], 'nuageux', true, false, null),
  ('The Shed', 48.869973, 2.334171, '17 Bd Poissonnière, 75002 Paris', 'rooftop discret de l''Hotel des Grands Boulevards, petit, cosy et plus cache que panoramique.', null, array['tranquilo','alloco','incognito','apéro']::text[], array['solo','duo','pro']::text[], 'nuageux', true, false, null),
  ('Rooftop National', 48.863537, 2.347753, '243 Rue Saint-Martin, 75003 Paris', 'rooftop compact et central de l''Hotel National des Arts et Metiers, vue sur les toits.', null, array['tranquilo','alloco','incognito','apéro']::text[], array['solo','duo','pro']::text[], 'nuageux', true, false, null),
  ('Bonnie', 48.849978, 2.362514, '10 Rue Agrippa d''Aubigné, 75004 Paris', 'rooftop du SO/Paris avec vue Seine, Notre-Dame, Eiffel et ambiance très chic.', null, array['alloco','resto','gastro','apéro']::text[], array['duo','potos','pro']::text[], 'soleil', true, false, null),
  ('Terraza Mikuna', 48.85781, 2.35333, '1 Rue des Archives, 75004 Paris', 'rooftop latino au BHV Marais, vegetal, festif, cocktails et cuisine sud-americaine.', null, array['alloco','resto','apéro']::text[], array['duo','potos']::text[], 'nuageux', true, false, null),
  ('Le Toit de la Tour', 48.849142, 2.354306, '15 Quai de la Tournelle, 75005 Paris', 'rooftop de la Tour d''Argent, vue Seine / Notre-Dame, champagne et cocktails.', null, array['alloco','gastro','incognito','apéro']::text[], array['duo','pro']::text[], 'soleil', true, false, null),
  ('Rooftop Bar Dame des Arts', 48.853904, 2.337882, '4 Rue Danton, 75006 Paris', 'rooftop rive gauche, vue Notre-Dame, Eiffel et toits du quartier Saint-Michel.', null, array['tranquilo','alloco','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', true, false, null),
  ('Kinugawa Rive Gauche', 48.8468342, 2.3128379, '55 Av. de Saxe, 75007 Paris', 'japonais perché au sommet de l''Hotel Sax avec rooftop et vue Eiffel.', null, array['resto','gastro','apéro']::text[], array['duo','pro']::text[], 'soleil', true, false, null),
  ('Les Ombres', 48.8611046, 2.2984734, '27 Quai Jacques Chirac, 75007 Paris', 'sur le toit du musée du Quai Branly, terrasse panoramique et vue Eiffel.', null, array['resto','gastro','apéro']::text[], array['duo','pro']::text[], 'soleil', true, false, null),
  ('Terrasse du Musée d''Orsay', 48.859961, 2.326561, 'Esplanade Valéry Giscard d''Estaing, 75007 Paris', 'terrasse au-dessus de la Seine, ouverte en saison estivale, boissons et petites assiettes.', null, array['tranquilo','incognito','apéro']::text[], array['solo','duo','pro']::text[], 'nuageux', true, false, null),
  ('FUGA R', 48.8767911, 2.3090083, '28 Rue de Monceau, 75008 Paris', 'rooftop au 12e étage près du parc Monceau, déco Canaries, vue 360 et accès discret.', null, array['alloco','resto','incognito','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', true, false, null),
  ('Le Rooftop - Hotel Fouquet''s Paris', 48.8711235, 2.3011694, '46 Av. George V, 75008 Paris', 'rooftop premium du Fouquet''s, adresse Champs-Elysees / George V.', null, array['resto','gastro','incognito','apéro']::text[], array['duo','pro']::text[], 'soleil', true, false, null),
  ('Mun Paris', 48.8704259, 2.3066934, '52 Av. des Champs-Élysées, 75008 Paris', 'asiatique haut de gamme avec terrasse perchée sur les Champs-Elysees.', null, array['resto','gastro','apéro']::text[], array['duo','pro']::text[], 'soleil', true, false, null),
  ('PLEY Rooftop', 48.8756206, 2.3039644, '216 Rue du Faubourg Saint-Honoré, 75008 Paris', 'rooftop d''hôtel avec aperitivo, cocktails et ambiance afterwork.', null, array['alloco','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'pluie', true, false, null),
  ('Balcon Paris - Galeries Lafayette', 48.873409, 2.328004, '25 Rue de la Chaussée d''Antin, 75009 Paris', 'rooftop très touristique des Galeries Lafayette, vue Opera et toits de Paris.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', true, false, null),
  ('Maggie Rooftop', 48.882163, 2.339618, '55 Bd Marguerite de Rochechouart, 75009 Paris', 'rooftop de l''Hotel Rochechouart, vue Sacré-Coeur, Pigalle chic et coucher de soleil.', null, array['alloco','resto','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', true, false, null),
  ('Perruche', 48.872906, 2.322927, 'Printemps de l''Homme, 2 Rue du Havre, 9e étage, 75009 Paris', 'grand rooftop du Printemps, vue Opera, Eiffel et toits de Paris, ambiance solaire.', null, array['alloco','resto','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', true, false, null),
  ('Khayma Rooftop', 48.878349, 2.362068, '9-11 Place du Colonel Fabien, 75010 Paris', 'rooftop jeune et accessible du Generator, vue Sacré-Coeur, idéal apéro simple.', null, array['tranquilo','alloco','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', true, false, null),
  ('Le Perchoir Ménilmontant', 48.863454, 2.372165, '14 Rue Camille Crespin du Gast, 75011 Paris', 'classique rooftop de l''Est parisien, ambiance branchée et festive.', null, array['alloco','resto','apéro']::text[], array['duo','potos']::text[], 'nuageux', true, false, null),
  ('Laho Rooftop', 48.843539, 2.368916, '5-9 Rue Van Gogh, 75012 Paris', 'rooftop à 60 m près de Gare de Lyon, vue très dégagée, DJ et événements.', null, array['alloco','resto','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', true, false, null),
  ('TOO TacTac Skybar', 48.825739, 2.374621, '65 Rue Bruneseau, 75013 Paris', 'skybar très haut du TOO Hotel, vue Seine, Eiffel et monuments, privatisable.', null, array['alloco','resto','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', true, false, null),
  ('Skybar Paris Rooftop', 48.83881, 2.296433, '19 Rue du Commandant René Mouchotte, 75014 Paris', 'du Pullman Montparnasse au 32e étage, panorama spectaculaire et ambiance lounge.', null, array['alloco','incognito','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', true, false, null),
  ('ILVOLO Bar Rooftop', 48.840341, 2.296442, '257 Rue de Vaugirard, 7e étage, 75015 Paris', 'rooftop italien du Novotel Vaugirard, bon afterwork avec vue Tour Eiffel.', null, array['alloco','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'pluie', true, false, null),
  ('Villa M Rooftop', 48.8423509, 2.3124414, '24-30 Bd Pasteur, 75015 Paris', 'rooftop végétal de Villa M, vue Eiffel, Montparnasse et Invalides, cadre confidentiel.', null, array['tranquilo','resto','incognito','apéro']::text[], array['solo','duo','pro']::text[], 'nuageux', true, false, null),
  ('Auteuil Brasserie', 48.848307, 2.2598214, '78 Rue d''Auteuil, 75016 Paris', 'grande brasserie végétalisée avec terrasse en hauteur, plus conviviale que skybar.', null, array['resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', true, false, null),
  ('Brach Rooftop', 48.85865, 2.27645, '1-7 Rue Jean Richepin, 75016 Paris', 'rooftop-jardin du Brach, vue Tour Eiffel, potager et ambiance hôtel design.', null, array['tranquilo','alloco','incognito','apéro']::text[], array['duo','pro']::text[], 'nuageux', true, false, null),
  ('L''Oiseau Blanc', 48.87066, 2.287961, '19 Av. Kléber, 75116 Paris', 'rooftop du Peninsula, gastronomie, vue Tour Eiffel, très premium.', null, array['resto','gastro','apéro']::text[], array['duo','pro']::text[], 'soleil', true, false, null),
  ('La Suite Girafe', 48.8628402, 2.287142, '1 Pl. du Trocadéro et du 11 Novembre, 75016 Paris', 'paris Society au Palais de Chaillot, vue Tour Eiffel, cuisine chic.', null, array['resto','gastro','apéro']::text[], array['duo','pro']::text[], 'soleil', true, false, null),
  ('Restaurant Toit Terrasse Molitor', 48.844409, 2.252352, '6 Av. de la Porte Molitor, 75016 Paris', 'rooftop de Molitor, ambiance piscine mythique, ouest parisien et beaux jours.', null, array['resto','apéro']::text[], array['duo','potos','pro']::text[], 'soleil', true, false, null),
  ('Bar a Bulles', 48.88433, 2.33376, '4 Cité Véron, 75018 Paris', 'terrasse cachée de la Machine du Moulin Rouge, bohème, culturelle et accessible.', null, array['tranquilo','alloco','incognito','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', true, false, null),
  ('Coeur Sacre', 48.8858403, 2.3415863, '5 Rue Saint-Éleuthère, 75018 Paris', 'en hauteur à Montmartre, vue Sacré-Coeur et Tour Eiffel, plutôt journée et apéro.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', true, false, null),
  ('Station M by Maison Montmartre', 48.9004416, 2.3358099, '32 Av. de la Porte de Montmartre, 75018 Paris', 'rooftop d''hôtel au nord de Montmartre, bon pour brunch, apéro et groupe calme.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', true, false, null),
  ('Terrass'''' Rooftop Bar', 48.885675, 2.328959, '12 Rue Joseph de Maistre, 75018 Paris', 'rooftop de Montmartre avec vue Eiffel et Paris, classique pour coucher de soleil.', null, array['tranquilo','alloco','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', true, false, null),
  ('Le Toit de La Bellevilloise', 48.872182, 2.386794, '19-21 Rue Boyer, 75020 Paris', 'rooftop populaire et culturel de Belleville/Ménilmontant, bon pour potes et apéro.', null, array['tranquilo','alloco','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', true, false, null),
  ('Mama Shelter Paris East Rooftop', 48.858705, 2.390287, '109 Rue de Bagnolet, 75020 Paris', 'rooftop détendu avec esprit groupe, babyfoot/ping-pong selon saison, pas le plus panoramique.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', true, false, null),
  ('Skyline Paris Lounge & Bar', 48.889372, 2.244494, 'Hotel Meliá Paris La Défense, 4 Espl. du Général de Gaulle, 92400 Courbevoie', 'rooftop Grand Paris à La Défense, vue skyline et Paris, utile si tu inclus petite couronne.', null, array['tranquilo','alloco','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', true, false, null),
  ('Little Red Door', 48.8636541, 2.3635309, '60 Rue Charlot, 75003 Paris', 'caché iconique du Marais, signature cocktails, ambiance confidentielle.', null, array['incognito','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', false, false, null),
  ('Candelaria', 48.8629844, 2.3639861, '52 Rue de Saintonge, 75003 Paris', 'taqueria mexicaine avec bar caché derrière, parfait incognito + tacos.', null, array['alloco','incognito','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Lavomatic', 48.8684268, 2.3618035, '30 Rue René Boulanger, 75010 Paris', 'caché derrière une laverie, très concept, bon tag incognito.', null, array['incognito','apéro']::text[], array['duo','potos']::text[], 'pluie', false, false, null),
  ('L''Epicier', 48.8672861, 2.3599971, '24 Rue Notre Dame de Nazareth, 75003 Paris', 'entrée façon épicerie de quartier, bar caché compact et très app-friendly.', null, array['incognito','apéro']::text[], array['duo','potos']::text[], 'pluie', false, false, null),
  ('No Entry', 48.8818957, 2.3345641, '20 bis Rue de Douai, 75009 Paris', 'caché sous Pink Mamma, entrée discrète, bon spot duo/potos.', null, array['incognito','apéro']::text[], array['duo','potos']::text[], 'pluie', false, false, null),
  ('Experimental Cocktail Club', 48.8660758, 2.3482192, '37 Rue Saint-Sauveur, 75002 Paris', 'institution cocktail parisienne, ouvert tard le week-end.', null, array['apéro']::text[], array['duo','potos','pro']::text[], 'pluie', false, false, null),
  ('Danico', 48.8671196, 2.3392939, '6 Rue Vivienne, 75002 Paris', 'cocktail bar reconnu dans la Galerie Vivienne, bon pour date ou pro cool.', null, array['apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', false, false, null),
  ('The Cambridge Public House', 48.8614298, 2.3641614, '8 Rue de Poitou, 75003 Paris', 'cocktail pub du Marais, classé par 50 Best, plus chaleureux que guindé.', null, array['apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, null),
  ('Bar Nouveau', 48.8615403, 2.3575655, '5 Rue des Haudriettes, 75003 Paris', 'petit bar cocktail art nouveau, intime, très bon pour duo.', null, array['apéro']::text[], array['solo','duo','pro']::text[], 'pluie', false, false, null),
  ('Fréquence', 48.8548031, 2.375927, '20 Rue Keller, 75011 Paris', 'cocktails + sélection musicale/vinyle, bon apéro tardif sans être une boîte.', null, array['apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Combat', 48.8734048, 2.3822311, '63 Rue de Belleville, 75019 Paris', 'cocktail reconnu côté Belleville, ambiance cool et moins bling.', null, array['apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Bisou.', 48.864082, 2.3658884, '15 Bd du Temple, 75003 Paris', 'sans carte fixe, cocktails selon goûts, bon premier date pas trop formel.', null, array['apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('CopperBay', 48.8698469, 2.3571238, '5 Rue Bouchardon, 75010 Paris', 'cocktail bar reconnu, ambiance bord de mer chic mais détendue.', null, array['apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Sister Midnight', 48.8814639, 2.3407486, '4 Rue Viollet-le-Duc, 75009 Paris', 'petit cocktail bar intime, bien pour duo / premier verre.', null, array['apéro']::text[], array['solo','duo']::text[], 'pluie', false, false, null),
  ('Harry''s New York Bar', 48.8692491, 2.3321281, '5 Rue Daunou, 75002 Paris', 'institution historique des cocktails à Paris, classique et central.', null, array['apéro']::text[], array['solo','duo','potos','pro']::text[], 'pluie', false, false, null),
  ('Serpent a Plume', 48.8561156, 2.3668233, '24 Pl. des Vosges, 75003 Paris', 'place des Vosges, hybride bar-restaurant, plus sélective et nocturne.', null, array['resto','incognito','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', false, false, null),
  ('Rex Club', 48.8705976, 2.3472734, '5 Bd Poissonnière, 75002 Paris', 'institution techno/house parisienne, recommandée pour vraie sortie club.', null, '{}'::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Djoon Club', 48.83665, 2.3716268, '22 Bd Vincent Auriol, 75013 Paris', 'club reconnu pour house, soulful et disco; vraie piste, pas simple bar.', null, '{}'::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Badaboum', 48.8536135, 2.3756573, '2 bis Rue des Taillandiers, 75011 Paris', 'salle Bastille fiable pour concerts, DJ sets et clubbing.', null, '{}'::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('La Machine du Moulin Rouge', 48.8841152, 2.3321741, '90 Bd de Clichy, 75018 Paris', 'grosse salle reconnue Pigalle, programmation club/concert.', null, '{}'::text[], array['duo','potos']::text[], 'nuageux', false, false, null),
  ('La Java', 48.8710123, 2.3738915, '105 Rue du Faubourg du Temple, 75010 Paris', 'club historique de Belleville, programmation électronique/queer/alternative.', null, '{}'::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('T7 Paris', 48.8273067, 2.2928334, 'Pl. des Insurgés de Varsovie, 75015 Paris', 'grand club en hauteur Porte de Versailles, programmation DJ/électronique.', null, '{}'::text[], array['duo','potos']::text[], 'nuageux', false, false, null),
  ('Virage Paris', 48.9004188, 2.3220984, '26 Rue Hélène et François Missoffe, 75017 Paris', 'club/open-air aux portes de Paris, plutôt saison et programmation électronique.', null, '{}'::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Cabaret Sauvage', 48.8955745, 2.3934188, '59 Bd Macdonald, 75019 Paris', 'reconnu de la Villette, concerts et soirées club.', null, '{}'::text[], array['duo','potos']::text[], 'nuageux', false, false, null),
  ('La Gare - Le Gore', 48.8949221, 2.3821429, '1 Av. Corentin Cariou, 75019 Paris', 'jazz/live en haut, club en sous-sol; vrai lieu nocturne culturel.', null, '{}'::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Petit Bain', 48.8354259, 2.3767186, '7 Port de la Gare, 75013 Paris', 'péniche culturelle sur la Seine: concerts, bar, club et terrasse.', null, array['resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, true, null),
  ('Glazart', 48.899283, 2.3866102, '7 Av. de la Porte de la Villette, 75019 Paris', 'club/lieu live reconnu côté Villette, programmation alternative.', null, '{}'::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Nouveau Casino', 48.8658567, 2.3778299, '109 Rue Oberkampf, 75011 Paris', 'salle Oberkampf reconnue pour concerts et nuits club.', null, '{}'::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Kilometre25', 48.8959943, 2.3943382, '8 Bd Macdonald, 75019 Paris', 'open-air électronique sous le périphérique, très saisonnier.', null, '{}'::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Panic Room', 48.861244, 2.3676094, '101 Rue Amelot, 75011 Paris', 'bar-club avec sous-sol dansant; plus casual que gros club.', null, array['apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Silencio', 48.8689175, 2.3433816, '142 Rue Montmartre, 75002 Paris', 'club sélectif et culturel, utile pro/incognito mais à réserver selon event.', null, array['incognito']::text[], array['duo','pro']::text[], 'soleil', false, false, null),
  ('Rosa Bonheur sur Seine', 48.8631175, 2.3133776, '2 Port des Invalides, 75007 Paris', 'péniche conviviale près du Pont Alexandre III, apéro + danse selon soirs.', null, array['apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, true, null),
  ('Fluctuart', 48.8605021, 2.2939902, '2 Port du Gros Caillou, 75007 Paris', 'flottant gratuit dédié au street art, bar et terrasse sur Seine.', null, array['tranquilo','apéro']::text[], array['solo','duo','potos','pro']::text[], 'pluie', false, true, null),
  ('Le Mazette', 48.8432577, 2.3693705, '69 Port de la Rapée, 75012 Paris', 'barge hybride bar, resto, open-air et club; très bon pour potos.', null, array['resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, true, null),
  ('La Dame de Canton', 48.8359075, 2.3756047, '5 Port de la Gare, 75013 Paris', 'jonque chinoise amarrée, bar-resto et concerts, très identifiable.', null, array['resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, true, null),
  ('Peniche Antipode', 48.887098, 2.3751299, '55 Quai de la Seine, 75019 Paris', 'péniche du canal de l''Ourcq, plus tranquille/culturelle que club.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, true, null),
  ('Le Marcounet', 48.8534062, 2.3564823, '14 Quai de l''Hôtel de Ville, 75004 Paris', 'péniche centrale avec jazz et terrasse, bon duo/apéro.', null, array['apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, true, null),
  ('Bateau Phare', 48.8359075, 2.3756047, '3 Port de la Gare, 75013 Paris', 'péniche historique côté Bibliothèque, programmation festive.', null, array['apéro']::text[], array['duo','potos']::text[], 'nuageux', false, true, null),
  ('La Javelle', 48.8340261, 2.4040975, '5 Bd Poniatowski, 75012 Paris', 'guinguette estivale avec food, DJ sets et grande terrasse.', null, array['alloco','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Rosa Bonheur Buttes Chaumont', 48.8799811, 2.3862299, '2 Av. de la Cascade, 75019 Paris', 'guinguette emblématique dans les Buttes-Chaumont, apéro/potos.', null, array['tranquilo','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Pavillon Puebla', 48.8772891, 2.379077, 'Av. Darcel, 75019 Paris', 'grande terrasse dans le parc des Buttes-Chaumont, apéro/potos.', null, array['apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('La REcyclerie', 48.8976218, 2.3440598, '83 Bd Ornano, 75018 Paris', 'tiers-lieu éco-responsable avec terrasse et ferme urbaine, bon solo/potos.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Ground Control', 48.8433293, 2.3811637, '81 Rue du Charolais, 75012 Paris', 'grand lieu hybride food, bar, events; très bien potos et solo safe.', null, array['alloco','apéro']::text[], array['solo','duo','potos','pro']::text[], 'pluie', false, false, null),
  ('Jardin21', 48.8964692, 2.3954621, '12a Rue Ella Fitzgerald, 75019 Paris', 'jardin-guinguette près de La Villette, terrasse, events et DJ sets.', null, array['tranquilo','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Le Pavillon des Canaux', 48.8874305, 2.3786909, '39 Quai de la Loire, 75019 Paris', 'maison-bar colorée au bord du canal, bon duo/tranquillo.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, true, null),
  ('La Cite Fertile', 48.8984672, 2.3983699, '14 Av. Edouard Vaillant, 93500 Pantin', 'grand tiers-lieu à Pantin, ambiance guinguette/extérieur, petite couronne.', null, array['tranquilo','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('La Prairie du Canal', 48.8985048, 2.4413639, '55 Rue de Paris, 93000 Bobigny', 'guinguette/ferme urbaine de petite couronne, très saison et week-end.', null, array['tranquilo','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Urfa Durum', 48.8724069, 2.3542518, '58 Rue du Faubourg Saint-Denis, 75010 Paris', 'durüm culte, rapide, parfait solo ou petit budget.', null, array['tranquilo','alloco']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('L''As du Fallafel', 48.8574095, 2.3590493, '34 Rue des Rosiers, 75004 Paris', 'falafel iconique du Marais, rapide, budget pluie.', null, array['tranquilo','alloco']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Chez Alain Miam Miam', 48.8622747, 2.3619516, '26 Rue Charlot, 75003 Paris', 'sandwich généreux du Marché des Enfants Rouges, très solo.', null, array['tranquilo','alloco']::text[], array['solo','duo']::text[], 'pluie', false, false, null),
  ('Miznon', 48.8571596, 2.3589213, '22 Rue des Ecouffes, 75004 Paris', 'pitas méditerranéennes, simple, efficace, bon solo/potos.', null, array['tranquilo','alloco']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('El Nopal', 48.877844, 2.3651419, '3 Rue Eugene Varlin, 75010 Paris', 'tacos mexicains directs et abordables, parfait rotation allocco.', null, array['tranquilo','alloco']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Taco Mesa', 48.8736232, 2.3480462, '40 Rue du Faubourg Poissonniere, 75010 Paris', 'tacos bien notés, plus confort que pur comptoir.', null, array['alloco']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Petit Bao', 48.8567411, 2.3720813, '10 Rue Breguet, 75011 Paris', 'bao et dim sum, pratique solo ou potos.', null, array['alloco','resto']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Gros Bao', 48.8714265, 2.365705, '72 Quai de Jemmapes, 75010 Paris', 'grand spot chinois canal Saint-Martin, plus potos que comptoir.', null, array['alloco','resto']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Kodawari Ramen', 48.8546421, 2.3380705, '29 Rue Mazarine, 75006 Paris', 'ramen immersif, facile seul au comptoir, gros potentiel app solo.', null, array['tranquilo','alloco','resto']::text[], array['solo','duo']::text[], 'pluie', false, false, null),
  ('Udon Jubey', 48.8664423, 2.3355536, '39 Rue Sainte-Anne, 75001 Paris', 'udon rue Sainte-Anne, très compatible manger seul.', null, array['tranquilo','alloco','resto']::text[], array['solo','duo']::text[], 'pluie', false, false, null),
  ('Kintaro', 48.8689261, 2.3348866, '24 Rue Saint-Augustin, 75002 Paris', 'japonaise populaire, rapide, idéale solo.', null, array['tranquilo','alloco','resto']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Neko Ramen', 48.8731221, 2.3421505, '6 Rue de la Grange Bateliere, 75009 Paris', 'ramen accessible, très bon usage solo/duo.', null, array['tranquilo','alloco','resto']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Hakata Choten', 48.8671314, 2.334942, '53 Rue des Petits Champs, 75001 Paris', 'ramen central, petit budget, comptoir compatible.', null, array['tranquilo','alloco','resto']::text[], array['solo','duo']::text[], 'pluie', false, false, null),
  ('TranTranZai', 48.8631582, 2.3498973, '94 Rue St Denis, 75001 Paris', 'nouilles sichuanaises, rapide, ouvert tard ven/sam.', null, array['tranquilo','alloco','resto']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Pho Banh Cuon 14', 48.826412, 2.3595345, '129 Av. de Choisy, 75013 Paris', 'pho populaire du 13e, efficace solo et petit budget.', null, array['tranquilo','alloco','resto']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Best Tofu', 48.872697, 2.3759497, '9 Bd de la Villette, 75010 Paris', 'très abordable, budget pluie fort.', null, array['tranquilo','alloco','resto']::text[], array['solo','duo']::text[], 'pluie', false, false, null),
  ('Dumbo', 48.8817097, 2.3369461, '64 Rue Jean-Baptiste Pigalle, 75009 Paris', 'smash burger populaire, rapide, bon solo/potos.', null, array['tranquilo','alloco']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Bouillon Chartier Grands Boulevards', 48.8719356, 2.3430137, '7 Rue du Faubourg Montmartre, 75009 Paris', 'classique budget pluie, service rapide, gros volume.', null, array['tranquilo','resto']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, null),
  ('Bouillon Republique', 48.8660094, 2.3646451, '39 Bd du Temple, 75003 Paris', 'bouillon moderne, très bon rapport quantité/prix.', null, array['tranquilo','resto']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Bouillon Pigalle', 48.8826186, 2.3374142, '22 Bd de Clichy, 75018 Paris', 'grand bouillon à Pigalle, pratique tard et budget maîtrisé.', null, array['tranquilo','resto']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Septime', 48.8536026, 2.3809558, '80 Rue de Charonne, 75011 Paris', 'grande table contemporaine, recommandée pour duo ou pro sérieux.', null, array['resto','gastro']::text[], array['duo','pro']::text[], 'soleil', false, false, null),
  ('Clamato', 48.8536026, 2.3809558, '80 Rue de Charonne, 75011 Paris', 'seafood bar du groupe Septime, date cool mais budget élevé.', null, array['resto','gastro','apéro']::text[], array['solo','duo','potos']::text[], 'soleil', false, false, null),
  ('Frenchie Bar a Vins', 48.8677971, 2.3479177, '6 Rue du Nil, 75002 Paris', 'à vins reconnu rue du Nil, excellent pour duo et apéro dînatoire.', null, array['resto','gastro','apéro']::text[], array['solo','duo','potos','pro']::text[], 'soleil', false, false, null),
  ('Le Mary Celeste', 48.8619727, 2.3657451, '1 Rue Commines, 75003 Paris', 'oysters, cocktails, vins; très bon premier date sans être trop formel.', null, array['resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('Bambino', 48.8613507, 2.3698338, '25 Rue Saint-Sebastien, 75011 Paris', 'resto-bar musical, ambiance date/potos avec son et vinyles.', null, array['resto','apéro']::text[], array['duo','potos']::text[], 'nuageux', false, false, null),
  ('Early June', 48.8728964, 2.3632862, '19 Rue Jean Poulmarch, 75010 Paris', 'canal Saint-Martin, vins nature et chefs invités, date food.', null, array['resto','gastro','apéro']::text[], array['solo','duo','potos']::text[], 'soleil', false, false, null),
  ('Folderol', 48.8651683, 2.3690583, '10 Rue du Grand Prieure, 75011 Paris', 'glace + vins nature, très bon solo/duo, original sans être lourd.', null, array['tranquilo','apéro']::text[], array['solo','duo']::text[], 'pluie', false, false, null),
  ('Le Fumoir', 48.8605065, 2.340843, '6 Rue de l''Amiral de Coligny, 75001 Paris', 'classique près du Louvre, bon pro/date, terrasse souvent utile.', null, array['resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, null),
  ('La Palette', 48.8554133, 2.3368241, '43 Rue de Seine, 75006 Paris', 'terrasse classique de Saint-Germain, bon duo/verre.', null, array['resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, null),
  ('Cafe de Flore', 48.8541278, 2.3325499, '172 Bd Saint-Germain, 75006 Paris', 'institution de Saint-Germain, terrasse connue, bon pro/touristique.', null, array['resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, null),
  ('Les Deux Magots', 48.8542327, 2.33321, '6 Pl. Saint-Germain des Pres, 75006 Paris', 'institution parisienne, terrasse et rendez-vous pro/duo.', null, array['resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, null),
  ('Au Pied de Cochon', 48.8634867, 2.3437202, '6 Rue Coquilliere, 75001 Paris', 'brasserie historique des Halles ouverte très tard, sécurisante pour nocturne.', null, array['resto']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, null),
  ('Le Tambour', 48.8654459, 2.3447267, '41 Rue Montmartre, 75002 Paris', 'brasserie tardive, utile après cinéma/concert quand tout ferme.', null, array['resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, null),
  ('L''Alsace', 48.8699948, 2.305834, '39 Av. des Champs-Elysees, 75008 Paris', 'brasserie Champs-Elysées ouverte tard, utile en sortie pro/touristes.', null, array['resto']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, null),
  ('Le Cinq', 48.868784, 2.3006774, '31 Av. George V, 75008 Paris', 'grande table palace, niveau client pro/très grand soleil.', null, array['resto','gastro']::text[], array['duo','pro']::text[], 'soleil', false, false, null),
  ('Epicure', 48.8716714, 2.3147666, '112 Rue du Faubourg Saint-Honore, 75008 Paris', 'grande table du Bristol, gastro très premium.', null, array['resto','gastro']::text[], array['duo','pro']::text[], 'soleil', false, false, null),
  ('Guy Savoy', 48.8564015, 2.3384956, '11 Quai de Conti, 75006 Paris', 'grande table historique à la Monnaie de Paris.', null, array['resto','gastro']::text[], array['duo','pro']::text[], 'soleil', false, false, null),
  ('Arpege', 48.855754, 2.3170135, '84 Rue de Varenne, 75007 Paris', 'table d''Alain Passard, légume et haute gastronomie.', null, array['resto','gastro']::text[], array['duo','pro']::text[], 'soleil', false, false, null),
  ('Le Clarence', 48.8674115, 2.3099361, '31 Av. Franklin Delano Roosevelt, 75008 Paris', 'grande table raffinée, très pro/occasion spéciale.', null, array['resto','gastro']::text[], array['duo','pro']::text[], 'soleil', false, false, null),
  ('Plenitude', 48.8588428, 2.3418987, '8 Quai du Louvre, 75001 Paris', 'très haut de gamme du Cheval Blanc, ultra premium.', null, array['resto','gastro']::text[], array['duo','pro']::text[], 'soleil', false, false, null),
  ('Datil', 48.8636106, 2.3573521, '13 Rue des Gravilliers, 75003 Paris', 'table contemporaine de Manon Fleury, gastro durable.', null, array['resto','gastro']::text[], array['duo','pro']::text[], 'soleil', false, false, null),
  ('Club Coca-Cola - Quai de la Photo', 48.8366207, 2.3754059, '9 Port de la Gare, 75013 Paris', 'fan zone flottante en bord de Seine, 800 places, matchs, DJ sets et animations.', null, array['alloco','apéro']::text[], array['solo','duo','potos','pro']::text[], 'pluie', false, true, 'diffuse'),
  ('La Communale Saint-Ouen', 48.9129615, 2.3297758, '10 bis Rue de l''Hippodrome, 93400 Saint-Ouen-sur-Seine', 'halle géante avec écrans géants, baby-foot XXL, animations, food court et ambiance populaire.', null, array['alloco','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Le Grand Rex - Iconic Club', 48.8705535, 2.3477496, '1 Boulevard Poissonnière, 75002 Paris', 'projection de grandes affiches sur écran géant, animations type stade, capacité env. 2500 places.', null, '{}'::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('La Felicità', 48.8333396, 2.3717968, 'Station F, 5 Parvis Alan Turing, 75013 Paris', 'food court Big Mamma avec 5 écrans dont écran géant pour grandes affiches et matchs des Bleus.', null, array['alloco','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Jardin de la Ménagerie - Sceaux', 48.7773563, 2.2955042, '70 Rue Houdan, 92330 Sceaux', 'fan zone bucolique et familiale pour les matchs de l''Équipe de France, buvette et chalets locaux.', null, array['tranquilo','alloco','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, 'diffuse'),
  ('Central Chapelle', 48.899637, 2.3613849, '4 Esplanade Alice Milliat, 75018 Paris', 'terrasse nord transformée en FIFA Fan Zone avec écrans, bière et comptoirs food.', null, array['alloco','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('La Cité Fertile', 48.8984672, 2.3983699, '14 Avenue Édouard Vaillant, 93500 Pantin', 'fan zone alternative avec écran géant sous la halle, bars, food et DJ sets.', null, array['alloco','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Atelier des Lumières - Hisense Stadium Experience', 48.8618887, 2.3811608, '38 Rue Saint-Maur, 75011 Paris', 'watch party immersive France-Sénégal avec projections 360°, cocktail et animations.', null, array['apéro']::text[], array['solo','duo','potos','pro']::text[], 'pluie', false, false, 'diffuse'),
  ('Dopo Boulogne', 48.8258398, 2.2338174, '63-64 Quai Georges Gorse, 92100 Boulogne-Billancourt', 'italien et sport bar porté par des figures d''After Foot, pour regarder les matchs avec vraie restauration.', null, array['resto','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', false, true, 'diffuse'),
  ('Sports Bar & Lounge Disney Village', 48.8656503, 2.7857084, '2 Avenue Paul Séramy, 77700 Chessy', 'sports bar immersif à Disney Village, ouvert au public, retransmissions sportives live.', null, array['tranquilo','alloco','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('Belushi''s Gare du Nord', 48.8793287, 2.358058, '5 Rue de Dunkerque, 75010 Paris', 'très gros sports bar avec 21 TVs/écrans cube, énorme capacité, tous sports et World Cup affichée.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('Belushi''s Paris Canal', 48.8885905, 2.3789635, '159 Rue de Crimée, 75019 Paris', 'canal de Belushi''s, crowd international, giant screens, every game live selon l''enseigne.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('The French Flair', 48.8840485, 2.3306436, '75 bis Boulevard de Clichy, 75009 Paris', 'qG supporters à Place de Clichy, quatre écrans, ambiance sport puis DJ le week-end.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, true, 'diffuse'),
  ('The Moose', 48.8517886, 2.3376896, '16 Rue des Quatre Vents, 75006 Paris', 'pub canadien historique, 14 écrans, poutine/burgers, réservation recommandée pour matchs.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('McBride''s Irish Pub', 48.861037, 2.3488844, '54 Rue Saint-Denis, 75001 Paris', 'pub irlandais central, vidéo-projecteur XXL, live sports, fermeture très tardive ven/sam.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, true, 'diffuse'),
  ('Rush Bar', 48.8613443, 2.3702364, '32 Rue Saint-Sébastien, 75011 Paris', 'ambiance de quartier, diffusion ligues européennes, pub fiable pour gros matchs.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('The Long Hop', 48.8504924, 2.349006, '25 Rue Frédéric Sauton, 75005 Paris', 'pub sur deux niveaux avec nombreux écrans, foot/rugby/basket, forte ambiance anglophone.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('The Bombardier', 48.8468643, 2.347702, '2 Place du Panthéon, 75005 Paris', 'pub anglais près du Panthéon, live sports sur TV HD, happy hour pintes dès 6 €.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('L''Atalante', 48.8896643, 2.3828361, '26 Quai de la Marne, 75019 Paris', 'maxi terrasse au bord de l''eau, bières craft et diffusions sportives depuis l''extérieur.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, true, 'diffuse'),
  ('La Victoire', 48.8539711, 2.3722193, '11 Rue de Lappe, 75011 Paris', 'nouveau sports bar rue de Lappe, déco sport, nombreux écrans, cuisine Afrique de l''Ouest.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('Brussels Beer Project Canal', 48.8712546, 2.3682234, '47 bis Rue Bichat, 75010 Paris', 'taproom Canal Saint-Martin, écran géant pour compétitions importantes, terrasse et 26 tireuses.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Les Cuves de Fauve', 48.8532961, 2.3791345, '64 Rue de Charonne, 75011 Paris', 'brewpub Fauve avec bières craft, assiettes de saison et diffusions de matchs.', null, array['resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Paname Brewing Company', 48.8879396, 2.3792587, '41 bis Quai de la Loire, 75019 Paris', 'brewpub sur le bassin de la Villette, grande salle indus pour voir les matchs.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, true, 'diffuse'),
  ('KIEZ Biergarten Montmartre', 48.8935629, 2.333305, '24 Rue Vauvenargues, 75018 Paris', 'biergarten allemand, salle avec écran les soirs de match, currywurst/bretzels.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Mez Beer', 48.839611, 2.3229184, '10 Rue Vandamme, 75014 Paris', 'à bières bretonnes, match projeté en salle, 15 pressions et nombreuses bouteilles.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Octopussy', 48.89355, 2.3252417, '22 Rue de la Jonquière, 75017 Paris', 'de quartier rock avec écran déroulé les jours de foot/rugby.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Team Brothers', 48.8681443, 2.3903982, '9 Rue Sorbier, 75020 Paris', 'bistrot de quartier recommandé par Time Out, grande terrasse et écran extérieur les soirs de match.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('Le Bar Fondamental - Pigalle', 48.8829622, 2.337538, '6 Rue André Antoine, 75018 Paris', 'craft avec grand écran en cas de match, ambiance débordante dans la rue de Pigalle.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Le Nouvel Institut', 48.8492582, 2.3555969, '1 Boulevard Saint-Germain, 75005 Paris', 'brasserie bon marché, terrasse, matchs et billard; très bon tag pluie.', null, array['tranquilo','alloco','resto','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, false, 'diffuse'),
  ('Hurling Pub', 48.8471401, 2.3485991, '8 Rue Descartes, 75005 Paris', 'irish pub du 5e, live sports et ambiance festive.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('The Green Goose', 48.8503634, 2.3905811, '19 Rue des Boulets, 75011 Paris', 'irish pub convivial avec craft beers/tapas, diffuse ponctuellement les matchs.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Patrick''s - Le Ballon Vert', 48.8505069, 2.3861359, '33 Rue de Montreuil, 75011 Paris', 'irish pub spacieux, QG sports les jours de match; une source bière est contradictoire donc vérifier avant gros match.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('The Blossom Arms', 48.891735, 2.3210782, '17 Rue Guy Môquet, 75017 Paris', 'pub britannique récent et très bien noté, Guinness, seafood pub; diffusion à confirmer match par match.', null, array['alloco','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('The Great Canadian Pub', 48.8542651, 2.3429193, '25 Quai des Grands Augustins, 75006 Paris', 'pub canadien central sur la Seine, bon pour match entre potes et ambiance expat.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, true, 'diffuse'),
  ('The Bowler', 48.8729931, 2.3075478, '13 Rue d''Artois, 75008 Paris', 'pub anglais avec grands écrans, fléchettes, burgers, bien situé Champs-Élysées.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('Pub Saint-Hilaire', 48.8480448, 2.3467365, '2 Rue Valette, 75005 Paris', 'pub du Quartier latin, sports bar classique, bon pour petit budget et nocturne ponctuel.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('Galway Irish Pub', 48.8539398, 2.343583, '13 Quai des Grands Augustins, 75006 Paris', 'irish pub face Seine/Notre-Dame, jusqu''à 9 écrans selon LiberoGuide, fermeture tardive certains soirs.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, true, 'diffuse'),
  ('The Auld Alliance', 48.8556903, 2.3570526, '80 Rue François Miron, 75004 Paris', 'pub écossais central, live sports et ambiance expat; bon pour nations UK/Scotland.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('The Frog & Princess', 48.8522786, 2.3345451, '9 Rue Princesse, 75006 Paris', 'frogPubs rive gauche, live sport, craft beer, burgers et ambiance pub anglais.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Frog Hop House', 48.8688361, 2.3296197, '10 Rue des Capucines, 75002 Paris', 'frogPubs Opéra, live sport et craft beer, plus central/pro que d''autres pubs.', null, array['alloco','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Frog XVI', 48.8646631, 2.2881416, '110 bis Avenue Kléber, 75016 Paris', 'frogPubs Trocadéro, sports bar élégant et spacieux; bon pour groupes/pro informel.', null, array['alloco','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('The Frog & Rosbif', 48.8644098, 2.3502403, '116 Rue Saint-Denis, 75002 Paris', 'premier brewpub Frog, live sports dont football, Premier League et grands matchs.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('The Pub', 48.8550361, 2.362647, '4 Rue Caron, 75004 Paris', 'petit pub très bien noté, connu des amateurs de foot; réserver ou venir tôt.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('The Harp Bar', 48.8845473, 2.3303214, '118 Boulevard de Clichy, 75018 Paris', 'petit pub sport à Clichy/Blanche, très bon mais capacité limitée; venir tôt.', null, array['tranquilo','resto','apéro']::text[], array['duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('Lush Bar', 48.8851646, 2.3252609, '16 Rue des Dames, 75017 Paris', 'pub sportif historique côté Liverpool, petit format, fléchettes et ambiance expat.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('The Hideout Paris Gare du Nord', 48.8793095, 2.3546327, '8 Boulevard de Denain, 75010 Paris', 'pub près de Gare du Nord, live sports, happy hour; utile pour matchs tardifs.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('The Coq & Bulldog', 48.8817015, 2.328359, '64 Rue de Clichy, 75009 Paris', 'pub anglo-français, football passion, petite capacité; horaires 17h-2h.', null, array['tranquilo','resto','apéro']::text[], array['duo','potos']::text[], 'nuageux', false, false, 'diffuse'),
  ('O''Sullivans Franklin D. Roosevelt', 48.87186, 2.309885, '63 Avenue Franklin Delano Roosevelt, 75008 Paris', 'grand pub irlandais proche Champs-Élysées, sports bar et club jusqu''à très tard.', null, array['tranquilo','resto','apéro']::text[], array['duo','potos']::text[], 'nuageux', false, true, 'diffuse'),
  ('Corcoran''s Grands Boulevards', 48.8711768, 2.3439919, '23 Boulevard Poissonnière, 75002 Paris', 'grand pub irlandais, horaires très tardifs, utile pour matchs de nuit.', null, array['tranquilo','resto','apéro']::text[], array['duo','potos']::text[], 'nuageux', false, true, 'diffuse'),
  ('Corcoran''s Sacré-Cœur', 48.885236, 2.3424195, '9-11 Rue Foyatier, 75018 Paris', 'pub irlandais à Montmartre, sports bar, live music/night club et horaires tardifs.', null, array['tranquilo','resto','apéro']::text[], array['duo','potos']::text[], 'nuageux', false, true, 'diffuse'),
  ('Stany''s', 48.8723059, 2.3492103, '40 Rue d''Enghien, 75010 Paris', 'bien noté et référencé pour premier match des Bleus; confirmation match par match nécessaire.', null, array['resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, false, 'diffuse'),
  ('Quai de la Photo', 48.8366207, 2.3754059, '9 Port de la Gare, 75013 Paris', 'centre photo flottant avec terrasse sur Seine, bar, expos et gros potentiel apéro au bord de l’eau.', null, array['tranquilo','alloco','apéro']::text[], array['solo','duo','potos','pro']::text[], 'pluie', false, true, null),
  ('Le Bateau Phare', 48.8359075, 2.3756047, '3 Port de la Gare, 75013 Paris', 'ancien Batofar devenu bateau festif : tapas, cocktails, concerts, clubbing.', null, array['alloco','apéro']::text[], array['duo','potos']::text[], 'pluie', false, true, null),
  ('Nix Nox', 48.8359075, 2.3756047, '6 Port de la Gare, 75013 Paris', 'péniche polyvalente pour événements, soirées et restaurant, à vérifier selon programmation.', null, array['alloco','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', false, true, null),
  ('Bateau El Alamein', 48.8343257, 2.3779952, '10 Port de la Gare, 75013 Paris', 'petite péniche historique côté BnF, concerts intimistes et ambiance alternative.', null, array['tranquilo','alloco','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, true, null),
  ('Péniche Antipode', 48.887098, 2.3751299, '55 Quai de la Seine, 75019 Paris', 'péniche du Bassin de la Villette : café-resto, spectacles, théâtre et ambiance familiale/associative.', null, array['tranquilo','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, true, null),
  ('Les Nautes', 48.8516911, 2.3617127, '1 Quai des Célestins, 75004 Paris', 'au bord de Seine avec terrasse, concerts et ambiance très apéro de quai.', null, array['tranquilo','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, true, null),
  ('Le Son de la Terre', 48.851774, 2.3500794, '2 Port de Montebello, 75005 Paris', 'péniche face à Notre-Dame avec jazz club, restaurant et cocktails ; bon plan duo/pro.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, true, null),
  ('Nanna', 48.851774, 2.3500794, 'Port de Montebello, 75005 Paris', 'péniche-librairie/bar au pied de Notre-Dame, calme, littéraire, très bon tag solo/duo.', null, array['tranquilo','incognito','apéro']::text[], array['solo','duo','pro']::text[], 'pluie', false, true, null),
  ('La Nouvelle Seine', 48.851774, 2.3500794, 'Port de Montebello, 75005 Paris', 'péniche face à Notre-Dame avec restaurant, terrasse-bar et spectacles/comedy club.', null, array['resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'soleil', false, true, null),
  ('Riviera Fuga', 48.8631827, 2.3120324, '10 Port des Invalides, 75007 Paris', 'flottant design sur Seine, cuisine italienne-japonaise, très date/pro.', null, array['resto','gastro','apéro']::text[], array['duo','potos','pro']::text[], 'soleil', false, true, null),
  ('Sena', 48.8467395, 2.3653879, '7 Voie Georges Pompidou, 75004 Paris', 'spot italien/festif avec grande terrasse au bord de Seine, pizza, spritz, pop-up.', null, array['alloco','resto','apéro']::text[], array['duo','potos']::text[], 'nuageux', false, true, null),
  ('Flow Paris', 48.8631175, 2.3133776, '4 Port des Invalides, 75007 Paris', 'péniche/quai Paris Society avec terrasse, rooftop, club et horaires tardifs.', null, array['alloco','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', false, true, null),
  ('Noti Plage', 48.8570687, 2.2896806, '6 Port de Suffren, 75015 Paris', 'terrasse plage face à la Tour Eiffel : sable, cocktails, tapas, DJ sets jusqu’à 2h.', null, array['alloco','apéro']::text[], array['duo','potos']::text[], 'nuageux', false, true, null),
  ('Bonnotte Club', 48.8571937, 2.2897384, 'Port de Suffren, 75007 Paris', 'nouveau spot 400 m² entre bateau et guinguette, vue Eiffel, drinks et street-food abordables.', null, array['tranquilo','alloco','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, true, null),
  ('Bal de la Marine', 48.8571937, 2.2897384, 'Port de Suffren, 75007 Paris', 'terrasse festive à Port de Suffren, cocktails, food, dancefloor et vue Eiffel.', null, array['alloco','apéro']::text[], array['duo','potos']::text[], 'nuageux', false, true, null),
  ('Annette K', 48.842883, 2.2729411, 'Port de Javel Bas, 75015 Paris', 'péniche Javel orientée sport, musique live, DJ sets et grands temps forts saisonniers.', null, array['alloco','apéro']::text[], array['duo','potos']::text[], 'pluie', false, true, null),
  ('Quai Liberté', 48.8480445, 2.2790579, 'Port de Javel Haut, 75015 Paris', 'péniche-restaurant solidaire et événementielle, bonne option groupe/pro au bord de l’eau.', null, array['tranquilo','resto','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, true, null),
  ('La Plage Parisienne', 48.8480445, 2.2790579, 'Port de Javel Haut, 75015 Paris', 'grande terrasse/restaurant au bord de Seine, ambiance vacances et vue Statue de la Liberté.', null, array['resto','apéro']::text[], array['duo','potos','pro']::text[], 'soleil', false, true, null),
  ('Le Calife', 48.8587912, 2.3330869, 'Port des Saints-Pères, 75006 Paris', 'bateau restaurant haut de gamme, ambiance romantique et croisière élégante sur Seine.', null, array['resto','gastro']::text[], array['duo','pro']::text[], 'soleil', false, true, null),
  ('Ducasse sur Seine', 48.8621538, 2.2937134, '19 Port Debilly, 75116 Paris', 'bateau électrique gastronomique signé Ducasse, très premium/pro/date.', null, array['resto','gastro']::text[], array['duo','pro']::text[], 'soleil', false, true, null),
  ('Bateaux Parisiens', 48.8605021, 2.2939902, 'Port de la Bourdonnais, 75007 Paris', 'croisières depuis la Tour Eiffel, déjeuner/dîner et promenade touristique.', null, array['tranquilo','resto']::text[], array['solo','duo','potos','pro']::text[], 'soleil', false, true, null),
  ('Eiffel Croisières - Péniche Ivoire', 48.8630339, 2.3138871, 'Pont Alexandre III, Port des Invalides rive gauche, 75007 Paris', 'croisière bistronomique sur la Péniche Ivoire, départ Pont Alexandre III.', null, array['resto']::text[], array['duo','potos','pro']::text[], 'soleil', false, true, null),
  ('L’Instant sur Seine - 16e', 48.863549, 2.2980672, '2 Port Debilly, 75016 Paris', 'terrasse éphémère face à la Tour Eiffel : cocktails, vins, planches, 16h-minuit.', null, array['tranquilo','apéro']::text[], array['solo','duo','potos','pro']::text[], 'nuageux', false, true, null),
  ('PLAT/FORM', 48.8359075, 2.3756047, '14 Port de la Gare, 75013 Paris', 'terrasse festive au pied de la BnF : bistro, barbecue week-end, DJ sets et bord de Seine.', null, array['alloco','resto','apéro']::text[], array['duo','potos']::text[], 'nuageux', false, true, null),
  ('River’s King', 48.8470316, 2.3606848, '4 Quai Saint-Bernard, 75005 Paris', 'bateau événementiel sur Seine, plutôt privatisation / soirées / groupes.', null, array['alloco','apéro']::text[], array['potos','pro']::text[], 'nuageux', false, true, null),
  ('Yachts de Paris', 48.8481828, 2.3629664, 'Port Henri IV, 75004 Paris', 'offre premium de yachts et salons flottants, plutôt pro/privatisation que sortie spontanée.', null, array['resto','gastro']::text[], array['pro']::text[], 'soleil', false, true, null),
  ('Polpo Plage / Polpo Brasserie', 48.9002099, 2.2806642, '47 Quai Charles Pasqua, 92300 Levallois-Perret', 'grande brasserie en bord de Seine avec terrasse plage, bar et balades en bateaux électriques en saison.', null, array['tranquilo','resto','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', false, true, null),
  ('Brasserie Aqua', 48.8607928, 2.2240477, '5 Quai Marcel Dassault, 92150 Suresnes', 'italien chic sur péniche avec grande terrasse et vue Seine/Suresnes.', null, array['tranquilo','resto','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', false, true, null),
  ('River Café', 48.8295019, 2.2603684, '146 Quai de Stalingrad, 92130 Issy-les-Moulineaux', 'péniche/terrasse en bord de Seine, classique pour déjeuner/dîner au calme.', null, array['tranquilo','resto','apéro']::text[], array['duo','potos','pro']::text[], 'soleil', false, true, null),
  ('Maison Jaune', 48.8282279, 2.2544859, '52 Quai du Point du Jour, 92100 Boulogne-Billancourt', 'péniche-restaurant à Boulogne, guinguette élégante et terrasse sur Seine.', null, array['tranquilo','resto','apéro']::text[], array['duo','potos','pro']::text[], 'soleil', false, true, null),
  ('Rosa Bonheur à l’Ouest', 48.9051727, 2.2886763, '20 Quai du Docteur Dervaux, 92600 Asnières-sur-Seine', 'version ouest de Rosa Bonheur : péniche bucolique et festive en bord de Seine.', null, array['alloco','apéro']::text[], array['duo','potos']::text[], 'nuageux', false, true, null),
  ('La Javelle Tavern', 48.8292524, 2.3903944, '5 Boulevard Poniatowski, 75012 Paris', 'guinguette végétalisée et festive à Bercy Beaucoup, food, concerts, DJ sets, ambiance bande.', null, array['tranquilo','alloco','apéro']::text[], array['duo','potos']::text[], 'pluie', false, true, null),
  ('Quai Sauvage', 48.8301527, 2.382901, 'Port de Bercy, Quai de Bercy, 75012 Paris', 'hotspot estival au Port de Bercy : programmation festive, sportive et culturelle au bord de Seine.', null, array['tranquilo','alloco','apéro']::text[], array['solo','duo','potos']::text[], 'pluie', false, true, null),
  ('Le Barboteur', 48.8958518, 2.4257263, '6 Rue Raymond Queneau, 93000 Bobigny', 'flottant itinérant/au canal avec programmation musicale, ambiance été Grand Paris.', null, array['alloco','apéro']::text[], array['duo','potos']::text[], 'nuageux', false, true, null),
  ('Vedettes de Paris', 48.8570687, 2.2896806, '2 Port de Suffren, 75007 Paris', 'croisières depuis la Tour Eiffel, bonne option simple pour voir Paris depuis l’eau.', null, array['tranquilo']::text[], array['solo','duo','potos']::text[], 'nuageux', false, true, null),
  ('Le Signac', 48.863549, 2.2980672, '3 Port Debilly, 75016 Paris', 'bateau/privatisation près de la Tour Eiffel, plutôt événement privé/pro.', null, array['apéro']::text[], array['potos','pro']::text[], 'soleil', false, true, null),
  ('Concorde Atlantique', 48.8617302, 2.3218351, '23 Quai Anatole France, 75007 Paris', 'bateau avec plusieurs niveaux et terrasses, soirées et événements au bord de Seine.', null, array['alloco','apéro']::text[], array['duo','potos','pro']::text[], 'nuageux', false, true, null),
  ('Le Diamant Bleu', 48.8419452, 2.3688778, '36 Quai d’Austerlitz, 75013 Paris', 'bateau événementiel et dîner-croisière, plutôt groupes, événements et soirées.', null, array['resto']::text[], array['duo','potos','pro']::text[], 'soleil', false, true, null),
  ('Le Mary Céleste', 48.8627, 2.3637, null, null, null, array['apéro','incognito']::text[], array['duo','potos']::text[], 'nuageux', false, false, null),
  ('Le Comptoir Général', 48.8702, 2.3633, null, null, null, array['tranquilo','apéro']::text[], array['potos']::text[], 'pluie', false, false, null),
  ('Bisou', 48.8635, 2.3672, null, null, null, array['apéro','incognito']::text[], array['duo']::text[], 'soleil', false, false, null),
  ('Septime La Cave', 48.8533, 2.3812, null, null, null, array['apéro','gastro']::text[], array['solo','duo']::text[], 'nuageux', false, false, null),
  ('Le Syndicat', 48.8714, 2.3551, null, null, null, array['incognito','turbo']::text[], array['duo','potos']::text[], null, false, false, null),
  ('La Buvette', 48.8669, 2.3786, null, null, null, array['apéro','incognito']::text[], array['duo']::text[], null, false, false, null)
),
inseres as (
  insert into public.lieux
    (owner_id, nom, lat, lng, adresse, description, note, visibilite,
     envies, compagnies, meteo, rooftop, sur_leau, match, source, statut)
  select moi.id, d.nom, d.lat, d.lng,
         nullif(d.adresse, ''), nullif(d.description, ''), nullif(d.note, ''),
         'public', d.envies, d.compagnies, nullif(d.meteo, ''),
         d.rooftop, d.sur_leau, nullif(d.match, ''), 'google', 'actif'
  from donnees d, moi
  where not exists (
    select 1 from public.lieux l
    where l.owner_id = (select id from moi)
      and pg_temp.meme_lieu(l.nom, l.lat, l.lng, d.nom, d.lat, d.lng)
  )
  returning id
)
-- v1 -> v2 : les spots du fond deja importes en 'cercle' passent publics
-- (même règle memeLieu : elle inclut l'égalité de nom normalisé, donc
-- couvre toujours le cas exact d'origine, en plus des quasi-doublons)
update public.lieux l
set visibilite = 'public'
from donnees d, moi
where l.owner_id = moi.id
  and pg_temp.meme_lieu(l.nom, l.lat, l.lng, d.nom, d.lat, d.lng)
  and l.visibilite = 'cercle';

-- controle : le total du carnet d'ersan
select count(*) as mes_spots, count(*) filter (where visibilite = 'public') as publics
from public.lieux
where owner_id = (select id from public.profils where lower(prenom) = 'ersan' order by cree_le asc limit 1);
