# AUDIT GLOBAL — le visuel, le design, l'UI et l'UX de jeudi
*12/08/2026, session Fable, à la demande d'Ersan (« un méga audit de tout ce
qui est visuel »). Trois auditeurs indépendants (DA/couleurs/typo · flux
principaux · parcours critiques), chaque trouvaille re-vérifiée dans le code.
RIEN n'est appliqué sans décision — sauf deux bugs objectifs corrigés en
passant (notés ✔).*

---

## Volet 1 · LA DIRECTION ARTISTIQUE (couleurs, typo, système CSS)

### Le contexte que l'auditeur n'avait pas
Son constat n°1 — « deux accents en concurrence, `--red` (qui est un BLEU,
74 usages) contre `--cire` (10 usages), et la doc DESIGN_V5 dit le contraire » —
est exact dans les faits mais la conclusion est inversée : **Ersan a tranché le
07/08 : le bleu jeudi `#5d8dff` est l'accent par défaut, partout.** C'est donc
la DOC qui est en retard, pas le code. Deux dettes réelles restent :
1. le nom `--red` MENT (c'est un bleu) — à renommer `--accent` ou `--bleu`
   dans une passe mécanique sans risque ;
2. `DESIGN_V5_carnet_objet.md` §4 à mettre à jour (l'accent est le bleu ;
   la cire garde ses 10 usages rituels) — sinon chaque relecture refera la
   même fausse alerte, et le commentaire « même rouge cire que le logo »
   (index.css ~1051) au-dessus d'une règle bleue continuera de mentir.

### Les bugs objectifs (vérifiés)
- ✔ **`var(--blanc)` n'a jamais existé** (2 usages, écran couverture) : le
  cadre du polaroïd retombait sur transparent. CORRIGÉ le 12/08 →
  `var(--print-white)`.
- **`.reglages-action` déclaré DEUX fois** avec des styles incompatibles
  (index.css ~2760 vs ~2810) : la 2ᵉ gagne — les ~10 boutons des réglages
  rendent en « carte » à bordure pleine 11px au lieu de la ligne pointillée
  13px voulue (et DESIGN_V5 §7 dit « zéro carte » aux réglages). PAS corrigé :
  choisir le traitement, c'est un choix d'écran → **décision Ersan** (reco :
  le pointillé 13px, celui de la doc).

### La dérive mesurée
- **~24-25 tailles de police** contre les 5 corps décrétés (34/21/17/13/11),
  dont ~30 déclarations SOUS le plancher de 11px (jusqu'à 7,5px estompé à
  62 % pour le nom de rue d'une bouche de métro — illisible dehors, de nuit).
  Reco : resserrer sur la grille + acter une sous-échelle « signalétique
  carte » explicite (9-10px, jamais actionnable, opacité relevée).
- **~50 hex hors variables**, surtout des copies de valeurs déjà tokenisées
  (`#14120e` = `--nuit` ×30, `#EFE9D8` = `--encre`, deux blancs polaroïd
  presque identiques). Passe mécanique sans risque.
- **~15 styles de boutons différents** — chaque écran a réinventé le sien.
  Reco : 3 boutons canoniques (accent plein · filet graphite · lien souligné)
  et migration progressive.
- **Caveat sur des noms de stations/monuments** : la « règle d'or » de V5
  (jamais un label système en Caveat) est violée par la carte — mais le
  chantier transport (DESIGN_TRANSPORT_HIERARCHIE.md, validé) règle déjà les
  stations. Reste à trancher pour les monuments (reco : ils sont des repères
  du carnet, le Caveat peut se défendre — l'acter dans la doc).

### Top 5 DA (impact perçu / effort)
1. Mettre la doc V5 au niveau de la décision « bleu jeudi » + renommer
   `--red` (fin des fausses alertes, identité claire).
2. Réparer `.reglages-action` (un écran entier change avec 10 lignes).
3. Resserrer l'échelle typo sur la grille (le carnet redevient « objet »).
4. ✔ `--blanc` (fait).
5. Les 3 boutons canoniques.

---

## Volet 2 · LES FLUX PRINCIPAUX (navigation, carte/liste, fiche, notifs)

### MAJEUR
- **Les trois toasts se superposent au même pixel** (App.tsx ~3159/3871,
  index.css `.toast`) : « archivé · annuler » (5 s), le flash (2,5 s) et
  « nouvelle version. » (persistant) partagent la même position fixe, sans
  file ni décalage. Archiver puis adopter dans les 5 s → le second toast
  RECOUVRE le bouton « annuler ». Une maj en attente peut coller son toast
  sur tous les autres en permanence. Reco : empilement vertical (offset
  cumulé) ou file un-à-la-fois.
- **L'état vide ment selon le filtre** (App.tsx ~2481) : seuls « faits » et
  « ouvert » ont leur message ; favoris, rooftop, sur l'eau, foot, envie,
  étiquette vides retombent tous sur « tout est fait par ici. capture du
  neuf. » — faux, et ça n'oriente pas vers le vrai geste (retirer le
  filtre). Et en vue CARTE, aucun état vide du tout. Reco : message
  construit depuis le filtre actif + état vide minimal côté carte.
- **La recherche libre promet ce qu'elle ne fait pas** (EcranRecherche
  ~187, recherche.ts ~129) : le placeholder dit « une ambiance… » mais le
  moteur est un substring sur nom/description/note/adresse — « cosy » ne
  trouve rien et reçoit le même « rien sous la main » qu'un vrai trou.
  Reco : brancher `scoreTexte` sur le lexique d'intentions (il existe
  depuis le 10/08 !) ou faire dire l'échec correctement (« essaie une
  envie : apéro, resto… »).

### MOYEN
- **« Signaler ce lieu » est introuvable depuis la FICHE** : l'action vit
  seulement dans le menu « ⋯ » de la liste. Sur l'écran principal de
  consultation, on peut signaler UNE PHOTO mais pas le lieu — trou de
  parcours pour une action de sécurité (le chantier 0018 du 12/08 mérite
  sa porte d'entrée là où on regarde). Reco : l'ajouter près de
  SignalerPhoto dans la fiche.
- **Le geste « foot » (tap = diffuse · appui long = refuge) n'est écrit
  nulle part** — découvrable par hasard, alors que l'app SAIT documenter
  ses gestes (la validation de sortie le fait). Reco : la même légende.
- **Taper le NOM du lieu fait défiler les photos** (fiche, ~4310) : le
  handler de feuilletage couvre toute la carte, pas juste la photo.
  Reco : restreindre à `.carte-photo`.

---

## Volet 3 · LES PARCOURS CRITIQUES (auth, onboarding, invité, tactile)

### MAJEUR — l'entrée ne dit rien (Auth.tsx ~79)
Un visiteur ORGANIQUE (pas invité par un lien de match) arrive sur : le tampon
« Jeudi. », « je dis où. », et… le choix Google/mail. **Aucune phrase sur ce
que fait l'app ni pour qui**, aucun aperçu du payoff — alors que la promesse
existe déjà, écrite, dans l'onboarding (« ça dit quoi ce soir ? »). C'est le
point de friction le plus en amont et le plus invisible dans les stats.
Reco : UNE ligne de bénéfice concret au-dessus des portes (voix du carnet,
pas un pitch) — ex. « ce soir, un spot qui te ressemble — pas 4 000 avis. »

### MOYEN
- **La carte n'apprend aucun geste** (Carte.tsx) : grappe qui se déploie au
  tap, appui long pour marquer, boussole tapable — trois gestes non standards,
  et zéro `NoteMarge` dans tout le fichier (le composant d'aide en marge
  existe et sert déjà au Deck). Reco : NoteMarge sur grappe + appui long, au
  premier passage seulement.
- **Cibles tactiles < 44 px sans compensation** — 5 vrais boutons vérifiés :
  `.tc-fermer` 36×28 · `.tc-retirer` ~16 px (!) · `.fiche-nav-btn` 34×34 ·
  `.photo-agrandir` 30×30 · `.croquis-agrandir` 32×32. Le remède existe déjà
  dans le fichier (le `::before { inset:-N }` de `.meteo-choix`) — l'appliquer.

### MINEUR
- **La table de comparaison ignore t()** (Carte.tsx ~2320-2469) : « comparer »,
  « tourne ton téléphone… », « horaires inconnus », « validé »… tout en FR dur
  alors que le reste du fichier traduit. Un anglophone la reçoit en français.
- **Onboarding : jusqu'à 8 écrans** — mais chaque palier (sauf le prénom) a
  son « plus tard » : risque réel faible, longueur à surveiller.
- `.auth-porte-quoi` à 9,5 px (texte de contexte, pas l'action) — nit.

### Le top 3 des moments d'abandon d'un NOUVEAU
1. **Auth, avant tout** — le trou de proposition de valeur ci-dessus.
2. **Le payoff d'onboarding qui tombe à vide** — toute la stratégie est
   « payoff d'abord », mais si le seed échoue en silence, le moment censé
   convaincre devient « le carnet se remplit encore. reviens ce soir » juste
   après l'inscription. Reco : un repli qui montre quand même 3 spots figés.
3. **La première carte** — trois gestes inconnus, cercle vide, aucun repère.

---

## LA SYNTHÈSE PRIORISÉE — ce que je ferais, dans cet ordre

### P0 · Les bugs objectifs (petits, nets — une session)
1. **Les toasts qui s'écrasent** — empilement vertical. Le bouton « annuler »
   d'un archivage ne doit jamais être recouvert.
2. **Les états vides qui mentent** — message selon le filtre actif + un état
   vide en vue carte.
3. **Les 5 cibles tactiles < 44 px** — le pattern `::before` existe déjà.
4. **`.reglages-action` dédoublonné** — DÉCISION ERSAN : la ligne pointillée
   13 px (celle de la doc, reco) ou la carte bordée 11 px (celle qui rend
   aujourd'hui) ?
5. ✔ `--blanc` (déjà corrigé).

### P1 · L'entrée et la sécurité (la porte 2 se joue là)
6. **Auth : une ligne de promesse** avant de demander le mail — le trou de
   conversion le plus en amont, invisible dans les stats.
7. **Le payoff d'onboarding jamais à vide** — un repli avec 3 spots figés.
8. **« Signaler ce lieu » dans la fiche** — la porte de sécurité (0018) doit
   être là où on regarde.

### P2 · Le système DA (rend tout le reste plus facile)
9. **La doc V5 rattrapée** (bleu jeudi = accent, décision 07/08) + renommer
   `--red` → `--accent` (passe mécanique).
10. **L'échelle typo resserrée** (5 corps + une sous-échelle « signalétique
    carte » actée) — le carnet redevient un objet.
11. **3 boutons canoniques** + les ~50 hex retokenisés + `t()` sur la table
    de comparaison.

### P3 · L'apprentissage (la carte s'explique)
12. **NoteMarge sur les gestes de la carte** (grappe, appui long) + la
    légende du geste « foot » + le feuilletage limité à la photo.
13. **La recherche honnête** — brancher le texte libre sur le lexique
    d'intentions, ou faire dire l'échec correctement.

### Les convergences (3 auditeurs, mêmes murs)
- **La carte est le lieu le plus riche ET le moins enseigné** (volets 2+3) —
  et le chantier transport (déjà validé) va dans le même sens : moins de
  bruit, plus de réponse au geste.
- **La discipline existe toujours quelque part** : chaque manque a déjà son
  remède ailleurs dans l'app (NoteMarge, ::before tactile, légende de geste,
  lexique d'intentions). Ce n'est pas un problème de conception, c'est de la
  propagation.
- **La voix tient** : aucun des trois n'a trouvé un écran qui trahit le ton
  (pas de dark pattern, pas de compteur, les erreurs parlent) — le fond est
  sain, les trouvailles sont des finitions.

*Détail des rapports bruts : dans les transcripts de session du 12/08.*
