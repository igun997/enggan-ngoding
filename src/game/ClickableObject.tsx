import { useRef, useEffect, useState } from "react";
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
