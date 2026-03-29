# Enggan Ngoding -- Game Design Spec

## Overview

A PixiJS web game where you play as **Angga**, a developer who refuses to code. Instead, you type prompts into a fake AI terminal to make a game character complete objectives. The AI frequently "hallucinates," misinterpreting your prompts and causing chaotic visual glitches. All UI text in Bahasa Indonesia.

### Characters
- **Angga** -- The player. A developer who'd rather prompt AI than write code.
- **Ohim** -- Angga's manager. Assigns tickets and gets angry when deadlines are missed.
- **Mang Aris** -- The CTO. Oversees the tech team.
- **Mang Alif** -- The Founder. The big boss.

**Genre:** Prompt Debugger
**Platform:** Desktop browser only
**Stack:** PixiJS 8 + React 19 + TypeScript + Vite
**Architecture:** Hybrid -- PixiJS for game world & effects, React DOM for UI overlays
**Scope (v1):** 1 polished ticket/level as a prototype

---

## Core Gameplay Loop

1. Player receives a ticket (objective)
2. Player types a free-form Indonesian prompt into the terminal
3. Prompt is parsed for keywords
4. Each keyword has a chance to be "hallucinated" (misinterpreted)
5. The result plays out visually in the game world
6. Player refines prompts until the objective is met or they fail

---

## V1 Level: "Buat karakter berjalan ke bendera"

### Game World
- Simple 2D side-view scene
- Flat ground/platform
- Character sprite on the left
- Flag/goal sprite on the right
- Clean, modern, slightly cartoonish art style (not pixel art)

### Objective
Make the character walk to the flag using only prompts. The character has no default controls.

### Success Condition
Character sprite touches the flag sprite.

### Fail Conditions
- Timer reaches 0
- Coffee meter reaches 0

---

## Prompt Parser

Three-step process on each prompt submission:

### 1. Tokenize
Split input into lowercase words, strip punctuation.

### 2. Keyword Match
Check tokens against the level's keyword dictionary.

### 3. Hallucination Roll
For each matched keyword, roll a chance to misinterpret.

**Hallucination probability:**
- Base rate: 30%
- +5% per extra word beyond 3 words (the minimum useful prompt, e.g., "jalan ke kanan")
- -10% if Coffee > 75% (fresh coffee = clearer AI)
- Capped at 80% max

**If no keywords match:** AI "doesn't understand." Terminal shows `"ERROR: Saya tidak mengerti apa yang kamu mau..."`. Costs Coffee, nothing happens.

---

## Hallucination Dictionary (V1 Level)

| Keyword | Correct Effect | Hallucination Options |
|---|---|---|
| `jalan`/`gerak`/`maju` | Move character | Wander randomly, moonwalk, vibrate in place |
| `kanan` | Direction: right | Go left, go up, spin in circles |
| `kiri` | Direction: left | Go right, go down, flip sprite upside-down |
| `cepat` | Speed boost | Move at 0.01x speed, or 100x speed (flies off screen) |
| `bendera` | Target the flag | Target random object, or the flag runs away |

### Action Output Format

```ts
type Action = {
  action: 'move' | 'idle' | 'confused'
  direction?: 'left' | 'right' | 'up' | 'down' | 'random'
  speed?: number
  hallucinated: boolean
  flavor: string // AI reasoning text for terminal
  specialEffect?: 'moonwalk' | 'vibrate' | 'spin' | 'flip' | 'flyoff' | 'flag-runs'
}
```

---

## Resources & Fail States

### Coffee Meter
- Starts at 100%
- Each prompt costs ~15%
- Gives ~6-7 attempts per level
- Affects hallucination rate (higher coffee = lower hallucination chance)

### Timer
- 60 seconds per ticket (v1)
- Countdown displayed in HUD

### Results

- **Win:** Glitch effects clear, terminal shows `"Deploy berhasil!"`. Button: "Kembali ke Menu".
- **Lose (no coffee):** Screen dims, terminal shows `"Kopi habis... otak AI mati."`. Button: "Coba Lagi".
- **Lose (timeout):** Terminal fills with errors, shows `"DEADLINE TERLEWAT. OHIM Marah besar!"`. Button: "Coba Lagi".

"Coba Lagi" restarts with full Coffee and timer reset.

---

## State Machine

```
MENU -> BRIEFING -> PLAYING -> RESULT
                                  |
                                  v
                          MENU (win) or BRIEFING (retry)
```

### MENU
Title screen: "Enggan Ngoding" logo + "Mulai" button.

### BRIEFING
Ticket card from Ohim: objective text + "Terima Tiket" button. Shows Ohim's message like `"Angga, tolong kerjain ini sebelum deadline ya."`

### PLAYING
Core gameplay. Per prompt submission:
1. Player types prompt, presses Enter
2. Coffee decreases (-15%)
3. Terminal shows `"AI sedang berpikir..."` (~1s fake delay)
4. Parser runs
5. Terminal shows AI reasoning (flavor text)
6. Action executes in game world
7. Check win/fail conditions
8. Wait for next prompt

### RESULT
Win or lose screen with appropriate message and button.

---

## UI Layout (~1280x720)

```
┌─────────────────────────────────────────────────────┐
│  Kopi: ████████░░  |  Waktu: 00:45  |  Tiket #1    │  <- HUD (React)
├───────────────────────────────┬─────────────────────┤
│                               │  Terminal AI         │
│                               │                      │
│     Game World (PixiJS)       │  > AI sedang         │
│                               │    berpikir...       │
│   character ──────── flag     │                      │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       │  > Hmm, "jalan      │
│                               │    ke kanan"...      │
│                               │                      │
├───────────────────────────────┤  [scroll area]       │
│  Objective:                   │                      │
│  "Buat karakter berjalan      ├──────────────────────┤
│   ke bendera"                 │ > ketik prompt...    │
└───────────────────────────────┴──────────────────────┘
```

- **Left (~65%):** PixiJS canvas (top) + ticket objective (bottom, React)
- **Right (~35%):** Terminal log (scrollable, React) + text input (bottom, React)
- **HUD bar (top):** Coffee meter, timer, ticket label (React)

### Visual Effects

**PixiJS (game world):**
- Hallucination triggers: RGBSplitFilter + screen shake (~0.5s burst)
- Intensity scales with hallucination severity

**CSS (React terminal):**
- Text flicker/scramble on hallucination
- Momentary font swap or `text-shadow` glitch

---

## Technical Architecture

### File Structure

```
src/
  main.tsx              -- Entry point (existing)
  App.tsx               -- Root component, state machine (rewrite)
  game/
    GameWorld.tsx        -- PixiJS canvas: character, flag, ground, effects
    Character.tsx        -- Character sprite + movement logic
    GlitchEffects.ts    -- RGB split, shake, displacement filters
  ui/
    Menu.tsx             -- Title screen
    Briefing.tsx         -- Ticket card screen
    Terminal.tsx         -- AI terminal log + input
    HUD.tsx              -- Coffee bar, timer, ticket label
    Result.tsx           -- Win/lose screen
  engine/
    PromptParser.ts      -- Tokenizer + keyword matcher
    HallucinationEngine.ts -- Roll logic + effect mapping
    LevelData.ts         -- Ticket definitions, keyword dictionaries
  types/
    index.ts             -- Shared TypeScript types
public/
  assets/
    character/           -- Character sprites
    objects/             -- Flag, ground tiles
    ui/                  -- Logo, icons
```

### State Management

React `useReducer` in `App.tsx`. No external state library.

```ts
type GameState = {
  screen: 'menu' | 'briefing' | 'playing' | 'result'
  coffee: number          // 0-100
  timeLeft: number        // seconds
  terminalLog: TerminalEntry[]
  currentAction: Action | null
  result: 'win' | 'lose-coffee' | 'lose-time' | null
}
```

### Dependencies
No additional dependencies beyond existing: `pixi.js`, `@pixi/react`, `react`, `react-dom`. Glitch filters from pixi.js built-ins.

---

## Assets Needed

### Sprites (PixiJS)
- Player character: idle + walk animation (spritesheet)
- Flag on a pole
- Ground/platform tiles

### UI Assets
- "Enggan Ngoding" logo
- Coffee icon
- Timer icon
- Ticket card background

### Audio (optional, can skip for v1)
- Typing SFX
- Hallucination glitch SFX
- Win jingle
- Lose buzzer

### Art Direction
Clean, flat, slightly cartoonish. Bright colors, simple shapes. Modern indie game aesthetic.
