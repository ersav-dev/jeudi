# REPRISE — jeudi. (« je dis où. »)

> Fichier de passation pour reprendre le travail en nouvelle conversation.
> **Prompt à coller tel quel :** « Lis F:\ErsanMusa-com\Jeudi_App\REPRISE.md et on continue jeudi là où on s'est arrêtés. »

## Le projet en 3 lignes
App PWA pour sortir (seul ou accompagné). Question d'entrée : **« ça dit quoi ce soir ? »** → avec qui (solo·duo·potos·pro) × envie (lexique en -o, vivant selon l'heure) × météo du porte-monnaie → un deck de 8 cartes swipables. Pas d'étoiles, pas de pub, **aucun lieu ne paie**. Des **tips**, jamais des avis. DA « Carnet de Nuit » : papier charbon #15130F, encre ivoire #F0EAD9, UN rouge cire #A8322A, tampon comme logo.

## Les documents de référence
- `CONCEPT.md` / `CONCEPT.pdf` — le concept marketing complet (vision, lexique, règles, business)
- `design/DESIGN_V4_carnet_de_nuit.md` — la DA finale (+ V1/V2/V3 explorées, prompts Stitch/Gemini)
- `_backups/` — sauvegardes datées
- Plan d'audit 30 points : `C:\Users\Ersan\.claude\plans\non-je-veux-d-proud-phoenix.md` (TOUT a été appliqué)

## L'app — état actuel (V1 locale COMPLÈTE, fonctionnelle)
**Code : `app/` (Vite + React + TS, IndexedDB local, zéro backend).**
Lancer : serveur configuré dans `.claude/launch.json` du projet ersanmusa (nom "jeudi", port 5173) — ou `npm run dev` dans `app/`.

Fichiers src/ : `App.tsx` (orchestration, fiche, validation, capture), `CeSoir.tsx` (deck + lexique vivant + rotation hebdo street-food), `Carte.tsx` (MapLibre + tuiles Carto dark), `Onboarding.tsx` (« le swipe, c'est ta langue ? » + critère perso), `Splash.tsx` (tampon + « ça dit quoi ce soir ? » + pitch, 3,8 s), `db.ts` (modèle Lieu/Profil/sorties), `seed.ts` (32 spots : 29 restos d'Ersan + cercle simulé Karim/Léa), `icones.tsx` (SVG encre), `photos.ts` (cache URLs).

**Fait et vérifié** : splash 3 temps (tampon + « ça dit quoi ce soir ? » + pitch) · onboarding · carnet index+carte (pins, popups photo au survol, contrôles zoom/boussole/géoloc EN BAS-DROITE au-dessus du +, voile dégradé sous l'entête, tampon masqué en vue carte) · capture 2 s (géoloc OU adresse Nominatim) + kit photos lieu/verre/wc avec mini-aperçus · 3 visibilités · deck 8 cartes (pile visible, tampons, tap photo = stories, tap tip = autre voix) · récap cliquable · **boucle de validation complète** : « alors, X ? » avec polaroid + compteur n/total si plusieurs sorties + « oublie / redemande plus tard » → « validé. raconte. » : **tampon perso « validé — prénom · date » posé SUR la photo au tap (animé + vibration), persistant (fiche), et INCRUSTÉ dans la photo au partage (canvas)** ; bof → tampon « prénom — passé à côté » ; tip = légende manuscrite sous la photo dans le tirage ; tags pré-cochés modifiables en 2 rangées (avec qui / pour quoi) · fiche multi-tips + édition envies + partage WhatsApp/natif avec image tamponnée · cercle simulé (Karim/Léa) · météo porte-monnaie · lexique vivant (18h apéro→alcolo, 21h +disco, 23h30 fonte) · rotation hebdo street-food · toast annuler · error boundary · icônes encre partout (zéro émoji chrome) · desktop aligné.

## FAIT — session 2026-06-13
- **Carte réparée** : tuiles OK, pins répartis sur Paris (fini la colonne verticale), ancrés au pan/zoom, « i » attribution en bas-gauche replié, contrôles 38px.
- **Position « moi »** = Place Vendôme (`MA_POSITION` dans db.ts) + marqueur ivoire ; base des distances (haversine, helpers `distanceM`/`formatDistance`/`tempsMarche`).
- **Vue par curateur** (onglet cercle) : curateur cliquable → « la carte de X » = LISTE de ses spots + tips (composant `CarteCurateur`).
- **Fiches index en carrousel 3 pages** : infos ← [photos défaut milieu] → m'emmener ; toutes même taille (264px) ; swipe horizontal = page, swipe vertical sur photo = feuilleter (`LigneIndex.tsx`).
- **Infos riches sur fiche** : qui a reco (+nb voix), envies, avec qui, météo, tip, tampon validé, badge fiche complète, distance, horaires (état ouvert/fermé via `etatHoraire`), bouton itinéraire.
- **Menu « ⋯ »** par fiche : visibilité (cycle), archiver, signaler (flag `jeudi-signales`), effacer (`supprimerLieu`, confirmation 2 temps).
- **Formulaire capture enrichi** : envies, avec qui, horaires (`[ouvre,ferme]`, 26=2h), météo — en plus de nom/photos/tip/visibilité.
- **Photos** : `PhotoLieu` accepte `url?` (distante) ; helper `srcPhoto` ; fausses photos picsum sur 4 spots. Seed bumpé **v6**.
- **Concept** : mcdo = « soirée exception » (hors rotation) ; curateurs-à-l'onboarding + Grand Jeudi gravés dans CONCEPT.md.

## FAIT — session 2026-06-13 (propriété & lecture seule)
- **Marqueur de propriété** : champ `proprietaire` sur `Lieu` (`'moi'` ou id de membre ; undefined = mien). Helpers `estAMoi()` + `adopterLieu()` dans db.ts. Seed bumpé **v7** (spots membres → leur id, le reste → 'moi').
- **Spots du cercle en lecture seule** : liseré rouge (`.idx-cercle`), menu réduit à « ajouter à ma carte » + « signaler » (plus de visibilité/archiver/effacer) ; fiche non éditable + mention « le spot d'un pote — lecture seule ».
- **Adopter** : `adopterLieu` crée MA copie privée (source manuel, note vidée, voix d'origine gardée dans tipsCercle, tampon reset). Dédoublonnage par nom → toast « déjà sur ta carte ».
- **Filtre index** `tout · à découvrir · faits` (`.idx-filtres`) : faits = tampon posé, à découvrir = jamais sorti. États vides dédiés. Marqueur « à découvrir » sur les cartes non faites.
- **Éditer ma fiche** : sur MES spots, la fiche édite envies + avec qui + horaires + le prix (météo) via `majLieu` (handlers `basculerCompagnie`/`changerMeteo`/`changerHoraire`, tous gardés par `mien`).
- Vérifié en preview (DOM live) : adoption persiste après reload (34 spots), édition météo persiste, aucun error boundary. tsc --noEmit exit 0. Backup `_backups/2026-06-13_avant-proprietaire`.

## FAIT — session 2026-06-13 (fiche détail enrichie)
- **Fiche = vrai écran de décision** : bloc infos pratiques (distance + temps à pied, état ouvert/fermé coloré + « ouvre/ferme à Xh ») sur tous les spots ; actions côte à côte **« m'y emmener »** (itinéraire Google Maps) + **« envoie à un pote »**.
- **Picker horaires** : composant `ChoixHoraires` (App.tsx) — deux `<select>` natifs (molette/swipe sur iPhone), crans `CRANS_HORAIRE` 0h→4h par demi-heure, ferme >24 = « le lendemain ». Remplace les anciens champs nombre dans la fiche (FormAjout garde encore ses inputs nombre — à harmoniser plus tard).
- **Grosse option « je sais pas »** : `.sais-pas` → `onChange(undefined)`, le lieu repasse « horaires inconnus ». Picker masqué sur les spots du cercle (lecture seule).
- Vérifié DOM live (mes spots + cercle), tsc exit 0. Backup `_backups/2026-06-13_fiche-riche`.
- Pas fait (idée lancée par Ersan, à trancher) : « je sais pas si on veut pas **noter** » → on a choisi le sens « je ne connais pas les horaires ». Reste fidèle au concept : **jamais d'étoiles/notes**. Si Ersan voulait un autre sens, à reclarifier.

## À FINIR — démarré le 2026-06-13, interrompu (stop coût ~69 $)
Reprendre par : « Lis REPRISE.md, on finit ces 4 points. »
1. **Tampon de provenance** (idée Ersan) : un spot SUGGÉRÉ porte le tampon de **celui qui l'a fait** (curateur, ex. « karim ») ; un spot FAIT porte **le nôtre** (validé). À poser sur le polaroïd dans `LigneIndex.tsx` (remplacer le `idx-tampon` VALIDÉ par : valide→toi · sinon non-mien+sig→`tipsCercle[0].auteur`).
2. **Onglet « public »** (choix Ersan : éclaireurs simulés) : 4ᵉ item de nav (IGlobe). Montre les spots `visibilite === 'public'` (mes publics + les éclaireurs hors cercle). **Bout déjà posé** : const `PUBLICS` dans `seed.ts` (4 spots Sofia/Yanis/Inès/Tomas) — **inutilisée → build KO tant que pas câblée**. À faire : loop d'insertion dans `importerSeed` (proprietaire `pub-${id}`, visibilite 'public', tipsCercle voix éclaireur), **bump seed v7→v8**, onglet+vue dans App, filtrer « ma carte »/deck pour exclure les publics étrangers (`estAMoi || proprietaire ∈ MEMBRES`).
3. **Molette horaires jusqu'à 6h** : Paris = bars de nuit jusqu'à 6h. Étendre `CRANS_HORAIRE` de 28 à **30** dans App.tsx (labelHeure gère déjà le %24).
4. **« à tester » assumé** (idée Ersan) : ajouter un spot du cercle/public à son index = déjà couvert par l'adoption (copie sans tampon → « à découvrir »). À décider : en faire un état/onglet explicite « à tester » plutôt qu'un simple « pas encore tamponné » ? UX à trancher avec lui.

## FAIT — session 2026-06-13 (gros sprint : refonte nav, profil, données réelles, carte)
**Navigation & écrans**
- Barre du bas repensée : **ce soir · ma carte · le cercle · mon profil** (l'onglet « public » fusionné dans le sélecteur de « ma carte »).
- **« ma carte »** a un **sélecteur de collection** : `moi · @karim · @léa · public` (en liste ET en carte) ; titre dynamique.
- **« mon profil »** (icône `ITampon`) : tampon prénom + critère, **portrait photo d'identité + trombone** (pas un avatar rond ; photo par défaut `app/src/assets/portrait.jpg` = Ersan), **bio + lien insta** (auto-save), **réglages repliables** (couleur + porte-monnaie).
- **Grand Jeudi RETIRÉ** (pas un jour spécial).

**Couleur de marque personnalisable**
- À l'onboarding (étape « ta couleur ») + dans les réglages : palette 18 teintes → écrit la var CSS `--red` (localStorage `jeudi-couleur`). Tous les glows passent par `color-mix(var(--red))` → suivent la couleur. Tampon canvas du partage aussi.

**Données réelles (Google Maps géocodé Nominatim, scripts dans `__sources/`)**
- **Profil Ersan = 81 lieux** intégrés (`app/src/ersan.ts`) : proprietaire 'moi', **public**, avec tip + cuisine→envie + prix→portefeuille. (fusion `Restaurants Paris.csv` notes + `_02.csv` prix/cuisine, IDF only). Seed bumpé **v10**.
- **Ersan_ALL = 382 lieux géocodés** (`__sources/ersan_all_geocoded.json`) — **PAS encore intégrés** (à faire = profil public séparé `pub-all`, déclenche le clustering).
- Scripts : `geocode.mjs`, `merge_geocode.mjs`, `geocode_bars.mjs`, `geocode_all.mjs`.

**Carte**
- Filtres (tout/ouvert/à tester/faits) visibles **en index ET en carte**, et ils **filtrent la carte**.
- **Labels anti-collision** (règle du débat 9-voix) : 0 label dézoomé · ~8 max par priorité (actif>validé>recommandé par plusieurs>ouvert) sans chevauchement · hystérésis · fond charbon.
- **Une seule popup** ouverte à la fois. Pins **couleur/initiale par curateur** + **badge nb voix**. Pin **« déjà vu »** (halo cyan, historique persistant `jeudi-vus`).

**Fiches & index**
- Navigation **précédent/suivant** dans la fiche (swipe + chevrons ‹ › + compteur).
- Fiche **lecture seule par défaut** → édition derrière bouton **« modifier »** (#1).
- Index : **distance** à côté du nom (page photos, a remplacé la consigne swipe) ; **tampon en bas-droite** (plus au milieu) ; marqueur **« à tester »** en haut-gauche (ne déborde plus).
- Molette horaires type réveil (anti-collision, jusqu'à 6h), « je sais pas » par borne. Prix = « situation du portefeuille » avec valeurs perso (seuils €). Gloses grises inline sous chaque question.
- « redemande plus tard » : enchaîne la sortie suivante, toast sur la dernière.
- Photos de test = **lieux** (loremflickr resto/bar/food/wc), plus de paysages. **apéro** gardé (pas « alcolo »).

**Décisions cadrées (pas codées) :** #6 cercle restreint = la confiance, le chiffre 20 négociable ; #13 Google Sheet = CMS d'édition (pas le moteur) ; #14 photos → Supabase Storage en prod (URL en base).

## FAIT — session 2026-06-13 (sprint des 9 retours restants)
Backups : `_backups/2026-06-13_avant-sprint-9-retours` (avant) · `_backups/2026-06-13_apres-sprint-9-retours` (après). Build prod vert.
- **#2 Récap post-deck** : 3 vues (liste · « en grand » carrousel des tirages · « sur la carte » mini-carte des 8). `Carte` rendue réutilisable via prop `mini` (sans contrôles/légende).
- **#3 Picker couleur** : nouveau composant partagé `PickerCouleur.tsx` (suggestions Pantone — peach fuzz/viva magenta/very peri… — + **roue HSV** qui s'ouvre avec slider de luminosité). Remplace le `PALETTE` dupliqué dans Onboarding + Réglages.
- **#7 Coupe du monde** : champ `match: 'diffuse'|'refuge'` sur Lieu, taggé déterministe au seed (bars ~70% diffusent, spots calmes ~40% refuge). Filtres **match/refuge** (icônes IBallon/IRefuge) dans index ET carte ; **pastille ballon** sur les pins qui diffusent ; signaux sur la fiche.
- **#8 Multi-photos** : composant partagé `KitPhotos` (2-3 photos PAR catégorie lieu/verre/wc, max 3, vignettes + suppression, accent WC). Seed `ph()` donne 2/catégorie. Label de catégorie pendant le feuilletage de l'index.
- **#10 Full-swipe** : composant `QuestionsSwipe` — question en grand au centre, ← → change le choix, ↑ valide, ↓ revient. Rappel du choix (tap = recommencer) puis le deck.
- **#17 Réputé** : titre **« référence »** (≥ 2 voix), jamais d'étoile — sur index + fiche (le badge nb-voix de la carte fait foi).
- **#18 Chips envie** : 1-2 chips d'envie mises en avant sur l'index (compagnies retirées de la rangée pour désencombrer).
- **#22 Propreté WC + critères** : champ `propreteWc: 1|2|3` (LE seul score autorisé), helper `propreteWcLabel` (●●○). Tri index **« au plus proche / propreté des wc »**. Capture de la propreté dans KitPhotos (catégorie WC). Critère perso du curateur exploité sur sa signature de tip (« juge le bruit »).
- Seed bumpé **v10 → v12**. tsc + `npm run build` OK, zéro erreur runtime (vérifié DOM live).
- **Leçon** : `tsc --noEmit` en watch peut mentir (cache) — vérifier aussi le transform du dev server (`curl /src/X.tsx` → 200) ou `npm run build`.

### #20 — audit design (4 skills) : voir le tableau rendu à Ersan en fin de session (à arbitrer, NON appliqué).

### FAIT — #11 carte bottom-sheet + carrousel + grisé (backup `_backups/2026-06-13_avant-carte-bottomsheet`)
- Refonte `Carte.tsx` : suppression des popups maplibre, **state `actif`** (lieu sélectionné).
- **Bottom-sheet** (`.carte-sheet`) : nom + description + distance + bouton « la fiche → », en bas de l'écran.
- **Carrousel** (`.carte-carrousel`) horizontal de tous les lieux (nom + distance), carte active surlignée, scroll-into-view auto.
- **Grisé** : sur sélection, le pin actif passe en couleur + scale, **les autres se grisent** (`.pin-grise`, filter grayscale). Vérifié live : 1 actif / 80 grisés.
- Interaction : tap pin OU carte → sélectionne (sheet + recadrage flyTo padding bas) · tap à nouveau (pin actif / carte active) OU bouton sheet → la fiche.
- Vérifié DOM live (sheet, grisé, fiche), `npm run build` vert.
- **Cartes du carrousel** : photo du lieu en **fond flou + sombre** (blur 2px, brightness .42) + voile dégradé, nom blanc lisible. Légende (`tes spots/curateur/validé`) **retirée** (elle dépassait derrière le carrousel = bazar).
- **Contrôles maplibre remontés** : `bottom 176px` (au-dessus du carrousel) · `bottom 280px` quand un lieu est sélectionné (classe `.carte-sel`, pour libérer le bottom-sheet). Plus rien ne se superpose.
- Couleurs match/refuge restent (audit A5 non tranché).
- **Bloc « détails » enrichi** : photo du lieu en **vignette 72px feuilletable** (tap/swipe) + infos compactes (distance · ouvert/fermé · propreté wc) + bouton fiche. Taille du bloc inchangée (vocabulaire figé : « détails » = bloc haut/sheet, « barre de recherche » = carrousel bas).
- **Liste « à comparer »** (clic long sur une carte du carrousel) : helpers `lireComparer/basculerComparer/viderComparer` (localStorage `jeudi-comparer`), clic long 450ms + vibration, marqueur or sur la carte, barre « à comparer · N » en haut (chips retirables + vider). ⏳ **RESTE : la vraie vue comparaison côte-à-côte** (table des lieux choisis) — pas encore faite.

### FAIT — session 2026-06-14 (carte « détails », fiche, comparaisons)
Backups : `_backups/2026-06-14_avant-comparaisons` · `_backups/2026-06-14_carte-details-comparaisons` (après). Build prod vert.
- **Carte 2 temps** : 1er clic pin = bloc « détails » (nom + desc, plus de popup centrale) · 2e clic / bouton = fiche.
- **Bloc « détails » (sheet)** : **photo plein cadre** (voile dégradé + ombres → texte lisible), **hauteur FIXE 112px** (ne bouge pas entre pages). **4 pages swipe gauche/droite** : 0 = photo claire (sans texte, sans voile), 1 = le mot, 2 = recommandé par, 3 = pratique (horaires/wc/match/envies) — pastilles de page. Photo **feuilletable haut/bas + tap**. Ouvre sur page 1.
- **Carrousel** (« barre de recherche ») : cartes avec **photo en fond flou/sombre**, nom blanc lisible.
- **Grisé/sélection** : pin actif **saturé + lumineux + scale 1.3** (`!important`) ; non‑sélectionnés `.carte .pin-grise` **opacity 0.15** (spécificité forte + `!important` car `.pin-vu`/`.pin-ferme` l'écrasaient). Valeur calée par Ersan.
- **Clic long** sur une carte du carrousel = **« à comparer »** (localStorage `jeudi-comparer`, helpers `lireComparer/basculerComparer/viderComparer`). Barre « à comparer · N » en haut (chips retirables + vider). Carte marquée + pastille jaune.
- **Mode comparaison** : ouvrir la fiche d'un lieu sélectionné → `ouvrirFiche` restreint `ficheListe` aux **seuls lieux comparés** → compteur **1/3** au lieu de 1/82, jusqu'au « vider ». Bouton « détails » devient **« comparer → » en jaune** sur les sélectionnés (flag `actifAComparer`), « la fiche → » sinon.
- **Contrôles maplibre** remontés (`176px`, `280px` quand sheet ouverte) pour ne rien chevaucher.
- **Swipe haut/bas = photo** ajouté **partout** (deck + fiche, en plus de index/récap/sheet). Fiche : `touch-action: pan-x` sur la photo.
- **Fiche** : nom seul dans le blanc du polaroïd, **adresse descendue** sous le tirage. **Adresse complète en live** (reverse‑geocoding Nominatim, cache `jeudi-adr-<id>`) → « 9 Rue Daunou, 75002 Paris ». Helpers `codePostalParis` (80 quartiers → CP) + `adresseLisible` (repli propre). **Bouton « agrandir »** = icône chevrons (sans texte) en bas‑droite du polaroïd → **visionneuse photo plein écran** feuilletable.
- ⏳ RESTE comparaisons : la **vraie vue côte‑à‑côte** (table des lieux) — pas encore faite, là c'est la *liste* + la nav fiche restreinte.

### FAIT — session 2026-06-14 (profil carnet + corrections skills)
- **Profil = fiche d'identité de carnet** : portrait + bloc `dl` (prénom · âge · depuis · spots · critère) à droite. Entête épuré (tampon prénom du haut + « tu juges » **retirés** = redondance skills P2/P3). « changer » décollé du trait.
- **Date de naissance** demandée à l'onboarding (champ date) → **âge calculé** (`ageDepuis`). `Profil.naissance` (YYYY-MM-DD). Pré-rempli 1991-03-06 (Ersan). Calendrier retiré du profil (âge seul affiché).
- **Filtre « match » à 3 états** (refuge supprimé) : tap = diffuse (couleur marque) · appui long 450ms = « match » barré (`l.match !== 'diffuse'`, tout sauf le foot) · re-tap = off.
- **Filtres COMBINABLES** (3 axes ET) : `filtre` (statut tout/decouvrir/faits) + `ouvertOn` (bool) + `matchF` (off/diffuse/refuge). Ex : à tester + ouvert + anti-foot.
- **Corrections skills appliquées** : I5 (mot catégorie retiré de la méta carte index) · A3 (cible tap flèches full-swipe ≥52px) · A7 (bouton « c'est ça » s'allume au drag haut, classe `.pret`) · I8 (contraste chips remonté) · I2/I3 (tri replié en **1 chip** « tri · proche/wc » → rangée TRIER supprimée) · **A4 (lazy-load MapLibre : bundle 1325→300 Ko, chunk `Carte.js` à la demande, `Carte` wrappé en `lazy`+`Suspense` dans App & CeSoir)**.
- A6 (glyphes ✕⋯↑↺) : **laissés** — typographiques, pas des emojis, ne violent pas la DA.
- Backups : `_backups/2026-06-14_avant-corrections-skills` + `…_profil-age-index`. Build prod vert, vérifié DOM live (81 pins, 0 erreur).

### FAIT — session 2026-06-14 (tri pop, header, notifications)
- **Tri en phrase** (pas une pilule) : `trier : au plus proche · populaire · wc propres`. « populaire » = tri par nb de voix (note + tipsCercle). Ordre/wording validés par Ersan.
- **« à tester »** déplacé en bas-droite, **même ligne que les pastilles photo**. BUG corrigé : le sélecteur `.idx-points > span` l'écrasait à 6px (exclu via `:not(.idx-points-tester)`).
- **Rangée collection allégée** (skills I2/I3) : label « voir : » + chips **texte** (active = bleu souligné), distincte des **filtres en pilules** (« qui » vs « quoi »). `.coll-chip` n'est plus une pilule.
- **NOTIFICATIONS** (cloche haut-droite, opposé du logo, `notif-btn` fixed) : badge = nb demandes + lieux à noter. Panneau 2 sections : **« on veut t'ajouter »** (demandes d'amis SIMULÉES `demandes` state Sofia/Yanis, accepter/ignorer → `repondreDemande`) + **« à noter »** (`sortiesEnAttente()`, tap → `setAttente([s])` lance la validation « alors, X ? »). Icône `ICloche`. ⏳ demandes d'amis = vrai social au backend.
- Backups : `_backups/2026-06-14_avant-corrections-skills` … `_notifs-collection-tri`. Build prod vert, vérifié DOM live (badge 2, panneau OK, 0 erreur).

### FAIT — session 2026-06-14 (refonte HEADER « ma carte » + UX)
Backups du jour : `2026-06-14_avant-comparaisons` → `…_titres-typo` (≈12 backups datés). Build prod vert à chaque étape.
- **Topbar unifiée** (`.topbar`) : `jeudi.` gauche · **titre centré sur toutes les pages** (macarte = toggle `index·carte` ; cesoir/cercle/profil = nom de page) · **cloche notif** fixe à droite. Anciens gros titres de page retirés (`mon profil`, `ton cercle`).
- **Typo titres** : serif **roman 22px** (`.topbar-titre`/`.topbar-basculer`, préfixe `.topbar` pour battre `.mono`/`.basculer`). Italique réservé à `jeudi.` + grande-question (32) + mot géant (54). Labels mono 9→10px (a11y).
- **voir : 4 niveaux** `moi·proches·potes·public` (remplace moi/@karim/@léa/public). `MEMBRES[].proche` (Karim proche, Léa pote) ; `idsProches`/`estDesProches` ; `baseCarte` : proches = `estDesProches`, potes = `estDuCercle`. La sélection d'UNE personne = onglet cercle.
- **voir/trier/filtres = 3 menus popover** (composant `MenuCritere`, single-select ; menu `filtres` = multi-toggle inline statut/ouvert/match-diffuse/refuge). Valeur courte affichée (`court`), libellé complet dans le popover. `.menu-critere-droite` ouvre à gauche.
- **Rangée envie** (`.idx-envies`, scroll horizontal) : filtre `envieF` combinable (state `filtre` statut + `ouvertOn` + `matchF` + `envieF`). Chip « tout » supprimée (= état par défaut). Compteur `lieuxFiltres.length` (live) discret en bout de ligne.
- **Match** : la chip pilule a été remplacée par les 2 lignes du menu filtres (« on y voit le foot » / « sans foot »). `filtrePress` (long-press) supprimé.
- **NOTIFICATIONS** : `notif-btn` (cloche) + badge `demandes.length + aNoter.length`. Panneau : « on veut t'ajouter » (`demandes` SIMULÉ Sofia/Yanis, `repondreDemande`) + « à noter » (`aNoter` = `sortiesEnAttente()` **dédoublonné par nom**, tap → `setAttente([s])`). Bouton **vider** + garde-fou (`confirmVider`) : « plus tard » (garde les sorties) / « oublie tout » (`removeItem jeudi-sorties`). Panneau `max-height:72vh` + scroll, `vider` sticky. Masqué quand fiche/ajout/validation ouverts.
- **ce soir (QuestionsSwipe)** : carousel — voisins `motPrec`/`motSuiv` estompés (`.qs-mot-cote` opacity .28). Gloses **1 ligne** (`white-space:nowrap`, COMPAGNIE_GLOSE raccourcies, « — assumé » viré). `iEnvie` défaut **1** (apéro) quand `envies[0]==='dodo'`.
- **Z-INDEX (4 bugs)** : `.idx-reglages`/`.idx-envies` z 5-6 (au-dessus de la map en vue carte) · `.menu-critere-pop` z40 + voile z38 (popover devant les photos) · `.fiche` z5→**30** (au-dessus du menu) · `.fab`/`.navbas` z2→**12** (au-dessus des cartes : ⋯ + pastilles débordaient sur le +).
- **Détails (carte sheet)** : ✕ corrigé — `stopPropagation` sur pointerdown/up + close (ne change plus de photo), cible 40×40. Pastille de page active = ivoire calmé (1,2× / .85). Tampon « recommandé par » réparé (`bottom:auto`, ne s'étire plus sur toute la photo). Adresse complète (reverse-geocode), bouton agrandir → visionneuse.
- **Tri** : phrase → menu ; ajout **« populaire »** (tri par nb de voix). Ordre `proche · populaire · wc propres`.

### FAIT — session 2026-06-14 (lieux favoris / signet)
- **Favori = un signet à l'encre** (pas une étoile : la DA bannit les notes) : bouton `ISignet` (marque-page corné, variante `plein`) en haut-droite de chaque carte d'index, à gauche du ⋯. Vide = contour ivoire ; posé = **plein rouge cire** (`--red`), micro-scale au tap.
- Persisté en localStorage **`jeudi-favoris`** (tableau d'ids) via helpers `lireFavoris`/`basculerFavori` dans db.ts (calqués sur `comparer`). State `favoris` + handler `basculerFav` dans App.
- **Filtre « mes favoris »** en 1ʳᵉ ligne du menu `filtres ⌄` (axe combinable `favOn`, compté dans le badge). Vérifié DOM live : toggle→LS, signet rouge, filtre 81→2 spots, compteur/badge OK. `tsc --noEmit` exit 0. Backup `_backups/2026-06-14_favoris`.
- ⏳ pas encore : le signet sur la **fiche détail** et sur la **carte/deck** (pour l'instant l'index seul) ; éventuel onglet/raccourci « favoris ».

### FAIT — session 2026-06-14 (chantier 1 : la table de comparaison) ✅
- **Table de comparaison côte-à-côte terminée.** Bouton **« comparer → »** (or) sur la barre « à comparer · N » (visible dès 2 lieux) → **overlay plein écran** `TableComparaison` (dans `Carte.tsx`).
- 1 colonne par lieu (2-3), grille CSS `grid-template-columns: auto repeat(N,1fr)`. Lignes : **photo · distance/temps à pied · ouvert-fermé · propreté wc · envies · voix (≥2 = « référence ») · le tip · validé** + bouton « la fiche → » par colonne.
- **Meilleure valeur surlignée par ligne** (`.tc-best`, fond or doux + liseré) : distance min, ouvert, wc max, voix max, validé. Libellés de ligne sticky à gauche, en-têtes de colonne sticky en haut, ✕ par colonne (retire du comparer ; <2 → ferme).
- CSS `.tc-*` + `.carte-comparer-go` dans index.css. `tempsMarche` ajouté aux imports de Carte.tsx.
- Vérifié : `tsc --noEmit` exit 0 + DOM live (3 lieux, surlignages OK : 2,4 km / nickel ●●● / ouvert / 1 voix). Backup `_backups/2026-06-14_table-comparaison`.
- **Accès aussi depuis l'index** (carte n'était pas le seul point d'entrée → on restait coincé dans la fiche) : menu ⋯ de chaque carte d'index a **« à comparer » / « retirer de la compa »** (props `aComparer`/`onComparer` sur `LigneIndex`) ; **barre « à comparer · N » + « comparer → »** au-dessus de la liste (`.idx-comparer`). `TableComparaison` **exportée** de Carte.tsx et **lazy-load** dans App (`TableComparaisonLazy`, garde maplibre hors du bundle principal). State `comparer`/`compaOuverte` dans App. Vérifié DOM live (barre « à comparer · 3 » en index → table 3 colonnes). Backup `_backups/2026-06-14_compa-index`.

### 🚀 EN LIGNE — déployé sur Vercel (2026-06-14)
- **URL live : https://jeudi-seven.vercel.app** (testée OK iPhone 16 Pro Max + Samsung, vrai GPS via HTTPS, installable « sur l'écran d'accueil »).
- Projet Vercel : `atr-s-projects/jeudi` (compte d'Ersan, déjà lié). Config `app/vercel.json` (framework Vite + rewrites SPA).
- **Republier après changements** : `cd F:\ErsanMusa-com\Jeudi_App\app` puis `vercel --prod`.
- Tester sur tél : voir `TESTER_SUR_TELEPHONE.md` (racine). Scripts ajoutés : `npm run dev:tel` (dev sur WiFi) · `npm run preview:tel` (build de prod sur WiFi) · Vercel (HTTPS+GPS).
- ⚠️ Si mur de login Vercel à l'ouverture : Settings → Deployment Protection → désactiver « Vercel Authentication ».
- ⏳ Reste du chantier 7 : import Google Takeout, vérif nom (INPI, jeudi.app), pitcher 5-10 potes.

### FAIT — session 2026-06-14 (chantier 1 complet + chantier 5 + déploiement)
**Chantier 1 « comparaison » — terminé et unifié.** Flux identique index + carte : `comparer →` ouvre les FICHES (pages + nav 1/N restreinte aux lieux comparés) → bouton `le tableau →` ouvre la table côte-à-côte (meilleure valeur surlignée/ligne). Sélection par **clic long** (carrousel ET cartes d'index, + menu ⋯). État `comparer` **remonté dans App** (source unique, fini la double-source/superposition). **Pins dorés** sur la carte pour les lieux à comparer (actif reste bleu). Carrousel : **distance à gauche · durée à droite (atténuée)**. Incitation paysage à 3 lieux. Backups : `_backups/2026-06-14_compa-*`, `_pins-dores`, `_duree-droite`, etc.
**Chantier 5 « le mot juste » — gravé (code + CONCEPT.md).** `turbo` retiré de l'UI (gardé dans le type/données pour plus tard) · `disco` visible en permanence · **à minuit (00h)** : `apéro`→`alcolo` + rangée réduite à `dodo · alcolo · gastro` (+disco) · `incognito` = **speakeasy / bar caché**. Menu « filtres » harmonisé avec « trier » (actif en bleu, plus de points ○/●) · ligne **« foot »** unique (tap = on le voit, appui long = barré « sans foot »).

### ✅ COUPE DU MONDE + SUR L'EAU injectés (2026-06-14 fin de journée) — déployés
- `node __sources/gen_extra.mjs` → `app/src/spots_extra.ts` (2 CSV `;` : `coupe_du_monde_2026_GPT_FR_semicolon.csv` → `match:'diffuse'` (foot/fan zones) ; `surleau_GTP_FR_semicolon.csv` → `surLeau:true`). Géocodage Nominatim des manquants, voix jeudi, filtre `inclure_app=1`.
- **96 spots** injectés (`pub-x-<i>`), seed **v18**. App **~313 spots** : **66 foot** (filtre « foot »), **63 sur l'eau** (filtre « sur l'eau »).
- ⏭️ « tout » est le défaut de « voir ». z-index popovers > barre comparer (idx-reglages z20).

### ⏳ PROCHAINE GROSSE INTÉGRATION — 3 CSV GPT enrichis (~550 spots activables)
GPT a enrichi 3 fichiers (dans `__sources/`, ⚠️ noms avec **%20** au lieu d'espaces, séparateur **virgule**, BOM en tête) :
- `Restaurants%20Paris_02_GPT.csv` — 108 lignes, **103 activables**
- `Mager-a-Paris_GPT.csv` — 532 lignes, **411 activables** (6 fermés exclus)
- `Bar%20Paris_02_GPT.csv` — 37 lignes, **36 activables**
Colonnes : `nom, adresse_complete, type, prix, prix_min_eur, prix_max_eur, prix_moyen_eur, budget_meteo, note_google, avis_google, description_courte, statut, saisonnier, acces, lat, lng, inclure_app, niveau_fiabilite, doublon_nom_potentiel, doublon_rang, avec_solo/duo/potos/pro, pour_tranquillo/allocco/resto/gastro/incognito/apero/disco/nocturne/eau/street_food, notes GPT`.
GPT a déjà : exclu les **fermés** / lignes vides / lieux trop faibles ; pour `disco` été strict (vraie boîte only) ; mis `inclure_app=0` si mauvaise note ; **laissé coords vides** avec marqueur **`adresse_absente_a_geocoder`** → géocodage à faire.
**Plan d'intégration (même pipeline que `gen_spots.mjs`)** : adapter séparateur virgule + BOM + noms %20 ; filtrer `inclure_app=1` ; **dédoublonner** (colonnes `doublon_nom_potentiel`/`doublon_rang` + contre les noms déjà en base) ; géocoder les `adresse_absente_a_geocoder` (Nominatim 1 req/s) ; descriptions → voix jeudi ; mapper envies/compagnies/meteo + attributs (rooftop/surLeau/...) ; injecter `pub-cur2-<i>` ; bump seed ; **activer le CLUSTERING des pins** (volume ~550 + les 213 actuels = ~750). Gros → session dédiée.
NB : `disco`/`nocturne`/`street_food` ont des colonnes → décider si on ajoute des filtres dédiés (comme rooftop/surLeau) à ce moment-là.

### ✅ CURATED v02 + BOUTON ADOPTER (2026-06-14 soir) — déployés Vercel
- **Bouton « + ajouter à ma carte »** sur la **fiche** de tout spot pas-à-moi (props `onAdopter`/`dejaAdopte` sur `Fiche`, classe `.fiche-adopter`). Le ⋯ de l'index garde aussi « ajouter à ma carte ».
- **Dataset curated v02 injecté** : `__sources/paris_spots_app_curated_v02_FR_semicolon.csv` (sép `;`) → `app/src/spots_curated.ts` via **`node __sources/gen_spots.mjs`** (parse, géocode manquants Nominatim, descriptions passées en voix jeudi = minuscule en tête, garde `inclure_app=1`+`fiabilite=bonne`). **129 spots** (rooftop 38, speakeasy, disco/club, péniches, guinguettes, street-food, comptoirs solo, bouillons, gastro…). Injectés `proprietaire pub-cur-<i>`, public, `rooftop`/`surLeau` taggés. **Total app ~213 spots**, seed **v17**.
- ⚠️ **Remplace** l'ancienne injection rooftop-only v01 (`rooftops.ts`/`gen_rooftops.mjs` désormais inutilisés — supprimables).
- **Nouveau champ** `Lieu.surLeau` + **filtre « sur l'eau »** dans le menu (à côté de rooftop/foot). 9 spots « sur l'eau », 39 rooftops.
- Régénérer si nouveau CSV v0x : adapter le nom de fichier dans `gen_spots.mjs`, relancer, bump seed.
- ⏭️ catégories dispo dans les données mais SANS filtre dédié encore (à ajouter comme rooftop/eau si voulu) : disco, nocturne, guinguette, street-food, terrasse hiver (colonnes `pour_*` présentes dans le CSV).

### ✅ ROOFTOPS — INJECTÉS (2026-06-14) + déployés Vercel (REMPLACÉ par curated v02 ci-dessus)
**39 rooftops** en base (38 de la liste GPT géocodés + « Dar Mima » déjà taggé), total **126 spots**, seed **v16**, filtre « rooftop » OK. En ligne sur https://jeudi-seven.vercel.app.
- Données : `app/src/rooftops.ts` (GÉNÉRÉ — ne pas éditer à la main).
- Régénérer si nouveau CSV : `node __sources/gen_rooftops.mjs` (parse `rooftops_paris_app_v01.csv`, garde `inclure_app=1` + `fiabilite=bonne`, géocode les coords manquantes via Nominatim) → réécrit `rooftops.ts`, puis **bump seed** dans `seed.ts`.
- 1 lieu non géocodé ignoré (Zoku Paris) ; les 6 « a verifier »/pop-up écartés volontairement.
- Injection : boucle dans `importerSeed` (proprietaire `pub-roof-<i>`, public, `rooftop:true`, photos test `ph()`, pas d'horaires).
- ⏭️ PROCHAIN : demander à GPT d'autres listes même format (speakeasy=incognito, street-food par type, comptoirs solo) → même pipeline.
- 🚤 PRÉVU : catégorie **« sur l'eau »** (péniches, guinguettes au bord de l'eau, terrasses sur la Seine/canal) = MÊME schéma que rooftop : attribut `surLeau?: boolean` sur `Lieu` + filtre « sur l'eau » dans le menu (à côté de rooftop/foot) + liste GPT (même format) → `gen_surleau.mjs` → seed → deploy.

### 🏙️ (archive) ROOFTOPS — dataset reçu
GPT a fourni **`__sources/rooftops_paris_app_v01.csv`** (+ variante `_semicolon`) : **45 rooftops parisiens** (39 fiabilité « bonne », 6 « a verifier » = pop-up/saisonnier).
Colonnes (mapping DÉJÀ fait par GPT) : `nom, adresse_complete, arrondissement, ville, petite_couronne, type, prix_eur_pers, prix_moyen_eur, budget_meteo, description_courte, statut, saisonnier, acces, lat, lng, inclure_app, avec_solo/duo/potos/pro, pour_tranquillo/allocco/resto/gastro/incognito/apero, budget_grand_soleil/nuageux/pluie, fiabilite, notes_app, source_url, date_verification`.
**Plan d'injection** (déterministe) :
  - parser le CSV → garder `inclure_app=1` ; mettre les `fiabilite='a verifier'` / `saisonnier` pop-up de côté (ou tag « à confirmer »).
  - `pour_*`=1 → `envies` ; `avec_*`=1 → `compagnies` ; `budget_meteo` → `meteo` ; `prix_moyen_eur` → portefeuille.
  - **`rooftop: true`** sur tous (la catégorie/filtre existe déjà, à côté de foot).
  - `lat/lng` présents pour la plupart ; **géocoder les manquants** via Nominatim (pattern `__sources/*.mjs`).
  - injecter comme **profil public** (`proprietaire: 'pub-roof-<i>'`, visibilite 'public', tipsCercle voix éclaireur OU note=description), **bump seed** (v15→v16).
  - description = `description_courte` ; garder `source_url` qq part.
Prompt session neuve : « Lis REPRISE.md. Injecte les rooftops de `__sources/rooftops_paris_app_v01.csv` dans le seed (mapping déjà fait par GPT dans les colonnes), géocode les coords manquantes, rooftop:true, profil public, bump seed. »
Ensuite : demander à GPT d'autres listes (speakeasy=incognito, street-food par type, comptoirs solo) — même format.

### 💡 IDÉE À FAIRE — tuto à la première visite (onboarding du deck)
À la **toute première visite**, la **première carte de résultat** (1er spot du deck / 1ʳᵉ case) doit servir de **mini-tuto intégré** : elle explique les gestes en situation (swipe photo = lieu suivant, swipe tip = autre voix, ← bof / validé →, tap = stories…). L'utilisateur **suit le tuto sur la vraie carte**, et à la fin tout est compris — pas d'écran d'aide séparé. Déclencheur : flag localStorage type `jeudi-tuto-fait`. À faire après les rooftops.

## ════ POINT DE SESSION — 2026-06-14 (nuit) ════

### Fait ce soir
- ✅ **Lieux favoris** (trombone `ITrombone`, à côté du nom, filtre « mes favoris ») — voir bloc dédié au-dessus.
- 🗍 **Refonte design « Encre Vive »** explorée puis **abandonnée** : rangée dans `_trash/app_design/` (vert acide sur nuit + `DESIGN_ENCRE_VIVE.md` dedans). On reste sur « Carnet de Nuit ». Supprimable.

### LES CHANTIERS RESTANTS — nommés et expliqués (à faire en sessions NEUVES, courtes)

**1. « La table de comparaison » — finir la compa côte-à-côte.**
Tout existe sauf l'écran final : `jeudi-comparer` (localStorage), barre « à comparer · N », clic long sur les cartes du carrousel, nav fiche restreinte (1/3). MANQUE : un bouton **« comparer → »** sur la barre → **table plein écran**, 1 colonne par lieu (2-3), lignes = photo · distance/temps · ouvert-fermé · propreté wc · envies · nb de voix (référence) · tip · validé ; **meilleure valeur surlignée** par ligne. = 1 composant + 1 bloc CSS. PETIT, satisfaisant. **Prochaine session conseillée.**

**2. « La grande carte » — intégrer les 526 spots + clustering.**
Données : `__sources/ersan_all_geocoded.json` = **526 spots** (pas 382). Champs présents PAR spot : `nom` (526), `prix` ex. « 20–30 € » (383), `cuisine` ex. « Pizza » (354), `adresse` (382), `lat/lng` (382 valides, **144 à 0 = pas géocodés**). RIEN d'autre (pas de tip/photo/horaires : ils arrivent « nus » → pins « à découvrir » à enrichir à l'usage).
Le script à écrire (déterministe, gratuit, quasi 0 token — il mouline tout seul) :
  - **cuisine → envie** (Pizza→resto, bar→apéro, gastro→gastro, etc.) — table de correspondance.
  - **prix → budget/météo** (« 20–30 € » → seuil €).
  - **géocoder les 144 manquants** via **Nominatim** (gratuit, 1 req/s, déjà le pattern des scripts `__sources/*.mjs`).
  - **injecter les 526** dans le seed (bump version) + activer le **clustering des pins** (indispensable à ce volume).
  - **horaires = inconnus** pour l'instant (voir chantier 3).
Prompt one-shot : « intègre les 526 spots : mappe cuisine→envie + prix→budget, géocode les 144 manquants via Nominatim, injecte + clustering, horaires en inconnu ».

**3. « Horaires & lieux fermés » — vérif réelle (BLOQUÉ sans clé).**
Vérifier les **horaires d'ouverture** et le **statut « fermé définitivement »** ne s'invente PAS (un LLM hallucinerait). Source fiable unique = **Google Places API** (`business_status` OPERATIONAL/CLOSED_PERMANENTLY + `opening_hours`). Tous les scripts actuels utilisent Nominatim (pas d'horaires, pas de statut) ; **aucune clé Google dans le projet**. → Nécessite **une clé Google Places facturable d'Ersan** (coût Google ~9-12 $ pour 526 lieux, pas côté IA). Alternative gratuite partielle : OSM Overpass (opening_hours présent ~20-40 %, sans statut fermé). **Décision/ressource d'Ersan requise.**

**4. « Le cercle vivant » — la page d'un pote.**
Taper sur Karim → SA carte (ses spots + tips). La brique existe mais l'écran est pauvre : ajouter portrait, critère, nb de spots, bascule liste/carte.

**5. « Le mot juste » — figer le lexique (décision d'Ersan, pas du code).**
Trancher : garde-t-on **« alcolo »** ? et définir précisément **« turbo »**. À graver ensuite dans CONCEPT.md. Ne rien changer sans son accord.

**6. « En ligne » — backend Supabase (gros saut, session dédiée).**
Vrais comptes · deux anneaux réels (proches mérités / suivis illimités) · **demandes d'amis réelles** (la cloche est SIMULÉE) · sync multi-téléphones · push (« cette semaine, ça dit taco ») · **match de groupe** (triangulation, swipe partagé — LA feature du concept, PAS commencée) · photos cloud (Supabase Storage) · vraie géoloc HTTPS.

**7. « Sur ton iPhone » — déploiement (terrain d'Ersan).**
`git init` dans `app/` → push → **Vercel** → installer sur iPhone (vraie géoloc GPS). Import Google Takeout. Étape zéro : pitcher 5-10 potes, vérifier le nom (INPI, jeudi.app — ⚠️ Thursday dating app UK).

**Petits polish :** onglet/raccourci « favoris » dédié · a11y (labels mono, cibles tactiles des chips).

---

### RESTE À FAIRE (au 2026-06-14) — priorisé
**Produit / features (local) :**
- **Onglet « le cercle »** : sélection individuelle d'une personne (sa carte) — c'est là que vit le per-person (plus dans « voir : »). À étoffer.
- **Drip des validations** : aujourd'hui « à noter » vit dans la cloche (snooze/oublie) ✓ ; reste à décider si on en pousse 2-3 à la fois automatiquement.
- **Vue comparaison côte-à-côte** : la liste « à comparer » + la nav fiche restreinte (1/3) existent ; la vraie TABLE comparative reste à faire.
- **#19** : trancher « alcolo » (garder ?) + décrire « turbo ». (Ne pas changer sans demander.)
- **Intégrer Ersan_ALL (382 lieux)** + **clustering** des pins.

**Décisions ouvertes :** #11 (carte bottom-sheet : fait ✓) · #13 Google Sheet CMS · #14 Supabase Storage photos.

**Backend (Supabase) — débloque le gros :**
- Vrais comptes, **deux anneaux réels** (proches mérités après N sorties + manuel), invitations (ouvert→1000 puis invitation-only).
- **Demandes d'amis réelles** (la cloche est simulée), sync, push (« cette semaine, ça dit taco »).
- **Match de groupe** (triangulation, swipe partagé) — LA feature du concept.
- Stockage photos cloud + vraie géoloc (HTTPS).

**Déploiement (Ersan) :** `git init` dans `app/` → push → **Vercel** → installer sur iPhone (vraie géoloc). Import Google Takeout (vrais pins). Étape zéro : pitcher 5-10 potes, vérifier le nom (INPI, jeudi.app — ⚠️ Thursday dating app UK).

**Polish a11y / DA restant :** labels mono petits (en cours) · glyphes ✕⋯↑ (typographiques, OK) · cibles tactiles des chips `voir`.

### DÉCISION #6 (gravée dans CONCEPT.md) — DEUX anneaux, pas un cap à 20
- **Proches** : petit anneau, lourd (le deck + le match tirent d'eux), **mérité par les sorties** (l'app propose après plusieurs sorties ensemble) + **manuel possible**, toujours confirmé. Plafond **souple** via rituel *« ton cercle est plein. qui tu sors ? »* (swipe garder/retirer) — JAMAIS un mur/message d'erreur. Le « 20 » dur est abandonné.
- **Suivis** : anneau large, **illimité**, geste léger (curateurs/éclaireurs) = couche de découverte.
- Cap plateforme (~1000 puis invitation-only) = distinct du cap de l'anneau proches.
- À implémenter (backend requis) : champ proche/suivi sur la relation, pondération du deck par les proches, suggestion de promotion « passé en proche ? » après N sorties communes, rituel de curation au dépassement.

## RESTE — 8 gros chantiers (issus des 21 retours du 13/06), à faire en sessions neuves
2. **Après le deck** : récap = liste + « voir en grand » (carrousel) + **mini-carte des 8 suggestions** seulement.
3. **Picker couleur avancé** : suggestions proches Pantone de l'année + **roue HSV** qui s'ouvre.
7. **Coupe du monde** : tag « match » sur les lieux qui diffusent + **refuge anti-foot** ; filtre + **pastille ballon** sur les pins. (acquisition, timely)
8. **2-3 photos par catégorie** (lieu/verre/wc) au lieu d'une seule ; axer le produit là-dessus.
10. **« ça dit quoi ce soir » full-swipe** : questions au centre en gros, valider haut/bas, naviguer dans les choix gauche/droite. Tout en swipe.
11. **Carte = bottom-sheet + carrousel** (à valider ensemble, j'ai donné mon avis POUR) : tap pin → fiche nom+desc en bas → barre carrousel horizontale ; lieux du carrousel **en couleur**, le reste **grisé**.
17. **Lieu ultra réputé** : signal visuel (⚠️ sans note/étoile — via nb de voix ou titre « référence »).
18. **Catégories visibles** sur index (1-2 chips d'envie) ; pas sur la carte (surcharge).
+ **Intégrer Ersan_ALL (382)** puis **clustering** des pins (indispensable à ce volume).

## CE QUI RESTE (la todo, dans l'ordre)
0. **Cohérence des features récentes (court terme)** :
   - **Éditer horaires / envies / prix sur une fiche existante** (collectés à la capture mais pas modifiables après — sauf les envies).
   - **Vraie géoloc pour la distance** (marche en HTTPS → lié au déploiement ; remplace Place Vendôme par défaut).
   - **« suivre un curateur » à l'onboarding** (décidé dans CONCEPT, pas encore câblé).
   - **Régler le Grand Jeudi** (fréquence / durée / offert ou mérité) puis l'implémenter.
   - **Carte des curateurs** : aujourd'hui « la carte de X » est une LISTE — manque la vue CARTE géographique (pins filtrés par curateur).
   - **Qui a recommandé quoi sur la carte** : une couleur par curateur + pastille à l'encre avec son initiale (PAS de smiley — émojis bannis du chrome) ou mini-photo de profil plus tard.
   - **Lieu recommandé par plusieurs** : afficher les noms + compteur, « recommandé par Karim, Léa +30 » ; sur la carte, badge nombre sur le pin.
   - **Spots des amis en lecture seule** : on ne doit PAS pouvoir éditer/effacer à la volée le resto d'un pote (le menu ⋯ visibilité/effacer ne vaut que pour MES spots). Pour modifier/garder, action explicite d'abord : « ajouter à ma carte » / « adopter » → ça crée MA copie. Distinguer mes spots des spots du cercle.
   - **Endroits à découvrir** : différencier visuellement les lieux que j'ai déjà faits/validés (tampon) des nouveaux à découvrir. Un mode/onglet « à découvrir » qui pousse le non-fait.
   - **Filtres dans l'index** (ma carte) : pouvoir filtrer la liste — par envie, par curateur, ouvert maintenant, validé/non, distance. UX à concevoir (chips de filtre ? barre ?). Ersan : « je sais pas encore comment ».
   - **Se retrouver avec ses potes (match de groupe)** : LA grosse feature du CONCEPT pas encore commencée — lancer une sortie, chacun pose son point de départ, triangulation au milieu en piochant dans les collections combinées, chacun swipe, le 1er lieu qui matche pour tous gagne. Nécessite le backend (cercle réel, sync) → après le déploiement.

## FAIT — session 2026-06-13 (suite carte)
- Refonte vue carte (recos taste) : fond teinté charbon + grain + vignette ; pins homogènes (point=toi, initiale=curateur, anneau=validé, grisé=fermé) ; labels noms au zoom ; accroche « N spots ouverts ce soir » ; tap = popup-polaroid (photo+qui+horaires) puis re-tap/détails = fiche ; pin actif s'agrandit.
- **Carte des curateurs faite** : « la carte de X » a maintenant la bascule index/carte (vue géographique de ses spots).
1. **Déployer sur Vercel** → URL réelle → installation sur l'iPhone d'Ersan (Safari → écran d'accueil). Compte Vercel + GitHub existants (cf. mémoire ersanmusa.com). Pas de repo git encore : `git init` dans app/, push, connecter Vercel.
2. **Import Takeout** : Ersan doit déposer son zip Google Takeout (Maps/lieux enregistrés) dans `Jeudi_App\` → écrire l'import (remplacer le seed approximatif par les vraies coordonnées + ~470 spots restants ; classer : commentés+photographiés en tête). Le seed actuel se purge via flag `jeudi-seed-vN`.
3. Petit ménage : warning React « uncontrolled input » (input critère dans Onboarding.tsx) ; vérifier `npm run build` (types React.ReactNode dans icones.tsx — esbuild passe, tsc à vérifier) ; boussole à redessiner à l'encre ; clustering des pins (à faire AVEC l'import Takeout) ; verdict étape 1 en swipe de carte (cohérence langue) ; faire un backup `_backups/` en fin de session.
4. Ensuite (backend Supabase) : vrais comptes, cercle réel, invitations (règle : ouvert jusqu'à 1000 puis invitation only), sync cloud, push (lundi : « cette semaine, ça dit taco. »), triangulation de groupe.
5. Côté Ersan (étape zéro) : pitcher à 5-10 potes, vérifier le nom (INPI, jeudi.app — ⚠️ Thursday dating app UK existe).

## Règles de travail avec Ersan
- Ton direct, tutoiement, il itère vite par petites idées — graver ses décisions dans CONCEPT.md quand il dit « vas-y / grave ».
- Le juge de paix produit : « Ersan l'utiliserait-il à la place de Google Maps demain ? »
- Jamais d'étoiles/notes/points ; le mot « avis » n'existe pas dans l'app ; émojis interdits dans le chrome UI (icônes encre).
- Sessions COURTES désormais (la session fondatrice a coûté ~116$ à force de durer) : une feature par session, backup `_backups/AAAA-MM-JJ_xxx` en fin de session.
