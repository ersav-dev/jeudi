-- ════════════════════════════════════════════════════════════════
-- ENRICHISSEMENT OSM — téléphone, site web, horaires (2026-08-09)
-- PAS une migration : un fichier à relire puis coller à la main dans
-- Supabase → SQL Editor → Run. Rejouable sans dégât (coalesce partout —
-- une saisie déjà faite par Ersan n'est JAMAIS écrasée).
--
-- SOURCE DES SPOTS : supabase/imports/2026-08-01_import_ersan_v2_tout.sql
-- (302 lieux — les 81 Google + 129 curated + 96 extra d'Ersan, déjà
-- dédoublonnés). C'est la source la plus fraîche : app/src/spots_curated.ts
-- et spots_extra.ts ne sont plus importés par l'app depuis le seed v22.
--
-- SOURCE DES DONNÉES : OpenStreetMap (licence ODbL — © les contributeurs
-- OpenStreetMap, https://www.openstreetmap.org/copyright). Si l'app
-- affiche un jour ces champs à l'écran, elle devra créditer OSM quelque
-- part (mention « données © OpenStreetMap » en page À propos / mentions,
-- pas forcément sur chaque fiche).
--
-- APPARIEMENT : autour de chaque spot (rayon 60 m), on ne retient un
-- élément OSM que si son nom, une fois normalisé (minuscules, accents et
-- ponctuation retirés), correspond EXACTEMENT à celui du spot — ou à ce
-- qui reste une fois les mots génériques de catégorie (bar/café/restaurant/
-- le/la/les…) retirés des DEUX côtés. Aucun score, aucun recouvrement
-- partiel : dans le doute, rien n'est rattaché. Voir
-- rapport_osm_2026-08-09.md pour le détail (124 refus, avec leur raison).
--
-- HORAIRES : traduits par app/src/horairesOsm.ts (fonction pure, testée
-- dans app/src/__tests__/horairesOsm.test.ts) à partir du tag OSM
-- `opening_hours`. Ne garde que LA plage qui couvre 20h (jeudi. est une
-- app du soir) ; si les jours ne s'accordent pas sur cette plage, ou si
-- la syntaxe est trop riche (sunset-sunrise, etc.), la traduction renvoie
-- « rien » plutôt que de deviner — c'est pour ça que ce fichier propose
-- moins d'horaires que de téléphones ou de sites.
-- ════════════════════════════════════════════════════════════════

-- ── les colonnes n'existent pas encore : à ajouter avant le reste ──
alter table public.lieux add column if not exists telephone text;
alter table public.lieux add column if not exists site_web  text;

-- ── copie fidèle de app/src/doublons.ts (normaliserNom), scoped à la
--    session — sert à faire correspondre un nom malgré accents/casse ──
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

with moi as (
  select id from public.profils
  where lower(prenom) = 'ersan'
  order by cree_le asc limit 1
),
-- (nom du spot, lat, lng, téléphone OSM, site OSM, ouverture soir, fermeture soir)
-- — 135 lieux (sur 178 appariés à OSM) ont au moins un de ces trois champs.
h (nom, lat, lng, tel, site, ouv, ferm) as (
  values
  ('Chez Michel', 48.8795704, 2.3522406, '+33 1 44 53 06 20', 'https://www.restaurantchezmichel.fr/', 19, 21.5),
  ('Abri Soba', 48.875021, 2.3444958, null, null, 19, 22.5),
  ('Aki Café', 48.8687275, 2.3365482, null, 'https://akiparis.fr/pages/contactez-nous', null, null),
  ('Mian Fan', 48.8716074, 2.3412011, '+33 9 67 47 47 06', 'http://www.mianfan-grands-boulevards.fr/', null, null),
  ('Vingt Vins d''Art', 48.8552343, 2.3580088, null, null, 18, 24),
  ('Le Louchebem', 48.8616443, 2.3443874, '+33 1 42 33 12 99', 'http://www.le-louchebem.fr/', null, null),
  ('Chez Marius', 48.8765271, 2.3549639, '+33 1 45 80 46 27', null, null, null),
  ('Restaurant Le Céladon', 48.8696738, 2.3309961, null, 'https://www.leceladon.com/', null, null),
  ('Orson', 48.8536233, 2.3312702, null, 'https://www.orson.paris', 19, 22),
  ('Le Louis XVI', 48.8732901, 2.3235381, null, 'https://lelouis16-paris.fr', 7, 22),
  ('Go Oun', 48.8663515, 2.3353302, '+33 1 40 15 64 43', 'http://www.resto-gooun.com/', 12, 22.5),
  ('Brasserie Rosie', 48.8521994, 2.3730393, '+33 1 45 70 82 39', 'https://www.brasserierosie.com', null, null),
  ('Le Hibou - Paris', 48.8516588, 2.3385244, '+33143549691', 'https://www.lehibou-paris.com/', 7, 26),
  ('Pide Paris', 48.8717766, 2.3539306, '+33 9 53 70 16 15', 'https://www.pide.paris', null, null),
  ('Hanoï Cà Phê Opéra', 48.8714582, 2.3357136, '+33 1 48 78 03 61', 'https://www.hanoi-caphe.com/', 12, 26),
  ('Restaurant Godjo', 48.8476363, 2.3480323, '+33 1 40 46 82 21', 'https://www.godjo.paris', null, null),
  ('Les Antiquaires', 48.8587025, 2.3288305, '+33 1 42 61 08 36', 'https://lesantiquaires.net', 7, 26),
  ('MÛRE', 48.8746195, 2.3386851, null, 'https://www.mure.family/menu-rue-lafayette', null, null),
  ('Le Petit Cambodge', 48.8738666, 2.3705269, '+33 1 44 84 83 05', 'https://lepetitcambodge.fr/', null, null),
  ('Tarántula Paris', 48.8543271, 2.3760595, '+33 1 43 55 90 54', null, null, null),
  ('Yo', 48.8696781, 2.3341013, '+33 1 47 42 00 33', null, 19.5, 22.5),
  ('No Scrum No Win - Bar Rugby', 48.8776425, 2.3278674, '+33 6 87 07 73 83', 'https://www.clubhousensnw.com/', null, null),
  ('La Renommée', 48.8612719, 2.343211, '+33 1 40 39 93 70', 'https://www.larenommeeparis.com/', 17.5, 22.5),
  ('DAROCO 16', 48.8515008, 2.2778254, '+33 1 44 14 91 91', 'http://www.daroco.fr/', null, null),
  ('Eunoé', 48.8608257, 2.3789798, '+33 7 67 96 86 36', 'http://www.eunoe-restaurant.com/', null, null),
  ('Suan Thaï', 48.8619943, 2.3640317, null, 'http://suanthai.fr', 18, 23),
  ('Ebis', 48.8653963, 2.3321572, '+33 1 42 61 05 90', null, 19, 22.25),
  ('JJAN! 짠', 48.8757857, 2.3276025, null, null, 11.75, 23),
  ('Atelier du veau', 48.8676812, 2.3326549, '+33 1 42 86 80 80', 'http://www.mipi.pizza', null, null),
  ('Loup', 48.8639344, 2.342597, '+33 1 42 36 73 23', 'http://www.loup-paris.fr/', 8, 26),
  ('Le Grand Colbert', 48.8664844, 2.3389311, null, 'https://legrandcolbert.fr/', 12, 24),
  ('Kodawari Ramen (Tsukiji)', 48.8643846, 2.3362784, '+33 1 42 61 34 60', 'https://www.kodawari-ramen.com', 11.75, 23),
  ('Le Général', 48.8662657, 2.366892, '+33 1 47 00 41 57', null, null, null),
  ('Kodawari Ramen (Yokochō)', 48.8546284, 2.3381142, '+33 1 43 29 37 67', 'https://kodawari-ramen.com', 11.75, 23),
  ('Café Blanc', 48.8627417, 2.3395806, '+33 1 42 33 55 85', 'https://www.privateaser.com/lieu/47699-cafe-blanc', null, null),
  ('Brasserie Dubillot', 48.868095, 2.3519457, '+33 1 88 61 51 24', 'https://lanouvellegarde.com/en/brasserie-dubillot/', 9, 24),
  ('Moonshiner', 48.8556625, 2.3711461, null, null, 18, 26),
  ('LA JAJA', 48.8660564, 2.3440191, null, 'https://lajaja.fr/', 17, 26),
  ('Griffon', 48.8596119, 2.3572985, '+33 1 43 36 98 37', 'https://griffon.paris/', 12, 24),
  ('Cheper', 48.8592147, 2.3578986, null, 'https://leperchoir.fr/location/cheper/', null, null),
  ('Le Petit Dakar', 48.8580531, 2.361319, '+33 1 44 59 34 74', 'https://www.lepetitdakar.com/', 19.5, 22.5),
  ('doublevie', 48.8864163, 2.3479153, null, 'https://www.doublevieparis.com/', null, null),
  ('Harry''s Bar Paris', 48.8692089, 2.3321714, null, 'www.harrysbar.fr', null, null),
  ('Bistrot Victoires', 48.865508, 2.3403568, null, null, 19, 23.5),
  ('Balou Paris 3', 48.8630437, 2.3518446, '+33 1 42 72 70 45', 'https://www.privateaser.com/lieu/11942-le-balou-ex-la-part-des-ours', null, null),
  ('The Highlander Pub', 48.856041, 2.3398038, '+33 6 31 57 88 75', 'http://pubhighlander.com/', null, null),
  ('Les Ombres', 48.8611046, 2.2984734, '+33 1 47 53 68 00', 'https://www.lesombres-restaurant.com/', 19, 22),
  ('Mun Paris', 48.8704259, 2.3066934, '+33 1 40 70 57 05', 'https://restaurant-mun.com/', null, null),
  ('Auteuil Brasserie', 48.848307, 2.2598214, '+33 1 40 71 11 90', 'http://www.auteuil-brasserie.com/', 9, 25.5),
  ('Little Red Door', 48.8636541, 2.3635309, '+33 1 42 71 19 32', 'https://www.lrdparis.com/', 18, 26),
  ('Candelaria', 48.8629844, 2.3639861, null, 'http://candelariaparis.com', null, null),
  ('Lavomatic', 48.8684268, 2.3618035, null, 'https://www.lavomatic.paris/', null, null),
  ('L''Epicier', 48.8672861, 2.3599971, '+33 9 74 64 04 11', 'https://www.lepicier.paris/', null, null),
  ('Experimental Cocktail Club', 48.8660758, 2.3482192, '+33 1 45 08 88 09', 'http://www.experimentalcocktailclub.com', null, null),
  ('The Cambridge Public House', 48.8614298, 2.3641614, null, 'https://www.thecambridge.paris/', 15, 25.5),
  ('Fréquence', 48.8548031, 2.375927, '+33 1 43 57 83 15', 'http://duneparis.fr/', null, null),
  ('Bisou.', 48.864082, 2.3658884, null, 'https://www.bar-bisou.com/', 17, 26),
  ('Sister Midnight', 48.8814639, 2.3407486, null, 'https://www.facebook.com/sistermidnightbar/', null, null),
  ('Serpent a Plume', 48.8561156, 2.3668233, '+33 140099690', 'https://serpentaplume.com/', null, null),
  ('Rex Club', 48.8705976, 2.3472734, '+33 142 361096', 'https://rexclub.com', null, null),
  ('Djoon Club', 48.83665, 2.3716268, '+33 1 45 70 83 49', null, 17, 23),
  ('Badaboum', 48.8536135, 2.3756573, '+33 1 48 06 50 70', 'https://badaboum.paris/', null, null),
  ('La Machine du Moulin Rouge', 48.8841152, 2.3321741, '+33 1 53 41 88 89', 'https://www.lamachinedumoulinrouge.com/', null, null),
  ('La Java', 48.8710123, 2.3738915, null, 'http://www.la-java.fr/', null, null),
  ('Virage Paris', 48.9004188, 2.3220984, null, 'https://virage17.paris/', null, null),
  ('Glazart', 48.899283, 2.3866102, null, 'https://www.glazart.com/', null, null),
  ('Nouveau Casino', 48.8658567, 2.3778299, null, 'http://www.nouveaucasino.net/', null, null),
  ('Kilometre25', 48.8959943, 2.3943382, null, 'https://www.kilometre25.fr/', null, null),
  ('Panic Room', 48.861244, 2.3676094, '+33 7 45 00 46 10', 'https://panicroomparis.com/', null, null),
  ('Le Mazette', 48.8432577, 2.3693705, '+33 786 353396', 'https://lemazette.com', null, null),
  ('La REcyclerie', 48.8976218, 2.3440598, '+33 1 42 57 58 49', 'https://larecyclerie.com/', null, null),
  ('Ground Control', 48.8433293, 2.3811637, null, 'https://www.groundcontrolparis.com', null, null),
  ('Le Pavillon des Canaux', 48.8874305, 2.3786909, '+33 1 73 71 82 90', 'https://www.pavillondescanaux.com/', null, null),
  ('La Prairie du Canal', 48.8985048, 2.4413639, null, 'https://www.canalprairie.fr/', null, null),
  ('Urfa Durum', 48.8724069, 2.3542518, '+33 1 48 24 12 84', 'https://www.facebook.com/pages/Urfa-Durum/240014419359256', 11.5, 24),
  ('L''As du Fallafel', 48.8574095, 2.3590493, '+33 1 48 87 63 60', 'https://asdufallafel.com/', 11, 24),
  ('El Nopal', 48.877844, 2.3651419, '+33 7 86 39 63 46', 'https://elnopalparis.com/', 12, 23),
  ('Taco Mesa', 48.8736232, 2.3480462, '+33978810600', 'https://tacomesa.fr/', null, null),
  ('Petit Bao', 48.8567411, 2.3720813, null, 'https://www.baofamily.co/', 9, 23),
  ('Gros Bao', 48.8714265, 2.365705, '+33 1 42 86 97 45', 'https://www.baofamily.co/grosbao', null, null),
  ('Udon Jubey', 48.8664423, 2.3355536, null, null, 11.5, 22.5),
  ('Kintaro', 48.8689261, 2.3348866, '+33 1 47 42 13 14', null, 11.5, 22.25),
  ('Neko Ramen', 48.8731221, 2.3421505, null, 'https://www.nekoramen.fr', 12, 22.5),
  ('TranTranZai', 48.8631582, 2.3498973, '+33 9 51 92 24 56', 'https://www.trantranzai.fr', 12, 22.5),
  ('Pho Banh Cuon 14', 48.826412, 2.3595345, '+33145836115', 'https://pho14paris.fr/fr/chinatown', 9, 23),
  ('Bouillon Republique', 48.8660094, 2.3646451, '+33 1 42 59 69 31', 'https://bouillonlesite.com/', 11.5, 24),
  ('Bouillon Pigalle', 48.8826186, 2.3374142, '+33 1 42 59 69 31', 'https://www.bouillonlesite.com', 12, 24),
  ('Septime', 48.8536026, 2.3809558, '+33 1 43 67 38 29', 'http://septime-charonne.fr/', 19, 22.5),
  ('Clamato', 48.8536026, 2.3809558, '+33 1 43 72 74 53', 'https://clamato-charonne.fr/', null, null),
  ('Early June', 48.8728964, 2.3632862, '+33 1 42 85 40 74', 'https://early-june.fr/', 18, 25),
  ('Le Fumoir', 48.8605065, 2.340843, '+33 1 42 92 00 24', 'https://www.lefumoir.com/', 11, 26),
  ('La Palette', 48.8554133, 2.3368241, null, null, 8, 26),
  ('Cafe de Flore', 48.8541278, 2.3325499, '+33 1 45 48 55 26', 'https://cafedeflore.fr/', 7.5, 25.5),
  ('Les Deux Magots', 48.8542327, 2.33321, null, 'https://lesdeuxmagots.fr', 7.5, 25),
  ('Au Pied de Cochon', 48.8634867, 2.3437202, '+33 1 40 13 77 00', 'https://www.pieddecochon.com/', 0, 24),
  ('Le Tambour', 48.8654459, 2.3447267, '+33 1 42 33 06 90', null, 7.5, 26),
  ('L''Alsace', 48.8699948, 2.305834, '+33 1 53 93 97 00', 'https://www.restaurantalsace.com', null, null),
  ('Le Cinq', 48.868784, 2.3006774, '+33 1 49 52 71 54', 'https://www.fourseasons.com/fr/paris/dining/restaurants/le_cinq/', 19, 22),
  ('Arpege', 48.855754, 2.3170135, '+33 1 47 05 09 06', 'https://www.alain-passard.com/', 19.5, 22.5),
  ('Le Clarence', 48.8674115, 2.3099361, '+33 1 82 82 10 10', null, 19.5, 21.5),
  ('Datil', 48.8636106, 2.3573521, '+33 1 80 05 74 98', 'https://www.datil-restaurant.fr/', 19.25, 20.75),
  ('Belushi''s Gare du Nord', 48.8793287, 2.358058, '+33 7 64 26 12 23', 'https://belushis.com/paris-gare-du-nord', null, null),
  ('Belushi''s Paris Canal', 48.8885905, 2.3789635, '+33 1 40 34 34 40', null, null, null),
  ('The French Flair', 48.8840485, 2.3306436, '+33 1 77 12 62 85', null, null, null),
  ('The Moose', 48.8517886, 2.3376896, '+33 1 46 33 77 00', 'https://www.mooseparis.com/', 12, 26),
  ('The Long Hop', 48.8504924, 2.349006, '+33 1 43 29 40 54', 'https://www.the-long-hop.com', null, null),
  ('The Bombardier', 48.8468643, 2.347702, '+33143547922', 'https://www.bombardierpub.fr/', 12, 26),
  ('L''Atalante', 48.8896643, 2.3828361, '+33145261382', 'http://atalanteourcq.fr/', null, null),
  ('Les Cuves de Fauve', 48.8532961, 2.3791345, '+33749059596', 'https://fauvebiere.com/', null, null),
  ('Paname Brewing Company', 48.8879396, 2.3792587, '+33 1 40 36 43 55', 'https://www.panamebrewingcompany.com/', 11, 25),
  ('KIEZ Biergarten Montmartre', 48.8935629, 2.333305, '+33 1 46 27 78 46', 'https://www.kiez.fr/kiezbiergarten/', 10, 26),
  ('Mez Beer', 48.839611, 2.3229184, '+33 1 42 84 43 22', null, 17, 26),
  ('Octopussy', 48.89355, 2.3252417, '+33 9 73 66 89 65', 'http://octopussyparis.com/', null, null),
  ('Le Nouvel Institut', 48.8492582, 2.3555969, '+33 9 67 51 77 09', 'http://lenouvelinstitut.fr/', 7, 26),
  ('The Green Goose', 48.8503634, 2.3905811, '+33982377341', 'http://www.thegreengoose.fr', null, null),
  ('Patrick''s - Le Ballon Vert', 48.8505069, 2.3861359, '+33 1 43 67 43 14', null, null, null),
  ('The Great Canadian Pub', 48.8542651, 2.3429193, '+33 1 46 33 54 20', 'http://www.tgcparis.com', null, null),
  ('Galway Irish Pub', 48.8539398, 2.343583, '+33 1 43 29 64 50', 'https://galwayirishpub.fr/', null, null),
  ('The Frog & Princess', 48.8522786, 2.3345451, '+33 1 40 51 77 38', 'https://www.frogpubs.com/fr/pub-princess-paris.php', null, null),
  ('Frog Hop House', 48.8688361, 2.3296197, null, 'https://www.frogpubs.com/fr/pub-frog-hop-house-paris-9.php', null, null),
  ('Frog XVI', 48.8646631, 2.2881416, '+33 1 47 27 88 88', 'https://www.frogpubs.com/fr/pub-XVI-paris.php', null, null),
  ('The Frog & Rosbif', 48.8644098, 2.3502403, '+33 1 42 36 34 73', 'https://www.frogpubs.com/pub-the-frog-rosbif-paris-1.php', null, null),
  ('The Pub', 48.8550361, 2.362647, null, 'https://www.thepubparis.com/', null, null),
  ('The Harp Bar', 48.8845473, 2.3303214, '+33 9 74 64 02 23', null, null, null),
  ('Lush Bar', 48.8851646, 2.3252609, '+33 1 43 87 49 46', null, null, null),
  ('The Coq & Bulldog', 48.8817015, 2.328359, '+33 9 82 40 56 36', 'http://www.facebook.com/pages/The-Coq-Bulldog-Pub/226637367401560', null, null),
  ('Stany''s', 48.8723059, 2.3492103, '+33 6 49 28 28 45', null, null, null),
  ('Quai de la Photo', 48.8366207, 2.3754059, '+33 7 66 43 01 18', 'https://quaidelaphoto.fr/', 12, 23.5),
  ('Bateau El Alamein', 48.8343257, 2.3779952, null, 'https://www.bateauelalamein.com', null, null),
  ('La Nouvelle Seine', 48.851774, 2.3500794, '+33 1 43 54 08 08', 'https://lanouvelleseine.com/', 19, 23),
  ('Riviera Fuga', 48.8631827, 2.3120324, '+33 1 81 70 40 49', 'https://riviera-fuga.com/', null, null),
  ('Bateaux Parisiens', 48.8605021, 2.2939902, '+33 1 44 11 33 36', 'https://www.bateauxparisiens.com/', null, null),
  ('River Café', 48.8295019, 2.2603684, '+33140935020', 'https://rivercafe.fr/', 12, 24),
  ('Maison Jaune', 48.8282279, 2.2544859, '+33185180970', 'https://maisonjaune.paris', null, null),
  ('Rosa Bonheur à l’Ouest', 48.9051727, 2.2886763, null, 'https://www.rosabonheur.fr/rosa-a-louest', null, null)
)
-- ── contrôle AVANT d'écrire : ce que ce fichier va réellement changer ──
select
  l.nom,
  l.telephone as telephone_avant, h.tel as telephone_propose,
  l.site_web  as site_web_avant,  h.site as site_web_propose,
  l.horaire_ouv as horaire_ouv_avant, h.ouv as horaire_ouv_propose,
  l.horaire_ferm as horaire_ferm_avant, h.ferm as horaire_ferm_propose
from public.lieux l, h, moi
where l.owner_id = moi.id
  and pg_temp.normaliser_nom(l.nom) = pg_temp.normaliser_nom(h.nom)
  and pg_temp.distance_m(l.lat, l.lng, h.lat, h.lng) < 200
  and ((l.telephone is null and h.tel is not null)
   or (l.site_web is null and h.site is not null)
   or (l.horaire_ouv is null and l.horaire_ferm is null and h.ouv is not null))
order by l.nom;
with moi as (
  select id from public.profils
  where lower(prenom) = 'ersan'
  order by cree_le asc limit 1
),
-- (nom du spot, lat, lng, téléphone OSM, site OSM, ouverture soir, fermeture soir)
-- — 135 lieux (sur 178 appariés à OSM) ont au moins un de ces trois champs.
h (nom, lat, lng, tel, site, ouv, ferm) as (
  values
  ('Chez Michel', 48.8795704, 2.3522406, '+33 1 44 53 06 20', 'https://www.restaurantchezmichel.fr/', 19, 21.5),
  ('Abri Soba', 48.875021, 2.3444958, null, null, 19, 22.5),
  ('Aki Café', 48.8687275, 2.3365482, null, 'https://akiparis.fr/pages/contactez-nous', null, null),
  ('Mian Fan', 48.8716074, 2.3412011, '+33 9 67 47 47 06', 'http://www.mianfan-grands-boulevards.fr/', null, null),
  ('Vingt Vins d''Art', 48.8552343, 2.3580088, null, null, 18, 24),
  ('Le Louchebem', 48.8616443, 2.3443874, '+33 1 42 33 12 99', 'http://www.le-louchebem.fr/', null, null),
  ('Chez Marius', 48.8765271, 2.3549639, '+33 1 45 80 46 27', null, null, null),
  ('Restaurant Le Céladon', 48.8696738, 2.3309961, null, 'https://www.leceladon.com/', null, null),
  ('Orson', 48.8536233, 2.3312702, null, 'https://www.orson.paris', 19, 22),
  ('Le Louis XVI', 48.8732901, 2.3235381, null, 'https://lelouis16-paris.fr', 7, 22),
  ('Go Oun', 48.8663515, 2.3353302, '+33 1 40 15 64 43', 'http://www.resto-gooun.com/', 12, 22.5),
  ('Brasserie Rosie', 48.8521994, 2.3730393, '+33 1 45 70 82 39', 'https://www.brasserierosie.com', null, null),
  ('Le Hibou - Paris', 48.8516588, 2.3385244, '+33143549691', 'https://www.lehibou-paris.com/', 7, 26),
  ('Pide Paris', 48.8717766, 2.3539306, '+33 9 53 70 16 15', 'https://www.pide.paris', null, null),
  ('Hanoï Cà Phê Opéra', 48.8714582, 2.3357136, '+33 1 48 78 03 61', 'https://www.hanoi-caphe.com/', 12, 26),
  ('Restaurant Godjo', 48.8476363, 2.3480323, '+33 1 40 46 82 21', 'https://www.godjo.paris', null, null),
  ('Les Antiquaires', 48.8587025, 2.3288305, '+33 1 42 61 08 36', 'https://lesantiquaires.net', 7, 26),
  ('MÛRE', 48.8746195, 2.3386851, null, 'https://www.mure.family/menu-rue-lafayette', null, null),
  ('Le Petit Cambodge', 48.8738666, 2.3705269, '+33 1 44 84 83 05', 'https://lepetitcambodge.fr/', null, null),
  ('Tarántula Paris', 48.8543271, 2.3760595, '+33 1 43 55 90 54', null, null, null),
  ('Yo', 48.8696781, 2.3341013, '+33 1 47 42 00 33', null, 19.5, 22.5),
  ('No Scrum No Win - Bar Rugby', 48.8776425, 2.3278674, '+33 6 87 07 73 83', 'https://www.clubhousensnw.com/', null, null),
  ('La Renommée', 48.8612719, 2.343211, '+33 1 40 39 93 70', 'https://www.larenommeeparis.com/', 17.5, 22.5),
  ('DAROCO 16', 48.8515008, 2.2778254, '+33 1 44 14 91 91', 'http://www.daroco.fr/', null, null),
  ('Eunoé', 48.8608257, 2.3789798, '+33 7 67 96 86 36', 'http://www.eunoe-restaurant.com/', null, null),
  ('Suan Thaï', 48.8619943, 2.3640317, null, 'http://suanthai.fr', 18, 23),
  ('Ebis', 48.8653963, 2.3321572, '+33 1 42 61 05 90', null, 19, 22.25),
  ('JJAN! 짠', 48.8757857, 2.3276025, null, null, 11.75, 23),
  ('Atelier du veau', 48.8676812, 2.3326549, '+33 1 42 86 80 80', 'http://www.mipi.pizza', null, null),
  ('Loup', 48.8639344, 2.342597, '+33 1 42 36 73 23', 'http://www.loup-paris.fr/', 8, 26),
  ('Le Grand Colbert', 48.8664844, 2.3389311, null, 'https://legrandcolbert.fr/', 12, 24),
  ('Kodawari Ramen (Tsukiji)', 48.8643846, 2.3362784, '+33 1 42 61 34 60', 'https://www.kodawari-ramen.com', 11.75, 23),
  ('Le Général', 48.8662657, 2.366892, '+33 1 47 00 41 57', null, null, null),
  ('Kodawari Ramen (Yokochō)', 48.8546284, 2.3381142, '+33 1 43 29 37 67', 'https://kodawari-ramen.com', 11.75, 23),
  ('Café Blanc', 48.8627417, 2.3395806, '+33 1 42 33 55 85', 'https://www.privateaser.com/lieu/47699-cafe-blanc', null, null),
  ('Brasserie Dubillot', 48.868095, 2.3519457, '+33 1 88 61 51 24', 'https://lanouvellegarde.com/en/brasserie-dubillot/', 9, 24),
  ('Moonshiner', 48.8556625, 2.3711461, null, null, 18, 26),
  ('LA JAJA', 48.8660564, 2.3440191, null, 'https://lajaja.fr/', 17, 26),
  ('Griffon', 48.8596119, 2.3572985, '+33 1 43 36 98 37', 'https://griffon.paris/', 12, 24),
  ('Cheper', 48.8592147, 2.3578986, null, 'https://leperchoir.fr/location/cheper/', null, null),
  ('Le Petit Dakar', 48.8580531, 2.361319, '+33 1 44 59 34 74', 'https://www.lepetitdakar.com/', 19.5, 22.5),
  ('doublevie', 48.8864163, 2.3479153, null, 'https://www.doublevieparis.com/', null, null),
  ('Harry''s Bar Paris', 48.8692089, 2.3321714, null, 'www.harrysbar.fr', null, null),
  ('Bistrot Victoires', 48.865508, 2.3403568, null, null, 19, 23.5),
  ('Balou Paris 3', 48.8630437, 2.3518446, '+33 1 42 72 70 45', 'https://www.privateaser.com/lieu/11942-le-balou-ex-la-part-des-ours', null, null),
  ('The Highlander Pub', 48.856041, 2.3398038, '+33 6 31 57 88 75', 'http://pubhighlander.com/', null, null),
  ('Les Ombres', 48.8611046, 2.2984734, '+33 1 47 53 68 00', 'https://www.lesombres-restaurant.com/', 19, 22),
  ('Mun Paris', 48.8704259, 2.3066934, '+33 1 40 70 57 05', 'https://restaurant-mun.com/', null, null),
  ('Auteuil Brasserie', 48.848307, 2.2598214, '+33 1 40 71 11 90', 'http://www.auteuil-brasserie.com/', 9, 25.5),
  ('Little Red Door', 48.8636541, 2.3635309, '+33 1 42 71 19 32', 'https://www.lrdparis.com/', 18, 26),
  ('Candelaria', 48.8629844, 2.3639861, null, 'http://candelariaparis.com', null, null),
  ('Lavomatic', 48.8684268, 2.3618035, null, 'https://www.lavomatic.paris/', null, null),
  ('L''Epicier', 48.8672861, 2.3599971, '+33 9 74 64 04 11', 'https://www.lepicier.paris/', null, null),
  ('Experimental Cocktail Club', 48.8660758, 2.3482192, '+33 1 45 08 88 09', 'http://www.experimentalcocktailclub.com', null, null),
  ('The Cambridge Public House', 48.8614298, 2.3641614, null, 'https://www.thecambridge.paris/', 15, 25.5),
  ('Fréquence', 48.8548031, 2.375927, '+33 1 43 57 83 15', 'http://duneparis.fr/', null, null),
  ('Bisou.', 48.864082, 2.3658884, null, 'https://www.bar-bisou.com/', 17, 26),
  ('Sister Midnight', 48.8814639, 2.3407486, null, 'https://www.facebook.com/sistermidnightbar/', null, null),
  ('Serpent a Plume', 48.8561156, 2.3668233, '+33 140099690', 'https://serpentaplume.com/', null, null),
  ('Rex Club', 48.8705976, 2.3472734, '+33 142 361096', 'https://rexclub.com', null, null),
  ('Djoon Club', 48.83665, 2.3716268, '+33 1 45 70 83 49', null, 17, 23),
  ('Badaboum', 48.8536135, 2.3756573, '+33 1 48 06 50 70', 'https://badaboum.paris/', null, null),
  ('La Machine du Moulin Rouge', 48.8841152, 2.3321741, '+33 1 53 41 88 89', 'https://www.lamachinedumoulinrouge.com/', null, null),
  ('La Java', 48.8710123, 2.3738915, null, 'http://www.la-java.fr/', null, null),
  ('Virage Paris', 48.9004188, 2.3220984, null, 'https://virage17.paris/', null, null),
  ('Glazart', 48.899283, 2.3866102, null, 'https://www.glazart.com/', null, null),
  ('Nouveau Casino', 48.8658567, 2.3778299, null, 'http://www.nouveaucasino.net/', null, null),
  ('Kilometre25', 48.8959943, 2.3943382, null, 'https://www.kilometre25.fr/', null, null),
  ('Panic Room', 48.861244, 2.3676094, '+33 7 45 00 46 10', 'https://panicroomparis.com/', null, null),
  ('Le Mazette', 48.8432577, 2.3693705, '+33 786 353396', 'https://lemazette.com', null, null),
  ('La REcyclerie', 48.8976218, 2.3440598, '+33 1 42 57 58 49', 'https://larecyclerie.com/', null, null),
  ('Ground Control', 48.8433293, 2.3811637, null, 'https://www.groundcontrolparis.com', null, null),
  ('Le Pavillon des Canaux', 48.8874305, 2.3786909, '+33 1 73 71 82 90', 'https://www.pavillondescanaux.com/', null, null),
  ('La Prairie du Canal', 48.8985048, 2.4413639, null, 'https://www.canalprairie.fr/', null, null),
  ('Urfa Durum', 48.8724069, 2.3542518, '+33 1 48 24 12 84', 'https://www.facebook.com/pages/Urfa-Durum/240014419359256', 11.5, 24),
  ('L''As du Fallafel', 48.8574095, 2.3590493, '+33 1 48 87 63 60', 'https://asdufallafel.com/', 11, 24),
  ('El Nopal', 48.877844, 2.3651419, '+33 7 86 39 63 46', 'https://elnopalparis.com/', 12, 23),
  ('Taco Mesa', 48.8736232, 2.3480462, '+33978810600', 'https://tacomesa.fr/', null, null),
  ('Petit Bao', 48.8567411, 2.3720813, null, 'https://www.baofamily.co/', 9, 23),
  ('Gros Bao', 48.8714265, 2.365705, '+33 1 42 86 97 45', 'https://www.baofamily.co/grosbao', null, null),
  ('Udon Jubey', 48.8664423, 2.3355536, null, null, 11.5, 22.5),
  ('Kintaro', 48.8689261, 2.3348866, '+33 1 47 42 13 14', null, 11.5, 22.25),
  ('Neko Ramen', 48.8731221, 2.3421505, null, 'https://www.nekoramen.fr', 12, 22.5),
  ('TranTranZai', 48.8631582, 2.3498973, '+33 9 51 92 24 56', 'https://www.trantranzai.fr', 12, 22.5),
  ('Pho Banh Cuon 14', 48.826412, 2.3595345, '+33145836115', 'https://pho14paris.fr/fr/chinatown', 9, 23),
  ('Bouillon Republique', 48.8660094, 2.3646451, '+33 1 42 59 69 31', 'https://bouillonlesite.com/', 11.5, 24),
  ('Bouillon Pigalle', 48.8826186, 2.3374142, '+33 1 42 59 69 31', 'https://www.bouillonlesite.com', 12, 24),
  ('Septime', 48.8536026, 2.3809558, '+33 1 43 67 38 29', 'http://septime-charonne.fr/', 19, 22.5),
  ('Clamato', 48.8536026, 2.3809558, '+33 1 43 72 74 53', 'https://clamato-charonne.fr/', null, null),
  ('Early June', 48.8728964, 2.3632862, '+33 1 42 85 40 74', 'https://early-june.fr/', 18, 25),
  ('Le Fumoir', 48.8605065, 2.340843, '+33 1 42 92 00 24', 'https://www.lefumoir.com/', 11, 26),
  ('La Palette', 48.8554133, 2.3368241, null, null, 8, 26),
  ('Cafe de Flore', 48.8541278, 2.3325499, '+33 1 45 48 55 26', 'https://cafedeflore.fr/', 7.5, 25.5),
  ('Les Deux Magots', 48.8542327, 2.33321, null, 'https://lesdeuxmagots.fr', 7.5, 25),
  ('Au Pied de Cochon', 48.8634867, 2.3437202, '+33 1 40 13 77 00', 'https://www.pieddecochon.com/', 0, 24),
  ('Le Tambour', 48.8654459, 2.3447267, '+33 1 42 33 06 90', null, 7.5, 26),
  ('L''Alsace', 48.8699948, 2.305834, '+33 1 53 93 97 00', 'https://www.restaurantalsace.com', null, null),
  ('Le Cinq', 48.868784, 2.3006774, '+33 1 49 52 71 54', 'https://www.fourseasons.com/fr/paris/dining/restaurants/le_cinq/', 19, 22),
  ('Arpege', 48.855754, 2.3170135, '+33 1 47 05 09 06', 'https://www.alain-passard.com/', 19.5, 22.5),
  ('Le Clarence', 48.8674115, 2.3099361, '+33 1 82 82 10 10', null, 19.5, 21.5),
  ('Datil', 48.8636106, 2.3573521, '+33 1 80 05 74 98', 'https://www.datil-restaurant.fr/', 19.25, 20.75),
  ('Belushi''s Gare du Nord', 48.8793287, 2.358058, '+33 7 64 26 12 23', 'https://belushis.com/paris-gare-du-nord', null, null),
  ('Belushi''s Paris Canal', 48.8885905, 2.3789635, '+33 1 40 34 34 40', null, null, null),
  ('The French Flair', 48.8840485, 2.3306436, '+33 1 77 12 62 85', null, null, null),
  ('The Moose', 48.8517886, 2.3376896, '+33 1 46 33 77 00', 'https://www.mooseparis.com/', 12, 26),
  ('The Long Hop', 48.8504924, 2.349006, '+33 1 43 29 40 54', 'https://www.the-long-hop.com', null, null),
  ('The Bombardier', 48.8468643, 2.347702, '+33143547922', 'https://www.bombardierpub.fr/', 12, 26),
  ('L''Atalante', 48.8896643, 2.3828361, '+33145261382', 'http://atalanteourcq.fr/', null, null),
  ('Les Cuves de Fauve', 48.8532961, 2.3791345, '+33749059596', 'https://fauvebiere.com/', null, null),
  ('Paname Brewing Company', 48.8879396, 2.3792587, '+33 1 40 36 43 55', 'https://www.panamebrewingcompany.com/', 11, 25),
  ('KIEZ Biergarten Montmartre', 48.8935629, 2.333305, '+33 1 46 27 78 46', 'https://www.kiez.fr/kiezbiergarten/', 10, 26),
  ('Mez Beer', 48.839611, 2.3229184, '+33 1 42 84 43 22', null, 17, 26),
  ('Octopussy', 48.89355, 2.3252417, '+33 9 73 66 89 65', 'http://octopussyparis.com/', null, null),
  ('Le Nouvel Institut', 48.8492582, 2.3555969, '+33 9 67 51 77 09', 'http://lenouvelinstitut.fr/', 7, 26),
  ('The Green Goose', 48.8503634, 2.3905811, '+33982377341', 'http://www.thegreengoose.fr', null, null),
  ('Patrick''s - Le Ballon Vert', 48.8505069, 2.3861359, '+33 1 43 67 43 14', null, null, null),
  ('The Great Canadian Pub', 48.8542651, 2.3429193, '+33 1 46 33 54 20', 'http://www.tgcparis.com', null, null),
  ('Galway Irish Pub', 48.8539398, 2.343583, '+33 1 43 29 64 50', 'https://galwayirishpub.fr/', null, null),
  ('The Frog & Princess', 48.8522786, 2.3345451, '+33 1 40 51 77 38', 'https://www.frogpubs.com/fr/pub-princess-paris.php', null, null),
  ('Frog Hop House', 48.8688361, 2.3296197, null, 'https://www.frogpubs.com/fr/pub-frog-hop-house-paris-9.php', null, null),
  ('Frog XVI', 48.8646631, 2.2881416, '+33 1 47 27 88 88', 'https://www.frogpubs.com/fr/pub-XVI-paris.php', null, null),
  ('The Frog & Rosbif', 48.8644098, 2.3502403, '+33 1 42 36 34 73', 'https://www.frogpubs.com/pub-the-frog-rosbif-paris-1.php', null, null),
  ('The Pub', 48.8550361, 2.362647, null, 'https://www.thepubparis.com/', null, null),
  ('The Harp Bar', 48.8845473, 2.3303214, '+33 9 74 64 02 23', null, null, null),
  ('Lush Bar', 48.8851646, 2.3252609, '+33 1 43 87 49 46', null, null, null),
  ('The Coq & Bulldog', 48.8817015, 2.328359, '+33 9 82 40 56 36', 'http://www.facebook.com/pages/The-Coq-Bulldog-Pub/226637367401560', null, null),
  ('Stany''s', 48.8723059, 2.3492103, '+33 6 49 28 28 45', null, null, null),
  ('Quai de la Photo', 48.8366207, 2.3754059, '+33 7 66 43 01 18', 'https://quaidelaphoto.fr/', 12, 23.5),
  ('Bateau El Alamein', 48.8343257, 2.3779952, null, 'https://www.bateauelalamein.com', null, null),
  ('La Nouvelle Seine', 48.851774, 2.3500794, '+33 1 43 54 08 08', 'https://lanouvelleseine.com/', 19, 23),
  ('Riviera Fuga', 48.8631827, 2.3120324, '+33 1 81 70 40 49', 'https://riviera-fuga.com/', null, null),
  ('Bateaux Parisiens', 48.8605021, 2.2939902, '+33 1 44 11 33 36', 'https://www.bateauxparisiens.com/', null, null),
  ('River Café', 48.8295019, 2.2603684, '+33140935020', 'https://rivercafe.fr/', 12, 24),
  ('Maison Jaune', 48.8282279, 2.2544859, '+33185180970', 'https://maisonjaune.paris', null, null),
  ('Rosa Bonheur à l’Ouest', 48.9051727, 2.2886763, null, 'https://www.rosabonheur.fr/rosa-a-louest', null, null)
)
-- ── l'écriture, jamais un écrasement (coalesce) ──
update public.lieux l
set
  telephone    = coalesce(l.telephone, h.tel),
  site_web     = coalesce(l.site_web, h.site),
  horaire_ouv  = case when l.horaire_ouv is null and l.horaire_ferm is null
                       then h.ouv else l.horaire_ouv end,
  horaire_ferm = case when l.horaire_ouv is null and l.horaire_ferm is null
                       then h.ferm else l.horaire_ferm end
from h, moi
where l.owner_id = moi.id
  and pg_temp.normaliser_nom(l.nom) = pg_temp.normaliser_nom(h.nom)
  and pg_temp.distance_m(l.lat, l.lng, h.lat, h.lng) < 200;
-- ── contrôle APRÈS : le total du carnet d'ersan qui porte chaque champ ──
select
  count(*) filter (where telephone is not null)   as avec_telephone,
  count(*) filter (where site_web is not null)    as avec_site_web,
  count(*) filter (where horaire_ouv is not null) as avec_horaires
from public.lieux
where owner_id = (select id from public.profils where lower(prenom) = 'ersan' order by cree_le asc limit 1);
