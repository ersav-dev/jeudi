# Audit — pourquoi on ne peut pas chercher un tiers-lieu
*13 août 2026, à la demande d'Ersan : « les lieux, on peut pas chercher par
catégories comme les glyphes, genre tiers-lieu ». Tout ce qui suit est
vérifié dans le code et mesuré sur les données, pas supposé.*

---

## Le résumé en cinq lignes

1. **Le type d'un lieu n'est pas une donnée** : il est *deviné* à chaque
   affichage, par une cascade de regex sur la description.
2. **Le module qui comprend les phrases existe, et personne ne l'appelle.**
3. **Deux vocabulaires cohabitent sans se parler** : 7 « envies » (stockées,
   filtrables) et 27 « types » (déduits, non filtrables).
4. **Aucun filtre par type**, ni dans « trouver », ni sur la carte.
5. Et le vrai problème, celui qu'on ne voit pas en lisant l'écran : **le
   gisement est vide.** 69 % des lieux tombent dans *resto* ou *bar*, et
   **8 types sur 27 ne sont portés par aucun lieu**.

---

## 1 · Le type est une devinette, pas une donnée

`typeDeLieu()` (`typesLieu.ts:58`) lit `lieu.description` et la passe dans
~30 expressions régulières, dans un ordre qui compte (« la friche AVANT les
grandes familles », « le plein air APRÈS les bars »). Le type n'est écrit
nulle part : il n'existe que le temps d'un appel.

Trois conséquences, dans l'ordre de gravité :

- **On ne peut pas filtrer dessus** sans relancer la cascade sur toute la
  liste, à chaque frappe. C'est exactement pour ça que « tiers-lieu » ne
  marche pas comme catégorie.
- **Le type est instable.** `decrireLieu()` écrit le mot du carnet dans la
  description (« Tiers-lieu », « Musée »…), mais l'utilisateur écrit dans le
  même champ. Le jour où quelqu'un note « on a bu un verre au bar du musée »,
  son musée devient un bar — la règle `bar` passe avant `musee` dans la
  cascade.
- **C'est recalculé à chaque rendu de pin** (`Carte.tsx:532`) : 30 regex par
  lieu affiché, à chaque repose des épingles.

## 2 · `lireIntention()` : 424 lignes, 34 tests, zéro appel

`intentions.ts` sait déjà transformer une phrase en intention structurée :

```
lireIntention('un tiers-lieu tranquille ce soir')
  → { types: ['friche'], envies: ['tranquilo'], cuisines: [], faits: [], reste: [] }
```

Il connaît les 27 types, les 21 cuisines, les 5 faits binaires, les
synonymes (« food court » → friche, « guinguette » → sur l'eau…).

**Personne ne l'appelle.** Vérifié : `grep -rn "lireIntention"` ne trouve que
sa propre définition. L'écran « trouver » construit une requête à trois
champs — `{ texte, envies, ouvertSeulement }` — et le moteur
(`recherche.ts:128`) fait un simple `includes()` sur
`nom + description + note + adresse`.

Donc « tiers-lieu » ne marche **que** si le mot est littéralement dans le
texte du lieu. Ça tombe juste par accident pour les lieux créés à la main
(le mot du carnet est dans la description) et ça rate pour tout le reste :
les imports Google, les descriptions en anglais, et tous les synonymes.

## 3 · Deux vocabulaires qui ne se parlent pas

| | où c'est | stocké ? | filtrable ? | qui s'en sert |
|---|---|---|---|---|
| **les 7 envies** | `db.ts:49` | ✅ champ `envies` | ✅ | les chips, le moteur |
| **les 27 types** | `typesLieu.ts:14` | ❌ déduit | ❌ | les glyphes, les pickers |

Les chips de la carte et de « trouver » (*tranquilo · alloco · resto ·
gastro · incognito · apéro · turbo*) sont des **humeurs**. Les glyphes sont
des **faits** (c'est un bowling, ou ça ne l'est pas). Les deux sont
légitimes — mais rien dans le code ne les relie explicitement : la table de
correspondance vit à l'intérieur des règles de `intentions.ts`, celui que
personne n'appelle.

**C'est ça, la sensation d'Ersan** : la carte parle un vocabulaire que la
recherche ne parle pas.

## 4 · Le gisement est vide — la découverte de cet audit

Mesuré sur les 306 descriptions du décor (`spots_curated`, `spots_extra`,
`ersan`), en passant chacune dans `typeDeLieu()` :

| type | lieux | part |
|---|---|---|
| resto | 147 | 48,0 % |
| bar | 65 | 21,2 % |
| concert | 28 | 9,2 % |
| club | 25 | 8,2 % |
| gastro | 10 | 3,3 % |
| street | 6 | 2,0 % |
| friche | 4 | 1,3 % |
| parc · sport · ciné | 3 chacun | 1,0 % |
| café · biblio · théâtre | 2 chacun | 0,7 % |
| musée · thé · piscine · vin · glace · billard | **1 chacun** | 0,3 % |

**Et 8 types sur 27 n'ont AUCUN lieu** : pâtisserie, karaoké, escape,
bowling, bar à jeux, spa, boutique, marché.

Autrement dit : on a dessiné 27 glyphes pour une ville qui, dans nos
données, est faite à 69 % de restos et de bars. **Même en branchant le
filtre parfait, « montre-moi les bowlings » rendrait une liste vide.**

C'est le chantier de l'enrichissement (`_enrichissement/`) qui répond à ça,
et il attend deux choses d'Ersan : le SQL de fusion à coller, et la clé
Google d'un compte dédié pour aller chercher le vrai gisement.

---

## Ce que je recommande, dans cet ordre

**A · Stocker le type** *(petit, et ça débloque tout le reste)*
Un champ `type?: TypeLieu` sur le lieu, rempli une fois à la création et à
l'import, corrigeable à la main (l'écran existe déjà : `CorrigerLieu`).
Rétro-remplissage au chargement par `typeDeLieu()` — donc rien à ressaisir.
Le type devient un **fait**, plus une lecture de texte : filtrable, stable,
et gratuit à l'affichage.

**B · Brancher `lireIntention()` dans « trouver »** *(~20 lignes)*
La phrase donne `{types, cuisines, faits, envies, reste}` ; la requête gagne
un champ `types` ; le moteur filtre dessus au lieu de chercher le mot dans
la prose. « un musée ouvert ce soir » devient une vraie question. Le module
est écrit et testé — il ne lui manque que l'écran.

**C · Un filtre par FAMILLE, pas 27 chips** *(une planche d'abord)*
27 pastilles feraient un mur. Six familles, avec leur glyphe :
*boire · manger · voir & écouter · jouer · bouger · flâner*, chacune
dépliable vers ses types fins. Le même composant sert la carte et
« trouver » — c'est le même vocabulaire, il ne doit pas exister deux fois.

**D · Nourrir le gisement AVANT de livrer C**
Sinon on livre six familles dont quatre sont vides, et c'est pire que rien :
un filtre vide dit « il n'y a rien », pas « je ne sais pas ».

**E · Réconcilier envies ↔ types**, explicitement et avec des tests : une
table qui dit qu'un *bar à jeux* nourrit l'envie *alloco*, qu'un *musée*
n'est pas une envie du tout. Aujourd'hui cette connaissance est enfouie
dans les règles du lexique.

---

## Ce que je ne recommande pas

- **Chercher plus fort dans le texte.** Améliorer le `includes()` (fuzzy,
  synonymes, tolérance aux fautes) donnerait l'illusion que ça marche, sur
  une donnée qui n'existe pas. On tomberait sur le problème du gisement six
  semaines plus tard, avec un moteur à jeter.
- **Afficher les 27 types dans un menu.** Ce serait honnête techniquement et
  faux produit : personne ne parcourt 27 cases. Les gens tapent une phrase,
  ou tapent une famille.
