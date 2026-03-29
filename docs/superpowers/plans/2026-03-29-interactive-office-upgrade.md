# Interactive Office Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fullscreen responsive canvas, interactive office with walk/idle spritesheet animations, clickable objects, mock terminal hints, and improved punishment sequences.

**Architecture:** CSS scale-to-fit for responsive. PixiJS `Spritesheet` + `AnimatedSprite` for character animations. New `"office"` screen state with walk-in→idle→click-monitor flow. Spritesheets generated via Nano Banana + assembled via Python Pillow. All rendering stays in single PixiJS canvas.

**Tech Stack:** PixiJS 8 (Spritesheet, AnimatedSprite), @pixi/react 8, React 19, Nano Banana MCP (frame generation), rembg + Pillow (post-processing + spritesheet assembly)

---

### Task 1: Generate Spritesheet Frames & Assemble

**Files:**
- Create: `public/assets/angga-spritesheet.png`
- Create: `public/assets/angga-spritesheet.json`
- Create: `public/assets/ohim-spritesheet.png`
- Create: `public/assets/ohim-spritesheet.json`
- Create: `public/assets/mang-aris-spritesheet.png`
- Create: `public/assets/mang-aris-spritesheet.json`
- Create: `public/assets/mang-alif-spritesheet.png`
- Create: `public/assets/mang-alif-spritesheet.json`
- Create: `public/assets/door.png`
- Delete: `public/assets/angga-sit.png`
- Delete: `public/assets/ohim-stand.png`, `ohim-slap.png`
- Delete: `public/assets/mang-aris-stand.png`, `mang-aris-angry.png`
- Delete: `public/assets/mang-alif-stand.png`, `mang-alif-kick.png`

- [ ] **Step 1: Generate Angga frames via Nano Banana**

Generate 8 individual frames. Use consistent prompt prefix for style consistency:

| Frame | Prompt |
|-------|--------|
| angga-walk-1 | "Pixel art, male programmer walking left foot forward, side view, dark hair hoodie, 16-bit style, clean edges, transparent bg" |
| angga-walk-2 | "Pixel art, male programmer walking standing mid-stride, side view, dark hair hoodie, 16-bit style, clean edges, transparent bg" |
| angga-walk-3 | "Pixel art, male programmer walking right foot forward, side view, dark hair hoodie, 16-bit style, clean edges, transparent bg" |
| angga-walk-4 | "Pixel art, male programmer walking standing pose, side view, dark hair hoodie, 16-bit style, clean edges, transparent bg" |
| angga-idle-1 | "Pixel art, male programmer sitting at desk normal pose, side view, dark hair hoodie, 16-bit style, clean edges, transparent bg" |
| angga-idle-2 | "Pixel art, male programmer sitting at desk typing keyboard, side view, dark hair hoodie, 16-bit style, clean edges, transparent bg" |
| angga-idle-3 | "Pixel art, male programmer sitting at desk looking at monitor, side view, dark hair hoodie, 16-bit style, clean edges, transparent bg" |
| angga-sit-down | "Pixel art, male programmer transitioning from standing to sitting at desk, side view, dark hair hoodie, 16-bit style, clean edges, transparent bg" |

Save each to `/tmp/frames/angga-walk-1.png` etc.

- [ ] **Step 2: Generate NPC frames via Nano Banana**

Per NPC (ohim, mang-aris, mang-alif), generate 6 frames each:

**Ohim:**
| Frame | Prompt |
|-------|--------|
| walk-1 to walk-4 | "Pixel art, angry male manager walking [left foot forward / mid-stride / right foot forward / standing], side view, office attire, 16-bit style, transparent bg" |
| stand | "Pixel art, angry male manager standing arms crossed, side view, office attire, 16-bit style, transparent bg" |
| action | "Pixel art, angry male manager slapping programmer at desk, side view, action pose, 16-bit style, transparent bg" |

**Mang Aris:** same pattern but "serious male CTO, glasses, formal shirt"
**Mang Alif:** same pattern but "stern male founder CEO, suit"

- [ ] **Step 3: Generate door sprite**

Prompt: "Pixel art, office door slightly open, side view, 16-bit style, clean edges, transparent bg"
Save to `/tmp/frames/door.png`

- [ ] **Step 4: Post-process all frames with rembg + Pillow**

```python
/tmp/imgtools/bin/python3 << 'PYEOF'
from rembg import remove
from PIL import Image
import io, os, glob

frames_dir = "/tmp/frames"
for path in glob.glob(f"{frames_dir}/*.png"):
    print(f"Processing {os.path.basename(path)}...")
    with open(path, "rb") as f:
        data = f.read()
    output = remove(data)
    img = Image.open(io.BytesIO(output)).convert("RGBA")
    # Door is taller
    if "door" in path:
        img.thumbnail((64, 96), Image.LANCZOS)
    else:
        img.thumbnail((64, 64), Image.LANCZOS)
    img.save(path, "PNG", optimize=True)
    print(f"  -> {img.size[0]}x{img.size[1]}")
print("Done!")
PYEOF
```

- [ ] **Step 5: Assemble spritesheets with Pillow**

```python
/tmp/imgtools/bin/python3 << 'PYEOF'
from PIL import Image
import json, os

ASSETS = "/home/nst/WebstormProjects/enggan-ngoding/public/assets"
FRAMES = "/tmp/frames"

def make_spritesheet(name, frame_names, frame_size=64):
    frames = []
    for fn in frame_names:
        path = f"{FRAMES}/{fn}.png"
        img = Image.open(path).convert("RGBA")
        # Pad to exact frame_size x frame_size
        padded = Image.new("RGBA", (frame_size, frame_size), (0,0,0,0))
        padded.paste(img, ((frame_size - img.width)//2, (frame_size - img.height)//2))
        frames.append(padded)

    sheet = Image.new("RGBA", (frame_size * len(frames), frame_size), (0,0,0,0))
    atlas = {"frames": {}, "meta": {"image": f"{name}-spritesheet.png", "size": {"w": frame_size * len(frames), "h": frame_size}}}

    for i, (frame, fn) in enumerate(zip(frames, frame_names)):
        sheet.paste(frame, (i * frame_size, 0))
        # Extract frame label (e.g., "angga-walk-1" -> "walk-1")
        label = fn.split("-", 1)[1] if "-" in fn else fn
        atlas["frames"][label] = {"frame": {"x": i * frame_size, "y": 0, "w": frame_size, "h": frame_size}}

    sheet.save(f"{ASSETS}/{name}-spritesheet.png", "PNG", optimize=True)
    with open(f"{ASSETS}/{name}-spritesheet.json", "w") as f:
        json.dump(atlas, f, indent=2)
    print(f"{name}: {len(frames)} frames, {sheet.size}")

# Angga: 8 frames
make_spritesheet("angga", [
    "angga-walk-1", "angga-walk-2", "angga-walk-3", "angga-walk-4",
    "angga-idle-1", "angga-idle-2", "angga-idle-3", "angga-sit-down"
])

# NPCs: 6 frames each
for npc in ["ohim", "mang-aris", "mang-alif"]:
    make_spritesheet(npc, [
        f"{npc}-walk-1", f"{npc}-walk-2", f"{npc}-walk-3", f"{npc}-walk-4",
        f"{npc}-stand", f"{npc}-action"
    ])

print("All spritesheets assembled!")
PYEOF
```

- [ ] **Step 6: Copy door sprite and delete old assets**

```bash
cp /tmp/frames/door.png public/assets/door.png
rm public/assets/angga-sit.png public/assets/ohim-stand.png public/assets/ohim-slap.png \
   public/assets/mang-aris-stand.png public/assets/mang-aris-angry.png \
   public/assets/mang-alif-stand.png public/assets/mang-alif-kick.png
```

- [ ] **Step 7: Commit**

```bash
git add public/assets/
git commit -m "feat: add character spritesheets and door sprite, remove old single-frame assets"
```

---

### Task 2: Update Types and Task Data

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/data/TaskData.ts`

- [ ] **Step 1: Update types/index.ts**

Replace entire file:

```typescript
export type Screen =
  | "menu"
  | "briefing"
  | "office"
  | "task"
  | "punishment"
  | "result";
export type ResultType = "win" | "fired" | null;
export type PunishmentNPC = "ohim" | "aris" | "alif";
export type TaskType = "code-fix" | "terminal";
export type OfficePhase = "walk-in" | "idle" | null;

export type TaskOption = {
  text: string;
  correct: boolean;
};

export type TaskDef = {
  id: number;
  type: TaskType;
  title: string;
  hint: string;
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
  officePhase: OfficePhase;
};

export type GameAction =
  | { type: "START_GAME" }
  | { type: "ACCEPT_TICKET" }
  | { type: "OFFICE_READY" }
  | { type: "CLICK_MONITOR" }
  | { type: "CLICK_DOOR" }
  | { type: "SUBMIT_ANSWER"; correct: boolean }
  | { type: "PUNISHMENT_DONE" }
  | { type: "RETRY" }
  | { type: "BACK_TO_MENU" };
```

- [ ] **Step 2: Update data/TaskData.ts**

Replace entire file:

```typescript
import { TaskDef } from "../types";

export const TASKS: TaskDef[] = [
  {
    id: 1,
    type: "code-fix",
    title: "Fix Bug #1: Unreachable Code",
    hint: `$ node hitungGaji.js
Error: bonus is not defined
Expected output: 75000
Got: 50000`,
    scene: {
      npcsPresent: ["ohim"],
    },
    code: `function hitungGaji(jam) {
  let gaji = jam * 50000
  return gaji
  gaji = gaji + bonus  // bug: unreachable code
}`,
    options: [
      {
        text: 'Pindahkan "gaji = gaji + bonus" ke sebelum return',
        correct: true,
      },
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
    hint: `$ git status
On branch feature/fix-login
Your branch is ahead of 'origin/main' by 2 commits.

$ curl https://api.prod.com/health
503 Service Unavailable`,
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
    hint: `$ node listUsers.js
Aris
Alif
Ohim
undefined`,
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
git add src/types/index.ts src/data/TaskData.ts
git commit -m "feat: add office screen state, hint field, and updated task data"
```

---

### Task 3: Create SpriteAnimation Component

**Files:**
- Create: `src/game/SpriteAnimation.tsx`

- [ ] **Step 1: Create src/game/SpriteAnimation.tsx**

Wrapper around PixiJS AnimatedSprite that loads a spritesheet JSON + PNG and plays named animation ranges.

```tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { extend, useTick } from "@pixi/react";
import { Container, Sprite, Texture, Assets, Rectangle } from "pixi.js";

extend({ Container, Sprite });

type SpriteAnimationProps = {
  sheetJson: string;
  sheetImage: string;
  frames: string[];
  fps?: number;
  loop?: boolean;
  playing?: boolean;
  x: number;
  y: number;
  anchor?: number;
  scaleX?: number;
  onComplete?: () => void;
};

export default function SpriteAnimation({
  sheetJson,
  sheetImage,
  frames,
  fps = 8,
  loop = true,
  playing = true,
  x,
  y,
  anchor = 0.5,
  scaleX = 1,
  onComplete,
}: SpriteAnimationProps) {
  const [textures, setTextures] = useState<Texture[]>([]);
  const frameRef = useRef(0);
  const elapsedRef = useRef(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const baseTexture = await Assets.load(sheetImage);
      const jsonResp = await fetch(sheetJson);
      const atlas = await jsonResp.json();

      const loaded: Texture[] = frames.map((name) => {
        const f = atlas.frames[name];
        if (!f) return Texture.EMPTY;
        const rect = new Rectangle(f.frame.x, f.frame.y, f.frame.w, f.frame.h);
        return new Texture({ source: baseTexture.source, frame: rect });
      });

      if (!cancelled) {
        setTextures(loaded);
        frameRef.current = 0;
        elapsedRef.current = 0;
        completedRef.current = false;
        setCurrentFrame(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sheetJson, sheetImage, frames]);

  useTick((ticker) => {
    if (!playing || textures.length === 0 || completedRef.current) return;
    elapsedRef.current += ticker.deltaMS;
    const interval = 1000 / fps;
    if (elapsedRef.current >= interval) {
      elapsedRef.current -= interval;
      const next = frameRef.current + 1;
      if (next >= textures.length) {
        if (loop) {
          frameRef.current = 0;
          setCurrentFrame(0);
        } else {
          completedRef.current = true;
          onComplete?.();
        }
      } else {
        frameRef.current = next;
        setCurrentFrame(next);
      }
    }
  });

  if (textures.length === 0) return null;

  return (
    <pixiSprite
      texture={textures[currentFrame] ?? Texture.EMPTY}
      x={x}
      y={y}
      anchor={anchor}
      scale={{ x: scaleX, y: 1 }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/SpriteAnimation.tsx
git commit -m "feat: add SpriteAnimation component for spritesheet playback"
```

---

### Task 4: Create MonitorHint and ClickableObject Components

**Files:**
- Create: `src/game/MonitorHint.tsx`
- Create: `src/game/ClickableObject.tsx`

- [ ] **Step 1: Create src/game/MonitorHint.tsx**

```tsx
import { extend } from "@pixi/react";
import { Container, Text, TextStyle } from "pixi.js";

extend({ Container, Text });

type MonitorHintProps = {
  hint: string;
  x: number;
  y: number;
};

export default function MonitorHint({ hint, x, y }: MonitorHintProps) {
  const style = new TextStyle({
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 9,
    fill: 0x7ee787,
    lineHeight: 12,
  });

  return <pixiText text={hint} style={style} x={x} y={y} />;
}
```

- [ ] **Step 2: Create src/game/ClickableObject.tsx**

```tsx
import { useRef, useEffect, useState, useCallback } from "react";
import { extend, useTick } from "@pixi/react";
import { Container, Sprite, Texture } from "pixi.js";

extend({ Container, Sprite });

type ClickableObjectProps = {
  texture: Texture;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick: () => void;
  enabled?: boolean;
};

export default function ClickableObject({
  texture,
  x,
  y,
  width,
  height,
  onClick,
  enabled = true,
}: ClickableObjectProps) {
  const spriteRef = useRef<Sprite>(null);
  const [glowAlpha, setGlowAlpha] = useState(0.7);
  const timeRef = useRef(0);

  useEffect(() => {
    const sprite = spriteRef.current;
    if (!sprite) return;
    sprite.eventMode = enabled ? "static" : "none";
    sprite.cursor = enabled ? "pointer" : "default";

    const handleTap = () => {
      if (enabled) onClick();
    };
    sprite.on("pointertap", handleTap);
    return () => {
      sprite.off("pointertap", handleTap);
    };
  }, [onClick, enabled]);

  useTick((ticker) => {
    if (!enabled) return;
    timeRef.current += ticker.deltaMS * 0.003;
    setGlowAlpha(0.7 + Math.sin(timeRef.current) * 0.3);
  });

  return (
    <pixiSprite
      ref={spriteRef}
      texture={texture}
      x={x}
      y={y}
      width={width}
      height={height}
      alpha={enabled ? glowAlpha : 0.5}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/game/MonitorHint.tsx src/game/ClickableObject.tsx
git commit -m "feat: add MonitorHint and ClickableObject components"
```

---

### Task 5: Rewrite OfficeScene (Interactive)

**Files:**
- Modify: `src/game/OfficeScene.tsx` (full rewrite)

- [ ] **Step 1: Rewrite src/game/OfficeScene.tsx**

```tsx
import { useEffect, useState, useCallback } from "react";
import { extend } from "@pixi/react";
import { Container, Sprite, Texture, Assets } from "pixi.js";
import { PunishmentNPC, OfficePhase } from "../types";
import SpriteAnimation from "./SpriteAnimation";
import MonitorHint from "./MonitorHint";
import ClickableObject from "./ClickableObject";

extend({ Container, Sprite });

type OfficeSceneProps = {
  npcsPresent: PunishmentNPC[];
  phase: OfficePhase;
  hint: string;
  onWalkInDone: () => void;
  onClickMonitor: () => void;
  onClickDoor: () => void;
};

const WALK_FRAMES = ["walk-1", "walk-2", "walk-3", "walk-4"];
const IDLE_FRAMES = ["idle-1", "idle-2", "idle-3"];
const NPC_STAND_FRAMES = ["stand"];

const NPC_SHEETS: Record<string, { json: string; image: string }> = {
  ohim: {
    json: "/assets/ohim-spritesheet.json",
    image: "/assets/ohim-spritesheet.png",
  },
  aris: {
    json: "/assets/mang-aris-spritesheet.json",
    image: "/assets/mang-aris-spritesheet.png",
  },
  alif: {
    json: "/assets/mang-alif-spritesheet.json",
    image: "/assets/mang-alif-spritesheet.png",
  },
};

const NPC_POSITIONS: Record<string, number> = {
  ohim: 700,
  aris: 800,
  alif: 600,
};

export default function OfficeScene({
  npcsPresent,
  phase,
  hint,
  onWalkInDone,
  onClickMonitor,
  onClickDoor,
}: OfficeSceneProps) {
  const [bgTexture, setBgTexture] = useState(Texture.EMPTY);
  const [monitorTexture, setMonitorTexture] = useState(Texture.EMPTY);
  const [doorTexture, setDoorTexture] = useState(Texture.EMPTY);
  const [anggaX, setAnggaX] = useState(900);
  const isIdle = phase === "idle";

  useEffect(() => {
    Assets.load("/assets/office-bg.png").then(setBgTexture);
    Assets.load("/assets/monitor.png").then(setMonitorTexture);
    Assets.load("/assets/door.png").then(setDoorTexture);
  }, []);

  // Walk-in animation: move Angga from door (900) to desk (400)
  useEffect(() => {
    if (phase !== "walk-in") {
      setAnggaX(phase === "idle" ? 400 : 900);
      return;
    }
    setAnggaX(900);
    const start = Date.now();
    const duration = 2000;
    const from = 900;
    const to = 400;
    let raf: number;
    const animate = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t * (2 - t); // ease-out
      setAnggaX(from + (to - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        onWalkInDone();
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase, onWalkInDone]);

  const isWalking = phase === "walk-in";

  return (
    <pixiContainer>
      {/* Background */}
      {bgTexture !== Texture.EMPTY && (
        <pixiSprite texture={bgTexture} x={0} y={0} width={1000} height={350} />
      )}

      {/* Door (clickable) */}
      {doorTexture !== Texture.EMPTY && (
        <ClickableObject
          texture={doorTexture}
          x={900}
          y={220}
          width={64}
          height={96}
          onClick={onClickDoor}
          enabled={isIdle}
        />
      )}

      {/* Monitor (clickable) with hint */}
      {monitorTexture !== Texture.EMPTY && (
        <>
          <ClickableObject
            texture={monitorTexture}
            x={280}
            y={180}
            width={128}
            height={96}
            onClick={onClickMonitor}
            enabled={isIdle}
          />
          {isIdle && <MonitorHint hint={hint} x={290} y={190} />}
        </>
      )}

      {/* Angga */}
      <SpriteAnimation
        sheetJson="/assets/angga-spritesheet.json"
        sheetImage="/assets/angga-spritesheet.png"
        frames={isWalking ? WALK_FRAMES : IDLE_FRAMES}
        fps={isWalking ? 8 : 3}
        loop={true}
        playing={true}
        x={anggaX}
        y={280}
        scaleX={isWalking ? -1 : 1}
      />

      {/* NPCs standing */}
      {npcsPresent.map((npc) => {
        const sheet = NPC_SHEETS[npc];
        if (!sheet) return null;
        return (
          <SpriteAnimation
            key={npc}
            sheetJson={sheet.json}
            sheetImage={sheet.image}
            frames={NPC_STAND_FRAMES}
            fps={1}
            loop={true}
            playing={true}
            x={NPC_POSITIONS[npc]}
            y={280}
          />
        );
      })}
    </pixiContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/OfficeScene.tsx
git commit -m "feat: rewrite OfficeScene with walk-in animation, clickable objects, hints"
```

---

### Task 6: Rewrite PunishmentScene (NPC Walk-In/Out)

**Files:**
- Modify: `src/game/PunishmentScene.tsx` (full rewrite)

- [ ] **Step 1: Rewrite src/game/PunishmentScene.tsx**

```tsx
import { useEffect, useState, useCallback } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { PunishmentNPC } from "../types";
import SpriteAnimation from "./SpriteAnimation";

extend({ Container, Graphics, Text });

type PunishmentSceneProps = {
  npc: PunishmentNPC;
  speaker: string;
  dialog: string;
  onDone: () => void;
};

const NPC_SHEETS: Record<string, { json: string; image: string }> = {
  ohim: {
    json: "/assets/ohim-spritesheet.json",
    image: "/assets/ohim-spritesheet.png",
  },
  aris: {
    json: "/assets/mang-aris-spritesheet.json",
    image: "/assets/mang-aris-spritesheet.png",
  },
  alif: {
    json: "/assets/mang-alif-spritesheet.json",
    image: "/assets/mang-alif-spritesheet.png",
  },
};

const WALK_FRAMES = ["walk-1", "walk-2", "walk-3", "walk-4"];
const ACTION_FRAMES = ["action"];

type Phase = "walk-in" | "action" | "walk-out";

export default function PunishmentScene({
  npc,
  speaker,
  dialog,
  onDone,
}: PunishmentSceneProps) {
  const [phase, setPhase] = useState<Phase>("walk-in");
  const [npcX, setNpcX] = useState(900);
  const sheet = NPC_SHEETS[npc];

  // Walk-in: 900 -> 500
  useEffect(() => {
    if (phase !== "walk-in") return;
    const start = Date.now();
    const duration = 1500;
    let raf: number;
    const animate = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = t * (2 - t);
      setNpcX(900 + (500 - 900) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setPhase("action");
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Action: show for 2s, then walk out
  useEffect(() => {
    if (phase !== "action") return;
    const timer = setTimeout(() => setPhase("walk-out"), 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  // Walk-out: 500 -> 900
  useEffect(() => {
    if (phase !== "walk-out") return;
    const start = Date.now();
    const duration = 1500;
    let raf: number;
    const animate = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = t * (2 - t);
      setNpcX(500 + (900 - 500) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        onDone();
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase, onDone]);

  const drawOverlay = useCallback((g: Graphics) => {
    g.clear();
    g.rect(0, 350, 1000, 350);
    g.fill({ color: 0x000000, alpha: 0.6 });
  }, []);

  const drawBubble = useCallback((g: Graphics) => {
    g.clear();
    g.roundRect(0, 0, 500, 120, 12);
    g.fill(0x1a1a2e);
    g.roundRect(0, 0, 500, 120, 12);
    g.stroke({ color: 0xf97583, width: 2 });
  }, []);

  const speakerStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize: 20,
    fontWeight: "700",
    fill: 0xf97583,
  });

  const dialogStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize: 20,
    fill: 0xe0e0e0,
    wordWrap: true,
    wordWrapWidth: 460,
  });

  const isWalking = phase === "walk-in" || phase === "walk-out";
  const facingLeft = phase === "walk-in";

  return (
    <pixiContainer>
      {/* NPC animated */}
      {sheet && (
        <SpriteAnimation
          sheetJson={sheet.json}
          sheetImage={sheet.image}
          frames={isWalking ? WALK_FRAMES : ACTION_FRAMES}
          fps={isWalking ? 8 : 1}
          loop={isWalking}
          playing={true}
          x={npcX}
          y={280}
          scaleX={facingLeft ? -1 : 1}
        />
      )}

      {/* Dialog overlay (only during action) */}
      {phase === "action" && (
        <>
          <pixiGraphics draw={drawOverlay} />
          <pixiContainer x={250} y={450}>
            <pixiGraphics draw={drawBubble} />
            <pixiText
              text={`${speaker}:`}
              style={speakerStyle}
              x={20}
              y={20}
            />
            <pixiText
              text={`"${dialog}"`}
              style={dialogStyle}
              x={20}
              y={55}
            />
          </pixiContainer>
        </>
      )}
    </pixiContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/PunishmentScene.tsx
git commit -m "feat: rewrite PunishmentScene with NPC walk-in, action, walk-out"
```

---

### Task 7: Rewrite App.tsx (Office State + Responsive)

**Files:**
- Modify: `src/App.tsx` (full rewrite)
- Modify: `public/style.css`

- [ ] **Step 1: Update public/style.css for responsive scaling**

Replace entire file:

```css
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700&display=swap");

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: #000;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
}

#app {
  width: 1000px;
  height: 700px;
  transform-origin: center center;
}

canvas {
  display: block;
}
```

- [ ] **Step 2: Rewrite src/App.tsx**

```tsx
import { useReducer, useCallback, useEffect } from "react";
import { Application, extend } from "@pixi/react";
import { Container, Graphics } from "pixi.js";
import { GameState, GameAction } from "./types";
import { TASKS } from "./data/TaskData";
import MenuScene from "./game/MenuScene";
import BriefingScene from "./game/BriefingScene";
import TaskScene from "./game/TaskScene";
import OfficeScene from "./game/OfficeScene";
import PunishmentScene from "./game/PunishmentScene";
import ResultScene from "./game/ResultScene";

extend({ Container, Graphics });

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
  officePhase: null,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return { ...initialState, screen: "briefing" };
    case "ACCEPT_TICKET":
      return {
        ...initialState,
        screen: "office",
        officePhase: "walk-in",
      };
    case "OFFICE_READY":
      return { ...state, officePhase: "idle" };
    case "CLICK_MONITOR":
      return { ...state, screen: "task", officePhase: null };
    case "CLICK_DOOR":
      return { ...initialState };
    case "SUBMIT_ANSWER": {
      if (action.correct) {
        const newResults = [...state.taskResults, true];
        const nextTask = state.currentTask + 1;
        if (nextTask >= TASKS.length) {
          return {
            ...state,
            screen: "result",
            result: "win",
            taskResults: newResults,
          };
        }
        return {
          ...state,
          screen: "office",
          officePhase: "idle",
          currentTask: nextTask,
          taskResults: newResults,
        };
      }
      const newFailures = state.failures + 1;
      const task = TASKS[state.currentTask];
      return {
        ...state,
        screen: "punishment",
        failures: newFailures,
        punishmentNPC: task.onFail.npc,
        officePhase: null,
      };
    }
    case "PUNISHMENT_DONE": {
      if (state.failures >= 3) {
        return {
          ...state,
          screen: "result",
          result: "fired",
          punishmentNPC: null,
        };
      }
      return {
        ...state,
        screen: "office",
        officePhase: "idle",
        punishmentNPC: null,
      };
    }
    case "RETRY":
      return {
        ...initialState,
        screen: "briefing",
      };
    case "BACK_TO_MENU":
      return { ...initialState };
    default:
      return state;
  }
}

function GameRoot() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleAnswer = useCallback((correct: boolean) => {
    dispatch({ type: "SUBMIT_ANSWER", correct });
  }, []);

  const handlePunishmentDone = useCallback(() => {
    dispatch({ type: "PUNISHMENT_DONE" });
  }, []);

  const handleWalkInDone = useCallback(() => {
    dispatch({ type: "OFFICE_READY" });
  }, []);

  const handleClickMonitor = useCallback(() => {
    dispatch({ type: "CLICK_MONITOR" });
  }, []);

  const handleClickDoor = useCallback(() => {
    dispatch({ type: "CLICK_DOOR" });
  }, []);

  switch (state.screen) {
    case "menu":
      return (
        <MenuScene onStart={() => dispatch({ type: "START_GAME" })} />
      );

    case "briefing":
      return (
        <BriefingScene
          onAccept={() => dispatch({ type: "ACCEPT_TICKET" })}
        />
      );

    case "office": {
      const task = TASKS[state.currentTask];
      return (
        <OfficeScene
          npcsPresent={task.scene.npcsPresent}
          phase={state.officePhase}
          hint={task.hint}
          onWalkInDone={handleWalkInDone}
          onClickMonitor={handleClickMonitor}
          onClickDoor={handleClickDoor}
        />
      );
    }

    case "task": {
      const task = TASKS[state.currentTask];
      return (
        <pixiContainer>
          <OfficeScene
            npcsPresent={task.scene.npcsPresent}
            phase="idle"
            hint={task.hint}
            onWalkInDone={() => {}}
            onClickMonitor={() => {}}
            onClickDoor={() => {}}
          />
          <TaskScene
            task={task}
            taskIndex={state.currentTask}
            totalTasks={TASKS.length}
            results={state.taskResults}
            onAnswer={handleAnswer}
          />
        </pixiContainer>
      );
    }

    case "punishment": {
      const task = TASKS[state.currentTask];
      const npc = state.punishmentNPC!;
      return (
        <pixiContainer>
          <OfficeScene
            npcsPresent={task.scene.npcsPresent}
            phase="idle"
            hint={task.hint}
            onWalkInDone={() => {}}
            onClickMonitor={() => {}}
            onClickDoor={() => {}}
          />
          <PunishmentScene
            npc={npc}
            speaker={NPC_NAMES[npc]}
            dialog={task.onFail.dialog}
            onDone={handlePunishmentDone}
          />
        </pixiContainer>
      );
    }

    case "result":
      return (
        <ResultScene
          result={state.result}
          onRetry={() => dispatch({ type: "RETRY" })}
          onMenu={() => dispatch({ type: "BACK_TO_MENU" })}
        />
      );
  }
}

function useResponsiveScale() {
  useEffect(() => {
    const resize = () => {
      const app = document.getElementById("app");
      if (!app) return;
      const scale = Math.min(
        window.innerWidth / 1000,
        window.innerHeight / 700,
      );
      app.style.transform = `scale(${scale})`;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
}

export default function App() {
  useResponsiveScale();

  return (
    <Application
      background="#0a0a0a"
      resizeTo={undefined}
      width={1000}
      height={700}
    >
      <GameRoot />
    </Application>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx public/style.css
git commit -m "feat: add office screen, responsive scaling, updated state machine"
```

---

### Task 8: Build Verify, Prettier, Push

**Files:**
- All source files (prettier)

- [ ] **Step 1: Run prettier**

```bash
npx prettier --write src/ public/style.css
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Fix any issues found**

If TypeScript/lint errors, fix them.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "chore: prettier formatting, build verification"
git push origin master
```
