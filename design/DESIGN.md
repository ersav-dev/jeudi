# Design System: Jeudi — l'app pour sortir

## 1. Visual Theme & Atmosphere
A nocturnal, confident mobile interface for going out in the city — solo or with close friends. The atmosphere is "a sharp friend who teases you": warm, direct, a little cheeky, never corporate. Think of a dimly lit Parisian bar at 11pm rendered as an interface: deep charcoal surfaces, one electric yellow accent like a neon sign, generous breathing room around bold statements. Density is balanced (4/10) — this is a daily app, not a dashboard. Variance is high (7/10): asymmetric layouts, offset elements, nothing centered by default. Motion is fluid and physical (7/10): everything responds to the thumb like a real card under a finger — the swipe gesture is the soul of this app.

The app is mobile-first, portrait, designed for one-handed use while walking in the street. Every screen must feel decisive: this app gives 1-3 answers, never lists.

## 2. Color Palette & Roles
- **Night Charcoal** (#0E1413) — Primary background surface. Deep green-tinted near-black, never pure black.
- **Raised Slate** (#1A2120) — Cards, sheets, and elevated containers.
- **Bone White** (#FAFAF7) — Primary text on dark surfaces.
- **Muted Sage** (#8A9490) — Secondary text, metadata, distances, timestamps.
- **Whisper Line** (rgba(250,250,247,0.08)) — 1px structural borders and dividers.
- **Electric Chartreuse** (#E8E337) — The single accent. CTAs, active swipe direction, selected occasion chips, focus states. Used sparingly — like one neon sign on a dark street, not a light show.
- **Validation Green** (#5BBF7A) — Reserved exclusively for "recommended / validated" confirmations.
- **Soft Alert** (#D96C5F) — Reserved exclusively for "removed from the map / archive" states.

(Max 1 accent in any composition. No purple, no blue glows, no gradients on text.)

## 3. Typography Rules
- **Display:** Satoshi (Bold/Black) — Track-tight, weight-driven hierarchy. Headlines speak like SMS messages: short, punchy, lowercase-friendly. Example: "c'est quoi ce soir ?"
- **Body:** Satoshi (Regular/Medium) — Relaxed leading (1.6), max 60ch. Conversational French copy.
- **Mono:** JetBrains Mono — Distances ("450m"), times ("19h30"), counters ("3 invites"), neighborhood tags ("11e").
- **Banned:** Inter, system fonts, all generic serifs. No font mixing beyond these three.
- App voice in all UI copy: short French sentences, friendly teasing tone, like a text from a friend. "Alors, t'as validé ?" — never "Veuillez évaluer votre expérience".

## 4. Component Stylings
* **Swipe Cards (signature component):** Full-width rounded cards (1.5rem radius) with the place photo bleeding edge-to-edge at top, name + 2-line personal note below. Card tilts physically with the gesture. Swipe right edge glows Electric Chartreuse ("je valide"), swipe left edge tints Soft Alert ("bof"). The card must look grabbable — subtle depth, never flat.
* **Buttons:** Flat fills, fully rounded (pill). Primary = Electric Chartreuse fill with Night Charcoal text. Secondary = ghost with Whisper Line border. Tactile -1px translate on press. No outer glow.
* **Occasion Chips:** Horizontal scroll row of pills — "solo date", "première date", "potes", "rdv pro", "famille". Selected chip fills Chartreuse, others ghost. These are the main navigation of the app.
* **Place Cards (list):** Photo left (rounded 1rem, 96px), name + one-line note right, distance in mono bottom-right. Visibility level shown as a small icon: lock (private) / two heads (friends) / globe (public).
* **Inputs:** Label above, Raised Slate fill, no visible border until focus (Chartreuse ring). One single text field max per screen — this app asks, the user swipes.
* **Bottom Sheet:** Primary navigation pattern. Slides up over the map with spring physics, grabber handle, rounded 1.5rem top corners.
* **Loaders:** Skeletal shimmer in Raised Slate matching layout. No spinners.
* **Empty States:** Composed and cheeky — e.g. an empty collection says "t'as encore rien capturé. la rue t'attend." with a single CTA. Never "No data".

## 5. Layout Principles
- Mobile portrait first (390px reference). Single column. Map screens are full-bleed with floating bottom sheet.
- Asymmetric by default: headlines left-aligned, key numbers offset right in mono.
- The answer screens show 1 to 3 place cards maximum — stacked vertically with generous gaps (1.5rem), never a grid, never a scrolling list of 20 items.
- Touch targets minimum 48px. Thumb-zone: all primary actions in the bottom 40% of the screen.
- Full-height uses min-h-[100dvh]. Safe-area insets respected (iPhone notch / home indicator).

## 6. Motion & Interaction
- Spring physics everywhere (stiffness 100, damping 20). The swipe card follows the finger 1:1 with rotation up to ±12°, then springs off-screen or back.
- Staggered reveals: the 1-3 answer cards cascade in with 80ms delays.
- Occasion chips have a subtle scale pulse on selection.
- The "c'est quoi ce soir ?" headline types in like a message being written (one-time, fast).
- Animate only transform and opacity. 60fps on mid-range phones is non-negotiable.

## 7. Anti-Patterns (Banned)
- No emojis in the UI chrome (the friend tone comes from words, not party-popper icons).
- No Inter, no generic serifs, no pure black (#000000).
- No purple/blue neon, no gradient text, no outer glows except the swipe edge tint.
- No star ratings, no /5 scores, no leaderboards, no point counters — ever (product rule).
- No 3-column card grids, no centered hero layouts.
- No generic copy: "Découvrez", "Explorez", "Élevez votre expérience" are banned. The app talks like a friend.
- No fake names ("John Doe") — use plausible French first names (Karim, Léa, Sofiane, Jeanne) and real-sounding Paris places (use picsum.photos for photos).
- No "swipe to explore" hints with bouncing arrows — the gesture is taught by the onboarding, not by chrome.
