import { useCallback } from "react";
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

function Dot({
  index,
  current,
  resultsLength,
}: {
  index: number;
  current: number;
  resultsLength: number;
}) {
  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      g.circle(0, 0, 16);
      if (index < resultsLength) {
        g.fill(0x27ae60);
      } else if (index === current) {
        g.fill(0x667eea);
      } else {
        g.fill(0x2a2a4a);
      }
    },
    [index, current, resultsLength],
  );

  return <pixiGraphics draw={draw} />;
}

function ProgressDots({
  total,
  current,
  results,
}: {
  total: number;
  current: number;
  results: boolean[];
}) {
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
          <Dot index={i} current={current} resultsLength={results.length} />
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
  const drawCodeBg = useCallback((g: Graphics) => {
    g.clear();
    g.roundRect(0, 0, 700, 120, 8);
    g.fill(0x0d1117);
    g.roundRect(0, 0, 700, 120, 8);
    g.stroke({ color: 0x2a2a4a, width: 1 });
  }, []);

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
      <pixiGraphics draw={drawCodeBg} x={0} y={30} />
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
  const drawPromptBg = useCallback((g: Graphics) => {
    g.clear();
    g.roundRect(0, 0, 700, 60, 8);
    g.fill(0x0d1117);
    g.roundRect(0, 0, 700, 60, 8);
    g.stroke({ color: 0x2a2a4a, width: 1 });
  }, []);

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
      <pixiGraphics draw={drawPromptBg} x={0} y={30} />
      <pixiText text={task.prompt ?? ""} style={promptStyle} x={16} y={46} />
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
