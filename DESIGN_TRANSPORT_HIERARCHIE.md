# DESIGN — la hiérarchie du transport sur la carte
*Audit + propositions du 12/08/2026, session Fable, à la demande d'Ersan :
« les transports quand ils ne sont pas cliqués sont trop visibles ».
RIEN n'est codé — des planches (design/) trancheront ce qui se voit.*

---

## 0 · La règle qu'on répare

La carte a QUATRE voix, dans cet ordre, et rien ne doit le renverser :

1. **le contenu** — les épingles, les tas de la pellicule, les noms de spots ;
2. **les repères du carnet** — monuments gravés, points de rendez-vous
   (l'écriture à la main, la voix du carnet) ;
3. **la signalétique** — le transport : au repos une PRÉSENCE, jamais un
   discours ; au tap, pleine voix (c'est ce qu'on a demandé) ;
4. **la ville** — les tuiles, la poussière d'encre.

Le sentiment d'Ersan est exact, et il se mesure (voir §1) : au repos, la
signalétique parle aujourd'hui plus fort — et plus NOMBREUSE — que le
contenu.

---

## 1 · L'état réel, vérifié dans le code le 12/08

**Au repos (rien de touché) :**
- Étiquettes de stations dès **z13** (tram/batobus z14) : plaque à **fond
  plein saturé** (M bleu-nuit #0b1a3a · RER #0055c8 · T vert #66a933 ·
  BAT cyan #00a4c4) + filet clair, puis le nom en **Caveat** 11-13 px avec
  halo sombre. Opacités : RER 0.38 · métro 0.30 · tram/bato 0.24.
- **Cap 14** étiquettes, grille anti-collision 96 px, re-calculées à chaque
  moveend/zoomend. Apparition **binaire** au franchissement de z13.
- Les noms de SPOTS, eux : cap **~8** (majLabels). → **14 contre 8 : le
  filigrane est plus nombreux que le texte principal**, l'inverse de la
  note du 09/08 qui croyait avoir réglé ça.
- Vélib'/Noctilien/bus de jour : rien sur la carte (bien) ; bouches :
  seulement après tap (bien).

**Au tap d'une station :** ses lignes se tracent pleine voix (halo nuit +
couleur IDFM), pastilles de quais, numéros de ligne, bouches numérotées.
L'étiquette touchée monte à 0.95. **Mais** : les 13 autres étiquettes
restent au même niveau qu'avant, et les bouches — pourtant une RÉPONSE au
tap — restent à 0.3.

**Dans la fiche :** la ligne « rentrer » (Vélib' temps réel + Noctilien à
son heure) — le bon endroit, validé contre le calque rejeté 0/10.

---

## 2 · Le diagnostic — pourquoi « trop visible » malgré 30 % d'opacité

1. **L'aplat coloré ne s'éteint pas à l'opacité.** La plaque pleine est le
   SEUL élément de la carte avec un fond saturé étranger à la palette du
   carnet. Un badge à 30 % reste un badge : c'est sa nature qui attire
   l'œil, pas sa force. (C'est la variante « C » choisie le 08/08 sur
   planche — mais la planche comparait des étiquettes SEULES, pas posées
   par 14 sur une carte habitée.)
2. **La hiérarchie voulue n'est pas la hiérarchie perçue.** 0.38/0.30/0.24
   ne se distinguent pas ; ce qui se voit, c'est la LUMINANCE : le vert
   tram et le cyan batobus (clairs) percent plus que le bleu-nuit métro —
   les modes « secondaires » sont donc perçus DEVANT le mode de référence.
3. **14 > 8.** Le nombre fait le bruit autant que l'opacité.
4. **L'apparition binaire à z13** : d'un geste de zoom, quatorze badges
   tombent d'un coup — l'effet « la carte se remplit ».
5. **Caveat pour des stations.** La règle des bouches (écrite dans le CSS !)
   dit : « la main dit les lieux, le sans-serif dit la signalétique ». Les
   stations la violent : elles empruntent la voix du carnet pour de la
   signalétique — d'où la confusion avec les vrais repères du carnet.
6. **Les bouches à 0.3 après un tap** contredisent la règle du trait
   (« pleine opacité — c'est ce qu'on a demandé à voir »).
7. **Deux fausses promesses restantes** : le Batobus étiqueté à 2 h du
   matin (il ferme au plus tard ~21h30 l'été, plus tôt hors saison) — la
   même faute que les bus de jour, purgés le 10/08 ; et le RER honoré
   (plus gros, plus opaque) alors que passé ~0h45-1h15 il ne ramène plus
   personne.

---

## 3 · Les propositions — par ordre d'effet

### P1 · La plaque perd son aplat AU REPOS *(le cœur)*
Au repos, le badge plein devient un **cachet à l'encre** : le code
(M / RER / T) en sans-serif gras, DANS la couleur du mode, **sans fond** —
comme un tampon sec. L'aplat plein aux couleurs RATP ne revient qu'à
l'état **tracé** (et il y a droit : c'est la réponse).
→ garde l'identité couleur, tue la nature « badge ». C'est la retouche qui
change le plus la sensation, à information égale.

### P2 · Le nom de station se tait au repos
- z13 → z14.5 : **le cachet seul** (M, RER…), sans nom. On se situe très
  bien avec un M discret — c'est la fonction « repère », le nom est déjà
  du discours.
- z ≥ 14.5 : cachet + nom, en **sans-serif 10 px** (fini le Caveat pour la
  signalétique — leur propre règle).
- au tap : tout, pleine voix.
→ divise le texte affiché par ~3 au zoom courant.

### P3 · La hiérarchie perçue se règle à la luminance, pas à l'opacité
Au repos, une SEULE encre pour tous les cachets — l'encre du carnet à
~35 % — OU des teintes ramenées à luminance égale (le bleu RER légèrement
devant, le tram/bato derrière). Les couleurs saturées vraies = réservées à
l'état tracé. À trancher sur planche : encre unique (plus calme) vs
teintes égalisées (plus informatif).

### P4 · Moins nombreux, et en fondu
- Cap **par zoom** : 6 à z13 → 10 à z14 → 14 à z15+ (toujours ≤ le cap
  des noms de spots au même zoom).
- Apparition en **fondu** (transition CSS à la pose) au lieu du seuil sec.

### P5 · Le mode focus : quand une station répond, les autres se taisent
Pendant qu'une ligne est tracée : les 13 autres étiquettes tombent à ~0.1
(ou disparaissent). La carte répond à UNE question ; elle n'a pas à
continuer de murmurer autre chose. S'éteint avec le tracé.

### P6 · Les bouches parlent quand on les a demandées
Après le tap : bouches à ~0.9 (numéro dominant, rue en murmure, comme
dessiné) — alignées sur la règle du trait. Au repos elles n'existent
toujours pas : rien ne change là.

### P7 · Plus de fausse promesse, aucune, pour personne
- **Batobus** : visible seulement à son heure de service (sinon rien) — ou
  retiré du repos et montré uniquement dans une future ligne « y aller ».
  Même loi que Noctilien/bus de jour.
- **RER dégradé après le dernier train** (~1 h) : la nuit, son cachet
  descend au niveau tram — il ne ramène plus personne, il n'a plus à être
  le plus fort. (Le métro suit la même logique après ~0h45/1h45
  ven-sam — à discuter, c'est peut-être trop fin pour v1.)

### P8 · La fiche gagne « y aller », et « rentrer » respire
- Nouvelle demi-ligne **« y aller »** : la station (M/RER) la plus proche
  du spot + distance — le besoin symétrique de « rentrer », aujourd'hui
  couvert par PERSONNE (c'est probablement une raison pour laquelle les
  étiquettes de carte se sentent obligées d'exister si fort).
- « rentrer » passe en deux souffles : Vélib' sur sa ligne, Noctilien sur
  la sienne, chacun précédé du petit cachet de son mode (cohérence carte ↔
  fiche). Heures en retrait comme aujourd'hui.

### P9 · Deux détails de pile
- Les étiquettes transport passent **sous** les vignettes de monuments
  (aujourd'hui z-index au-dessus) : la signalétique ne recouvre pas le
  carnet.
- La station tracée garde son 0.95 — rien à changer.

---

## 4 · Ce qui ne change PAS (et pourquoi)
- Le **tap = tracer les lignes** : bon geste, unique, appris — on ne le
  touche pas.
- Le **trait pleine voix** aux couleurs IDFM réelles : c'est la réponse,
  il a raison d'être fort. Halo nuit conservé.
- **Vélib'/Noctilien hors carte** : le calque a été rejeté 0/10, la fiche
  est leur maison. Rien ne remonte sur la carte.
- Les **données** (couleurs IDFM sources, quais, bouches avec sens) : rien
  à re-collecter, tout est déjà là.

## 5 · La suite, dans l'ordre de la maison
1. **Planche `design/transport_repos_001.html`** : l'écran de repos à z13
   et z15, 3 variantes du cachet (encre unique / teintes égalisées / badge
   actuel en témoin) — on tranche SUR IMAGE, comme pour les étiquettes du
   07/08, mais cette fois posées sur une carte HABITÉE (spots + monuments),
   pas isolées.
2. Ersan tranche P1-P3 (le visuel) et P7 (Batobus/RER la nuit).
3. Le code en une session : CSS + CONFIG (caps/seuils) + mode focus +
   fiche « y aller ». Petit, tout est localisé (Carte.tsx §étiquettes,
   index.css §repère-transport, App.tsx §fiche).

## Les 4 questions à trancher
1. Cachet au repos : **encre unique** (plus calme) ou **teintes
   égalisées** (plus informatif) ? (Reco : encre unique — l'identité
   couleur revient au tap, qui est le moment où elle sert.)
2. Le nom de station au repos : **rien avant z14.5** (reco) ou toujours là
   mais en sans-serif discret ?
3. Batobus : **conditionné à l'heure** (reco) ou retiré du repos ?
4. « y aller » dans la fiche : oui (reco) — et si oui, en v1 métro/RER
   seulement ?
