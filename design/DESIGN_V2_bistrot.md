# Design System: Jeudi — Direction "Papier de bistrot"

> Alternative à la DA nocturne (DESIGN.md). À coller dans un NOUVEAU projet Stitch (mode Mobile) avec la phrase : "Here is the design system. Follow it strictly for every screen. Acknowledge and wait for my first screen request." Puis utiliser les mêmes prompts d'écrans (PROMPTS_STITCH.md) — Stitch les adaptera à ce système.

## 1. Visual Theme & Atmosphere
A warm, editorial mobile interface that feels like the address book of a friend with great taste — paper, ink, and one confident stamp of color. Think of a Parisian bistro paper placemat redesigned by a modern studio: cream surfaces, warm black ink, generous typography that loves words. The voice is a sharp friend who teases you — and here, the WORDS carry the design, like handwritten notes between friends. Density 4/10. Variance 7/10 — asymmetric, editorial, never centered. Motion 6/10 — physical swipe cards remain the soul, but they feel like flicking through a stack of paper cards.

CRITICAL: this is NOT a dark app. No neon, no glow, no gaming aesthetics. It is daylight-warm, confident — like print design brought to life. No hamburger menus, no centered top app bar with logo: screens open directly on content.

## 2. Color Palette & Roles
- **Cream Paper** (#F4EFE6) — Primary background. Warm, never sterile white.
- **Warm Ink** (#1C1917) — Primary text and strong UI elements. Never pure black.
- **Faded Ink** (#78716C) — Secondary text, metadata, attributions.
- **Tomato Stamp** (#D2451E) — THE single accent, used like a rubber stamp on paper: primary CTA, selected swipe direction "je valide". Rare and confident.
- **Bottle Green** (#2D4A3E) — Reserved for confirmations and the "validated" state only.
- **Pencil Line** (rgba(28,25,23,0.12)) — 1px rules and dividers, like ruled paper.
- **Card Surface** (#FFFDF8) — Place cards and sheets, slightly lighter than canvas.

(No gradients anywhere. No shadows except a paper-like 1-2px offset under swipe cards.)

## 3. Typography Rules
- **Display:** Fraunces (Bold, soft optical size) — for place names and headlines. Editorial, characterful, like a bistro menu. Headlines conversational lowercase: "c'est quoi ce soir ?"
- **Body/UI:** Satoshi (Regular/Medium) — clean grotesque for notes, buttons, chips.
- **Mono:** JetBrains Mono — distances ("450m"), times ("19h42"), counters ("1/8"), arrondissements ("11e").
- The personal notes about places are the heroes: set them large (1.05rem+), in Warm Ink, like a handwritten recommendation. Attribution below in Faded Ink: "— Karim, éclaireur du 10e".
- Banned: Inter, Georgia/Times, any font not listed above.

## 4. Component Stylings
* **Swipe Cards (signature):** Paper cards (#FFFDF8) with 1rem radius, a thin Pencil Line border, and a subtle 2px paper-stack offset shadow. Photo at top with slightly rounded corners INSET in the card (like a printed photo glued on). Swiping right reveals a Tomato Stamp "je valide" stamped diagonally like an ink stamp; left reveals a Faded Ink "bof" stamp. Cards rotate ±10° with the finger.
* **Buttons:** Primary = Warm Ink fill, Cream text, pill shape. The Tomato Stamp fill is reserved for ONE hero action per screen max. Secondary = ghost with Pencil Line border. Press = -1px translate.
* **Occasion Chips:** Pills with Pencil Line borders on Cream; selected chip = Warm Ink fill with Cream text (NOT tomato — the accent stays rare). Horizontal row, mono labels lowercase.
* **Place Cards (list):** Photo left (rounded 0.75rem, 88px), Fraunces name + one-line Satoshi note, mono distance bottom-right. Visibility icon (lock / two heads / globe) small, top-right, Faded Ink.
* **Bottom Navigation:** 3 icons only (spark, map pin, circle of friends), Warm Ink on Cream, active = Tomato dot under the icon. No labels, no boxes around icons.
* **Bottom Sheet:** Card Surface, rounded top 1.25rem, grabber, Pencil Line top border.
* **Empty States:** Typographic and cheeky, set in Fraunces: "t'as encore rien capturé. la rue t'attend." One ghost CTA.
* **Photos:** Real-life amateur framing (the app requires user-taken photos: the place, the dish/drink, even the toilets) — never glossy stock-restaurant photography.

## 5. Layout Principles
- Mobile portrait 390px. Screens open directly on the headline — NO top app bar, NO hamburger menu, NO centered logo header.
- Headlines left-aligned Fraunces; key data offset right in mono. Asymmetry as default.
- Answer = a deck of up to 8 swipe cards shown ONE at a time with a mono counter "1/8". This app NEVER scrolls through suggestions — it swipes. Lists exist only in "ma carte" (the collection).
- Generous margins (1.25rem+), thumb-zone actions in bottom 40%, touch targets 48px+, min-h-[100dvh], safe-area insets.

## 6. Motion & Interaction
- Spring physics (stiffness 100, damping 20). Cards follow the finger 1:1.
- The stamp ("je valide" / "bof") appears with a quick scale-in like a real rubber stamp hit.
- Staggered 80ms cascade for list items. Chips pulse subtly on selection.
- Transform/opacity only. 60fps non-negotiable.

## 7. Anti-Patterns (Banned)
- No dark backgrounds, no neon, no glows, no gradients.
- No yellow — this direction has no yellow at all.
- No hamburger menu, no centered top bar with app name, no profile avatar in a header.
- No star ratings, no /5 scores, no leaderboards, no point counters — ever.
- No emoji in UI chrome. No Inter. No pure black (#000000).
- No 3-column grids, no centered hero compositions, no "Découvrez/Explorez" copy.
- No glossy AI-restaurant stock photos — photos look user-taken, imperfect, alive.
- No scroll-based discovery: suggestions are always a one-at-a-time card deck.
