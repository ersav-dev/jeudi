# CHANTIER — les quartiers dessinés
*Cadrage du 13/08/2026 depuis la note d'Ersan. RIEN n'est codé. La session
qui s'y attaque (prévue : Opus, maquettes d'abord) démarre ICI — pas besoin
de redécouvrir le terrain.*

> « Je pense à dessiner un quartier en mode dessin comme l'outil lasso de
> Photoshop. Et après c'est une forme Bézier et on peut ajouter des points…
> Et mettre une couleur… qui va affecter les rues. Et si on dézoome, la
> zone en opacité genre 20, qui remplit la zone. Genre Neighborhood Map ! »
> — la note d'Ersan, 13/08

---

## La vision

**Ton Paris, annoté à la main.** On dessine une zone au doigt — « mon
quartier », « coin à touristes », « jamais après minuit », « le triangle
d'or des apéros » — on lui donne une couleur et un mot. La zone TEINTE LES
RUES qu'elle contient (au lieu du gris du fond) ; au dézoom elle devient un
aplat léger (~20 % d'opacité) avec son nom.

Référence : Hoodmaps — mais à l'envers. Hoodmaps est un graffiti PUBLIC et
moqueur ; ici c'est **personnel**, comme les stickers : ton carnet, tes
zones, ta lecture de la ville. Zéro modération à écrire tant que rien
n'est partagé (la règle n°1 des stickers s'applique telle quelle).

Aucune app de sorties n'a ça. Et ça s'emboîte avec le reste : une zone
peut porter une **note** (la 3ᵉ entrée du « + », voir CHANTIER_STICKERS) ;
la recherche pourra un jour comprendre « dans mon quartier ».

## LA question de design : les outils de dessin
*(TRANCHÉE le 13/08 au soir — voir la section « TRANCHÉ PAR ERSAN » plus
bas. Ce qui suit est le cadrage d'origine, gardé pour la mémoire du
raisonnement : deux des quatre outils sont morts, et le choix est descendu
dans le point.)*

C'est le cœur de la session maquettes. Quatre outils envisagés (les mots
d'Ersan) — à trancher SUR PLANCHE, pas en l'air :
1. **le lasso** — tracé libre au doigt, fermé automatiquement, puis
   simplifié en Bézier éditable (on peut reprendre chaque point) ;
2. **la plume** — point par point, façon Illustrator : précis, mais
   exigeant au pouce sur téléphone ;
3. **les traits droits** — polygone par taps successifs : le plus simple
   au doigt, le moins « carnet » visuellement ;
4. **la forme libre** — le lasso sans simplification : brut, très carnet,
   mais illisible en petit et lourd en points.

Piste de reco à vérifier en maquette : **le lasso qui se lisse** (dessin
libre → simplification douce → poignées éditables) = le geste naturel du
doigt AVEC la précision de la plume après coup. Les traits droits en mode
secondaire (un toggle « au cordeau »).

À dessiner aussi : la palette (combien de couleurs ? les encres du carnet,
jamais un color-picker RGB), l'étiquette de la zone (Caveat, posée où ?),
le geste d'édition (tap sur la zone → poignées), la suppression, le cap
(combien de zones avant que la carte redevienne un mur ? ~8 ?).

## La faisabilité technique (vérifiée le 13/08, pour rassurer la session)

- **Teinter les rues d'une zone** : ⚠ CORRIGÉ LE 13/08 (session maquettes).
  Le filtre `within` suppose des tuiles VECTORIELLES — or `Carte.tsx:129`
  charge `dark_all` de CARTO en **raster** : une image, qu'aucune expression
  ne peut repeindre. Deux voies, tranchées sur la planche 3 :
  **A** passer le fond au style vectoriel gratuit « Dark Matter » de CARTO
  (sans clé, vérifié le 13/08 : couches `road_*_fill` présentes) → `within`
  fait alors exactement ce que décrit la note ; **B** garder le raster et
  teinter par une copie de la carte découpée au polygone (`clip-path`),
  éclaircie puis multipliée par l'encre — ça marche (c'est ce que montrent
  les planches), mais ça teinte aussi le bâti et les libellés.
- **L'aplat au dézoom** : une couche fill classique, opacité interpolée
  par zoom (le motif existe partout dans Carte.tsx).
- **Le stockage** : local d'abord, SCOPÉ PAR COMPTE (la leçon de la
  relecture du 12/08 — motif `<uid>:…` de mesMonuments/stickers), GeoJSON
  dans IndexedDB. Cloud plus tard, owner-only, comme les stickers.
- **Le dessin au doigt** : capter le tracé sur un canvas au-dessus de la
  carte (la carte gelée pendant le dessin), simplification Douglas-Peucker
  (une fonction pure, testable), puis conversion en polygone GeoJSON.
- **Le morceau le plus dur** : l'ÉDITION (poignées draggables sur la
  carte) — c'est lui qui mérite le plus de soin en maquette, et il peut
  être une v2 (v1 : on redessine, on ne retouche pas).

## L'ordre proposé

1. **Session maquettes (Opus, avec Ersan)** : les 4 outils comparés sur
   planche — le geste de dessin, la palette, l'étiquette, l'édition.
   Livrable : `design/quartiers_001.html` (ou PNG — les planches HTML ne
   passent pas toujours chez Ersan, prévoir l'export image).
2. Ersan tranche l'outil et la palette.
3. Session code : le module pur (simplification, GeoJSON) + le dessin +
   le rendu (within + fill) + la gestion (liste, suppression).
4. v2 : l'édition par poignées, la note manuscrite sur zone, « dans mon
   quartier » dans la recherche.

## Les maquettes (13/08, session Opus) — ce que les planches proposent

Quatre planches PNG (+ leurs sources HTML et le socle `_socle_planche.css` /
`_socle_carte.js`). Le fond n'est pas un croquis : ce sont **les vraies
tuiles de l'app** (CARTO dark, © OpenStreetMap, mises en cache dans
`design/_tuiles/`), quartier République ↔ Oberkampf ↔ Parmentier, tout à
l'échelle **1:1** (272 px de planche = 272 px de téléphone).

1. `design/quartiers_outils_001.png` — **deux outils, pas quatre.** Le lasso
   qui se lisse est le geste par défaut ; la **forme libre n'est pas un
   outil** mais un cran de lissage (souple ↔ net) dans la fiche de la zone ;
   la **plume est écartée** (le doigt masque le point qu'il pose, et sa
   précision est déjà rendue par les poignées, après coup) ; les **traits
   droits restent en second**, sous un bouton « au cordeau » (le mode qui
   marche debout, à une main).
2. `design/quartiers_encres_001.png` — **six encres nommées** (bleu de
   Prusse, vert-de-gris, violet d'aniline, ocre brûlée, rose indien,
   graphite), jamais un nuancier. **Une encre = une zone** : la palette
   REMPLACE le cap arbitraire des « ~8 zones » — pour en dessiner une
   septième, on en rature une. La cire et le bleu jeudi restent dehors :
   ils ont déjà un métier.
3. `design/quartiers_zone_001.png` — **le contour ne s'annonce pas** (arbitrage
   d'Ersan, 13/08) : au repos 1,4 px à 38 % — c'est la TEINTE qui porte la
   zone, pas le trait ; il ne se réveille (2,2 px, pleine encre) que **sous
   le doigt**, le temps du contact + 150 ms. Et la zone finie sur la carte
   habitée :
   la teinte des rues dit « chez moi » avant le mot ; **fondu croisé**
   teinte ↓ / aplat ↑ entre z14,5 et z13,5 ; l'aplat à **28 %** plutôt que
   20 (à 20 % la zone tient grâce au contour, pas par sa forme) ; le mot en
   Caveat, posé, tourné de 4,5°.
4. `design/quartiers_edition_001.png` — **on ne retouche pas, on refait**
   (l'ancien tracé reste en fantôme et sert de guide ; le mot, l'encre et la
   note survivent), et **on efface en raturant** : appui long, le trait de
   cire se tire, il se rétracte si on lâche — pas de modale « êtes-vous
   sûr ? ». Les poignées passent en v2, avec une règle d'écartement
   (32 px mini à l'écran, sinon on ne saisit jamais celle qu'on vise).

5. `design/quartiers_lettres_001.png` — **le nom du quartier ne s'écrit pas,
   il se compose** (demande d'Ersan, 13/08) : des lettres-objets qu'on pose
   sur la carte, comme des stickers. Pipeline en place —
   `design/lettres/_gen_lettre.html` sort **un PNG par caractère** (fond
   transparent, @2x) ; **les perles sont faites en entier** (41 fichiers :
   A–Z, 0–9, ♥ & ! # ☺), les trois autres familles (les touches, les
   découpées, les timbres) sont à l'échantillon. Détail des recettes et des
   règles de pose : `design/lettres/REFERENCES.md`. Le Caveat ne meurt pas :
   il garde la note en marge — l'une nomme, l'autre commente.

## TRANCHÉ PAR ERSAN — 13/08 au soir

**La correction qui commande tout (et qui vaut mieux que ma reco) :**
« je veux un outil plume et un lasso… et à chaque point, on choisit si on
veut un angle 90 degrés ou une courbe — angle doux ou angle droit. »

Le choix quitte l'OUTIL et descend dans le POINT. Voir
`design/quartiers_points_001.png` (planche 6). Conséquences :

- **deux outils, et deux seulement** : **la plume** (on tape, le point naît
  DUR) et **le lasso** (on trace au doigt, les points naissent DOUX). « Au
  doigt » n'est pas un troisième outil : c'est le geste DU lasso — sur un
  téléphone il n'existe que deux gestes, taper ou glisser. *(Seul mot encore
  ouvert : « le lasso » ou « le doigt ». Rien d'autre n'attend.)*
- **le point se retourne au tap** : carré = dur (tangente cassée, angle
  net), rond = doux (la courbe traverse). La convention de tous les outils
  vectoriels, obtenue par un tap au lieu d'une touche de clavier.
- **mort : l'outil « traits droits »** — c'est une zone dont tous les points
  sont durs. **Mort : la forme libre.** **Mort : le cran de lissage** — le
  lissage n'est plus global, il est par point. On passe de *4 outils + 1
  réglage* à *2 outils + 1 bascule*.
- **les poignées remontent en v1** (c'est le prix, et il est juste : pour
  retourner un point il faut le toucher), **avec la règle des 32 px**
  d'écartement minimum à l'écran — obligatoire, plus optionnelle. Les points
  masqués reviennent en zoomant. **Déplacer** un point reste en v2 : un tap
  se vise, un glissé se dose.

**Et tout le reste des recos est validé tel quel :** voie A (le fond passe
en vectoriel, et on le fait AVANT de coder les quartiers) · six encres, une
encre = une zone · aplat **28 %** + fondu croisé · contour discret (1,4 px à
38 %) qui ne se réveille que sous le doigt · la **rature** en appui long
(le trait de cire se tire, il se rétracte si on lâche) · « refaire le
tracé » avec l'ancien en fantôme · le mot du quartier **composé en
lettres-objets** (les perles sont sorties, 41 fichiers) · le « + » devient
**la trousse**, l'écran des lettres **le sachet**.

### Ce qui reste à trancher

- **le mot** : « la plume » et « le lasso », ou « la plume » et « le doigt » ;
- **les lettres** : trois familles ou quatre · majuscules seules ou aussi
  les minuscules · les accents (É È À) — se tranche quand on y sera, pas
  avant.

## Ce qu'on n'y met PAS (décidé le 13/08)

- Pas de partage v1 — personnel, comme les stickers.
- Pas de vote public à la Hoodmaps — jamais : c'est un carnet, pas un mur.
- Pas de modération par ressemblance d'image (écartée, voir
  CHANTIER_STICKERS — le jour du partage : NSFW on-device + signalement).
