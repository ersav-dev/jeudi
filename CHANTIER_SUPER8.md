# CHANTIER — « le super 8 »
*Spécification rédigée le 7 août 2026, amendée le même jour
(10 s actées · plus aucun refus par la date · l'usure au-delà du sépia)*

> **✅ CODÉ le 7 août 2026** — tsc, eslint, 173 tests (dont 27 nouveaux) et
> build verts. **Il reste à faire À LA MAIN : coller
> `supabase/migrations/0011_clips_super8.sql` dans le SQL Editor** (sans
> elle, les clips restent locaux — le repli en couches d'`insererPhotos`
> garde le photogramme en simple tirage). Fichiers livrés :
> `super8.ts` (logique pure + tests) · `bobine.ts` (développement canvas/
> MediaRecorder) · `ImportBobine.tsx` (réglette + chambre noire) ·
> `S8Ecran.tsx` (habillage projeté) · `Projecteur.tsx` · branchements
> dans `db.ts`, `TirageDuSoir.tsx`, `App.tsx` (fiche), `index.css`,
> `langue.ts`. À valider sur téléphone (TESTER_SUR_TELEPHONE.md) :
> import réel Android ↔ iPhone.

> **À lire en premier par la session qui code.** Tout ce qui est en §1 a été
> tranché avec Ersan le 7 août — **ne pas re-débattre**, implémenter. Les
> questions encore ouvertes sont en §7, et elles seules.
> Ce chantier prolonge `CHANTIER_PELLICULE.md` : un clip EST un tirage qui
> bouge. Tout ce que la pellicule sait faire avec une photo (tas, carrousel,
> RLS, publication différée, fonte) doit marcher avec un clip **sans refactor**.

---

## 0 · La feature en un paragraphe

À côté du tirage photo, la pellicule accueille des **clips « super 8 »** :
**10 secondes maximum, muets**, importés de la galerie du téléphone comme les
photos. **Aucun clip n'est refusé** — on fait confiance aux gens. La date de
création du fichier est simplement lue (comme l'EXIF du tirage) pour que le
carnet dise la vérité : un clip de ce soir entre **frais**, un clip du mois
dernier entre **en souvenir** — la bobine porte les traces de son âge :
rayures, poussières, sautillement, et seulement en dernier le sépia (§1.6). Une vidéo plus longue passe par **la
réglette** : on choisit SA bobine de 10 secondes dedans. Dans la
pellicule, le clip se présente comme une photo — son **photogramme** — avec
une perforation de pellicule sur le bord ; on le touche, le projecteur
s'allume. Le **grain, la vignette, le tremblement** sont projetés à la
lecture, jamais cuits dans le fichier : c'est **la chambre noire**, et
l'utilisateur pourra régler son rendu comme il veut, aujourd'hui et dans
deux ans, sans jamais retoucher la vidéo. **On ne met pas en scène — on
développe.**

---

## 1 · CE QUI EST DÉCIDÉ

### 1.1 Import galerie, en confiance — la date raconte, elle ne barre pas
- L'entrée principale est **l'import depuis la galerie**, comme le tirage.
  Personne ne pense à ouvrir Jeudi au moment où le pote plonge — le clip
  existe déjà dans le téléphone quand l'envie de le partager arrive.
- **AUCUN refus, aucune vérification-sanction** (décision d'Ersan, 7 août :
  on fait confiance aux gens). Pas de message « cette bobine date d'un autre
  soir », pas de fenêtre de soirée à respecter, pas de police.
- **Mais on lit quand même la date de création** (l'en-tête MP4/MOV,
  équivalent de l'EXIF) — non pas pour juger, pour **écrire la vérité dans
  le carnet** : elle remplit `prise_le`, dont la pellicule a de toute façon
  besoin pour faire vieillir les choses. Conséquence naturelle, déjà dans la
  langue de la 0010 : un clip de ce soir naît **frais**, un clip du mois
  dernier naît **souvenir** — daté au crayon (« un soir de juillet ») et
  marqué par **l'usure** (§1.6) : rayures, poussières, sautillement, pas
  seulement du sépia. Le contenu recyclé n'est pas bloqué — il est
  simplement daté honnêtement, et ne peut donc pas se faire passer pour la
  nuit dernière. La confiance porte
  sur les personnes ; l'honnêteté porte sur le carnet.
- Date illisible (fichier transféré, format exotique) : repli sur
  `file.lastModified`, et en dernier recours `now()` — le doute profite à
  l'utilisateur, jamais l'inverse.
- **La caméra in-app existe en bonus discret** (un petit bouton caméra à côté
  de l'import), pour les rares moments où on y pense. Elle filme façon
  cartouche : pas de compte à rebours numérique, une pellicule qui défile,
  et à 10 s **ça claque et ça coupe** — la fin de cartouche est un petit
  événement charmant, pas un échec. Les fins coupées au milieu d'un rire,
  c'est exactement ce qui rend le super 8 touchant.

### 1.2 La réglette — 10 secondes, un geste, pas une interdiction
- Une vidéo importée de plus de 10 s n'est **pas refusée** : une réglette
  façon bande de pellicule s'affiche (photogrammes en vignettes) et
  l'utilisateur fait glisser sa **fenêtre de 10 secondes**. « Quel est LE
  moment ? » est un plaisir, pas une punition.
- **L'extrait est réencodé côté client** : on rejoue la fenêtre choisie sur
  un `<canvas>` (720p max) et on la recapture au `MediaRecorder`. Deux
  oiseaux d'une pierre : la durée est garantie ET toutes les vidéos
  ressortent normalisées (fini le zoo HEVC 4K / MOV / 60fps), ~3-5 Mo par
  clip.
- Une vidéo de moins de 10 s passe telle quelle dans le même réencodage
  (normalisation systématique — un seul chemin de code).

### 1.3 Muet par défaut, toujours
- Le clip se projette **muet**. Un tap sur l'icône son pendant la lecture
  l'active pour CE visionnage — jamais de son par défaut, jamais de réglage
  global « son activé ».
- **Raison** : c'est l'ADN super 8 (le format était muet), c'est l'usage réel
  (on regarde dans le métro, au bureau), et c'est ce qui permet le
  photogramme silencieux dans la pellicule sans surprise sonore.

### 1.4 Tap-to-play — jamais d'autoplay
- Dans la pellicule (album, futurs tas, carrousel), un clip apparaît comme
  **une photo** : son photogramme, généré à l'upload, avec une **perforation
  de pellicule** sur le bord gauche (le seul indice que ça bouge). On touche,
  le projecteur s'allume ; on retouche ou on swipe, il s'éteint.
- **Rejeté : l'autoplay**, pour trois raisons cumulées :
  1. *Produit* — l'œil est capté par ce qui bouge : l'autoplay écrase les
     tirages photo et transforme la pellicule en télévision.
  2. *Technique* — l'autoplay iOS/Safari est un champ de mines ; une lecture
     initiée par un tap n'est JAMAIS bloquée par le navigateur.
  3. *Coût* — l'autoplay télécharge chaque clip qui passe à l'écran, regardé
     ou non ; le tap-to-play ne paie que les lectures voulues (bande
     passante divisée par 5-10, et la 4G des gens dans le métro aussi).
- `@media (prefers-reduced-motion: reduce)` : la perforation ne s'anime pas,
  le clip reste tap-to-play (il l'était déjà).

### 1.5 Le rendu est projeté, jamais cuit — et réglable : la chambre noire
- **Le fichier stocké est propre**, tel que réencodé, sans aucun effet. Le
  grain, la vignette, le halo, le léger tremblement, la teinte sont un
  **habillage appliqué par le lecteur au moment de la projection**
  (CSS/WebGL par-dessus le `<video>`).
- **Raison — la réversibilité** : cuire l'effet dans le fichier fige tout
  l'historique avec l'ancien rendu (ou impose de retraiter des milliers de
  vidéos). Projeté à la lecture, on change un shader et toute la pellicule,
  passée et future, adopte le nouveau look. Même principe que la graine
  OKLCH : *la donnée est neutre, le rendu est dérivé*.
- **La chambre noire (demande d'Ersan, 7 août)** : l'utilisateur doit pouvoir
  **régler son rendu comme il veut** — intensité du grain, vignette,
  tremblement, teinte (n&b / sépia / couleur délavée). Concrètement :
  - les réglages sont un **petit objet JSON** (`reglages_rendu`, §4) porté
    par le clip — jamais une transformation du fichier ;
  - un **préréglage « super 8 »** est appliqué par défaut : celui qui ne
    touche à rien obtient le rendu signature de Jeudi ;
  - les réglages sont **modifiables à tout moment, même des mois après**,
    puisque rien n'est détruit — la chambre noire rouvre toujours ;
  - v1 : quelques curseurs simples au moment de l'import (et rouvrables
    depuis le clip). L'étendue exacte des curseurs et les préréglages
    nommés sont en question ouverte (§7).
- Le photogramme affiché dans la pellicule reçoit le **même habillage** que
  la projection (cohérence : la vignette est déjà « développée »).

### 1.6 L'usure — la bobine vieillit comme un vrai film (demande d'Ersan)
- Le vieillissement d'un clip n'est **pas un simple passage au sépia** — le
  sépia, c'est l'usure d'une *photo*. Un film use autrement, et dans cet
  ordre d'apparition à mesure que le clip vieillit :
  1. **poussières et cheveux** qui dansent dans l'image (petites taches
     claires aléatoires) ;
  2. **rayures verticales** — le grand classique du super 8, des filets
     clairs qui tremblent sur toute la hauteur ;
  3. **sautillement de projecteur** (l'image saute d'un ou deux pixels par
     à-coups, le cadre respire) ;
  4. **halos de brûlure** aux bords (le film qui a chauffé) ;
  5. et seulement en dernier, la **dérive de couleur** vers le délavé/sépia.
- **L'usure est CALCULÉE, jamais stockée** : c'est une fonction de l'âge
  (`prise_le → intensité de chaque trace`), appliquée à la projection et au
  photogramme par le même habillage que la chambre noire. Conséquence
  magique du rendu-projeté (1.5) : les clips vieillissent **tout seuls,
  continuellement** — le clip qu'on regarde à 2 mois est plus abîmé que
  quand on l'a regardé à 2 semaines, sans qu'aucun fichier n'ait bougé.
- **L'usure s'ajoute PAR-DESSUS les réglages de la chambre noire**, elle ne
  les remplace pas : le grain choisi par l'utilisateur reste le sien, le
  temps dépose ses traces dessus. Deux couches distinctes dans le code
  (`reglagesVersCss(reglages)` + `usureVersCss(ageEnJours)`).
- Barème indicatif (à régler à l'œil au proto, mais l'esprit est acté) :
  `< 48h` rien · `< 1 semaine` poussières légères · `< 1 mois` + rayures ·
  `< 6 mois` + sautillement et halos · `au-delà` + dérive sépia. Jamais
  jusqu'à l'illisible : le souvenir doit rester regardable — abîmé, pas
  détruit.
- `prefers-reduced-motion` : les traces deviennent statiques (poussières et
  rayures figées, pas de sautillement).

### 1.7 Coûts et stockage — pourquoi c'est quasi gratuit
- 10 s × 720p réencodé ≈ **3-5 Mo par clip** (une photo ≈ 0,3-0,5 Mo).
- **v1 : Supabase Storage**, bucket `clips` calqué sur le bucket `photos`
  (mêmes policies par dossier-uid). Free tier : 500 Mo de stockage +
  5 Go d'egress/mois — assez pour la phase de test entre potes.
- **Bascule prévue : Cloudflare R2** (egress GRATUIT, ~0,015 $/Go/mois,
  10 Go offerts) le jour où l'egress Supabase pique. L'API est S3-compatible,
  la bascule est un changement d'URL de base, pas un refactor — c'est pour ça
  qu'on isole les clips dans LEUR bucket dès le premier jour.
- Le tap-to-play (1.4) est la vraie économie : on ne paie jamais un clip que
  personne n'a voulu regarder.

### 1.8 Vie privée — les règles de la pellicule s'appliquent telles quelles
- **Publication différée d'1h** (`visible_le`) : le clip « sèche » comme le
  tirage — pas d'inférence de position en temps réel.
- Visibilité (privé / cercle / public) : le clip hérite du système existant
  des photos, RLS comprise. Le marqueur cadenas / cercle / globe apparaît
  sur le projecteur.
- Un clip, c'est plus identifiant qu'une photo (visages en mouvement, voix
  si le son est là) : le **muet par défaut** (1.3) est aussi une mesure de
  vie privée — la voix des tiers ne sort jamais sans un geste volontaire.

---

## 2 · Les réalités techniques (à savoir avant de coder)

1. **`MediaRecorder` ne sort pas le même format partout** : Safari/iOS
   produit du MP4 (H.264), Chrome/Android du WebM (VP8/VP9). Règle :
   `MediaRecorder.isTypeSupported()` en préférant `video/mp4`, sinon WebM ;
   on **stocke le mime avec le clip**. Le MP4 se lit partout ; le WebM se
   lit sur Android, desktop et iOS récent. Si de vrais problèmes de lecture
   remontent, on tranchera (§7.4) — pas d'usine à transcodage préventive.
2. **La date de création d'une vidéo** se lit dans l'atome `moov`
   (`creation_time`) du MP4/MOV — parsable côté client (mp4box.js ou un
   parseur minimal maison, on n'a besoin QUE de ce champ). Repli si
   illisible : `file.lastModified`, puis `now()`. Elle ne sert qu'à remplir
   `prise_le` (fraîcheur) — jamais à refuser (§1.1).
3. **Le photogramme** : à l'import, on saisit la première frame nette de la
   fenêtre choisie (seek + `drawImage` sur canvas → JPEG). C'est LUI qui vit
   dans la colonne image existante — la pellicule n'a rien à apprendre.
4. **Le réencodage canvas** est gourmand : afficher une vraie barre de
   développement (« ça se développe… », déjà dans la langue de l'app), et
   le faire à vitesse de lecture réelle (10 s d'extrait = ~10 s de
   traitement, c'est acceptable et honnête).
5. **Le grain WebGL vs CSS** : commencer en CSS pur (bruit SVG en overlay +
   `filter` sur le `<video>`, vignette en `box-shadow` inset, tremblement en
   `transform` keyframes). Passer au shader WebGL seulement si le rendu CSS
   ne suffit pas — pas l'inverse.

---

## 3 · Ce que ça donne dans l'app (parcours)

1. Depuis le flux d'ajout de photos existant, un onglet/bouton **« bobine »**
   à côté du tirage. Import galerie (`<input accept="video/*">`) ou caméra
   cartouche (bonus).
2. Lecture silencieuse de la date de création → elle remplira `prise_le`
   (un vieux clip entrera en souvenir, rien n'est refusé).
3. Vidéo > 10 s → **la réglette** ; ≤ 10 s → direct.
4. **La chambre noire** : aperçu du clip avec le préréglage super 8, curseurs
   (grain / vignette / teinte / tremblement). « développer → »
5. Réencodage (barre « ça se développe… ») → upload bucket `clips` +
   photogramme → ligne `photos` avec `visible_le = now() + 1h`.
6. Dans la pellicule : photogramme + perforation → tap → projecteur plein
   cadre, muet, habillage chambre noire, icône son, marqueur de visibilité.
7. Rouvrir la chambre noire depuis son propre clip : re-réglage instantané
   (c'est juste le JSON qui change).

---

## 4 · Le modèle de données — migration `0011_clips_super8.sql`

**Décision structurante : un clip est une LIGNE DE `photos`.** La colonne
image existante porte le photogramme, et trois colonnes portent la vidéo.
Tout le pipeline existant (visibilité, RLS, `visible_le`, tas, carrousel,
album) fonctionne sans une ligne de refactor.

```sql
-- ════════════════════════════════════════════════════════════════
-- 0011 — LE SUPER 8 : la photo qui bouge.
-- Un clip est une photo (son photogramme) + un fichier vidéo à côté.
-- Le rendu (grain, vignette…) n'est JAMAIS dans le fichier : il vit en
-- JSON et se projette à la lecture — la chambre noire rouvre toujours.
-- À coller tel quel dans Supabase → SQL Editor → Run.
-- ════════════════════════════════════════════════════════════════

alter table public.photos add column if not exists clip_path     text;
alter table public.photos add column if not exists clip_mime     text;
alter table public.photos add column if not exists clip_duree_s  numeric(4,1);
alter table public.photos add column if not exists reglages_rendu jsonb;

-- garde-fou : la durée d'une bobine ne dépasse jamais 10 s
alter table public.photos drop constraint if exists photos_clip_duree_check;
alter table public.photos add constraint photos_clip_duree_check
  check (clip_duree_s is null or (clip_duree_s > 0 and clip_duree_s <= 10));

-- ── le bucket `clips`, calqué sur `photos` (0002) ────────────────
insert into storage.buckets (id, name, public)
values ('clips', 'clips', true)
on conflict (id) do nothing;

drop policy if exists "clips lisibles" on storage.objects;
create policy "clips lisibles" on storage.objects
  for select to public using (bucket_id = 'clips');

drop policy if exists "déposer mes clips" on storage.objects;
create policy "déposer mes clips" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'clips'
    and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "supprimer mes clips" on storage.objects;
create policy "supprimer mes clips" on storage.objects
  for delete to authenticated
  using (bucket_id = 'clips'
    and (storage.foldername(name))[1] = auth.uid()::text);
```

`reglages_rendu` (v1) :

```json
{ "prereglage": "super8", "grain": 0.6, "vignette": 0.4,
  "teinte": "delave", "tremblement": 0.3 }
```

`null` = préréglage « super8 » par défaut. Le schéma JSON est volontairement
lâche : ajouter un curseur demain ne demande AUCUNE migration.

**Côté client** (`db.ts`) : `PhotoLieu` gagne `clipPath?`, `clipMime?`,
`clipDureeS?`, `reglagesRendu?` ; mapping + `chargerPhotos()` transportent
les champs ; un helper `estClip(p)` = `!!p.clipPath`.

---

## 5 · Le plan d'implémentation, dans l'ordre

**Étape 1 — les données (aucun visuel)**
1. `supabase/migrations/0011_clips_super8.sql` (§4). Ersan l'applique
   lui-même dans le SQL Editor.
2. `db.ts` : champs, mapping, upload vidéo vers le bucket `clips`
   (`televerserClip` calqué sur `televerserPhoto`, `visible_le = now()+1h`).
3. Nouveau module **`super8.ts`** (logique PURE, testable) :
   - `lireDateCreation(file): Promise<Date|null>` (moov → repli
     lastModified → now ; ne sert QU'À `prise_le`, jamais à refuser)
   - `choisirMime(): string` (préférence mp4 → webm)
   - `reglagesParDefaut(): ReglagesRendu` + `reglagesVersCss(r): CSSVars`
   - `usureVersCss(ageEnJours): CSSVars` — le barème du §1.6, couche
     séparée qui s'ajoute par-dessus les réglages
   - **Tests vitest obligatoires** : lecture/repli de date, mime, durée,
     bornes du barème d'usure (48h / 1 sem / 1 mois / 6 mois).

**Étape 2 — l'import et la réglette**
4. Composant **`ImportBobine.tsx`** : input vidéo, lecture silencieuse de
   la date, réglette de 10 s (vignettes photogrammes), aperçu.
5. **`developperClip(file, fenetre): Promise<{blob, photogramme}>`** :
   lecture sur canvas 720p + MediaRecorder + capture du photogramme.
   Barre « ça se développe… ».

**Étape 3 — la chambre noire**
6. Composant **`ChambreNoire.tsx`** : aperçu vivant + curseurs (grain,
   vignette, teinte, tremblement), préréglage super 8 par défaut. Le même
   composant sert à l'import ET à la réédition depuis un clip existant
   (il n'écrit que `reglages_rendu`).
7. L'habillage : overlay CSS (bruit SVG, vignette, keyframes tremblement)
   piloté par `reglagesVersCss()`, plus la couche d'usure pilotée par
   `usureVersCss()` (poussières, rayures, sautillement, halos — §1.6) —
   le tout partagé entre photogramme et projecteur.

**Étape 4 — le projecteur**
8. Composant **`Projecteur.tsx`** : plein cadre, tap-to-play, muet + icône
   son (par visionnage), habillage chambre noire, marqueur de visibilité,
   `role="dialog"`, Échap, retour du focus.
9. La perforation sur les photogrammes partout où une photo s'affiche
   (album, futur carrousel de la pellicule — prévoir la classe dès
   maintenant : `.photogramme::before`).

**Étape 5 — vérification**
10. `npx tsc -b --noEmit` · `npx eslint src --max-warnings=0` ·
    `npm run test` · `npm run build`.
11. Test réel croisé : un clip filmé sur Android doit se lire sur iPhone
    (et inversement) ; un clip de la semaine dernière doit entrer daté et
    porter ses premières poussières (jamais refusé, jamais « frais ») ; un
    clip du mois dernier doit montrer les rayures ; le clip doit apparaître
    dans la pellicule 1h après ; la chambre noire rouverte sur un vieux
    clip doit changer les réglages SANS toucher à l'usure.

---

## 6 · Les contraintes à ne pas oublier

1. **Jamais de `<video>` dans une vignette.** L'album et les tas n'affichent
   QUE des photogrammes (`<img>`). Le `<video>` n'existe que dans le
   projecteur, monté au tap, démonté à la fermeture. (Perf + egress.)
2. **`preload="none"`** sur le `<video>` tant que la lecture n'a pas été
   demandée — aucun octet vidéo ne part sans un tap.
3. **Un seul projecteur à la fois** : ouvrir un clip ferme le précédent.
4. **Le réencodage doit survivre à un onglet en arrière-plan** dégradé :
   si la page perd le focus pendant le développement, on met en pause et on
   reprend (le canvas ne peint pas en arrière-plan sur mobile).
5. **Pas de filtre CSS permanent sur le `<video>` en lecture** s'il fait
   ramer les vieux téléphones : l'habillage doit pouvoir se dégrader
   (grain statique plutôt qu'animé) via `prefers-reduced-motion` et un
   garde-fou de FPS.
6. **A11y** : le photogramme a un `alt` (« bobine de ${qui}, ${age}, 8 s »),
   le projecteur est un `dialog`, l'icône son est un `<button>` labellisé.

---

## 7 · Les questions encore ouvertes

1. ~~La durée exacte~~ — **tranché le 7 août : 10 secondes.**
2. **Les curseurs de la chambre noire en v1** : les 4 proposés (grain,
   vignette, teinte, tremblement) ou seulement grain + teinte pour
   commencer ? Et faut-il des préréglages nommés (« kodachrome », « nuit
   américaine »…) ou juste « super 8 » ?
3. **Réglages par clip ou préréglage personnel ?** V1 = par clip (simple,
   déjà dans le schéma). Un « mon rendu par défaut » par utilisateur peut
   venir après — c'est une colonne sur `profils`, pas un refactor.
4. **Le format de secours** : si les clips WebM d'Android posent de vrais
   problèmes de lecture sur les vieux iPhone du cercle, on décidera —
   transcodage à la volée (Cloudflare Stream, ~5 $/mois) ou réencodage plus
   agressif côté client. Ne rien construire tant que le problème n'est pas
   constaté.
5. **Le seuil de bascule vers R2** : proposer « dès que l'egress Supabase
   dépasse 60 % du quota deux mois de suite ». À valider avec les vrais
   chiffres.
6. **Le clip dans la carte-pellicule** (quand le chantier pellicule sera
   codé) : un tas dont la photo du dessus est un photogramme garde-t-il sa
   perforation à 34px ? Probablement oui mais à vérifier à l'œil.
