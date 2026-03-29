# Enggan Ngoding v2 -- Task Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the v1 prompt-debugger with a scene-based task mode where Angga completes coding tasks under escalating pressure from NPCs.

**Architecture:** Full scene-based approach using PixiJS for office scenes with character sprites, and HTML overlay panels for task interaction (code-fix multiple choice + terminal input). State managed via React useReducer with a 5-screen state machine (menu → briefing → task → punishment → result).

**Tech Stack:** PixiJS 8, @pixi/react 8, React 19, TypeScript, Vite, Nano Banana MCP (asset generation), rembg + Pillow (asset post-processing)

---

### Task 1: Generate & Process Pixel Art Assets

**Files:**
- Create: `public/assets/angga-sit.png`
- Create: `public/assets/ohim-stand.png`
- Create: `public/assets/ohim-slap.png`
- Create: `public/assets/mang-aris-stand.png`
- Create: `public/assets/mang-aris-angry.png`
- Create: `public/assets/mang-alif-stand.png`
- Create: `public/assets/mang-alif-kick.png`
- Create: `public/assets/office-bg.png`
- Create: `public/assets/monitor.png`
- Delete: `public/assets/character-idle.png`
- Delete: `public/assets/character-walk.png`
- Delete: `public/assets/flag.png`
- Delete: `public/assets/ground.png`
- Delete: `public/assets/bunny.png`

- [ ] **Step 1: Delete old assets**

```bash
rm public/assets/character-idle.png public/assets/character-walk.png public/assets/flag.png public/assets/ground.png public/assets/bunny.png
```

- [ ] **Step 2: Generate sprites via Nano Banana MCP**

Generate each sprite using the `mcp__nano-banana__generate_image` tool with these prompts. Save each output to `public/assets/`:

| Filename | Prompt |
|----------|--------|
| `angga-sit.png` | "Pixel art, male programmer sitting at desk, side view, dark hair, hoodie, 16-bit style, clean edges, transparent background" |
| `ohim-stand.png` | "Pixel art, angry male manager standing, arms crossed, office attire, side view, 16-bit style, clean edges, transparent background" |
| `ohim-slap.png` | "Pixel art, angry manager slapping someone, side view, action pose, 16-bit style, clean edges, transparent background" |
| `mang-aris-stand.png` | "Pixel art, serious male CTO standing, glasses, formal shirt, side view, 16-bit style, clean edges, transparent background" |
| `mang-aris-angry.png` | "Pixel art, angry CTO slamming desk with fist, side view, 16-bit style, clean edges, transparent background" |
| `mang-alif-stand.png` | "Pixel art, stern male founder CEO standing, suit, side view, 16-bit style, clean edges, transparent background" |
| `mang-alif-kick.png` | "Pixel art, founder kicking someone out, action pose, side view, 16-bit style, clean edges, transparent background" |
| `office-bg.png` | "Pixel art, modern startup office interior, desks monitors plants, side view background, 16-bit style, dark tones" |
| `monitor.png` | "Pixel art, computer monitor on desk, glowing screen, front view, 16-bit style, clean edges, transparent background" |

- [ ] **Step 3: Post-process all generated sprites**

Run background removal and resize using the rembg venv at `/tmp/imgtools`:

```python
/tmp/imgtools/bin/python3 << 'PYEOF'
from rembg import remove
from PIL import Image
import io, os

assets_dir = "public/assets"

targets = {
    "angga-sit.png": (64, 64),
    "ohim-stand.png": (64, 64),
    "ohim-slap.png": (96, 64),
    "mang-aris-stand.png": (64, 64),
    "mang-aris-angry.png": (96, 64),
    "mang-alif-stand.png": (64, 64),
    "mang-alif-kick.png": (96, 64),
    "office-bg.png": (1000, 350),
    "monitor.png": (128, 96),
}

for filename, size in targets.items():
    path = os.path.join(assets_dir, filename)
    if not os.path.exists(path):
        print(f"SKIP {filename} (not found)")
        continue
    print(f"Processing {filename}...")
    with open(path, "rb") as f:
        input_data = f.read()
    if filename != "office-bg.png":
        output_data = remove(input_data)
    else:
        output_data = input_data  # keep bg for background
    img = Image.open(io.BytesIO(output_data)).convert("RGBA")
    img.thumbnail(size, Image.LANCZOS)
    img.save(path, "PNG", optimize=True)
    final_size = os.path.getsize(path)
    print(f"  -> {img.size[0]}x{img.size[1]}, {final_size // 1024} KB")
print("Done!")
PYEOF
```

- [ ] **Step 4: Verify all assets exist and look correct**

```bash
ls -lh public/assets/*.png
```

Expected: 9 PNG files, all under 50KB except office-bg.png.

- [ ] **Step 5: Commit**

```bash
git add public/assets/
git commit -m "feat: add pixel art assets for v2 task mode, remove v1 assets"
```

---

### Task 2: Replace Types

**Files:**
- Modify: `src/types/index.ts` (full rewrite)

- [ ] **Step 1: Rewrite types/index.ts**

Replace the entire contents of `src/types/index.ts` with:

```typescript
export type Screen = "menu" | "briefing" | "task" | "punishment" | "result";
export type ResultType = "win" | "fired" | null;
export type PunishmentNPC = "ohim" | "aris" | "alif";
export type TaskType = "code-fix" | "terminal";

export type TaskOption = {
  text: string;
  correct: boolean;
};

export type TaskDef = {
  id: number;
  type: TaskType;
  title: string;
  scene: {
    npcsPresent: PunishmentNPC[];
  };
  code?: string;
  prompt?: string;
  options?: TaskOption[];
  correctAnswer?: string;
  onFail: {
    npc: PunishmentNPC;
    dialog: string;
  };
};

export type GameState = {
  screen: Screen;
  currentTask: number;
  failures: number;
  taskResults: boolean[];
  result: ResultType;
  punishmentNPC: PunishmentNPC | null;
};

export type GameAction =
  | { type: "START_GAME" }
  | { type: "ACCEPT_TICKET" }
  | { type: "SUBMIT_ANSWER"; correct: boolean }
  | { type: "PUNISHMENT_DONE" }
  | { type: "RETRY" }
  | { type: "BACK_TO_MENU" };
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: replace v1 types with v2 task mode types"
```

---

### Task 3: Create Task Data

**Files:**
- Create: `src/data/TaskData.ts`
- Delete: `src/engine/LevelData.ts`
- Delete: `src/engine/HallucinationEngine.ts`
- Delete: `src/engine/PromptParser.ts`

- [ ] **Step 1: Delete old engine files**

```bash
rm -r src/engine/
```

- [ ] **Step 2: Create src/data/TaskData.ts**

```typescript
import { TaskDef } from "../types";

export const TASKS: TaskDef[] = [
  {
    id: 1,
    type: "code-fix",
    title: "Fix Bug #1: Unreachable Code",
    scene: {
      npcsPresent: ["ohim"],
    },
    code: `function hitungGaji(jam) {
  let gaji = jam * 50000
  return gaji
  gaji = gaji + bonus  // bug: unreachable code
}`,
    options: [
      { text: 'Pindahkan "gaji = gaji + bonus" ke sebelum return', correct: true },
      { text: 'Hapus "return gaji"', correct: false },
      { text: 'Tambah "console.log(gaji)"', correct: false },
    ],
    onFail: {
      npc: "ohim",
      dialog: "Lu beneran developer ga sih?!",
    },
  },
  {
    id: 2,
    type: "terminal",
    title: "Deploy Emergency",
    scene: {
      npcsPresent: ["ohim"],
    },
    prompt:
      "Server production down! Error: branch belum di-push. Ketik command yang benar:",
    correctAnswer: "git push origin main",
    onFail: {
      npc: "aris",
      dialog: "Gua yang harus beresin ini?!",
    },
  },
  {
    id: 3,
    type: "code-fix",
    title: "Fix Bug #2: Off-by-One",
    scene: {
      npcsPresent: ["ohim", "aris"],
    },
    code: `const users = ["Aris", "Alif", "Ohim"]
for (let i = 0; i <= users.length; i++) {
  console.log(users[i])  // bug: off-by-one
}`,
    options: [
      {
        text: 'Ganti "i <= users.length" jadi "i < users.length"',
        correct: true,
      },
      { text: 'Ganti "let i = 0" jadi "let i = 1"', correct: false },
      { text: 'Tambah "users.push(\\"Angga\\")"', correct: false },
    ],
    onFail: {
      npc: "alif",
      dialog: "Kamu dipecat. Beres-beresin meja lu.",
    },
  },
];
```

- [ ] **Step 3: Commit**

```bash
git add src/data/TaskData.ts
git commit -m "feat: add task definitions for v2, remove v1 engine"
```

---

### Task 4: Create PixiJS Office Scene

**Files:**
- Create: `src/game/OfficeScene.tsx`
- Delete: `src/game/GameWorld.tsx`
- Delete: `src/game/Character.tsx`
- Delete: `src/game/GlitchEffects.ts`

- [ ] **Step 1: Delete old game files**

```bash
rm src/game/GameWorld.tsx src/game/Character.tsx src/game/GlitchEffects.ts
```

- [ ] **Step 2: Create src/game/OfficeScene.tsx**

```tsx
import { useEffect, useState } from "react";
import { Application, extend } from "@pixi/react";
import { Container, Sprite, Texture, Assets } from "pixi.js";
import { PunishmentNPC } from "../types";

extend({ Container, Sprite });

type OfficeSceneProps = {
  npcsPresent: PunishmentNPC[];
  punishmentNPC: PunishmentNPC | null;
  onPunishmentAnimDone: () => void;
};

const NPC_TEXTURES: Record<string, string> = {
  ohim: "/assets/ohim-stand.png",
  "ohim-action": "/assets/ohim-slap.png",
  aris: "/assets/mang-aris-stand.png",
  "aris-action": "/assets/mang-aris-angry.png",
  alif: "/assets/mang-alif-stand.png",
  "alif-action": "/assets/mang-alif-kick.png",
};

const NPC_POSITIONS: Record<string, { x: number; y: number }> = {
  ohim: { x: 750, y: 260 },
  aris: { x: 850, y: 260 },
  alif: { x: 650, y: 260 },
};

function OfficeSceneInner({
  npcsPresent,
  punishmentNPC,
  onPunishmentAnimDone,
}: OfficeSceneProps) {
  const [textures, setTextures] = useState<Record<string, Texture>>({});

  useEffect(() => {
    const toLoad: Record<string, string> = {
      bg: "/assets/office-bg.png",
      angga: "/assets/angga-sit.png",
      monitor: "/assets/monitor.png",
    };
    for (const npc of npcsPresent) {
      toLoad[npc] = NPC_TEXTURES[npc];
    }
    if (punishmentNPC) {
      toLoad[`${punishmentNPC}-action`] =
        NPC_TEXTURES[`${punishmentNPC}-action`];
    }

    Promise.all(
      Object.entries(toLoad).map(async ([key, url]) => {
        const tex = await Assets.load(url);
        return [key, tex] as [string, Texture];
      }),
    ).then((entries) => {
      setTextures(Object.fromEntries(entries));
    });
  }, [npcsPresent, punishmentNPC]);

  // Trigger punishment animation end after delay
  useEffect(() => {
    if (!punishmentNPC) return;
    const timer = setTimeout(onPunishmentAnimDone, 2000);
    return () => clearTimeout(timer);
  }, [punishmentNPC, onPunishmentAnimDone]);

  return (
    <pixiContainer>
      {/* Background */}
      {textures.bg && (
        <pixiSprite texture={textures.bg} x={0} y={0} width={1000} height={350} />
      )}

      {/* Monitor */}
      {textures.monitor && (
        <pixiSprite
          texture={textures.monitor}
          x={280}
          y={180}
          width={128}
          height={96}
        />
      )}

      {/* Angga */}
      {textures.angga && (
        <pixiSprite
          texture={textures.angga}
          anchor={0.5}
          x={400}
          y={280}
          width={64}
          height={64}
        />
      )}

      {/* NPCs */}
      {npcsPresent.map((npc) => {
        const isActing = punishmentNPC === npc;
        const texKey = isActing ? `${npc}-action` : npc;
        const tex = textures[texKey];
        if (!tex) return null;
        const pos = NPC_POSITIONS[npc];
        const w = isActing ? 96 : 64;
        return (
          <pixiSprite
            key={npc}
            texture={tex}
            anchor={0.5}
            x={pos.x}
            y={pos.y}
            width={w}
            height={64}
          />
        );
      })}
    </pixiContainer>
  );
}

export default function OfficeScene(props: OfficeSceneProps) {
  return (
    <Application
      background="#1a1a2e"
      resizeTo={undefined}
      width={1000}
      height={350}
    >
      <OfficeSceneInner {...props} />
    </Application>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/game/
git commit -m "feat: add PixiJS office scene with NPC sprites, remove v1 game components"
```

---

### Task 5: Create UI Components

**Files:**
- Create: `src/ui/TaskProgress.tsx`
- Create: `src/ui/CodeFixTask.tsx`
- Create: `src/ui/TerminalTask.tsx`
- Create: `src/ui/DialogBubble.tsx`
- Delete: `src/ui/HUD.tsx`
- Delete: `src/ui/Terminal.tsx`

- [ ] **Step 1: Delete old UI components**

```bash
rm src/ui/HUD.tsx src/ui/Terminal.tsx
```

- [ ] **Step 2: Create src/ui/TaskProgress.tsx**

```tsx
type TaskProgressProps = {
  total: number;
  current: number;
  results: boolean[];
};

export default function TaskProgress({
  total,
  current,
  results,
}: TaskProgressProps) {
  return (
    <div className="task-progress">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`task-dot ${i < results.length ? "done" : ""} ${i === current ? "active" : ""}`}
        >
          {i < results.length ? "✓" : i + 1}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create src/ui/CodeFixTask.tsx**

```tsx
import { TaskOption } from "../types";

type CodeFixTaskProps = {
  title: string;
  code: string;
  options: TaskOption[];
  onAnswer: (correct: boolean) => void;
};

export default function CodeFixTask({
  title,
  code,
  options,
  onAnswer,
}: CodeFixTaskProps) {
  return (
    <div className="task-panel">
      <h3 className="task-title">{title}</h3>
      <pre className="code-viewer">
        <code>{code}</code>
      </pre>
      <div className="task-options">
        {options.map((opt, i) => (
          <button
            key={i}
            className="btn btn-option"
            onClick={() => onAnswer(opt.correct)}
          >
            {String.fromCharCode(65 + i)}) {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create src/ui/TerminalTask.tsx**

```tsx
import { useState, FormEvent } from "react";

type TerminalTaskProps = {
  title: string;
  prompt: string;
  correctAnswer: string;
  onAnswer: (correct: boolean) => void;
};

export default function TerminalTask({
  title,
  prompt,
  correctAnswer,
  onAnswer,
}: TerminalTaskProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim().toLowerCase();
    const expected = correctAnswer.trim().toLowerCase();
    onAnswer(trimmed === expected);
    setInput("");
  };

  return (
    <div className="task-panel">
      <h3 className="task-title">{title}</h3>
      <div className="terminal-prompt">{prompt}</div>
      <form className="terminal-input-form" onSubmit={handleSubmit}>
        <span className="terminal-caret">&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik command..."
          autoFocus
        />
        <button type="submit" className="btn btn-primary btn-submit">
          Enter
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Create src/ui/DialogBubble.tsx**

```tsx
type DialogBubbleProps = {
  speaker: string;
  text: string;
};

export default function DialogBubble({ speaker, text }: DialogBubbleProps) {
  return (
    <div className="dialog-bubble">
      <span className="dialog-speaker">{speaker}:</span> "{text}"
    </div>
  );
}
```

- [ ] **Step 6: Update src/ui/Briefing.tsx**

Replace the entire file:

```tsx
type BriefingProps = {
  onAccept: () => void;
};

export default function Briefing({ onAccept }: BriefingProps) {
  return (
    <div className="screen-center">
      <div className="briefing-card">
        <h2>Hari Ini di Kantor</h2>
        <p className="ohim-message">
          Ohim: "Angga, fix bug ini sebelum deadline. Gua awasin lu."
        </p>
        <p className="objective">Selesaikan 3 task coding untuk survive.</p>
        <button className="btn btn-primary" onClick={onAccept}>
          Terima Kerjaan
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Update src/ui/Result.tsx**

Replace the entire file:

```tsx
import { ResultType } from "../types";

type ResultProps = {
  result: ResultType;
  onRetry: () => void;
  onMenu: () => void;
};

const RESULT_MESSAGES: Record<string, { text: string; className: string }> = {
  win: {
    text: "Deploy berhasil! Angga selamat... untuk hari ini.",
    className: "win",
  },
  fired: {
    text: "ANGGA DIPECAT! Mang Alif sudah muak dengan developer yang gabisa ngoding.",
    className: "lose",
  },
};

export default function Result({ result, onRetry, onMenu }: ResultProps) {
  const msg = RESULT_MESSAGES[result ?? "win"];

  return (
    <div className="screen-center">
      <div className={`result-message ${msg.className}`}>{msg.text}</div>
      <div className="result-buttons">
        {result === "win" ? (
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

- [ ] **Step 8: Commit**

```bash
git add src/ui/
git commit -m "feat: add task UI components (CodeFix, Terminal, Progress, Dialog), update Briefing & Result"
```

---

### Task 6: Rewrite App.tsx (State Machine & Layout)

**Files:**
- Modify: `src/App.tsx` (full rewrite)

- [ ] **Step 1: Rewrite src/App.tsx**

Replace the entire file:

```tsx
import { useReducer, useCallback } from "react";
import { GameState, GameAction } from "./types";
import { TASKS } from "./data/TaskData";
import Menu from "./ui/Menu";
import Briefing from "./ui/Briefing";
import TaskProgress from "./ui/TaskProgress";
import CodeFixTask from "./ui/CodeFixTask";
import TerminalTask from "./ui/TerminalTask";
import DialogBubble from "./ui/DialogBubble";
import Result from "./ui/Result";
import OfficeScene from "./game/OfficeScene";

const NPC_NAMES: Record<string, string> = {
  ohim: "Ohim",
  aris: "Mang Aris",
  alif: "Mang Alif",
};

const initialState: GameState = {
  screen: "menu",
  currentTask: 0,
  failures: 0,
  taskResults: [],
  result: null,
  punishmentNPC: null,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return { ...initialState, screen: "briefing" };

    case "ACCEPT_TICKET":
      return { ...initialState, screen: "task" };

    case "SUBMIT_ANSWER": {
      if (action.correct) {
        const newResults = [...state.taskResults, true];
        const nextTask = state.currentTask + 1;
        if (nextTask >= TASKS.length) {
          return { ...state, screen: "result", result: "win", taskResults: newResults };
        }
        return { ...state, currentTask: nextTask, taskResults: newResults };
      }
      // Wrong answer
      const newFailures = state.failures + 1;
      const task = TASKS[state.currentTask];
      if (newFailures >= 3) {
        return {
          ...state,
          screen: "punishment",
          failures: newFailures,
          punishmentNPC: task.onFail.npc,
        };
      }
      return {
        ...state,
        screen: "punishment",
        failures: newFailures,
        punishmentNPC: task.onFail.npc,
      };
    }

    case "PUNISHMENT_DONE": {
      if (state.failures >= 3) {
        return { ...state, screen: "result", result: "fired", punishmentNPC: null };
      }
      return { ...state, screen: "task", punishmentNPC: null };
    }

    case "RETRY":
      return { ...initialState, screen: "briefing" };

    case "BACK_TO_MENU":
      return { ...initialState };

    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      dispatch({ type: "SUBMIT_ANSWER", correct });
    },
    [],
  );

  const handlePunishmentDone = useCallback(() => {
    dispatch({ type: "PUNISHMENT_DONE" });
  }, []);

  switch (state.screen) {
    case "menu":
      return <Menu onStart={() => dispatch({ type: "START_GAME" })} />;

    case "briefing":
      return (
        <Briefing onAccept={() => dispatch({ type: "ACCEPT_TICKET" })} />
      );

    case "task": {
      const task = TASKS[state.currentTask];
      return (
        <div className="game-layout">
          <TaskProgress
            total={TASKS.length}
            current={state.currentTask}
            results={state.taskResults}
          />
          <div className="scene-area">
            <OfficeScene
              npcsPresent={task.scene.npcsPresent}
              punishmentNPC={null}
              onPunishmentAnimDone={() => {}}
            />
          </div>
          <div className="task-area">
            {task.type === "code-fix" && task.code && task.options && (
              <CodeFixTask
                title={task.title}
                code={task.code}
                options={task.options}
                onAnswer={handleAnswer}
              />
            )}
            {task.type === "terminal" && task.prompt && task.correctAnswer && (
              <TerminalTask
                title={task.title}
                prompt={task.prompt}
                correctAnswer={task.correctAnswer}
                onAnswer={handleAnswer}
              />
            )}
          </div>
        </div>
      );
    }

    case "punishment": {
      const task = TASKS[state.currentTask];
      const npc = state.punishmentNPC!;
      return (
        <div className="game-layout">
          <div className="scene-area">
            <OfficeScene
              npcsPresent={[...task.scene.npcsPresent, npc].filter(
                (v, i, a) => a.indexOf(v) === i,
              )}
              punishmentNPC={npc}
              onPunishmentAnimDone={handlePunishmentDone}
            />
          </div>
          <div className="punishment-overlay">
            <DialogBubble
              speaker={NPC_NAMES[npc]}
              text={task.onFail.dialog}
            />
          </div>
        </div>
      );
    }

    case "result":
      return (
        <Result
          result={state.result}
          onRetry={() => dispatch({ type: "RETRY" })}
          onMenu={() => dispatch({ type: "BACK_TO_MENU" })}
        />
      );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: rewrite App.tsx with v2 task mode state machine"
```

---

### Task 7: Update CSS Styles

**Files:**
- Modify: `public/style.css` (rewrite)

- [ ] **Step 1: Rewrite public/style.css**

Replace the entire file:

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

/* Game layout */
.game-layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.scene-area {
  flex: 0 0 350px;
}

.scene-area canvas {
  display: block;
  width: 100%;
}

.task-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 16px;
  min-height: 0;
  overflow-y: auto;
}

/* Task Progress */
.task-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 16px;
  background: #12121f;
  border-bottom: 1px solid #2a2a4a;
  font-size: 14px;
  font-weight: 600;
}

.task-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a4a;
  color: #8b949e;
  font-size: 14px;
}

.task-dot.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.task-dot.done {
  background: #27ae60;
  color: white;
}

/* Task panel */
.task-panel {
  width: 100%;
  max-width: 700px;
}

.task-title {
  font-size: 18px;
  margin: 0 0 16px;
  color: #e0e0e0;
}

.code-viewer {
  background: #0d1117;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: #e6edf3;
  overflow-x: auto;
  margin-bottom: 16px;
}

.code-viewer code {
  white-space: pre;
}

.task-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-option {
  text-align: left;
  padding: 12px 16px;
  background: #1a1a2e;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.btn-option:hover {
  border-color: #667eea;
  background: #1e1e3a;
}

/* Terminal task */
.terminal-prompt {
  background: #0d1117;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: #f97583;
  margin-bottom: 16px;
}

.terminal-input-form {
  display: flex;
  gap: 8px;
  align-items: center;
  background: #0d1117;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  padding: 8px 12px;
}

.terminal-caret {
  color: #58a6ff;
  font-family: 'JetBrains Mono', monospace;
}

.terminal-input-form input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e6edf3;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
}

.terminal-input-form input::placeholder {
  color: #484f58;
}

.btn-submit {
  padding: 8px 16px;
  font-size: 13px;
}

/* Dialog bubble */
.dialog-bubble {
  background: #1a1a2e;
  border: 2px solid #f97583;
  border-radius: 12px;
  padding: 24px 32px;
  font-size: 20px;
  text-align: center;
  max-width: 500px;
  animation: dialog-pop 0.3s ease-out;
}

.dialog-speaker {
  color: #f97583;
  font-weight: 700;
}

@keyframes dialog-pop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Punishment overlay */
.punishment-overlay {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.6);
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

- [ ] **Step 2: Commit**

```bash
git add public/style.css
git commit -m "feat: update CSS for v2 task mode layout and components"
```

---

### Task 8: Build Verification & Menu Update

**Files:**
- Modify: `src/ui/Menu.tsx` (update subtitle)

- [ ] **Step 1: Update Menu.tsx subtitle**

In `src/ui/Menu.tsx`, change the subtitle to reflect v2:

```tsx
type MenuProps = {
  onStart: () => void;
};

export default function Menu({ onStart }: MenuProps) {
  return (
    <div className="screen-center">
      <h1 className="game-title">Enggan Ngoding</h1>
      <p className="game-subtitle">
        Fix bug atau dipecat. Pilihan ada di tangan lu.
      </p>
      <button className="btn btn-primary" onClick={onStart}>
        Mulai
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Run build to verify no errors**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript or lint errors.

- [ ] **Step 3: Run dev server and manually test**

```bash
npm run dev
```

Manual test checklist:
1. Menu shows with new subtitle
2. Click "Mulai" → Briefing with Ohim dialog
3. Click "Terima Kerjaan" → Task 1 scene with code
4. Select wrong answer → Punishment scene (Ohim slaps, dialog)
5. After punishment → Back to Task 1
6. Select correct answer → Task 2 (terminal)
7. Type wrong command → Punishment (Mang Aris)
8. Type `git push origin main` → Task 3
9. Select correct answer → Win screen
10. Test fail 3 times → Fired screen

- [ ] **Step 4: Commit menu update**

```bash
git add src/ui/Menu.tsx
git commit -m "feat: update menu subtitle for v2"
```

- [ ] **Step 5: Final commit -- tag v2**

```bash
git tag v2.0.0
```
