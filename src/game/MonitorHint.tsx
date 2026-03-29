import { useCallback } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Text, TextStyle } from "pixi.js";

extend({ Container, Graphics, Text });

type MonitorHintProps = {
  hint: string;
  x: number;
  y: number;
};

export default function MonitorHint({ hint, x, y }: MonitorHintProps) {
  const drawBg = useCallback((g: Graphics) => {
    g.clear();
    g.roundRect(0, 0, 320, 160, 8);
    g.fill({ color: 0x0d1117, alpha: 0.95 });
    g.roundRect(0, 0, 320, 160, 8);
    g.stroke({ color: 0x7ee787, width: 1 });
    // Arrow pointing down to monitor
    g.moveTo(140, 160);
    g.lineTo(160, 175);
    g.lineTo(180, 160);
    g.fill({ color: 0x0d1117, alpha: 0.95 });
  }, []);

  const labelStyle = new TextStyle({
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 10,
    fontWeight: "700",
    fill: 0x58a6ff,
  });

  const textStyle = new TextStyle({
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 11,
    fill: 0x7ee787,
    lineHeight: 15,
    wordWrap: true,
    wordWrapWidth: 296,
  });

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawBg} />
      <pixiText text="TERMINAL OUTPUT" style={labelStyle} x={12} y={8} />
      <pixiText text={hint} style={textStyle} x={12} y={26} />
    </pixiContainer>
  );
}
