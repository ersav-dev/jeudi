# CHANTIER — signaler et bloquer
*Cadrage du 10 août 2026. Session Fable du mercredi 12 : FAIT — voir
« l'état au 12/08 » ci-dessous. Reste à coller les migrations et à
lancer l'attaque.*

---

## L'état au 12/08 (session Fable)

**Codé, testé (493 tests verts, tsc 0, build vert), non appliqué en base :**
- `supabase/migrations/0018_signalements.sql` — la table + RLS (chacun crée
  et lit les siens). Pas de FK vers la cible : le signalement survit à la
  suppression ; `contexte` fige de quoi comprendre après coup.
  ⚠ Numérotation : le push (CHANTIER_PUSH.md) glisse en 0020.
- `supabase/migrations/0019_blocages.sql` — la table (+ `prenom_fige`,
  l'instantané pour la liste des réglages), `sont_bloques()`, les RPC
  `bloquer()`/`debloquer()` (ménage : relation + anneau des deux côtés), et
  le blocage glissé dans `est_dans_mon_cercle()`, `lieu_visible()` et
  `chemin_photo_visible()` → lieux, tips, photos, rayures, jugements et les
  DEUX buckets d'un coup. Policies retouchées : lieux (passe par
  lieu_visible — ça rend vraie la règle d'ancienneté de la 0013, qui ne
  gardait pas la table), tips (lecture ET écriture), vitrine, relations,
  sg_participants + sg_rejoindre (un match en cours finit ; le prochain ne
  les réunit plus).
- Côté app : `signalerCible()` écrit en base (le lieu depuis la fiche, la
  photo via le vrai formulaire — le mailto: est mort) ; `bloquerMembre()` /
  `debloquerMembre()` / `listeBloques()` ; bouton deux-taps dans la feuille
  membre, « bloquer » sur une demande reçue, section « bloqués » des
  réglages. Voix du carnet : « c'est noté. », jamais de merci.
- `_verification/attaque_blocage.mjs` — l'attaque du plan §4, automatisée
  (mode d'emploi en tête du script).

**Les quatre décisions, prises par Ersan le 12/08 :**
1. le mot : « bloquer » provisoire à l'écran, le mot de marque se tranche
   en fin de session ; 2. le passé : ses photos disparaissent ;
3. un match en cours finit, puis plus jamais ; 4. destinataire :
contact@jeudi.app (boîte à créer — la table se lit dans Supabase en
attendant).

**Reste, dans l'ordre :** Ersan colle 0018 puis 0019 (SQL Editor) · deux
jetons + `node ../_verification/attaque_blocage.mjs` depuis app/ — zéro
fuite exigé · trancher le mot de marque · acheter jeudi.app + créer la
boîte (verrou porte 2) · l'obligation n°1 d'Apple (le filtre de contenu)
reste un chantier à part.

---

*Le cadrage d'origine, ci-dessous, reste la référence du pourquoi.*

> Ce document existe pour la même raison que `CHANTIER_PUSH.md` : pour que la
> session ne brûle pas sa matinée à découvrir le terrain.

---

## Pourquoi c'est un verrou, et pas une case à cocher

Le **panel du 10 août** (5 professionnels, 5 utilisateurs — rapport dans
`PANEL_VELIB_BUS_2026-08-10.md`) a fait remonter ça sans qu'on le lui demande,
et l'argument le plus fort n'est pas venu d'un pro :

> « Vous m'envoyez marcher seule vers un arrêt vide pour rien — c'est exactement
> le genre de fausse promesse qui me met en danger. »

Le même raisonnement s'applique ici, en plus grave : jeudi fait se **croiser des
inconnus** dans des lieux réels, la nuit, avec des photos et une géolocalisation.
Une app qui permet ça doit permettre de se retirer de quelqu'un. Aujourd'hui elle
ne le permet pas.

Ce n'est donc **pas** un chantier « pour les stores ». C'est un chantier de
produit qui se trouve aussi être exigé par les stores.

---

## L'état réel, vérifié dans le code le 10/08

### Signaler un lieu — n'existe pas
`lireSignales()` / la liste `'jeudi-signales'` (db.ts ~3076) est une liste d'ids
en **localStorage**. Signaler un lieu ne fait donc rien d'autre que poser un
drapeau **sur ton propre téléphone**. Personne n'est prévenu, rien ne remonte,
et le drapeau disparaît si tu changes d'appareil.

### Signaler une photo — part vers une adresse qui n'existe pas
`lienSignalement()` (photos.ts ~43) fabrique un `mailto:` vers
`CONTACT_RETRAIT`. Le lien est propre, le corps du message est bien écrit
(« Ce que je demande », « Pourquoi »)… mais **la boîte n'existe pas** : le
domaine n'est pas acheté. Un signalement de photo rebondit donc aujourd'hui.
C'est déjà noté dans la liste d'Ersan, et ça devient bloquant ici.

### Bloquer quelqu'un — n'existe pas du tout
`retirerDuCercle()` (db.ts ~2731) supprime la ligne de `relations` dans les deux
sens. **Ce n'est pas un blocage** :
- la personne peut re-demander à rejoindre ton cercle dès la seconde suivante ;
- elle continue de voir **tous tes spots publics** (la RLS les sert à tous les
  inscrits — c'est le fond du carnet, 302 spots) ;
- elle reste visible dans la recherche d'amis ;
- rien ne l'empêche de reparaître dans un match de groupe.

**Il n'y a aujourd'hui aucun moyen, dans jeudi, d'empêcher quelqu'un de te voir.**

---

## Ce que les deux stores exigent, littéralement

Apple, guideline **1.2** (contenu généré par les utilisateurs) — quatre
obligations, pas trois :
1. un filtre du contenu répréhensible,
2. un **mécanisme de signalement**,
3. la possibilité de **bloquer les utilisateurs abusifs**,
4. un moyen de te joindre, **publié**.

Google, politique UGC : modération « robuste, effective et continue », et
**signalement ET blocage** en app — l'un sans l'autre ne suffit pas.

Nous en avons **zéro sur quatre** qui fonctionne réellement.

---

## Le morceau difficile : bloquer, c'est de la RLS

Écrire une table `blocages` prend dix minutes. **Faire respecter un blocage en
lecture, c'est le vrai chantier**, et c'est pour ça que cette session est pour
Fable.

Un blocage doit être **symétrique en lecture** (ni lui ne me voit, ni je ne le
vois) et il traverse presque toutes les tables :

| table | ce qui doit disparaître |
|---|---|
| `lieux` | ses spots publics ET ceux qu'il partage au cercle |
| `photos` | les photos accrochées à ses lieux |
| `tips` | ses mots signés (`auteur_id`) |
| `rayures` (0015) | ses rayures — elles sont signées, donc identifiantes |
| `jugements` (0017) | son regard sur les lieux, quand la lentille arrivera |
| `super_potes` (0017) | l'anneau intérieur ne doit pas le proposer |
| `relations` | plus de demande possible, dans aucun sens |
| `sorties_groupe` + `sg_candidats` | ne pas se retrouver dans le même match |
| `vues_pellicule` / la pellicule | ses tirages ne doivent pas apparaître dans « les soirs du cercle » |
| `profils` / la recherche d'amis | il ne doit plus être trouvable par moi |

**Le piège n°1** : la lecture des lieux se fait aujourd'hui **sans filtre
`owner_id`** — c'est la RLS qui décide seule ce que je vois (voir `tousLesLieux`,
db.ts). Ajouter le blocage côté client ne servirait donc à rien : il faut le
poser **dans les policies**, sinon la donnée descend quand même et un simple
outil de développement la révèle.

**Le piège n°2** : une policy en `not exists (select 1 from blocages …)` sur
chaque lecture coûte, et `lieux` est lu à chaque ouverture de l'app. Prévoir
l'index, et mesurer avant/après — pas deviner.

**Le piège n°3** : que devient l'existant au moment du blocage ? Un match en
cours où vous êtes tous les deux ? Un spot de lui que j'ai adopté ? Une rayure
de lui qui pèse sur ma carte ? Ces cas doivent être **décidés**, pas découverts
en production.

---

## Le plan, dans l'ordre

1. **Migration 0018 — `signalements`.** `(id, auteur_id, cible_type, cible_id,
   motif, texte, cree_le, etat)`. `cible_type` ∈ lieu · photo · tip · profil.
   RLS : chacun crée les siens et ne lit que les siens ; personne ne lit ceux
   des autres. **Aucune suppression automatique** — un signalement est un
   signal, pas un verdict.
2. **Migration 0019 — `blocages`.** `(bloqueur_id, bloque_id, cree_le)`, clé
   primaire sur le couple, plus l'index inverse pour la symétrie. Et une
   fonction `sont_bloques(a, b)` en SQL, **stable**, pour ne pas récrire la
   condition dans quinze policies.
3. **Les policies, table par table** (la liste ci-dessus). C'est le cœur, et
   c'est là que la session doit passer son temps.
4. **Vérification par l'attaque, pas par l'UI** : deux comptes, on se bloque, et
   on interroge l'API REST **à la main** avec le jeton de l'autre. Si la donnée
   descend encore, la policy est fausse — l'écran, lui, aurait pu mentir.
5. **Côté app** : `signaler(cible)` qui écrit vraiment ; `bloquer(id)` /
   `debloquer(id)` ; la liste des gens bloqués dans les réglages (on doit pouvoir
   se dédire) ; et le remplacement du `mailto:` par un vrai formulaire.
6. **L'adresse de contact** doit exister avant de sortir : c'est la 4ᵉ
   obligation, et elle est déjà écrite dans l'app.

---

## La ligne éditoriale — à écrire dans la voix du carnet

Aussi important que la technique, et c'est ce qui distinguera jeudi d'un
formulaire d'abus.

- **Bloquer n'est pas une arme, c'est une porte qu'on ferme.** Le mot juste n'est
  probablement pas « bloquer » : plutôt « **je ne veux plus le croiser** ». À
  trancher avec Ersan — c'est un mot de marque.
- **Un blocage est silencieux.** La personne n'est jamais prévenue. Elle ne doit
  pas non plus pouvoir le déduire d'un message d'erreur : ses écritures
  réussissent, elles n'atteignent simplement plus personne.
- **Un signalement se confirme, il ne remercie pas.** « c'est noté. » et rien de
  plus — ni « merci », ni promesse de délai qu'on ne tiendra pas.
- **Jamais de compteur.** Ni « 3 signalements », ni badge : la règle n°1 du
  projet tient ici aussi.
- Se dédire doit être aussi facile que bloquer.

---

## Ce qu'Ersan doit décider avant la session

1. **Le mot.** « bloquer » ou autre chose ?
2. **Le blocage emporte-t-il le passé ?** Ses photos déjà sur mes spots
   adoptés : elles disparaissent ou elles restent ?
3. **Un match en cours** où vous êtes tous les deux : il se casse, ou il finit ?
4. **Qui reçoit les signalements ?** Sans destinataire, la table se remplit et
   personne ne lit. Une boîte mail suffit pour trente personnes ; il faut juste
   qu'elle existe.

---

## Pourquoi c'est avant l'ouverture publique et pas après

Le 27 août (porte 1) réunit trente personnes qui se connaissent : la pression
sociale suffit, on peut sortir sans. Le **24 septembre**, des inconnus arrivent —
et là, l'absence de blocage n'est plus un manque de fonctionnalité, c'est un
défaut de conception qu'on ne pourra plus rattraper discrètement.

**C'est donc un verrou de la porte 2, et le seul de cette liste qui touche à la
sécurité des gens plutôt qu'au confort.**
