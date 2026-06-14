# Design System: Jeudi — Direction "Le Carnet" (anti-IA absolu)

> Troisième direction. À coller dans un NOUVEAU projet Stitch (mode Mobile) : "Here is the design system. Follow it strictly for every screen. Acknowledge and wait for my first screen request." Puis les prompts d'écrans de PROMPTS_STITCH.md.

## 1. Visual Theme & Atmosphere
This interface is a PHYSICAL OBJECT, not an app pretending to be print: the private notebook of a Parisian friend with impeccable taste — or the paper tablecloth of a bistro where he scribbled his addresses for you between two glasses of wine. Every screen looks like a page: ivory paper with a barely-visible grain, a faint dot-grid like a fine notebook, ink annotations, photos that look glued-in like small prints. Luxury stationery energy — Hermès sketchbook, a couture house's specifications book, a chef's personal notebook — NOT scrapbook kitsch, NOT vintage Instagram filter.

The absolute mission: NOTHING should look AI-generated or even "designed by software". No glows, no gradients, no glassmorphism, no floating cards with soft shadows, no rounded-everything. Sharpness, restraint, materials. Density 3/10 — gallery air, one idea per page. Variance 8/10 — placements feel hand-decided, slightly imperfect, never templated. Motion 5/10 — pages turn, cards flick like paper, stamps hit; nothing floats or pulses.

## 2. Color Palette & Roles
- **Ivory Page** (#F7F3EA) — Background, with a very subtle paper grain texture and a faint dot-grid (2-3% opacity ink dots).
- **India Ink** (#211D19) — All primary text and line work. Never pure black.
- **Pencil Grey** (#8C857A) — Secondary text, captions, the dot-grid, hairlines.
- **Sealing Red** (#9E2B25) — THE accent: deep wax-seal/marking-ink red. Used for ONE thing per page maximum: the stamp "validé", a circled word, the active nav mark. Darker and nobler than tomato — think notary stamp, not ketchup.
- **Glue Shadow** (rgba(33,29,25,0.18)) — The tiny hard shadow under glued-in photos. 1px offset, never blurred beyond 2px.

No other colors exist. Photos provide all remaining color.

## 3. Typography Rules
- **Display:** Instrument Serif (Regular + Italic) — refined, slightly sharp editorial serif for headlines and place names. Headlines in lowercase italic feel like a question jotted down: "c'est quoi ce soir ?"
- **Annotations:** Caveat (or a refined handwriting style) — ONLY for the friend's personal notes about places, 1-2 lines max, like real margin notes: "la table du fond. évite le vendredi." Used sparingly — handwriting everywhere becomes kitsch; handwriting ONLY on the recommendation notes.
- **Body/UI:** Satoshi — small functional text, buttons, labels. Quiet and invisible.
- **Mono:** JetBrains Mono — distances, times, the deck counter "1/8", like typewriter stamps on an archive card.
- Hierarchy through size contrast and ink density, never through color variety or weight inflation.

## 4. Component Stylings
* **Swipe Cards (signature):** Index cards / small prints glued on the page — straight corners or barely rounded (0.25rem), Ivory slightly whiter than the background, hard 1px Glue Shadow. The photo fills the top like a real photographic print with a thin white border (like a developed photo). Swiping right slams a Sealing Red rubber stamp "VALIDÉ" diagonally across; left gets a Pencil Grey "bof" scribbled and crossed out. Cards rotate ±10° under the finger like flicking real cards.
* **Buttons:** Almost not buttons — underlined India Ink text links, or a thin-bordered rectangle like a form field on old stationery. ONE primary action per page may be a Sealing Red rectangle with Ivory text. Sharp corners. No pills.
* **Occasion Chips:** Words in a row, separated by interpuncts (·): "solo · première date · potes · rdv pro". The selected word is circled in Sealing Red — a hand-drawn ellipse, slightly imperfect. No pill backgrounds at all.
* **Place list ("ma carte"):** Like a notebook index — each line: place name in Instrument Serif, a dotted leader line (.....), distance in mono. Small glued photo thumbnail only on the focused/expanded entry. Archived places are struck through with a single ink line.
* **Bottom Navigation:** Three small India Ink icons drawn like single-line ink sketches (a star, a pin, two heads), on the page itself — the active one gets a small Sealing Red underline dash. No bar background, no boxes.
* **Map:** A vintage-engraved style monochrome map (ink lines on ivory), pins as small ink crosses, the selected place circled in Sealing Red by hand.
* **Empty States:** A nearly blank page with a single handwritten line: "rien ici. la rue t'attend."
* **Photos:** User-shot, imperfect, alive — the place, the dish, the toilets. Presented as glued prints with white borders. Never full-bleed backgrounds, never glossy.

## 5. Layout Principles
- Mobile portrait 390px. Each screen = one page of the notebook. NO top bar, NO hamburger, NO logo header — the page starts with the content.
- Wide margins (1.5rem+) like a fine notebook. One idea per page.
- Elements sit slightly off-grid (±2-4px, ±0.5° rotation on glued photos) — hand-placed, not templated. But text remains perfectly legible and straight.
- Deck of up to 8 swipe cards, ONE at a time, mono counter "1/8" stamped top-right. The app NEVER scrolls through suggestions.
- Thumb-zone actions bottom 40%, targets 48px+, min-h-[100dvh], safe-area respected.

## 6. Motion & Interaction
- Page transitions: a quick paper page-turn or slide, 250ms, ease-out. No fades into blur.
- The stamp hits with a fast scale-from-130% + tiny rotation settle — like a real stamp strike. One subtle haptic.
- Cards flick off-screen with spring physics (stiffness 100, damping 20), like tossing a card on a table.
- Nothing loops, nothing pulses, nothing shimmers. Stillness is the luxury.
- Transform/opacity only.

## 7. Anti-Patterns (Banned) — the anti-AI charter
- No gradients, no glows, no glassmorphism, no blur effects, no soft floating shadows.
- No dark mode, no neon, no yellow, no purple/blue.
- No pill-shaped everything, no rounded-2xl cards, no chip backgrounds.
- No hamburger menu, no centered app-name header, no avatar in a top bar.
- No star ratings, no scores, no leaderboards, no counters of points — ever.
- No emoji in UI. No Inter, no Georgia/Times, no generic handwriting overuse.
- No full-bleed hero photos with text overlaid. Photos are glued prints with borders.
- No glossy stock photography — everything looks shot by a member on their phone.
- No scroll-based discovery — one card at a time, the deck ends ("c'est tout ce que j'ai.").
- No perfect symmetric centering — placements feel human.
