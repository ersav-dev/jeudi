# jeudi. — les prompts des chantiers, groupés par modèle
*Rédigé le 7 août 2026. Chaque prompt est AUTONOME : colle-le tel quel
dans une session fraîche du bon modèle (`/model`), il contient tout.
Règles communes déjà incluses dedans : diffs ciblés, vérifs vertes,
jamais de migration appliquée automatiquement (c'est Ersan qui colle).*

---

## 🟣 FABLE 5 — jugement, sécurité, architecture

### P1 · Les notifications push (LE chantier risqué)

```
Lis d'abord F:\ErsanMusa-com\Jeudi_App\CHANTIER_PUSH.md en entier, puis
F:\ErsanMusa-com\Jeudi_App\ETAT_2026-08-07.md (contexte général).

Implémente le push web de jeudi (app React+Vite+PWA dans
F:\ErsanMusa-com\Jeudi_App\app, backend Supabase) en suivant le plan du
chantier À LA LETTRE, dans l'ordre :
1. Migration 0015_push_abonnements.sql (table + RLS) — tu l'ÉCRIS, je la
   colle moi-même dans le SQL Editor, tu ne l'appliques jamais.
2. Bascule vite-plugin-pwa de generateSW vers injectManifest : src/sw.ts
   (precacheAndRoute + handlers push/notificationclick). ⚠️ LE PIÈGE N°1 :
   le toast « nouvelle version » et l'offline doivent survivre — décris-moi
   comment tu l'as vérifié avant toute autre chose.
3. Clés VAPID : donne-moi la commande, je les génère ; la publique va en
   env Vite, la privée dans les secrets Supabase (dis-moi où cliquer).
4. Dans moi → notifications : l'interrupteur « me prévenir »
   (requestPermission + pushManager.subscribe → upsert push_abonnements).
5. L'Edge Function envoyer-push (Deno, web-push) + le cron quotidien ~18h.
   Respecte la LIGNE ÉDITORIALE du chantier : demande de cercle,
   anniversaire, verdict d'hier, rendez-vous du jeudi — RIEN d'autre,
   jamais de réengagement.

Conventions : code et commentaires en français dans la voix du carnet,
diffs ciblés (jamais réécrire un fichier entier), à la fin :
npx tsc -b --noEmit · npx eslint src --max-warnings=0 · npm run test ·
npm run build, tous verts. Propose le déploiement, ne le lance pas sans
mon go. iOS : rappelle-moi les limites (PWA installée, iOS ≥ 16.4).
```

### P2 · La policy RLS « tirage chez un pote » (petit mais sécurité)

```
Contexte : app jeudi (F:\ErsanMusa-com\Jeudi_App\app, backend Supabase).
Lis la section « Ce qui reste » de la mémoire du chantier pellicule et la
limite décrite dans F:\ErsanMusa-com\Jeudi_App\CHANTIER_PELLICULE.md :
aujourd'hui la RLS n'autorise les photos que sur MES lieux — un tirage du
soir pris sur le spot d'un POTE reste local au téléphone.

Objectif : permettre d'écrire un tirage (type 'soir') sur un lieu du
cercle, SANS pouvoir toucher aux photos des autres.
1. Étudie les policies existantes de la table photos (migrations 0001,
   0008, 0010) et syncPhotosLieu dans app/src/db.ts — comprends pourquoi
   il « réécrit tout » et pourquoi c'est incompatible avec des photos
   multi-auteurs sur un même lieu.
2. Propose-moi D'ABORD le design (policy auteur_id = auth.uid() pour
   insert/delete de SES lignes seulement + un chemin d'écriture qui
   n'efface plus les lignes des autres) — ATTENDS ma validation avant de
   coder. C'est de la sécurité : zéro raccourci.
3. Puis : migration 0016 (je la colle moi-même) + adaptation minimale de
   db.ts + tests.
Vérifs vertes (tsc/eslint/test/build), diffs ciblés, français.
```

---

## 🔵 OPUS — exécution solide contre spec écrite

### P3 · Les finitions de la carte-pellicule

```
Lis d'abord F:\ErsanMusa-com\Jeudi_App\CHANTIER_PELLICULE.md EN ENTIER —
l'en-tête dit ce qui est déjà codé (le cœur : tas, carrousel, accueil).
Tu implémentes les RESTES, dans l'app F:\ErsanMusa-com\Jeudi_App\app :

1. §1.9 LA LIGNE-BOUSSOLE en bas de la carte : elle ne parle QUE de ce
   qu'on ne peut pas voir (hors écran ou pas lu), nomme une chose, ne
   compte jamais des gens. Exemples exacts dans la spec. Taper → easeTo.
2. §5.2 LE CLUSTERING DES TAS : deux tas qui se chevauchent fusionnent en
   un tas commun (« 3 spots ici » au crayon), le tap les déploie.
   Z-order = fraîcheur décroissante.
3. §1.7 LE DÉVELOPPEMENT : une photo < 1 h arrive laiteuse et se révèle en
   3,2 s (les keyframes exactes sont dans la spec), légende « ça se
   développe… ».
4. §5.3 LA PERF : jamais 4 <img> × 300 tas — composite offscreen (canvas)
   ou lazy-load des feuilles cachées ; miniatures 168 px max.

Le code existant : app/src/pellicule.ts (moteur pur testé — étends-le avec
des tests), Carte.tsx (creerTas), CarrouselPellicule.tsx, CSS section
« LA PELLICULE » dans index.css. Le proto de référence :
design/carte_complete.html (servi par launch jeudi-design, port 5624).
Contraintes DA non négociables : UN seul rouge cire par écran, Caveat
jamais < 15 px, prefers-reduced-motion coupe tout.
Conventions : français, diffs ciblés, tsc/eslint/test/build verts à la
fin. Propose le déploiement, ne le lance pas sans mon go.
```

### P4 · Le carnet du cercle (§7)

```
Lis F:\ErsanMusa-com\Jeudi_App\CHANTIER_PELLICULE.md §7 (« le carnet du
cercle ») et §6.3-6.4 (questions ouvertes : nom de section + tri — propose,
je tranche AVANT que tu codes).

Implémente dans l'onglet cercle de l'app (F:\ErsanMusa-com\Jeudi_App\app,
App.tsx), AU-DESSUS de l'annuaire : la lecture HUMAINE de la pellicule.
- Une entrée = le RÉSULTAT d'une soirée : lieu, tampon de verdict
  (validé/bof — existe déjà), tip manuscrit, bande de tirages, actions
  « j'y vais → » · « garder ce tip → » · « on y retourne ? → » (branche le
  match de groupe existant).
- CE QUI EN FAIT UN NON-FEED (à implémenter tel quel) : ça FINIT
  (« c'est tout. ton cercle est sorti N fois cette semaine. — à toi
  d'écrire la suite. ») ; zéro compteur, zéro like ; chronologique 7
  jours, aucun algorithme ; le « bof » a la même place que le « validé ».
- Les données : le moteur pellicule.ts existe (construireTas) — réutilise,
  n'invente pas un second pipeline.
Contraintes DA : un seul rouge cire par écran, la langue du carnet.
Français, diffs ciblés, vérifs vertes, déploiement sur mon go.
```

### P5 · Carte v2 — le contour dit le propriétaire

```
Contexte : app jeudi (F:\ErsanMusa-com\Jeudi_App\app). Les épingles de la
carte sont NÉON (variables --pin-* dans index.css, réglées par Ersan —
n'y touche pas sans demander) avec un glyphe de type centré (typesLieu.ts)
et un tampon de cuisine (.pin-douane). La planche de référence :
design/glyphes_carte.html, section « la suite (différée) ».

Objectif : le CONTOUR de l'épingle dit le propriétaire du spot —
· à moi = contour actuel (--pin-contour)
· cercle = tirets (dashed)
· public = pointillé discret (dotted, plus pâle)
Implémente dans Carte.tsx (creerPinLieu sait déjà estAMoi/tipsCercle ;
la notion cercle passe par lieu.proprietaire et idsCercle côté App) +
CSS. Les pins curateurs et marqués gardent leurs styles. Mets à jour la
planche design/glyphes_carte.html pour refléter le réel.
Français, diffs ciblés, vérifs vertes, déploiement sur mon go.
```

### P6 · La fusion d'enrichissement (avec la clé Google)

```
Lis F:\ErsanMusa-com\Jeudi_App\_enrichissement\rapport.md et regarde les
scripts enrichir_osm.mjs / enrichir_google.mjs + les packs gpt_packs.
État : OSM fait (237/306 spots, 137 horaires), packs GPT prêts, Google
Places [CLÉ FOURNIE : ___ ] ou à lancer avec « lance Google ».

Objectif : UN script de fusion (nouveau .mjs dans _enrichissement) qui
croise OSM + GPT + Google et produit, pour chacun des ~306 spots du
carnet public, un type/cuisine FIABLE + horaires consolidés → un SQL
d'update de lieux.description (et horaires manquants) que je collerai
moi-même. Règles : une saisie manuelle existante prime TOUJOURS ; en
désaccord entre sources, priorité Google > OSM > GPT ; chaque décision
loggée dans un rapport lisible (combien de spots changent de glyphe ?).
Le but final : les glyphes (typesLieu.ts) et tampons de cuisine justes
sur toute la carte. Français, vérifs, rien d'appliqué sans moi.
```

---

## 🟢 SONNET — mécanique, volumineux, motif établi

### P7 · Finir l'anglais (LE chantier Sonnet parfait)

```
App jeudi : F:\ErsanMusa-com\Jeudi_App\app. Le système i18n est
src/langue.ts : LE FRANÇAIS EST LA CLÉ — t('chaîne française') rend la
chaîne telle quelle en fr et sa traduction via le dictionnaire EN ;
absente = repli fr (jamais de casse). Le LEXIQUE (alloco, apéro, resto,
tranquilo, incognito, turbo, gastro, disco…) ne se traduit JAMAIS : c'est
la marque (il se glose ailleurs).

Mission MÉCANIQUE, écran par écran, commit par écran :
1. Repère les chaînes UI codées en dur (hors t()) dans : l'écran profil/
   réglages (App.tsx, fonction Reglages et autour), le deck (CeSoir.tsx),
   la fiche (App.tsx, fonction fiche), la carte (Carte.tsx : bottom-sheet,
   légendes), TirageDuSoir/ImportBobine résiduels, CarrouselPellicule,
   fetes.ts (les noms/mots des fêtes passent par t() à l'AFFICHAGE, pas
   dans les données).
2. Enveloppe-les dans t('…') SANS changer le texte français d'un
   caractère (c'est la clé du dictionnaire !) et ajoute l'entrée EN dans
   langue.ts — un anglais dans la voix de jeudi, sec et chaleureux, pas
   du Google Translate (regarde les entrées existantes pour le ton).
3. Interdits : traduire le lexique, toucher à la logique, réécrire des
   fichiers entiers (diffs ciblés uniquement).
4. Après CHAQUE écran : npx tsc -b --noEmit et npx eslint src
   --max-warnings=0 verts. À la fin : npm run test et npm run build.
Rends-moi la liste des écrans couverts + le nombre de chaînes ajoutées.
Ne déploie pas — je le ferai.
```

### P8 · Les petites dettes (une session balai)

```
App jeudi : F:\ErsanMusa-com\Jeudi_App\app. Quatre petites dettes listées
dans ETAT_2026-08-07.md §5, à traiter en diffs ciblés, une par une, avec
tsc/eslint/test/build verts entre chaque :
1. CODE-SPLITTING : le chunk principal ~685 kB et Carte ~1 Mo — passe ce
   qui s'y prête en import() dynamique (le Carrousel de la pellicule, le
   Projecteur super 8, ImportBobine…, MapLibre est déjà lazy). Objectif :
   chunk principal < 400 kB gzip sans casser le PWA precache.
2. Ajoute 2-3 FÊTES au calendrier fetes.ts si je t'en donne (sinon saute).
3. Vérifie que TOUTES les nouvelles chaînes du 07/08 ont leur entrée EN
   dans langue.ts (compare aux t() du code) — complète les manquantes.
4. RIEN d'autre : pas de refactor opportuniste, pas de « tant qu'on y
   est ». Rends-moi le bilan chiffré (tailles avant/après).
```

---

## Le mode d'emploi

1. `/model` → choisis le modèle → colle le prompt → laisse travailler.
2. Les migrations produites : TOUJOURS toi qui les colles (SQL Editor →
   Run → Save `migration 00XX — titre`).
3. Un chantier fini = demande le déploiement (`vercel --prod` dans app/)
   ou colle la commande toi-même.
4. Doute, arbitrage, bug bizarre → reviens sur Fable avec le contexte.
```
