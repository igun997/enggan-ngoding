import { useEffect, useState, useCallback } from "react";
import { extend } from "@pixi/react";
import { Container, Sprite, Texture, Assets } from "pixi.js";
import { PunishmentNPC, OfficePhase } from "../types";
import SpriteAnimation from "./SpriteAnimation";
import MonitorHint from "./MonitorHint";
import ClickableObject from "./ClickableObject";

extend({ Container, Sprite });

type OfficeSceneProps = {
  npcsPresent: PunishmentNPC[];
  phase: OfficePhase;
  hint: string;
  onWalkInDone: () => void;
  onClickMonitor: () => void;
  onClickDoor: () => void;
};

const WALK_FRAMES = ["walk-1", "walk-2", "walk-3", "walk-4"];
const IDLE_FRAMES = ["idle-1", "idle-2", "idle-3"];
const NPC_STAND_FRAMES = ["stand"];

const NPC_SHEETS: Record<string, { json: string; image: string }> = {
  ohim: {
    json: "/assets/ohim-spritesheet.json",
    image: "/assets/ohim-spritesheet.png",
  },
  aris: {
    json: "/assets/mang-aris-spritesheet.json",
    image: "/assets/mang-aris-spritesheet.png",
  },
  alif: {
    json: "/assets/mang-alif-spritesheet.json",
    image: "/assets/mang-alif-spritesheet.png",
  },
};

const NPC_POSITIONS: Record<string, number> = {
  ohim: 700,
  aris: 800,
  alif: 600,
};

export default function OfficeScene({
  npcsPresent,
  phase,
  hint,
  onWalkInDone,
  onClickMonitor,
  onClickDoor,
}: OfficeSceneProps) {
  const [bgTexture, setBgTexture] = useState(Texture.EMPTY);
  const [monitorTexture, setMonitorTexture] = useState(Texture.EMPTY);
  const [doorTexture, setDoorTexture] = useState(Texture.EMPTY);
  const [anggaX, setAnggaX] = useState(900);
  const isIdle = phase === "idle";

  useEffect(() => {
    Assets.load("/assets/office-bg.png").then(setBgTexture);
    Assets.load("/assets/monitor.png").then(setMonitorTexture);
    Assets.load("/assets/door.png").then(setDoorTexture);
  }, []);

  // Walk-in animation: move Angga from door (900) to desk (400)
  useEffect(() => {
    if (phase !== "walk-in") {
      setAnggaX(phase === "idle" ? 400 : 900);
      return;
    }
    setAnggaX(900);
    const start = Date.now();
    const duration = 2000;
    const from = 900;
    const to = 400;
    let raf: number;
    const animate = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t * (2 - t); // ease-out
      setAnggaX(from + (to - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        onWalkInDone();
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase, onWalkInDone]);

  const isWalking = phase === "walk-in";

  return (
    <pixiContainer>
      {/* Background */}
      {bgTexture !== Texture.EMPTY && (
        <pixiSprite texture={bgTexture} x={0} y={0} width={1000} height={350} />
      )}

      {/* Door (clickable) */}
      {doorTexture !== Texture.EMPTY && (
        <ClickableObject
          texture={doorTexture}
          x={900}
          y={220}
          width={64}
          height={96}
          onClick={onClickDoor}
          enabled={isIdle}
        />
      )}

      {/* Monitor (clickable) with hint */}
      {monitorTexture !== Texture.EMPTY && (
        <>
          <ClickableObject
            texture={monitorTexture}
            x={280}
            y={180}
            width={128}
            height={96}
            onClick={onClickMonitor}
            enabled={isIdle}
          />
          {isIdle && <MonitorHint hint={hint} x={290} y={190} />}
        </>
      )}

      {/* Angga */}
      <SpriteAnimation
        sheetJson="/assets/angga-spritesheet.json"
        sheetImage="/assets/angga-spritesheet.png"
        frames={isWalking ? WALK_FRAMES : IDLE_FRAMES}
        fps={isWalking ? 8 : 3}
        loop={true}
        playing={true}
        x={anggaX}
        y={280}
        scaleX={isWalking ? -1 : 1}
      />

      {/* NPCs standing */}
      {npcsPresent.map((npc) => {
        const sheet = NPC_SHEETS[npc];
        if (!sheet) return null;
        return (
          <SpriteAnimation
            key={npc}
            sheetJson={sheet.json}
            sheetImage={sheet.image}
            frames={NPC_STAND_FRAMES}
            fps={1}
            loop={true}
            playing={true}
            x={NPC_POSITIONS[npc]}
            y={280}
          />
        );
      })}
    </pixiContainer>
  );
}
