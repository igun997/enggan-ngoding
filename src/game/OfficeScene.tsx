import { useEffect, useState } from "react";
import { Application, extend } from "@pixi/react";
import { Container, Sprite, Texture, Assets } from "pixi.js";
import { PunishmentNPC } from "../types";

extend({ Container, Sprite });

type OfficeSceneProps = {
  npcsPresent: PunishmentNPC[];
  punishmentNPC: PunishmentNPC | null;
  onPunishmentAnimDone: () => void;
};

const NPC_TEXTURES: Record<string, string> = {
  ohim: "/assets/ohim-stand.png",
  "ohim-action": "/assets/ohim-slap.png",
  aris: "/assets/mang-aris-stand.png",
  "aris-action": "/assets/mang-aris-angry.png",
  alif: "/assets/mang-alif-stand.png",
  "alif-action": "/assets/mang-alif-kick.png",
};

const NPC_POSITIONS: Record<string, { x: number; y: number }> = {
  ohim: { x: 750, y: 260 },
  aris: { x: 850, y: 260 },
  alif: { x: 650, y: 260 },
};

function OfficeSceneInner({
  npcsPresent,
  punishmentNPC,
  onPunishmentAnimDone,
}: OfficeSceneProps) {
  const [textures, setTextures] = useState<Record<string, Texture>>({});

  useEffect(() => {
    const toLoad: Record<string, string> = {
      bg: "/assets/office-bg.png",
      angga: "/assets/angga-sit.png",
      monitor: "/assets/monitor.png",
    };
    for (const npc of npcsPresent) {
      toLoad[npc] = NPC_TEXTURES[npc];
    }
    if (punishmentNPC) {
      toLoad[`${punishmentNPC}-action`] =
        NPC_TEXTURES[`${punishmentNPC}-action`];
    }

    Promise.all(
      Object.entries(toLoad).map(async ([key, url]) => {
        const tex = await Assets.load(url);
        return [key, tex] as [string, Texture];
      }),
    ).then((entries) => {
      setTextures(Object.fromEntries(entries));
    });
  }, [npcsPresent, punishmentNPC]);

  // Trigger punishment animation end after delay
  useEffect(() => {
    if (!punishmentNPC) return;
    const timer = setTimeout(onPunishmentAnimDone, 2000);
    return () => clearTimeout(timer);
  }, [punishmentNPC, onPunishmentAnimDone]);

  return (
    <pixiContainer>
      {/* Background */}
      {textures.bg && (
        <pixiSprite
          texture={textures.bg}
          x={0}
          y={0}
          width={1000}
          height={350}
        />
      )}

      {/* Monitor */}
      {textures.monitor && (
        <pixiSprite
          texture={textures.monitor}
          x={280}
          y={180}
          width={128}
          height={96}
        />
      )}

      {/* Angga */}
      {textures.angga && (
        <pixiSprite
          texture={textures.angga}
          anchor={0.5}
          x={400}
          y={280}
          width={64}
          height={64}
        />
      )}

      {/* NPCs */}
      {npcsPresent.map((npc) => {
        const isActing = punishmentNPC === npc;
        const texKey = isActing ? `${npc}-action` : npc;
        const tex = textures[texKey];
        if (!tex) return null;
        const pos = NPC_POSITIONS[npc];
        const w = isActing ? 96 : 64;
        return (
          <pixiSprite
            key={npc}
            texture={tex}
            anchor={0.5}
            x={pos.x}
            y={pos.y}
            width={w}
            height={64}
          />
        );
      })}
    </pixiContainer>
  );
}

export default function OfficeScene(props: OfficeSceneProps) {
  return (
    <Application
      background="#1a1a2e"
      resizeTo={undefined}
      width={1000}
      height={350}
    >
      <OfficeSceneInner {...props} />
    </Application>
  );
}
