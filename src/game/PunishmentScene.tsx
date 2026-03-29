import { useEffect, useState, useCallback } from "react";
import { extend } from "@pixi/react";
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { PunishmentNPC } from "../types";
import SpriteAnimation from "./SpriteAnimation";

extend({ Container, Graphics, Text });

type PunishmentSceneProps = {
  npc: PunishmentNPC;
  speaker: string;
  dialog: string;
  onDone: () => void;
};

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

const WALK_FRAMES = ["walk-1", "walk-2", "walk-3", "walk-4"];
const ACTION_FRAMES = ["action"];

type Phase = "walk-in" | "action" | "walk-out";

export default function PunishmentScene({
  npc,
  speaker,
  dialog,
  onDone,
}: PunishmentSceneProps) {
  const [phase, setPhase] = useState<Phase>("walk-in");
  const [npcX, setNpcX] = useState(900);
  const sheet = NPC_SHEETS[npc];

  // Walk-in: 900 -> 500
  useEffect(() => {
    if (phase !== "walk-in") return;
    const start = Date.now();
    const duration = 1500;
    let raf: number;
    const animate = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = t * (2 - t);
      setNpcX(900 + (500 - 900) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setPhase("action");
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Action: show for 2s, then walk out
  useEffect(() => {
    if (phase !== "action") return;
    const timer = setTimeout(() => setPhase("walk-out"), 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  // Walk-out: 500 -> 900
  useEffect(() => {
    if (phase !== "walk-out") return;
    const start = Date.now();
    const duration = 1500;
    let raf: number;
    const animate = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = t * (2 - t);
      setNpcX(500 + (900 - 500) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        onDone();
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase, onDone]);

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

  const isWalking = phase === "walk-in" || phase === "walk-out";
  const facingLeft = phase === "walk-in";

  return (
    <pixiContainer>
      {/* NPC animated */}
      {sheet && (
        <SpriteAnimation
          sheetJson={sheet.json}
          sheetImage={sheet.image}
          frames={isWalking ? WALK_FRAMES : ACTION_FRAMES}
          fps={isWalking ? 8 : 1}
          loop={isWalking}
          playing={true}
          x={npcX}
          y={280}
          scaleX={facingLeft ? -1 : 1}
        />
      )}

      {/* Dialog overlay (only during action) */}
      {phase === "action" && (
        <>
          <pixiGraphics draw={drawOverlay} />
          <pixiContainer x={250} y={450}>
            <pixiGraphics draw={drawBubble} />
            <pixiText text={`${speaker}:`} style={speakerStyle} x={20} y={20} />
            <pixiText text={`"${dialog}"`} style={dialogStyle} x={20} y={55} />
          </pixiContainer>
        </>
      )}
    </pixiContainer>
  );
}
