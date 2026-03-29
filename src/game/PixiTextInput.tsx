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
      <pixiText
        text="> "
        style={caretStyle}
        x={12}
        y={height / 2}
        anchor={{ x: 0, y: 0.5 }}
      />
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
