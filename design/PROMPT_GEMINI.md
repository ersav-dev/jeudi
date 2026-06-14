# Prompts Gemini — Jeudi

Deux usages : le **moodboard** (explorer la direction avant/pendant Stitch) et les **concepts d'écrans en image** (pour comparer avec ce que Stitch produit). Colle tel quel dans Gemini (gemini.google.com, modèle avec génération d'images).

---

## Prompt 1 — Moodboard (commence par ça)

You are an art director for a premium mobile app. Generate a moodboard image (single composed board, landscape) for this app concept:

"Jeudi" — a French mobile app for going out at night in Paris, solo or with close friends. It answers the question "what's tonight?" with 1-3 trusted places. The swipe gesture is the soul of the app. The app's voice is a sharp friend who teases you — warm, direct, never corporate.

Visual direction for the board:
- Nocturnal Paris at 11pm: dim bars, neon reflections on wet streets, intimate restaurant counters, a person dining alone and owning it
- Color world: deep green-tinted charcoal (#0E1413), bone white, ONE electric chartreuse-yellow accent (#E8E337) used like a single neon sign — never purple, never blue glows
- Typography feel: bold tight grotesque headlines in lowercase French ("c'est quoi ce soir ?"), monospace details for distances and times
- Texture: subtle grain, real photography mood, premium but street-level — NOT corporate, NOT startup-gradient
- Include: a swipeable card UI fragment tilted mid-gesture, a dark map with chartreuse dots, a chip/pill UI element

Banned: purple/blue neon, star ratings, emoji, glossy 3D illustrations, generic startup aesthetics.

---

## Prompt 2 — Concept d'écran en image (un par écran, adapte la description)

Generate a high-fidelity mobile app screen mockup (9:19.5 portrait, iPhone frame optional) for the French app "Jeudi".

Design system (strict): background deep green-charcoal #0E1413; cards in raised slate #1A2120 with 1.5rem rounded corners; primary text bone white #FAFAF7; secondary text muted sage #8A9490; ONE accent only: electric chartreuse #E8E337 used sparingly; headlines in a bold tight grotesque (Satoshi-like), lowercase, conversational French; distances/times in monospace; NO star ratings, NO purple, NO emoji, NO centered generic layouts.

Screen to generate: [COLLE ICI LA DESCRIPTION D'UN ÉCRAN DEPUIS PROMPTS_STITCH.md — par exemple l'Écran 2 "C'est quoi ce soir ?"]

The screen must feel decisive (1-3 answers, never long lists), usable one-handed while walking, and speak like a friend texting you — e.g. "alors, Le Bisou ?" never "Veuillez évaluer votre expérience".

---

## Prompt 3 — Logo / identité (optionnel, pour jouer)

Design logo concepts for "Jeudi" — a French night-out app. The name means "Thursday", the unofficial going-out night in France. Explore 4 directions on one board: (1) a bold lowercase wordmark "jeudi" in a tight grotesque with one letter glowing like neon, (2) a minimal symbol mixing a map pin and a card mid-swipe, (3) a neon-sign version as it would appear on a Paris street wall, (4) the app icon on a phone homescreen — chartreuse #E8E337 on deep charcoal #0E1413. Premium, street-level, never corporate. No purple, no gradients.

---

## Conseil de workflow
1. Gemini Prompt 1 → choisis l'ambiance qui te parle, garde 2-3 images.
2. Stitch avec DESIGN.md + les prompts écrans (PROMPTS_STITCH.md) — tu peux uploader tes images de moodboard dans Stitch comme référence.
3. Si un écran Stitch te déçoit, repasse-le dans Gemini avec le Prompt 2 pour une vision alternative, puis ramène la meilleure version dans Stitch.
4. Tout ce que tu valides → `design/screens/` → je l'implémente au pixel.
