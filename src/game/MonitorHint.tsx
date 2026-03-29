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
