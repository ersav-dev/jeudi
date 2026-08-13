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

- **Teinter les rues d'une zone** : MapLibre sait le faire PROPREMENT — le
  filtre d'expression `within` (style-spec) permet de dupliquer les couches
  de routes avec un filtre « à l'intérieur du polygone » et de les peindre
  de la couleur de la zone. Pas de bidouille canvas.
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

## Ce qu'on n'y met PAS (décidé le 13/08)

- Pas de partage v1 — personnel, comme les stickers.
- Pas de vote public à la Hoodmaps — jamais : c'est un carnet, pas un mur.
- Pas de modération par ressemblance d'image (écartée, voir
  CHANTIER_STICKERS — le jour du partage : NSFW on-device + signalement).
