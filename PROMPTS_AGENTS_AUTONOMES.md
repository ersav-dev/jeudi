# Prompts pour les agents qui bossent sans Ersan
*Écrit le 10 août 2026. Le SOCLE se colle avant chaque tâche ; les tâches sont
en dessous, prêtes à copier. Elles ont toutes été choisies parce qu'elles ne
demandent **aucune décision** ni de produit, ni de DA.*

---

## LE SOCLE — à coller en tête de CHAQUE prompt

```
Tu travailles sur « jeudi. », une app de sorties nocturnes à Paris.
Dossier : F:\ErsanMusa-com\Jeudi_App — le code est dans app/ (React + TypeScript
+ Vite + Supabase, PWA déployée sur Vercel).

CE QU'EST CE PROJET
Ce n'est pas un GPS ni un annuaire : c'est un CARNET de lieux qu'on tient et
qu'on partage avec son cercle d'amis. Une seule personne le développe. Une
ouverture publique est visée pour le 24 septembre 2026.

LA LANGUE
Tout est en français : le code, les noms de variables, les commentaires, les
messages d'interface. Les commentaires expliquent POURQUOI, jamais QUOI — le
quoi se lit dans le code. Ton ne doit être ni scolaire ni commercial : c'est
un carnet, on écrit comme on parle. Tout texte visible passe par t() et doit
avoir son entrée anglaise dans src/langue.ts.

LES RÈGLES DE DESIGN, NON NÉGOCIABLES
· jamais de notes ni d'étoiles (les avis gradués sont des pastilles ●○○ signées)
· jamais de badge chiffré, jamais de compteur de notifications
· jamais d'émoji dans le chrome de l'app
· un signal rare situe, dix signaux empilés cachent la ville
· le vocabulaire vient du papier (carnet, tampon, gravure, cartouche), jamais
  des apps de carte

LES SEPT LOIS DE TRAVAIL — elles viennent d'erreurs réelles, commises le 10/08

1. VÉRIFIE, NE SUPPOSE PAS. Avant d'affirmer l'état du code, lis-le. Avant
   d'affirmer l'état des données, interroge-les. Un commentaire du dépôt peut
   être FAUX : le 10/08, un commentaire affirmait le contraire de la vérité sur
   les couleurs de métro, et il avait été écrit par un agent précédent.

2. MESURE AVANT D'AFFIRMER. « C'est plus lisible », « c'est plus rapide », « ça
   tient » ne valent rien sans un nombre. Le 10/08, un choix de couleur de texte
   « évident » donnait 1,9:1 de contraste — illisible — et seul le calcul l'a
   montré.

3. TON PROPRE OUTIL DE VÉRIFICATION PEUT MENTIR. Le 10/08, un miroir de données
   a renvoyé « 0 résultat » simplement parce qu'il ne contenait aucune donnée
   française. Avant de conclure à partir d'un outil, teste-le sur un cas dont tu
   connais la réponse.

4. NE RÉÉCRIS JAMAIS UN FICHIER JSON DU DÉPÔT AVEC POWERSHELL.
   `Get-Content` relit l'UTF-8 sans BOM comme du Latin-1 et `Set-Content
   -Encoding utf8` ajoute un BOM : le 10/08, « République » est devenu
   « RÃƒÂ©publique » et PLUS AUCUNE bouche de métro ne pouvait s'afficher.
   Utilise Node (readFileSync/JSON.parse/writeFileSync). Pour récupérer un
   fichier abîmé : `git checkout <rev> -- <chemin>`.

5. AVANT DE SCOPER UNE RÈGLE CSS, REGARDE QUI D'AUTRE UTILISE LA CLASSE.
   Le 10/08, une règle qui cachait des prix a effacé les libellés d'un écran
   entier, parce que deux composants partageaient la même classe.

6. NE FABRIQUE JAMAIS UNE DONNÉE QUE TU N'AS PAS. Pas d'horaires inventés, pas
   de coordonnées approximatives, pas de valeur « probable ». Si la donnée
   manque, l'app doit le dire ou ne rien afficher — jamais faire semblant. Une
   information fausse dans une app de sorties nocturnes envoie quelqu'un
   quelque part pour rien.

7. RENDS COMPTE HONNÊTEMENT. Dis ce que tu as vérifié ET ce que tu n'as pas pu
   vérifier. Si un test échoue, montre la sortie. Si tu as dû faire une
   hypothèse, dis laquelle.

CE QUE TU DOIS FAIRE AVANT DE RENDRE
Depuis app/ :
    npx tsc -b --noEmit          → 0 erreur
    npx eslint <tes fichiers>    → 0 erreur sur CE QUE TU AS TOUCHÉ
    npx vitest run               → tout vert (495 tests au 10/08)
    npm run build                → passe
Si un test échouait DÉJÀ avant toi, dis-le au lieu de le « réparer » en
changeant l'assertion.

CE QUE TU NE DOIS PAS FAIRE
· ne déploie pas (`vercel`), ne pousse pas (`git push`) : Ersan décide
· ne commit pas sans qu'on te le demande
· ne touche pas aux migrations SQL de supabase/migrations : les 17 sont
  appliquées en production, une modification a posteriori casse la base
· ne change pas la direction artistique ni une décision de produit ; si ton
  travail t'y amène, ARRÊTE-TOI et explique pourquoi
· n'ajoute pas de dépendance npm sans dire pourquoi elle est indispensable
· ne réécris pas un fichier entier quand un diff ciblé suffit

OÙ EST LA MÉMOIRE DU PROJET
· CONCEPT.md — l'âme du produit, à lire si tu touches à une mécanique
· design/etat_du_chantier_001.html — où on en est, ce qui reste, qui fait quoi
· ETAT_2026-08-08.md — le dernier état des lieux détaillé
· CHANTIER_*.md — les chantiers cadrés (push, pellicule, super 8, signaler)
· PANEL_VELIB_BUS_2026-08-10.md — comment un arbitrage se tranche ici
```

---

## LES TÂCHES PRÊTES

### A · Les deux erreurs ESLint qui traînent

```
[SOCLE]

TÂCHE : `npx eslint src` remonte deux erreurs `react-hooks/set-state-in-effect`
qui existaient AVANT toi — l'une dans App.tsx (l'effet de l'invitation de la
pellicule), l'autre dans main.tsx. Elles viennent d'une règle arrivée avec une
mise à jour du plugin.

Corrige-les VRAIMENT : ne mets pas de eslint-disable, ne déplace pas le
problème. Chaque cas doit être compris avant d'être corrigé — dans les deux
cas il s'agit d'un état posé au montage qui pourrait l'être autrement (valeur
initiale du useState, ou effet qui s'abonne au lieu d'écrire).

⚠ L'invitation de la pellicule a un comportement voulu : elle s'affiche UNE
FOIS PAR JOUR pendant 6 secondes, et le jour est LOCAL (à 1 h du matin on est
encore la veille). Ne casse pas ça — lis pellicule.ts et le test associé
avant de toucher.

Rends : le diff, la sortie d'eslint avant/après, et la confirmation que les
495 tests passent toujours.
```

### B · Les petites dettes

```
[SOCLE]

TÂCHE : trois dettes connues, indépendantes. Traite-les dans cet ordre et
arrête-toi si l'une d'elles se révèle plus grosse que prévu — dis-le plutôt
que de forcer.

1. Dans App.tsx (~L3250), `setErreurTip((e as Error).message)` affiche
   TEL QUEL à l'écran le message d'une exception venue de db.ts. Or db.ts lance
   19 `throw new Error('…')` en français en dur, qui ne passent pas par t() et
   n'ont pas de traduction anglaise. Un utilisateur en anglais reçoit donc du
   français brut, et parfois une phrase qui n'était pas écrite pour être lue.
   Décide d'une approche (des codes d'erreur traduits côté UI ? un message
   générique traduit et le détail en console ?) et applique-la à ce cas-là
   seulement — ne refais pas les 19 d'un coup.

2. FormAjout et AjoutMain se recouvrent : deux chemins pour créer un lieu à la
   main. NE FUSIONNE PAS TOUT DE SUITE — commence par écrire ce que chacun fait
   et où ils divergent, puis propose. Le recouvrement peut être voulu.

3. FormAjout court-circuite la file d'attente Nominatim (le géocodage). Trouve
   pourquoi la file existe (lis nominatim.ts) et fais passer FormAjout par elle,
   sauf si tu découvres une raison légitime au court-circuit.

Rends : un point par dette, avec ce que tu as changé et ce que tu n'as pas osé
changer.
```

### C · Le dernier gros morceau du bundle

```
[SOCLE]

TÂCHE : sortir Supabase du chargement initial, ou mesurer honnêtement pourquoi
c'est impossible.

ÉTAT VÉRIFIÉ LE 10/08 (ne le reprends pas de confiance, refais la mesure) :
il n'existe PAS de chunk vendor séparé pour Supabase. La bibliothèque est
DANS le chunk principal `index-*.js` (622 ko, 58 occurrences de « supabase »).
Une note plus ancienne parlait d'un « chunk vendor de 175 ko » — cette note
est fausse aujourd'hui. Commence par établir le poids réel qu'il représente.

Le motif a déjà été appliqué une fois avec succès sur ce projet (bundle initial
714 → 597 ko en passant 12 écrans secondaires en lazy) : lis comment ça a été
fait. `npm run build` affiche la taille de chaque chunk — c'est ta mesure.

Note : le plus gros morceau du build n'est PAS Supabase mais `Carte-*.js`
(1 044 ko, la bibliothèque de carte). Il est déjà en lazy et ne se charge qu'à
l'ouverture de la carte. Si tu conclus que c'est lui le vrai sujet, dis-le —
mais ne t'y attaque pas dans cette tâche.

⚠ PIÈGE DOCUMENTÉ dans ce projet : sous `verbatimModuleSyntax`,
`import { type X }` et `import type { X }` ne se comportent pas pareil pour le
découpage — un import mal écrit ramène tout le module dans le chunk initial.

Contrainte : l'app doit rester utilisable hors-ligne au premier écran, et
l'authentification ne doit pas se mettre à clignoter au démarrage.

Rends : les tailles AVANT et APRÈS (chiffres du build), ce que tu as déplacé,
et ce qui reste incompressible avec la raison.
```

### D · Un audit, sans rien changer

```
[SOCLE]

TÂCHE : audit en LECTURE SEULE. Tu ne modifies aucun fichier.

Cherche dans app/src toutes les promesses que l'app fait et ne tient pas :
· un texte d'interface qui annonce quelque chose que le code ne fait pas
· un bouton qui n'est câblé à rien, ou dont le gestionnaire ne fait qu'un
  console.log
· un état d'erreur qui est avalé sans que l'utilisateur soit prévenu
· un commentaire qui décrit un comportement que le code n'a plus

Ce projet a livré trois bugs de ce genre le 10/08, tous trouvés par
l'utilisateur et non par les tests : une section vide en permanence, des
libellés invisibles, un lien de signalement vers une boîte inexistante. Il y en
a probablement d'autres.

Pour chaque trouvaille : le fichier et la ligne, ce que l'app PROMET, ce
qu'elle FAIT, et ta confiance (certain / probable / à vérifier). Classe par
gravité, du plus trompeur au plus bénin.

Ne propose pas de correctif. Trouve.
```

---

## Ce qu'un agent ne doit PAS prendre seul

Pour mémoire, si quelqu'un est tenté :

| chantier | pourquoi pas |
|---|---|
| signaler / bloquer | sécurité des gens + RLS — session Fable dédiée |
| les notifications push | le service worker porte la mise à jour de l'app |
| la lentille, le geste de juger | décision de produit, avec Ersan sur maquette |
| l'écran « trouver » | attend les maquettes d'Ersan |
| le détourage des stickers | à prototyper, pas à livrer |
| tout ce qui touche la DA | Ersan tranche, sur pièce |
```
