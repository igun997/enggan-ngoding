import { useCallback, useRef, useEffect, useState } from "react";
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
  const containerRef = useRef<Container>(null);
  const [hover, setHover] = useState(false);
  const style = STYLES[variant];

  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, width, height, 8);
      g.fill(hover ? style.fillHover : style.fill);
    },
    [width, height, style, hover],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.eventMode = "static";
    container.cursor = "pointer";

    const onOver = () => setHover(true);
    const onOut = () => setHover(false);

    container.on("pointerover", onOver);
    container.on("pointerout", onOut);
    container.on("pointertap", onClick);

    return () => {
      container.off("pointerover", onOver);
      container.off("pointerout", onOut);
      container.off("pointertap", onClick);
    };
  }, [onClick]);

  const textStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize,
    fontWeight: "600",
    fill: style.text,
  });

  return (
    <pixiContainer ref={containerRef} x={x} y={y}>
      <pixiGraphics draw={draw} />
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
