import { useRef, useEffect, useState } from "react";
import { extend, useTick } from "@pixi/react";
import { Assets, Sprite, Texture } from "pixi.js";
import { Action } from "../types";

extend({ Sprite });

type CharacterProps = {
  action: Action | null;
  x: number;
  groundY: number;
  onMove: (newX: number) => void;
  onActionComplete: () => void;
};

export default function Character({
  action,
  x,
  groundY,
  onMove,
  onActionComplete,
}: CharacterProps) {
  const spriteRef = useRef<Sprite>(null);
  const [idleTexture, setIdleTexture] = useState(Texture.EMPTY);
  const [walkTexture, setWalkTexture] = useState(Texture.EMPTY);
  const [isMoving, setIsMoving] = useState(false);
  const moveTargetRef = useRef<{
    direction: string;
    speed: number;
    framesLeft: number;
  } | null>(null);
  const specialRef = useRef<{ effect: string; frame: number } | null>(null);

  useEffect(() => {
    Assets.load("/assets/character-idle.png").then(setIdleTexture);
    Assets.load("/assets/character-walk.png").then(setWalkTexture);
  }, []);

  // Handle new actions
  useEffect(() => {
    if (!action) return;

    if (action.action === "move") {
      const dir = action.direction ?? "right";
      const speed = action.speed ?? 1;
      const duration = speed >= 100 ? 5 : 60; // flyoff is fast

      moveTargetRef.current = { direction: dir, speed, framesLeft: duration };
      setIsMoving(true);
    } else if (action.action === "confused") {
      onActionComplete();
    } else if (action.action === "idle" && action.specialEffect) {
      specialRef.current = { effect: action.specialEffect, frame: 0 };
      setIsMoving(false);
    }
  }, [action, onActionComplete]);

  useTick((ticker) => {
    if (!spriteRef.current) return;
    const sprite = spriteRef.current;

    // Handle special effects
    if (specialRef.current) {
      const { effect, frame } = specialRef.current;
      specialRef.current.frame++;

      if (effect === "vibrate") {
        sprite.x = x * 10 + (Math.random() - 0.5) * 6;
        if (frame > 60) {
          specialRef.current = null;
          onActionComplete();
        }
        return;
      }

      if (effect === "spin") {
        sprite.rotation += 0.2 * ticker.deltaTime;
        if (frame > 60) {
          sprite.rotation = 0;
          specialRef.current = null;
          onActionComplete();
        }
        return;
      }

      if (effect === "flip") {
        sprite.scale.y = -1;
        if (frame > 60) {
          sprite.scale.y = 1;
          specialRef.current = null;
          onActionComplete();
        }
        return;
      }
    }

    // Handle movement
    if (moveTargetRef.current && moveTargetRef.current.framesLeft > 0) {
      const { direction, speed } = moveTargetRef.current;
      const moveAmount = speed * 0.3 * ticker.deltaTime;

      let dx = 0;
      let dy = 0;

      switch (direction) {
        case "right":
          dx = moveAmount;
          break;
        case "left":
          dx = -moveAmount;
          sprite.scale.x = -1;
          break;
        case "up":
          dy = -moveAmount * 10;
          break;
        case "down":
          dy = moveAmount * 10;
          break;
        case "random":
          dx = (Math.random() - 0.5) * moveAmount * 2;
          dy = (Math.random() - 0.5) * moveAmount * 5;
          break;
      }

      const newX = x + dx;
      onMove(Math.max(0, Math.min(100, newX)));

      sprite.y = groundY + dy;

      moveTargetRef.current.framesLeft--;

      if (moveTargetRef.current.framesLeft <= 0) {
        moveTargetRef.current = null;
        setIsMoving(false);
        sprite.scale.x = 1;
        sprite.y = groundY;
        onActionComplete();
      }
    }
  });

  const texture = isMoving ? walkTexture : idleTexture;

  return (
    <pixiSprite
      ref={spriteRef}
      texture={texture}
      anchor={0.5}
      x={x * 10}
      y={groundY}
      scale={{ x: 1, y: 1 }}
    />
  );
}
