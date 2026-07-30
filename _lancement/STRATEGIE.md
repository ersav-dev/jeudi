# STRATÉGIE — soft-launch de jeudi.
*Kit de lancement · juillet 2026 · document de travail privé*

---

## ⛔ GARDE-FOU — checklist AVANT d'envoyer le moindre lien

**On ne lance RIEN tant que ces cases ne sont pas cochées. Aucune exception, même à J-1.**

- [ ] `vercel --prod` dans `app/` (dernier code, celui qui sait lire les photos post-0003)
- [ ] Migration **`0003_securite.sql` appliquée** dans le SQL editor Supabase — **dans la même fenêtre de temps** que le déploiement (pas-à-pas : `supabase/APPLIQUER_0003.md`). Ancien code + 0003 = photos cassées.
- [ ] **Test 2 comptes** avec un compte jetable :
  - [ ] compte A invite compte B par lien `?invite=<id>` → B arrive, s'inscrit, entre dans le cercle
  - [ ] B ajoute un spot avec photo → la photo s'affiche (URLs signées, bucket privé)
  - [ ] B voit les spots 👥 cercle de A, ne voit PAS les 🔒 pour toi
  - [ ] suppression du compte jetable via `supprimer_mon_compte()` → tout disparaît
- [ ] Vérifier l'heure exacte du coup d'envoi de la finale (heure de Paris — match en Amérique du Nord, donc soirée/nuit ici : parfait pour les bars)

Si un seul point coince → on décale le lancement, pas le fix.

---

## La cible : 5 à 15 potes proches. Pas plus.

Pourquoi si peu, alors que la finale pourrait en amener 50 :

1. **Le cercle EST le produit.** jeudi ne vaut que si les recos viennent de gens qu'on connaît vraiment. 50 semi-inconnus = une app de reviews de plus. 10 vrais potes = la conversation WhatsApp transformée en app.
2. **Qui invite répond de ses invités** — c'est écrit dans le concept. Le premier cercle donne le ton de tout ce qui suivra (qualité des tips, photos vraies, pas de pollution).
3. **Le backend vient d'être migré.** Relations réelles (étape 5) pas encore livrées, un seul humain au support. 10 personnes qui rencontrent un bug = 10 messages gérables. 50 = un lancement raté.
4. **Le feedback n'a de valeur qu'à cette échelle.** Un pote proche te dit « ton truc de météo, j'ai rien compris ». Un inconnu désinstalle en silence.

**Le bon casting** : des potes qui sortent vraiment, qui regarderont la finale quelque part, qui répondent aux messages, et dont 2-3 au moins ont le goût « curateur » (les gens qu'on appelle déjà pour un plan).

---

## Timeline — J = jour de la finale (~18 juillet)

| Jour | Quoi |
|---|---|
| **J-4** | Checklist garde-fou ✅ (déploiement + 0003 + test 2 comptes). Ersan tagge et photographie ses premiers bars qui diffusent (voir `SEMAINE_FINALE.md`). Le carnet du curateur zéro doit être plein AVANT le premier invité. |
| **J-3** | **Envoi des invitations WhatsApp** (messages dans `MESSAGES.md`), en perso, une par une — jamais un groupe. L'accroche : « tu la regardes où, la finale ? dis-moi, je le mets dans l'app. » Chaque réponse = un spot taggé ballon de plus. |
| **J-2** | Suivi silencieux : qui a accepté, qui a ouvert. Réponse rapide à chaque question/bug. On continue de tagger les bars annoncés par les potes. |
| **J-1** | **Relance douce** uniquement vers ceux qui n'ont pas cliqué (variante courte). Post LinkedIn optionnel d'Ersan (angle créateur, pas pitch). Vérifier que 10-15 spots portent le pin ballon avec photos et tips. |
| **J (finale)** | Le pic naturel : tout le monde cherche un bar. Message du matin : « les spots qui diffusent sont marqués d'un ballon. » Zéro nouvelle feature, zéro déploiement aujourd'hui — l'app doit juste tenir. Ersan sort, regarde le match, capture des photos comme un membre normal. |
| **J+1** | **Le moment magique** : le swipe « alors, c'était comment ? ». Message perso à chacun de ceux qui sont sortis (voir `SEMAINE_FINALE.md`). C'est ici que la boucle de confiance se joue. |
| **J+2** | Relance douce générale (message dans `MESSAGES.md`) : merci, une question ouverte, zéro pression. Noter tous les retours dans un seul fichier. |
| **J+3** | Bilan à froid : les 3 métriques (ci-dessous), la liste des frictions, décision sur la vague 2 d'invitations. |

---

## Les 3 métriques qui comptent

Pas de téléchargements, pas de DAU, pas de sessions — du vent à ce stade. Trois chiffres, tous liés à la boucle de confiance :

1. **Invitations acceptées** — sur les liens envoyés, combien ont créé un compte ? *Cible : ≥ 70 %.* En dessous, le message ou l'onboarding a un problème (et à 10 potes proches, on peut leur demander lequel).
2. **Spots ajoutés par d'autres qu'Ersan** — le carnet devient-il collectif ? *Cible : ≥ la moitié des inscrits ajoutent au moins 1 spot dans la semaine.* Zéro spot ajouté = l'app est consultée, pas habitée.
3. **Photos ajoutées** — « publier = prouver » fonctionne-t-il en vrai ? *Cible : au moins 1 spot sur 2 publié avec photo perso.* C'est LA friction assumée du produit ; si personne ne la franchit, il faut le savoir maintenant, pas à 1000 membres.

Bonus qualitatif (pas un chiffre) : est-ce qu'au moins un pote a **répondu au swipe « alors ? »** le lendemain de la finale ? Une seule boucle complète — invité → sorti → validé — vaut plus que tout le reste.

---

## Ce qu'on ne fait PAS

- Pas de groupe WhatsApp « beta testeurs » (l'app EST la conversation).
- Pas d'annonce publique, pas de Product Hunt, pas de story Insta générique.
- Pas de nouvelle feature entre J-3 et J+1. On corrige les bugs bloquants, c'est tout.
- On ne dépasse pas ~15 comptes sur cette vague, même si ça mord. Les suivants attendront la vague 2 — la rareté est dans l'ADN.
