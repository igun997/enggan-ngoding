import { useEffect, useState, useCallback } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Sprite, Texture, Assets } from "pixi.js";
import { PunishmentNPC, OfficePhase } from "../types";
import SpriteAnimation from "./SpriteAnimation";
import MonitorHint from "./MonitorHint";
import ClickableObject from "./ClickableObject";

extend({ Container, Graphics, Sprite });

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

const FURNITURE_ASSETS = [
  { key: "wall", path: "/assets/wall.png" },
  { key: "floor", path: "/assets/floor.png" },
  { key: "desk", path: "/assets/desk.png" },
  { key: "chair", path: "/assets/chair.png" },
  { key: "plant", path: "/assets/plant.png" },
  { key: "watercooler", path: "/assets/watercooler.png" },
  { key: "whiteboard", path: "/assets/whiteboard.png" },
  { key: "ceiling-light", path: "/assets/ceiling-light.png" },
  { key: "monitor", path: "/assets/monitor.png" },
  { key: "door", path: "/assets/door.png" },
];

export default function OfficeScene({
  npcsPresent,
  phase,
  hint,
  onWalkInDone,
  onClickMonitor,
  onClickDoor,
}: OfficeSceneProps) {
  const [tex, setTex] = useState<Record<string, Texture>>({});
  const [anggaX, setAnggaX] = useState(900);
  const isIdle = phase === "idle";

  useEffect(() => {
    Promise.all(
      FURNITURE_ASSETS.map(async ({ key, path }) => {
        const t = await Assets.load(path);
        return [key, t] as [string, Texture];
      }),
    ).then((entries) => setTex(Object.fromEntries(entries)));
  }, []);

  // Walk-in animation
  useEffect(() => {
    if (phase !== "walk-in") {
      setAnggaX(phase === "idle" ? 400 : 900);
      return;
    }
    setAnggaX(900);
    const start = Date.now();
    const duration = 2000;
    let raf: number;
    const animate = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = t * (2 - t);
      setAnggaX(900 + (400 - 900) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        onWalkInDone();
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase, onWalkInDone]);

  // Solid wall color background
  const drawWallBg = useCallback((g: Graphics) => {
    g.clear();
    g.rect(0, 0, 1000, 260);
    g.fill(0x1a1a2e);
  }, []);

  // Floor color
  const drawFloorBg = useCallback((g: Graphics) => {
    g.clear();
    g.rect(0, 260, 1000, 90);
    g.fill(0x2a2a3a);
  }, []);

  const isWalking = phase === "walk-in";

  return (
    <pixiContainer>
      {/* Wall background color */}
      <pixiGraphics draw={drawWallBg} />
      {/* Wall texture overlay */}
      {tex.wall && (
        <pixiSprite
          texture={tex.wall}
          x={0}
          y={30}
          width={1000}
          height={200}
          alpha={0.6}
        />
      )}

      {/* Ceiling lights */}
      {tex["ceiling-light"] && (
        <>
          <pixiSprite
            texture={tex["ceiling-light"]}
            x={150}
            y={8}
            width={120}
            height={16}
          />
          <pixiSprite
            texture={tex["ceiling-light"]}
            x={450}
            y={8}
            width={120}
            height={16}
          />
          <pixiSprite
            texture={tex["ceiling-light"]}
            x={750}
            y={8}
            width={120}
            height={16}
          />
        </>
      )}

      {/* Whiteboard on wall */}
      {tex.whiteboard && (
        <pixiSprite
          texture={tex.whiteboard}
          x={520}
          y={80}
          width={96}
          height={64}
        />
      )}

      {/* Floor background color */}
      <pixiGraphics draw={drawFloorBg} />
      {/* Floor texture overlay */}
      {tex.floor && (
        <>
          <pixiSprite
            texture={tex.floor}
            x={0}
            y={270}
            width={500}
            height={70}
            alpha={0.5}
          />
          <pixiSprite
            texture={tex.floor}
            x={500}
            y={270}
            width={500}
            height={70}
            alpha={0.5}
          />
        </>
      )}

      {/* Water cooler */}
      {tex.watercooler && (
        <pixiSprite
          texture={tex.watercooler}
          x={130}
          y={210}
          width={32}
          height={64}
        />
      )}

      {/* Plant */}
      {tex.plant && (
        <>
          <pixiSprite
            texture={tex.plant}
            x={50}
            y={230}
            width={32}
            height={48}
          />
          <pixiSprite
            texture={tex.plant}
            x={830}
            y={230}
            width={32}
            height={48}
          />
        </>
      )}

      {/* Desk */}
      {tex.desk && (
        <pixiSprite
          texture={tex.desk}
          x={300}
          y={210}
          width={160}
          height={100}
        />
      )}

      {/* Chair */}
      {tex.chair && (
        <pixiSprite
          texture={tex.chair}
          x={380}
          y={250}
          width={48}
          height={48}
        />
      )}

      {/* Door (clickable) */}
      {tex.door && (
        <ClickableObject
          texture={tex.door}
          x={900}
          y={200}
          width={64}
          height={96}
          onClick={onClickDoor}
          enabled={isIdle}
        />
      )}

      {/* Monitor (clickable) */}
      {tex.monitor && (
        <>
          <ClickableObject
            texture={tex.monitor}
            x={310}
            y={170}
            width={100}
            height={72}
            onClick={onClickMonitor}
            enabled={isIdle}
          />
          {isIdle && <MonitorHint hint={hint} x={180} y={10} />}
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
        y={270}
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
            y={270}
          />
        );
      })}
    </pixiContainer>
  );
}
