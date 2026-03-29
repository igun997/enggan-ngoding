import { extend } from "@pixi/react";
import { Container, Text, TextStyle } from "pixi.js";
import { ResultType } from "../types";
import PixiButton from "./PixiButton";

extend({ Container, Text });

type ResultSceneProps = {
  result: ResultType;
  onRetry: () => void;
  onMenu: () => void;
};

const RESULT_MESSAGES: Record<string, { text: string; color: number }> = {
  win: {
    text: "Deploy berhasil! Angga selamat... untuk hari ini.",
    color: 0x7ee787,
  },
  fired: {
    text: "ANGGA DIPECAT!\nMang Alif sudah muak dengan\ndeveloper yang gabisa ngoding.",
    color: 0xf97583,
  },
};

export default function ResultScene({
  result,
  onRetry,
  onMenu,
}: ResultSceneProps) {
  const msg = RESULT_MESSAGES[result ?? "win"];

  const textStyle = new TextStyle({
    fontFamily: "Inter, sans-serif",
    fontSize: 24,
    fill: msg.color,
    align: "center",
    wordWrap: true,
    wordWrapWidth: 500,
  });

  const isWin = result === "win";

  return (
    <pixiContainer>
      <pixiText
        text={msg.text}
        style={textStyle}
        anchor={0.5}
        x={500}
        y={300}
      />
      {isWin ? (
        <PixiButton
          x={375}
          y={380}
          width={250}
          height={48}
          label="Kembali ke Menu"
          onClick={onMenu}
        />
      ) : (
        <>
          <PixiButton
            x={280}
            y={380}
            width={200}
            height={48}
            label="Coba Lagi"
            onClick={onRetry}
          />
          <PixiButton
            x={520}
            y={380}
            width={200}
            height={48}
            label="Kembali ke Menu"
            onClick={onMenu}
            variant="secondary"
          />
        </>
      )}
    </pixiContainer>
  );
}
