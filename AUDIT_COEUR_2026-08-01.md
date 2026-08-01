# AUDIT DU CŒUR — l'architecture de la décision
*jeudi. · 1er août 2026 · fait suite au PANEL_AUDIT du 30/07*

Question posée : « on doit se sentir libre, garder l'ADN, donner envie de sortir —
ce soir ou un autre moment — et organiser l'app intelligemment. »

---

## 1 · Le diagnostic — quatre tensions, une racine

### T1. La décision est éclatée en trois morceaux qui s'ignorent
Le job n°1 de l'app (décider où sortir) vit dans trois endroits sans lien :
le deck solo (onglet « ce soir »), le match de groupe (enterré dans « le
cercle »), la recherche (« trouver »). Le panel a réclamé le match en n°1 ;
on l'a construit — puis rangé là où personne ne décide. Un utilisateur qui
veut « décider avec ses potes » n'a aucune chance de le trouver seul.

### T2. L'app est un entonnoir, pas un lieu
« ce soir » impose un quiz (avec qui → envie) avant de montrer quoi que ce
soit. Les grandes actions ne sont pas visibles d'emblée : le match ne serait
proposé QUE si on répond « potos » à une question — une conséquence de quiz,
pas un choix libre. Le concept dit « une décision, pas un catalogue » ; il
faut ajouter : **une décision LIBRE, pas un couloir**. On doit voir ses
options et choisir son geste — pas subir un embranchement.

### T3. Le temps est verrouillé sur « ce soir »
« ce soir » est à la fois le nom de l'onglet, la promesse — et la limite.
Or on sort aussi samedi, jeudi prochain, le soir de l'anniv. L'infra existe
déjà par bouts (le « quand ? » de trouver sait faire demain et l'heure près ;
`etatHoraire()` calcule à n'importe quelle date ; le match a une deadline ;
le calendrier des occasions parisiennes est constitué) mais l'architecture
n'a AUCUNE place pour « un autre soir ». Conséquence profonde : l'app
**répond au besoin** (je sors, là) mais ne **crée jamais le désir**
(« et si on sortait jeudi ? »). C'est la moitié manquante du produit.

### T4. Trois langages du temps, zéro unité
- « ce soir » : 4 presets figés (maintenant · 22h · 1h · jeudi 22h), pas d'heure libre
- « trouver » : molettes à l'heure près
- le match : durées (30 min · 1 h · 3 h)
Trois vocabulaires pour la même question. L'utilisateur le sent : « ça
manque d'unité ».

**La racine commune : l'app a été construite écran par écran (deck, puis
recherche, puis match) sans jamais poser LA carte du geste central : décider
— seul ou à plusieurs, maintenant ou plus tard.**

Constats secondaires confirmés par l'audit du 01/08 : photos absentes des
trois écrans de décision de groupe (trouver, shortlist/vote, page publique
invités) ; le vote in-app se tape alors que le concept dit « chacun swipe
les propositions » ; aucun signal de match en cours (pas de badge nav, pas
de bandeau de reprise).

---

## 2 · Les invariants — l'ADN qu'on ne négocie pas

1. **Le swipe est la langue de la décision** (questions, deck, validation —
   et demain le vote de groupe in-app).
2. **Une décision, pas un catalogue** : deck fini (8), recherche qui répond
   peu, jamais de feed.
3. **Des tips signés, jamais d'avis** ; pastilles ●●○, jamais d'étoiles.
4. **La météo du porte-monnaie est silencieuse** et ne quitte pas le
   téléphone.
5. **Push = ton cercle · Pull = toute la ville** (et le Grand Jeudi reste
   l'exception spectaculaire).
6. **Pas de messagerie.** Le langage de réactions codifiées ; la
   conversation reste sur WhatsApp.
7. **DA Carnet de Nuit** : charbon, encre, UNE cire par écran, tampon.

---

## 3 · L'architecture proposée — « la question qui s'accorde »

### Le principe
Un seul écran pour décider. **Deux verbes toujours visibles** (la liberté).
**Le moment au-dessus, réglable** (le temps libéré). La question de la
marque devient **dynamique** — c'est la clé de voûte :

> **« ça dit quoi `[ce soir ▾]` ? »**
> tape le moment : maintenant · ce soir · demain · samedi · jeudi prochain · à l'heure près
> → la question se relit « ça dit quoi **samedi** ? »

La question fondatrice n'est pas trahie : elle s'accorde. « ce soir » reste
le défaut (le rituel), mais le futur devient un citoyen de première classe.

### L'écran (onglet 1, renommé « sortir. »)
```
ça dit quoi [ce soir ▾] ?

[ UN VOTE VIT — 3/8 ont voté · il reste 42 min → ]   ← seulement si match ouvert

┌─────────────────────┐  ┌─────────────────────┐
│  je sors →          │  │  on sort →          │
│  seul ou à deux     │  │  à plusieurs        │
│  (le deck)          │  │  (le match)         │
└─────────────────────┘  └─────────────────────┘

je sais pas — surprends-moi

« jeudi prochain, la ville s'ouvre. »          ← L'OCCASION (1 ligne, jamais un feed)

situation du portefeuille ?  soleil · nuageux · pluie
```

### Ce que chaque pièce respecte
- **Deux verbes, pas un quiz.** « je sors » / « on sort » : les deux moteurs
  du concept, côte à côte, d'un tap. La liberté se voit.
- **Le swipe reste la langue DANS chaque moteur.** « je sors » garde les
  questions swipées (avec qui : solo · duo · pro — « potos » y devient une
  passerelle vers « on sort », cohérence totale) puis le deck. « on sort »
  compose le match ; en v2 le vote in-app devient un deck swipable (le
  concept le décrit déjà : « chacun swipe les propositions »).
- **Le moment s'applique aux deux moteurs.** Deck : lieux filtrés aux
  horaires du moment choisi (`etatHoraire(date)` sait déjà faire). Match :
  titre pré-rempli (« samedi soir ») et deadline par défaut calée avant le
  moment. Et c'est LE composant « quand ? » unique qui remplace les trois
  langages (T4 réglée par construction).
- **L'occasion crée le désir.** Une ligne, tirée du calendrier des
  occasions (Grand Jeudi, fête de la musique, fashion week…), qui donne
  envie de PLANIFIER : tape → le moment se règle dessus. Jamais un feed,
  jamais une pub — une phrase dans la voix de jeudi.
- **Le match te rattrape.** Bandeau de reprise en tête + pastille cire sur
  l'onglet dans la nav. Un vote qui vit n'est plus jamais perdu.

### La nav finale
```
sortir. | trouver. | ma carte. | le cercle. | moi.
   ●  ← pastille cire quand un vote vit
```
- « le cercle » redevient purement les gens (l'étiquette « sortir à
  plusieurs » y reste en porte secondaire — le concept dit que le match se
  joue entre proches — mais ce n'est plus la porte principale).
- FAB capture : inchangé (ma carte).

---

## 4 · Les parcours rejoués (le test de liberté)

| Situation | Parcours | Gestes |
|---|---|---|
| Je sors seul, maintenant | sortir → je sors → questions swipées → deck | comme avant |
| On sort samedi entre potes | sortir → moment « samedi » → on sort → lien WhatsApp | **n'existait pas** |
| Envie de rien / curieux | sortir → l'occasion (« jeudi prochain… ») → tape → moment réglé | **n'existait pas** |
| Un vote vit, j'étais ailleurs | pastille nav → sortir → bandeau → reprendre | **n'existait pas** |
| Invité sans app | lien WhatsApp → prénom → vote → verdict | inchangé (v1 livrée) |
| Date à deux | sortir → on sort (N=2 = match de date) ou je sors (deck duo) | les deux portes |

---

## 5 · Le plan d'exécution

- **Phase 1 — le hub « sortir »** : écran à deux verbes, moment dynamique
  (composant « quand ? » unique, heure libre incluse), bandeau + pastille,
  passerelle potos, cercle nettoyé. C'est la refonte du cœur.
- **Phase 2 — les photos partout** : helper `premierePhoto()`, miniatures
  dans trouver + shortlist + vote in-app + récap liste ; colonne
  `photo_url` snapshotée (URL signée longue durée) pour la page publique.
- **Phase 3 — le moment partout** : brancher le composant « quand ? » sur
  trouver (remplace les molettes) et sur la deadline du match ; le deck
  filtré au moment choisi.
- **v2 notées** : vote de groupe swipable in-app · voter le soir en plus du
  lieu · départs multiples des votants (vraie triangulation) · historique
  des matchs.

---

*Décision attendue : valider l'architecture « la question qui s'accorde »
(§3) avant toute ligne de code.*
