# Enggan Ngoding v2 -- Task Mode

**Date:** 2026-03-29
**Replaces:** v1 Prompt Debugger mode (full replacement)

## Overview

Enggan Ngoding v2 replaces the prompt-debugger gameplay with a task-based mode inspired by Among Us impostor tasks. Player (Angga) must complete coding tasks assigned by manager (Ohim). Failing tasks triggers progressive punishment escalation from Ohim → CTO (Mang Aris) → Founder (Mang Alif), ending in termination.

## Game Flow & State Machine

```
[MENU] → [BRIEFING] → [TASK 1] → [TASK 2] → [TASK 3] → [RESULT: WIN]
                          ↓           ↓           ↓
                       (gagal)     (gagal)     (gagal)
                          ↓           ↓           ↓
                     Ohim tampar  Mang Aris   Mang Alif
                     → retry     gebrak meja  tendang →
                     task 1      → retry      RESULT: LOSE
                                 task 2
```

### States
- `menu` -- Title screen, "Mulai" button
- `briefing` -- Ohim assigns work: "Angga, fix bug ini sebelum deadline. Gua awasin lu."
- `task` -- Active task scene (1 of 3)
- `punishment` -- NPC punishment animation
- `result` -- Win ("Deploy berhasil!") or Lose ("Angga dipecat!")

### Progressive Punishment
Each task allows exactly 1 failure. Failing triggers escalation:
- **Fail 1 (Task 1):** Ohim walks to Angga, slaps him. Dialog: "Lu beneran developer ga sih?!" → retry task 1
- **Fail 2 (Task 2):** Mang Aris enters, slams desk. Dialog: "Gua yang harus beresin ini?!" → retry task 2
- **Fail 3 (Task 3):** Mang Alif enters, kicks Angga out. Dialog: "Kamu dipecat. Beres-beresin meja lu." → game over (fired)

## Task Definitions

### Task 1: Fix Bug (Multiple Choice)

**Scene:** Angga at desk, monitor showing buggy code. Ohim standing behind watching.

```javascript
function hitungGaji(jam) {
  let gaji = jam * 50000
  return gaji
  gaji = gaji + bonus  // bug: unreachable code
}
```

**Options:**
- A) Pindahkan `gaji = gaji + bonus` ke sebelum return -- CORRECT
- B) Hapus `return gaji`
- C) Tambah `console.log(gaji)`

### Task 2: Terminal Command

**Scene:** Angga at terminal, deploy error notification. Ohim in background.

**Prompt:** "Server production down! Error: branch belum di-push. Ketik command yang benar:"

**Answer:** `git push origin main`

**Wrong answers:** Any other input triggers failure.

### Task 3: Fix Bug (Multiple Choice)

**Scene:** Tense atmosphere. Angga at desk, Mang Aris & Ohim behind him.

```javascript
const users = ["Aris", "Alif", "Ohim"]
for (let i = 0; i <= users.length; i++) {
  console.log(users[i])  // bug: off-by-one
}
```

**Options:**
- A) Ganti `i <= users.length` jadi `i < users.length` -- CORRECT
- B) Ganti `let i = 0` jadi `let i = 1`
- C) Tambah `users.push("Angga")`

## Scene & Visual Architecture

### PixiJS Scene Layout

```
┌──────────────────────────────────────────────┐
│  Background: Office room (office-bg.png)     │
│                                              │
│  ┌──────────┐                    ┌────────┐  │
│  │ Monitor  │                    │ NPC(s) │  │
│  │ (prop)   │    ┌─────────┐    │        │  │
│  │          │    │  Angga  │    │        │  │
│  └──────────┘    │  (sit)  │    └────────┘  │
│                  └─────────┘                 │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ FLOOR ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
├──────────────────────────────────────────────┤
│  Task Panel (HTML overlay below canvas)      │
│  - Code viewer + multiple choice buttons     │
│  - OR terminal input                         │
└──────────────────────────────────────────────┘
```

### Punishment Animation Flow
1. NPC sprite walks in from right edge
2. Dialog bubble appears (HTML overlay)
3. Swap to action sprite (slap/slam/kick)
4. Screen shake + red flash
5. Fade → retry task or game over

## Component Architecture

### Removed (v1 components)
- `PromptParser.ts`
- `HallucinationEngine.ts`
- `LevelData.ts`
- `Terminal.tsx`
- `Character.tsx`
- `HUD.tsx`
- `GameWorld.tsx`
- `GlitchEffects.ts`

### New Structure

```
src/
├── App.tsx                    # State machine (refactored)
├── types/index.ts             # New types
├── data/
│   └── TaskData.ts            # 3 task definitions + answers + dialog
├── game/
│   ├── OfficeScene.tsx        # PixiJS office scene (bg, sprites, positions)
│   ├── NPCSprite.tsx          # NPC with walk-in + action animation
│   └── PunishmentScene.tsx    # Punishment animation (shake, flash, dialog)
├── ui/
│   ├── Menu.tsx               # Reuse (minor update)
│   ├── Briefing.tsx           # Reuse (updated Ohim dialog)
│   ├── TaskProgress.tsx       # Progress bar: Task 1/3 ✓ ✓ ○
│   ├── CodeFixTask.tsx        # Code viewer + multiple choice buttons
│   ├── TerminalTask.tsx       # Terminal input for command task
│   ├── DialogBubble.tsx       # Speech bubble overlay for NPC
│   └── Result.tsx             # Reuse (updated messages)
```

### State

```typescript
type Screen = "menu" | "briefing" | "task" | "punishment" | "result"
type ResultType = "win" | "fired" | null
type PunishmentNPC = "ohim" | "aris" | "alif"

type TaskDef = {
  id: number
  type: "code-fix" | "terminal"
  title: string
  scene: {
    npcsPresent: string[]       // which NPCs visible in scene
  }
  code?: string                 // code snippet for code-fix
  prompt?: string               // prompt text for terminal
  options?: { text: string; correct: boolean }[]  // for code-fix
  correctAnswer?: string        // for terminal
  onFail: {
    npc: PunishmentNPC
    dialog: string
  }
}

type GameState = {
  screen: Screen
  currentTask: number           // 0, 1, 2
  failures: number              // 0, 1, 2, 3
  taskResults: boolean[]        // per task completion
  result: ResultType
  punishmentNPC: PunishmentNPC | null
}
```

### Actions
- `START_GAME` → menu → briefing
- `ACCEPT_TICKET` → briefing → task (currentTask=0)
- `SUBMIT_ANSWER` → check correct/incorrect
- `TASK_SUCCESS` → next task or result:win
- `TASK_FAIL` → punishment screen + escalation
- `PUNISHMENT_DONE` → retry task (or result:fired if failures=3)
- `RETRY` → result → briefing (reset state)
- `BACK_TO_MENU` → result → menu

## Asset Generation Pipeline

### Step 1: Generate pixel art via Nano Banana MCP
### Step 2: Post-process with rembg (AI background removal) + Pillow (resize)

### Sprite List

| Filename | Size | Description | Generate Prompt |
|----------|------|-------------|-----------------|
| `angga-sit.png` | 64x64 | Angga sitting at desk, side view | Pixel art, male programmer sitting at desk, side view, dark hair, hoodie |
| `ohim-stand.png` | 64x64 | Ohim standing, arms crossed | Pixel art, angry male manager standing, arms crossed, office attire, side view |
| `ohim-slap.png` | 96x64 | Ohim slapping Angga | Pixel art, angry manager slapping someone, side view, action pose |
| `mang-aris-stand.png` | 64x64 | Mang Aris standing, serious | Pixel art, serious male CTO standing, glasses, formal shirt, side view |
| `mang-aris-angry.png` | 96x64 | Mang Aris slamming desk | Pixel art, angry CTO slamming desk with fist, side view |
| `mang-alif-stand.png` | 64x64 | Mang Alif standing, stern | Pixel art, stern male founder/CEO standing, suit, side view |
| `mang-alif-kick.png` | 96x64 | Mang Alif kicking Angga | Pixel art, founder kicking someone out, action pose, side view |
| `office-bg.png` | 1000x350 | Office interior background | Pixel art, modern startup office interior, desks, monitors, side view background |
| `monitor.png` | 128x96 | Computer monitor prop | Pixel art, computer monitor on desk, glowing screen, front view |

### Assets Removed
- `character-idle.png` -- replaced by `angga-sit.png`
- `character-walk.png` -- no longer needed
- `flag.png` -- no longer needed
- `ground.png` -- replaced by `office-bg.png`
- `bunny.png` -- unused placeholder

## Result Messages

### Win
- "Deploy berhasil! Angga selamat... untuk hari ini."
- Button: "Kembali ke Menu"

### Lose (Fired)
- "ANGGA DIPECAT! Mang Alif sudah muak dengan developer yang gabisa ngoding."
- Buttons: "Coba Lagi" + "Kembali ke Menu"
