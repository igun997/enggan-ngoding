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

  useEffect(() => {
    if (overlayRef.current) drawOverlay(overlayRef.current);
    if (bubbleRef.current) drawBubble(bubbleRef.current);
  }, [drawOverlay, drawBubble]);

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
        <pixiText text={`${speaker}:`} style={speakerStyle} x={20} y={20} />
        <pixiText text={`"${dialog}"`} style={dialogStyle} x={20} y={55} />
      </pixiContainer>
    </pixiContainer>
  );
}
