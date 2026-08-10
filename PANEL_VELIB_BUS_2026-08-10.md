# Panel — faut-il un calque Vélib' / bus sur la carte ?
*10 avis sollicités le 10 août 2026 : 5 professionnels, 5 utilisateurs.
Question posée par Ersan : « ce qui serait cool ce serait un filtre ou un
calque, pour afficher ou non les Vélib' et les bus. »*

---

## Le résultat

| option | voix |
|---|---|
| **A · contextuel** (une ligne dans la fiche du spot, pas de calque) | **9** |
| B · calque global avec interrupteur | **0** |
| C · ne rien faire | 1 |

**Zéro voix pour l'interrupteur.** Ni chez les pros, ni chez les utilisateurs.
Précaution méthodologique : le brief des 5 pros présentait A en premier, ce qui
a pu peser ; pour les 5 utilisateurs l'ordre a donc été inversé (B présenté en
premier). Le résultat n'a pas bougé — personne n'en veut.

La seule voix pour C est celle du profil qui ne sort qu'une fois par mois, ne
prend jamais le Vélib' et rentre avant minuit. Elle est cohérente, et son
argument compte : « je ne vais jamais chercher une option planquée. »

Ce qui revient chez presque tous à propos du calque : **« un bouton mort »**.
« Je sais déjà que je ne l'allumerai jamais. » Et le risque inverse, cité deux
fois : un interrupteur qu'on allume par curiosité et qu'on oublie allumé, donc
une carte polluée pour toujours.

---

## Les trois choses que le panel a apportées, et qui n'étaient pas dans la question

### 1. Les bus ne doivent pas être affichés — et ce n'est pas une question d'encombrement

C'est l'argument le plus fort de tout le panel, et il est venu de quatre
personnes indépendamment. Comme la donnée ne distingue pas le Noctilien des
~3 000 arrêts de jour, afficher un arrêt de bus la nuit est une **fausse
promesse**, pas seulement du bruit.

> « Vous m'envoyez marcher seule vers un arrêt vide pour rien — c'est exactement
> le genre de fausse promesse qui me met en danger. » *(utilisatrice, 30 ans,
> priorité sécurité)*

> « Autant ne rien afficher plutôt que me faire croire qu'il y a une solution à
> 2 h alors que c'est une station qui ferme à 21 h. » *(utilisateur, 34 ans,
> Vincennes)*

Ce n'est donc plus un arbitrage de design : c'est une question de sécurité des
gens. **Les bus sortent du produit**, calque ou pas.

### 2. Une station Vélib' sans sa disponibilité est un mensonge

C'est la critique la plus sérieuse adressée à l'option A elle-même — quatre
personnes l'ont soulevée.

> « Ça sert à rien de savoir "il y a une station" si je sais pas si elle est
> vide. » *(utilisatrice, 26 ans, Vélib' quotidien)*

> « Un pictogramme Vélib' statique sans disponibilité en temps réel est un
> mensonge visuel. » *(designer mobilité)*

La disponibilité existe en open data (GBFS Vélib', gratuit, sans clé). La
conclusion du panel est nette : **soit on affiche la disponibilité, soit on
n'affiche rien.**

### 3. Le poids du fichier est un problème séparé, à régler dans tous les cas

> « Le vrai problème mesuré — 716 ko chargés dès le premier affichage de la
> carte, 88 % inutiles — existe indépendamment du choix A/B/C. » *(ingénieur
> perf)*

Sa recommandation : découper `transport.json` **par mode** et ne charger au
premier rendu que ce qui est réellement dessiné (métro, RER, tram, batobus —
600 points sur 5 214). Le Vélib' se charge à la demande, seulement pour le
calcul de proximité. Il ajoute une dette qu'on n'avait pas vue : des positions
figées dans un fichier versionné **deviennent fausses** (les stations Vélib'
ouvrent et ferment), et un développeur seul ne les maintiendra pas à la main.

---

## Le point inconfortable, qu'il faut entendre

Plusieurs utilisateurs ont dit, sans qu'on le leur demande, qu'**ils
n'ouvriraient pas jeudi à 2 h du matin** pour cette question.

> « Jeudi, à ce moment-là, je ne l'ouvre pas — c'est pas son rôle et je le
> sais. » *(34 ans, Vincennes)*

> « Je rallume pas l'appli jeudi pour ça. » *(21 ans, étudiant)*

Les apps citées à 2 h : Vélib', Citymapper, Île-de-France Mobilités, Uber, G7,
Bolt, Google Maps. Jamais jeudi.

**Ce que ça veut dire :** même l'option gagnante est une petite fonction. Elle
est utile au moment où on **consulte le spot** (avant de partir, dans la
soirée), pas au moment où on rentre. Elle doit donc coûter peu, tenir en une
ligne, et ne jamais prétendre remplacer une app de transport.

Deux panélistes ont d'ailleurs prévenu du risque de dérive :

> « Que "comment tu rentres" devienne à son tour un mini-widget générique —
> liste + distances, badge de fait — et réintroduise par la fenêtre ce qu'on
> vient de refuser à la porte. » *(directeur artistique)*

---

## Ce que je recommande, dans l'ordre

**1 · Découper `transport.json` par mode.** Ne charger au premier affichage que
les 600 points dessinés. ~600 ko de moins, aucun changement visible, aucun
risque. C'est le seul point sur lequel tout le monde est d'accord et qui ne
demande aucune décision de produit.

**2 · Retirer les bus du produit.** Pour la raison de sécurité ci-dessus, pas
pour le poids. La donnée brute reste dans le dépôt si le Noctilien devient
identifiable un jour.

**3 · Abandonner l'interrupteur.** Zéro voix sur dix.

**4 · Le Vélib' dans la fiche, mais seulement avec la disponibilité.** Une
ligne, écrite comme le carnet parle — « à pied jusqu'à la station X, 4 min ·
3 vélos » —, jamais une liste, jamais un badge. Si le temps réel GBFS n'est pas
branché, **on ne fait pas la fonction** : le panel a été clair sur le fait
qu'une station sans disponibilité est pire que rien.

**5 · Ne pas le faire avant l'ouverture publique.** Le panel dit que c'est
utile, pas que c'est urgent — et l'ouverture du 24 septembre a des verrous plus
lourds (signaler/bloquer, la lentille, les CGU).

---

## Composition du panel

**Professionnels :** cartographe (10 ans de fonds de carte et de règles
d'étiquetage) · designer produit mobilité (ex-app de transport) · directeur
artistique (édition et gravure, gardien de l'identité) · ergonome accessibilité
(WCAG, usage en conditions dégradées) · ingénieur performance web mobile.

**Utilisateurs :** 26 ans, 11e, Vélib' quotidien, sort 3×/semaine · 34 ans,
Vincennes, obsédé par le dernier RER · 21 ans, étudiant fauché, Noctilien,
vieux téléphone · 30 ans, 18e, priorité sécurité en rentrant seule · 41 ans,
15e, deux enfants, peu technophile, sort 1×/mois.
