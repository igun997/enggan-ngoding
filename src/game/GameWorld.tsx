import { useCallback, useEffect, useRef, useState } from "react";
import { Application, extend } from "@pixi/react";
import { Container, Sprite, Texture, Assets } from "pixi.js";
import { Action } from "../types";
import Character from "./Character";
import { applyGlitch } from "./GlitchEffects";

extend({ Container, Sprite });

type GameWorldProps = {
  currentAction: Action | null;
  characterX: number;
  flagX: number;
  onCharacterMove: (x: number) => void;
  onWin: () => void;
};

function GameScene({
  currentAction,
  characterX,
  flagX,
  onCharacterMove,
  onWin,
}: GameWorldProps) {
  const containerRef = useRef<Container>(null);
  const [flagTexture, setFlagTexture] = useState(Texture.EMPTY);
  const [groundTexture, setGroundTexture] = useState(Texture.EMPTY);
  const flagSpriteRef = useRef<Sprite>(null);
  const flagOffsetRef = useRef(0);

  useEffect(() => {
    Assets.load("/assets/flag.png").then(setFlagTexture);
    Assets.load("/assets/ground.png").then(setGroundTexture);
  }, []);

  // Trigger glitch on hallucination
  useEffect(() => {
    if (currentAction?.hallucinated && containerRef.current) {
      applyGlitch(containerRef.current, 1);
    }
  }, [currentAction]);

  // Handle flag-runs special effect
  useEffect(() => {
    if (currentAction?.specialEffect === "flag-runs" && flagSpriteRef.current) {
      flagOffsetRef.current += 50;
    }
  }, [currentAction]);

  // Check win condition
  useEffect(() => {
    const charPixelX = characterX * 10;
    const flagPixelX = flagX * 10 + flagOffsetRef.current;
    if (Math.abs(charPixelX - flagPixelX) < 30) {
      onWin();
    }
  }, [characterX, flagX, onWin]);

  const handleActionComplete = useCallback(() => {
    // Action finished animating
  }, []);

  const GROUND_Y = 400;

  return (
    <pixiContainer ref={containerRef}>
      {/* Ground */}
      {groundTexture !== Texture.EMPTY && (
        <pixiSprite
          texture={groundTexture}
          x={0}
          y={GROUND_Y + 40}
          width={1000}
          height={64}
        />
      )}

      {/* Flag */}
      {flagTexture !== Texture.EMPTY && (
        <pixiSprite
          ref={flagSpriteRef}
          texture={flagTexture}
          anchor={{ x: 0.5, y: 1 }}
          x={flagX * 10 + flagOffsetRef.current}
          y={GROUND_Y + 40}
          scale={0.8}
        />
      )}

      {/* Character */}
      <Character
        action={currentAction}
        x={characterX}
        groundY={GROUND_Y}
        onMove={onCharacterMove}
        onActionComplete={handleActionComplete}
      />
    </pixiContainer>
  );
}

export default function GameWorld(props: GameWorldProps) {
  return (
    <Application
      background="#1a1a2e"
      resizeTo={undefined}
      width={1000}
      height={500}
    >
      <GameScene {...props} />
    </Application>
  );
}
