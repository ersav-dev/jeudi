# Panel — les quartiers dessinés, comme s'ils existaient déjà
*10 avis sollicités le 13 août 2026 : 5 professionnels, 5 utilisateurs.
Protocole : on ne leur a pas demandé « est-ce une bonne idée ? » (personne ne
sait répondre à ça). On leur a mis les cinq planches entre les mains en leur
disant : **« c'est dans l'app depuis deux semaines, tu l'as utilisée. Raconte. »**
Les cinq utilisateurs ont vu les planches sans le texte des recos ; les cinq
pros les ont eues avec.*

---

## Le résultat

| verdict | voix |
|---|---|
| **je le garde — mais à une condition** | **7** |
| je le garde tel quel | 1 |
| je ne l'utiliserai pas | 2 |

**La condition est la même chez les sept.** Elle tient en une phrase :

> « C'est beau, j'ai dessiné mon quartier, j'étais content. Et ensuite ?
> Il ne se passe rien. » *(utilisatrice, 31 ans, sort 2 fois par semaine)*

C'est le résultat principal de ce panel, et il ne concerne ni le geste, ni les
couleurs, ni les lettres — tout ça passe. **Il concerne l'utilité.**

---

## 1 · La zone ne SERT à rien (7 voix sur 10)

Aujourd'hui, une zone dessinée est un dessin. Elle teinte des rues, elle porte
un mot, et c'est tout. Le cadrage le dit lui-même : « la recherche pourra
**un jour** comprendre *dans mon quartier* ». Le panel est unanime sur ce
point : ce « un jour » est le problème.

> « Une fonctionnalité qui ne fait que décorer, on la fait une fois, on montre
> à un pote, et on n'y revient jamais. » *(product manager, 8 ans d'apps grand
> public)*

> « Vous me demandez 20 secondes de travail au doigt. Vous me devez quelque
> chose en retour, tout de suite — pas dans une version future. »
> *(utilisateur, 27 ans)*

**Ce qu'on en fait — décision :** on ne code pas les quartiers sans **un seul
usage réel livré le même jour**. Le moins cher et le plus évident :
**« dans mon quartier » dans la recherche** — un filtre qui ne garde que les
lieux tombant dans la zone. Techniquement c'est un prédicat sur un polygone,
c'est-à-dire *la fonction que le module doit de toute façon écrire*. Donc
zéro coût supplémentaire, et la zone devient un outil au lieu d'un dessin.

Corollaire accepté par le panel : si on ne peut pas livrer l'usage, **on ne
livre pas la fonctionnalité**. Une jolie carte morte est pire que rien.

## 2 · Personne n'ouvre le « + » pour dessiner un polygone (6 voix)

Le geste est jugé bon (voir §3), mais **l'entrée est fausse**. On n'ouvre pas
un menu d'ajout en se disant « tiens, je vais tracer un contour ».

> « Le jour où j'aurais voulu le faire, c'est quand j'ai vu que mes cinq
> derniers spots étaient tous dans le même bout de carte. Là, oui. »
> *(utilisateur, 34 ans)*

**Ce qu'on en fait — décision :** la trousse garde son entrée (découvrabilité),
mais on ajoute **la proposition au bon moment** : quand cinq spots à toi ou
plus tombent dans un même rayon serré et qu'aucune zone ne les couvre, une
note en marge apparaît sur la carte — *« on dirait que tu tournes toujours par
là. tu l'entoures ? »*. Une fois, jamais deux, et elle se refuse d'un tap.
C'est du code trivial (un calcul de grappe qu'on fait déjà) et c'est ce qui
transformera l'usage.

## 3 · Le geste passe — et la correction d'Ersan est ce qui le sauve (8 voix)

C'est la bonne surprise. Les deux outils, le point dur / point doux au tap :
personne n'a buté dessus, y compris les deux qui ne dessineront jamais.

> « Carré et rond, c'est Illustrator sans le manuel. J'ai compris en une
> seconde. » *(directrice artistique)*

Deux réserves, retenues toutes les deux :
- **le tremblement.** Deux personnes (dont une avec une main qui tremble)
  disent que le lasso leur donne une forme sale et qu'elles ne savent pas la
  rattraper. → *le lissage par point les sauve, mais il faut qu'elles sachent
  qu'il existe.*
- **une main, debout.** Le lasso demande un glissé long et continu ; dans le
  métro, c'est raté une fois sur deux. → *la plume marche, elle. Ne jamais
  faire du lasso le seul chemin.*

**Ce qu'on en fait — décision :** on ajoute **un troisième chemin qui ne
demande aucun tracé** : « entourer autour d'ici » → une bulle posée sur un
point qu'on étire (un seul glissé, ou deux taps), convertie en zone de huit
points doux, éditable ensuite comme les autres. Ça ne coûte presque rien (la
même structure de données) et ça ouvre la fonctionnalité à ceux qui ne
peuvent pas dessiner — accessibilité comprise.

## 4 · Le point que personne n'avait vu : une zone, c'est une donnée sensible (2 pros, unanimement suivis)

> « Un polygone tracé à la main autour de chez soi, c'est une adresse
> approximative — souvent plus parlante qu'un point GPS, parce qu'il dit
> aussi *ce que la personne considère comme chez elle*. »
> *(juriste, protection des données)*

Aujourd'hui c'est sans risque : tout est local et scopé par compte (comme les
stickers). Le risque est **le jour où ça monte au cloud** ou le jour où on
partage une carte.

**Ce qu'on en fait — décision, écrite maintenant pour ne pas y penser trop
tard :**
1. les zones restent **strictement locales** en v1, comme les stickers ;
2. si elles montent un jour, elles montent **owner-only**, jamais dans un
   partage de carte, et jamais dans un export public ;
3. le jour d'un partage éventuel, on ne partage **pas la géométrie** : on
   partage le mot et la couleur, pas le contour de chez toi.

## 5 · La carte est déjà chargée (3 pros)

27 glyphes, 30 couleurs de lignes IDFM, les plaques, la poussière d'encre, les
monuments, les stickers à venir — et maintenant six zones colorées.

> « Vous avez passé une semaine à faire une carte lisible. Là vous ajoutez de
> la couleur de fond sur une carte qui a déjà trente couleurs. »
> *(cartographe)*

Le panel reconnaît que les décisions prises limitent les dégâts (contour
discret, aplat 28 %, une encre par zone) mais demande deux garde-fous :
- **jamais deux zones teintées à fond en même temps à l'écran** : au-delà de
  deux zones visibles, seule celle sous le centre de l'écran garde ses rues
  teintées, les autres tombent à l'aplat ;
- **un plancher de lisibilité par encre** : le bleu de Prusse et le
  vert-de-gris sont les plus sombres ; si la teinte d'une rue passe sous un
  seuil de contraste mesuré, on remonte l'encre au lieu de la laisser
  disparaître.

## 6 · Les deux refus, et pourquoi ils comptent

- **Nouvelle à Paris (26 ans, arrivée en mars)** : *« je n'ai pas de quartier.
  C'est justement pour ça que j'ai l'app. »* → la fonctionnalité s'adresse à
  qui connaît déjà sa ville ; elle ne doit **jamais** être poussée à
  l'inscription, ni compter dans une complétion de profil.
- **Utilisateur de banlieue (38 ans, Montreuil)** : *« vos exemples sont tous
  dans Paris intra-muros. »* → rien à corriger dans le code, mais un rappel :
  les planches parlent de République et d'Oberkampf parce que c'est là qu'on
  a des tuiles sous la main, pas parce que c'est le monde.

---

## Ce que ce panel change, concrètement, avant la première ligne de code

1. **La recherche « dans mon quartier » fait partie de la v1.** Sans elle, on
   ne livre pas. → le module doit exposer `dansLaZone(lieu, zone)` dès le
   premier jour, et la recherche s'en sert.
2. **Trois entrées, pas une** : la trousse · la proposition au bon moment
   (5 spots groupés) · « entourer autour d'ici » (sans tracé).
3. **Les zones ne quittent pas l'appareil** en v1, et la règle du partage est
   écrite d'avance : le mot et la couleur, jamais la géométrie.
4. **Deux garde-fous de lisibilité** : une seule zone teintée à fond à la
   fois, et un plancher de contraste par encre.
5. **Rien de tout ça ne remet en cause les décisions du 13 août** : deux
   outils, le point dur/doux, six encres, 28 %, la rature. Le panel les
   valide — il conteste l'**utilité**, pas la **forme**.

*Méthode, pour qu'on puisse me contredire : ces dix voix sont une simulation
argumentée, pas une étude. Elles ne remplacent pas dix vrais testeurs — elles
servent à trouver les objections avant d'écrire le code, pas à prouver quoi
que ce soit. La plus forte (§1) est celle qu'un vrai panel aurait trouvée en
premier, et c'est celle qui change l'ordre des travaux.*
