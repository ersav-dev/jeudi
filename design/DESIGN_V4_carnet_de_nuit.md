# Design System: Jeudi — "Le Carnet de Nuit" (DA finale candidate)

> Fusion du Carnet (V3, l'identité) et de Nuit Noire (l'ergonomie nocturne). À coller dans un NOUVEAU projet Stitch (mode Mobile) : "Here is the design system. Follow it strictly for every screen. Acknowledge and wait for my first screen request." Puis les prompts d'écrans de PROMPTS_STITCH.md.

## 0. The Founding Rule
**User content is the artwork. The UI is the frame.** This app's brand is the voice of its members: their imperfect night photos (the place, the drink, the toilets), their handwritten-style notes, their validation stamps. The interface must stay quiet, dark and material so that member content glows. Whenever a design decision arises: the member's photo and words win, the chrome loses.

## 1. Visual Theme & Atmosphere
A NIGHT EDITION of a private notebook: the address book of a Parisian friend with impeccable taste, written and stamped at a candlelit table. Every screen is a page of dark charcoal paper with a barely visible grain and faint dot-grid; the "ink" is warm ivory; photos are real prints glued onto the page. Luxury stationery at night — a chef's notebook in a dim kitchen, a notary's ledger in a wine cellar. NOT neon, NOT cyber, NOT vintage-filter kitsch.

Mission: nothing should look AI-generated or software-designed. Sharp, material, hand-placed. Density 3/10 — one idea per page. Variance 8/10 — placements feel human, slightly imperfect. Motion 5/10 — cards flick like paper, stamps hit; nothing floats, pulses or shimmers. Built for one-handed use at 11pm in a dim bar — comfortable dark, never a flashlight.

## 2. Color Palette & Roles
- **Night Paper** (#15130F) — Background: deep warm charcoal paper with subtle grain and a faint ivory dot-grid (2-3% opacity).
- **Ivory Ink** (#F0EAD9) — All primary text and line work. Warm, never white-white.
- **Faded Ivory** (rgba(240,234,217,0.55)) — Secondary text, captions, attributions, dotted leader lines.
- **Sealing Red** (#A8322A) — THE single accent: wax-seal / marking-ink red. ONE red element per page maximum: the VALIDÉ stamp, a hand-circled word, the active nav dash. Notary stamp, never ketchup.
- **Print White** (#FBF8F1) — The thin border of glued photo prints only.
- **Glue Shadow** (rgba(0,0,0,0.5)) — Tiny hard shadow under glued prints: 1-2px offset, max 2px blur.

No other colors. Member photos provide all remaining color and light.

## 3. Typography Rules
- **Display:** Instrument Serif (Regular + Italic) — headlines and place names. Headlines lowercase italic, like a question jotted down: "c'est quoi ce soir ?"
- **Annotations:** Caveat (refined handwriting) — ONLY for members' personal notes, 1-2 lines: "comptoir au fond, lumière parfaite." Attribution below in Faded Ivory small caps: "— karim, éclaireur du 10e". Handwriting nowhere else (kitsch lock).
- **Body/UI:** Satoshi — quiet functional text, labels.
- **Mono:** JetBrains Mono — distances ("350m"), times ("19h42"), deck counter ("1/8"), spot counts ("47 spots") — like typewriter stamps on archive cards.
- Hierarchy through size and ink density, never color variety.

## 4. Component Stylings
* **Swipe Cards (signature):** Photo prints glued on the dark page — Print White thin border, hard Glue Shadow, rotated 1-2°, corners straight or barely rounded (0.25rem). Member photo fills the print (amateur framing, warm light, real night shots). Below the photo on the card: place name in serif, the handwritten note, mono distance. Swiping right slams a **Sealing Red "VALIDÉ" rubber stamp** diagonally across the photo; swiping left scribbles a Faded Ivory "bof" crossed out in pencil. Cards rotate ±10° under the finger. Mono deck counter "1/8" top-right.
* **Buttons:** Underlined Ivory Ink text links, or thin-bordered rectangles like old stationery forms. ONE Sealing Red rectangle (Ivory text) max per page for the hero action. Sharp corners, no pills.
* **Occasion selector:** Ivory words separated by interpuncts: "solo · première date · potes · rdv pro" — the selected word circled by an imperfect hand-drawn Sealing Red ellipse. No chip backgrounds.
* **Place list ("ma carte"):** Notebook index on dark paper — serif place names, dotted leader lines to mono distances. Expanded entry reveals its glued photo print. Archived places struck through with one ivory ink line. Filters as small ivory words, active one underlined red.
* **Map:** Engraved-style map — ivory line work on Night Paper, pins as small ink crosses, selected place hand-circled in Sealing Red.
* **Bottom Navigation:** Three single-line ivory ink icons (spark, map pin, two heads) drawn directly on the page — active one gets a short Sealing Red dash underneath. No bar background, no boxes, no labels.
* **Bottom Sheet:** A second sheet of Night Paper sliding up, Ivory hairline at its top edge, grabber as a short ivory dash.
* **Empty States:** Nearly blank dark page, one handwritten line: "rien ici. la rue t'attend."
* **Photos:** ALWAYS member-shot (the place, the dish/drink, the toilets) — imperfect, alive, never stock, never full-bleed backgrounds. Presented as glued prints.

## 5. Layout Principles
- Mobile portrait 390px. Each screen = one page. NO top bar, NO hamburger, NO logo header — the page opens on content.
- Wide margins (1.5rem+). Headlines top-left in italic serif; metadata offset right in mono.
- Glued elements sit slightly off-grid (±2-4px, ±1-2° rotation); text stays perfectly straight and legible.
- Suggestions = deck of up to 8 cards, ONE at a time. **This app never scrolls through suggestions — it swipes.** The deck ends with a handwritten "c'est tout ce que j'ai. reviens demain."
- Thumb-zone actions bottom 40%, targets 48px+, min-h-[100dvh], safe-area insets.

## 6. Motion & Interaction
- Page transitions: quick paper slide/turn, 250ms ease-out.
- The stamp hits: scale-from-130% + tiny rotation settle, one haptic. Fast, physical.
- Cards flick off with spring physics (stiffness 100, damping 20), like tossing cards on a table.
- Nothing loops, pulses or shimmers. Stillness is the luxury. Transform/opacity only, 60fps.

## 7. Anti-Patterns (Banned) — the anti-AI charter
- No neon, no glows, no gradients, no glassmorphism, no blur veils, no soft floating shadows.
- No bright/light mode screens — the page is always Night Paper.
- No yellow, no purple/blue, no second accent.
- No pills, no rounded-2xl cards, no chip backgrounds, no filled tab bar.
- No hamburger menu, no centered app-name header, no avatar in a top bar.
- No star ratings, no /5, no leaderboards, no points — ever (product law).
- No emoji in UI chrome. No Inter, no Georgia/Times.
- No full-bleed hero photos with overlaid text. No glossy stock photography.
- No scroll-based discovery. No perfect symmetric centering.

## 8. Brand Identity Notes (for logo/launch assets)
- **Logo = the stamp.** "jeudi" lowercase as a rubber-stamp imprint — slightly uneven ink coverage, Sealing Red on Night Paper (or Ivory on red for the app icon). The brand gesture IS the member's validation gesture.
- **Tagline territory:** "pas des avis. des preuves." / "notée par personne. validée par les tiens."
- The app icon: a small Night Paper square with the red "jeudi" stamp hit at a slight angle.
