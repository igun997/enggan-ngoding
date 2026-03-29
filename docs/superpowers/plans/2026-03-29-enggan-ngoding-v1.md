# Enggan Ngoding V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single playable level where the player types Indonesian prompts to control a character, with a hallucination engine that comedically misinterprets keywords.

**Architecture:** Hybrid React + PixiJS. React handles all UI (menu, terminal, HUD, result screens) as DOM overlays. PixiJS handles the game world (character, flag, ground, visual effects). State managed via `useReducer` in `App.tsx`. The engine layer (parser + hallucination) is pure TypeScript with no framework dependencies.

**Tech Stack:** PixiJS 8, @pixi/react, React 19, TypeScript, Vite

**Spec:** `docs/superpowers/specs/2026-03-29-enggan-ngoding-game-design.md`

---

## File Structure

```
src/
  main.tsx                     -- Entry point (existing, minor update)
  App.tsx                      -- Root component, useReducer state machine, screen routing
  game/
    GameWorld.tsx               -- PixiJS Application + canvas: ground, character, flag
    Character.tsx               -- @pixi/react component: character sprite + movement + special effects
    GlitchEffects.ts            -- Functions to trigger glitch filters on a PixiJS Container
  ui/
    Menu.tsx                    -- Title screen: logo + "Mulai" button
    Briefing.tsx                -- Ticket card from Ohim + "Terima Tiket" button
    Terminal.tsx                -- AI terminal: scrollable log + text input
    HUD.tsx                     -- Coffee bar, timer countdown, ticket label
    Result.tsx                  -- Win/lose screen with message + button
  engine/
    PromptParser.ts             -- tokenize() + matchKeywords()
    HallucinationEngine.ts      -- rollHallucination() + buildAction()
    LevelData.ts                -- Level 1 keyword dictionary + hallucination entries
  types/
    index.ts                    -- All shared types: GameState, Action, TerminalEntry, Level, etc.
public/
  style.css                     -- Global styles (existing, extend)
  assets/
    character-idle.png          -- Character idle sprite
    character-walk.png          -- Character walk sprite (or spritesheet)
    flag.png                    -- Flag goal sprite
    ground.png                  -- Ground tile (tileable)
```

---

## Task 1: Types & Data Definitions

**Files:**
- Create: `src/types/index.ts`
- Create: `src/engine/LevelData.ts`

- [ ] **Step 1: Create shared types**

Create `src/types/index.ts`:

```ts
export type Screen = 'menu' | 'briefing' | 'playing' | 'result';
export type ResultType = 'win' | 'lose-coffee' | 'lose-time' | null;

export type TerminalEntry = {
  id: number;
  type: 'player' | 'ai' | 'error' | 'system';
  text: string;
};

export type SpecialEffect =
  | 'moonwalk'
  | 'vibrate'
  | 'spin'
  | 'flip'
  | 'flyoff'
  | 'flag-runs';

export type Action = {
  action: 'move' | 'idle' | 'confused';
  direction?: 'left' | 'right' | 'up' | 'down' | 'random';
  speed?: number;
  hallucinated: boolean;
  flavor: string;
  specialEffect?: SpecialEffect;
};

export type HallucinationOption = {
  action: Action;
  weight: number; // higher = more likely to be picked
};

export type KeywordEntry = {
  keywords: string[]; // e.g. ['jalan', 'gerak', 'maju']
  category: string; // e.g. 'movement', 'direction', 'speed', 'target'
  correctAction: Partial<Action>; // merged into final action when no hallucination
  hallucinations: HallucinationOption[];
};

export type Level = {
  id: number;
  title: string;
  objective: string;
  ohimMessage: string;
  timerSeconds: number;
  coffeeCost: number; // per prompt
  keywordEntries: KeywordEntry[];
  defaultAction: Action; // when no keywords matched
};

export type GameState = {
  screen: Screen;
  coffee: number; // 0-100
  timeLeft: number; // seconds
  terminalLog: TerminalEntry[];
  currentAction: Action | null;
  result: ResultType;
  isProcessing: boolean; // true during "AI sedang berpikir..."
  characterX: number; // character position (0-100, percentage of ground width)
  flagX: number; // flag position
};

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'ACCEPT_TICKET' }
  | { type: 'SUBMIT_PROMPT'; action: Action; coffeeCost: number }
  | { type: 'SET_PROCESSING'; isProcessing: boolean }
  | { type: 'ADD_TERMINAL'; entry: Omit<TerminalEntry, 'id'> }
  | { type: 'EXECUTE_ACTION'; action: Action }
  | { type: 'TICK_TIMER' }
  | { type: 'UPDATE_CHARACTER_X'; x: number }
  | { type: 'CHECK_WIN' }
  | { type: 'SET_RESULT'; result: ResultType }
  | { type: 'RETRY' }
  | { type: 'BACK_TO_MENU' };
```

- [ ] **Step 2: Create Level 1 data**

Create `src/engine/LevelData.ts`:

```ts
import { Level } from '../types';

export const LEVEL_1: Level = {
  id: 1,
  title: 'Tiket #1',
  objective: 'Buat karakter berjalan ke bendera',
  ohimMessage: 'Angga, tolong kerjain ini sebelum deadline ya.',
  timerSeconds: 60,
  coffeeCost: 15,
  keywordEntries: [
    {
      keywords: ['jalan', 'gerak', 'maju', 'bergerak', 'berjalan'],
      category: 'movement',
      correctAction: { action: 'move', speed: 1 },
      hallucinations: [
        {
          action: {
            action: 'move',
            direction: 'random',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Gerak? Oke, aku gerakkan ke... mana ya? Biar random aja."',
          },
          weight: 3,
        },
        {
          action: {
            action: 'move',
            direction: 'left',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Jalan... jalan-jalan? Oke aku jalan mundur aja ya."',
            specialEffect: 'moonwalk',
          },
          weight: 2,
        },
        {
          action: {
            action: 'idle',
            hallucinated: true,
            flavor: 'AI: "Gerak? Maksudnya getar di tempat? Oke."',
            specialEffect: 'vibrate',
          },
          weight: 2,
        },
      ],
    },
    {
      keywords: ['kanan'],
      category: 'direction',
      correctAction: { direction: 'right' },
      hallucinations: [
        {
          action: {
            action: 'move',
            direction: 'left',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Kanan? Hmm, kanan dari sudut pandang siapa? Aku pilih kiri."',
          },
          weight: 3,
        },
        {
          action: {
            action: 'move',
            direction: 'up',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Kanan itu... atas? Aku agak bingung arah."',
          },
          weight: 2,
        },
        {
          action: {
            action: 'idle',
            hallucinated: true,
            flavor: 'AI: "Kanan... kanan... *berputar-putar* mana ya kanan?"',
            specialEffect: 'spin',
          },
          weight: 2,
        },
      ],
    },
    {
      keywords: ['kiri'],
      category: 'direction',
      correctAction: { direction: 'left' },
      hallucinations: [
        {
          action: {
            action: 'move',
            direction: 'right',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Kiri? Maksudnya kebalikan kiri, alias kanan? Oke!"',
          },
          weight: 3,
        },
        {
          action: {
            action: 'move',
            direction: 'down',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Kiri itu bawah kan? Sama aja."',
          },
          weight: 2,
        },
        {
          action: {
            action: 'idle',
            hallucinated: true,
            flavor: 'AI: "Kiri? *sprite terbalik* Ini udah bener kan?"',
            specialEffect: 'flip',
          },
          weight: 1,
        },
      ],
    },
    {
      keywords: ['cepat', 'cepet', 'lari'],
      category: 'speed',
      correctAction: { speed: 2 },
      hallucinations: [
        {
          action: {
            action: 'move',
            speed: 0.01,
            hallucinated: true,
            flavor: 'AI: "Cepat? Oke, cepat versi siput. Teknisnya tetap bergerak."',
          },
          weight: 3,
        },
        {
          action: {
            action: 'move',
            speed: 100,
            hallucinated: true,
            flavor: 'AI: "CEPAAAAT! *karakter terbang keluar layar*"',
            specialEffect: 'flyoff',
          },
          weight: 2,
        },
      ],
    },
    {
      keywords: ['bendera', 'flag', 'tujuan', 'target'],
      category: 'target',
      correctAction: { direction: 'right' }, // flag is always to the right
      hallucinations: [
        {
          action: {
            action: 'move',
            direction: 'random',
            speed: 1,
            hallucinated: true,
            flavor: 'AI: "Bendera? Bendera yang mana? Aku cari random aja."',
          },
          weight: 3,
        },
        {
          action: {
            action: 'idle',
            hallucinated: true,
            flavor: 'AI: "Bendera? Oke aku pindahkan benderanya. *bendera kabur*"',
            specialEffect: 'flag-runs',
          },
          weight: 2,
        },
      ],
    },
  ],
  defaultAction: {
    action: 'confused',
    hallucinated: false,
    flavor: 'ERROR: Saya tidak mengerti apa yang kamu mau...',
  },
};

export const LEVELS: Level[] = [LEVEL_1];
```

- [ ] **Step 3: Verify files compile**

Run: `cd /home/nst/WebstormProjects/enggan-ngoding && npx tsc --noEmit src/types/index.ts src/engine/LevelData.ts 2>&1 | head -20`

Expected: No errors (or only errors about missing imports that will be resolved in later tasks).

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/engine/LevelData.ts
git commit -m "feat: add game types and level 1 data definitions"
```

---

## Task 2: Prompt Parser & Hallucination Engine

**Files:**
- Create: `src/engine/PromptParser.ts`
- Create: `src/engine/HallucinationEngine.ts`

- [ ] **Step 1: Create PromptParser**

Create `src/engine/PromptParser.ts`:

```ts
import { KeywordEntry } from '../types';

export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

export function matchKeywords(
  tokens: string[],
  entries: KeywordEntry[]
): KeywordEntry[] {
  const matched: KeywordEntry[] = [];
  for (const entry of entries) {
    const found = entry.keywords.some((kw) => tokens.includes(kw));
    if (found) {
      matched.push(entry);
    }
  }
  return matched;
}
```

- [ ] **Step 2: Create HallucinationEngine**

Create `src/engine/HallucinationEngine.ts`:

```ts
import { Action, HallucinationOption, KeywordEntry, Level } from '../types';
import { matchKeywords, tokenize } from './PromptParser';

const BASE_HALLUCINATION_RATE = 0.3;
const EXTRA_WORD_PENALTY = 0.05;
const MINIMUM_WORDS = 3;
const COFFEE_BONUS_THRESHOLD = 75;
const COFFEE_BONUS = 0.1;
const MAX_HALLUCINATION_RATE = 0.8;

function calculateHallucinationRate(
  tokenCount: number,
  coffee: number
): number {
  let rate = BASE_HALLUCINATION_RATE;
  const extraWords = Math.max(0, tokenCount - MINIMUM_WORDS);
  rate += extraWords * EXTRA_WORD_PENALTY;
  if (coffee > COFFEE_BONUS_THRESHOLD) {
    rate -= COFFEE_BONUS;
  }
  return Math.min(MAX_HALLUCINATION_RATE, Math.max(0, rate));
}

function pickWeightedRandom(options: HallucinationOption[]): Action {
  const totalWeight = options.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) {
      return option.action;
    }
  }
  return options[options.length - 1].action;
}

function mergeCorrectActions(matched: KeywordEntry[]): Action {
  const base: Action = {
    action: 'move',
    direction: 'right',
    speed: 1,
    hallucinated: false,
    flavor: 'AI: "Oke, aku paham. Mengerjakan sekarang..."',
  };

  for (const entry of matched) {
    const correct = entry.correctAction;
    if (correct.action) base.action = correct.action;
    if (correct.direction) base.direction = correct.direction;
    if (correct.speed) base.speed = correct.speed;
    if (correct.specialEffect) base.specialEffect = correct.specialEffect;
  }

  return base;
}

export function processPrompt(
  input: string,
  level: Level,
  coffee: number
): Action {
  const tokens = tokenize(input);
  const matched = matchKeywords(tokens, level.keywordEntries);

  // No keywords matched
  if (matched.length === 0) {
    return { ...level.defaultAction };
  }

  const rate = calculateHallucinationRate(tokens.length, coffee);

  // Check each matched keyword for hallucination
  const hallucinatedEntries: KeywordEntry[] = [];
  const correctEntries: KeywordEntry[] = [];

  for (const entry of matched) {
    if (Math.random() < rate) {
      hallucinatedEntries.push(entry);
    } else {
      correctEntries.push(entry);
    }
  }

  // If any keyword hallucinated, pick from the first hallucinated entry
  if (hallucinatedEntries.length > 0) {
    const entry = hallucinatedEntries[0];
    const action = pickWeightedRandom(entry.hallucinations);
    return { ...action };
  }

  // All keywords correct -- merge their effects
  return mergeCorrectActions(matched);
}
```

- [ ] **Step 3: Verify files compile**

Run: `cd /home/nst/WebstormProjects/enggan-ngoding && npx tsc --noEmit src/engine/PromptParser.ts src/engine/HallucinationEngine.ts 2>&1 | head -20`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/engine/PromptParser.ts src/engine/HallucinationEngine.ts
git commit -m "feat: add prompt parser and hallucination engine"
```

---

## Task 3: Asset Generation & Placeholder Sprites

**Files:**
- Create: `public/assets/character-idle.png`
- Create: `public/assets/character-walk.png`
- Create: `public/assets/flag.png`
- Create: `public/assets/ground.png`

**Note:** Use the nano-banana MCP to generate game assets. Art direction: clean, flat, slightly cartoonish, bright colors, simple shapes, modern indie game aesthetic. Character is a developer (Angga). Generate each asset as a separate image.

- [ ] **Step 1: Generate character idle sprite**

Use nano-banana `generate_image` with prompt: "2D game character sprite, a young Indonesian male developer standing idle, flat vector art style, clean simple design, bright colors, transparent background, side view, slightly cartoonish, modern indie game aesthetic, 128x128 pixels"

Save to `public/assets/character-idle.png`.

- [ ] **Step 2: Generate character walk sprite**

Use nano-banana `generate_image` with prompt: "2D game character sprite, a young Indonesian male developer walking, flat vector art style, clean simple design, bright colors, transparent background, side view, slightly cartoonish, modern indie game aesthetic, walking pose, 128x128 pixels"

Save to `public/assets/character-walk.png`.

- [ ] **Step 3: Generate flag sprite**

Use nano-banana `generate_image` with prompt: "2D game flag sprite on a pole, checkered racing flag, flat vector art style, clean simple design, bright colors, transparent background, modern indie game aesthetic, 64x128 pixels"

Save to `public/assets/flag.png`.

- [ ] **Step 4: Generate ground tile**

Use nano-banana `generate_image` with prompt: "2D game ground tile, flat grass platform, tileable horizontal, flat vector art style, green and brown, clean simple design, modern indie game aesthetic, 256x64 pixels"

Save to `public/assets/ground.png`.

- [ ] **Step 5: Commit assets**

```bash
git add public/assets/character-idle.png public/assets/character-walk.png public/assets/flag.png public/assets/ground.png
git commit -m "feat: add game sprites for character, flag, and ground"
```

---

## Task 4: Game State Reducer & App Shell

**Files:**
- Rewrite: `src/App.tsx`
- Modify: `src/main.tsx`
- Modify: `public/style.css`

- [ ] **Step 1: Rewrite App.tsx with reducer and screen routing**

Rewrite `src/App.tsx`:

```tsx
import { useReducer, useCallback } from 'react';
import { GameState, GameAction, TerminalEntry } from './types';
import { LEVEL_1 } from './engine/LevelData';
import { processPrompt } from './engine/HallucinationEngine';
import Menu from './ui/Menu';
import Briefing from './ui/Briefing';
import HUD from './ui/HUD';
import Terminal from './ui/Terminal';
import Result from './ui/Result';
import GameWorld from './game/GameWorld';

let terminalIdCounter = 0;

const initialState: GameState = {
  screen: 'menu',
  coffee: 100,
  timeLeft: LEVEL_1.timerSeconds,
  terminalLog: [],
  currentAction: null,
  result: null,
  isProcessing: false,
  characterX: 10,
  flagX: 85,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, screen: 'briefing' };
    case 'ACCEPT_TICKET':
      return {
        ...initialState,
        screen: 'playing',
        terminalLog: [
          {
            id: ++terminalIdCounter,
            type: 'system',
            text: `📋 ${LEVEL_1.objective}`,
          },
          {
            id: ++terminalIdCounter,
            type: 'system',
            text: 'Ketik prompt untuk mengendalikan karakter...',
          },
        ],
      };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.isProcessing };
    case 'ADD_TERMINAL':
      return {
        ...state,
        terminalLog: [
          ...state.terminalLog,
          { ...action.entry, id: ++terminalIdCounter },
        ],
      };
    case 'SUBMIT_PROMPT':
      return {
        ...state,
        coffee: Math.max(0, state.coffee - action.coffeeCost),
      };
    case 'EXECUTE_ACTION':
      return { ...state, currentAction: action.action };
    case 'TICK_TIMER':
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };
    case 'UPDATE_CHARACTER_X':
      return { ...state, characterX: action.x };
    case 'SET_RESULT':
      return { ...state, screen: 'result', result: action.result };
    case 'RETRY':
      return {
        ...initialState,
        screen: 'briefing',
      };
    case 'BACK_TO_MENU':
      return { ...initialState };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handlePromptSubmit = useCallback(
    async (input: string) => {
      if (state.isProcessing) return;

      // Add player's prompt to terminal
      dispatch({
        type: 'ADD_TERMINAL',
        entry: { type: 'player', text: `> ${input}` },
      });

      // Deduct coffee
      dispatch({
        type: 'SUBMIT_PROMPT',
        action: processPrompt(input, LEVEL_1, state.coffee),
        coffeeCost: LEVEL_1.coffeeCost,
      });

      // Show thinking
      dispatch({ type: 'SET_PROCESSING', isProcessing: true });
      dispatch({
        type: 'ADD_TERMINAL',
        entry: { type: 'system', text: 'AI sedang berpikir...' },
      });

      // Fake delay
      await new Promise((r) => setTimeout(r, 1000));

      // Process
      const action = processPrompt(input, LEVEL_1, state.coffee);

      // Show AI response
      dispatch({
        type: 'ADD_TERMINAL',
        entry: {
          type: action.hallucinated ? 'error' : 'ai',
          text: action.flavor,
        },
      });

      // Execute
      dispatch({ type: 'EXECUTE_ACTION', action });
      dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    },
    [state.isProcessing, state.coffee]
  );

  const handleWin = useCallback(() => {
    dispatch({ type: 'SET_RESULT', result: 'win' });
  }, []);

  const handleTimerTick = useCallback(() => {
    dispatch({ type: 'TICK_TIMER' });
  }, []);

  const handleCharacterMove = useCallback((x: number) => {
    dispatch({ type: 'UPDATE_CHARACTER_X', x });
  }, []);

  switch (state.screen) {
    case 'menu':
      return <Menu onStart={() => dispatch({ type: 'START_GAME' })} />;
    case 'briefing':
      return (
        <Briefing
          level={LEVEL_1}
          onAccept={() => dispatch({ type: 'ACCEPT_TICKET' })}
        />
      );
    case 'playing':
      return (
        <div className="game-layout">
          <HUD
            coffee={state.coffee}
            timeLeft={state.timeLeft}
            levelTitle={LEVEL_1.title}
            onTimerTick={handleTimerTick}
            onTimeUp={() =>
              dispatch({ type: 'SET_RESULT', result: 'lose-time' })
            }
            onCoffeeEmpty={() =>
              dispatch({ type: 'SET_RESULT', result: 'lose-coffee' })
            }
            coffee_current={state.coffee}
          />
          <div className="game-main">
            <div className="game-left">
              <GameWorld
                currentAction={state.currentAction}
                characterX={state.characterX}
                flagX={state.flagX}
                onCharacterMove={handleCharacterMove}
                onWin={handleWin}
              />
              <div className="objective-bar">
                📋 {LEVEL_1.objective}
              </div>
            </div>
            <Terminal
              log={state.terminalLog}
              onSubmit={handlePromptSubmit}
              isProcessing={state.isProcessing}
            />
          </div>
        </div>
      );
    case 'result':
      return (
        <Result
          result={state.result}
          onRetry={() => dispatch({ type: 'RETRY' })}
          onMenu={() => dispatch({ type: 'BACK_TO_MENU' })}
        />
      );
  }
}
```

- [ ] **Step 2: Update main.tsx**

Rewrite `src/main.tsx`:

```tsx
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('pixi-container')!).render(<App />);
```

- [ ] **Step 3: Update style.css with game layout styles**

Rewrite `public/style.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700&display=swap');

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  color: rgba(255, 255, 255, 0.87);
  background-color: #0a0a0a;
  font-family: 'Inter', sans-serif;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

#pixi-container {
  width: 100%;
  height: 100%;
}

/* Game layout */
.game-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.game-main {
  flex: 1;
  display: flex;
  min-height: 0;
}

.game-left {
  flex: 0 0 65%;
  display: flex;
  flex-direction: column;
}

.game-left canvas {
  flex: 1;
}

.objective-bar {
  padding: 12px 16px;
  background: #1a1a2e;
  border-top: 1px solid #2a2a4a;
  font-size: 14px;
  color: #e0e0e0;
}

/* HUD */
.hud {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 16px;
  background: #12121f;
  border-bottom: 1px solid #2a2a4a;
  font-size: 14px;
  font-weight: 600;
}

.hud-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.coffee-bar {
  width: 120px;
  height: 12px;
  background: #2a2a4a;
  border-radius: 6px;
  overflow: hidden;
}

.coffee-fill {
  height: 100%;
  background: linear-gradient(90deg, #c0392b, #e67e22, #27ae60);
  border-radius: 6px;
  transition: width 0.3s ease;
}

/* Terminal */
.terminal {
  flex: 0 0 35%;
  display: flex;
  flex-direction: column;
  background: #0d1117;
  border-left: 1px solid #2a2a4a;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}

.terminal-log {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.terminal-entry {
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.terminal-entry.player {
  color: #58a6ff;
}

.terminal-entry.ai {
  color: #7ee787;
}

.terminal-entry.error {
  color: #f97583;
}

.terminal-entry.system {
  color: #8b949e;
}

.terminal-input-area {
  display: flex;
  border-top: 1px solid #2a2a4a;
  padding: 8px 12px;
  gap: 8px;
  align-items: center;
}

.terminal-input-area span {
  color: #58a6ff;
}

.terminal-input-area input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e6edf3;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}

.terminal-input-area input::placeholder {
  color: #484f58;
}

/* Glitch animation for terminal */
@keyframes terminal-glitch {
  0% { transform: translate(0); filter: none; }
  20% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
  40% { transform: translate(2px, -1px); filter: hue-rotate(180deg); }
  60% { transform: translate(-1px, -1px); filter: hue-rotate(270deg); }
  80% { transform: translate(1px, 2px); filter: hue-rotate(360deg); }
  100% { transform: translate(0); filter: none; }
}

.terminal-glitch {
  animation: terminal-glitch 0.3s ease-in-out;
}

/* Menu & screens */
.screen-center {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;
}

.game-title {
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.game-subtitle {
  font-size: 16px;
  color: #8b949e;
}

.btn {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s, opacity 0.2s;
}

.btn:hover {
  transform: scale(1.05);
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-secondary {
  background: #2a2a4a;
  color: white;
}

/* Briefing */
.briefing-card {
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  text-align: center;
}

.briefing-card h2 {
  margin: 0 0 8px;
  color: #e0e0e0;
}

.briefing-card .ohim-message {
  color: #8b949e;
  font-style: italic;
  margin-bottom: 16px;
}

.briefing-card .objective {
  font-size: 18px;
  color: #58a6ff;
  margin-bottom: 24px;
}

/* Result */
.result-message {
  font-size: 24px;
  text-align: center;
  max-width: 400px;
}

.result-message.win {
  color: #7ee787;
}

.result-message.lose {
  color: #f97583;
}

.result-buttons {
  display: flex;
  gap: 12px;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx public/style.css
git commit -m "feat: add game state reducer, app shell, and layout styles"
```

---

## Task 5: UI Components (Menu, Briefing, HUD, Terminal, Result)

**Files:**
- Create: `src/ui/Menu.tsx`
- Create: `src/ui/Briefing.tsx`
- Create: `src/ui/HUD.tsx`
- Create: `src/ui/Terminal.tsx`
- Create: `src/ui/Result.tsx`

- [ ] **Step 1: Create Menu component**

Create `src/ui/Menu.tsx`:

```tsx
type MenuProps = {
  onStart: () => void;
};

export default function Menu({ onStart }: MenuProps) {
  return (
    <div className="screen-center">
      <h1 className="game-title">Enggan Ngoding</h1>
      <p className="game-subtitle">
        Kenapa coding sendiri kalau bisa suruh AI?
      </p>
      <button className="btn btn-primary" onClick={onStart}>
        Mulai
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create Briefing component**

Create `src/ui/Briefing.tsx`:

```tsx
import { Level } from '../types';

type BriefingProps = {
  level: Level;
  onAccept: () => void;
};

export default function Briefing({ level, onAccept }: BriefingProps) {
  return (
    <div className="screen-center">
      <div className="briefing-card">
        <h2>{level.title}</h2>
        <p className="ohim-message">Ohim: "{level.ohimMessage}"</p>
        <p className="objective">{level.objective}</p>
        <button className="btn btn-primary" onClick={onAccept}>
          Terima Tiket
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create HUD component**

Create `src/ui/HUD.tsx`:

```tsx
import { useEffect, useRef } from 'react';

type HUDProps = {
  coffee: number;
  timeLeft: number;
  levelTitle: string;
  onTimerTick: () => void;
  onTimeUp: () => void;
  onCoffeeEmpty: () => void;
  coffee_current: number;
};

export default function HUD({
  coffee,
  timeLeft,
  levelTitle,
  onTimerTick,
  onTimeUp,
  onCoffeeEmpty,
  coffee_current,
}: HUDProps) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      onTimerTick();
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onTimerTick]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
    }
  }, [timeLeft, onTimeUp]);

  useEffect(() => {
    if (coffee_current <= 0) {
      onCoffeeEmpty();
    }
  }, [coffee_current, onCoffeeEmpty]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="hud">
      <div className="hud-item">
        <span>Kopi:</span>
        <div className="coffee-bar">
          <div className="coffee-fill" style={{ width: `${coffee}%` }} />
        </div>
        <span>{coffee}%</span>
      </div>
      <div className="hud-item">
        <span>Waktu:</span>
        <span>{timeStr}</span>
      </div>
      <div className="hud-item">
        <span>{levelTitle}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create Terminal component**

Create `src/ui/Terminal.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { TerminalEntry } from '../types';

type TerminalProps = {
  log: TerminalEntry[];
  onSubmit: (input: string) => void;
  isProcessing: boolean;
};

export default function Terminal({ log, onSubmit, isProcessing }: TerminalProps) {
  const [input, setInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [glitching, setGlitching] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  // Trigger glitch on error entries
  useEffect(() => {
    const lastEntry = log[log.length - 1];
    if (lastEntry?.type === 'error') {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 300);
    }
  }, [log]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;
    onSubmit(trimmed);
    setInput('');
  };

  return (
    <div
      className={`terminal ${glitching ? 'terminal-glitch' : ''}`}
      ref={terminalRef}
    >
      <div className="terminal-log">
        {log.map((entry) => (
          <div key={entry.id} className={`terminal-entry ${entry.type}`}>
            {entry.text}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
      <form className="terminal-input-area" onSubmit={handleSubmit}>
        <span>&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isProcessing ? 'AI sedang berpikir...' : 'ketik prompt...'}
          disabled={isProcessing}
          autoFocus
        />
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Create Result component**

Create `src/ui/Result.tsx`:

```tsx
import { ResultType } from '../types';

type ResultProps = {
  result: ResultType;
  onRetry: () => void;
  onMenu: () => void;
};

const RESULT_MESSAGES: Record<string, { text: string; className: string }> = {
  win: {
    text: 'Deploy berhasil! Angga selamat dari amukan Ohim.',
    className: 'win',
  },
  'lose-coffee': {
    text: 'Kopi habis... otak AI mati. Angga ketiduran di meja.',
    className: 'lose',
  },
  'lose-time': {
    text: 'DEADLINE TERLEWAT. OHIM Marah besar!',
    className: 'lose',
  },
};

export default function Result({ result, onRetry, onMenu }: ResultProps) {
  const msg = RESULT_MESSAGES[result ?? 'win'];

  return (
    <div className="screen-center">
      <div className={`result-message ${msg.className}`}>{msg.text}</div>
      <div className="result-buttons">
        {result === 'win' ? (
          <button className="btn btn-primary" onClick={onMenu}>
            Kembali ke Menu
          </button>
        ) : (
          <>
            <button className="btn btn-primary" onClick={onRetry}>
              Coba Lagi
            </button>
            <button className="btn btn-secondary" onClick={onMenu}>
              Kembali ke Menu
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/ui/Menu.tsx src/ui/Briefing.tsx src/ui/HUD.tsx src/ui/Terminal.tsx src/ui/Result.tsx
git commit -m "feat: add UI components - menu, briefing, HUD, terminal, result"
```

---

## Task 6: Game World (PixiJS Canvas)

**Files:**
- Create: `src/game/GameWorld.tsx`
- Create: `src/game/Character.tsx`
- Create: `src/game/GlitchEffects.ts`

- [ ] **Step 1: Create GlitchEffects utility**

Create `src/game/GlitchEffects.ts`:

```ts
import { Container, ColorMatrixFilter, NoiseFilter } from 'pixi.js';

export function applyGlitch(container: Container, intensity: number = 1) {
  const colorMatrix = new ColorMatrixFilter();
  const noise = new NoiseFilter();

  // Hue shift based on intensity
  colorMatrix.hue(intensity * 90, false);
  noise.noise = intensity * 0.5;

  container.filters = [colorMatrix, noise];

  // Screen shake
  const originalX = container.x;
  const originalY = container.y;
  const shakeAmount = intensity * 8;

  let frame = 0;
  const totalFrames = 15; // ~0.25s at 60fps

  const shake = () => {
    if (frame >= totalFrames) {
      container.x = originalX;
      container.y = originalY;
      container.filters = [];
      return;
    }
    container.x = originalX + (Math.random() - 0.5) * shakeAmount;
    container.y = originalY + (Math.random() - 0.5) * shakeAmount;

    // Reduce hue shift over time
    const progress = frame / totalFrames;
    colorMatrix.hue((1 - progress) * intensity * 90, false);
    noise.noise = (1 - progress) * intensity * 0.5;

    frame++;
    requestAnimationFrame(shake);
  };

  requestAnimationFrame(shake);
}
```

- [ ] **Step 2: Create Character component**

Create `src/game/Character.tsx`:

```tsx
import { useRef, useEffect, useState } from 'react';
import { extend, useTick } from '@pixi/react';
import { Assets, Sprite, Texture } from 'pixi.js';
import { Action } from '../types';

extend({ Sprite });

type CharacterProps = {
  action: Action | null;
  x: number;
  groundY: number;
  onMove: (newX: number) => void;
  onActionComplete: () => void;
};

export default function Character({
  action,
  x,
  groundY,
  onMove,
  onActionComplete,
}: CharacterProps) {
  const spriteRef = useRef<Sprite>(null);
  const [idleTexture, setIdleTexture] = useState(Texture.EMPTY);
  const [walkTexture, setWalkTexture] = useState(Texture.EMPTY);
  const [isMoving, setIsMoving] = useState(false);
  const moveTargetRef = useRef<{ direction: string; speed: number; framesLeft: number } | null>(null);
  const specialRef = useRef<{ effect: string; frame: number } | null>(null);

  useEffect(() => {
    Assets.load('/assets/character-idle.png').then(setIdleTexture);
    Assets.load('/assets/character-walk.png').then(setWalkTexture);
  }, []);

  // Handle new actions
  useEffect(() => {
    if (!action) return;

    if (action.action === 'move') {
      const dir = action.direction ?? 'right';
      const speed = action.speed ?? 1;
      const duration = speed >= 100 ? 5 : 60; // flyoff is fast

      moveTargetRef.current = { direction: dir, speed, framesLeft: duration };
      setIsMoving(true);
    } else if (action.action === 'confused') {
      // Do nothing, just show flavor text
      onActionComplete();
    } else if (action.action === 'idle' && action.specialEffect) {
      specialRef.current = { effect: action.specialEffect, frame: 0 };
      setIsMoving(false);
    }
  }, [action, onActionComplete]);

  useTick((ticker) => {
    if (!spriteRef.current) return;
    const sprite = spriteRef.current;

    // Handle special effects
    if (specialRef.current) {
      const { effect, frame } = specialRef.current;
      specialRef.current.frame++;

      if (effect === 'vibrate') {
        sprite.x = x * 10 + (Math.random() - 0.5) * 6;
        if (frame > 60) {
          specialRef.current = null;
          onActionComplete();
        }
        return;
      }

      if (effect === 'spin') {
        sprite.rotation += 0.2 * ticker.deltaTime;
        if (frame > 60) {
          sprite.rotation = 0;
          specialRef.current = null;
          onActionComplete();
        }
        return;
      }

      if (effect === 'flip') {
        sprite.scale.y = -1;
        if (frame > 60) {
          sprite.scale.y = 1;
          specialRef.current = null;
          onActionComplete();
        }
        return;
      }
    }

    // Handle movement
    if (moveTargetRef.current && moveTargetRef.current.framesLeft > 0) {
      const { direction, speed } = moveTargetRef.current;
      const moveAmount = speed * 0.3 * ticker.deltaTime;

      let dx = 0;
      let dy = 0;

      switch (direction) {
        case 'right':
          dx = moveAmount;
          break;
        case 'left':
          dx = -moveAmount;
          sprite.scale.x = -1;
          break;
        case 'up':
          dy = -moveAmount * 10;
          break;
        case 'down':
          dy = moveAmount * 10;
          break;
        case 'random':
          dx = (Math.random() - 0.5) * moveAmount * 2;
          dy = (Math.random() - 0.5) * moveAmount * 5;
          break;
      }

      const newX = x + dx;
      onMove(Math.max(0, Math.min(100, newX)));

      // Apply vertical offset directly to sprite (not state)
      sprite.y = groundY + dy;

      moveTargetRef.current.framesLeft--;

      if (moveTargetRef.current.framesLeft <= 0) {
        moveTargetRef.current = null;
        setIsMoving(false);
        sprite.scale.x = 1;
        sprite.y = groundY;
        onActionComplete();
      }
    }
  });

  const texture = isMoving ? walkTexture : idleTexture;

  return (
    <pixiSprite
      ref={spriteRef}
      texture={texture}
      anchor={0.5}
      x={x * 10}
      y={groundY}
      scale={{ x: 1, y: 1 }}
    />
  );
}
```

- [ ] **Step 3: Create GameWorld component**

Create `src/game/GameWorld.tsx`:

```tsx
import { useCallback, useEffect, useRef } from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Sprite, Texture, TilingSprite, Assets } from 'pixi.js';
import { Action } from '../types';
import Character from './Character';
import { applyGlitch } from './GlitchEffects';
import { useState } from 'react';

extend({ Container, Sprite, TilingSprite });

type GameWorldProps = {
  currentAction: Action | null;
  characterX: number;
  flagX: number;
  onCharacterMove: (x: number) => void;
  onWin: () => void;
};

function GameScene({
  currentAction,
  characterX,
  flagX,
  onCharacterMove,
  onWin,
}: GameWorldProps) {
  const containerRef = useRef<Container>(null);
  const [flagTexture, setFlagTexture] = useState(Texture.EMPTY);
  const [groundTexture, setGroundTexture] = useState(Texture.EMPTY);
  const flagSpriteRef = useRef<Sprite>(null);
  const flagOffsetRef = useRef(0);

  useEffect(() => {
    Assets.load('/assets/flag.png').then(setFlagTexture);
    Assets.load('/assets/ground.png').then(setGroundTexture);
  }, []);

  // Trigger glitch on hallucination
  useEffect(() => {
    if (currentAction?.hallucinated && containerRef.current) {
      applyGlitch(containerRef.current, 1);
    }
  }, [currentAction]);

  // Handle flag-runs special effect
  useEffect(() => {
    if (currentAction?.specialEffect === 'flag-runs' && flagSpriteRef.current) {
      // Move flag further right
      flagOffsetRef.current += 50;
    }
  }, [currentAction]);

  // Check win condition
  useEffect(() => {
    const charPixelX = characterX * 10;
    const flagPixelX = flagX * 10 + flagOffsetRef.current;
    if (Math.abs(charPixelX - flagPixelX) < 30) {
      onWin();
    }
  }, [characterX, flagX, onWin]);

  const handleActionComplete = useCallback(() => {
    // Action finished animating
  }, []);

  const GROUND_Y = 400;

  return (
    <pixiContainer ref={containerRef}>
      {/* Ground */}
      {groundTexture !== Texture.EMPTY && (
        <pixiSprite
          texture={groundTexture}
          x={0}
          y={GROUND_Y + 40}
          width={1000}
          height={64}
        />
      )}

      {/* Flag */}
      {flagTexture !== Texture.EMPTY && (
        <pixiSprite
          ref={flagSpriteRef}
          texture={flagTexture}
          anchor={{ x: 0.5, y: 1 }}
          x={flagX * 10 + flagOffsetRef.current}
          y={GROUND_Y + 40}
          scale={0.8}
        />
      )}

      {/* Character */}
      <Character
        action={currentAction}
        x={characterX}
        groundY={GROUND_Y}
        onMove={onCharacterMove}
        onActionComplete={handleActionComplete}
      />
    </pixiContainer>
  );
}

export default function GameWorld(props: GameWorldProps) {
  return (
    <Application
      background="#1a1a2e"
      resizeTo={undefined}
      width={1000}
      height={500}
    >
      <GameScene {...props} />
    </Application>
  );
}
```

- [ ] **Step 4: Verify the app compiles**

Run: `cd /home/nst/WebstormProjects/enggan-ngoding && npx tsc --noEmit 2>&1 | head -30`

Expected: No errors (or only minor ones to fix).

- [ ] **Step 5: Commit**

```bash
git add src/game/GameWorld.tsx src/game/Character.tsx src/game/GlitchEffects.ts
git commit -m "feat: add PixiJS game world with character, flag, and glitch effects"
```

---

## Task 7: Integration & Polish

**Files:**
- Modify: `src/App.tsx` (if needed for fixes)
- Modify: `index.html`

- [ ] **Step 1: Update index.html title**

In `index.html`, change the title:

```html
<title>Enggan Ngoding</title>
```

- [ ] **Step 2: Run the dev server and test**

Run: `cd /home/nst/WebstormProjects/enggan-ngoding && npm run dev`

Test manually:
1. Menu screen shows "Enggan Ngoding" + "Mulai" button
2. Clicking "Mulai" goes to Briefing with Ohim's message
3. Clicking "Terima Tiket" starts the game with HUD + terminal + game world
4. Typing "jalan ke kanan" in terminal and pressing Enter triggers AI thinking + action
5. Character moves (or hallucinates) in the game world
6. Timer counts down, coffee decreases per prompt
7. Reaching the flag shows win screen
8. Running out of coffee/time shows lose screen

- [ ] **Step 3: Fix any TypeScript or runtime errors found during testing**

Address errors discovered in step 2.

- [ ] **Step 4: Run lint**

Run: `cd /home/nst/WebstormProjects/enggan-ngoding && npm run lint 2>&1 | head -30`

Fix any lint errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Enggan Ngoding v1 - playable prototype"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Characters (Angga, Ohim, Mang Aris, Mang Alif) | Task 1 (LevelData), Task 5 (Briefing, Result) |
| Core gameplay loop | Task 4 (App reducer) |
| Prompt parser (tokenize, keyword match) | Task 2 (PromptParser) |
| Hallucination engine (roll, weighted random) | Task 2 (HallucinationEngine) |
| Hallucination dictionary | Task 1 (LevelData) |
| Coffee meter + timer | Task 5 (HUD), Task 4 (reducer) |
| Win/lose conditions | Task 4 (reducer), Task 5 (Result) |
| State machine (menu/briefing/playing/result) | Task 4 (App) |
| UI layout (split screen) | Task 4 (style.css), Task 5 (all UI) |
| PixiJS game world | Task 6 (GameWorld, Character) |
| Glitch effects | Task 6 (GlitchEffects), Task 5 (CSS glitch) |
| Assets | Task 3 (nano-banana generation) |
| Bahasa Indonesia UI | All tasks (all text in Indonesian) |
