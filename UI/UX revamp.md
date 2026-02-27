# UI/UX Revamp Direction - We're Not Really Strangers (Digital)

## North Star
Create a digital card game that looks and feels like handling real physical cards. Every interaction should mimic what you'd do with an actual deck on a table — flip cards, fan them out, stack them. No abstract glows or "app-like" UI. Just cards on cloth.

## Core Experience
- Cards look like real printed cards with thickness, edges, and shadows.
- The surface looks like actual fabric you'd play cards on.
- Animations replicate real physical card movements.
- Controls are minimal — the cards themselves are the interface.
- It should feel like you reached through the screen and touched the deck.

## Visual Style: Realistic / Skeuomorphic

### Cards
- Realistic card proportions with visible thickness (stacked cards show depth).
- Subtle paper texture on card faces.
- Rounded corners matching real playing cards.
- Soft drop shadows that shift based on card position/height.
- Each deck has a distinct back design with the category color and pattern.

### Surface
- Soft fabric tablecloth texture (linen or velvet).
- Warm, muted tone — cream, soft gray, or dusty rose.
- Subtle woven texture visible up close.
- Gentle ambient shadow around edges (natural vignette).

### Color Palette
- Surface: warm neutral fabric tone
- Perception deck: coral red
- Connection deck: warm amber/gold
- Reflection deck: soft violet
- Wild Card deck: forest green
- Card faces: off-white / cream with dark text

### Typography
- Card text: clean serif or elegant sans-serif, easy to read
- Deck labels: subtle, embossed look on card backs
- UI text: minimal, only where necessary

## Layout: Horizontal Deck Row

### Structure
```
┌─────────────────────────────────────────────────┐
│  Title (small, top center)                      │
├─────────────────────────────────────────────────┤
│                                                 │
│   [Perception] [Connection] [Reflection] [Wild]│
│      deck         deck         deck       deck │
│                                                 │
│                  ┌─────────┐                    │
│                  │ Drawn   │  (when card drawn) │
│                  │ Card    │                    │
│                  └─────────┘                    │
│                                                 │
│   [Discard pile]              [Controls]        │
│   (bottom left)               (bottom right)    │
└─────────────────────────────────────────────────┘
```

- Four decks arranged in a horizontal row, evenly spaced.
- Each deck is a visible stack (5-7 cards showing depth).
- Drawn card appears in center area, face-up.
- Discard pile in bottom-left corner, cards stack visibly.
- Minimal controls (Shuffle, Random, Reset) tucked in bottom-right.

### Deck Appearance
- Stacked cards with slight offset showing thickness.
- Top card has a subtle lift on hover (ready to draw).
- Empty deck shows just the cloth surface with a faint outline.
- Card count displayed subtly near each deck.

## Interaction Model

### Selecting a Deck
- Click once on any deck to select it.
- Selected deck: top card lifts slightly, gentle shadow increase.
- No glows — just physical lift like you're about to grab the card.

### Drawing a Card
- Click the selected deck again to draw.
- **Flip reveal animation**: Top card lifts, rotates in 3D, flips face-up.
- Card moves to center stage area, now readable.
- The deck underneath shows the next card (or empty state).

### Shuffle Animation: Fan & Restack
When shuffle is triggered:
1. Cards fan out in an arc (like spreading cards on a table).
2. Brief pause — cards are visibly spread.
3. Cards sweep back together into a neat stack.
4. Deck is now shuffled.

This should take ~1.5 seconds and feel satisfying and real.

### Discard Animation
- Player taps "Discard" or swipes the card away.
- Card slides/tosses toward discard pile in corner.
- Card lands on pile with a soft settling motion.
- Pile visibly grows as cards accumulate.

### Random Pick
- A deck is randomly selected (subtle highlight or bounce).
- Then immediately performs the flip-reveal draw.
- Feels like someone else picked for you.

## Motion Language

### Principles
- **Physics-based**: Cards have weight and momentum.
- **Realistic timing**: Not too fast (feels cheap), not too slow (feels laggy).
- **No magic**: Cards don't glow, pulse, or do anything they couldn't do in real life.

### Specific Animations
| Action | Animation | Duration |
|--------|-----------|----------|
| Hover deck | Top card lifts 4px | 150ms |
| Select deck | Card lifts 8px + shadow deepens | 200ms |
| Draw (flip) | Lift → rotate Y 180° → settle in center | 500ms |
| Shuffle (fan) | Fan out arc → pause → sweep back | 1200-1500ms |
| Discard | Slide to pile + slight rotation | 400ms |
| Card lands | Small bounce/settle | 150ms |

### Easing
- Use ease-out for movements toward resting position.
- Use ease-in-out for flips and rotations.
- Avoid linear easing (feels robotic).

## Controls

### Minimal UI
- **Shuffle**: Small button or icon, bottom-right. Only active when deck selected.
- **Random Pick**: Icon button. Chooses random deck and draws.
- **Reset**: Text link or small icon. Confirms before resetting.

### Control Style
- Buttons look like subtle fabric labels or embossed tags.
- Not "app buttons" — more like physical table accessories.
- Disabled state: faded, non-interactive appearance.

## States

### Deck States
- **Full**: Thick stack, ready to draw.
- **Partial**: Thinner stack, count visible.
- **Empty**: No cards, just cloth with faint deck outline.
- **Selected**: Top card lifted, enhanced shadow.

### Card States
- **Face-down**: Shows deck back design.
- **Face-up**: Shows question text.
- **Discarded**: In the discard pile, slightly rotated/stacked.

### Game States
- **Ready**: All decks available, waiting for selection.
- **Card drawn**: One card face-up in center, discard button available.
- **All done**: All decks empty, show "Reset to play again" message.

## UX Copy
- Keep it minimal and warm.
- Examples:
  - "Tap a deck to begin."
  - "Perception — tap again to draw."
  - "Discuss, then discard when ready."
  - "All cards played. Reset to start fresh."

## What NOT to Do
- No glowing effects or neon highlights.
- No floating UI panels over the table.
- No progress bars or level indicators.
- No bouncy/cartoon animations.
- No "card game app" chrome — this is a table with cards, not a mobile game.

## Quality Bar
- Screenshot should look like a photo of cards on a real table.
- Someone should ask "wait, is this a real photo or digital?"
- Animations should feel like watching someone handle cards.
- First-time users understand it immediately — it's cards, you pick them up.

## Future Enhancements
- Subtle cloth texture parallax on device tilt (mobile).
- Soft ambient sounds: card flicks, shuffle swoosh, card landing.
- "Table themes": linen, velvet, leather surface options.
- Hand cursor that looks like actual fingers approaching cards.
- Drag-to-draw as alternative to click-click.
