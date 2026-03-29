# Full PixiJS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all HTML/CSS UI to full PixiJS rendering -- single canvas, no HTML overlays.

**Architecture:** One `<Application>` fullscreen canvas. All screens (menu, briefing, task, punishment, result) are PixiJS containers swapped by the React state machine. Buttons use PixiJS Graphics + Text with pointer events. Terminal text input uses a hidden HTML input synced to a PixiJS Text display (standard pattern for canvas text input). `@pixi/ui` NOT used -- we hand-roll simple buttons/text to avoid the dependency overhead for just 3 button types.

**Tech Stack:** PixiJS 8, @pixi/react 8, React 19, TypeScript

---

## File Structure

```
src/
├── App.tsx                      # Single Application, state machine dispatches to scenes
├── types/index.ts               # Unchanged
├── data/TaskData.ts             # Unchanged
├── game/
│   ├── OfficeScene.tsx          # Modify: office background + sprites (reuse existing)
│   ├── PixiButton.tsx           # Create: reusable PixiJS button (Graphics + Text)
│   ├── PixiTextInput.tsx        # Create: PixiJS text input with hidden HTML input
│   ├── MenuScene.tsx            # Create: menu screen in PixiJS
│   ├── BriefingScene.tsx        # Create: briefing screen in PixiJS
│   ├── TaskScene.tsx            # Create: task screen (office + code/terminal panel)
│   ├── PunishmentScene.tsx      # Create: punishment overlay in PixiJS
│   └── ResultScene.tsx          # Create: result screen in PixiJS
├── ui/                          # DELETE entire directory (all HTML components)
```

**Canvas size:** 1000x700 (fixed). Office scene takes top 350px, UI takes bottom 350px.

---

### Task 1: Install dependencies and create PixiButton

**Files:**
- Create: `src/game/PixiButton.tsx`

- [ ] **Step 1: Verify pixi.js version is compatible**

```bash
cd /home/nst/WebstormProjects/enggan-ngoding
cat package.json | grep pixi
```

Expected: `pixi.js ^8.8.1` -- no new deps needed, we'll use built-in Graphics + Text.

- [ ] **Step 2: Create src/game/PixiButton.tsx**

```tsx
import { useCallback, useRef, useEffect } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Text, TextStyle } from "pixi.js";

extend({ Container, Graphics, Text });

type PixiButtonProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  fontSize?: number;
};

const STYLES = {
  primary: { fill: 0x667eea, fillHover: 0x764ba2, text: 0xffffff },
  secondary: { fill: 0x2a2a4a, fillHover: 0x3a3a6a, text: 0xffffff },
};

export default function PixiButton({
  x,
  y,
  width,
  height,
  label,
  onClick,
  variant = "primary",
  fontSize = 16,
}: PixiButtonProps) {
  const gfxRef = useRef<Graphics>(null);
  const containerRef = useRef<Container>(null);
  const style = STYLES[variant];

  const drawButton = useCallback(
    (g: Graphics, hover: boolean) => {
      g.clear();
      g.roundRect(0, 0, width, height, 8);
      g.fill(hover ? style.fillHover : style.fill);
    },
    [width, height, style],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.eventMode = "static";
    container.cursor = "pointer";

    const onOver = () => {
      if (gfxRef.current) drawButton(gfxRef.current, true);
    };
    const onOut = () => {
      if (gfxRef.current) drawButton(gfxRef.current, false);
    };

    container.on("pointerover", onOver);
    container.on("pointerout", onOut);
    container.on("pointertap", onClick);

    return () => {
      container.off("pointerover", onOver);
      container.off("pointerout", onOut);
      container.off("pointertap", onClick);
    };
  }, [onClick, drawButton]);

  useEffect(() => {
    if (gfxRef.current) drawButton(gfxRef.current, false);
  }, [drawButton]);

  const textStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize,
    fontWeight: "600",
    fill: style.text,
  });

  return (
    <pixiContainer ref={containerRef} x={x} y={y}>
      <pixiGraphics ref={gfxRef} />
      <pixiText
        text={label}
        style={textStyle}
        anchor={0.5}
        x={width / 2}
        y={height / 2}
      />
    </pixiContainer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/game/PixiButton.tsx
git commit -m "feat: add reusable PixiJS button component"
```

---

### Task 2: Create PixiTextInput

**Files:**
- Create: `src/game/PixiTextInput.tsx`

- [ ] **Step 1: Create src/game/PixiTextInput.tsx**

This uses the hidden HTML input pattern: a real `<input>` is positioned off-screen to handle keyboard/IME, while PixiJS renders the visible text.

```tsx
import { useRef, useEffect, useState, useCallback } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Text, TextStyle } from "pixi.js";

extend({ Container, Graphics, Text });

type PixiTextInputProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  placeholder: string;
  onSubmit: (value: string) => void;
};

export default function PixiTextInput({
  x,
  y,
  width,
  height,
  placeholder,
  onSubmit,
}: PixiTextInputProps) {
  const containerRef = useRef<Container>(null);
  const bgRef = useRef<Graphics>(null);
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Create hidden HTML input on mount
  useEffect(() => {
    const input = document.createElement("input");
    input.type = "text";
    input.style.position = "absolute";
    input.style.left = "-9999px";
    input.style.top = "-9999px";
    input.style.opacity = "0";
    document.body.appendChild(input);
    inputRef.current = input;

    const handleInput = () => setValue(input.value);
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        onSubmit(input.value);
        input.value = "";
        setValue("");
      }
    };
    const handleBlur = () => setFocused(false);

    input.addEventListener("input", handleInput);
    input.addEventListener("keydown", handleKeydown);
    input.addEventListener("blur", handleBlur);

    // Auto-focus
    input.focus();
    setFocused(true);

    return () => {
      input.removeEventListener("input", handleInput);
      input.removeEventListener("keydown", handleKeydown);
      input.removeEventListener("blur", handleBlur);
      document.body.removeChild(input);
    };
  }, [onSubmit]);

  // Click to focus
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.eventMode = "static";
    container.cursor = "text";

    const handleClick = () => {
      inputRef.current?.focus();
      setFocused(true);
    };
    container.on("pointertap", handleClick);
    return () => {
      container.off("pointertap", handleClick);
    };
  }, []);

  // Draw background
  const drawBg = useCallback(
    (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, width, height, 8);
      g.fill(0x0d1117);
      g.roundRect(0, 0, width, height, 8);
      g.stroke({ color: focused ? 0x58a6ff : 0x2a2a4a, width: 1 });
    },
    [width, height, focused],
  );

  useEffect(() => {
    if (bgRef.current) drawBg(bgRef.current);
  }, [drawBg]);

  const displayText = value || placeholder;
  const textColor = value ? 0xe6edf3 : 0x484f58;
  const caretBlink = focused && value.length >= 0;

  const textStyle = new TextStyle({
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 14,
    fill: textColor,
  });

  const caretStyle = new TextStyle({
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 14,
    fill: 0x58a6ff,
  });

  return (
    <pixiContainer ref={containerRef} x={x} y={y}>
      <pixiGraphics ref={bgRef} />
      <pixiText text="> " style={caretStyle} x={12} y={height / 2} anchor={{ x: 0, y: 0.5 }} />
      <pixiText
        text={displayText + (caretBlink ? "_" : "")}
        style={textStyle}
        x={32}
        y={height / 2}
        anchor={{ x: 0, y: 0.5 }}
      />
    </pixiContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/PixiTextInput.tsx
git commit -m "feat: add PixiJS text input with hidden HTML input sync"
```

---

### Task 3: Create MenuScene

**Files:**
- Create: `src/game/MenuScene.tsx`

- [ ] **Step 1: Create src/game/MenuScene.tsx**

```tsx
import { extend } from "@pixi/react";
import { Container, Text, TextStyle } from "pixi.js";
import PixiButton from "./PixiButton";

extend({ Container, Text });

type MenuSceneProps = {
  onStart: () => void;
};

export default function MenuScene({ onStart }: MenuSceneProps) {
  const titleStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize: 48,
    fontWeight: "700",
    fill: [0x667eea, 0x764ba2],
    fillGradientType: 0,
  });

  const subtitleStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize: 16,
    fill: 0x8b949e,
  });

  return (
    <pixiContainer>
      <pixiText
        text="Enggan Ngoding"
        style={titleStyle}
        anchor={0.5}
        x={500}
        y={280}
      />
      <pixiText
        text="Fix bug atau dipecat. Pilihan ada di tangan lu."
        style={subtitleStyle}
        anchor={0.5}
        x={500}
        y={340}
      />
      <PixiButton
        x={400}
        y={390}
        width={200}
        height={48}
        label="Mulai"
        onClick={onStart}
      />
    </pixiContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/MenuScene.tsx
git commit -m "feat: add PixiJS menu scene"
```

---

### Task 4: Create BriefingScene

**Files:**
- Create: `src/game/BriefingScene.tsx`

- [ ] **Step 1: Create src/game/BriefingScene.tsx**

```tsx
import { useRef, useEffect, useCallback } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import PixiButton from "./PixiButton";

extend({ Container, Graphics, Text });

type BriefingSceneProps = {
  onAccept: () => void;
};

export default function BriefingScene({ onAccept }: BriefingSceneProps) {
  const cardRef = useRef<Graphics>(null);

  const drawCard = useCallback((g: Graphics) => {
    g.clear();
    g.roundRect(0, 0, 500, 280, 12);
    g.fill(0x1a1a2e);
    g.roundRect(0, 0, 500, 280, 12);
    g.stroke({ color: 0x2a2a4a, width: 1 });
  }, []);

  useEffect(() => {
    if (cardRef.current) drawCard(cardRef.current);
  }, [drawCard]);

  const titleStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize: 24,
    fontWeight: "700",
    fill: 0xe0e0e0,
  });

  const messageStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    fontStyle: "italic",
    fill: 0x8b949e,
    wordWrap: true,
    wordWrapWidth: 440,
  });

  const objectiveStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize: 18,
    fill: 0x58a6ff,
    wordWrap: true,
    wordWrapWidth: 440,
  });

  return (
    <pixiContainer x={250} y={210}>
      <pixiGraphics ref={cardRef} />
      <pixiText
        text="Hari Ini di Kantor"
        style={titleStyle}
        anchor={{ x: 0.5, y: 0 }}
        x={250}
        y={30}
      />
      <pixiText
        text={'Ohim: "Angga, fix bug ini sebelum deadline. Gua awasin lu."'}
        style={messageStyle}
        anchor={{ x: 0.5, y: 0 }}
        x={250}
        y={80}
      />
      <pixiText
        text="Selesaikan 3 task coding untuk survive."
        style={objectiveStyle}
        anchor={{ x: 0.5, y: 0 }}
        x={250}
        y={140}
      />
      <PixiButton
        x={150}
        y={200}
        width={200}
        height={48}
        label="Terima Kerjaan"
        onClick={onAccept}
      />
    </pixiContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/BriefingScene.tsx
git commit -m "feat: add PixiJS briefing scene"
```

---

### Task 5: Create TaskScene (code-fix + terminal)

**Files:**
- Create: `src/game/TaskScene.tsx`

- [ ] **Step 1: Create src/game/TaskScene.tsx**

This is the main gameplay screen. Top half = office scene (reuse OfficeScene inner content). Bottom half = task panel rendered in PixiJS.

```tsx
import { useRef, useEffect, useCallback } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { TaskDef } from "../types";
import PixiButton from "./PixiButton";
import PixiTextInput from "./PixiTextInput";

extend({ Container, Graphics, Text });

type TaskSceneProps = {
  task: TaskDef;
  taskIndex: number;
  totalTasks: number;
  results: boolean[];
  onAnswer: (correct: boolean) => void;
};

function ProgressDots({
  total,
  current,
  results,
}: {
  total: number;
  current: number;
  results: boolean[];
}) {
  const refs = useRef<(Graphics | null)[]>([]);

  useEffect(() => {
    refs.current.forEach((g, i) => {
      if (!g) return;
      g.clear();
      g.circle(0, 0, 16);
      if (i < results.length) {
        g.fill(0x27ae60);
      } else if (i === current) {
        g.fill(0x667eea);
      } else {
        g.fill(0x2a2a4a);
      }
    });
  }, [total, current, results]);

  const dotStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize: 14,
    fontWeight: "600",
    fill: 0xffffff,
  });

  const startX = 500 - ((total - 1) * 48) / 2;

  return (
    <pixiContainer y={15}>
      {Array.from({ length: total }, (_, i) => (
        <pixiContainer key={i} x={startX + i * 48} y={0}>
          <pixiGraphics
            ref={(el: Graphics | null) => {
              refs.current[i] = el;
            }}
          />
          <pixiText
            text={i < results.length ? "✓" : String(i + 1)}
            style={dotStyle}
            anchor={0.5}
          />
        </pixiContainer>
      ))}
    </pixiContainer>
  );
}

function CodeFixPanel({
  task,
  onAnswer,
}: {
  task: TaskDef;
  onAnswer: (correct: boolean) => void;
}) {
  const codeBgRef = useRef<Graphics>(null);

  const drawCodeBg = useCallback((g: Graphics) => {
    g.clear();
    g.roundRect(0, 0, 700, 120, 8);
    g.fill(0x0d1117);
    g.roundRect(0, 0, 700, 120, 8);
    g.stroke({ color: 0x2a2a4a, width: 1 });
  }, []);

  useEffect(() => {
    if (codeBgRef.current) drawCodeBg(codeBgRef.current);
  }, [drawCodeBg]);

  const titleStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize: 18,
    fontWeight: "600",
    fill: 0xe0e0e0,
  });

  const codeStyle = new TextStyle({
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 13,
    fill: 0xe6edf3,
  });

  return (
    <pixiContainer x={150} y={390}>
      <pixiText text={task.title} style={titleStyle} x={0} y={0} />
      <pixiGraphics ref={codeBgRef} x={0} y={30} />
      <pixiText text={task.code ?? ""} style={codeStyle} x={16} y={46} />
      {task.options?.map((opt, i) => (
        <PixiButton
          key={i}
          x={0}
          y={160 + i * 50}
          width={700}
          height={40}
          label={`${String.fromCharCode(65 + i)}) ${opt.text}`}
          onClick={() => onAnswer(opt.correct)}
          variant="secondary"
          fontSize={13}
        />
      ))}
    </pixiContainer>
  );
}

function TerminalPanel({
  task,
  onAnswer,
}: {
  task: TaskDef;
  onAnswer: (correct: boolean) => void;
}) {
  const promptBgRef = useRef<Graphics>(null);

  const drawPromptBg = useCallback((g: Graphics) => {
    g.clear();
    g.roundRect(0, 0, 700, 60, 8);
    g.fill(0x0d1117);
    g.roundRect(0, 0, 700, 60, 8);
    g.stroke({ color: 0x2a2a4a, width: 1 });
  }, []);

  useEffect(() => {
    if (promptBgRef.current) drawPromptBg(promptBgRef.current);
  }, [drawPromptBg]);

  const titleStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize: 18,
    fontWeight: "600",
    fill: 0xe0e0e0,
  });

  const promptStyle = new TextStyle({
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 14,
    fill: 0xf97583,
    wordWrap: true,
    wordWrapWidth: 670,
  });

  const handleSubmit = useCallback(
    (value: string) => {
      const trimmed = value.trim().toLowerCase();
      const expected = (task.correctAnswer ?? "").trim().toLowerCase();
      onAnswer(trimmed === expected);
    },
    [task.correctAnswer, onAnswer],
  );

  return (
    <pixiContainer x={150} y={390}>
      <pixiText text={task.title} style={titleStyle} x={0} y={0} />
      <pixiGraphics ref={promptBgRef} x={0} y={30} />
      <pixiText
        text={task.prompt ?? ""}
        style={promptStyle}
        x={16}
        y={46}
      />
      <PixiTextInput
        x={0}
        y={110}
        width={700}
        height={44}
        placeholder="Ketik command..."
        onSubmit={handleSubmit}
      />
    </pixiContainer>
  );
}

export default function TaskScene({
  task,
  taskIndex,
  totalTasks,
  results,
  onAnswer,
}: TaskSceneProps) {
  return (
    <pixiContainer>
      <ProgressDots total={totalTasks} current={taskIndex} results={results} />
      {task.type === "code-fix" && task.code && task.options && (
        <CodeFixPanel task={task} onAnswer={onAnswer} />
      )}
      {task.type === "terminal" && task.prompt && task.correctAnswer && (
        <TerminalPanel task={task} onAnswer={onAnswer} />
      )}
    </pixiContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/TaskScene.tsx
git commit -m "feat: add PixiJS task scene with code-fix and terminal panels"
```

---

### Task 6: Create PunishmentScene and ResultScene

**Files:**
- Create: `src/game/PunishmentScene.tsx`
- Create: `src/game/ResultScene.tsx`

- [ ] **Step 1: Create src/game/PunishmentScene.tsx**

```tsx
import { useRef, useEffect, useCallback } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Text, TextStyle } from "pixi.js";

extend({ Container, Graphics, Text });

type PunishmentSceneProps = {
  speaker: string;
  dialog: string;
  onDone: () => void;
};

export default function PunishmentScene({
  speaker,
  dialog,
  onDone,
}: PunishmentSceneProps) {
  const overlayRef = useRef<Graphics>(null);
  const bubbleRef = useRef<Graphics>(null);

  // Dark overlay
  const drawOverlay = useCallback((g: Graphics) => {
    g.clear();
    g.rect(0, 350, 1000, 350);
    g.fill({ color: 0x000000, alpha: 0.6 });
  }, []);

  // Dialog bubble
  const drawBubble = useCallback((g: Graphics) => {
    g.clear();
    g.roundRect(0, 0, 500, 120, 12);
    g.fill(0x1a1a2e);
    g.roundRect(0, 0, 500, 120, 12);
    g.stroke({ color: 0xf97583, width: 2 });
  }, []);

  useEffect(() => {
    if (overlayRef.current) drawOverlay(overlayRef.current);
    if (bubbleRef.current) drawBubble(bubbleRef.current);
  }, [drawOverlay, drawBubble]);

  // Auto-advance after 2s
  useEffect(() => {
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

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

  return (
    <pixiContainer>
      <pixiGraphics ref={overlayRef} />
      <pixiContainer x={250} y={450}>
        <pixiGraphics ref={bubbleRef} />
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
    </pixiContainer>
  );
}
```

- [ ] **Step 2: Create src/game/ResultScene.tsx**

```tsx
import { extend } from "@pixi/react";
import { Container, Text, TextStyle } from "pixi.js";
import { ResultType } from "../types";
import PixiButton from "./PixiButton";

extend({ Container, Text });

type ResultSceneProps = {
  result: ResultType;
  onRetry: () => void;
  onMenu: () => void;
};

const RESULT_MESSAGES: Record<
  string,
  { text: string; color: number }
> = {
  win: {
    text: "Deploy berhasil! Angga selamat... untuk hari ini.",
    color: 0x7ee787,
  },
  fired: {
    text: "ANGGA DIPECAT!\nMang Alif sudah muak dengan\ndeveloper yang gabisa ngoding.",
    color: 0xf97583,
  },
};

export default function ResultScene({
  result,
  onRetry,
  onMenu,
}: ResultSceneProps) {
  const msg = RESULT_MESSAGES[result ?? "win"];

  const textStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize: 24,
    fill: msg.color,
    align: "center",
    wordWrap: true,
    wordWrapWidth: 500,
  });

  const isWin = result === "win";

  return (
    <pixiContainer>
      <pixiText
        text={msg.text}
        style={textStyle}
        anchor={0.5}
        x={500}
        y={300}
      />
      {isWin ? (
        <PixiButton
          x={375}
          y={380}
          width={250}
          height={48}
          label="Kembali ke Menu"
          onClick={onMenu}
        />
      ) : (
        <>
          <PixiButton
            x={280}
            y={380}
            width={200}
            height={48}
            label="Coba Lagi"
            onClick={onRetry}
          />
          <PixiButton
            x={520}
            y={380}
            width={200}
            height={48}
            label="Kembali ke Menu"
            onClick={onMenu}
            variant="secondary"
          />
        </>
      )}
    </pixiContainer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/game/PunishmentScene.tsx src/game/ResultScene.tsx
git commit -m "feat: add PixiJS punishment and result scenes"
```

---

### Task 7: Rewrite App.tsx and OfficeScene for full PixiJS

**Files:**
- Modify: `src/App.tsx` (full rewrite)
- Modify: `src/game/OfficeScene.tsx` (remove Application wrapper, export inner only)

- [ ] **Step 1: Rewrite src/game/OfficeScene.tsx**

Remove the `Application` wrapper -- OfficeScene now renders as a child container inside the main Application. Replace entire file:

```tsx
import { useEffect, useState } from "react";
import { extend } from "@pixi/react";
import { Container, Sprite, Texture, Assets } from "pixi.js";
import { PunishmentNPC } from "../types";

extend({ Container, Sprite });

type OfficeSceneProps = {
  npcsPresent: PunishmentNPC[];
  punishmentNPC: PunishmentNPC | null;
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

export default function OfficeScene({
  npcsPresent,
  punishmentNPC,
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

  return (
    <pixiContainer>
      {textures.bg && (
        <pixiSprite
          texture={textures.bg}
          x={0}
          y={0}
          width={1000}
          height={350}
        />
      )}
      {textures.monitor && (
        <pixiSprite
          texture={textures.monitor}
          x={280}
          y={180}
          width={128}
          height={96}
        />
      )}
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
```

- [ ] **Step 2: Rewrite src/App.tsx**

Single Application canvas, all scenes as PixiJS containers:

```tsx
import { useReducer, useCallback } from "react";
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
          return {
            ...state,
            screen: "result",
            result: "win",
            taskResults: newResults,
          };
        }
        return { ...state, currentTask: nextTask, taskResults: newResults };
      }
      const newFailures = state.failures + 1;
      const task = TASKS[state.currentTask];
      return {
        ...state,
        screen: "punishment",
        failures: newFailures,
        punishmentNPC: task.onFail.npc,
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

function GameRoot() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleAnswer = useCallback((correct: boolean) => {
    dispatch({ type: "SUBMIT_ANSWER", correct });
  }, []);

  const handlePunishmentDone = useCallback(() => {
    dispatch({ type: "PUNISHMENT_DONE" });
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

    case "task": {
      const task = TASKS[state.currentTask];
      return (
        <pixiContainer>
          <OfficeScene
            npcsPresent={task.scene.npcsPresent}
            punishmentNPC={null}
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
            npcsPresent={[...task.scene.npcsPresent, npc].filter(
              (v, i, a) => a.indexOf(v) === i,
            )}
            punishmentNPC={npc}
          />
          <PunishmentScene
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

export default function App() {
  return (
    <Application background="#0a0a0a" resizeTo={undefined} width={1000} height={700}>
      <GameRoot />
    </Application>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx src/game/OfficeScene.tsx
git commit -m "feat: rewrite App.tsx and OfficeScene for single-canvas full PixiJS"
```

---

### Task 8: Delete HTML UI components, clean up CSS, build verify

**Files:**
- Delete: `src/ui/Menu.tsx`
- Delete: `src/ui/Briefing.tsx`
- Delete: `src/ui/Result.tsx`
- Delete: `src/ui/CodeFixTask.tsx`
- Delete: `src/ui/TerminalTask.tsx`
- Delete: `src/ui/DialogBubble.tsx`
- Delete: `src/ui/TaskProgress.tsx`
- Modify: `public/style.css` (minimal -- just body/canvas styles)

- [ ] **Step 1: Delete src/ui/ directory**

```bash
rm -r src/ui/
```

- [ ] **Step 2: Rewrite public/style.css to minimal canvas styles**

Replace entire file:

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700&display=swap');

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: #0a0a0a;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

#app {
  width: 1000px;
  height: 700px;
}

canvas {
  display: block;
}
```

- [ ] **Step 3: Run prettier and build**

```bash
npx prettier --write src/ public/style.css
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: remove HTML UI components, migrate to full PixiJS canvas"
```

- [ ] **Step 5: Push**

```bash
git push origin master
```
