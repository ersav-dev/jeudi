# jeudi. — Audit du panel des 23 (2026-07-30)

**23 examinateurs simulés** (13 professionnels + 10 consommateurs) ont audité l'app depuis le concept et les écrans réels.

**Moyenne : 5.8/10** · pros 6.0 · consommateurs 5.7


## Les professionnels


### ui designer — 7.5/10

**Points forts**
- Une vraie direction artistique, rare à ce point d'engagement : « carnet de nuit » charbon/ivoire/cire décliné jusqu'à la physique des animations (frappe de tampon 90ms, page qui tourne sur sa reliure, grain SVG généré) — avec des règles écrites dans le CSS lui-même (« max 2 cires par écran », « rien ne boucle »). C'est du design system d'auteur, pas du Tailwind par défaut.
- Le ton verbal est une signature en soi (« t'es difficile ce soir », « sage. à jeudi. », le lexique qui fond à minuit) — la copy est traitée comme un matériau de design, ce que 95 % des apps ratent.

**Plus gros points faibles**
- L'échelle typographique est écrasée en bas : du 11px JetBrains Mono PARTOUT (pills, tampons, méta, menus, notifs). Sur un écran de nuit, en situation réelle (rue, luminosité basse), c'est illisible — et ça aplatit la hiérarchie : quand tout est micro-mono, plus rien n'est secondaire.
- La DA vit ou meurt sur les photos des membres — des photos de smartphone moches, floues, verticales — et je ne vois aucun système de rattrapage visuel (traitement, duotone, cadre fort). Le « tirage à bord blanc » ne suffira pas : le contenu réel va salir le cadre.
- La carte MapLibre « charbonnée » par un filter CSS (brightness/sepia/hue-rotate) est un hack, pas un style : les labels Carto, les couleurs d'eau et de parcs vont trahir le carnet au premier zoom. C'est l'écran le moins « jeudi » de l'app.

**Reco prioritaire** : Faites un vrai style de carte custom (style JSON MapLibre aux couleurs --nuit/--graphite/--encre, typo cohérente) au lieu du filtre CSS — c'est l'écran le plus regardé et le seul qui casse l'illusion de l'objet.

**Son chemin vers le 10/10**
- Un style MapLibre natif « carnet » (style spec custom : fonds --nuit, routes au graphite, labels dans la famille de l'app, POI éteints) — vérifiable en supprimant le filter CSS sans que la carte jure.
- Remonter le plancher typographique : rien sous 12-13px en usage courant, et réintroduire 2 paliers intermédiaires (13/15) pour que méta, labels et actions ne partagent plus le même corps 11 — audit ligne par ligne des ~40 usages de font-size:11px dans index.css.
- Un pipeline de traitement des photos membres (recadrage, courbe contrastée légèrement chaude, grain léger cohérent avec --grain, bord de tirage systématique) pour que la pire photo de smartphone ressorte « carnet » — testable avec 20 vraies photos moches.
- Découper index.css (6 200 lignes monolithiques) en tokens + modules par écran avec les règles d'or (§4, §5) en lint/checklist appliquée, sinon la discipline « une cire par page » ne survivra pas au 10e contributeur — vérifiable : zéro hex hors :root.
- Trancher les emojis météo ☀️⛅🌧️ du concept : soit des glyphes dessinés à l'encre partout (les ISoleil/INuage existent — les imposer y compris dans les textes et notifs), soit assumer l'emoji système nulle part. Un carnet à l'encre avec des emojis Apple au milieu, c'est la faute de goût qui trahit tout le reste.

> C'est une des rares apps que je verrais en shortlist Awwwards sur la seule force de sa DA — mais elle se joue à 11px et sur un fond de carte volé à Carto : réglez la carte, la micro-typo et les photos réelles, et vous avez un objet, pas une app.


### journaliste sorties — 7/10

**Points forts**
- Une vraie ligne éditoriale : le "tip signé" contre l'avis anonyme, c'est une position claire, presque un manifeste — et "aucun lieu ne paie, jamais" est un angle en or pour un papier.
- Le lexique vivant (alloco→taco, apéro→alcolo à minuit, la météo du porte-monnaie) : une voix, un ton, une vraie personnalité — c'est ce que ni Fork ni Mapstr n'ont jamais eu.

**Plus gros points faibles**
- Les ~320 spots d'amorce sont une boîte noire : je ne sais pas QUI a choisi, quels quartiers, quelle fraîcheur. Si c'est du OSM ressorti avec un vernis, l'app raconte le contraire de sa promesse. Le curateur zéro c'est le fondateur — un seul goût pour toute la ville, c'est un guide, pas un cercle.
- Zéro actualité : pas d'ouvertures de la semaine, pas de "ce soir il se passe X", pas d'événements. Une rubrique sortir vit de la fraîcheur ; ici la seule chose datée c'est le taco du lundi. Le filtre foot pour la finale est le seul geste d'actu — et il est isolé.
- Le mur d'invitation + cercle restreint au lancement = personne dedans, donc un deck qui tire d'un cercle vide. Le démarrage à froid est traité sur le papier (curateurs), mais au jour J il n'y a qu'un curateur et des potes du fondateur.

**Reco prioritaire** : Assumez publiquement l'amorce éditoriale : signez les 320 spots par 5-10 vrais curateurs identifiés (prénom, quartier, critère), quartier par quartier, avant le lancement — c'est votre crédibilité de guide et mon angle de papier.

**Son chemin vers le 10/10**
- Une rédaction de curateurs vérifiable au jour 1 : au moins 8 curateurs réels et nommés (pas des personas), chacun 30-50 spots dans SON quartier, avec photos maison — que je puisse appeler Karim du 10e et qu'il existe.
- Une couche fraîcheur datée : chaque spot affiche "validé le [date] par [nom]", et un flux hebdo "les 5 entrées de la semaine" (nouvelles adresses, pas rééditées) — vérifiable en ouvrant l'app deux lundis de suite.
- L'anti-Google-Maps prouvé en usage : une recherche "bar caché Oberkampf ouvert maintenant" qui rend 3 résultats signés en moins de 5 secondes, horaires justes (137/306 spots avec horaires, c'est insuffisant — visez 100 % sur le public).
- Un rendez-vous éditorial récurrent : le Grand Jeudi avec une date annoncée, une thématique, et un partenariat presse/lieu (sans que le lieu paie) — un rituel que ma rubrique peut annoncer.
- Les preuves photo tenues : zéro photo Google/pro dans le deck au lancement, la règle des 3 photos (lieu/verre/WC) appliquée sur 100 % des spots poussés — je vérifie en swipant 20 cartes.

> Enfin une app de sorties qui a une plume et une éthique — mais tant que ses 320 adresses ne sont pas signées par de vrais Parisiens datés et localisés, c'est un très beau carnet vide que je ne peux pas encore recommander à mes lecteurs.


### influenceuse lifestyle — 6.5/10

**Points forts**
- Le storytelling est en or : les photos de WC obligatoires, le « ce soir ça dit mcdo, on juge pas », minuit qui transforme apéro en alcolo — c'est exactement le genre de détail que je raconte en story et qui fait 50k vues.
- La DA carnet charbon/encre ivoire/tampon rouge cire est ultra reconnaissable — un screenshot de cette app on sait que c'est jeudi, pas une énième app Google Maps beige.

**Plus gros points faibles**
- ZÉRO mécanique de partage : pas de navigator.share, pas de carte de sortie exportable, pas de story-asset. Le seul export c'est… un fichier .json. Je ne peux littéralement rien poster depuis l'app — pour une appli sociale de sorties qui lance semaine de finale de Coupe du monde, c'est rédhibitoire.
- Mur de connexion + invitation only : mes 280k abonnés cliquent mon lien, tombent sur un login, repartent. Aucune page publique d'un spot, d'un tip, d'une carte de curateur à linker — l'app est invisible depuis l'extérieur, donc inviralisable.
- Le moment le plus screenshotable — le deck et ses punchlines (« t'es difficile ce soir ») — meurt dans le téléphone : le screenshot brut d'une carte n'a ni logo, ni cadre, ni watermark tampon, rien qui ramène vers l'app quand je le poste.

**Reco prioritaire** : Avant le lancement de cette semaine, ajoutez UNE chose : « partager cette carte » qui génère un visuel vertical 9:16 au style carnet (photo du membre, tip manuscrit signé, tampon jeudi. rouge) prêt à balancer en story Instagram avec le lien.

**Son chemin vers le 10/10**
- Un bouton « partager » sur chaque carte du deck et sur le récap de sortie, qui génère un asset 9:16 stylé carnet (bord blanc, tip manuscrit, tampon rouge de travers) via navigator.share — testable : je swipe, je partage, ma story est belle sans retouche.
- Des pages publiques linkables sans login : /spot/le-bisou et /curateur/lea visibles par n'importe qui avec le tip signé et un CTA « demande ton invitation » — sinon aucun de mes liens ne convertit.
- Un système d'invitations visible et désirable : 5 invitations nominatives par membre, avec un visuel d'invitation partageable (« Léa te fait entrer dans jeudi. ») — la rareté ne marche que si elle se voit.
- Le récap de fin de soirée transformé en objet collectionnable : « ta soirée du jeudi 29 » avec les lieux tamponnés, façon ticket de caisse/page de carnet, exportable en image — c'est le Spotify Wrapped hebdo de la sortie parisienne.
- Pour le lancement foot : un filtre « on y voit le foot » qui produit une mini-carte partageable des 10 bars foot de mon quartier validés par des vrais gens — LE contenu que tout Paris se forwarde le jour de la finale.

> Le concept me donne envie d'en faire trois stories dès ce soir — mais l'app, elle, ne me laisse rien poster : jeudi. a tout du produit culte sauf la porte de sortie vers Instagram, et sans ça le bouche-à-oreille reste dans le carnet.


### dev mobile senior — 6.5/10

**Points forts**
- L'hygiène service worker est au-dessus de 95 % des PWA que je croise : registerType 'prompt' (pas de reload sauvage iOS), cleanupOutdatedCaches, NetworkOnly sur Supabase/Nominatim, journal de crash hors-React dans main.tsx — quelqu'un a vraiment débuggé un écran blanc WebKit.
- Vrai local-first : IndexedDB + file d'attente offline (write-queue dédoublonnée, rejeu à la reconnexion dans db.ts) — l'app fonctionne dans le métro, ce qui est exactement le cas d'usage d'une app de sorties parisiennes.

**Plus gros points faibles**
- Zéro push notification alors que le produit EST une notification : « cette semaine, ça dit taco » le lundi, « ce jeudi la ville s'ouvre », « alors, Le Bisou ? » le lendemain — toute la boucle de rétention du concept repose sur des notifs qui n'existent pas dans le code. Une PWA sans Web Push, c'est une app qu'on oublie en 10 jours.
- Sur iOS, la PWA n'existe qu'après un « Ajouter à l'écran d'accueil » que personne ne fait spontanément — lancer autour de la finale de la Coupe du monde via un lien Safari, c'est perdre 80 % des installs le soir même ; et le budget storage iOS peut évincer IndexedDB d'une app « locale-first » non utilisée 7 jours.
- App.tsx fait 3714 lignes et db.ts 2338 : navigation, notifications, profil, cercle, tout dans un fichier. Ça tient à 320 spots et 1 dev ; ça casse à la première fonctionnalité sociale réelle (realtime, match de groupe).

**Reco prioritaire** : Implémenter Web Push avant le lancement (supporté iOS 16.4+ pour les PWA installées) avec au minimum la notif du lundi et le « alors ? » du lendemain — sinon la boucle de confiance du concept est une boucle morte.

**Son chemin vers le 10/10**
- Web Push complet (VAPID + Supabase Edge Function) : notif du lundi, rappel « alors, Le Bisou ? » J+1, demandes d'amis — testé sur iPhone réel en standalone, avec fallback in-app si permission refusée.
- Un flux d'installation assumé : écran post-signup qui détecte iOS/Android et guide le « Ajouter à l'écran d'accueil » avec captures, + navigator.storage.persist() demandé et vérifié pour protéger IndexedDB de l'éviction iOS.
- Casser le monolithe : App.tsx découpé en routes/features (navigation, cercle, notifs, profil), et le chunk index de 582 Ko réduit sous 250 Ko gzippé — sur un iPhone 12 en 4G à 23h devant un bar, le premier paint doit être < 2 s.
- Un test E2E du parcours critique (onboarding → deck → validation → offline → resync) sur WebKit réel via Playwright, branché en CI avant chaque vercel --prod — aujourd'hui le garde-fou c'est un bandeau de crash a posteriori.
- Une décision documentée Capacitor : le jour où il faut la capture 2 secondes (caméra + géoloc en arrière-plan), les contacts pour le cercle et l'App Store pour la distribution, le wrapper natif devient obligatoire — préparer le code (pas d'API web exotique non polyfillable) pour que la migration coûte une semaine, pas un rewrite.

> Techniquement, c'est la PWA la plus soignée que j'aie auditée depuis longtemps — mais c'est une app sociale de rétention lancée sans push ni store, et ça, aucun service worker bien peigné ne le rattrape.


### sociologue de la nuit — 6.5/10

**Points forts**
- Une vraie justesse ethnographique : « ça dit quoi ce soir ? », le tip qui « aide à réussir le lieu » plutôt que l'avis qui le juge, le lexique qui fond à minuit — c'est du rituel de sortie observé, pas inventé. Rare.
- La promesse anti-plateforme est structurellement tenue dans le code : pas d'étoiles, pas de moyenne, pas de lieu payant, des voix signées — la médiation reste interpersonnelle, pas algorithmique.

**Plus gros points faibles**
- Le cercle de confiance est une machine à homophilie que le concept ne regarde jamais en face : « des gens dont le goût compte », curateurs « au goût prouvé », entrée sur invitation, curateur zéro = le fondateur — c'est la distinction bourdieusienne codée en produit. Qui entre ? Le trentenaire diplômé de l'Est parisien. Qui est exclu ? Tous ceux dont les sociabilités festives ne passent pas par le « bon goût » certifié — et aucun mécanisme ne corrige ce biais de recrutement initial.
- Le Grand Jeudi est une bombe à surtourisme miniature : concentrer toute la ville sur les mêmes spots publics « validés », le même soir, c'est exactement la mécanique TikTok du lieu-qui-craque — l'app qui prétend protéger les adresses organise leur pic de charge. Rien sur la capacité des lieux, rien sur l'effet retour pour l'incognito « speakeasy » dont on donne l'adresse à voix basse... dans une base de données.
- La nuit racontée est une nuit de consommateurs solvables et valides : la « météo du porte-monnaie » euphémise la classe sans la traiter (pluie = « trois comptoirs », jamais le gratuit, le dehors, la fête non marchande), « alcolo » présuppose l'alcool comme horizon nocturne, et rien sur la sécurité des femmes seules la nuit — pour une app qui met le solo « en première position », c'est un angle mort sérieux.

**Reco prioritaire** : Avant le lancement, écrire et assumer une politique explicite de composition du corpus initial (les ~320 spots et les curateurs fondateurs) : quels arrondissements, quels prix, quels types de lieux, quelles voix — sinon la « confiance » ne sera que le goût d'un milieu qui se recommande à lui-même.

**Son chemin vers le 10/10**
- Publier la cartographie sociale du corpus : distribution des ~320 spots par arrondissement/banlieue et par gamme de prix, avec un engagement chiffré (ex. ≥25 % de spots hors Paris intra-muros Est, ≥30 % accessibles en météo « pluie ») — vérifiable dans seed.ts/la base.
- Un mécanisme anti-saturation dans le code du deck et du Grand Jeudi : plafond de fois où un même lieu peut sortir par soirée à l'échelle de la plateforme, rotation forcée des spots sur-poussés, et retrait automatique du Grand Jeudi pour les lieux de petite jauge (champ capacité dans le schéma).
- Casser l'entre-soi du recrutement : à côté des curateurs « au goût prouvé », des curateurs situés et divers dès l'onboarding (le kiosquier, la patronne du PMU, le collectif de quartier), choisis hors du réseau personnel du fondateur — liste nominative vérifiable dans l'écran Onboarding.
- Traiter la nuit non marchande et non alcoolisée comme des citoyennes de première classe : des envies « gratos » et « sans alcool » dans le lexique (pas cachées derrière la météo pluie), et des spots correspondants dans le deck après minuit — vérifiable dans lexiqueDuMoment() de CeSoir.tsx.
- Un critère binaire « je m'y sens safe seule le soir », signé comme les autres tips, intégré au mode solo — puisque le solo est la fierté revendiquée du produit, il doit porter sa condition de possibilité.

> Un objet culturellement très juste — le carnet, le tip, la nuit qui fond — mais qui institutionnalise l'entre-soi qu'il romantise : tant que « les tiens » désigne un seul milieu social, jeudi ne cartographie pas la nuit parisienne, il en canonise le quart nord-est.


### ux researcher — 6/10

**Points forts**
- L'onboarding "payoff d'abord" est un vrai bon pattern : on te situe, on te montre 3 vrais spots avant de te demander quoi que ce soit, et la visite de « j. » est skippable partout — c'est rare de voir ça bien fait dès la v1.
- Les états de fin sont écrits avec une voix (« t'es difficile ce soir », « sage. à jeudi. » avec sortie « en vrai non, je sors ») — les états vides et de bord existent et ont du caractère, au lieu d'un spinner triste.

**Plus gros points faibles**
- Le lexique privé est une taxe cognitive massive à froid : tranquilo, alloco, incognito, gastro-qui-change-de-sens-à-minuit, alcolo… Un nouvel utilisateur devant 7 chips inventés doit apprendre une langue AVANT d'obtenir de la valeur. En test utilisateur, je parie sur 30 secondes d'hésitation et des mauvais choix silencieux (il clique resto alors qu'il voulait alloco). La visite de « j. » enseigne la confiance et le swipe, pas le vocabulaire des chips.
- La météo du porte-monnaie est un filtre silencieux qui retire des résultats sans le dire — le piège UX classique. L'utilisateur en « pluie » verra un deck maigre et conclura « l'app n'a rien », jamais « mon filtre budget cache 12 spots ». Aucun compteur de spots masqués, aucune échappatoire visible.
- Le concept promet « on entre par les curateurs » (des voix humaines qui peuplent ta carte dès l'onboarding) — mais le code fait ecrireSuivis([]) et le cercle démarre VIDE. Le deck tire « d'abord de tes proches »… qui n'existent pas au jour 1. Le produit vit donc uniquement sur le seed éditorial, et toute la promesse sociale est un écran vide déguisé.
- La surface fonctionnelle au lancement est démesurée : carte, cercle, proches/suivis, critères, comparer, favoris, recherche, groupe, Grand Jeudi, quand ?, météo, import Google… App.tsx importe ~100 symboles. Aucun utilisateur ne découvrira 20 % de ça ; chaque fonction non découverte est du coût de maintenance et du bruit d'interface.

**Reco prioritaire** : Avant le lancement de cette semaine : 5 tests guérilla de 20 minutes (protocole « tu ouvres l'app, trouve où sortir ce soir »), en chronométrant le temps jusqu'au premier spot validé et en notant chaque hésitation sur les chips d'envie et la météo — puis corriger les 3 pires frictions observées, rien d'autre.

**Son chemin vers le 10/10**
- Faire tester par 5 utilisateurs réels hors du cercle du fondateur et publier les mesures : temps médian jusqu'au premier swipe validé < 60 s, taux de complétion onboarding > 80 %, zéro utilisateur qui demande « ça veut dire quoi incognito/alloco ? » sans trouver la réponse dans l'interface.
- Rendre la météo honnête : quand le filtre budget masque des résultats, l'écran du deck affiche « 9 spots cachés par ta météo — éclaircie ? » avec un tap pour lever le filtre. Vérifiable : aucun deck vide sans cause affichée et action de récupération.
- Implémenter l'étape curateurs promise par le concept : à l'onboarding, 3-5 curateurs proposés avec titre + critère, en suivre au moins un peuple la carte immédiatement — remplacer ecrireSuivis([]) par ce choix. Vérifiable : aucun compte ne sort de l'onboarding avec zéro suivi et zéro spot de voix humaine.
- Donner sa glose à chaque chip d'envie au premier contact : première session, taper un chip affiche sa définition d'une ligne (« incognito — le bar caché ») avant de lancer le deck, façon note en marge qui s'efface. Vérifiable : chaque mot inventé a sa définition atteignable en un geste.
- Couper la surface du lancement : geler comparer, critères gradués, groupe et Grand Jeudi derrière un flag, ne livrer que carnet + deck + cercle + recherche. Vérifiable : la navigation de la semaine du lancement tient en 4 destinations, et l'analytique (jalons) confirme quelles fonctions sont réellement touchées avant d'en rouvrir.

> Une plume magnifique sur un carnet que personne n'a encore regardé lire par-dessus l'épaule d'un vrai utilisateur : lancez-le petit, testez-le vite, ou le lexique fera fuir ceux qu'il devait charmer.


### pm app sociale — 6/10

**Points forts**
- Le positionnement est en or : « ça dit quoi ce soir ? » est un job-to-be-done réel, et l'anti-Google-Maps (tips signés, pas d'étoiles, deck fini à 8 cartes) est une vraie différenciation défendable.
- Le cold start est mieux pensé que 90 % des apps sociales que je vois : payoff avant inscription (3 vrais spots géolocalisés), 320 spots éditoriaux en amorce, curateurs à suivre, import Google Maps — le carnet ne démarre jamais vide.

**Plus gros points faibles**
- La boucle de rétention repose sur des notifications (« cette semaine, ça dit taco », le swipe de sortie du lendemain, la cloche) — or c'est une PWA et je ne vois AUCUN web push implémenté dans le code. Sans canal de rappel, le D7 va s'effondrer : l'app attend que l'utilisateur revienne tout seul.
- Zéro mécanique virale réelle : ChercherAmis mentionne un « lien d'invitation » mais tout est derrière un mur de connexion — impossible de partager un spot ou un tip vers WhatsApp qui atterrisse sur quelque chose de visible. Le match de groupe (le vrai vecteur K-factor : 1 sortie = 3 installs) existe en écran mais n'est pas le cœur du funnel d'acquisition.
- Promesse/réalité : le deck pondéré matche les proches sur le PRÉNOM normalisé (fragilité assumée en commentaire dans deck.ts) — « porté par ton cercle » peut être faux avec un homonyme. La confiance est LA promesse du produit ; c'est le seul endroit où on n'a pas le droit d'être approximatif au lancement.

**Reco prioritaire** : Avant la finale : brancher un canal de rappel (Web Push PWA ou, à défaut, un lien de partage public par spot vers WhatsApp) — sans boucle de retour ni boucle d'invitation, le pic « on y voit le foot » sera un one-shot qui meurt en 72 h.

**Son chemin vers le 10/10**
- Web Push fonctionnel sur la PWA avec 3 déclencheurs implémentés et mesurables : la notif du lundi (rotation street-food), le swipe de sortie J+1 (« alors, Le Bisou ? »), et l'annonce du Grand Jeudi — avec opt-in demandé au bon moment (après la première sortie validée, pas à l'onboarding).
- Une page spot publique partageable sans compte (nom, tip signé, photo, distance) + deep link « rejoins mon cercle » : chaque tip envoyé dans WhatsApp devient un canal d'acquisition ; je veux voir un K-factor mesurable, pas un lien d'invitation enfoui dans un onglet.
- Remplacer le matching prénom→proche par des uuid Supabase réels dans deck.ts AVANT le lancement : la mention « porté par ton cercle » doit être vraie à 100 %, c'est le contrat du produit.
- Instrumentation minimale des 5 événements de la boucle (deck ouvert, carte validée, sortie déclarée, swipe J+1, invitation envoyée) avec un funnel consultable : sans ça, impossible de savoir si la rétention D1/D7 tient et où elle casse.
- Le match de groupe promu en porte d'entrée du lancement foot : « on regarde la finale où ? » avec invitation des potes SANS compte préalable (ils swipent en invité, comptent créé après) — c'est la seule mécanique du produit où un utilisateur en amène mécaniquement trois.

> Un concept 9/10 avec une boucle de croissance 3/10 : jeudi sait magnifiquement répondre « ça dit quoi ce soir ? », mais ne sait ni te rappeler demain, ni se propager dans le groupe WhatsApp où la question se pose vraiment.


### gérant de bar — 6/10

**Points forts**
- « Aucun lieu ne paie, jamais » : pour une fois qu'une app ne vient pas me racketter en visibilité comme TheFork ou Google Ads — si je suis dedans, c'est que des clients m'aiment vraiment.
- Des tips au lieu d'avis : « demande Momo au comptoir » me ramène des clients déjà dans le bon mood, et ça tue le chantage à l'étoile.

**Plus gros points faibles**
- Je n'existe pas dans ma propre fiche : aucun moyen de revendiquer mon bar, corriger mes horaires, contester une photo. Les horaires viennent d'OSM (137 sur ~320 renseignés !) — un client qui trouve porte close un jeudi soir, c'est MOI qu'il maudit, pas l'app.
- La photo des WC obligatoire et le 'critère bruit de Karim' : mon établissement est jugé et documenté par des tiers, en mon absence, sans droit de réponse — pastilles ou pas, ●○○ sur la propreté c'est une note qui reste.
- Le cercle fermé + invitation only : si les 3 premiers curateurs du 11e ne m'aiment pas, je suis invisible pour toute leur descendance. Pas de pay-to-play, d'accord, mais pas de recours non plus — c'est une cooptation opaque.

**Reco prioritaire** : Créez un statut « patron vérifié » minimal : je revendique ma fiche, je corrige horaires/fermetures exceptionnelles et je peux répondre à UN tip — sans jamais pouvoir acheter de visibilité.

**Son chemin vers le 10/10**
- Un espace patron vérifié (justificatif Kbis ou facture) : correction des horaires, adresse, fermetures exceptionnelles, avec mention visible « horaires confirmés par le lieu le [date] » — et mes corrections prioritaires sur les données OSM.
- Un droit de réponse encadré : un seul message signé du patron par fiche (« la terrasse rouvre en mai », « Momo est parti, demandez Sarah »), dans le même style carnet, jamais promotionnel.
- Une procédure de contestation photo sous 48 h : si la photo WC date de mes anciens sanitaires refaits depuis, je peux demander un re-passage — et le badge 'fiche complète' expire au bout de 12 mois.
- Le filtre « on y voit le foot » vérifié auprès du lieu avant le lancement Coupe du monde : un binaire foot oui/non erroné le soir d'une finale, c'est 40 personnes furieuses chez moi ou 40 clients perdus — appelez les ~30 bars concernés, ça se fait en deux jours.
- Un canal patron neutre (email dédié dans l'app) pour signaler travaux, changement de propriétaire, fermeture définitive — pour que la carte ne devienne pas un cimetière d'infos périmées qui nous retombe dessus.

> Le seul guide qui ne me fait pas payer, mais aussi le seul où je n'ai ni les clés de ma fiche ni le droit de dire que mes horaires sont faux — réglez ça et je le conseille à tous les collègues du 11e.


### experte accessibilité — 5.5/10

**Points forts**
- Le mouvement est exemplaire : prefers-reduced-motion respecté jusque dans le JS (le jet de carte tombe sec), rien ne boucle, vibrations courtes.
- De vrais réflexes ponctuels : zone de tap 44px sur les pins de la carte, aria-pressed/aria-label/role=tablist présents, alt sur les photos, commentaire « (a11y) » sur --cire-claire — quelqu'un y a pensé.

**Plus gros points faibles**
- Le swipe est la langue ET la seule grammaire du deck : valider/bof n'existent QUE par glissement pointeur (seuil 90px) et « jeter » que par appui long 500ms. Zéro bouton équivalent, zéro clavier. Échec direct WCAG 2.5.7 (dragging movements) et 2.1.1 — un utilisateur de lecteur d'écran ou de commande vocale ne peut littéralement pas répondre à « ça dit quoi ce soir ? ».
- Une typographie systémique sous le seuil de lisibilité : le corps « système » est du mono 11px (et trois occurrences à 10px) posé en encres diluées — rgba(239,233,216,0.34) à 0.5 sur charbon, soit des contrastes de ~2:1 à 3.5:1 pour des infos porteuses (horaires, distances, aides gestuelles, labels). Échec 1.4.3 en série, aggravé par Caveat (cursive) pour les tips.
- Cibles tactiles et focus au rabot : .notif-ok (padding 3px 9px, 11px), .idx-favori (0 2px), .menu-critere-btn (4px 0) très en dessous de 44px ; outline:none répété sur les inputs avec pour seul substitut un changement de couleur de filet 1px ; des li role=button sans tabIndex ni onKeyDown.

**Reco prioritaire** : Avant le lancement de jeudi : ajouter sous chaque carte du deck deux vrais boutons « bof » / « validé » (44×44 min, focusables, le swipe restant le raccourci) et un bouton « retirer » en alternative à l'appui long — c'est une journée de travail et ça lève le blocage total du parcours cœur.

**Son chemin vers le 10/10**
- Alternative non gestuelle pour CHAQUE geste : boutons valider/bof/retirer sur le deck et le récap, navigation clavier complète (tabIndex + Enter/Espace/flèches sur QuestionsSwipe, deck, li role=button), testée au lecteur d'écran (VoiceOver iOS puisque PWA mobile).
- Passe de contraste chiffrée : toute encre portant de l'information ≥ 4.5:1 (remonter --encre-3 et les rgba 0.34–0.5 quand le texte est porteur ; réserver les alphas faibles au décoratif) ; vérifier --ouvert #7cb342 et --cire #a8322a sur --nuit en 11px.
- Plancher typographique à 12px minimum (idéalement 13) pour tout texte informatif, suppression des trois font-size:10px, et Caveat réservé aux tips ≥ 17px avec un contraste plein — jamais pour horaires, distances ou états.
- Cibles tactiles ≥ 44×44 CSS partout (notif-ok/non, favori, menus critères, chips météo/quand), au besoin via padding ou pseudo-élément comme déjà fait sur .pin::after.
- Focus visible systématique (un :focus-visible global 2px encre, jamais outline:none sans substitut équivalent), aria-live=polite sur le toast « archivé · annuler » et sur le compteur du deck, et lang/labels vérifiés sur les formulaires (auth-input sans label associé).

> Un carnet de nuit superbe et sincère, mais dont la porte d'entrée — le swipe obligatoire en encre diluée 11px — reste fermée à quiconque n'a pas deux pouces valides et une excellente vue : lancez, mais avec les boutons équivalents.


### growth marketer — 5.5/10

**Points forts**
- Le lien d'invitation est déjà LE canal assumé dans le code (?invite=<id>, navigator.share, bandeau d'accueil de l'invité) — la mécanique K-factor de base est câblée.
- Onboarding payoff-first (vrais spots avant toute question) + un hook de lancement daté et concret (filtre foot pour la finale) : rare de voir ça pensé avant le jour J.

**Plus gros points faibles**
- Zéro analytics. Aucun event, aucun outil dans le code. Vous lancez cette semaine sans pouvoir mesurer activation, K-factor ni rétention J7 — vous pilotez à l'aveugle.
- La notification du lundi et la boucle « alors, Le Bisou ? » sont le moteur de rétention du concept, et il n'y a AUCUN web push implémenté. Sur PWA iOS, sans installation sur l'écran d'accueil, pas de notifs du tout — et rien ne pousse l'installation.
- Le lien d'invitation atterrit sur un mur de connexion : pas de landing publique qui montre la vitrine de l'inviteur et 2-3 spots avant de demander un compte. Chaque clic WhatsApp qui ne comprend pas en 3 secondes est perdu.

**Reco prioritaire** : Avant la finale : pose PostHog ou Plausible (1h de travail) avec 6 events — invite_envoyée, invite_cliquée, compte_créé, deck_ouvert, spot_validé, retour_J7 — sinon le lancement ne t'apprendra rien.

**Son chemin vers le 10/10**
- Analytics en place avec funnel complet et attribution du parrainage : chaque compte porte l'id de son inviteur en base (colonne invited_by), et je peux lire le K-factor réel (invites envoyées × taux de clic × taux d'inscription) dans un dashboard.
- Le lien ?invite= ouvre une page publique SANS compte : portrait de l'inviteur, son mot, 3 de ses spots — puis seulement « rejoins-le ». Conversion clic→compte mesurée > 40 %.
- Web push implémenté (avec prompt d'installation A2HS contextuel sur iOS, déclenché après le premier spot validé, pas à l'arrivée) et la notif du lundi qui part vraiment — c'est la seule arme de rétention J7 d'une PWA.
- Le moment aha déplacé avant la friction : le deck « ça dit quoi ce soir ? » jouable en 2 swipes dès l'écran d'invitation, avec les spots de l'inviteur — le compte se crée au moment où on veut GARDER un spot, pas avant.
- La boucle du lendemain (« alors, Le Bisou ? ») déclenchée et mesurée : ≥ 30 % des sorties génèrent un swipe de validation à J+1 — c'est ça, la preuve d'une rétention qui vient du produit et pas de la curiosité du lancement.

> Produit avec une vraie âme et une boucle virale déjà câblée, mais lancé sans instruments de bord ni moteur de rétention : c'est une belle voiture sans compteur ni réservoir — remplis les deux avant la finale.


### experte RGPD — 5.5/10

**Points forts**
- Architecture privacy by design réelle : Supabase EU, RLS solide (migration 0003 : bucket photos privé + URLs signées, date de naissance non exposée, relations non falsifiables), privé par défaut adresse par adresse.
- Droits RGPD déjà câblés dans le produit : export .json (portabilité, art. 20) et supprimer_mon_compte() en cascade Storage compris (effacement, art. 17) — rare à ce stade.

**Plus gros points faibles**
- Zéro couche légale : aucune politique de confidentialité, pas de CGU, pas de mentions, pas d'information art. 13 à l'onboarding, pas de base légale documentée par traitement, pas de contact délégué. Lancement cette semaine = mise sur le marché non conforme dès le jour 1.
- Le masquage automatique des visages promis dans le concept (« les visages des inconnus sont automatiquement masqués ») n'existe nulle part dans le code — les photos de lieux publiées exposeront des tiers non consentants (clients de bars, la nuit, avec alcool) : c'est LE risque contentieux, et la promesse écrite aggrave le cas.
- Données de vie nocturne = inférences sensibles non traitées : le lexique « alcolo », les horaires de sortie, la géoloc des lieux fréquentés permettent de déduire consommation d'alcool, habitudes, voire orientation (bars communautaires). Aucune AIPD (analyse d'impact) alors que le croisement géoloc + comportement nocturne + réseau social la rend quasi obligatoire (art. 35). Et la date de naissance est collectée sans finalité visible = violation de minimisation.

**Reco prioritaire** : Avant tout lancement public : publier une politique de confidentialité accessible depuis l'onboarding avec base légale par traitement, et désactiver la publication de photos tant que le floutage automatique des visages n'est pas implémenté (ou imposer une revue manuelle).

**Son chemin vers le 10/10**
- Écran d'information à la première ouverture (art. 13) : qui est responsable de traitement, quelles données, quelles bases légales, durées de conservation, destinataires (Supabase EU, Nominatim/OSM — car oui, les recherches d'adresse partent chez OpenStreetMap avec un email identifiant, ça doit être dit), lien vers la politique complète. Vérifiable : l'écran existe et bloque avant la collecte.
- Implémenter réellement le floutage automatique des visages côté client AVANT upload (détection on-device, jamais d'envoi de biométrie à un tiers), + strip des métadonnées EXIF/GPS des photos uploadées. Vérifiable : une photo test avec visage et EXIF ressort floutée et nettoyée dans le bucket.
- AIPD écrite et datée couvrant le trio géoloc + habitudes nocturnes + graphe social, avec mesures : géoloc jamais stockée en continu (aujourd'hui c'est du getCurrentPosition ponctuel — le documenter et s'y engager), pseudonymisation des sorties, purge automatique des 'sorties' après X mois. Vérifiable : document AIPD + job de purge en base.
- Minimisation effective : supprimer la colonne naissance (aucune finalité) ou documenter une finalité + vérification d'âge ; consentement opt-in explicite et retirable pour la notification du lundi (prospection) ; registre des traitements tenu. Vérifiable : diff SQL + toggle notif dans les réglages.
- Encadrer le contenu tiers : procédure de signalement d'une photo/tip exposant une personne, délai de retrait, et information des invités (le système d'invitation traite les données de non-membres). Vérifiable : bouton signaler sur chaque photo + page procédure.

> Une fondation technique que beaucoup de DPO rêveraient de trouver — mais lancer cette semaine sans une ligne d'information légale ni le floutage promis, c'est offrir à la CNIL un dossier clé en main sur des données de vie nocturne.


### experte tourisme — 5/10

**Points forts**
- L'intégrité éditoriale est rare et précieuse : aucun lieu ne paie, des tips signés par des gens qui y sont allés — c'est exactement ce que mes visiteurs réclament quand ils disent « on veut du vrai Paris ».
- Le filtre « on y voit le foot » avec les fan zones sourcées (Quai de la Photo, Ground Control) pour la finale : timing intelligent, données réelles, adresses exactes avec lat/lng.

**Plus gros points faibles**
- Zéro multilingue. Pas une ligne d'anglais dans le code, Nominatim forcé en 'Accept-Language: fr', et un lexique en argot (alloco, alcolo, incognito, « ça dit quoi ») incompréhensible même pour un francophone de Bruxelles. Un visiteur étranger est exclu dès l'écran d'accueil.
- Les horaires sont le talon d'Achille : la majorité des ~320 spots n'a pas d'horaires (le code de recherche l'avoue lui-même — « la majorité des spots n'a pas d'horaires »), et le filtre « ouvert maintenant » laisse passer les inconnus. Envoyer quelqu'un devant une porte fermée, c'est la faute qu'un office de tourisme ne pardonne pas.
- Couverture des quartiers déséquilibrée : 1 seul spot dans le 14e, 3 dans le 20e, 5 dans le 17e, quasi rien en petite couronne hors fan zones — contre une avalanche de rooftops d'hôtels dans les 1er-2e-8e. Belleville, Butte-aux-Cailles, Montparnasse : absents ou presque.

**Reco prioritaire** : Compléter les horaires vérifiés de 100 % des spots avant le lancement — un lieu sans horaires ne devrait tout simplement pas sortir dans un deck qui prétend répondre à « ça dit quoi CE SOIR ? ».

**Son chemin vers le 10/10**
- Horaires vérifiés et datés (« vérifié le JJ/MM ») sur 100 % des ~320 spots, avec exclusion stricte du deck de tout lieu fermé à l'heure de la requête — vérifiable en lançant l'app un dimanche à 15h.
- Une version anglaise complète de l'interface ET un glossaire embarqué du lexique maison (alloco, incognito, alcolo, météo du porte-monnaie) — testable avec un visiteur non francophone qui doit arriver seul jusqu'à une adresse.
- Rééquilibrage territorial mesurable : minimum 8 spots par arrondissement (aujourd'hui : 14e=1, 20e=3, 17e=5) plus une amorce petite couronne (Pantin, Montreuil, Saint-Ouen), là où vivent les Parisiens et où logent de plus en plus de visiteurs.
- Sur chaque fiche lieu : station de métro la plus proche avec la ligne, et un bouton d'itinéraire — l'adresse postale seule ne suffit pas à quelqu'un qui ne connaît pas Paris.
- Un mode « visiteur de passage » sans mur de connexion ni invitation : le pilier éclaireurs locaux + public existe déjà dans le concept (location-native, pull), il suffit de l'exposer en lecture seule pour le touriste qui a trois soirs devant lui.

> Un carnet d'initiés superbement pensé pour les Parisiens qui ont déjà des potes parisiens — mais en l'état, mes visiteurs au comptoir de l'office n'en franchiraient même pas la première page.


### investisseur early-stage — 4.5/10

**Points forts**
- Une thèse produit rare : le concept (CONCEPT.md) est le doc le plus travaillé que j'aie vu d'un solo founder — lexique, rituels (Grand Jeudi, minuit), anti-étoiles, photos WC comme preuve de passage : c'est une vraie opinion, pas un clone de Mapstr.
- L'exécution suit le discours : 18k lignes de code réel, deck « ça dit quoi ce soir » fonctionnel, RLS Supabase sérieuse (migration 0003 colmate l'auto-invitation, la fuite de date de naissance), DA cohérente. Le gars ship.

**Plus gros points faibles**
- Le business model est un vœu, pas un modèle : « aucun lieu ne paie, jamais » + réservation en apport où « le lieu ne nous paie rien » = personne ne paie. L'affiliation resa (TheFork/SevenRooms) c'est 1-3 € la couverture, il faudrait des centaines de milliers de sorties transactées pour un revenu seed-compatible — et zéro partenariat signé.
- Cold start social au carré : la valeur = les tips de MES potes, mais mes potes n'y sont pas. 320 spots seedés par le fondateur + curateurs fictifs (tips tamponnés « démo » dans le code) ≠ un graphe. C'est le cimetière Foursquare/Dérive/Corner, et ce cimetière est plein.
- Solo founder, produit-maximaliste : le concept a 15 features (match de groupe, Grand Jeudi, éclaireurs, import Google, lexique horaire) avant d'avoir prouvé UNE boucle de rétention. Lancer sur la finale de Coupe du monde avec un filtre foot, c'est un stunt, pas une stratégie d'acquisition.

**Reco prioritaire** : Gèle tout le reste et prouve UNE métrique en 90 jours : le W4 retention d'une cohorte de 100 vrais Parisiens (pas tes potes) qui ouvrent l'app un jeudi soir et RESSORTENT grâce à elle — c'est le seul chiffre qui me fera reprendre le call.

**Son chemin vers le 10/10**
- Rétention prouvée : ≥ 30 % de rétention semaine 4 sur une cohorte organique de 500+ users parisiens, avec ≥ 2 decks « ce soir » lancés par semaine par utilisateur actif — dashboards Amplitude que je peux auditer, pas des captures.
- Le graphe existe sans le fondateur : ≥ 40 % des tips affichés dans un deck moyen viennent de membres réels (auteurId non-démo), et un coefficient viral mesuré ≥ 0,4 invitation acceptée par user — sinon c'est un guide édité par un homme, pas un réseau.
- Un modèle chiffré signé : au moins un partenariat resa/billetterie contractualisé (TheFork, Shotgun, Billetweb) avec un take rate réel, et une projection honnête montrant un chemin vers 100 k€ ARR à 50 k MAU — ou assume le premium et montre 200 payeurs à 4 €/mois.
- Sortir du solo : un cofondateur growth/ops ou 2 advisors actifs avec equity, parce qu'un consumer social se gagne à la distribution, pas au produit — et ce fondateur est 100 % produit.
- Preuve de réplicabilité : le playbook « nouvelle ville » exécuté une fois (Lyon ou Marseille) en < 6 semaines avec 3 curateurs locaux recrutés et 50 spots vivants — sinon le TAM c'est Paris intra-muros, et ça ne rend pas un fonds.

> Un objet magnifique et une thèse produit que j'ai envie de croire, mais en l'état c'est un carnet d'adresses d'auteur sans modèle de revenu ni preuve de graphe — je passe, en demandant à revoir la cohorte dans trois mois.


## Les consommateurs


### étudiante 22 ans — 6.5/10

**Points forts**
- La météo du porte-monnaie c'est exactement moi : fin de mois "pluie" et l'app me sort des comptoirs sans me faire honte devant les autres — personne fait ça.
- Le ton et la DA carnet de nuit sont ultra screenshotables : "il pleut sur ton porte-monnaie", le tampon rouge, la photo des WC obligatoire — c'est du contenu TikTok gratuit.

**Plus gros points faibles**
- Le cold start me concerne direct : mes potes sont pas dessus, donc jour 1 c'est le carnet d'un fondateur de 30+ ans, pas "mes vrais potes". Le pitch entier repose sur un cercle que j'ai pas.
- 320 spots pour tout Paris, ça fait genre 15 spots en filtre pluie+apéro dans mon coin — je vais épuiser le deck en deux semaines et retourner sur TikTok où il y a 40 nouvelles adresses par jour.
- C'est une PWA derrière un mur de connexion sur invitation : sur mon iPhone, ajouter à l'écran d'accueil un site Vercel que personne connaît, c'est trois frictions avant même la première carte. Mes potes abandonneront à l'étape 1.

**Reco prioritaire** : Rendre le premier deck bluffant SANS cercle : à l'onboarding, me faire choisir 3 curateurs qui ont MON âge et MON budget (pas juste "le fondateur"), et que le filtre pluie sorte de vrais prix vérifiables (happy hours, pintes <6€) — c'est ça qui fait le screenshot que j'envoie au groupe.

**Son chemin vers le 10/10**
- Un lien de partage par carte qui s'ouvre SANS compte : je swipe "Le Bisou", j'envoie le lien au groupe WhatsApp, elles voient la carte, le tip signé et la photo — et seulement là on leur propose de s'inscrire. Sans ça, zéro viralité, et moi je vis en groupe.
- La météo pluie doit être chiffrée et honnête : chaque spot "pluie" affiche un prix repère réel (pinte, plat, entrée) et l'heure de l'happy hour — pas juste un tag. Si je me pointe et que la bière est à 8€, je désinstalle.
- Des curateurs de lancement qui me ressemblent : au moins 5 profils 20-25 ans, budget étudiant, quartiers étudiants (5e, 11e, 13e, Belleville) avec 30+ spots chacun, visibles à l'onboarding. Pas que des trentenaires foodies.
- Du contenu frais chaque semaine, visible : un compteur "cette semaine : 12 nouveaux spots, 34 nouveaux tips" ou la notif du lundi qui montre du neuf. 320 spots figés = app morte en un mois pour quelqu'un qui sort 3 fois par semaine.
- Le filtre foot/finale poussé à fond au lancement : "on y voit le match + pinte <7€ + il reste de la place à 20h" partageable en un tap — c'est LE cas d'usage de la semaine, il doit marcher parfaitement, pas être un tag binaire noyé.

> Je l'installerais par curiosité parce que la météo du porte-monnaie me parle vraiment, mais si au bout de deux jeudis le deck me ressort les mêmes huit spots de trentenaires, je retourne demander à mon groupe WhatsApp — qui, lui, répond toujours.


### foodie 30 ans — 6.5/10

**Points forts**
- Le format « tip » est exactement ce que j'écris déjà dans mon carnet : les tips seed du cercle (« huîtres au comptoir rond, vas-y à 18h pile, après c'est blindé ») sont du vrai savoir d'initié, pas des avis.
- L'import Takeout existe vraiment dans le code (GeoJSON parsé, Comment conservé, privé par défaut, relance coupée après succès) — pas une promesse de pitch.

**Plus gros points faibles**
- L'import Google est un déménagement, pas une renaissance : mes 500 pins arrivent sans envies, sans compagnies, sans météo (champs vides dans importerTakeout), dédoublonnés par simple nom — je retrouve exactement le même cimetière de pins, juste repeint en charbon. Et le parcours Takeout, c'est pas « deux minutes » : Google met parfois des heures à générer le zip.
- Le fonds éditorial curated trahit le concept : « rooftop chic, ambiance premium et cocktails », « beau panorama et ambiance mode » — c'est du Time Out anonyme, pas un tip signé. 38 rooftops sur 129 spots curated, une poignée de vraies tables : pour un gastronome, la couverture bouffe est famélique.
- La preuve par l'exemple fait mal : le carnet réel du fondateur (ersan.ts) c'est « A tester !! », « Bon resto », « Reco xtof » — si même le curateur zéro n'écrit pas de vrais tips, la promesse éditoriale repose sur du vent au lancement.

**Reco prioritaire** : Faire de l'import Google un rituel de tri, pas un dump : après l'import, un deck « alors, celui-là ? » qui me fait swiper mes pins un par un (garder/tagguer envie/archiver, transformer mon « A tester » en vrai tip) — c'est LÀ que mes années de Maps deviennent un carnet jeudi.

**Son chemin vers le 10/10**
- Post-import obligatoire : un flux de curation qui me fait requalifier mes pins Google (envie, compagnie, mon mot à moi) par paquets de 10, avec dédoublonnage par proximité géo + nom flou, pas par égalité stricte du nom.
- Réécrire les 129 descriptions curated en tips signés à la première personne avec un détail actionnable vérifiable (plat précis, heure, place au comptoir) — zéro « ambiance premium », zéro accent manquant (« caché », « Hôtel »).
- Rééquilibrer l'amorce éditoriale : au moins 100 vraies tables (bistrots, comptoirs, tables d'auteur) avec le plat à commander, contre les 38 rooftops actuels — sinon un gastronome n'a rien à se mettre sous la dent.
- Que le carnet du fondateur soit exemplaire : les 81 lieux d'ersan.ts avec de vrais tips complets, photos plat + salle + WC, comme preuve vivante de la charte « publier = prouver ».
- Un export de MON carnet (JSON/GeoJSON) aussi simple que l'import — je ne remplace mon système que si je ne suis pas prisonnier du nouveau.

> Le concept parle ma langue de carnet, mais tant que mes pins importés restent des zombies non tagués et que les tips « maison » sentent le guide touristique, jeudi complète mon système sans le remplacer.


### nouvelle arrivante — 6.5/10

**Points forts**
- Le solo assumé en première position, ça change tout : manger au comptoir sans avoir honte, une app qui me dit « sage. à jeudi. » au lieu de me rappeler que je n'ai personne — pour une fois je ne me sens pas anormale de sortir seule.
- Le carnet n'est pas vide le premier soir : ~320 spots éditoriaux, le payoff de l'onboarding me montre 3 vrais lieux autour de moi avant même de me demander mon prénom, et les tips signés ont une chaleur que Google Maps n'aura jamais.

**Plus gros points faibles**
- La promesse anti-cold-start du concept n'est pas dans l'app : le CONCEPT.md dit « on entre par les curateurs » avec une sélection proposée à l'onboarding — mais dans Onboarding.tsx c'est ecrireSuivis([]) et cercle VIDE. Moi qui ne connais personne, je sors de l'onboarding avec zéro voix humaine à suivre, juste le curateur générique « jeudi ».
- L'app m'aide à sortir seule mais pas à être moins seule : aucun pont vers de vraies rencontres. ChercherAmis suppose que j'ai déjà des amis à chercher. Le match de groupe, les proches, les invitations — tout l'étage social est construit pour des gens qui arrivent AVEC leur bande. Moi je repars de ma soirée solo exactement aussi seule qu'avant.
- Les tips signés « — Karim, éclaireur du 10e » ne me disent rien : Karim est un inconnu pour moi, donc au démarrage la « confiance » promise est en réalité… des avis d'inconnus, exactement ce que l'app jure de ne pas être. La différence avec Google se sentira pour les membres installés, pas pour moi.

**Reco prioritaire** : Implémentez vraiment l'écran « suis 3 curateurs qui te ressemblent » à l'onboarding (avec visage, titre, critère, 3 spots aperçu) — c'est écrit dans votre propre concept et c'est LA béquille des nouveaux arrivants sans cercle.

**Son chemin vers le 10/10**
- L'écran curateurs à l'onboarding, codé et obligatoire pour les cercles vides : ecrireSuivis() ne doit jamais partir vide pour quelqu'un qui n'a importé aucun contact — 3 curateurs suivis minimum, choisis, avec leur tête et leur obsession.
- Un mode « nouvelle à Paris » explicite : je coche « j'arrive », et pendant 3 mois le deck privilégie les spots où on mange bien seule au comptoir, les critères binaires « manger-seul oui » et « on peut y parler au staff » — vérifiable dans les filtres du deck de CeSoir.tsx.
- Un pont humain concret : les sorties solo au même spot le même soir deviennent visibles opt-in (« 2 membres de jeudi seront au comptoir du Bisou ce soir — tu veux qu'on te présente ? ») — c'est ça, me faire sentir moins seule, pas un carnet de plus.
- Que « Karim » devienne quelqu'un pour moi : une fiche curateur riche accessible depuis chaque tip dès le deck (pas seulement au récap), avec son historique de recos qui ont marché — la preuve, pas juste la signature.
- Le Grand Jeudi livré et daté dès le lancement : pour quelqu'un sans cercle, la nuit où toute la ville s'ouvre est le seul moment où l'app me donne autant qu'aux autres — annoncez la date dans l'onboarding.

> C'est la plus belle app pour sortir seule que j'aie vue — mais entre sortir seule et se sentir moins seule, il y a un pont que jeudi n'a pas encore construit, et son propre concept promet des béquilles (les curateurs à l'onboarding) que le code ne tient pas.


### ado TikTok 19 ans — 6.5/10

**Points forts**
- La vibe écriture est réelle : « alcolo » après minuit, « t'es difficile ce soir », les photos des chiottes obligatoires — c'est du contenu TikTok gratuit, y'a une voix, c'est pas une app corporate.
- Pas d'étoiles, pas d'avis d'inconnus, que des potes qui te disent où aller — c'est exactement ce qu'on fait déjà en DM Insta, donc le concept je le comprends en 3 secondes.

**Plus gros points faibles**
- Zéro boucle de partage : je peux rien envoyer en story ou en DM. Un spot validé qui génère pas une belle carte partageable Insta, ça existe pas — c'est comme ça qu'une app se propage, pas par le bouche-à-oreille de darons.
- C'est une PWA derrière un mur de connexion : pas sur l'App Store, faut « ajouter à l'écran d'accueil » sur Safari — personne de mon âge fait ça, on te prend direct pour un site chelou.
- L'app est morte sans mes potes dedans, et ils y sont pas. Le deck tire du cercle, mais mon cercle c'est 0 personne au jour 1 — je vois des spots d'un « curateur zéro » que je connais pas, ça fait blog de food influenceur de 35 ans.

**Reco prioritaire** : Fais d'abord la carte de partage : quand je valide un spot, génère une image stylée carnet/tampon rouge que j'envoie en story ou en DM avec un lien qui ouvre direct la fiche — c'est ça ton acquisition, pas la Coupe du monde.

**Son chemin vers le 10/10**
- Un bouton « envoyer à » sur chaque spot qui génère une image verticale 9:16 (photo du membre + tip manuscrit + tampon jeudi.) partageable en story Insta/TikTok et en DM, avec deep link qui ouvre la fiche SANS créer de compte d'abord.
- Une vraie app dans l'App Store (ou au minimum un flow d'install PWA guidé qui prend 2 taps), parce que « ouvre Safari, partage, ajouter à l'écran d'accueil » je le ferai jamais.
- Le mode groupe (le match « on se voit où ») dispo au lancement et partageable en lien dans le groupe WhatsApp/Insta — c'est LE truc que j'utiliserais un jeudi soir avec mes potes, et là il est en « Ensuite » dans la roadmap.
- De la vidéo : les photos collées c'est joli mais mort ; laisse-moi poster un clip de 5 sec du lieu (le son, la lumière, l'ambiance) — un tip écrit « demande Momo au comptoir » + une vidéo, là je reviens tous les jours.
- Une raison de rouvrir avant même d'avoir des potes dessus : le Grand Jeudi dès le mois 1 avec une date annoncée, et la notif du lundi (« cette semaine ça dit taco ») activée — sinon après la finale de la Coupe du monde j'oublie l'app en 4 jours.

> L'esthétique carnet charbon/cire c'est stylé genre wine bar de niche, le texte est drôle, mais sans partage en story, sans mes potes et sans App Store, c'est un beau zine que j'ouvre une fois et que j'oublie.


### jeune pro 28 ans — 6/10

**Points forts**
- Le deck de 8 cartes + météo porte-monnaie : je décide en 30 secondes au lieu de 25 minutes de WhatsApp — c'est exactement mon problème.
- Les tips signés (« table du fond, évite le vendredi ») valent mieux que 400 avis Google, et le mode « je sais pas » avec plans de 2 spots est malin.

**Plus gros points faibles**
- Zéro info résa/attente : pas de bouton réserver, pas de lien vers le lieu, pas de téléphone, pas de « c'est blindé le samedi ». Pour une bande de 6 un vendredi, une reco sans résa c'est une reco que je ne peux pas exécuter.
- Le match de groupe — LA killer feature pour moi (« on se voit où ? ») — est relégué en phase « Ensuite ». Au lancement, l'app répond surtout à la sortie solo/duo, pas à mon cas d'usage principal.
- Mon Notion survit : je ne peux pas exporter/partager une shortlist propre dans le groupe WhatsApp, et avec ~320 spots seed + mon cercle pas encore dedans, le deck tirera souvent du contenu « démo » signé jeudi, pas de mes potes.

**Reco prioritaire** : Sur chaque carte du deck, ajoute une ligne « exécution » : lien résa (ou téléphone), mention « résa conseillée / walk-in », et capacité groupe — sinon je valide un lieu que je ne peux pas avoir.

**Son chemin vers le 10/10**
- Bouton « réserver / appeler » sur chaque fiche + champ fiable « résa obligatoire ? attente le week-end ? » renseigné par les tips — vérifiable : 100 % des 320 spots seed ont au moins le téléphone/lien, et le tag résa sur les 50 plus demandés.
- Le match de groupe livré et fluide : je lance une sortie, 5 potes swipent depuis WhatsApp (lien sans compte), un lieu gagne en moins de 5 minutes chrono.
- Partage exportable : un plan validé devient un mini-lien propre (nom, adresse, horaire, tip) que je colle dans le groupe — c'est ça qui tue mon doc Notion, pas la carte.
- Import Google Maps réellement fonctionnel jour 1 (mes 200 pins deviennent mon carnet en 2 minutes, avec dédoublonnage contre les 320 spots seed), sinon je repars de zéro et je n'ai pas le temps.
- Horaires et « ouvert maintenant » fiables sur tout le seed (aujourd'hui 137/306 ont des horaires d'après vos propres données) : une seule reco fermée un jeudi soir et je désinstalle.

> Charmante et rapide pour choisir OÙ, mais tant que je ne peux ni réserver, ni trancher à six, ni partager le plan dans le groupe, jeudi reste le joli carnet à côté de mon Notion, pas son remplaçant.


### fêtard 25 ans — 5.5/10

**Points forts**
- Le basculement minuit est réel dans le code (dodo · alcolo · gastro · disco après 00h) — enfin une app qui sait qu'on vit la nuit, avec les horaires d'ouverture gérés.
- Les tips signés de potes au lieu des étoiles Google, c'est exactement comme on décide en vrai — et le filtre « on y voit le foot » pour la finale, gros oui.

**Plus gros points faibles**
- Le mode groupe est un mensonge poli : dans EcranGroupe.tsx, c'est MOI qui swipe pour les 8 — leurs envies, leurs départs, leurs swipes « arriveront de leurs téléphones ». Donc ce soir, ça ne remplace RIEN de notre convo WhatsApp, ça rajoute une app.
- Pour ma vie nocturne, le stock est maigre : ~15 spots disco/club sur ~129 curated, et 38 rooftops. C'est une app d'apéro-resto qui met un chapeau « nuit », pas une app de club. Après 2h du mat', je retourne sur Resident Advisor / Shotgun.
- Le match de groupe ne prend qu'UN budget (le mien, hardcodé à 1) et pas de notion de file d'attente, prix d'entrée, dernier métro, vestiaire — les vraies variables d'une soirée club à 8.

**Reco prioritaire** : Rends le match de groupe VRAIMENT multi-téléphones avant tout le reste : un lien de sortie partageable dans WhatsApp où chacun des 8 swipe depuis son tel sans compte, et le premier lieu qui matche gagne — sinon le mode groupe est du théâtre.

**Son chemin vers le 10/10**
- Sortie de groupe temps réel : je crée la sortie, je balance UN lien dans le groupe WhatsApp, les 8 swipent chacun sur leur tel (même sans compte jeudi), notif quand ça matche. Vérifiable : deux téléphones, un match croisé.
- Fiches nuit avec les vraies infos club : prix d'entrée, queue estimée, heure où ça se remplit, dernier métro / Noctilien depuis le spot, vestiaire oui/non — en tips signés, dans l'esprit de l'app.
- Passer de ~15 à 60+ spots disco/club/afters couvrant Pigalle, Oberkampf, 13e (péniches), Belleville — sinon le chip « disco » rend 3 cartes et je désinstalle.
- Budget par personne dans le match de groupe (la météo porte-monnaie de CHACUN, pas budgetMax:1 pour tout le monde) + split de l'entrée affiché.
- Un mode « after 2h » : quand je swipe à 3h du mat', ne me montrer QUE ce qui est ouvert là maintenant, avec le temps de marche depuis ma position — le champ horaires existe déjà, exploitez-le à fond.

> Le carnet est stylé et l'idée des tips de potes est juste, mais tant que mes 7 potes ne peuvent pas swiper depuis leur tel, « on va où ? » se décidera encore sur WhatsApp — et jeudi restera l'app qu'on ouvre après avoir déjà décidé.


### couple 35 ans — 5.5/10

**Points forts**
- La météo du porte-monnaie : le budget filtré sans le dire, c'est exactement comment on décide en couple.
- L'honnêteté du produit : tips signés « démo », « horaires inconnus » affiché tel quel — ça inspire plus confiance qu'une fausse certitude à la Google.

**Plus gros points faibles**
- Les horaires sont en partie inventés (seed « plausibles dérivés de l'envie ») et le modèle ne connaît pas les jours de fermeture : l'app peut m'envoyer devant un rideau baissé un lundi. Pour ma seule soirée du mois avec babysitter, c'est éliminatoire.
- Aucune réservation, aucun téléphone, aucun lien résa : je « valide » un lieu mais je dois ressortir de l'app pour sécuriser une table — donc l'app ne ferme pas la boucle qui compte pour moi.
- La confiance promise (tips de vrais potes) n'existe pas au lancement : mes potes n'y sont pas, les voix sont des tips « démo » et un fond éditorial « jeudi. ». Je juge sur la parole d'inconnus, ce que l'app prétend justement refuser.

**Reco prioritaire** : Avant tout le reste : de vrais horaires par jour de la semaine (fermeture hebdo incluse) sur les 320 spots, et un bouton « appeler / réserver » sur la fiche — c'est ça qui évite le resto raté, pas le swipe.

**Son chemin vers le 10/10**
- Horaires réels par jour (fermé lundi ≠ ouvert 12h-23h tous les jours) sur 100 % des ~320 spots d'amorce, avec la date de dernière vérification affichée — zéro horaire « plausible » inventé.
- Un bouton résa/appel sur chaque fiche : tel:, lien resa du lieu, ou à défaut le lien Google Maps direct — mesurable : je sécurise ma table sans quitter l'app.
- Un mode « duo » qui me sert vraiment : filtre binaire « on peut y parler » (bruit) + « réservable » + le critère gradué bruit/lumière signé, visibles sur la carte du deck, pas enfouis dans la fiche.
- Zéro tip « démo » visible sur les spots servis dans le deck : chaque lieu poussé a au moins un tip d'un humain identifiable qui y est allé, sinon il ne sort pas.
- Un signal de fraîcheur : « validé il y a 3 semaines par Karim » — un tip de 2024 sur un resto qui a changé de chef, c'est pire que rien.

> Une app charmante pour flâner, pas encore une app à qui je confie ma seule soirée à deux : tant qu'elle peut me dire « ouvert » sur un horaire inventé et sans résa, la babysitter coûte plus cher que le risque.


### parisien casanier 40 ans — 5.5/10

**Points forts**
- Le match de groupe, c'est le seul truc qui résout un vrai problème de ma vie : les 25 minutes de WhatsApp pour choisir où on se voit, une fois par mois.
- Pas d'étoiles, pas de pub, des tips signés par des gens que je connais — ça, ça me parle plus que les 4 000 avis Google que je ne lis plus.

**Plus gros points faibles**
- L'app est vide sans mes potes dedans, et mes potes de 40 ans n'installent pas d'app sur invitation pour photographier des toilettes. Le cold start social me tue avant la première sortie.
- Tout le lexique (alcolo, disco, mcdo, la fonte de minuit) est écrit pour quelqu'un qui sort trois fois par semaine jusqu'à 2h. Moi je sors une fois par mois, je rentre à 23h30 : la moitié de l'app ne me concerne littéralement jamais.
- Sortir plus n'est pas mon problème de découverte, c'est un problème d'agenda et d'énergie. L'app répond à « où ? » alors que ma vraie question c'est « quand et avec qui on arrive à caler ça ? » — rien dans le produit ne déclenche la sortie.

**Reco prioritaire** : Rendez le match de groupe utilisable SANS que mes potes aient l'app : je lance une sortie, je balance un lien WhatsApp, ils swipent 3 propositions dans le navigateur sans compte — c'est la seule porte d'entrée réaliste vers des gens comme moi.

**Son chemin vers le 10/10**
- Le match de groupe par lien WhatsApp sans inscription : mes 4 potes votent sur 3 lieux dans leur navigateur en 30 secondes, et le lieu gagnant a un bouton réserver qui marche. Vérifiable : une sortie complète organisée sans qu'aucun invité ne crée de compte.
- Un mode « une fois par mois » assumé : au lieu du deck du soir, une seule notification du type « ça fait 5 semaines, jeudi prochain Karim et Léa sont libres, ça dit quoi ? » — l'app qui provoque la sortie au lieu d'attendre que j'aie envie. Vérifiable : la notif existe, elle croise les agendas, elle propose une date + un lieu.
- Mes 4 restos habituels importés et enrichis en 2 minutes : j'entre mes 4 adresses, l'app me sort « les gens qui aiment Chez X aiment aussi Y à 400 m » — de la découverte à partir de MES habitudes, pas d'un deck générique. Vérifiable : import Google Maps réellement livré + 3 suggestions pertinentes dès le premier soir.
- Supprimer la friction de contribution pour les gens comme moi : je dois pouvoir dire « Le Bisou, oui, table du fond » en 10 secondes vocales ou 2 taps, sans photo de WC obligatoire — sinon ma carte reste vide et je ne sers à rien au cercle. Vérifiable : publier un tip sans aucune photo.
- La réservation intégrée jusqu'au bout : si à la fin du deck je dois quand même appeler le resto ou repasser par TheFork, l'app n'a fait que la moitié du travail. Vérifiable : deck → choix → table réservée sans quitter jeudi.

> Joli carnet, vraie personnalité — mais c'est une app pensée pour des gens qui sortent déjà ; moi elle ne me fera pas sortir plus, elle finira à côté de TheFork dans le dossier que je n'ouvre jamais, sauf si le match de groupe passe par WhatsApp.


### novice tech 55 ans — 4.5/10

**Points forts**
- L'idée, je la comprends tout de suite : c'est comme demander à un copain « tu connais un bon resto ? ». Ça, ça me parle.
- La connexion a l'air simple : un bouton Google ou un lien par mail, pas de mot de passe à inventer. Ça, je sais faire.

**Plus gros points faibles**
- Personne ne m'explique comment « installer » l'app. Ma fille m'envoie un lien, j'ouvre une page internet, et après ? Il n'y a nulle part un petit mode d'emploi « ajoute jeudi sur ton écran d'accueil » — j'ai cherché, il n'y en a pas. Sans elle au téléphone, je reste bloqué à la première étape.
- Le vocabulaire, c'est du chinois pour moi : alloco, incognito, tranquilo, alcolo, disco… Moi je veux dire « un restaurant pas trop cher » et l'app me parle en argot de jeunes. Et « gastro », pour les gens de mon âge, c'est une maladie, pas un bon dîner.
- Le lien magique par mail, c'est un piège pour moi : mes mails je les lis sur l'ordinateur du salon, pas sur le téléphone. Si le lien arrive là-bas, je clique au mauvais endroit et rien ne marche.

**Reco prioritaire** : Ajoutez, avant même la connexion, un écran « pour installer jeudi sur ton téléphone » avec 3 images pas à pas (le bouton partager, « sur l'écran d'accueil », voilà) — comme quand ma fille me montre en vrai.

**Son chemin vers le 10/10**
- Un vrai guide d'installation illustré, différent iPhone/Android, qui s'affiche tout seul quand j'ouvre le lien dans le navigateur — et pas une seule fois : qu'il revienne tant que je ne l'ai pas fait.
- Une petite bulle « c'est quoi ? » sur chaque mot bizarre : je touche « incognito » et ça me dit en français normal « un bar caché ». Pareil pour alloco, tranquilo, disco. Sans ça je n'ose pas appuyer.
- Que le lien de connexion par mail me dise clairement : « ouvre ce mail SUR TON TÉLÉPHONE » — écrit en gros, avant que j'envoie le mail. Ou mieux : un code à 6 chiffres à recopier, comme ma banque, ça je comprends.
- Des lettres plus grosses partout, ou un réglage « gros caractères » : l'écriture machine à écrire toute petite en minuscules, avec mes lunettes de lecture c'est pénible.
- Un bouton « appeler à l'aide » ou au moins une page « comment ça marche » écrite comme un mode d'emploi, avec des phrases complètes — pas des messages malins du genre « t'es difficile ce soir ».

> L'idée est bonne — c'est le carnet d'adresses des copains — mais telle quelle, sans ma fille assise à côté de moi, je n'arrive même pas à l'installer, et une fois dedans on me parle une langue que je ne comprends pas.


### touriste américain — 3.5/10

**Points forts**
- Le concept 'des locaux qui te passent les codes, aucun lieu ne paie' est EXACTEMENT ce que je cherche à Paris — je hais TripAdvisor.
- La DA carnet charbon/encre est superbe, ça fait objet parisien authentique, je la screenshoterais pour Instagram.

**Plus gros points faibles**
- Je ne peux littéralement pas l'utiliser : 100 % français, et pas du français scolaire — 'tranquilo', 'alloco', 'incognito', 'alcolo', 'ça dit quoi ce soir' : même Google Translate rend n'importe quoi. Zéro i18n dans le code.
- Tout repose sur un cercle de potes que je n'ai pas : je suis là 5 jours, je connais zéro Parisien. Le mode 'suivre des curateurs' existe mais rien ne me dit que c'est LE mode touriste.
- Invitation only à ~1000 membres + mur de connexion : je ne rentre même pas dans l'app. Et pas de réservation — après le swipe, je fais quoi, j'appelle en français ?

**Reco prioritaire** : Créer un mode invité "Visiting Paris?" en anglais : pas de cercle, direct sur les curateurs locaux, deck de 8 spots près de mon hôtel — c'est votre meilleur produit d'appel et il existe déjà à 80 % dans le pull/curateurs.

**Son chemin vers le 10/10**
- Un toggle EN complet (UI + tips traduits automatiquement avec l'original français gardé dessous — je VEUX voir la voix de Karim, mais je veux la comprendre), vérifiable : je fais tout l'onboarding sans dictionnaire.
- Un mode visiteur sans invitation ni cercle : à l'onboarding je dis 'I'm here for 5 days', l'app me branche d'office sur 3-4 curateurs du quartier de mon hôtel et le deck marche dès la première minute.
- Un glossaire intégré du lexique : tap sur 'incognito' ou 'apéro' → une ligne d'explication en anglais. Le lexique est votre charme, mais sans traduction c'est un mur.
- Un bouton d'action après le swipe : réserver (même un simple lien), ou au minimum une phrase toute faite en français à montrer au serveur ('une table pour un, s'il vous plaît') — le solo dining assumé, c'est génial pour moi, aidez-moi à le finir.
- Des infos pratiques touristes sur la fiche : cash ou carte, English spoken oui/non, dernière entrée — trois binaires dans votre propre système de critères, parfaitement dans l'esprit.

> This is exactly the app I dream of in Paris — real locals, no ads, no tourist traps — and it's locked behind a language, a friend circle, and an invite I'll never have; right now it's a 10/10 idea I can use 0% of.


## Ce qui converge — le plan vers le 10/10

1. **Le partage** (6 voix) : carte-image 9:16 style carnet partageable en story/DM + pages spot publiques sans mur de connexion.
2. **Le cercle jamais vide** (5 voix) : écran « suis 3 curateurs » à l'onboarding, avec de vrais visages nommés.
3. **Conclure la soirée** (4 voix) : horaires réels par jour + bouton appeler/réserver + mention « résa conseillée ».
4. **Le retour** (3 voix) : Web Push (iOS 16.4+) + guide d'installation + les 3 notifs du rituel (lundi, « alors ? », demandes).
5. **Le juridique** (1 voix, mais bloquante) : politique de confidentialité + CGU + floutage des visages avant l'ouverture publique.
6. **La mesure** (2 voix) : 6 événements d'analytics + attribution du lien d'invitation — sinon le lancement n'apprend rien.
7. **L'accessibilité** (1 voix) : boutons bof/validé sous le deck, contrastes, plancher 12px.
8. **Le mode groupe multi-téléphones** (4 voix) : le match par lien WhatsApp, swipable sans compte — LA killer feature réclamée.
