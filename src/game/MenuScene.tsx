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
    fill: 0x667eea,
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
