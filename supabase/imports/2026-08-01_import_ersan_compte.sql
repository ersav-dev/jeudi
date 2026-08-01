-- ════════════════════════════════════════════════════════════════
-- IMPORT (one-shot) — la collection Google d'Ersan dans SON compte.
-- 81 spots → owner = le profil « ersan » (le fondateur). Visibilité
-- 'cercle' : ton cercle voit ta vraie carte de membre ; tu passes en
-- public spot par spot depuis l'app si tu veux. Dédoublonné par NOM
-- (insensible à la casse) contre tes spots existants — re-runnable.
-- À coller dans Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════
with moi as (
  select id from public.profils
  where lower(prenom) = 'ersan'
  order by cree_le asc
  limit 1
),
donnees (nom, lat, lng, adresse, description, note, envies, meteo) as (
  values
  ('The Office', 48.8391435, 2.3486007, 'The Office, Rue Claude Bernard, Quartier du Val-de-Grâce', 'Restaurant', 'A tester !!', array['resto']::text[], null),
  ('215 Rue de Paris', 48.8293133, 2.4015281, 'Rue de Paris, Valmy, Paris 12e Arrondissement', '93100 Montreuil', 'Glace a tester', array['resto']::text[], null),
  ('Chez Michel', 48.8795704, 2.3522406, 'Chez Michel, Rue de Belzunce, Quartier Saint-Vincent-de-Paul', 'Française', 'Super resto : François et Christophe', array['resto']::text[], 'nuageux'),
  ('Abri Soba', 48.875021, 2.3444958, 'Abri Soba, 10, Rue Saulnier', 'Restaurant de nouilles au sarrasin (soba)', 'À Tester', array['resto']::text[], 'nuageux'),
  ('Happatei', 48.8685831, 2.3366834, 'Happa Teï, 64, Rue Sainte-Anne', 'Japonaise', 'Resto Lisa Théo', array['resto']::text[], 'nuageux'),
  ('Aki Café', 48.8687275, 2.3365482, 'Aki Café, 75, Rue Sainte-Anne', 'Japonaise', 'Bon resto', array['resto']::text[], 'pluie'),
  ('La Coquille', 48.8642141, 2.3417384, 'La coquille, Rue Coquillière, Quartier Les Halles', 'Bar', null, array['apéro']::text[], 'pluie'),
  ('Kehribar', 48.8460828, 2.3432882, 'Kehribar, Rue des Fossés Saint-Jacques, Quartier de la Sorbonne', 'Turque', 'A tester insta', array['resto']::text[], 'pluie'),
  ('Mian Fan', 48.8716074, 2.3412011, 'Mian Fan, Boulevard Montmartre, Quartier Vivienne', 'Fusion asiatique', 'A tester', array['resto']::text[], 'pluie'),
  ('Duplex Bar', 48.8624459, 2.3550899, 'Duplex, Rue Michel le Comte, Quartier Sainte-Avoye', 'Bar gay', 'Var gay a tester', array['apéro']::text[], 'pluie'),
  ('Vingt Vins d''Art', 48.8552343, 2.3580088, 'Vingt Vins d''Art, Rue de Jouy, Quartier Saint-Gervais', 'Bistro', 'Reco xtof', array['resto']::text[], 'nuageux'),
  ('Le Louchebem', 48.8616443, 2.3443874, 'Le Louchébem, 31, Rue Berger', 'Française', null, array['resto']::text[], 'nuageux'),
  ('Chez Marius', 48.8765271, 2.3549639, 'Chez Marius, Rue de Chabrol, Quartier de la Porte-Saint-Denis', 'Restaurant', 'Reco xtof', array['resto']::text[], 'nuageux'),
  ('Restaurant À la maison', 48.8830175, 2.3184119, 'Nouilles ceintures, 99, Rue des Dames', 'Restaurant', 'Resto reco Xtof', array['resto']::text[], 'nuageux'),
  ('Pacifique', 48.873054, 2.3796868, 'Pacifique, Rue Rampal, Quartier du Combat', 'Chinoise', 'Resto chinois avevamos Bressuire', array['resto']::text[], 'nuageux'),
  ('Restaurant Le Céladon', 48.8696738, 2.3309961, 'Le Céladon, Rue Daunou, Quartier Gaillon', 'Française', 'Restaurant Corée chicos', array['resto']::text[], 'nuageux'),
  ('Orson', 48.8536233, 2.3312702, 'Orson, Rue du Dragon, Quartier de Saint-Germain-des-Prés', 'Restaurant', null, array['resto']::text[], 'soleil'),
  ('On Restaurant', 48.8662857, 2.3327705, 'On, Rue Saint-Roch, Quartier Vendôme', 'Coréenne', null, array['resto']::text[], 'nuageux'),
  ('Menekse', 48.8516114, 2.3778571, 'Menekse, 7, Passage de la Main d''Or', 'Restaurant', 'Restaurant kurde', array['resto']::text[], 'nuageux'),
  ('Le Louis XVI', 48.8732901, 2.3235381, 'Le Louis XVI, Rue des Mathurins, Quartier de la Madeleine', null, null, array['resto']::text[], null),
  ('Go Oun', 48.8663515, 2.3353302, 'Go-Oun, 14, Rue Thérèse', 'Coréenne', 'Resto Charlotte', array['resto']::text[], 'nuageux'),
  ('Brasserie Rosie', 48.8521994, 2.3730393, 'Rosie, 53, Rue du Faubourg Saint-Antoine', 'Brasserie', 'Rdv Dina', array['resto']::text[], 'nuageux'),
  ('JanTchi', 48.8660361, 2.335991, 'Jantchi, Rue Thérèse, Quartier du Palais Royal', 'Coréenne', 'Bobun Saint Anne', array['resto']::text[], 'nuageux'),
  ('Poni', 48.8767991, 2.3369941, 'Poni, 24, Rue Saint-Lazare', 'Brasserie', 'Restaurant a tester', array['resto']::text[], 'nuageux'),
  ('Le Hibou - Paris', 48.8516588, 2.3385244, 'Le Hibou, 16, Rue de l''Odéon', 'Brasserie', null, array['resto']::text[], 'nuageux'),
  ('Pide Paris', 48.8717766, 2.3539306, 'Pidè Paris, Rue du Faubourg Saint-Denis, Quartier de la Porte-Saint-Denis', 'Turque', null, array['resto']::text[], 'pluie'),
  ('Hanoï Cà Phê Opéra', 48.8714582, 2.3357136, 'Hanoi Cà Phê Opéra, Boulevard des Italiens, Quartier de la Chaussée-d''Antin', 'Vietnamienne', 'Cafe/ Resto sympa', array['resto']::text[], 'nuageux'),
  ('Restaurant Godjo', 48.8476363, 2.3480323, 'Godjo, 8, Rue de l''École Polytechnique', 'Éthiopienne', null, array['resto']::text[], 'nuageux'),
  ('Les Antiquaires', 48.8587025, 2.3288305, 'Les Antiquaires, Rue de Lille, Quartier Saint-Thomas-d''Aquin', 'Bistro', null, array['resto']::text[], 'nuageux'),
  ('Restaurant Akrame', 48.8714228, 2.3251829, 'Akrame, Rue Tronchet, Quartier de la Madeleine', 'Cuisine gastronomique', 'restaurant avec cheval dans l entree (Juliette)', array['gastro']::text[], 'soleil'),
  ('MÛRE', 48.8746195, 2.3386851, 'Mûre, 37, Rue La Fayette', 'Bio', 'Travail sur Paris', array['resto']::text[], 'pluie'),
  ('El Guacamole République', 48.8713675, 2.3621526, 'El Guacamole, 37, Rue Yves Toudic', 'Mexicaine', 'Guzcolmoleee', array['resto']::text[], 'pluie'),
  ('Le Petit Cambodge', 48.8738666, 2.3705269, 'Le petit Cambodge, 24, Avenue Claude Vellefaux', 'Cambodgienne', null, array['resto']::text[], 'nuageux'),
  ('Tarántula Paris', 48.8543271, 2.3760595, 'Tarántula, 13bis, Rue Keller', 'Restaurant', 'A tester absolutely', array['resto']::text[], 'nuageux'),
  ('Yo', 48.8696781, 2.3341013, 'Yo !, Rue de Port Mahon, Quartier Gaillon', 'Thaï', 'Resto petit gastro fr/thai', array['resto']::text[], 'nuageux'),
  ('No Scrum No Win - Bar Rugby', 48.8776425, 2.3278674, 'No Scrum No Win - Bar Rugby, 32, Rue de Londres', 'Bar sportif', null, array['apéro']::text[], 'nuageux'),
  ('La Renommée', 48.8612719, 2.343211, 'La Renommée, Rue Saint-Honoré, Quartier Les Halles', 'Française', 'A tester, paris 1900', array['resto']::text[], 'soleil'),
  ('The Hood Paris', 48.833898, 2.3154421, 'the Hood, Rue de l''Ouest, Quartier de Plaisance', 'Café', 'Singaporean restaurant', array['tranquilo']::text[], 'nuageux'),
  ('Express de Lyon', 48.8459544, 2.3720667, 'Express de Lyon, Rue de Lyon, Quartier des Quinze-Vingts', 'Brasserie', null, array['resto']::text[], 'pluie'),
  ('DAROCO 16', 48.8515008, 2.2778254, 'Daroco 16, 3, Place Clément Ader', null, null, array['resto']::text[], null),
  ('Eunoé', 48.8608257, 2.3789798, 'Eunoé, 6, Rue Rochebrune', 'Restaurant', 'Petit gastro proche du travail à tester', array['resto']::text[], 'nuageux'),
  ('Le Bar Chaumont', 48.866209, 2.344963, 'Le Bar Chaumont, 18, Rue Bachaumont', 'Bar à cocktails', 'A tester', array['apéro']::text[], 'pluie'),
  ('Le 404', 48.8588897, 2.320041, 'Paris, Île-de-France, France métropolitaine', 'Marocaine', 'A tester', array['resto']::text[], 'nuageux'),
  ('Suan Thaï', 48.8619943, 2.3640317, 'Suan Thai, Rue de Bretagne, Quartier des Enfants-Rouges', 'Thaï', null, array['resto']::text[], 'nuageux'),
  ('Sushi-B', 48.8677062, 2.337428, 'Sushi B, Rue Rameau, Quartier Vivienne', 'Sushis', null, array['resto']::text[], 'soleil'),
  ('Ebis', 48.8653963, 2.3321572, 'Ebis, Rue Saint-Roch, Quartier Vendôme', 'Fusion asiatique', 'Super resto a tester', array['resto']::text[], 'nuageux'),
  ('Chimère', 48.8698899, 2.3355082, 'Chimère, 22, Rue du Quatre Septembre', 'Restaurant', null, array['resto']::text[], 'nuageux'),
  ('L''Auberge Café', 48.8582612, 2.3447141, 'L''Auberge Café, Rue Saint-Germain l''Auxerrois, Quartier Saint-Germain-l''Auxerrois', null, null, array['resto']::text[], null),
  ('Brique Machine - Paris 2', 48.8709276, 2.3427137, 'Brique Machine - Brique House, 161, Rue Montmartre', 'Buffet', 'Grand resto pr match', array['resto']::text[], 'nuageux'),
  ('JJAN! 짠', 48.8757857, 2.3276025, 'Jjan !, Rue Saint-Lazare, Quartier Saint-Georges', 'Coréenne', 'Coréen proche de st laz/ plat fromage poulet pr 2- gino-', array['resto']::text[], 'nuageux'),
  ('Dar Mima', 48.8489962, 2.3573756, 'Dar Mima - Zyriab, 1, Rue des Fossés Saint-Bernard', 'Moyenne-orientale', 'Resto rooftop Marocain - vu a l Aeroport', array['resto']::text[], 'nuageux'),
  ('Atelier du veau', 48.8676812, 2.3326549, 'Atelier Du Veau, Rue Danielle Casanova, Quartier Vendôme', null, 'Kébab gastro', array['resto']::text[], null),
  ('Loup', 48.8639344, 2.342597, 'Loup, 44, Rue du Louvre', 'Française', 'Loup', array['resto']::text[], 'nuageux'),
  ('Le Grand Colbert', 48.8664844, 2.3389311, 'Le Grand Colbert, Rue Vivienne, Quartier Vivienne', 'Brasserie', 'Grand Colbert', array['resto']::text[], 'nuageux'),
  ('Kodawari Ramen (Tsukiji)', 48.8643846, 2.3362784, 'Kodawari Ramen (Tsukiji), 12, Rue de Richelieu', 'Ramen', 'Décor de marche aux poissons??', array['resto']::text[], 'nuageux'),
  ('Le Général', 48.8662657, 2.366892, 'Le Général, Rue Rampon, Quartier de la Folie-Méricourt', 'Restaurant', 'Reco Uber', array['resto']::text[], 'nuageux'),
  ('Pendino', 48.8639457, 2.3345528, 'Pendino, Rue de l''Échelle, Quartier du Palais Royal', 'Italienne', 'Pizza bonne deux de bois', array['resto']::text[], 'nuageux'),
  ('Kodawari Ramen (Yokochō)', 48.8546284, 2.3381142, 'Kodawari Ramen (Yokochō), 29, Rue Mazarine', 'Ramen', 'Décor de marche aux poissons??', array['resto']::text[], 'nuageux'),
  ('Café Blanc', 48.8627417, 2.3395806, 'Café Blanc, 12, Rue Croix des Petits Champs', 'Française', null, array['resto']::text[], 'nuageux'),
  ('Brasserie Dubillot', 48.868095, 2.3519457, 'Brasserie Dubillot, 222, Rue Saint-Denis', 'Française', null, array['resto']::text[], 'nuageux'),
  ('La Mezcaleria Paris', 48.8638472, 2.3656384, 'La Mezcaleria Paris, Rue de Saintonge, Quartier des Enfants-Rouges', 'Bar', null, array['apéro']::text[], 'pluie'),
  ('Moonshiner', 48.8556625, 2.3711461, 'Moonshiner, Rue Sedaine, Quartier de la Roquette', 'Bar à cocktails', null, array['apéro']::text[], 'pluie'),
  ('Le 1905', 48.8588897, 2.320041, 'Paris, Île-de-France, France métropolitaine', 'Bar à cocktails', null, array['apéro']::text[], 'pluie'),
  ('LA JAJA', 48.8660564, 2.3440191, 'La Jaja, 56, Rue d''Argout', 'Bar', null, array['apéro']::text[], 'pluie'),
  ('Griffon', 48.8596119, 2.3572985, 'Griffon, 55 bis, Rue des Francs Bourgeois', 'Restaurant', 'Proche Félix', array['resto']::text[], 'nuageux'),
  ('Les 4 soupes', 48.8264183, 2.3594835, 'Song Huong, Avenue de Choisy, Quartier de la Maison-Blanche', null, null, array['resto']::text[], null),
  ('Baan Issan', 48.833747, 2.3546338, 'Baan Issan, Rue Véronèse, Quartier de la Salpêtrière', 'Thaï', null, array['resto']::text[], 'nuageux'),
  ('Le Village', 48.8501678, 2.2864502, 'Le Village, 34-40, Rue Emeriau', 'Restaurant', 'To test', array['resto']::text[], 'pluie'),
  ('Cheper', 48.8592147, 2.3578986, 'Chéper, Rue des Francs Bourgeois, Quartier Saint-Gervais', null, 'A tester!!', array['resto']::text[], null),
  ('Fabula', 48.8506326, 2.3732696, 'Fabula, Rue de Charenton, Quartier des Quinze-Vingts', 'Restaurant', 'A tester, dans le musée Carnavalet', array['resto']::text[], 'nuageux'),
  ('Clark Hot Dog', 48.8557065, 2.3604385, 'Clark hot dog and coffee, Rue du Roi de Sicile, Quartier Saint-Gervais', 'Stand de hot-dog', 'Hot dogs Marais', array['resto']::text[], 'pluie'),
  ('Le Petit Dakar', 48.8580531, 2.361319, 'Le Petit Dakar, 6, Rue Elzévir', 'Spécialités d''Afrique de l''Ouest', null, array['resto']::text[], 'nuageux'),
  ('Miznon Paris', 48.872949, 2.3426102, 'Miznon, Rue de la Grange Batelière, Quartier du Faubourg-Montmartre', 'Méditerranéenne', null, array['resto']::text[], 'pluie'),
  ('Café des Arts et Métiers', 48.8648026, 2.355226, 'Le Puy des Arts, 103, Rue Beaubourg', 'Restaurant', null, array['resto']::text[], 'pluie'),
  ('doublevie', 48.8864163, 2.3479153, 'doublevie, 2, Rue Poulet', 'Restaurant', null, array['resto']::text[], 'nuageux'),
  ('Harry''s Bar Paris', 48.8692089, 2.3321714, 'Harry''s Bar, Rue Daunou, Quartier Gaillon', 'Bar à cocktails', null, array['apéro']::text[], 'pluie'),
  ('Bistrot Victoires', 48.865508, 2.3403568, 'Bistrot Victoires, Rue Catinat, Quartier du Palais Royal', 'Bistro', null, array['resto']::text[], 'nuageux'),
  ('Balou Paris 3', 48.8630437, 2.3518446, 'Balou Paris 3, 11, Rue aux Ours', 'Bar à tapas', null, array['apéro']::text[], 'pluie'),
  ('The Highlander Pub', 48.856041, 2.3398038, 'The Highlander, 6, Rue de Nevers', 'Pub', null, array['apéro']::text[], 'pluie'),
  ('Maison Lautrec', 48.8811814, 2.3359631, 'La Maison Lautrec, Rue Jean-Baptiste Pigalle, Quartier Saint-Georges', 'Française', null, array['resto']::text[], 'nuageux'),
  ('Bar Hemingway', 48.8687856, 2.3275106, 'Bar Hemingway, Rue Cambon, Quartier Vendôme', 'Bar', null, array['apéro']::text[], 'nuageux')
)
insert into public.lieux
  (owner_id, nom, lat, lng, adresse, description, note, visibilite,
   envies, compagnies, meteo, source, statut)
select moi.id, d.nom, d.lat, d.lng,
       nullif(d.adresse, ''), nullif(d.description, ''), nullif(d.note, ''),
       'cercle', d.envies, '{}'::text[], nullif(d.meteo, ''),
       'google', 'actif'
from donnees d, moi
where not exists (
  select 1 from public.lieux l
  where l.owner_id = (select id from moi)
    and lower(l.nom) = lower(d.nom)
);
-- contrôle : combien de spots possède ersan maintenant ?
select count(*) as mes_spots
from public.lieux
where owner_id = (select id from public.profils where lower(prenom) = 'ersan' order by cree_le asc limit 1);
