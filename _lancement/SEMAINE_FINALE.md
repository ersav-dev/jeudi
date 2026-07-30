# SEMAINE FINALE — le plan d'activation autour du match
*La finale n'est pas une campagne marketing : c'est le premier soir où jeudi. sert à quelque chose pour de vrai. Tout le plan tient en trois temps : avant, pendant, après.*

---

## AVANT (J-4 → J-1) — remplir le carnet du curateur zéro

Le premier invité qui ouvre l'app doit tomber sur un carnet **déjà vivant**. C'est le travail d'Ersan, à pied :

1. **Choisir 10-15 bars qui diffusent la finale**, répartis sur les quartiers où vivent/sortent les potes invités (pas 15 bars dans le 11e si la moitié du cercle est à Montreuil).
2. **Y aller physiquement.** Pour chaque bar :
   - le tagger `match : oui` → le pin ballon apparaît
   - **ses propres photos** (règle de la maison, même pour le fondateur) : le lieu, un verre, et les WC si on assume le badge fiche complète
   - **un tip utile pour un soir de match**, pas une description : *« grand écran au fond, arrive avant 20h »*, *« le son est dehors en terrasse, dedans c'est mieux »*, *« happy hour jusqu'à 21h, après ça double »*
3. **Compléter avec les réponses des potes.** Chaque « moi je la regarde chez Untel / au [bar] » reçu par WhatsApp = un spot ajouté le soir même, avec mention du pote si possible. Le pote qui voit « son » bar déjà dans l'app à son arrivée comprend le produit sans tutoriel.
4. **Vérifier la couverture** à J-1 : ouvrir l'app comme un invité, chercher un bar de match dans 3 quartiers différents. Si un quartier est vide, une soirée de repérage de plus.

**Budget temps réaliste : 2 soirées de repérage + les ajouts au fil de l'eau.** C'est le vrai coût du lancement, et il est irremplaçable — c'est ce qui rend l'app crédible à la première ouverture.

---

## PENDANT (jour J) — le pin ballon, et rien d'autre

Le ballon est LA feature du jour. Tout converge vers un seul geste : *ouvrir la carte, voir les ballons, choisir.*

- **Le matin** : le message d) de `MESSAGES.md` part à tous les inscrits, en perso. Une seule consigne : « les spots qui diffusent sont marqués d'un ballon ».
- **Zéro déploiement, zéro réglage** aujourd'hui. L'app doit juste tenir. (Si un bug bloquant sort : fix minimal, test, `vercel --prod`, rien d'autre.)
- **Ersan est un membre, pas un service client.** Il sort, regarde le match dans un des spots taggés, capture ses photos, poste son tip du soir. Les potes doivent voir le créateur *utiliser* son app, pas la vendre.
- **Répondre vite mais léger** aux messages (« ça marche pas », « c'est où le ballon »). Chaque friction notée dans un coin pour J+3 — pas corrigée en direct sauf blocage total.
- Si un pote regarde chez quelqu'un : *« capture le spot quand même — les soirées canap comptent aussi. »* (spot 🔒 pour toi ou 👥 cercle, c'est son choix — bonne occasion de montrer les visibilités.)

---

## APRÈS (J+1) — « alors, c'était comment ? » : le moment magique

Le lendemain, l'app pose sa question : *« alors, [le spot] ? »* — le swipe de sortie, cinq secondes. **C'est le geste qui différencie jeudi de tout le reste** : la validation en conditions réelles. Il faut que chaque pote sorti la vive.

Comment s'en assurer (l'app seule ne suffira pas — pas encore de push) :

1. **Le message perso de J+1, vers midi** (pas 8h — c'est un lendemain de finale) :
   > alors, [nom du bar] hier ? ouvre l'app 5 secondes, elle te pose la question — un swipe et c'est dit.
   L'important : le message renvoie *vers le geste dans l'app*, il ne collecte pas l'avis par WhatsApp. Si le pote répond « c'était top » par message, répondre : *« dis-le dans l'app, c'est ça qui compte — c'est ta validation, signée. »*
2. **Ersan montre l'exemple, publiquement** : son propre swipe de sortie fait, son tip du soir de match posté à J+1 au matin, visible par le cercle.
3. **Fermer la boucle à voix haute.** Quand un pote a validé : *« ça y est, [le bar] est validé "soir de match" par quelqu'un qui y était. c'est exactement ça, l'app. »* Le pote comprend que son geste a produit une donnée qui n'existe nulle part ailleurs.
4. **Compter** : combien de sortis, combien de swipes « alors ? » complétés. Une boucle complète (invité → sorti → validé) = le lancement est un succès, quel que soit le reste.

---

## Récap des livrables de la semaine

- [ ] 10-15 bars taggés ballon, photos perso + tip de match chacun (J-4 → J-1)
- [ ] chaque réponse de pote « je la regarde à X » entrée dans l'app le soir même
- [ ] message du matin de la finale envoyé à tous (jour J)
- [ ] Ersan sur le terrain le soir de la finale, en membre
- [ ] messages « alors ? » individuels envoyés vers midi à J+1
- [ ] frictions notées au fil de l'eau → bilan J+3 (cf. `STRATEGIE.md`)
