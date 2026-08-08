# NOTE DE COMITÉ D'INVESTISSEMENT — dossier « jeudi. »

**Date :** 6 août 2026
**Analyste :** due diligence senior, early-stage consumer
**Objet :** jeudi. — app parisienne de sorties (PWA), porteur unique
**Sources d'instruction :** dépôt `F:\ErsanMusa-com\Jeudi_App` (61 commits, 2026-06-14 → 2026-08-04), `CONCEPT.md`, `_lancement/STRATEGIE.md`, `_lancement/SEMAINE_FINALE.md`, `COMPTES.md`, `AUDIT_2026-07-02.md`, `AUDIT_COEUR_2026-08-01.md`, `PANEL_AUDIT_2026-07-30.md`, recherche marché externe (sourcée en annexe).

---

## NOTE LIMINAIRE — le mandat transmis est périmé

Le dossier soumis au comité décrit : *« concept validé sur le papier, aucune ligne de code, aucun test de demande »*, un *« curateur unique »*, un *« cercle cœur de 20 places »*, un *« plafond de ~150 membres »* et un *« coût de développement estimé : 2 soirées »*.

Aucune de ces cinq affirmations n'est vraie au 6 août 2026 :

| Affirmation du dossier | Constat d'instruction |
|---|---|
| Aucune ligne de code | **23 064 lignes** TS/TSX, 10 migrations SQL, 75 tests, PWA en production sur `jeudi-seven.vercel.app` |
| Curateur unique, membres consommateurs | **Pivot abandonné en juin 2026.** Chaque utilisateur est curateur, ajoute ses spots, ses photos, ses tips. Le brief « curateur unique » (`LA_CARTE_brief.md`) est mort. |
| 20 places / plafond 150 | Aucun plafond n'existe dans le code. L'accès est : compte Supabase + cercle par invitation. Le fond du carnet (302 spots) est en visibilité **publique** — servi à tout inscrit. |
| 2 soirées de développement | **~185 heures** sur 7,4 semaines (méthode §4), soit ~92× l'estimation. |
| Aucun test de demande réalisé | Exact, et c'est le seul point du dossier qui tient. **C'est aussi le cœur du problème.** |

Le comité n'instruit donc pas un projet à financer. Il instruit **un actif déjà construit, déjà payé, et jamais mis en face d'un utilisateur.** Le verdict porte sur la poursuite de l'allocation, pas sur un ticket d'entrée.

---

> **Lecteur pressé ou non-financier :** lis le verdict (§1), puis le lexique (§1 bis) qui traduit tout le jargon en français simple, puis saute directement aux critères de décision (§9). Le reste est la démonstration.

---

## 1. VERDICT ET THÈSE

# 🔴 NO-GO

**Sous le cadrage « entreprise », le dossier est refusé.** Il n'existe pas de marché adressable qui justifie l'investissement consenti : le nombre de personnes que jeudi. peut réellement servir dans 12 mois est de **20 à 60** (§2), alors qu'il faudrait **282 abonnés payants** pour seulement rembourser le temps passé (§4) — 19 fois plus que le plafond que le produit se donne à lui-même. Chaque nouvel utilisateur coûte plus cher à recruter qu'il ne rapportera jamais (§4).

*(Tout le vocabulaire de cette note est traduit en français simple juste en dessous, §1 bis. Aucun terme n'est utilisé sans être expliqué.)*

Mais le motif de refus n'est pas là. **Le motif de refus est un fait d'exécution.** Le porteur a écrit lui-même, en juillet, un plan de lancement daté, chiffré, avec garde-fou et trois seuils (`_lancement/STRATEGIE.md`). Ce plan était calé sur la finale de la Coupe du monde (~18-19 juillet 2026) — un pic de demande réel, gratuit, non reproductible avant quatre ans. **Le dépôt ne porte aucun commit entre le 12 et le 30 juillet, et les notes du 29-30 juillet listent encore le garde-fou « test à 2 comptes » comme non coché.** La fenêtre est passée sans être utilisée. Le 30 juillet, le porteur a repris le développement : i18n, match de groupe, carte de membre, pellicule photo, tirage du soir — 21 commits en dix jours.

**Thèse : ce dossier ne souffre pas d'un problème de produit. Il souffre du fait que construire y est devenu le substitut du lancement, pas sa préparation.** Un produit de plus ne corrigera pas ça. Le NO-GO est prononcé sur le comportement d'allocation, pas sur la qualité du code — laquelle est, par ailleurs, au-dessus de ce que le comité voit habituellement à ce stade.

**Ce qui inverserait le verdict (condition unique, §9) :** l'exécution intégrale du plan de lancement déjà écrit, sans une ligne de code supplémentaire, avant le **20 août 2026**, et l'atteinte des trois seuils au **10 septembre 2026**. Rien d'autre. Aucune feature, aucun redesign, aucun audit supplémentaire n'est recevable comme réponse à cette note.

---

## 1 bis. LE VOCABULAIRE DE CETTE NOTE, EN FRANÇAIS SIMPLE

Cette note est écrite dans le langage d'un comité d'investissement. Voici chaque terme traduit, avec **ce qu'il donne concrètement pour jeudi.** Aucun mot de la note n'est utilisé sans figurer ici.

### Les mots du verdict

| Terme | En français simple | Chez toi |
|---|---|---|
| **Due diligence** | L'enquête qu'on mène sur un projet avant d'y mettre de l'argent. On fouille, on vérifie, on cherche ce qui cloche. | C'est ce document. |
| **Comité d'investissement** | Le groupe de gens qui dit oui ou non au financement. Ils voient 100 dossiers, ils en acceptent 5. | Ton lecteur imaginaire : quelqu'un qui cherche activement une raison de refuser. |
| **GO / NO-GO** | On y va / on n'y va pas. | NO-GO. |
| **GO CONDITIONNEL** | On y va, mais seulement si telle condition précise est remplie à telle date. | Ce que tu peux encore obtenir : 10 invitations avant le 20 août. |
| **Early-stage consumer** | Un projet tout jeune, destiné au grand public (par opposition aux projets vendus aux entreprises). | jeudi. |
| **Le dossier / le porteur** | Le projet / la personne qui le porte. | jeudi. / toi. |

### Les mots du marché (§2)

| Terme | En français simple | Chez toi |
|---|---|---|
| **TAM** *(Total Addressable Market)* | Le marché **total**. Tout l'argent qui existe dans ce domaine si tu prenais 100 % de tout, ce qui n'arrive jamais. C'est le chiffre que les gens gonflent pour impressionner. | ~450 000 €/an à Paris (ce que les Parisiens paieraient pour des recos de sorties). |
| **SAM** *(Serviceable Available Market)* | Le marché que tu peux **réellement atteindre** avec tes moyens à toi : ta langue, ta ville, ton réseau, ton budget de pub (zéro). | ~270 personnes. Ton réseau + le réseau de ton réseau. |
| **SOM** *(Serviceable Obtainable Market)* | Ce que tu vas **vraiment obtenir** dans 12 mois. Le chiffre honnête. | **40 personnes.** C'est le chiffre le plus important de toute la note. |
| **Marché adressable** | Les gens que tu peux réellement toucher et convaincre. | 270 max, 40 en vrai. |

**Pourquoi ces trois-là et pas un seul ?** Parce que la triche classique consiste à montrer le TAM (« le marché de la restauration parisienne pèse des milliards ! ») pour justifier un projet qui ne touchera jamais que 40 personnes. La note refuse de faire ça : elle calcule les trois et ne retient que le troisième.

### Les mots de l'argent (§4)

| Terme | En français simple | Chez toi |
|---|---|---|
| **Économie unitaire** *(unit economics)* | Est-ce qu'**un seul** client te rapporte plus qu'il ne te coûte ? Si non, plus tu grandis, plus tu perds. | Non. Un utilisateur te coûte 37,50 € et t'en rapporte 30. |
| **ARPU** | Ce que te rapporte **un utilisateur moyen**, par mois. | 0,30 € par mois et par membre (dans le scénario abonnement). |
| **CAC** *(Coût d'Acquisition Client)* | Ce que ça te coûte de **gagner un utilisateur**. Attention : même sans payer de pub, ça coûte — en temps. | 37,50 € = 30 min de ton temps (message perso + répondre à ses questions) valorisées à ton tarif. |
| **LTV** *(Life Time Value)* | Ce qu'un utilisateur te rapporte **sur toute sa durée de vie**, avant de partir. | 30 € (3 €/mois pendant ~10 mois avant qu'il décroche). |
| **LTV / CAC** | Le rapport entre les deux. **Au-dessus de 3 = sain. En dessous de 1 = tu perds de l'argent à chaque nouveau client.** | **0,8.** Chaque personne que tu recrutes te coûte plus qu'elle ne rapporte. |
| **Churn** | Le taux de gens qui **partent** chaque mois. | ~10 %/mois, standard pour ce type d'app. |
| **Rétention J30** | Sur 100 personnes qui installent, combien sont encore là **30 jours après**. | La moyenne des apps sociales : **4 sur 100.** Sur 40 comptes, ça fait 1 à 8 personnes actives au bout d'un mois. |
| **Point mort** *(break-even)* | Le nombre de clients à partir duquel tu **arrêtes de perdre de l'argent**. | 282 abonnés payants. Tu vises 150 membres max. Le point mort est hors de ton propre design. |
| **Monétisation** | Comment le truc rapporte de l'argent. | Aucune définie. Trois scénarios testés, tous négatifs. |
| **Freemium / taux de conversion** | Gratuit pour tous, payant pour quelques-uns. Le taux de conversion = quel % accepte de payer. | Hypothèse généreuse : 10 %. |
| **B2B / affiliation** | Vendre aux entreprises (les restos) / toucher une commission quand quelqu'un réserve via toi. | Interdit par ton concept : « aucun lieu ne peut payer pour apparaître ». |

### Les mots de la concurrence (§3)

| Terme | En français simple | Chez toi |
|---|---|---|
| **Coût de substitution** | Ce que ça coûte à quelqu'un de **changer d'habitude** pour venir chez toi. Plus c'est cher, moins il vient. | Ton vrai concurrent est le message WhatsApp : 20 secondes, zéro install. Très dur à battre. |
| **Concurrent comportemental** | Pas une app rivale : **le geste** que les gens font déjà à la place. | « Tu connais un bar sympa ? » envoyé sur WhatsApp. |
| **Barrière à l'entrée / barrière technique** | Ce qui empêche un concurrent de te copier. Si n'importe qui peut refaire ton truc en un week-end, tu n'as pas de barrière. | Aucune. Un dev copie « on dit où. » en deux jours. |
| **Base installée** | Les utilisateurs qu'un concurrent a **déjà**, et que tu devras lui arracher. | Mapstr : 4 millions. Toi : 1. |
| **Benchmark** | Un point de comparaison chiffré, pris dans le vrai monde. | Les rétentions, les coûts de pub, les tarifs TheFork cités dans la note. |

### Les mots de la décision (§5, §6, §9)

| Terme | En français simple | Chez toi |
|---|---|---|
| **Red team** | On demande à quelqu'un de **démolir le projet exprès**, sans nuance, pour voir ce qui résiste. | §6a. Puis on lui répond en §6b. |
| **Signal précurseur** | Le petit truc observable qui prévient qu'un risque est en train d'arriver, **avant** la catastrophe. | Ex. : « le rituel du jeudi sauté 2 semaines de suite » annonce que le rythme ne tiendra pas. |
| **Kill criteria** | Les conditions **écrites à l'avance** qui déclenchent l'arrêt du projet, sans discussion et sans se mentir le jour venu. | §9.2. Six conditions, toutes datées. |
| **Jalon** *(milestone)* | Un rendez-vous daté avec **un seul chiffre** à atteindre. | 3 mois, 6 mois, 12 mois. Une métrique chacun, pas dix. |
| **Métrique** | Le chiffre qu'on regarde pour savoir si ça marche. | La note en refuse la plupart (téléchargements, sessions…) : trop faciles à s'auto-flatter. |
| **Coût d'opportunité** | Ce que tu **perds ailleurs** pendant que tu fais ça. Ce n'est pas de l'argent dépensé, c'est de l'argent (ou une carrière) pas gagné. | 25 h/semaine à 600 €/jour = ~97 500 € sur un an de temps immobilisé. |
| **TJM** | Taux Journalier Moyen : ce que vaut **une journée** de ton travail sur le marché. | 600 €/jour retenu (borne basse pour un CG/VFX sup senior à Paris). |
| **Valorisé au taux horaire** | On met un prix sur ton temps même si personne ne te l'a facturé. **Ton temps n'est pas gratuit.** | 185 h de travail = ~13 900 € déjà dépensés, même si aucun euro n'est sorti de ton compte. |
| **Boucle de rétroaction** | Le circuit par lequel la réalité te dit si tu as raison. | Les tiennes sont toutes **internes** (tes audits, tes panels). Aucune ne passe par un utilisateur. C'est le diagnostic central. |
| **Requalification de l'actif** | Décider **ce que c'est vraiment** : une boîte, un objet de marque personnelle, ou un hobby. Le verdict change du tout au tout selon la réponse. | §7 : objet de marque personnelle. |
| **Zones d'ombre** | Ce qu'on ne sait pas et qu'on refuse d'inventer. | §10. 8 trous, dont un majeur : personne n'a jamais dit qu'il voulait cette app. |
| **HYPOTHÈSE NON VÉRIFIÉE** | Un chiffre que j'ai **estimé**, pas mesuré. Signalé partout où c'est le cas pour que tu puisses le contester. | Ton temps passé, ton TJM, les taux de conversion. |

### Un mot sur « investissement »

Personne ne te propose d'argent et tu n'en demandes à personne. Le cadre du comité d'investissement est un **outil de lucidité**, pas une opération financière : il force à regarder ton temps comme un capital qu'on dépense, et à te demander si un inconnu, sans aucune affection pour ce projet, remettrait 25 heures par semaine dedans. La réponse est non. **À toi de décider si tu la suis — c'est ton temps, pas le sien.**

---

## 2. MARCHÉ

Méthode : on distingue le marché de la valeur d'intermédiation (ce que quelqu'un paie réellement pour orienter un dîner) du marché de la dépense en restauration (qui ne revient jamais à l'app). Le second n'est pas retenu — c'est le chiffre qu'on gonfle habituellement pour justifier le premier.

### TAM — Paris, valeur d'intermédiation captable

**Côté offre (les lieux paient) :** Paris intra-muros compte **15 202 établissements cafés-restaurants** (2 010 cafés, 9 483 restaurants traditionnels, 3 709 restauration rapide). La valeur d'intermédiation observable est celle de TheFork : abonnement 99 à 2 109 €/mois + commission 2 à 4 €/couvert.
Hypothèse : 3 000 établissements parisiens réellement « intermédiables » × 1 200 €/an de valeur moyenne captée — **HYPOTHÈSE NON VÉRIFIÉE** → **TAM offre ≈ 3,6 M€/an**.
**Ce TAM est structurellement inaccessible à jeudi. :** le concept interdit explicitement qu'un lieu paie (« aucun lieu ne peut payer pour apparaître », `CONCEPT.md` l.216). Le porteur s'est exclu du seul marché solvable de son secteur. C'est un choix cohérent, et il doit être compté comme tel — pas comme une opportunité différée.

**Côté demande (l'utilisateur paie) :** 2 087 600 habitants à Paris début 2025. Cible « sort régulièrement, 25-44 ans » : 30 % — **HYPOTHÈSE NON VÉRIFIÉE** → 626 000. Disposition à payer pour une reco (calée sur le marché des guides/newsletters payants) : 2 % — **HYPOTHÈSE NON VÉRIFIÉE** → 12 500 payants × 36 €/an → **TAM demande ≈ 450 k€/an sur Paris.**

**TAM retenu : 450 k€/an.** C'est un marché de niche, pas un marché d'app. Un TAM de cette taille ne finance ni une équipe, ni une acquisition payante, ni un investisseur.

### SAM — adressable par une app de cercle, sans budget d'acquisition

La croissance est par invitation depuis un réseau personnel. Le SAM n'est donc pas démographique, il est social.
1er degré : ~800 contacts professionnels (industrie audiovisuelle, réseau dense) — **HYPOTHÈSE NON VÉRIFIÉE** ; part parisienne sortant régulièrement 15 % → **120**.
2e degré : ~3 000 atteignables, conversion 5 % — **HYPOTHÈSE NON VÉRIFIÉE** → **150**.
**SAM ≈ 270 personnes.**

### SOM — 12 mois, un porteur, zéro budget, zéro utilisateur acquis à date

Taux de conversion invitation → compte créé : le porteur vise 70 % dans son propre plan. Aucun canal payant. Aucune viralité produit démontrée (le seul mécanisme viral réel est le lien WhatsApp du match de groupe, jamais utilisé hors du poste du développeur).
**SOM 12 mois : 20 à 60 comptes actifs. Revenu associé, tous scénarios confondus : 0 à 1 000 €/an.**

**Le chiffre à retenir par le comité : 40.** C'est l'ordre de grandeur du nombre d'humains que ce produit servira dans douze mois si tout se passe bien. Aucun modèle économique ne survit à 40.

---

## 3. CARTOGRAPHIE CONCURRENTIELLE

### Concurrents directs

| Acteur | Position | Force | Ce que ça implique pour jeudi. |
|---|---|---|---|
| **Mapstr** (FR) | « Carnet d'adresses de mes amis », **>4 M utilisateurs**, 90 pays, >100 M lieux, 2,21 M€ levés (2015, 2022) | Base installée française, gratuit, même promesse | **Concurrent frontal, français, dix ans d'avance.** jeudi. = Mapstr sans les utilisateurs. Toute la différenciation doit tenir dans ce que Mapstr ne fait pas. |
| **Beli** (US) | Classement social ludique, **2,5 M téléchargements**, 12 M$ levés, 46 salariés, 75 M avis/30 000 villes | Boucle de gamification qui marche, capital | Absent de France = fenêtre réelle. Mais une fenêtre qu'un porteur seul sans budget ne peut pas tenir contre une Série A qui décide de traverser l'Atlantique. |
| **Google Maps** | Listes, horaires, itinéraire, avis | Déjà installé, ouvert 20×/semaine | Le juge de paix du porteur lui-même : *« Ersan l'utiliserait-il à la place de Google Maps demain ? »* Question jamais soumise à quelqu'un d'autre que lui. |
| **TheFork** | Réservation, 2-4 €/couvert | Distribution | Complémentaire, pas concurrent. C'est aussi le seul revenu possible (§4C) et il est marginal. |
| **Le Fooding** | Autorité éditoriale gratuite, depuis 2002 | Marque | jeudi. n'a pas d'autorité éditoriale et a renoncé à en construire une en abandonnant le curateur unique. |
| **Newsletters locales payantes** | Marché en croissance ~30 %/an, ~36 €/an | Coût de production faible | **C'est le vrai comparable du modèle B.** Et il ne nécessite pas 23 000 lignes de code. |

### Le concurrent comportemental réel : le message WhatsApp

C'est le seul benchmark qui compte. Coût de substitution pour l'utilisateur : **20 secondes d'écriture, zéro install, zéro compte, réponse personnalisée.**

| Module de jeudi. | Bat-il le message ? | Verdict |
|---|---|---|
| Deck solo « ça dit quoi ce soir ? » | **Non.** Il faut ouvrir l'app, se souvenir qu'elle existe, swiper. Le message arrive tout seul et répond exactement à la question posée. | Rejeté |
| Carnet perso / carte / index (302 spots) | **Non.** Google Maps le fait, avec les horaires et l'itinéraire. | Rejeté |
| Recherche | **Non.** Google le fait mieux et sans intention à formuler. | Rejeté |
| **Match de groupe « on dit où. »** | **Oui.** Un fil WhatsApp à 6 pour choisir un bar produit 40 messages et aucune décision. jeudi. agrège des réactions en un tap, ne montre jamais les noms, tranche par un verdict déterministe, et **fonctionne sans compte pour les invités** (lien `/sortie/<token>`). Modèle Doodle. | **Retenu — seul actif défendable du dossier** |

**Conclusion de section, à charge :** le porteur a passé sept semaines à construire six modules dont un seul bat le substitut. Et ce module-là — le seul — est arrivé le 1er août, après la fenêtre de lancement manquée, et n'a jamais été utilisé par un groupe réel.

**Corollaire stratégique :** si ce dossier devait vivre, il devrait s'appeler « on dit où. », être un lien WhatsApp sans app, et tout le reste devrait être jeté. Le comité note que cette conclusion est déjà présente en creux dans les documents du porteur (« la porte principale », `AUDIT_COEUR_2026-08-01.md`) sans jamais avoir été tirée jusqu'à sa conséquence : la suppression du reste.

---

## 4. ÉCONOMIE UNITAIRE

### Base de coût — méthode explicitée

**Temps investi.** 61 commits sur **14 journées de commits distinctes**, du 14/06 au 04/08/2026 (52 jours calendaires). Pics horaires observés : 13 h, 23 h, 21 h, 14 h, 11 h, 02 h → sessions longues débordant sur la nuit. Volume produit hors code : `CONCEPT.md` (18 320 c.) + PDF + version print, 4 rapports d'audit (dont un de 72 858 c.), ~40 sauvegardes datées, 10 migrations SQL.
Estimation : 14 j × 8 h + 40 % de conception/design/documentation hors commit ≈ **185 h** (fourchette 150-220 h) — **HYPOTHÈSE NON VÉRIFIÉE**.

**Taux horaire du porteur.** TJM médian freelance confirmé France 2026 : 450 €. Senior/expert : >800 €/j. Freelance 3D : 350-600 €. Paris : +8-10 %. Retenu pour un CG/VFX supervisor senior : **600 €/j HT = 75 €/h** (borne basse volontaire).

**Coût déjà encouru : 185 h × 75 € ≈ 13 900 €** (+ ~116 $ de coût d'agent sur la seule session fondatrice, total non tracé).

**Coût éditorial récurrent.** Règle de la maison, écrite par le porteur : photos personnelles obligatoires, tip utile, repérage physique. Son propre plan chiffre 10-15 bars documentés = « 2 soirées de repérage » → **~24 min par spot documenté**. Maintien d'un carnet vivant : 4 spots/semaine (1,6 h) + rituel hebdomadaire et animation du cercle (1 h) = **2,6 h/semaine × 75 € = 195 €/semaine = 10 140 €/an**.

### Les trois scénarios (base : SOM 40 membres)

| | **A. Gratuit** | **B. Abonnement membre** | **C. B2B / affiliation** |
|---|---|---|---|
| ARPU | 0 € | 3 €/mois sur 10 % de conv. = **0,30 €/membre/mois** | 0,50 €/membre/mois |
| Revenu annuel à 40 membres | **0 €** | **144 €** | **240 €** |
| Coût éditorial valorisé | 10 140 € | 10 140 € | 10 140 € |
| Infra | 0-300 €/an (Supabase Free → Pro 25 $/mois) | idem | idem |
| CAC (vente 1-à-1 : 30 min message perso + support) | 37,50 € | 37,50 € | 37,50 € |
| Churn mensuel (benchmark social) | n/a | 10 % → durée de vie ~10 mois | 10 % |
| LTV | 0 € | **30 €** | 50 € |
| **LTV/CAC** | **0** | **0,8** | **1,3** |
| Point mort | jamais | **282 abonnés payants** = ~2 800 membres | ~1 700 réservations/mois |
| **Résultat annuel** | **−10 140 €** | **−10 000 €** | **−9 900 €** |

**Notes de méthode et bornes.**
- Prix de 3 €/mois : calé sur le marché des newsletters payantes (~36 €/an) — **HYPOTHÈSE NON VÉRIFIÉE**, jamais testée auprès d'un seul utilisateur.
- Taux de conversion freemium 10 % : borne haute optimiste pour du consumer — **HYPOTHÈSE NON VÉRIFIÉE**.
- Scénario C : la commission d'apport de réservation est estimée à 2 €/couvert par analogie avec la grille TheFork (2-4 €). **Le concept interdit qu'un lieu paie**, donc seul l'apport indirect est admissible ; aucun programme d'affiliation restauration à Paris n'a été confirmé comme ouvert à un éditeur de 40 utilisateurs — **HYPOTHÈSE NON VÉRIFIÉE**.
- Rétention : les apps sociales tombent à **~3,9 % de rétention J30** en médiane (top 15-20 %). À 40 comptes, cela signifie **1 à 8 utilisateurs actifs à un mois.**
- CAC organique paraît nul ; il ne l'est pas. Chaque invitation coûte un message personnel + du support par un humain unique. C'est le coût le plus sous-estimé du dossier.

### Conclusion de section — revenu ou coût ?

**C'est un coût. Sans ambiguïté et sous les trois scénarios : entre 9 900 € et 10 140 € par an en temps valorisé, après 13 900 € déjà engagés.** L'objectif affiché dans le concept (2 000 €/mois) suppose ~670 abonnés payants, soit ~6 700 membres : **167 fois le SOM**. L'écart n'est pas un problème d'exécution commerciale, c'est une incompatibilité entre l'objectif de revenu et le design du produit. Le comité considère que le porteur doit renoncer à l'un des deux, explicitement, par écrit.

---

## 5. REGISTRE DES RISQUES

| # | Risque | Prob. | Impact | Signal précurseur observable | Mitigation |
|---|---|---|---|---|---|
| R1 | **Le build remplace le lancement** (risque réalisé) | **Réalisée** | **Critique** | *Déjà survenu* : fenêtre finale 18-19/07 non utilisée, 21 commits dans les 10 jours suivants. Signal futur : tout commit de feature avant le 1er utilisateur externe. | Gel du développement. Aucune exception. Un commit = déclenchement du kill criterion K1. |
| R2 | Point de défaillance unique (porteur = dev + curateur + support + éditeur) | Élevée | Critique | Délai de réponse à un bug utilisateur > 24 h ; une semaine sans spot ajouté | Impossible à mitiger à cette échelle. À accepter comme plafond structurel, pas à corriger. |
| R3 | **Rythme éditorial hebdomadaire non soutenable** | Élevée | Élevé | Le rituel « spot du jeudi » sauté 2 semaines de suite ; ratio spots ajoutés par d'autres / par le porteur < 0,2 | Réduire à bimensuel dès le départ. Ne jamais promettre un rythme qu'un seul humain porte. |
| R4 | Absence de modèle → tentation d'ouvrir pour monétiser | Moyenne | Élevé | Apparition dans les docs de « ouvrir à tous », « SEO », « landing publique », ou d'un lieu partenaire | Écrire maintenant, avant tout utilisateur, la règle : *l'app ne sera jamais ouverte pour des raisons économiques.* Sinon elle le sera. |
| R5 | **Plafond de croissance imposé par le design** | Certaine | Élevé | *Déjà structurel* : invitation-only + carnet à alimenter à la main | Non mitigeable. C'est une décision, pas un risque. Elle doit être assumée comme telle en §7. |
| R6 | RGPD / responsabilité éditoriale (photos de lieux, données de sortie, géoloc, mineurs) | Moyenne | Moyen | Un membre demande l'effacement ; une photo montre un visage identifiable ; un lieu conteste un tip | Base UE (Irlande) ✅, `supprimer_mon_compte()` ✅, export ✅, bucket privé ✅, naissance masquée ✅. **Manque : politique de confidentialité publiée** (identifiée P0 le 30/07, non faite). Bloquant avant tout envoi de lien. |
| R7 | Dérive vers un réseau social générique | Moyenne | Élevé | Apparition de : messagerie, notifications sociales, compteurs d'abonnés, notes | Le concept l'interdit déjà. Le risque est le glissement lent (ex. « recherche d'amis façon Instagram », livrée le 29/07). À surveiller. |
| R8 | Marque : « Thursday » (dating, UK) et disponibilité `jeudi.app` | Moyenne | Moyen | Aucune vérification INPI/domaine consignée depuis juin | 1 h de vérification. Non faite depuis 8 semaines. |
| R9 | Le seul module défendable (« on dit où. ») est copiable en un week-end | Élevée | Moyen | Un concurrent français sort un partage de vote de sortie | Aucune barrière technique. La seule barrière est le cercle — donc l'exécution, donc §9. |

**Lecture du registre :** R1 et R5 ne sont pas des risques, ce sont des faits. Un registre où deux lignes sur neuf sont déjà réalisées ou structurelles n'est pas un registre de risques, c'est un constat.

---

## 6. RED TEAM

### 6a. La note à charge (analyste recommandant le NO-GO ferme)

> Ce dossier est un objet d'auto-satisfaction technique déguisé en produit.
>
> Sept semaines, 23 000 lignes, dix migrations, quatre rapports d'audit internes — dont un de 73 000 caractères commandé à un panel de vingt-trois évaluateurs fictifs. **Zéro utilisateur.** Le porteur a produit plus de documentation d'audit sur son propre produit qu'il n'a envoyé de messages à des humains susceptibles de l'utiliser. C'est la signature d'un projet dont la fonction réelle est de fournir du travail agréable, pas de servir quelqu'un.
>
> La preuve est datée. Le porteur a lui-même identifié la finale de la Coupe du monde comme sa fenêtre de lancement. Il a écrit un plan de trois pages, avec un garde-fou en quatre points, une timeline J-4 → J+3, des messages WhatsApp pré-rédigés et trois métriques chiffrées. Tout était prêt sauf une chose : envoyer les messages. Le 12 juillet, il commite. Du 13 au 29 juillet — la fenêtre — **rien**. Le 30 juillet, il recommence à coder : traductions anglaises pour une app à zéro utilisateur français, carte de membre à poster sur Instagram, pellicule photo, tirage du soir. Ce ne sont pas des priorités de lancement. Ce sont des refuges.
>
> Sur le fond, le produit est indéfendable. Il se bat contre Mapstr, français, quatre millions d'utilisateurs, gratuit, dix ans d'antériorité, avec exactement la même promesse. Il se bat contre Google Maps, ouvert vingt fois par semaine. Il se bat surtout contre le message WhatsApp, qui coûte vingt secondes et zéro friction — et cinq de ses six modules perdent ce combat.
>
> L'économie est un mur : marché adressable de deux cent soixante-dix personnes, cible réaliste de quarante, point mort à deux cent quatre-vingt-deux abonnés payants. Le produit s'interdit lui-même le seul revenu solvable de son secteur — l'argent des lieux — au nom de la pureté éditoriale. Une décision honorable qui a un nom en comité : ce n'est pas une entreprise.
>
> Enfin, la trajectoire de coût est la vraie alerte. Quatorze mille euros de temps déjà consommés, dix mille par an de production éditoriale à venir, vingt-cinq heures par semaine immobilisées — chez un professionnel dont l'heure se vend six cents euros la journée dans un secteur où son expertise est rare et le marché B2B identifié. **Ce projet ne coûte pas de l'argent. Il coûte une carrière-année.**
>
> Recommandation : arrêt. Pas de mise en veille, pas de « petite version », pas de vague deux. Archivage du dépôt, et réallocation immédiate.

### 6b. Réponse à la red team

Trois points de la note à charge tiennent. Deux ne tiennent pas.

**Tient — la fenêtre manquée.** C'est le fait le plus lourd du dossier et aucune circonstance ne l'atténue. Un pic de demande gratuit, daté, non reproductible avant 2030, préparé par écrit, non utilisé. Le comité le retient comme motif principal.

**Tient — l'économie.** Aucun scénario ne produit de revenu. La red team a raison de dire que ce n'est pas une entreprise. C'est précisément la conclusion de §7.

**Tient — le coût d'opportunité.** Vingt-cinq heures par semaine chez un profil rare est l'engagement le plus coûteux du dossier, et il n'est pas comptabilisé par le porteur.

**Ne tient pas — « auto-satisfaction technique ».** L'accusation est injuste sur les faits. Le porteur a réalisé quatre audits critiques de son propre travail, tué ses faux profils (« le fond du carnet doit être réel », 01/08), rejeté ses propres idées quand elles rétrogradaient le produit (hub à deux cartes, fourche chips), refusé la messagerie, refusé les notes, refusé la pub, et corrigé un bloquant de sécurité de son verdict de match. Ce n'est pas le comportement de quelqu'un qui se fait plaisir : c'est le comportement de quelqu'un qui a de vrais standards produit et **aucun mécanisme de contact avec la demande**. Le diagnostic n'est pas la complaisance, c'est l'asymétrie : toutes les boucles de rétroaction sont internes.

**Ne tient pas — « archivage immédiat ».** L'actif existe, il est déployé, il est propre (strict TypeScript, RLS, 75 tests, RGPD à 90 %), et il contient un module — le match de groupe — dont l'utilité dépasse le substitut WhatsApp. Détruire cela sans l'avoir mis une seule fois devant six humains est une erreur symétrique de celle qu'on reproche au porteur : décider sans donnée. Le coût du test est de **zéro euro et environ trois heures**. Aucun comité ne refuse un test à trois heures sur un actif à quatorze mille euros.

**Position du comité :** la red team a raison sur le verdict d'investissement, tort sur la conduite à tenir. On ne finance pas, on ne développe plus, **et on exécute le test qui est déjà écrit.**

---

## 7. REQUALIFICATION DE L'ACTIF

**Réponse : (b) actif de marque personnelle.** Ce n'est ni une entreprise, ni un loisir, et le porteur n'a pas le droit d'osciller.

**Pourquoi pas (a) une entreprise.** Une entreprise a un marché qui grandit quand le produit s'améliore. Ici, le produit s'interdit la croissance par construction (invitation, carnet à la main, plafond social), s'interdit le seul revenu solvable (les lieux ne paient jamais, `CONCEPT.md` l.216), et affiche un point mort dix-neuf fois supérieur à sa taille cible. Ce ne sont pas des lacunes à combler : ce sont des choix, et ils sont bons — pour un objet de marque. Ils sont disqualifiants pour une entreprise.

**Pourquoi pas (c) un loisir.** Un loisir ne produit pas dix migrations SQL, une conformité RGPD, une architecture multi-tenant avec RLS et un plan de lancement à trois métriques. Un loisir ne coûte pas vingt-cinq heures par semaine à un professionnel dont l'heure a un prix de marché. L'intensité, la rigueur et le coût d'opportunité engagés interdisent ce cadrage : appeler ça un loisir serait la façon de continuer sans jamais rendre de comptes.

**Ce que « actif de marque personnelle » signifie, opérationnellement.** jeudi. est une **pièce de portfolio à haute valeur démonstrative** pour un professionnel de l'image qui veut prouver qu'il conçoit et livre des produits complets — direction artistique originale (le carnet de nuit), langage produit tenu, architecture sécurisée, décisions tranchées et documentées. À ce titre, il vaut probablement plus que sa valeur commerciale : c'est un objet montrable, pas un objet vendable.

**Trois règles qui découlent du cadrage, et qui ferment l'oscillation :**
1. **Aucun objectif de revenu.** Les « 2 000 €/mois » sortent du dossier aujourd'hui. Un actif de marque ne se justifie pas par un chiffre d'affaires qu'il n'atteindra jamais.
2. **Budget-temps plafonné et déclaré**, comme n'importe quelle ligne de dépense (§8). Le cadrage (b) autorise la dépense, il n'autorise pas la dépense illimitée.
3. **Le succès se mesure en preuve d'usage, pas en features.** Un actif de marque avec zéro utilisateur ne démontre pas qu'on sait livrer un produit : il démontre qu'on sait le construire. Ce n'est pas la même compétence, et le marché du travail connaît la différence.

Le comité note que le porteur a jusqu'ici bénéficié des trois cadrages simultanément : l'ambition de (a) pour justifier l'effort, la liberté de (c) pour ne pas rendre de comptes, la fierté de (b) pour la satisfaction. **Cette position est fermée à compter de cette note.**

---

## 8. COÛT D'OPPORTUNITÉ

**Temps immobilisé, méthode :** 185 h sur 7,4 semaines = **25 h/semaine** — **HYPOTHÈSE NON VÉRIFIÉE**, dérivée de la cadence de commits et du volume documentaire. À rythme constant sur 12 mois : **1 300 h = 162 jours-homme.**

| Allocation | Valeur 12 mois | Barrière technique | Marché |
|---|---|---|---|
| **jeudi. au rythme actuel** | **−97 500 €** (162 j × 600 €) + 10 140 € d'éditorial | Nulle (un dev copie « on dit où. » en un week-end) | 40 personnes |
| Facturation directe (missions CG/VFX sup) | +97 500 € bruts, sans risque | — | Existant, connu, réseau en place |
| **Outil B2B sur le domaine du porteur** (pipeline VFX, review/versionning, automatisation Blender/USD) | 0 € an 1, mais actif capitalisable | **Élevée** — exige 15 ans de métier, ce que personne ne peut sous-traiter | Studios : marché B2B identifié, budgets réels, cycles longs mais tickets à 4-5 chiffres |
| jeudi. plafonné à 3 h/semaine (cadrage §7) | −11 700 € | Nulle | 40 personnes |

**Lecture :** l'écart entre l'allocation actuelle et un projet B2B sur son domaine n'est pas un écart de revenu à 12 mois — les deux valent zéro la première année. **C'est un écart de barrière à l'entrée.** jeudi. n'oppose aucune barrière à un concurrent ; un outil de pipeline VFX oppose quinze ans de métier que personne ne peut acheter. Le porteur consacre 25 h/semaine à un domaine où son expertise ne vaut rien (recommandation locale, où il est un amateur face à Mapstr) plutôt qu'au seul domaine où elle est rare.

**C'est le point le plus coûteux du dossier, et il ne figure nulle part dans les documents du porteur.**

---

## 9. CRITÈRES DE DÉCISION

### 9.1 Le test de validation à coût nul — à exécuter AVANT toute ligne de code

**Il est déjà écrit.** `_lancement/STRATEGIE.md` + `_lancement/MESSAGES.md` + `_lancement/SEMAINE_FINALE.md`. Aucune rédaction supplémentaire n'est nécessaire ni autorisée. Coût : **0 € et ~3 h** (garde-fou + envoi des messages).

**Préalables bloquants (≤ 2 h, les seuls travaux techniques autorisés) :**
- [ ] Test à 2 comptes (invitation → cercle → photo → visibilité → suppression) — inscrit au garde-fou depuis juillet, jamais fait
- [ ] Politique de confidentialité publiée (P0 identifié le 30/07, non fait) — bloquant juridique
- [ ] Vérification INPI + `jeudi.app` + risque « Thursday » (1 h, ouvert depuis 8 semaines)

**Exécution — 10 invitations personnelles WhatsApp, une par une, avant le 20 août 2026.**

**Seuils de réussite, mesurés au 10 septembre 2026 (J+21) :**

| # | Métrique | Seuil | Ce que l'échec prouve |
|---|---|---|---|
| S1 | Comptes créés / invitations envoyées | **≥ 7 / 10 (70 %)** | Le pitch ou l'onboarding ne passe pas — chez des amis proches, donc a fortiori partout |
| S2 | Membres ayant ajouté ≥ 1 spot sous 7 jours | **≥ 5 / 10** | L'app est consultée, pas habitée. Le carnet ne devient jamais collectif → jeudi. reste le carnet d'un seul homme |
| S3 | Membres ayant voté dans un « on dit où. » lancé par quelqu'un d'autre que le porteur | **≥ 3** | Le seul module qui bat WhatsApp ne bat pas WhatsApp en conditions réelles → il n'y a plus d'actif |
| S4 (qualitatif, non substituable) | Au moins **une boucle complète** : invité → sorti → validé dans l'app | **1** | Aucune preuve d'usage. Douze mois de plus n'en produiront pas davantage |

**Règle de lecture, non négociable :** 4 seuils sur 4 → réexamen en GO CONDITIONNEL. 3 sur 4 → une seconde vague de 10 invitations, zéro développement. **≤ 2 sur 4 → NO-GO définitif, cadrage (b) plafonné (§9.2).**

### 9.2 Kill criteria — observables, datés, sans discussion

| ID | Condition | Date butoir | Conséquence, automatique |
|---|---|---|---|
| **K1** | Un seul commit de **feature** avant l'envoi des 10 invitations | à tout moment | Arrêt du cadrage (a). Confirmation que R1 est structurel et non circonstanciel. |
| **K2** | Les 10 invitations ne sont pas envoyées | **20 août 2026** | Arrêt. Deux fenêtres manquées sur deux = le lancement n'aura pas lieu. |
| **K3** | < 7 comptes créés | **10 septembre 2026** | Fin du cadrage entreprise. Passage définitif en (b) plafonné à 3 h/semaine. |
| **K4** | < 5 utilisateurs actifs hebdomadaires hors porteur | **6 novembre 2026** | Gel du produit. Aucun développement, aucune vague 2. Le dépôt reste en ligne comme portfolio. |
| **K5** | 0 € de revenu **et** < 15 actifs hebdo | **6 février 2027** | Archivage. Le portfolio est constitué ; l'actif a rendu ce qu'il pouvait rendre. |
| **K6** | Le rituel hebdomadaire est sauté 3 semaines consécutives | glissant | Le rythme éditorial n'est pas soutenable (R3) → réduction à bimensuel, sans négociation. |

### 9.3 Jalons — une seule métrique par jalon

| Jalon | Date | **Métrique unique** | Cible |
|---|---|---|---|
| **M3** | 6 novembre 2026 | Nombre d'humains ayant complété **une boucle entière** (invité → sorti → validé dans l'app) | **≥ 5** |
| **M6** | 6 février 2027 | Utilisateurs actifs hebdomadaires **hors porteur** | **≥ 15** |
| **M12** | 6 août 2027 | Matchs « on dit où. » lancés par quelqu'un d'autre que le porteur, par mois | **≥ 20/mois** |

Aucune autre métrique n'est acceptée en comité : ni comptes créés, ni spots, ni sessions, ni commits, ni features livrées.

---

## 10. ZONES D'OMBRE

Ce qui manque pour conclure définitivement. Le comité refuse de combler ces trous par du générique.

1. **Le lancement de juillet a-t-il eu lieu, même partiellement ?** L'absence de commits du 13 au 29/07 et le garde-fou encore non coché au 29/07 rendent la non-exécution très probable, mais l'instruction repose sur le dépôt, pas sur les messages WhatsApp du porteur. **Une réponse par oui ou non suffit à valider ou invalider la thèse centrale de cette note.**
2. **Combien de lignes dans la table `profils` de Supabase ?** Aucun accès au dashboard pendant l'instruction. Un seul compte est documenté (`ersan.musa@gmail.com`). Si ce chiffre est > 5, tout §2 et §4 doit être recalculé.
3. **Contenu de la table `evenements`.** Le module `analytique.ts` (6 événements, best-effort) est déployé depuis la migration 0004. Personne ne l'a jamais lu. **C'est la seule donnée d'usage réelle qui existe, et elle n'a jamais été consultée.**
4. **Temps réellement investi.** Estimé à 185 h par inférence sur les commits. Le porteur est le seul à pouvoir donner le chiffre vrai — il conditionne §4 et §8 en entier.
5. **Coût cumulé des agents.** Une seule session est documentée à ~116 $. Le total sur 7 semaines est inconnu et n'apparaît dans aucun document. À ce volume de production, il n'est pas négligeable.
6. **TJM réel du porteur et taux d'occupation.** 600 €/j est une borne basse de marché. Si le porteur est à taux plein sur ses missions, le coût d'opportunité de §8 est réel ; s'il est en intercontrat, il est théorique. **Cette seule variable fait varier le verdict de §8 de 97 500 € à 0 €.**
7. **Disponibilité juridique de la marque.** INPI, `jeudi.app`, antériorité « Thursday » (dating, UK). Ouvert depuis le 11 juin, jamais tranché.
8. **Existe-t-il cinq personnes qui ont demandé cette app ?** Aucun document du dépôt ne contient un verbatim d'un utilisateur potentiel. L'étape zéro du concept — *« pitcher oralement à 5-10 personnes »* — était inscrite au 11 juin. Rien n'atteste qu'elle ait été faite. **C'est la zone d'ombre la plus lourde : elle porte sur l'existence de la demande, huit semaines après l'avoir identifiée comme préalable à tout.**

---

## SYNTHÈSE POUR LE COMITÉ

| | |
|---|---|
| **Verdict** | **NO-GO** (cadrage entreprise) |
| **Requalification** | Actif de marque personnelle, plafonné à 3 h/semaine |
| **Investi à date** | ~13 900 € en temps valorisé, 0 utilisateur |
| **SOM 12 mois** | 40 comptes |
| **Point mort** | 282 abonnés payants (19× le plafond de design) |
| **LTV/CAC** | 0,8 |
| **Actif défendable** | Un seul : le match de groupe « on dit où. » |
| **Condition d'inversion** | 10 invitations envoyées avant le **20/08/2026**, 4 seuils sur 4 au **10/09/2026** |
| **Prochaine action autorisée** | Garde-fou (2 h), puis envoyer 10 messages. **Rien d'autre.** |

---

## ANNEXE — SOURCES EXTERNES

- Beli — profil, financement, traction : [PitchBook](https://pitchbook.com/profiles/company/509955-85), [Crunchbase](https://www.crunchbase.com/organization/beli), [Wikipedia](https://en.wikipedia.org/wiki/Beli_(app)), [Taste Cooking](https://tastecooking.com/beli-invites-the-loneliest-generation-to-dine-out/)
- Mapstr — utilisateurs et levées : [Maddyness](https://www.maddyness.com/2015/08/21/mapstr-800-000-euros/), [Usine Digitale](https://www.usine-digitale.fr/article/mapstr-leve-690-000-euros-pour-developper-son-carnet-d-adresse-egoiste.N346561), [Services Mobiles](https://www.servicesmobiles.fr/lhistoire-de-mapstr-le-reseau-social-qui-encourage-les-gens-a-explorer-le-monde-reel-qui-les-entoure-82540)
- Restauration parisienne : [Foody Paris — chiffres clés 2026](https://www.foodyparis.com/blog/statistiques-restauration-paris-chiffres-cles-2026), [CCI Paris IDF](https://www.cci-paris-idf.fr/sites/default/files/2023-02/enjeux-241.pdf), [INSEE — fiche secteur 561](https://www.insee.fr/fr/statistiques/7763790)
- Démographie Paris : [INSEE — dossier département 75](https://www.insee.fr/fr/statistiques/2011101?geo=DEP-75)
- TheFork — commissions et abonnements : [RestoBoard](https://www.restoboard.fr/blog/combien-coute-thefork-restaurant-2026), [Brewbook](https://brewbook.fr/blog/cout-thefork-lafourchette.html), [TwinTable](https://twintable.io/blog/couts-caches-thefork)
- Rétention apps sociales J30 : [UXCam](https://uxcam.com/blog/mobile-app-retention-benchmarks/), [GetStream](https://getstream.io/blog/app-retention-guide/), [Appcues](https://www.appcues.com/blog/app-retention-is-hard-heres-how-to-improve-it)
- CPI / CAC consumer : [Business of Apps](https://www.businessofapps.com/marketplace/user-acquisition/research/user-acquisition-costs/), [Adapty](https://adapty.io/blog/customer-acquisition-cost/)
- TJM freelance France : [Reconversion Freelance](https://reconversion-freelance.com/guides/taux-journalier-moyen-freelance-par-metier/), [2iPortage](https://www.2iportage.com/barometre-des-tarifs-freelances-et-consultants/), [Freelance 3D](https://3dfreelance.fr/tarifs-services-3d/tarifs-freelance-3d/)
- Newsletters payantes : [Captcha.fr](https://www.captcha.fr/newsletters-payantes-substack/), [Salesdorado](https://salesdorado.com/inbound-marketing/avis-substack/)
- Le Fooding : [lefooding.com — Paris](https://lefooding.com/en/cities/paris)

*Note interne d'instruction. Ne constitue pas un conseil en investissement.*
