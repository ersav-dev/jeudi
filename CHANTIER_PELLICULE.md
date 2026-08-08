# CHANTIER — « la pellicule fraîche »
*Spécification complète, prête à coder · rédigée le 3 août 2026*

> **✅ CŒUR CODÉ le 7 août 2026** (tsc, eslint, 224 tests, build verts,
> déployé) : `pellicule.ts` (moteur pur testé) · tas de polaroids sur la
> carte (`creerTas` dans Carte.tsx, ancre bottom, étiquette de cire,
> heure au crayon, fonte, souvenir sépia) · carrousel 2 axes
> (`CarrouselPellicule.tsx` : ←→ photos, ↑↓ soirées, carte qui suit via
> `jeudi:easeto`, sceau brisé à ~1 s, sortie « j'y vais. » → la fiche) ·
> accueil = la carte (vue 'carte' par défaut) · état vide-invitation ·
> vu/pas vu local+cloud. **À LA MAIN : coller `0014_pellicule_vues.sql`**
> (sans elle, le vu/pas vu reste local au téléphone — repli propre).
> **✅ RESTES CODÉS le 7 août 2026** (tsc, eslint, tests, build verts) :
> la **ligne-boussole** §1.9 (`ligneBoussole`/`texteBoussole` dans
> pellicule.ts, rendue par Carte.tsx — hors-champ d'abord, puis « karim a
> laissé quelque chose au perchoir », puis « tout est lu » ; tap → easeTo)
> · le **clustering** §5.2 (`grouperTas` union-find sur les boîtes bloc
> compris, `eventailGrappe` ; meneuse = la plus fraîche, « n spots ici »
> au crayon, tap → déploiement, repli au moindre pan · z-order = fraîcheur
> décroissante) · le **développement** §1.7 (`enDeveloppement`,
> `libelleAge` → « ça se développe… », keyframes `tas-developpe` 3,2 s)
> · la **perf** §5.3 (`pelliculeComposite.ts` : l'éventail entier peint
> offscreen en UNE image ≤168 px, 4 `<img>` → 1, repli propre si le canvas
> est souillé ; et le DOM ne garde plus que les tas dans le cadre).
> **Reste du chantier** : le carnet du cercle (§7).

> **À lire en premier par la session qui code.** Tout ce qui est en §1 a été
> tranché avec Ersan après trois jours de prototypage et un panel de 10 agences
> de design — **ne pas re-débattre**, implémenter. Les questions encore
> ouvertes sont en §6, et elles seules.

---

## 0 · La feature en un paragraphe

La carte de jeudi cesse d'être un plan de spots : elle devient **la page du
carnet où la nuit d'hier sèche encore**. Chaque endroit où quelqu'un de ton
cercle a pris des photos récemment porte un **tas de polaroids piqué sur la
carte** — plus c'est frais, plus le tas est grand et épais ; plus ça date,
plus il fond, jusqu'à ne laisser qu'un petit tirage souvenir. Sous chaque tas,
le **prénom** de celui qui a shooté (en étiquette de cire si tu ne l'as pas
encore vu, au crayon une fois lu) et **l'heure** au crayon. On tape un tas, on
feuillette les photos au doigt (gauche/droite) et on traverse toute la nuit du
cercle (haut/bas) pendant que la carte suit derrière. **Ce n'est pas un feed :
c'est fini, c'est signé, ça ne se compte pas, et ça se termine.**

---

## 1 · CE QUI EST DÉCIDÉ

### 1.1 La carte devient l'écran d'accueil
- L'app s'ouvre aujourd'hui sur `macarte` (App.tsx, `useState<Onglet>('macarte')`).
  Elle s'ouvrira sur **la carte avec la pellicule**, tout visible dès la
  première seconde — aucune question, aucun bouton à trouver.
- **Raison** : c'est le seul écran qui change tous les jours sans que
  l'utilisateur fasse quoi que ce soit (ses potes ont vécu). « Sortir » et
  « ma carte » sont identiques d'un jour à l'autre — ce sont des destinations,
  pas des accueils.
- **« sortir » reste le PREMIER onglet de la nav.** On atterrit sur la ville,
  la décision est à un tap, toujours à la même place. On ne déplace pas le
  rituel, on lui donne un vestibule.
- **Condition non négociable** : l'état vide doit être conçu AVANT (voir 1.8),
  sinon on livre un accueil mort au lancement.

### 1.2 Le tas de polaroids
- Un spot avec des photos récentes = un `Marker` DOM contenant un **tas** :
  la photo la plus récente au-dessus (rotation −2°), jusqu'à 3 feuilles
  dessous en éventail (rotations +7°, −9°, +13°), **scotch kraft** en travers
  du coin haut (`::before` ivoire translucide, `mix-blend-mode: screen`),
  coins massicotés 3px (`clip-path` à 8 pans), **épingle graphite** de 5px à
  la position géographique exacte (`::after`, `anchor: 'bottom'`).
- **Taille = fraîcheur de la photo la plus récente du tas**, échelle modulaire
  (~1,33) : `≤6h → 80px · ≤24h → 60px · ≤48h → 45px · >48h → 34px`.
  Transition `width .8s cubic-bezier(.4,0,.2,1)`.
- **Épaisseur de l'éventail = nombre de photos encore vivantes (≤48h)** — les
  feuilles au-delà tombent (voir 1.7). **JAMAIS de badge chiffré** : c'était un
  compteur de likes déguisé, condamné à l'unanimité par le panel.
- Au-delà de 48h : **une seule photo, 34px, sépia** — le souvenir. Il ne
  disparaît jamais (la carte a toujours une mémoire).

### 1.3 Le bloc sous le tas : le prénom + l'heure
Deux lignes, centrées sous le tas :

```
[ karim ]      ← étiquette de cire si PAS VU · texte au crayon si LU
 il y a 2h     ← Caveat, gris, NE CHANGE JAMAIS
```

- **Le prénom porte l'état de lecture** (voir 1.4). C'est LA trouvaille
  d'Ersan : on n'ajoute aucun élément à l'écran, l'information qui était déjà
  là devient l'indicateur.
- **L'heure ne bouge jamais** : c'est un fait, pas un signal. En **Caveat**
  (manuscrit) — tension de matière voulue : *l'étiquette est imprimée (la
  machine te signale), l'heure est écrite à la main (un humain a noté)*.
- Halo de lisibilité obligatoire sur les deux (text-shadow 4 directions en
  `#14120e`) : c'est du texte sur photo, la nuit, dans la rue.
- Caveat **jamais sous 15px** (règle du panel, deux agences l'ont signalée).

### 1.4 Vu / pas vu — l'étiquette de cire
- **Pas vu** : le prénom est dans une étiquette pleine `--cire` (#a8322a),
  texte blanc, `rotate(-1.5deg)`, padding `2px 8px`.
- **La transition** : la cire **glisse vers le bas** et découvre le prénom au
  crayon (`::before` plein cire qui `translateY(105%)`, 0,5s
  `cubic-bezier(.4,0,.2,1)`, le texte passe à `--encre-3` avec 0,15s de délai).
- **Lu** : prénom en `--encre-3`, fond transparent, plus de rotation.
- **La cire ne marque PLUS le récent, elle marque le pas-encore-vu.** La taille
  du tas dit déjà la fraîcheur — la cire ferait doublon. « Il y a quelque chose
  ici pour toi » est la seule information que la carte ne peut pas montrer
  autrement, et c'est le bon usage de l'unique accent rouge de l'app.
- **Rejeté** : le nom barré (« karim » barré se lit *karim est annulé*, et ça
  réintroduit la logique de la case à cocher), le halo de chambre noire (5 tas
  non lus = sapin de Noël), le sceau/point (moins lisible que l'étiquette),
  le calque, le verso, la pochette, le coin corné, le tampon « PAS LU ».

### 1.5 Les deux règles du sceau
- **Le sceau se brise à l'OUVERTURE du tas**, pas quand toutes les photos ont
  été vues. Un garde-fou : ne briser qu'après ~1s passée dedans, pour ne pas
  punir un tap malheureux.
  *Raison* : « quand tout est vu » recrée la dette du non-lu (Insta, les mails)
  et transforme le plaisir en corvée ; en plus le pote le plus bavard finirait
  par crier le plus fort, ce qui n'a rien à voir avec l'intérêt de sa soirée.
- **Un sceau par SOIRÉE, pas par photo.** Si karim reposte 20 minutes plus
  tard, l'étiquette ne se rallume pas. Elle se rallume à la **soirée
  suivante** (le passage d'une nuit, pas une fenêtre glissante de 24h).
  *Raison* : on annonce un événement, on ne notifie pas une personne.

### 1.6 Le carrousel à deux axes
- **← → : les photos** de la soirée courante. La bande suit le doigt **1:1**
  (`pointermove`, `transition:none` pendant le drag), snap au relâcher au seuil
  de 25 % de la largeur, **butées élastiques** (`dx *= 0.35` aux extrémités).
- **↑ ↓ : la soirée suivante / précédente** — **GLOBAL**, tous les tas de la
  carte triés du plus frais au plus ancien. On traverse toute la nuit du cercle
  au pouce sans repasser par la carte.
- **Verrouillage d'axe** dès 10px de mouvement (`Math.hypot(dx,dy)>10` →
  `axe = |dx|>|dy| ? 'x' : 'y'`). Sans ça, le geste dérape et c'est inutilisable
  d'une main.
- **La carte se déplace derrière** : chaque changement de soirée déclenche un
  `map.easeTo({center:[lng,lat], duration:600})`. On referme, on est déjà au
  bon endroit. (Effet découvert au proto — à garder absolument.)
- Contenu d'une diapo : la photo en grand cadre polaroïd (bordure 9px, pied
  52px), le **tip manuscrit** et la **signature** (`— karim`) écrits DANS le
  pied blanc. Au-dessus du cadre : le **nom du spot** en serif italique (on ne
  perd jamais le lieu). En dessous : les points de progression, puis
  `il y a 2h · 3/9 soirées`.
- La sortie du carrousel doit être **« j'y vais. »** — tampon cire, l'unique
  accent de cet écran — qui ajoute au carnet et propose le match s'il y a des
  potes dessus. Le carrousel ne doit jamais être un cul-de-sac émotionnel
  (constat du panel : on crée le désir puis on rend l'utilisateur à sa carte).
- `role="dialog"`, `aria-modal`, Échap, retour du focus sur le tas d'origine,
  `alt` = `${tip} — ${qui}, ${age}`.

### 1.7 Les animations (validées au proto)
- **Naissance** : chaque tas se pique comme une carte à jouer —
  `translateY(-16px) scale(1.08) opacity 0` → état final, `.5s
  cubic-bezier(.34,1.56,.64,1)`, **stagger 90ms, dans l'ordre de fraîcheur
  décroissante** (le plus chaud naît en premier).
- **Développement** : une photo de moins d'1h arrive laiteuse et se révèle —
  `filter: brightness(2.1) saturate(.05) contrast(.55) sepia(.3)` → `none` en
  3,2s. Légende « ça se développe… » au lieu de l'heure.
- **La fonte** : une feuille qui dépasse 48h **pâlit en sépia puis tombe** —
  keyframes 1,5s : `opacity 1` → (55 %) `opacity .6, sepia(.6) saturate(.4)`
  → `opacity 0, sepia(.8) blur(1px), rotate(24deg) translate(14%,42%)`.
  **Jamais un `opacity:0 + scale(.6)`** : ça se lit comme un `delete`, pas
  comme un souvenir qui s'efface.
- `@media (prefers-reduced-motion: reduce)` coupe tout (animations et auto-play).

### 1.8 L'état vide (le piège n°1 du panel)
- À 3 utilisateurs, une pellicule vide = un accueil mort — c'est ce qui a tué
  toutes les cartes sociales sauf Snap.
- **La couche par défaut n'est jamais vide** : les **souvenirs** (les tirages
  anciens, sépia) restent affichés. Les 302 spots du carnet public d'Ersan
  restent des repères à l'encre.
- **Le message de vide est une invitation, jamais un constat** :
  « la ville se recharge — ce soir, c'est toi qui shootes. »
  Sur un spot sans aucune photo : « aucun polaroid ici. le premier sera le tien. »

### 1.9 La ligne du bas = une boussole, pas un compteur
- **Rejeté** : « 3 potes sont sortis depuis jeudi. karim y est encore. » — ça
  compte, ça répète ce que la carte montre, et « karim y est encore » est de la
  surveillance (le reproche fait à Snap Map).
- **La règle** : elle ne parle que de ce qu'on **ne peut pas voir** — hors
  écran, ou pas encore lu. Elle **nomme une chose** plutôt que de compter des
  gens :
  - `au nord, deux tirages que tu n'as pas vus →` (tape → la carte y va)
  - `karim a laissé quelque chose au perchoir.`
  - tout est lu → `tout est lu. à toi d'écrire la suite.`

### 1.10 Vie privée (non négociable)
- **Publication différée d'1h** : une photo « sèche » avant d'apparaître sur la
  carte. C'est littéralement l'imagerie de la marque, et ça tue l'inférence de
  position en temps réel (« karim est AU perchoir MAINTENANT »).
- **Granularité floue en public** : sur la couche publique, « ce soir » /
  « hier soir » ; l'heure précise est réservée au cercle.
- On ne voit **que** ce que la RLS autorise déjà (siennes + cercle + publiques).
  Le compte de photos affiché = **ce que MOI je peux voir**, jamais le total —
  sinon fuite d'information.
- Le marqueur de visibilité (cadenas / cercle / globe, déjà dans l'app) doit
  apparaître dans le carrousel : on doit toujours savoir dans quelle page du
  carnet on lit.

---

## 2 · Les protos de référence (à ouvrir avant de coder)

Servis par `.claude/launch.json` → **`jeudi-design`** (port 5624).

| Fichier | Ce qu'il contient |
|---|---|
| `design/carte_complete.html` | **LA RÉFÉRENCE** — tout assemblé : vraie carte MapLibre, tas, étiquettes, heure, carrousel 2 axes global, carte qui suit |
| `design/carte_pellicule_test.html` | v2 post-panel : naissance, développement, fonte, mode présentation auto-play |
| `design/vu_pas_vu_10.html` | les 10 langages de « pas vu » testés (tous rejetés) |
| `design/vu_pas_vu_prenom.html` | les 10 déclinaisons du prénom-indicateur (la bonne piste) |
| `design/etiquette_vu.html` | les 8 sorties possibles de l'étiquette (→ « la cire qui glisse ») |
| `design/regles_sceau.html` | le banc d'essai des 2 règles de sceau + le carrousel 2 axes |

Le CSS des protos est directement transposable : classes `.tas`, `.f`, `.haut`,
`.kraft`, `.bloc`, `.nom`, `.quand`, et les keyframes `pose` / `tombe` /
`developpe`.

---

## 3 · Le modèle de données — migration `0009_photos_datees.sql`

**Sans ça, rien n'est possible** : les photos ne portent aucune date aujourd'hui.

```sql
-- 0009 — LA PELLICULE : dater les preuves.
-- Une photo doit savoir QUAND elle a été prise et PAR QUI, pour que la carte
-- puisse la faire vieillir. `visible_le` = la publication différée d'1h
-- (la photo « sèche » avant d'apparaître) : la carte ne lit QUE les photos
-- dont visible_le est passé.
alter table public.photos add column if not exists prise_le timestamptz;
alter table public.photos add column if not exists visible_le timestamptz;
alter table public.photos add column if not exists auteur_id uuid
  references public.profils(id) on delete set null;

-- les photos existantes : on les considère anciennes (souvenirs), jamais fraîches
update public.photos set prise_le = coalesce(prise_le, now() - interval '30 days'),
                         visible_le = coalesce(visible_le, now() - interval '30 days')
where prise_le is null;

create index if not exists photos_pellicule_idx
  on public.photos (visible_le desc) where visible_le is not null;

-- le "vu / pas vu" — une ligne par (moi, spot, soirée)
create table if not exists public.vues_pellicule (
  user_id  uuid not null references public.profils(id) on delete cascade,
  lieu_id  uuid not null references public.lieux(id) on delete cascade,
  -- la SOIRÉE lue (date locale du dernier tirage vu) : un sceau par soirée
  soiree   date not null,
  vu_le    timestamptz not null default now(),
  primary key (user_id, lieu_id, soiree)
);
alter table public.vues_pellicule enable row level security;
create policy "mes vues" on public.vues_pellicule
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
```

**Côté client** (`db.ts`) : `PhotoLieu` gagne `priseLe?: string`,
`visibleLe?: string`, `auteurId?: string`, `auteurPrenom?: string` ;
`ligneVersLieu` / `lieuVersLigne` et `chargerPhotos()` (le batch loader,
db.ts:446) transportent les nouveaux champs ; `televerserPhoto` pose
`prise_le = now()` et `visible_le = now() + 1h`.

---

## 4 · Le plan d'implémentation, dans l'ordre

**Étape 1 — les données (aucun visuel)**
1. Écrire `supabase/migrations/0009_photos_datees.sql` (§3). Ersan l'applique
   lui-même dans le SQL Editor.
2. `db.ts` : champs, mapping, chargement, upload. Vérifier que `chargerPhotos()`
   filtre `visible_le <= now()`.
3. Nouveau module **`pellicule.ts`** (logique PURE, testable, ~150 lignes) :
   - `type Tas = { lieu: Lieu; photos: PhotoPellicule[]; fraicheur: number;
     vivantes: number; auteur: string; soiree: string }`
   - `construireTas(lieux, maintenant): Tas[]` — regroupe, trie par fraîcheur
   - `taillePolaroid(h): 80|60|45|34`
   - `libelleAge(h): string` (« il y a 2h » / « hier » / « il y a 3j »)
   - `soireeDe(iso): string` (la nuit à laquelle appartient une photo — une
     photo de 2h du matin appartient à la soirée de la veille : `date - 6h`)
   - `estVu(tas, vues): boolean`
   - **Tests vitest obligatoires** sur les bornes (6h/24h/48h), le passage de
     minuit, le tri, la soirée.

**Étape 2 — la carte (le gros morceau)**
4. `Carte.tsx` : `creerPinLieu` sait déjà fabriquer un marqueur DOM. Ajouter
   `creerTas(tas)` qui rend le tas + le bloc prénom/heure, et l'utiliser quand
   le lieu a des photos fraîches. Réutiliser le diffing existant
   (`poses`/`pinEls`), le fondu de naissance/retrait est déjà là.
5. CSS dans `index.css` : reprendre les blocs `.tas` du proto (§2).
6. Le tap : détection propre (`<8px`, `<300ms`) — **ne pas utiliser `onclick`**,
   sinon un pan qui démarre sur un tas ouvre le carrousel (bug identifié).
7. Zones de frappe 44px sur tout marqueur (`::before` `inset:-16px`).
8. Politique de zoom : classes `z-low`/`z-mid` + `--kz` (0.5 / 0.75 / 1).

**Étape 3 — le carrousel**
9. Nouveau composant **`Pellicule.tsx`** : plein écran, 2 axes, drag 1:1,
   verrouillage d'axe, `easeTo` sur la carte, sortie « j'y vais. ».
10. Marquer vu : insert dans `vues_pellicule` à l'ouverture (+1s), optimiste
    en local d'abord.

**Étape 4 — l'accueil**
11. `App.tsx` : `useState<Onglet>('macarte')` → la carte, vue `carte` par
    défaut avec la pellicule active. Vérifier que « sortir » reste 1er onglet.
12. La ligne-boussole en bas de la carte (§1.9).

**Étape 5 — vérification**
13. `npx tsc -b --noEmit` · `npx eslint src --max-warnings=0` ·
    `npm run test` (109 tests + les nouveaux) · `npm run build`.
14. Test réel sur téléphone : une photo prise ce soir doit apparaître dans 1h.

---

## 5 · Les contraintes du panel des 10 agences (à ne pas oublier)

1. **UN seul rouge cire à l'écran** — il appartient désormais au pas-encore-vu,
   à rien d'autre. Slider, boutons, points de carrousel : à l'encre.
2. **Clustering obligatoire** : avec 302 spots, Oberkampf un samedi = 15 tas
   superposés. Quand deux tas se chevauchent, ils fusionnent en un tas commun
   (rotations plus fortes) avec « 3 spots ici » au crayon ; le tap les déploie
   en éventail. Z-order = fraîcheur décroissante.
3. **Perfs** : ne PAS charger 4 `<img>` par tas × 300 spots. Aplatir chaque
   éventail en **une image composite** générée offscreen (canvas), ou
   lazy-loader les feuilles cachées. Miniatures à 2× la taille affichée max
   (168px). Le DOM ne garde que les tas visibles.
4. **Pas de filtre CSS sur le canvas** de la carte (recomposition à chaque
   frame = gouffre à batterie) : teinter via les propriétés `raster-*` de
   MapLibre. Tuiles **`dark_nolabels`** (notre toponymie est la seule voix).
5. **Typo de rue** : Caveat ≥ 15px, mono ≥ 11px, halo plein `#14120e` (pas un
   text-shadow flou), `--encre-3` remonté à ~.55 partout où il porte du texte.
6. **A11y** : `aria-label` sur les tas (`${nom}, ${n} photos, la plus récente
   il y a ${h}h`), `<button>` plutôt que `<div onclick>`, `role="dialog"` sur
   le carrousel, `prefers-reduced-motion`.

---

## 6 · Les questions encore ouvertes

1. **La taille minimale du bloc texte.** Sur un tas de 34px, l'étiquette +
   l'heure sont plus larges que la photo. Cacher le nom sous 45px, ou garder
   un plancher de 45px ? *(Constaté sur `carte_complete.html`.)*
2. **L'ordre vertical du carrousel** : fraîcheur pure (retenu) ou pondéré par
   la distance ? Instinct actuel : fraîcheur pure — c'est *la nuit*, pas
   *ton quartier*.
3. ~~**Le nom de la section jumelle dans l'onglet cercle** (§7).~~
   **TRANCHÉ le 7 août 2026 : « les soirs du cercle. »** — la forme voulue par
   Ersan (« … du cercle »), mais avec le bon nom : une entrée n'est pas un
   *spot* (l'annuaire juste en dessous est déjà ça), c'est **une soirée qui a
   eu lieu**. « le carnet du cercle » a été écarté : « carnet » désigne déjà
   *ma carte* ailleurs dans l'app.
4. ~~**Le tri du carnet du cercle.**~~ **TRANCHÉ : chronologique, coupé par
   nuit** — un intertitre au crayon (« ce soir », « hier soir », « samedi »)
   entre chaque nuit ; la semaine se tourne comme des pages et la dernière
   rend la fin évidente. Le groupement par personne est refusé : il recrée des
   profils à consulter et un classement implicite des potes.

---

## 7 · « les soirs du cercle » (partie 2) — ✅ CODÉ le 7 août 2026

> **Livré** (tsc, eslint, 259 tests, build verts) : `pellicule.ts` gagne
> `construireCarnet` / `libelleNuit` / `parNuits` / `tipDeLaSoiree` (purs,
> testés — dérivés de `construireTas`, aucun second pipeline) ·
> `CarnetCercle.tsx` (la section) · `App.tsx` (`carnetCercle` useMemo + rendu
> au-dessus de l'annuaire, qui gagne son titre « ton cercle. ») ·
> `EcranGroupe.tsx` gagne la prop `graine` (le spot de « on y retourne ? »
> arrive déjà coché dans les candidats) · CSS `.carnet-*` · dico EN.
> **DA** : les deux tampons de verdict sont au GRAPHITE (le « bof » a
> strictement la même place que le « validé » — et la cire du deck aurait
> rallumé dix rouges dans la page) ; l'unique cire de l'écran va à
> « on y retourne ? ». **Pas encore vu en vrai sur téléphone.**


Même donnée, lecture humaine au lieu de spatiale — **dans l'onglet `cercle`**,
au-dessus de l'annuaire (qui est aujourd'hui mort, un simple répertoire).

- Une entrée = **le résultat d'une soirée** : le lieu, le **tampon de verdict**
  (validé / bof — ça existe déjà via le swipe de sortie), le **tip manuscrit**,
  la **bande de tirages**, et une ligne d'actions : `j'y vais →` ·
  `garder ce tip →` · **`on y retourne ? →`** (qui lance le match de groupe
  déjà en prod).
- **Ce qui en fait un non-feed, et qui doit être implémenté tel quel** :
  ça **finit** (« c'est tout. ton cercle est sorti 4 fois cette semaine. — à
  toi d'écrire la suite. ») ; l'unité est un **résultat**, pas un post (on ne
  peut pas publier sans être sorti) ; **zéro compteur, zéro like** ; aucun
  algorithme (ton cercle, 7 jours, chronologique) ; et **le « bof » a la même
  place que le « validé »** — c'est même ce qui prouve que ce n'est pas un feed.
- Les ex-libris de l'annuaire portent la même étiquette de cire que les tas
  (même langue partout) — l'app a déjà sa « bulle Instagram », c'est
  l'ex-libris.

---

## 8 · Idées gardées en réserve (du panel, non planifiées)

- **La photo fondatrice** : la toute première photo d'un spot ne fond jamais
  (sépia, coin corné, « ouvert par léa, un jeudi de mars »). Transforme la
  carte vide du lancement en ruée vers l'or.
- **Le polaroid vierge** : quand la bande a matché un spot pour ce soir, un
  cadre blanc VIDE est piqué sur la carte (« ce soir 21h — la bande ») et se
  remplit en direct pendant la soirée. Se branche sur le match déjà livré.
- **L'éventail sous le pouce** : appui long → les polaroids s'étalent sous le
  doigt, on les feuillette sans quitter la carte (proposé par 2 agences
  indépendamment).
- **« Secoue la ville »** : le refresh devient la secousse du polaroid qu'on
  agite ; les nouvelles photos se développent une à une.
- **La bande contact** : mode une-main / batterie faible — la carte se replie,
  les tas défilent en planche contact verticale au pouce.
