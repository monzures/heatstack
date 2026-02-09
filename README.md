# HEATSTACK

HEATSTACK is a rapid arcade word game: build 5-letter words from a live rack, chain overlaps to raise combo, and keep reactor heat alive before the clock ends.

## Why It Is Not Wordle

- No hidden answer to discover.
- Real-time score attack (60-75 seconds), not turn-based guessing.
- Combo system based on overlap with your previous word.
- Dynamic rack generation between submissions.
- Daily seeded run (Pacific day reset) + replayable Blitz mode.

## Modes

- `Daily Reactor`
  - 75 seconds
  - One official run per Pacific day (`America/Los_Angeles`)
  - Shared daily modifier/twist
  - Medal tiers: Bronze `>=1400`, Silver `>=2200`, Gold `>=3200`
- `Blitz Reactor`
  - 60 seconds
  - Unlimited runs
  - Best score tracked locally

## Core Rules

1. Build a 5-letter word using only the current rack letters.
2. Word must be in the curated playable dictionary.
3. Reusing a word in the same run is rejected.
4. Combo increases when the new word shares at least 2 letters with the previous word (multiset overlap).
5. Heat decays constantly; higher heat tiers have higher multipliers and faster decay rates.
6. Valid 5-letter words auto-submit when the stage fills.
7. Hint trail reveals after 10s on the same rack.

## Scoring

- Base:
  - `80 + uniqueLetters*8 + rerollChargesLeft*6`
- Heat multiplier:
  - `1.0` for heat `0-24`
  - `1.25` for heat `25-49`
  - `1.55` for heat `50-74`
  - `1.9` for heat `75-100`
- Bonuses:
  - Combo bonus: `combo * 14`
  - Quick-play bonus: up to `+45` based on rack solve speed

## Heat Model

- Starts at `25` (or `45` on `Surge Start` days).
- Decay (per second) scales by current heat:
  - `2.6` at heat `0-24`
  - `3.0` at heat `25-49`
  - `3.6` at heat `50-74`
  - `4.4` at heat `75-100`
- Daily modifier `Heat Bleed +20%` multiplies decay by `1.2`.
- Valid word heat gain: `13 + min(16, 3*(combo-1))`.

## Reroll Economy

- You start each run with `4` reroll charges.
- `Re-roll` costs `1` charge.
- `Auto Fill` costs `2` charges and applies a heat penalty.
- Charges persist across the full run (they do not reset every word).

## Daily Modifiers

Each Pacific day has a seeded modifier shared by all players:

- `Heat Bleed +20%`
- `No Rerolls`
- `Surge Start` (+20 starting heat)

## Sharing

Run share text includes:

- Mode and day label
- Score + max combo + medal
- Daily twist name
- Heat sparkline
- Top chain summary
- Challenge line
- Verification token

## Controls

- Tap/click rack letters to stage a word.
- Keyboard:
  - `A-Z`: stage matching rack letter
  - `1-5`: toggle rack die by position
  - `Backspace`: remove last staged letter
  - `Enter`: submit staged word (if full)
  - `Esc`: clear stage

## Local Development

```bash
npm install
npm run dev
```

## Quality Checks

```bash
npm run lint
npm run test
npm run build
```

## Tech Stack

- React 19 + TypeScript + Vite
- Zustand state management
- Motion animations
- Tailwind CSS v4
- Lucide icons + Sonner toasts
