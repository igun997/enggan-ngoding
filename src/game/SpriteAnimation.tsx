import { useEffect, useState, useRef, useCallback } from "react";
import { extend, useTick } from "@pixi/react";
import { Container, Sprite, Texture, Assets, Rectangle } from "pixi.js";

extend({ Container, Sprite });

type SpriteAnimationProps = {
  sheetJson: string;
  sheetImage: string;
  frames: string[];
  fps?: number;
  loop?: boolean;
  playing?: boolean;
  x: number;
  y: number;
  anchor?: number;
  scaleX?: number;
  onComplete?: () => void;
};

export default function SpriteAnimation({
  sheetJson,
  sheetImage,
  frames,
  fps = 8,
  loop = true,
  playing = true,
  x,
  y,
  anchor = 0.5,
  scaleX = 1,
  onComplete,
}: SpriteAnimationProps) {
  const [textures, setTextures] = useState<Texture[]>([]);
  const frameRef = useRef(0);
  const elapsedRef = useRef(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const completedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const baseTexture = await Assets.load(sheetImage);
      const jsonResp = await fetch(sheetJson);
      const atlas = await jsonResp.json();

      const loaded: Texture[] = frames.map((name) => {
        const f = atlas.frames[name];
        if (!f) return Texture.EMPTY;
        const rect = new Rectangle(f.frame.x, f.frame.y, f.frame.w, f.frame.h);
        return new Texture({ source: baseTexture.source, frame: rect });
      });

      if (!cancelled) {
        setTextures(loaded);
        frameRef.current = 0;
        elapsedRef.current = 0;
        completedRef.current = false;
        setCurrentFrame(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sheetJson, sheetImage, frames]);

  useTick((ticker) => {
    if (!playing || textures.length === 0 || completedRef.current) return;
    elapsedRef.current += ticker.deltaMS;
    const interval = 1000 / fps;
    if (elapsedRef.current >= interval) {
      elapsedRef.current -= interval;
      const next = frameRef.current + 1;
      if (next >= textures.length) {
        if (loop) {
          frameRef.current = 0;
          setCurrentFrame(0);
        } else {
          completedRef.current = true;
          onComplete?.();
        }
      } else {
        frameRef.current = next;
        setCurrentFrame(next);
      }
    }
  });

  if (textures.length === 0) return null;

  return (
    <pixiSprite
      texture={textures[currentFrame] ?? Texture.EMPTY}
      x={x}
      y={y}
      anchor={anchor}
      scale={{ x: scaleX, y: 1 }}
    />
  );
}
