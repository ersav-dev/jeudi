# Fusion de l'enrichissement — 2026-08-08

Croisement OSM + packs GPT + Google Places sur le fond du carnet, pour
poser un **type** et une **cuisine** fiables sur chaque spot, et combler
les horaires manquants. Rien n'a été appliqué à la base : ce rapport
accompagne `fusion_2026-08-08.sql`, à coller à la main dans le SQL Editor.

## Ce qui rentre

| source | lieux connus | état |
|---|---|---|
| Google Places | 0 | **pas de clé** — `google_resultats.json` absent, la branche existe et attend |
| OpenStreetMap | 237 | lu (`osm_resultats.json`) |
| packs GPT | 0 | **pas encore renvoyés** — `gpt_reponses/` absent, la lecture est prête |

Base supposée : les 302 lieux de `2026-08-01_import_ersan_v2_tout.sql`,
dont 128 ont déjà reçu leurs horaires le 02/08.

## Les chiffres

| | |
|---|---|
| spots du fond examinés | **302** |
| couverts par au moins une source | **230** (76 %) |
| descriptions réécrites | **12** |
| — dont changement de type (donc de glyphe) | **6** |
| — dont pose d'un tampon de cuisine | **5** |
| horaires ajoutés | **2** |
| abstentions (saisie existante protégée) | **29** |
| désaccords entre sources arbitrés | **0** |
| aucune source | 72 |

## Comment les désaccords sont tranchés

Priorité **Google > OSM > GPT**, champ par champ (type, cuisine, horaires
sont arbitrés séparément — une source peut gagner sur l'un et perdre sur
l'autre). La source la mieux classée qui a un avis décide ; les autres
sont notées, jamais effacées en silence.

Aucun désaccord ce tour-ci : une seule source parle à la fois (Google et GPT sont absents). C'est le cas facile — la règle est en place pour le jour où ils arrivent.

## Ce qui change, nom par nom

### Descriptions réécrites (12)

| lieu | avant | après | ce que ça gagne | appariement |
|---|---|---|---|---|
| Menekse | `Restaurant` | `Restaurant turc` | tampon — → TUR (source OSM) | 1.00 |
| Le Louis XVI | _(vide)_ | `Restaurant` | description absente (source OSM) | 1.00 |
| Pide Paris | `Turque` | `Street food turc` | type resto → street, tampon — → TUR (source OSM) | 1.00 |
| Hanoï Cà Phê Opéra | `Vietnamienne` | `Bar vietnamien` | type resto → bar (source OSM) | 1.00 |
| Express de Lyon | `Brasserie` | `Café` | type resto → cafe (source OSM) | 1.00 |
| DAROCO 16 | _(vide)_ | `Restaurant italien` | tampon — → ITA, description absente (source OSM) | 1.00 |
| Ebis | `Fusion asiatique` | `Restaurant japonais` | tampon — → JPN (source OSM) | 1.00 |
| L'Auberge Café | _(vide)_ | `Restaurant` | description absente (source OSM) | 1.00 |
| Atelier du veau | _(vide)_ | `Street food turc` | type resto → street, tampon — → TUR, description absente (source OSM) | 1.00 |
| Café Blanc | `Française` | `Café` | type resto → cafe (source OSM) | 1.00 |
| Griffon | `Restaurant` | `Café` | type resto → cafe (source OSM) | 1.00 |
| Cheper | _(vide)_ | `Restaurant` | description absente (source OSM) | 1.00 |

### Horaires ajoutés (2)

| lieu | ouverture | fermeture | source |
|---|---|---|---|
| Club Coca-Cola - Quai de la Photo | 12 | 23.5 | OSM |
| Quai de la Photo | 12 | 23.5 | OSM |

## Les abstentions — ce qu'on refuse de toucher

Une description déjà écrite prime **toujours**, même contre une source.
Elle en dit plus qu'une étiquette, et ce n'est pas au script de décider
qu'il écrit mieux qu'Ersan.

- **Duplex Bar** — étiquette porteuse d'un détail qu'on ne sait pas reformuler — à trancher à la main
- **No Scrum No Win - Bar Rugby** — étiquette porteuse d'un détail qu'on ne sait pas reformuler — à trancher à la main
- **Clark Hot Dog** — étiquette porteuse d'un détail qu'on ne sait pas reformuler — à trancher à la main
- **Le Petit Dakar** — étiquette porteuse d'un détail qu'on ne sait pas reformuler — à trancher à la main
- **Lavomatic** — description rédigée conservée — OSM aurait dit bar
- **No Entry** — description rédigée conservée — OSM aurait dit bar
- **Fréquence** — description rédigée conservée — OSM aurait dit bar
- **Kilometre25** — description rédigée conservée — OSM aurait dit club
- **Ground Control** — description rédigée conservée — OSM aurait dit street
- **Le Pavillon des Canaux** — description rédigée conservée — OSM aurait dit cafe
- **Urfa Durum** — description rédigée conservée — OSM aurait dit resto/TUR
- **L'As du Fallafel** — description rédigée conservée — OSM aurait dit resto/ISR
- **Chez Alain Miam Miam** — description rédigée conservée — OSM aurait dit cafe
- **Taco Mesa** — description rédigée conservée — OSM aurait dit street/MEX
- **Best Tofu** — description rédigée conservée — OSM aurait dit street
- **Le Mary Celeste** — description rédigée conservée — OSM aurait dit bar/ESP
- **La Palette** — description rédigée conservée — OSM aurait dit cafe
- **Cafe de Flore** — description rédigée conservée — OSM aurait dit cafe
- **Les Deux Magots** — description rédigée conservée — OSM aurait dit cafe
- **Datil** — description rédigée conservée — OSM aurait dit gastro
- **The French Flair** — description rédigée conservée — OSM aurait dit bar
- **L'Atalante** — description rédigée conservée — OSM aurait dit bar
- **KIEZ Biergarten Montmartre** — description rédigée conservée — OSM aurait dit bar
- **Mez Beer** — description rédigée conservée — OSM aurait dit bar
- **Octopussy** — description rédigée conservée — OSM aurait dit bar
- **Team Brothers** — description rédigée conservée — OSM aurait dit cafe
- **Le Nouvel Institut** — description rédigée conservée — OSM aurait dit cafe
- **The Frog & Rosbif** — description rédigée conservée — OSM aurait dit cafe
- **Stany's** — description rédigée conservée — OSM aurait dit bar

## Les freins — ce que les sources ont proposé et qu'on a refusé

Un appariement OSM n'est pas une preuve : il repose sur un nom
approchant et une distance. Entre 0,60 et 0,85 il se trompe de voisin
(« Restaurant À la maison » apparié au pub « La Maison », « Café des
Arts et Métiers » aux « Arts et Métiers » à 72 m). Deux règles filtrent
donc les propositions avant écriture :

- **renverser un type déjà écrit exige 0.9** d'appariement, poser un
  tampon de cuisine 0.8, remplir une description vide 0.7 ;
- **jamais de retour au générique** : `resto` est ce que `typeDeLieu()`
  répond quand il ne sait pas, et `amenity=restaurant` n'en dit pas plus.
  Une source ne peut donc pas rétrograder en `resto` un lieu qui disait
  déjà mieux — c'est ce qui aurait transformé Akrame, étoilé, en
  « Restaurant ».

44 proposition(s) écartée(s) :

- **Restaurant À la maison** — type resto → bar refusé : appariement OSM à 0.8 (< 0.9)
- **Le Hibou - Paris** — type resto → cafe refusé : appariement OSM à 0.8 (< 0.9)
- **Restaurant Akrame** — type gastro → resto refusé : on ne rétrograde pas vers le générique
- **El Guacamole République** — type resto → street refusé : appariement OSM à 0.8 (< 0.9)
- **Brique Machine - Paris 2** — type resto → bar refusé : appariement OSM à 0.6 (< 0.9)
- **Clark Hot Dog** — type resto → street refusé : appariement OSM à 0.8 (< 0.9)
- **Café des Arts et Métiers** — type resto → cafe refusé : appariement OSM à 0.85 (< 0.9)
- **Le Tout-Paris** — type gastro → resto refusé : on ne rétrograde pas vers le générique
- **Terraza Mikuna** — type bar → resto refusé : appariement OSM à 0.85 (< 0.9)
- **Auteuil Brasserie** — type bar → resto refusé : on ne rétrograde pas vers le générique
- **La Suite Girafe** — type the → resto refusé : appariement OSM à 0.56 (< 0.9)
- **Bar a Bulles** — type resto → bar refusé : appariement OSM à 0.85 (< 0.9)
- **Coeur Sacre** — type resto → bar refusé : appariement OSM à 0.6 (< 0.9)
- **Station M by Maison Montmartre** — type cafe → bar refusé : appariement OSM à 0.6 (< 0.9)
- **Serpent a Plume** — type bar → resto refusé : on ne rétrograde pas vers le générique
- **Djoon Club** — type club → resto refusé : on ne rétrograde pas vers le générique
- **La Gare - Le Gore** — type club → bar refusé : appariement OSM à 0.85 (< 0.9)
- **Petit Bain** — type club → resto refusé : on ne rétrograde pas vers le générique
- **Rosa Bonheur sur Seine** — type resto → bar refusé : appariement OSM à 0.7 (< 0.9)
- **Le Mazette** — type club → resto refusé : on ne rétrograde pas vers le générique
- **Miznon** — type street → resto refusé : on ne rétrograde pas vers le générique
- **Taco Mesa** — type street → resto refusé : on ne rétrograde pas vers le générique
- **Petit Bao** — type street → resto refusé : on ne rétrograde pas vers le générique
- **Septime** — type gastro → resto refusé : on ne rétrograde pas vers le générique
- **Clamato** — type bar → resto refusé : on ne rétrograde pas vers le générique
- **Frenchie Bar a Vins** — type vin → resto refusé : appariement OSM à 0.8 (< 0.9)
- **Le Mary Celeste** — type bar → resto refusé : appariement OSM à 0.85 (< 0.9)
- **Guy Savoy** — type gastro → resto refusé : appariement OSM à 0.85 (< 0.9)
- **Arpege** — type gastro → resto refusé : on ne rétrograde pas vers le générique
- **Club Coca-Cola - Quai de la Photo** — type club → bar refusé : appariement OSM à 0.8 (< 0.9)
- **Belushi's Paris Canal** — type resto → bar refusé : appariement OSM à 0.6 (< 0.9)
- **O'Sullivans Franklin D. Roosevelt** — type club → resto refusé : appariement OSM à 0.8 (< 0.9)
- **Corcoran's Sacré-Cœur** — type club → bar refusé : appariement OSM à 0.6 (< 0.9)
- **Nix Nox** — type resto → bar refusé : appariement OSM à 0.7 (< 0.9)
- **Les Nautes** — type resto → bar refusé : appariement OSM à 0.85 (< 0.9)
- **Le Son de la Terre** — type club → bar refusé : appariement OSM à 0.85 (< 0.9)
- **La Nouvelle Seine** — type club → resto refusé : on ne rétrograde pas vers le générique
- **Flow Paris** — type club → bar refusé : appariement OSM à 0.68 (< 0.9)
- **Annette K** — type club → bar refusé : appariement OSM à 0.7 (< 0.9)
- **Quai Liberté** — type resto → bar refusé : appariement OSM à 0.85 (< 0.9)
- **PLAT/FORM** — type club → bar refusé : appariement OSM à 0.7 (< 0.9)
- **Polpo Plage / Polpo Brasserie** — type bar → resto refusé : appariement OSM à 0.8 (< 0.9)
- **Maison Jaune** — type bar → resto refusé : on ne rétrograde pas vers le générique
- **Concorde Atlantique** — type resto → bar refusé : appariement OSM à 0.85 (< 0.9)

## La double sécurité

1. **Au moment de décider** : le script ne réécrit que les descriptions
   vides, aberrantes (un code postal égaré) ou les étiquettes brutes
   ramenées de Google Maps — reconnaissables à leur forme (≤ 40 caractères,
   capitalisées, sans point final) et présentes dans une liste blanche
   explicite. Tout le reste est classé « rédigée » et laissé tel quel.
   Dans le doute, il classe « rédigée ».
2. **Au moment d'appliquer** : chaque `UPDATE` porte
   `and l.description is not distinct from d.avant`. Si la base a bougé
   depuis la génération, la ligne est simplement sautée. Le SQL peut être
   rejoué sans risque : la seconde fois, il ne trouve plus rien à faire.

Les horaires gardent la même prudence que le 02/08 :
`and l.horaire_ouv is null and l.horaire_ferm is null`.

## Vocabulaire respecté

Les types écrits sont pris dans les 10 de `app/src/typesLieu.ts`
(bar, vin, club, cafe, the, glace, patisserie, street, gastro, resto) et les tampons dans les 21 codes trois lettres du même fichier.
Le script **importe** ces fonctions au lieu d'en recopier les règles, puis
**relit** chaque description qu'il propose avec `typeDeLieu()` et
`cuisineDeLieu()` : si la relecture ne rend pas exactement le type et le
tampon visés, la ligne n'est pas écrite. 0 proposition(s) écartée(s) ainsi.

La cuisine française ne reçoit pas de tampon — on ne tamponne pas son
propre passeport (26 lieu(x) concerné(s) ce tour-ci).

## Répartition des types visés

- resto (`resto`) : 102
- bar (`bar`) : 78
- café (`cafe`) : 13
- rapido (`street`) : 9
- club (`club`) : 8
- grande table (`gastro`) : 4
- glacier (`glace`) : 1


## Et quand Google arrivera

Poser la clé dans `.google_key`, lancer `enrichir_google.mjs`, puis
relancer ce script : `google_resultats.json` sera lu automatiquement et
passera devant OSM dans tous les arbitrages. Même chose pour les packs :
déposer les réponses dans `gpt_reponses/pack_NN.json` et relancer. Aucune
ligne de ce script n'est à retoucher.
