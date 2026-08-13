# LES LETTRES-OBJETS — références et recettes
*13/08/2026. Les images d'Ersan (envoyées en conversation) sont à déposer
dans `design/lettres/_sources/` — ce fichier les décrit assez précisément
pour refaire les familles sans elles.*

Le principe : **le nom d'un quartier ne s'écrit pas, il se compose.** On
pose des lettres-objets sur la carte, comme on colle un sticker. Chaque
caractère est **un fichier PNG séparé**, fond transparent, 256 px (@2x).

## Le pipeline (déjà en place)

- `design/lettres/_gen_lettre.html?f=<famille>&c=<caractère>` — rend UN
  caractère en 128×128 CSS, fond transparent. Une famille = une recette
  CSS d'une quinzaine de lignes dans ce fichier.
- La boucle d'export (Chrome headless, `--default-background-color=00000000`,
  `--force-device-scale-factor=2`) sort un fichier par caractère :
  `design/lettres/<famille>/A.png`, `0.png`, `coeur.png`…
- Corriger une lettre = corriger la recette et relancer. **On ne retouche
  jamais un PNG à la main.**

## Les quatre familles

| # | nom | la matière | la police (présente sur le poste) | état |
|---|---|---|---|---|
| 1 | **les perles** | cube blanc plastique, coins arrondis, caractère **gravé** (liseré clair sous le trait) ; la perle « ☺ » est ronde et jaune | Century Gothic | ✅ 41 caractères sortis (A–Z, 0–9, ♥ & ! # ☺) |
| 2 | **les touches** | touche de machine à écrire : anneau de métal, face crème bombée, ombre courte | Courier New gras | échantillon (JEUDI, MONQART, 3, 8) |
| 3 | **les découpées** | carton d'affiche massicoté, papier coloré (jaunes/ocres), lettre en couleur saturée, grain | Bernard MT Condensed (secours : Haettenschweiler, Impact) | échantillon |
| 4 | **les timbres** | petit carré de papier crème, bord irrégulier (déchiré), encre brune | Rockwell (secours : Bookman Old Style) | échantillon |

Les images de référence d'Ersan contenaient aussi : un alphabet crème à
sérifs (proche de la famille 4), des lettres « patchs » (jean, léopard,
brodé, fourrure) — **écartées pour l'instant** : chaque lettre y est un
dessin unique, donc impossible à produire par recette. Si on les veut un
jour, ce sera un jeu d'images acheté ou dessiné, pas généré.

## Les règles de pose (voir `quartiers_lettres_001.png`)

1. **On tape, ça se compose** — on ne pioche pas les lettres une par une
   (24 taps pour « mon quartier », personne ne le refait deux fois).
2. **Posées, pas alignées** : chaque caractère tourne de 1 à 2,5°, la ligne
   ondule d'un pixel, les perles se chevauchent légèrement (−17 % de leur
   largeur) comme sur un fil.
3. **Plancher de 18 px** de haut : en dessous, une perle n'est plus une
   lettre. Le mot ne rétrécit donc jamais — au dézoom il **passe sur deux
   lignes** et grandit par rapport à la zone.
4. **Le Caveat reste** pour la note en marge (« — le mien depuis 2019 ») :
   l'une nomme, l'autre commente.

## À trancher

- quatre familles ou trois (les découpées apportent leur propre couleur et
  peuvent se battre avec l'encre de la zone) ;
- majuscules seules, ou aussi les minuscules (× 2 le nombre d'assets) ;
- les accents (É È À Ê) — nécessaires pour « L'ÉTÉ », « CHEZ MÉMÉ ».
