# AVANT LE LANCEMENT PUBLIC — la liste qui bloque
*Créée le 6 août 2026. Tant que ces cases ne sont pas cochées, jeudi reste en cercle fermé.*

## ⛔ Bloquant — à faire AVANT d'ouvrir au-delà des proches

- [ ] **Acheter les domaines `jeudi.app` (principal) + `jeudiapp.com` (anti-squat, redirection).**
  Vérifiés libres au DNS le 06/08/2026 — à confirmer au registrar (~30 €/an les deux).
  Même manœuvre que ersanmusa.com : achat Infomaniak, DNS vers Vercel.
- [ ] **Créer `contact@jeudi.app`** (une simple redirection vers la vraie boîte suffit).
  ⚠️ L'adresse est DÉJÀ écrite dans l'app (`src/photos.ts` → `CONTACT_RETRAIT`,
  et `public/confidentialite.html` ×3) : tant qu'elle n'existe pas, un signalement
  de photo **rebondit**. C'est acceptable en cercle fermé, pas au-delà.
- [ ] **Brancher `jeudi.app` sur Vercel** (remplace jeudi-seven.vercel.app) et mettre
  à jour l'URL dans les partages/OG.
- [ ] **Des CGU dignes de ce nom** (aujourd'hui : un résumé en 4 puces dans la
  politique). La garantie de l'uploader photo y vit déjà — à formaliser.
- [ ] **AIPD (art. 35)** : géoloc + habitudes nocturnes + graphe social = analyse
  d'impact quasi obligatoire selon l'audit RGPD du panel (30/07). À écrire et dater.

## 📌 Décisions prises, à ne pas re-débattre

- **Pas de masquage/floutage des visages** (06/08/2026). jeudi assume les visages
  comme tout réseau social. La garantie en échange : **retrait sous 24 h** sur simple
  mail (lien « signaler cette photo » sous chaque tirage + procédure dans la
  politique), strip EXIF/GPS systématique avant upload (fait, `tirage.ts`).
  L'ancienne promesse « visages automatiquement masqués » a été retirée de CONCEPT.md.
- **Mentions légales en éditeur NON professionnel** (anonymat public, art. 6-III-2
  LCEN) : valable tant que jeudi ne gagne pas d'argent. Voir bascule ci-dessous.

## 💶 Le jour où jeudi devient payant (dans cet ordre)

- [ ] Une structure juridique (une micro-entreprise suffit au début — ne pas
  utiliser la SAS ATR : autre activité, autres associés).
- [ ] **Mentions légales version pro** : nom, SIREN, adresse, directeur de
  publication (l'anonymat non-pro tombe).
- [ ] **CGV** en plus des CGU (service numérique payant : droit de rétractation).
- [ ] Opt-in explicite pour tout mail de prospection (« passe à jeudi+ »).
- [ ] **Trancher la lecture de la règle du concept** : « l'argent n'achète jamais
  le classement » (→ ouvre réservation commissionnée, billetterie des Grands
  Jeudis, outillage B2B des patrons) vs « aucun argent des lieux, jamais »
  (→ abonnement seul). Discussion du 06/08 : la pub est écartée dans les deux cas
  (structurellement le pire modèle pour une app sans feed : ~0,3 €/utilisateur/an).

## 🗺️ Avant toute expansion hors Paris

- [ ] L'état vide hors Paris EST l'expérience réelle d'une nouvelle ville — le
  soigner d'abord (spécifié dans CHANTIER_PELLICULE.md §1.8).
- [ ] Le rayon adaptatif (principe validé le 06/08 : « le rayon est du temps,
  adaptatif, jamais un mur » — paliers qui s'élargissent jusqu'à remplir le deck,
  plafond selon le moment choisi). Chantier `src/rayon.ts` à faire.
