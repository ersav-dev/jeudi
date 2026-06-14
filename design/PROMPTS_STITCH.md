# Prompts Stitch / Gemini — Jeudi

## Mode d'emploi
1. Va sur **labs.google.com/stitch** → nouveau projet → mode **Mobile**.
2. **Premier message** : colle l'intégralité de `DESIGN.md` précédé de la ligne :
   *"Here is the design system for this app. Follow it strictly for every screen I ask for. Acknowledge and wait for my first screen request."*
3. Puis génère les écrans **un par un**, dans l'ordre ci-dessous (un prompt = un message). Itère sur chaque écran jusqu'à satisfaction avant de passer au suivant — Stitch garde la cohérence dans un même projet.
4. Exporte chaque écran validé (image + code Figma/HTML) dans `Jeudi_App/design/screens/`.
5. Astuce Gemini : si tu veux explorer des directions visuelles AVANT Stitch (moodboard), demande à Gemini *"generate a moodboard for a nocturnal Parisian going-out app, electric chartreuse accent on deep charcoal, premium not corporate"* et nourris Stitch avec ce que tu kiffes.

---

## Écran 1 — Onboarding "le swipe, c'est ta langue ?"

Mobile onboarding screen, dark Night Charcoal background. At the top-left, the headline in bold Satoshi, written like a text message: "le swipe, c'est ta langue ?" — lowercase, two lines, Bone White. Below it, slightly smaller in Muted Sage: "réponds comme tu veux. on s'adapte."

In the center: a single swipeable card (the signature swipe card style) containing just the word "oui" in large type — the card visibly tilted 4 degrees, with a subtle Electric Chartreuse edge glow on its right side suggesting it can be swiped right.

Below the card, two ghost pill buttons side by side: "oui" and "non".
At the very bottom, a discreet single-line text input with placeholder "ou écris-le, si t'insistes..." in Muted Sage italic.

The three answer methods (swipe card, buttons, text field) coexist on screen with clear spatial separation. No progress dots, no skip button, no logo. The screen should feel like a playful test, not a form.

---

## Écran 2 — "C'est quoi ce soir ?" (écran d'accueil)

Mobile home screen, Night Charcoal background. Top-left, large bold Satoshi headline: "c'est quoi ce soir ?" in Bone White, left-aligned, conversational.

Below: a horizontal scrolling row of occasion chips (pills): "solo", "première date", "potes", "rdv pro", "famille", "surprends-moi". The chip "solo" is selected — filled Electric Chartreuse with Night Charcoal text; the others are ghost pills with Whisper Line borders.

Below the chips: one secondary row in Muted Sage with mono details: current neighborhood "11e — Oberkampf" and time "19h42" in JetBrains Mono, offset right.

The bottom 50% of the screen: a single large primary swipe card preview of the first answer — full-bleed photo of a dim cozy bar, place name "Le Bisou" in bold, and a 2-line personal note in conversational French: "comptoir au fond, lumière parfaite. personne te jugera d'être seul." Distance "350m" in mono, bottom right of the card. Behind it, the edges of 2 more stacked cards are barely visible, suggesting a deck (up to 8 cards, shown ONE at a time — this app never scrolls, it swipes). A tiny mono deck counter sits top-right of the card: "1/8".

Bottom safe area: a minimal tab bar with 3 icons only: a spark (tonight), a map pin (ma carte), a circle of two heads (cercle). No labels, active icon in Electric Chartreuse.

---

## Écran 3 — Fiche lieu

Mobile place detail screen. Top 45%: full-bleed photo of an intimate Parisian restaurant interior, with a soft dark gradient at the bottom edge for legibility. Floating back chevron top-left.

Below the photo, on Night Charcoal: the place name "Chez Suzanne" in large bold Satoshi, Bone White. Underneath, the neighborhood and distance in JetBrains Mono, Muted Sage: "10e — canal · 600m".

Then the personal note, styled like a received text message (subtle Raised Slate bubble, left-aligned): "la table du fond à droite. évite le vendredi. parfait pour impressionner sans en faire trop." — attributed below in small Muted Sage: "ajouté par Karim · éclaireur du 10e".

Below the note: a row of occasion tags as small ghost chips: "première date", "rdv pro" — each with a tiny mono count like "x12" showing how many people validated this occasion.

A visibility indicator row: small icon + text "visible par ton cercle" in Muted Sage.

Bottom thumb-zone: two actions side by side — primary Chartreuse pill "j'y vais" and ghost pill with a share arrow "envoie à un pote". No stars, no rating, no reviews section anywhere.

---

## Écran 4 — Ma carte (collection)

Mobile collection screen. Full-bleed dark-styled city map of Paris (muted charcoal map tiles, no bright Google colors) covering the whole screen, with small Electric Chartreuse dots as place pins, clustered around the 10th and 11th arrondissements.

Over the map, a floating bottom sheet (Raised Slate, rounded top corners, grabber handle) pulled up to 55% height containing:
- Sheet header: "ma carte" in bold Satoshi with a mono counter offset right: "47 spots".
- A horizontal filter row of small chips: "tout", a lock-icon chip "pour moi", "cercle", "public" — "tout" selected in Chartreuse.
- A vertical list of 3 place cards (photo left 96px rounded, name + one-line note right, distance in mono bottom-right, small visibility icon top-right of each card): "Le Bisou — comptoir parfait en solo", "Chez Suzanne — la table du fond", "Bar à Jules — que pour les potes, bruyant et génial".
- One place card has a subtle Soft Alert left border and a small label "ce spot dort — on l'archive ?" with two tiny ghost actions "garde" / "archive".

Floating action button bottom-right above the sheet: Chartreuse circle with a plus icon (capture a place).

---

## Écran 5 — Swipe de validation (le lendemain)

Mobile validation screen, Night Charcoal, focused single-task layout. Top-left small Muted Sage context line in mono: "hier soir · 23h12". Below, the headline in bold conversational Satoshi: "alors, Le Bisou ?" in Bone White.

Center: one large swipe card with the place photo and name. The card is mid-gesture, tilted 8 degrees to the right, its right edge glowing Electric Chartreuse with a stamped-style label appearing on the photo: "je valide" in bold. (A faint hint on the left edge shows the alternative "bof" in Soft Alert.)

Below the card, a preview of the NEXT step as small stacked question chips waiting their turn, slightly blurred/dimmed: "pour une première date ?", "en solo ?", "avec les potes ?" — suggesting the 5-second follow-up flow.

At the bottom, a tiny ghost text button in Muted Sage: "j'y suis pas allé". No other navigation visible — this screen is a one-second toll, not a form.

---

## Écran 6 (bonus) — Sortie de groupe / triangulation

Mobile group outing screen. Top headline: "on se voit où ?" bold Satoshi. Below, three small avatar chips in a row with French names "toi", "Karim", "Léa", each with a mono location tag underneath: "Bastille", "République", "Pigalle".

Center: dark map fragment showing three soft dots connected by thin Whisper lines to a glowing Chartreuse zone in the middle labeled "pile entre vous" in mono.

Bottom sheet pulled up showing 3 proposed place cards, each with a small stack of mini avatars showing who already swiped yes — first card shows "2/3 ont matché" in mono with a Chartreuse progress feel. Primary action on the first card: Chartreuse pill "swipe pour matcher".

---

## Checklist de validation avant de me ramener les screens
- [ ] Le jaune chartreuse est RARE sur chaque écran (un néon, pas une guirlande)
- [ ] Aucune étoile, note, score visible nulle part
- [ ] Les textes parlent comme un pote ("alors, t'as validé ?"), pas comme un service
- [ ] La carte swipable donne envie d'être attrapée (profondeur, inclinaison)
- [ ] Tout est utilisable au pouce, une main, en marchant
