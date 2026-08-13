# jeudi. — ÉTAT DES LIEUX
*Dernière publication : **13 août 2026**, prod https://jeudi-seven.vercel.app ·
commit `c6b9f8b` · 505 tests verts (36 fichiers) · tsc et eslint à zéro.
Mesuré le jour même, avant et après la mise en ligne.*

> ⚠ Le tableau ci-dessous date du **6 août** et n'a pas été revérifié depuis :
> il ne contient ni la ville entière (27 types de lieux), ni le signalement,
> ni le push, ni la navbas en îlot. Pour l'avancement à jour, voir
> `design/etat_du_chantier_001.html` (12/08).

Statuts vérifiés **dans le code**, pas dans les notes de session.
✅ livré · 🟡 partiel · ⬜ à faire · ⛔ bloquant avant ouverture publique

---

## 1 · Les chantiers produit

| # | Chantier | Statut | Où ça en est |
|---|---|---|---|
| — | **Le cœur : carnet, deck, swipe, tampon** | ✅ | `CeSoir.tsx`, verdict swipé + tampon posé au doigt |
| — | **Le hub « sortir » + le moment qui s'accorde** | ✅ | Deux verbes, `ChoixMoment` branché, `BandeauMatch` + pastille de vote |
| — | **Le match de groupe multi-téléphones** | ✅ | Lien WhatsApp, sans compte, rejeu, candidats collaboratifs, page publique invités |
| — | **Le fond réel du carnet** | ✅ | 302 spots dans le compte d'Ersan, zéro faux profil, 237/306 enrichis OSM |
| — | **Les 5 preuves photo + glyphes de type sur la carte** | ✅ | `typesLieu.ts`, album à trous |
| — | **La carte de membre / partage en story** | ✅ | `partageStory.ts`, 9:16 au tampon |
| — | **Bilingue fr/en** | ✅ | `langue.ts`, le français est la clé |
| — | **RGPD : politique, export, suppression de compte** | ✅ | `confidentialite.html`, `exporterMesDonnees`, rpc `supprimer_mon_compte` |
| — | **Mesure sobre (6 events, zéro tiers)** | ✅ | `analytique.ts` + migration 0004 |
| — | **A11y du deck (boutons 44px à côté du swipe)** | ✅ | `.deck-boutons` |
| **A** | **Le geste photo du swipe de sortie** | ✅ | `TirageDuSoir.tsx` + `tirage.ts` (EXIF, réduction 1600px, fenêtre 17h→6h). **Migration 0010 à passer** |
| **B** | **La pellicule fraîche + le carnet du cercle** | ⬜ | Spécifié à fond dans `CHANTIER_PELLICULE.md`, protos jouables. Bloqué par : RLS photos limitée à MES lieux |
| **C** | **Le vote du match en swipe** | ⬜ | Aujourd'hui 72 chips ; le concept dit « chacun swipe les propositions » |
| **D** | **Le suivi de match lisible** | ⬜ | Trier par score, encadrer le leader |
| **E** | **Les titres sans score · le calendrier des occasions** | ⬜ | « l'œil du 11e » ; calendrier parisien en mémoire, pas branché |

### Les dettes techniques identifiées, pas encore payées

| Dette | Statut | Détail |
|---|---|---|
| Style de carte MapLibre custom | ⬜ | Toujours des tuiles raster Carto + filtre CSS (`Carte.tsx:47`) — le reproche n°1 du ui designer |
| RLS : photos sur les spots des autres | ⬜ | `syncPhotosLieu` sort tôt si le lieu n'est pas à moi → un tirage sur le spot d'un pote reste **local**. **Prérequis du chantier B** |
| Web Push (iOS 16.4+) | ⬜ | Aucun `pushManager` dans le code — la boucle de retour est morte |
| Plancher typographique (11px partout) | 🟡 | Signalé deux fois (ui designer, a11y) ; corrigé par endroits, pas audité ligne par ligne |
| `index.css` monolithique | ⬜ | 7 000 lignes ; la règle « une cire par écran » ne survivra pas à un contributeur de plus |
| Error tracking (Sentry/GlitchTip) | ⬜ | Les crashs iPhone des testeurs restent invisibles |

---

## 2 · Le panel des 23 (30/07/2026) — moyenne **5.8/10**
*13 professionnels (6.0) + 10 consommateurs (5.7). Une reco prioritaire chacun.*

### Les professionnels

| Examinateur | Note | Sa reco prioritaire | Statut |
|---|---|---|---|
| ui designer | 7.5 | Un vrai style MapLibre « carnet » au lieu du filtre CSS | ⬜ |
| journaliste sorties | 7 | Signer les 320 spots par 5-10 curateurs réels et nommés | ⬜ |
| influenceuse lifestyle | 6.5 | « partager cette carte » → visuel 9:16 story | ✅ |
| dev mobile senior | 6.5 | Web Push avant le lancement (lundi + « alors ? ») | ⬜ |
| sociologue de la nuit | 6.5 | Écrire la politique de composition du corpus initial | ⬜ |
| ux researcher | 6 | 5 tests guérilla de 20 min, corriger les 3 pires frictions | ⬜ |
| pm app sociale | 6 | Un canal de rappel ou de partage, sinon pic sans lendemain | 🟡 partage ✅, rappel ⬜ |
| gérant de bar | 6 | Statut « patron vérifié » (corriger ses horaires, répondre à UN tip) | ⬜ |
| experte accessibilité | 5.5 | Deux vrais boutons bof/validé sous le deck, 44×44 | ✅ |
| growth marketer | 5.5 | 6 events d'analytics avant la finale | ✅ |
| experte RGPD | 5.5 | Politique de confidentialité **+ floutage des visages** | ✅ politique + mentions légales + signalement/retrait 24 h · floutage **abandonné par décision** (06/08, voir AVANT_LANCEMENT.md) |
| experte tourisme | 5 | 100 % des spots avec horaires vérifiés | 🟡 137/306 |
| investisseur early-stage | 4.5 | Prouver le W4 retention sur 100 vrais Parisiens | ⬜ |

### Les consommateurs

| Examinateur | Note | Sa reco prioritaire | Statut |
|---|---|---|---|
| étudiante 22 ans | 6.5 | 3 curateurs de MON âge à l'onboarding + prix vérifiables | ⬜ |
| foodie 30 ans | 6.5 | L'import Google devient un **deck de tri swipé**, pas un dump | ⬜ (import ✅, tri ⬜) |
| nouvelle arrivante | 6.5 | L'écran « suis 3 curateurs qui te ressemblent » | ⬜ |
| ado TikTok 19 ans | 6.5 | La carte de partage en story = l'acquisition | ✅ |
| jeune pro 28 ans | 6 | Ligne « exécution » : résa / téléphone / capacité groupe | ⬜ |
| fêtard 25 ans | 5.5 | Le match VRAIMENT multi-téléphones, sinon c'est du théâtre | ✅ |
| couple 35 ans | 5.5 | Horaires par jour + bouton « appeler / réserver » | 🟡 / ⬜ |
| parisien casanier 40 ans | 5.5 | Le match utilisable sans que mes potes aient l'app | ✅ |
| novice tech 55 ans | 4.5 | Un écran d'installation pas à pas, avant la connexion | ✅ |
| touriste américain | 3.5 | Mode invité « Visiting Paris? » en anglais | 🟡 app bilingue ✅, mode invité ⬜ |

### Les 8 convergences du panel

| # | Ce qui converge | Voix | Statut |
|---|---|---|---|
| 1 | Le partage (carte-image 9:16 + pages spot publiques) | 6 | 🟡 story ✅, pages spot publiques ⬜ |
| 2 | Le cercle jamais vide (« suis 3 curateurs » à l'onboarding) | 5 | ⬜ |
| 3 | Conclure la soirée (horaires réels + appeler/réserver) | 4 | 🟡 |
| 4 | Le retour (Web Push + guide d'installation + 3 notifs) | 3 | 🟡 guide ✅, push ⬜ |
| 5 | Le juridique (confidentialité, CGU, floutage) | 1 | 🟡 politique + mentions + retrait ✅ · CGU complètes ⬜ · floutage abandonné (décision 06/08) |
| 6 | La mesure (6 events + attribution du lien d'invitation) | 2 | 🟡 events ✅, attribution ⬜ |
| 7 | L'accessibilité (boutons, contrastes, plancher 12px) | 1 | 🟡 boutons ✅, typo ⬜ |
| 8 | Le mode groupe multi-téléphones | 4 | ✅ |

---

## 3 · L'audit du cœur (01/08/2026) — les quatre tensions

| Tension | Diagnostic | Statut |
|---|---|---|
| T1 | La décision éclatée en trois écrans qui s'ignorent | ✅ le hub « sortir » les réunit |
| T2 | L'app est un entonnoir, pas un lieu (quiz avant tout) | ✅ deux verbes visibles d'emblée |
| T3 | Le temps verrouillé sur « ce soir » | ✅ le moment s'accorde (`moment.ts`) |
| T4 | Trois langages du temps, zéro unité | 🟡 `ChoixMoment` est branché sur le deck ; **pas encore sur « trouver » ni sur la deadline du match** |
| Secondaire | Photos absentes des écrans de décision de groupe | ✅ preuves dans les listes (commit `71a2e25`) |
| Secondaire | Le vote in-app se tape au lieu de se swiper | ⬜ **c'est le chantier C** |
| Secondaire | Aucun signal de match en cours | ✅ bandeau + pastille cire |

### L'audit technique du 02/07/2026 — ce qu'il reste

| Manque | Statut |
|---|---|
| Open Graph / Twitter cards | ✅ `og.png` + 5 balises |
| PWA, icônes, polices self-hostées, toast de mise à jour | ✅ |
| Analytics respectueux | ✅ |
| RGPD : export + suppression de compte | ✅ |
| Error tracking (Sentry) | ⬜ |
| Attribution du lien d'invitation | ⬜ |
| Glyphes texte `⌄ ✕ ⋯ ✓ ↺` à passer à l'encre | 🟡 |
| États vides (Grand Jeudi à 0 spot public) | 🟡 |

---

## 4 · Ce que je ferais dans cet ordre

1. **Passer la migration 0010** (2 minutes, débloque tout le reste des photos).
2. **La RLS des photos du cercle** — sans elle, le chantier B ne peut pas exister : un tirage pris chez un pote ne quitte jamais le téléphone.
3. **Chantier B, la pellicule** — la feature-vitrine, désormais alimentée en vraies photos datées.
4. **Chantier C, le vote swipé** — la dernière incohérence entre le concept et l'app.
5. **Le floutage des visages** ⛔ — la seule chose qui bloque une ouverture publique, d'après l'experte RGPD.
6. **« Suis 3 curateurs » à l'onboarding** — 5 voix du panel, et le remède au cercle vide au jour 1.
