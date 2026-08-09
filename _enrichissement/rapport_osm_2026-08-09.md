# Enrichissement OSM — téléphone, site web, horaires — rapport 2026-08-09

Ce que sait OpenStreetMap des spots d'Ersan, rendu en chiffres, avec le SQL
qui va avec (`osm_2026-08-09.sql`, à relire puis coller à la main — rien
n'a été appliqué à la base). Règle absolue tenue de bout en bout : dans le
doute, on ne rattache rien. Un champ vide vaut infiniment mieux qu'un champ
faux.

## 1. La source retenue

**`supabase/imports/2026-08-01_import_ersan_v2_tout.sql`** — 302 lignes
(81 spots Google + 129 curated + 96 extra, déjà dédoublonnées par la même
règle que l'app, `app/src/doublons.ts`). C'est la source la plus fraîche :
`app/src/spots_curated.ts` et `spots_extra.ts` ne sont **plus importés par
l'app** depuis le seed v22 — les utiliser aurait produit un rapport sur des
données mortes.

Un enrichissement OSM avait déjà tourné le 11/07 (`enrichir_osm.mjs`,
`osm_resultats.json`, `rapport.md` dans ce même dossier), mais sur ces
mêmes trois fichiers sources (curated + extra + `ersan.ts`, qui EST les 81
spots Google — mêmes coordonnées, vérifié). Il servait à poser un
**type/cuisine** sur chaque lieu (fusionné le 08/08, voir
`fusion_2026-08-08.sql` et `fusion_rapport.md` — hors sujet ici) avec un
appariement à SCORE (0,5 à 1) qui s'est révélé trop permissif : le rapport
du 08/08 liste 44 propositions écartées après coup, dont plusieurs faux
amis caractérisés (« Restaurant À la maison » apparié au pub « La Maison »
à 0,8 ; « Café des Arts et Métiers » aux « Arts et Métiers » à 0,85). Ce
tour-ci, l'appariement a été **entièrement refait, plus strict** (§2) et
**téléphone + site web** n'avaient encore jamais été écrits nulle part.

Le fichier `2026-08-02_fusion_horaires_osm.sql` existant, lui, avait déjà
posé des horaires sur 132 lieux avec une règle plus permissive (elle
choisissait la plage du lundi-vendredi même quand le samedi différait
légèrement, ex. Aki Café). La règle de ce rapport est plus stricte
(§3) : elle refuse dès que les jours ne s'accordent pas EXACTEMENT sur la
plage du soir. Les deux fichiers ne se contredisent pas — `coalesce`
protège dans les deux sens — mais ce rapport-ci propose donc parfois
*moins* d'horaires que le 02/08 sur les mêmes lieux, par choix assumé.

## 2. Comment l'appariement a été fait

Pour chacun des 302 spots, recherche dans OpenStreetMap (API Overpass) des
éléments nommés (`amenity`/`leisure`/`tourism`/`shop`) à moins de **60 m**.
298 spots retombaient dans un cache déjà téléchargé le 11/07 (mêmes
coordonnées sources, requêtes `around:200m` — largement assez pour couvrir
60 m) : **pas de nouvelle requête Overpass** pour ceux-là, pour ne pas
solliciter le service pour rien. Les 4 restants (en périphérie : Saint-Ouen,
Sceaux, Boulogne, Disney Village) sont sortis du rayon du cache — une petite
requête dédiée, un spot à la fois, avec retry espacé sur trois miroirs
publics (`overpass-api.de`, `overpass.kumi.systems`, `overpass.private.coffee`)
après plusieurs 504.

Un élément OSM n'est retenu QUE si :
- son nom normalisé (minuscules, accents et ponctuation retirés) est
  **strictement identique** à celui du spot, **ou** à ce qui reste une fois
  les mots génériques de catégorie et les articles retirés des deux côtés
  (`bar`, `café`, `restaurant`, `brasserie`, `le/la/les`, `paris`… — la
  même liste que `MOTS_PASSE_PARTOUT` dans `doublons.ts`) ;
- ET il est à moins de 60 m ;
- ET c'est le SEUL candidat à ce niveau (deux candidats à égalité →
  ambigu → rien n'est rattaché — 0 cas rencontré ce tour-ci).

Aucun score, aucun recouvrement partiel de mots. C'est plus strict que
l'appariement du 08/08 (qui acceptait des correspondances à 0,6-0,85) et
ça a un coût assumé : des lieux clairement identiques mais orthographiés
différemment (« Happatei » vs OSM « Happa Teï », espace en plus) restent
non appariés. Voir §5 pour le détail.

## 3. Comment les horaires sont traduits

Nouveau module **`app/src/horairesOsm.ts`** (fonction pure
`traduireHorairesOsm`), testé dans **`app/src/__tests__/horairesOsm.test.ts`**
(23 tests). jeudi. est une app du soir : la fonction ne garde QUE la plage
qui couvre 20h, gère le passage après minuit (`18:00-02:00` → `[18, 26]`),
et **refuse plutôt que deviner** dès que :
- aucune plage ne couvre 20h (le lieu ferme avant le soir) ;
- plusieurs jours proposent des plages du soir **différentes** — la base ne
  sait stocker qu'UNE plage, elle ne peut pas mentir en choisissant un jour
  au hasard ;
- la syntaxe est trop riche pour être fiable (`sunset-sunrise`, `dusk-dawn` :
  l'heure exacte varie toute l'année, impossible à figer en décimal).

`24/7` → `[0, 24]`. Résultat : sur 110 lieux appariés qui portent un
`opening_hours` OSM, **62 se traduisent** — les 48 autres ont des horaires
qui varient réellement selon le jour (ex. `Kehribar` : `Mo-We 11:00-23:00,
Th-Sa 11:00-02:00` — vendredi soir ≠ mardi soir, refusé à raison).

## 4. Les chiffres

| | nombre | % des 302 | % des 178 appariés |
|---|---:|---:|---:|
| spots examinés | **302** | — | — |
| **appariés à OSM** | **178** | **59 %** | — |
| — dont nom strictement identique | 152 | 50 % | 85 % |
| — dont nom identique mots génériques retirés | 26 | 9 % | 15 % |
| **refusés** (rien de fiable) | 124 | 41 % | — |
| avec **téléphone** | **98** | **32 %** | **55 %** |
| avec **site web** | **112** | **37 %** | **63 %** |
| avec `opening_hours` OSM brut | 110 | 36 % | 62 % |
| avec **horaires exploitables** (traduits) | **62** | **21 %** | **35 %** |
| avec **cuisine** (tag OSM, informatif) | **70** | **23 %** | **39 %** |
| ont reçu au moins UN champ dans le SQL | **135** | **45 %** | — |

Le SQL n'écrit que téléphone, site web et horaires (la cuisine est
rapportée ici à titre indicatif : le carnet n'a pas de colonne `cuisine` —
elle est aujourd'hui déduite d'une description texte via
`app/src/typesLieu.ts`, un mécanisme différent qu'il n'était pas dans le
périmètre de cette mission de toucher).

## 5. Vingt exemples concrets

| spot | apparié à (OSM) | téléphone | site | horaires |
|---|---|---|---|---|
| Chez Michel | Chez Michel (0 m, exact) | +33 1 44 53 06 20 | restaurantchezmichel.fr | 19h → 21h30 |
| Go Oun | Go-Oun (0 m, exact) | +33 1 40 15 64 43 | resto-gooun.com | 12h → 22h30 |
| Le Hibou - Paris | Le Hibou (0 m, générique retiré) | +33143549691 | lehibou-paris.com | 7h → 2h |
| Hanoï Cà Phê Opéra | Hanoi Cà Phê Opéra (0 m, exact) | +33 1 48 78 03 61 | hanoi-caphe.com | 12h → 2h |
| Restaurant Le Céladon | Le Céladon (0 m, générique retiré) | — | leceladon.com | — (OSM ne porte pas de tag `opening_hours` pour ce lieu) |
| Brasserie Rosie | Rosie (0 m, générique retiré) | +33 1 45 70 82 39 | brasserierosie.com | — |
| Harry's Bar Paris | Harry's Bar (0 m, « paris » retiré) | — | harrysbar.fr | — |
| Tarántula Paris | Tarántula (0 m, « paris » retiré) | +33 1 43 55 90 54 | — | — |
| The Highlander Pub | The Highlander (0 m, « pub » retiré) | +33 6 31 57 88 75 | pubhighlander.com | — |
| L'Alsace | Maison de l'Alsace (5 m, génériques retirés) | +33 1 53 93 97 00 | restaurantalsace.com | — (Fr-Sa ferme à 4h, le reste de la semaine à 2h → jours non accordés, refusé) |
| Vingt Vins d'Art | Vingt Vins d'Art (0 m, exact) | — | — | 18h → minuit (`Mo-Su 18:00-24:00`) |
| Le Louis XVI | Le Louis XVI (0 m, exact) | — | lelouis16-paris.fr | 7h → 22h (le lundi ferme à 18h, avant 20h : il ne concurrence pas la plage retenue) |
| Yo | Yo ! (0 m, exact) | +33 1 47 42 00 33 | — | 19h30 → 22h30 |
| Les Antiquaires | Les Antiquaires (0 m, exact) | +33 1 42 61 08 36 | lesantiquaires.net | 7h → 2h |
| Abri Soba | Abri Soba (0 m, exact) | — | — | 19h → 22h30 |
| Aki Café | Aki Café (0 m, exact) | — | akiparis.fr | — (Mo-Fr ferme 20h30, Sa 20h30 aussi mais ouvre 1h plus tard → jours non accordés, refusé) |
| Kehribar | Kehribar (0 m, exact) | — | — | — (Th-Sa ferme à 2h, Mo-We à 23h → refusé) |
| Rex Club | Rex Club (0 m, exact) | +33 142 361096 | rexclub.com | — (ouvre 23h55, ne couvre pas 20h) |
| Balcon Paris - Galeries Lafayette | — | — | — | **refusé** : le plus proche nommé est « Cyrillus » à 27 m, un magasin différent |
| The Office | — | — | — | **refusé** : le plus proche nommé est « Calame et Parchelin » à 27 m, sans rapport |

## 6. Ce qui a été refusé, et pourquoi (124 cas, liste complète)

Deux raisons possibles : **« aucun élément OSM nommé à moins de 60 m »**
(le voisinage n'a rien à proposer, 9 cas) ou **« pas de nom
correspondant »** (il y a du monde autour, mais rien ne porte le nom du
spot — le plus proche nommé est indiqué à titre de contrôle, 115 cas).
Aucun cas « ambigu » (deux candidats à égalité) ce tour-ci.

Quelques familles reconnaissables dans la liste : les **rooftops et
lounges** (Sequoia, ROOF Paris, Maggie Rooftop, Perruche, Khayma…) — souvent
des étages d'hôtels que le mappeur a nommés par l'hôtel, pas par le bar ;
les **péniches et bateaux** (Cabaret Sauvage, Fluctuart, La Dame de Canton,
Nix Nox, PLAT/FORM…) — amarrées les unes contre les autres, OSM ne les
distingue pas toutes par leur propre nom ; les **succursales d'enseignes**
(Bouillon Chartier Grands Boulevards, Corcoran's Grands Boulevards,
O'Sullivans Franklin D. Roosevelt…) — OSM porte souvent le nom générique de
la chaîne sans le quartier, fusionner à l'aveugle risquerait de pointer sur
la MAUVAISE succursale.

<details>
<summary>Liste complète (124)</summary>

- **The Office** — pas de nom correspondant à moins de 60 m — le plus proche est « Calame et Parchelin » à 27 m, un lieu différent
- **215 Rue de Paris** — pas de nom correspondant à moins de 60 m — le plus proche est « Aparthotel Adagio access Paris Porte de Charenton » à 18 m, un lieu différent
- **Happatei** — pas de nom correspondant à moins de 60 m — le plus proche est « Happa Teï » à 0 m, un lieu différent (même lieu, mais l'écriture ne se répond pas assez pour qu'on tranche à l'aveugle)
- **Restaurant À la maison** — pas de nom correspondant à moins de 60 m — le plus proche est « Nouilles ceintures » à 0 m, un lieu différent
- **El Guacamole République** — pas de nom correspondant à moins de 60 m — le plus proche est « El Guacamole » à 0 m, un lieu différent (probable succursale — « République » n'est pas un mot générique, il précise l'adresse)
- **Le 404** — pas de nom correspondant à moins de 60 m — le plus proche est « Le Livre de Cave » à 6 m, un lieu différent
- **Brique Machine - Paris 2** — pas de nom correspondant à moins de 60 m — le plus proche est « Brique Machine - Brique House » à 0 m, un lieu différent
- **Dar Mima** — pas de nom correspondant à moins de 60 m — le plus proche est « Dar Mima - Zyriab » à 0 m, un lieu différent
- **Le 1905** — pas de nom correspondant à moins de 60 m — le plus proche est « Le Livre de Cave » à 6 m, un lieu différent
- **Les 4 soupes** — pas de nom correspondant à moins de 60 m — le plus proche est « Song Huong » à 0 m, un lieu différent
- **Le Village** — pas de nom correspondant à moins de 60 m — le plus proche est « Bibliothèque Andrée Chedid » à 14 m, un lieu différent
- **Fabula** — pas de nom correspondant à moins de 60 m — le plus proche est « Maison Letissier » à 12 m, un lieu différent
- **Clark Hot Dog** — pas de nom correspondant à moins de 60 m — le plus proche est « Clark hot dog and coffee » à 0 m, un lieu différent
- **Café des Arts et Métiers** — pas de nom correspondant à moins de 60 m — le plus proche est « Le Puy des Arts » à 0 m, un lieu différent
- **ROOF Paris** — pas de nom correspondant à moins de 60 m — le plus proche est « BoConcept » à 6 m, un lieu différent
- **Sequoia Rooftop Bar** — aucun élément OSM nommé à moins de 60 m
- **The Shed** — pas de nom correspondant à moins de 60 m — le plus proche est « Cuir-City.com » à 13 m, un lieu différent
- **Rooftop National** — pas de nom correspondant à moins de 60 m — le plus proche est « Turbigo - Française » à 12 m, un lieu différent
- **Bonnie** — pas de nom correspondant à moins de 60 m — le plus proche est « SO/ Paris Hôtel » à 5 m, un lieu différent
- **Terraza Mikuna** — pas de nom correspondant à moins de 60 m — le plus proche est « Mobicity » à 12 m, un lieu différent
- **Le Toit de la Tour** — pas de nom correspondant à moins de 60 m — le plus proche est « Le Cardinal Saint-Germain » à 17 m, un lieu différent
- **Rooftop Bar Dame des Arts** — pas de nom correspondant à moins de 60 m — le plus proche est « Thevenin » à 9 m, un lieu différent
- **Kinugawa Rive Gauche** — pas de nom correspondant à moins de 60 m — le plus proche est « Sax Paris, LXR Hotels & Resorts » à 0 m, un lieu différent
- **Terrasse du Musée d'Orsay** — pas de nom correspondant à moins de 60 m — le plus proche est « Musée d'Orsay » à 5 m, un lieu différent
- **FUGA R** — pas de nom correspondant à moins de 60 m — le plus proche est « Le Monceau » à 52 m, un lieu différent
- **Le Rooftop - Hotel Fouquet's Paris** — pas de nom correspondant à moins de 60 m — le plus proche est « Hôtel Barrière Le Fouquet's » à 7 m, un lieu différent
- **PLEY Rooftop** — pas de nom correspondant à moins de 60 m — le plus proche est « Pley Mersea » à 5 m, un lieu différent
- **Balcon Paris - Galeries Lafayette** — pas de nom correspondant à moins de 60 m — le plus proche est « Cyrillus » à 27 m, un lieu différent
- **Maggie Rooftop** — pas de nom correspondant à moins de 60 m — le plus proche est « La Marmite » à 16 m, un lieu différent
- **Perruche** — pas de nom correspondant à moins de 60 m — le plus proche est « Rives » à 35 m, un lieu différent
- **Khayma Rooftop** — pas de nom correspondant à moins de 60 m — le plus proche est « Bragard » à 31 m, un lieu différent
- **Le Perchoir Ménilmontant** — pas de nom correspondant à moins de 60 m — le plus proche est « L'Annexe Kawa Thaiti » à 13 m, un lieu différent
- **Laho Rooftop** — pas de nom correspondant à moins de 60 m — le plus proche est « La Demesure Sur Seine - Est » à 35 m, un lieu différent
- **TOO TacTac Skybar** — pas de nom correspondant à moins de 60 m — le plus proche est « Le Salers » à 6 m, un lieu différent
- **Skybar Paris Rooftop** — aucun élément OSM nommé à moins de 60 m
- **ILVOLO Bar Rooftop** — pas de nom correspondant à moins de 60 m — le plus proche est « Janne Jao spa » à 26 m, un lieu différent
- **Villa M Rooftop** — pas de nom correspondant à moins de 60 m — le plus proche est « Villa M » à 7 m, un lieu différent
- **Brach Rooftop** — pas de nom correspondant à moins de 60 m — le plus proche est « SieMatic » à 12 m, un lieu différent
- **L'Oiseau Blanc** — pas de nom correspondant à moins de 60 m — le plus proche est « Heschung » à 5 m, un lieu différent
- **La Suite Girafe** — pas de nom correspondant à moins de 60 m — le plus proche est « Statue Equestre du Maréchal Ferdinand Foch » à 13 m, un lieu différent
- **Restaurant Toit Terrasse Molitor** — pas de nom correspondant à moins de 60 m — le plus proche est « Jean Bouin » à 38 m, un lieu différent
- **Bar a Bulles** — pas de nom correspondant à moins de 60 m — le plus proche est « L'Atelier du Sourcil » à 10 m, un lieu différent
- **Coeur Sacre** — pas de nom correspondant à moins de 60 m — le plus proche est « Chevalier de La Barre » à 18 m, un lieu différent
- **Station M by Maison Montmartre** — pas de nom correspondant à moins de 60 m — le plus proche est « Hôtel Maison Montmartre » à 13 m, un lieu différent
- **Terrass'' Rooftop Bar** — pas de nom correspondant à moins de 60 m — le plus proche est « Le Bouclard » à 21 m, un lieu différent
- **Le Toit de La Bellevilloise** — pas de nom correspondant à moins de 60 m — le plus proche est « Centre social et culturel Archipelia » à 16 m, un lieu différent
- **Mama Shelter Paris East Rooftop** — pas de nom correspondant à moins de 60 m — le plus proche est « Il Sorriso » à 11 m, un lieu différent
- **Skyline Paris Lounge & Bar** — pas de nom correspondant à moins de 60 m — le plus proche est « Exki » à 37 m, un lieu différent
- **CopperBay** — pas de nom correspondant à moins de 60 m — le plus proche est « Copper Bay » à 7 m, un lieu différent
- **Harry's New York Bar** — pas de nom correspondant à moins de 60 m — le plus proche est « Harry's Bar » à 5 m, un lieu différent
- **T7 Paris** — aucun élément OSM nommé à moins de 60 m
- **Cabaret Sauvage** — pas de nom correspondant à moins de 60 m — le plus proche est « La Péniche cinéma » à 0 m, un lieu différent
- **La Gare - Le Gore** — pas de nom correspondant à moins de 60 m — le plus proche est « Banque Populaire » à 7 m, un lieu différent
- **Rosa Bonheur sur Seine** — pas de nom correspondant à moins de 60 m — le plus proche est « Néréide » à 16 m, un lieu différent
- **Fluctuart** — pas de nom correspondant à moins de 60 m — le plus proche est « Parking handicapé » à 28 m, un lieu différent
- **La Dame de Canton** — pas de nom correspondant à moins de 60 m — le plus proche est « Piscine Joséphine Baker » à 41 m, un lieu différent
- **Peniche Antipode** — pas de nom correspondant à moins de 60 m — le plus proche est « Seine - Flandre » à 43 m, un lieu différent
- **Le Marcounet** — pas de nom correspondant à moins de 60 m — le plus proche est « Les Maquereaux » à 0 m, un lieu différent
- **Bateau Phare** — pas de nom correspondant à moins de 60 m — le plus proche est « Piscine Joséphine Baker » à 41 m, un lieu différent
- **La Javelle** — pas de nom correspondant à moins de 60 m — le plus proche est « Icicycle » à 26 m, un lieu différent
- **Rosa Bonheur Buttes Chaumont** — pas de nom correspondant à moins de 60 m — le plus proche est « Rosa Bonheur » à 0 m, un lieu différent
- **Jardin21** — pas de nom correspondant à moins de 60 m — le plus proche est « Mia Mao » à 0 m, un lieu différent
- **La Cite Fertile** — pas de nom correspondant à moins de 60 m — le plus proche est « La Source » à 39 m, un lieu différent
- **Kodawari Ramen** — pas de nom correspondant à moins de 60 m — le plus proche est « Galerie Cyril Guernieri » à 3 m, un lieu différent
- **Bouillon Chartier Grands Boulevards** — pas de nom correspondant à moins de 60 m — le plus proche est « Bouillon Chartier » à 0 m, un lieu différent (succursale — même nom que l'enseigne mère, pas fusionné à l'aveugle)
- **Frenchie Bar a Vins** — pas de nom correspondant à moins de 60 m — le plus proche est « Terroirs d'Avenir » à 3 m, un lieu différent
- **Le Mary Celeste** — pas de nom correspondant à moins de 60 m — le plus proche est « noyoco » à 7 m, un lieu différent
- **Guy Savoy** — pas de nom correspondant à moins de 60 m — le plus proche est « Hôtel de la Monnaie » à 27 m, un lieu différent
- **Plenitude** — pas de nom correspondant à moins de 60 m — le plus proche est « Limbar » à 0 m, un lieu différent
- **Club Coca-Cola - Quai de la Photo** — pas de nom correspondant à moins de 60 m — le plus proche est « Quai de la photo » à 0 m, un lieu différent
- **La Communale Saint-Ouen** — pas de nom correspondant à moins de 60 m — le plus proche est « Sushi Shop » à 0 m, un lieu différent
- **Le Grand Rex - Iconic Club** — pas de nom correspondant à moins de 60 m — le plus proche est « Le Grand Rex » à 8 m, un lieu différent
- **La Felicità** — pas de nom correspondant à moins de 60 m — le plus proche est « Halle Freyssinet - Station F » à 4 m, un lieu différent
- **Jardin de la Ménagerie - Sceaux** — pas de nom correspondant à moins de 60 m — le plus proche est « Ancienne Mairie » à 6 m, un lieu différent
- **Central Chapelle** — pas de nom correspondant à moins de 60 m — le plus proche est « Gymnase Aimée Lallement » à 3 m, un lieu différent
- **La Cité Fertile** — pas de nom correspondant à moins de 60 m — le plus proche est « La Source » à 39 m, un lieu différent
- **Atelier des Lumières - Hisense Stadium Experience** — pas de nom correspondant à moins de 60 m — le plus proche est « Atelier des Lumières » à 3 m, un lieu différent
- **Dopo Boulogne** — pas de nom correspondant à moins de 60 m — le plus proche est « Dopo » à 0 m, un lieu différent
- **Sports Bar & Lounge Disney Village** — aucun élément OSM nommé à moins de 60 m
- **McBride's Irish Pub** — pas de nom correspondant à moins de 60 m — le plus proche est « Mc Brides » à 0 m, un lieu différent
- **La Victoire** — pas de nom correspondant à moins de 60 m — le plus proche est « Havanita Café » à 3 m, un lieu différent
- **Brussels Beer Project Canal** — pas de nom correspondant à moins de 60 m — le plus proche est « Carte blanche » à 8 m, un lieu différent
- **Le Bar Fondamental - Pigalle** — pas de nom correspondant à moins de 60 m — le plus proche est « Le Bar Fondamental (LBF) » à 5 m, un lieu différent
- **Pub Saint-Hilaire** — pas de nom correspondant à moins de 60 m — le plus proche est « CNRS UMR PRODIG - Université Paris 1 Panthéon-Sorbonne » à 1 m, un lieu différent
- **The Auld Alliance** — pas de nom correspondant à moins de 60 m — le plus proche est « Samsara Baz Art » à 8 m, un lieu différent
- **The Hideout Paris Gare du Nord** — pas de nom correspondant à moins de 60 m — le plus proche est « The Hide Out Station » à 6 m, un lieu différent
- **O'Sullivans Franklin D. Roosevelt** — pas de nom correspondant à moins de 60 m — le plus proche est « O'Sullivans » à 15 m, un lieu différent (succursale)
- **Corcoran's Grands Boulevards** — pas de nom correspondant à moins de 60 m — le plus proche est « Ici Librairie » à 10 m, un lieu différent
- **Corcoran's Sacré-Cœur** — pas de nom correspondant à moins de 60 m — le plus proche est « Le Corcoran's Sacré Coeur » à 39 m, un lieu différent (trop loin pour 60 m malgré le nom presque identique)
- **Le Bateau Phare** — pas de nom correspondant à moins de 60 m — le plus proche est « Piscine Joséphine Baker » à 41 m, un lieu différent
- **Nix Nox** — pas de nom correspondant à moins de 60 m — le plus proche est « Piscine Joséphine Baker » à 41 m, un lieu différent
- **Péniche Antipode** — pas de nom correspondant à moins de 60 m — le plus proche est « Seine - Flandre » à 43 m, un lieu différent
- **Les Nautes** — pas de nom correspondant à moins de 60 m — le plus proche est « Célestins Market » à 21 m, un lieu différent
- **Le Son de la Terre** — pas de nom correspondant à moins de 60 m — le plus proche est « Notre-Dame » à 7 m, un lieu différent
- **Nanna** — pas de nom correspondant à moins de 60 m — le plus proche est « Notre-Dame » à 7 m, un lieu différent
- **Sena** — aucun élément OSM nommé à moins de 60 m
- **Flow Paris** — pas de nom correspondant à moins de 60 m — le plus proche est « Néréide » à 16 m, un lieu différent
- **Noti Plage** — aucun élément OSM nommé à moins de 60 m
- **Bonnotte Club** — pas de nom correspondant à moins de 60 m — le plus proche est « Noti Club » à 51 m, un lieu différent
- **Bal de la Marine** — pas de nom correspondant à moins de 60 m — le plus proche est « Noti Club » à 51 m, un lieu différent
- **Annette K** — pas de nom correspondant à moins de 60 m — le plus proche est « Port de Javel-Bas » à 26 m, un lieu différent
- **Quai Liberté** — pas de nom correspondant à moins de 60 m — le plus proche est « La Plage Parisienne » à 15 m, un lieu différent
- **Le Calife** — pas de nom correspondant à moins de 60 m — le plus proche est « La Ville de Paris » à 18 m, un lieu différent
- **Ducasse sur Seine** — aucun élément OSM nommé à moins de 60 m
- **Eiffel Croisières - Péniche Ivoire** — pas de nom correspondant à moins de 60 m — le plus proche est « La France à la Renaissance » à 6 m, un lieu différent
- **L'Instant sur Seine - 16e** — pas de nom correspondant à moins de 60 m — le plus proche est « La Jeune Vendangeuse » à 44 m, un lieu différent
- **PLAT/FORM** — pas de nom correspondant à moins de 60 m — le plus proche est « Piscine Joséphine Baker » à 41 m, un lieu différent
- **River's King** — pas de nom correspondant à moins de 60 m — le plus proche est « Restaurant administratif Jussieu » à 25 m, un lieu différent
- **Yachts de Paris** — pas de nom correspondant à moins de 60 m — le plus proche est « Port Henri-IV » à 59 m, un lieu différent
- **Polpo Plage / Polpo Brasserie** — pas de nom correspondant à moins de 60 m — le plus proche est « Polpo - Restaurant » à 0 m, un lieu différent
- **Brasserie Aqua** — pas de nom correspondant à moins de 60 m — le plus proche est « SKEMA Business School – Campus Grand Paris » à 3 m, un lieu différent
- **La Javelle Tavern** — aucun élément OSM nommé à moins de 60 m
- **Quai Sauvage** — pas de nom correspondant à moins de 60 m — le plus proche est « Port de Tolbiac » à 22 m, un lieu différent
- **Le Barboteur** — pas de nom correspondant à moins de 60 m — le plus proche est « Restaurant La Mama » à 12 m, un lieu différent
- **Vedettes de Paris** — aucun élément OSM nommé à moins de 60 m
- **Le Signac** — pas de nom correspondant à moins de 60 m — le plus proche est « La Jeune Vendangeuse » à 44 m, un lieu différent
- **Concorde Atlantique** — pas de nom correspondant à moins de 60 m — le plus proche est « La Demesure Sur Seine - Ouest » à 11 m, un lieu différent
- **Le Diamant Bleu** — pas de nom correspondant à moins de 60 m — le plus proche est « Le Jardin Sauvage » à 0 m, un lieu différent
- **Le Mary Céleste** — pas de nom correspondant à moins de 60 m — le plus proche est « National standard » à 1 m, un lieu différent
- **Le Comptoir Général** — pas de nom correspondant à moins de 60 m — le plus proche est « Lycée Bossuet Notre-Dame » à 22 m, un lieu différent
- **Bisou** — pas de nom correspondant à moins de 60 m — le plus proche est « Le temps des rêves » à 8 m, un lieu différent
- **Septime La Cave** — pas de nom correspondant à moins de 60 m — le plus proche est « Crèche » à 21 m, un lieu différent
- **Le Syndicat** — pas de nom correspondant à moins de 60 m — le plus proche est « MAC Cosmetics » à 4 m, un lieu différent
- **La Buvette** — pas de nom correspondant à moins de 60 m — le plus proche est « Casablanca » à 57 m, un lieu différent

</details>

**Note en passant** (hors périmètre de cette mission, à trancher par
ailleurs) : la liste source contient encore quelques quasi-doublons visibles
dans les refus ci-dessus — « Peniche Antipode » ET « Péniche Antipode »,
« La Cite Fertile » ET « La Cité Fertile » figurent chacun deux fois. C'est
exactement le problème que `doublons.ts` corrige À LA LECTURE côté app (ils
n'apparaîtront donc qu'une fois sur la carte) — mais ça explique pourquoi ce
rapport voit 302 lignes sources là où la carte n'en affiche que 300.

## 7. Colonnes manquantes en base — À FAIRE PAR ERSAN

`telephone` et `site_web` **n'existent pas** dans `public.lieux` (vérifié
dans les 17 migrations de `supabase/migrations/`). Le fichier SQL les crée
en tête (`alter table … add column if not exists`) — **il faut donc coller
`osm_2026-08-09.sql` en entier**, l'ajout de colonnes fait partie du même
fichier, pas une migration séparée à faire avant.

## 8. Attribution

Les données viennent d'**OpenStreetMap**, sous licence **ODbL**
(© les contributeurs OpenStreetMap — openstreetmap.org/copyright). Si
l'app affiche un jour téléphone/site/horaires tirés de cet enrichissement,
une mention « données © OpenStreetMap » quelque part dans l'app (page à
propos / mentions légales suffit, pas besoin sur chaque fiche) est requise
par la licence.

## 9. Vérifications

Depuis `app/` : `npx tsc -b --noEmit` → aucune erreur. `npx vitest run` →
**429 tests passent** (406 existants + 23 nouveaux pour
`horairesOsm.test.ts`).

## Fichiers produits

- `app/src/horairesOsm.ts` — le traducteur (fonction pure)
- `app/src/__tests__/horairesOsm.test.ts` — ses tests (23)
- `_enrichissement/osm_2026-08-09.sql` — à relire puis coller à la main
- `_enrichissement/rapport_osm_2026-08-09.md` — ce rapport
