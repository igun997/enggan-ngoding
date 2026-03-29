# Interactive Office Upgrade Spec

**Date:** 2026-03-29

## Overview

Upgrade the game to fullscreen responsive, interactive office scene with spritesheet animations, walk-to-desk flow, clickable objects, mock terminal hints, and improved punishment sequences.

## 1. Responsive Fullscreen

Canvas internal resolution stays 1000x700. Scale proportionally to window using CSS `transform: scale()` with letterboxing. Recalculate on window resize.

```
scale = Math.min(window.innerWidth / 1000, window.innerHeight / 700)
```

CSS: `#app` centered with `transform: scale(X)` and `transform-origin: center center`. Body overflow hidden, black letterbox.

## 2. Interactive Office Scene

### Scene Flow

1. Angga spawns at door (x=900, standing)
2. Walk animation to desk (x=400), ~2 seconds
3. Sit-down transition, idle animation loop begins
4. Monitor displays task hint (mock terminal)
5. Monitor and door become clickable (glow pulse)

### Clickable Objects

- **Monitor**: click = open task panel. Shows hint text before click.
- **Door**: click = confirm dialog → back to menu.

Both have alpha pulse glow (0.3→1.0 loop) when hoverable. Cursor changes to pointer.

### New State: `"office"`

State machine update:
- `briefing` → `office` (Angga walks in, idles, hint shows)
- `office` + click monitor → `task`
- `task` success → `office` (next task) or `result:win`
- `task` fail → `punishment` → `office` (retry same task)
- `office` + click door → confirm → `menu`

## 3. Task Hints (Mock Terminal on Monitor)

Each task has a `hint` field -- multiline string displayed as green monospace text on the monitor sprite before the task panel opens.

### Task 1 Hint (Unreachable Code)
```
$ node hitungGaji.js
Error: bonus is not defined
Expected output: 75000
Got: 50000
```

### Task 2 Hint (git push)
```
$ git status
On branch feature/fix-login
Your branch is ahead of 'origin/main' by 2 commits.

$ curl https://api.prod.com/health
503 Service Unavailable
```

### Task 3 Hint (Off-by-One)
```
$ node listUsers.js
Aris
Alif
Ohim
undefined
```

Implementation: PixiJS Text object positioned above/on monitor sprite, monospace green (#7ee787), fontSize 9-10 for small monitor display.

## 4. Spritesheet Pipeline

### Generation Flow
1. Generate individual frames via Nano Banana (pixel art, side view, consistent style per character)
2. Post-process with rembg (background removal) + Pillow (resize to 64x64)
3. Combine frames into horizontal spritesheet + JSON atlas using Pillow

### Angga Spritesheet (8 frames, 512x64)

| Frame | Index | Description |
|-------|-------|-------------|
| walk-1 | 0 | Left foot forward |
| walk-2 | 1 | Standing mid-stride |
| walk-3 | 2 | Right foot forward |
| walk-4 | 3 | Standing mid-stride (mirror) |
| idle-1 | 4 | Sitting at desk, normal |
| idle-2 | 5 | Sitting, typing keyboard |
| idle-3 | 6 | Sitting, looking at monitor |
| sit-down | 7 | Transition from standing to sitting |

### NPC Spritesheets (6 frames each, 384x64)

Per NPC (Ohim, Mang Aris, Mang Alif):

| Frame | Index | Description |
|-------|-------|-------------|
| walk-1 | 0 | Left foot forward |
| walk-2 | 1 | Standing mid-stride |
| walk-3 | 2 | Right foot forward |
| walk-4 | 3 | Standing mid-stride (mirror) |
| stand | 4 | Idle standing pose |
| action | 5 | Slap/slam/kick directed at someone |

### Atlas JSON Format

```json
{
  "frames": {
    "walk-1": { "frame": { "x": 0, "y": 0, "w": 64, "h": 64 } },
    "walk-2": { "frame": { "x": 64, "y": 0, "w": 64, "h": 64 } }
  },
  "meta": { "image": "angga-spritesheet.png", "size": { "w": 512, "h": 64 } }
}
```

### Old Assets Removed
- `angga-sit.png` -- replaced by spritesheet
- `ohim-stand.png`, `ohim-slap.png` -- replaced by spritesheet
- `mang-aris-stand.png`, `mang-aris-angry.png` -- replaced by spritesheet
- `mang-alif-stand.png`, `mang-alif-kick.png` -- replaced by spritesheet

### New Asset Created
- `door.png` -- pixel art door sprite, 64x96

## 5. Punishment Animation (Improved)

1. NPC walks in from door (x=900) to near Angga (x=500) -- walk animation, ~1.5s
2. Dialog bubble appears: NPC's dialog text
3. NPC swaps to action frame (slap/slam/kick directed at Angga)
4. Screen shake + red flash on canvas
5. Angga recoil (brief x offset -20px, bounce back)
6. NPC walks back out to door (x=900) -- walk animation
7. Scene returns to office idle state, retry same task

## 6. Component Architecture

### New/Modified Files

```
src/
├── App.tsx                      # Modify: CSS scale, add "office" screen state
├── types/index.ts               # Modify: add hint to TaskDef, add "office" to Screen
├── data/TaskData.ts             # Modify: add hint text per task
├── game/
│   ├── SpriteAnimation.tsx      # CREATE: AnimatedSprite wrapper
│   ├── MonitorHint.tsx          # CREATE: mock terminal text on monitor
│   ├── ClickableObject.tsx      # CREATE: glow pulse + pointer cursor
│   ├── OfficeScene.tsx          # REWRITE: interactive, walk-in, clickables
│   ├── TaskScene.tsx            # Modify: minor (no structural change)
│   ├── PunishmentScene.tsx      # REWRITE: NPC walk-in/out + directed action
│   ├── MenuScene.tsx            # Keep as-is
│   ├── BriefingScene.tsx        # Keep as-is
│   ├── ResultScene.tsx          # Keep as-is
│   ├── PixiButton.tsx           # Keep as-is
│   └── PixiTextInput.tsx        # Keep as-is
public/
├── style.css                    # Modify: scale transform + letterbox
├── assets/
│   ├── angga-spritesheet.png + .json
│   ├── ohim-spritesheet.png + .json
│   ├── mang-aris-spritesheet.png + .json
│   ├── mang-alif-spritesheet.png + .json
│   ├── door.png
│   ├── office-bg.png            # Keep
│   └── monitor.png              # Keep
```

### Updated State

```typescript
type Screen = "menu" | "briefing" | "office" | "task" | "punishment" | "result";

type TaskDef = {
  // ...existing fields...
  hint: string;  // NEW: mock terminal hint text
};

type GameState = {
  screen: Screen;
  currentTask: number;
  failures: number;
  taskResults: boolean[];
  result: ResultType;
  punishmentNPC: PunishmentNPC | null;
  officePhase: "walk-in" | "idle" | "walk-out" | null;  // NEW
};
```

### New Actions
- `ENTER_OFFICE` → briefing/punishment → office (walk-in phase)
- `OFFICE_READY` → walk-in done → idle phase
- `CLICK_MONITOR` → office → task
- `CLICK_DOOR` → office → menu (with confirm)
