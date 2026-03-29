import { useCallback } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import PixiButton from "./PixiButton";

extend({ Container, Graphics, Text });

type BriefingSceneProps = {
  onAccept: () => void;
};

export default function BriefingScene({ onAccept }: BriefingSceneProps) {
  const drawCard = useCallback((g: Graphics) => {
    g.clear();
    g.roundRect(0, 0, 500, 280, 12);
    g.fill(0x1a1a2e);
    g.roundRect(0, 0, 500, 280, 12);
    g.stroke({ color: 0x2a2a4a, width: 1 });
  }, []);

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
      <pixiGraphics draw={drawCard} />
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
