# CHANTIER — les stickers du carnet
*Cadrage du 12/08/2026 (session Fable, demande d'Ersan). RIEN n'est codé —
ce document existe pour qu'une session s'y attaque sans découvrir le
terrain, comme CHANTIER_PUSH.md l'a fait pour le push.*

> L'idée était en réserve depuis le 10/08 (« les stickers du carnet :
> photos détourées, la gravure passe le relais au zoom » — mémoire des
> idées d'après-lancement). Ersan la réveille le 12/08 avec trois gestes :
> **faire des stickers**, **changer les monuments**, et — précision de
> dernière minute — **poser des stickers OÙ ON VEUT**.

---

## La vision : le carnet se scrapbooke

La carte de jeudi est un carnet dessiné. Un carnet vivant, on y COLLE des
choses : le ticket du bar, la photo du soir, le visage d'un lieu. Trois
gestes, du plus petit au plus grand :

**A · Ta photo sur un monument** — existe depuis le 10/08 (« mes
monuments », réglages) : la photo remplace la gravure en zoomant.
**B · Changer les monuments** — choisir LESQUELS vivent sur ta carte,
et en gagner de nouveaux.
**C · Le sticker libre** — coller une photo N'IMPORTE OÙ : le banc de
ta rue, la fenêtre de ton premier appart, le kebab de 3 h du matin.

Ce qui ne se renégocie PAS (les trois règles du 10/08 tiennent) :
1. **Strictement personnel.** Rien ne monte au cloud, personne d'autre ne
   le voit — c'est ce qui fait qu'il n'y a AUCUNE modération à écrire.
   (Et depuis la relecture du 12/08, le stockage est scopé PAR COMPTE.)
2. **La gravure ne disparaît pas** — elle tient l'échelle de loin, la
   photo prend le relais en approchant (SEUIL_PHOTO, 64 px).
3. **La taille ne change pas** — le sticker se glisse dans la géométrie
   existante (hauteur en mètres, compression, plafond, anti-empilement).

---

## L'état réel du code (vérifié le 12/08)

- `monuments.ts` : 8 monuments figés — nom, lat/lng, trait SVG monoline,
  gravure `img` + cartouche `etq` (planches d'Ersan). Servent la carte ET
  la recherche du « où ».
- `reperes.ts` : 25 points de rendez-vous, dont ~10 ont DÉJÀ une vignette
  gravée + cartouche — un catalogue de monuments en réserve, prêt.
- `mesMonuments.ts` : le magasin `stickers` (IndexedDB, clé
  `<uid>:<nom>`), `poserSticker()` (réduction canvas → webp 768 px),
  `lireStickers()` (object URLs — ⚠ le pattern de révocation corrigé le
  12/08 dans Carte.tsx est LA référence), `SEUIL_PHOTO`, `LARGEUR_MAX`.
- `Carte.tsx` : le relais gravure→photo est en CSS (`.a-sticker`,
  `vg-photo`), la priorité anti-empilement lit `HAUTEUR_M` (un élément
  sans entrée = priorité 0, voilé sous z12,5 pour les repères).
- L'appui long sur la carte ouvre déjà le panneau de MARQUE (émoji) —
  le geste existe, il peut accueillir une option de plus.
- La maison sait faire le papier déchiré depuis ce midi (la navbas :
  texture d'Ersan + border-image ; et `_enrichissement`/scratch : sharp
  pour traiter les images).

---

## Le plan, geste par geste

### B · Changer les monuments (le plus petit chantier)
1. Un **catalogue** : les 8 monuments actuels + les ~10 repères qui ont
   déjà leur gravure (Alexandre III, Bir-Hakeim, Vendôme, Buren…) = ~18
   candidats, zéro asset à produire.
2. Dans les réglages, « mes monuments » gagne un tiroir « lesquels ? » :
   chaque monument s'active/se désactive (état local scopé par compte,
   même famille que les stickers). Défaut = les 8 actuels.
3. La carte lit la liste active au lieu de MONUMENTS en dur ; la
   recherche du « où » continue de TOUT comprendre (désactiver l'affichage
   ne doit pas casser « rdv à la tour eiffel »).

### A′ · Le sticker devient un STICKER (le détourage)
La photo brute posée sur un monument fait « photo dans un cadre ». Un
sticker, ça a un BORD. Deux options :
- **v1 (reco) : le bord déchiré automatique** — dans `reduire()`, un
  masque irrégulier (canvas, `destination-in`) donne à chaque photo un
  contour de papier arraché + une ombre de contact. Cohérent avec la
  navbas du 12/08, zéro effort utilisateur, zéro IA.
- **v2 (à goûter plus tard) : le lasso au doigt** — tracer le contour
  soi-même, très carnet, très ludique — mais un vrai chantier de geste.
- **Jamais (reco) : le détourage IA** — lourd, aléatoire, et le raté est
  moche ; le déchiré rate toujours bien.

### C · Le sticker libre (le cœur du chantier)
1. **La pose** : appui long sur la carte nue → le panneau de marque gagne
   « coller une photo ici » → galerie → réduction + bord déchiré → posé.
2. **La donnée** : le magasin `stickers` se généralise —
   `<uid>:libre:<id>` → `{ blob, lat, lng, ajoute }` (le monument reste
   `<uid>:<nom>`). Un module `stickers.ts` remplace `mesMonuments.ts`
   (qui devient un cas particulier).
3. **Le rendu** : un marker par sticker libre, hauteur par défaut ~35 m
   (assez pour se voir, jamais plus qu'un monument), même courbe de
   compression, priorité anti-empilement ENTRE monuments et repères
   (c'est TA colle, elle passe devant le décor — mais pas devant la tour).
   Apparition au même seuil que les repères (z ≥ 12,5).
4. **La gestion** : tap sur son sticker → petite feuille « retirer ·
   remplacer » ; et la liste complète dans réglages → « mes stickers »
   (comme les bloqués : on doit pouvoir se dédire de tout, au même
   endroit). Déplacer = v2 (le drag sur une carte est un chantier).
5. **Les gardes** : cap ~24 stickers libres (au-delà la carte redevient
   un mur — et le cap n'est pas un mur : on cure, comme les proches),
   révocation des object URLs au démontage (le pattern du 12/08),
   ~100 ko/sticker webp → ~2,5 Mo au cap, tranquille pour IndexedDB.

---

## Les questions à trancher AVANT de coder (Ersan)

1. **Le bord du sticker v1** : déchiré automatique (reco) — ou tu veux
   direct le lasso au doigt ?
2. **Le geste de pose** : l'appui long → panneau de marque enrichi
   (reco, le geste existe) — ou un mode « colle » dédié ?
3. **Le catalogue de monuments** : activer/désactiver parmi les ~18
   gravés (reco v1) — ou aller jusqu'au monument LIBRE (nom + position
   choisis — c'est alors un sticker libre nommé, et il peut entrer dans
   la recherche du « où ») ?
4. **Le cap** des stickers libres : 24 ?
5. **Le cloud** : on assume le « ça vit sur CE téléphone » (reco v1,
   c'est déjà la règle) — ou bucket privé plus tard (owner-only, toujours
   zéro partage donc toujours zéro modération) ?

## L'ordre d'exécution proposé (1 session + une planche)
1. La planche `design/stickers_001.html` : le bord déchiré sur 3 vraies
   photos + un sticker libre posé sur la carte habitée (on tranche 1 et 3
   sur image).
2. `stickers.ts` généralisé + bord déchiré dans la réduction (+ tests).
3. La pose (panneau de marque) + le rendu carte + la gestion réglages.
4. Le catalogue de monuments.
Estimation : une demi-journée de code après la planche validée.
