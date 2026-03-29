import { useReducer, useCallback } from "react";
import { Application, extend } from "@pixi/react";
import { Container, Graphics } from "pixi.js";
import { GameState, GameAction } from "./types";
import { TASKS } from "./data/TaskData";
import MenuScene from "./game/MenuScene";
import BriefingScene from "./game/BriefingScene";
import TaskScene from "./game/TaskScene";
import OfficeScene from "./game/OfficeScene";
import PunishmentScene from "./game/PunishmentScene";
import ResultScene from "./game/ResultScene";

extend({ Container, Graphics });

const NPC_NAMES: Record<string, string> = {
  ohim: "Ohim",
  aris: "Mang Aris",
  alif: "Mang Alif",
};

const initialState: GameState = {
  screen: "menu",
  currentTask: 0,
  failures: 0,
  taskResults: [],
  result: null,
  punishmentNPC: null,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return { ...initialState, screen: "briefing" };
    case "ACCEPT_TICKET":
      return { ...initialState, screen: "task" };
    case "SUBMIT_ANSWER": {
      if (action.correct) {
        const newResults = [...state.taskResults, true];
        const nextTask = state.currentTask + 1;
        if (nextTask >= TASKS.length) {
          return {
            ...state,
            screen: "result",
            result: "win",
            taskResults: newResults,
          };
        }
        return { ...state, currentTask: nextTask, taskResults: newResults };
      }
      const newFailures = state.failures + 1;
      const task = TASKS[state.currentTask];
      return {
        ...state,
        screen: "punishment",
        failures: newFailures,
        punishmentNPC: task.onFail.npc,
      };
    }
    case "PUNISHMENT_DONE": {
      if (state.failures >= 3) {
        return {
          ...state,
          screen: "result",
          result: "fired",
          punishmentNPC: null,
        };
      }
      return { ...state, screen: "task", punishmentNPC: null };
    }
    case "RETRY":
      return { ...initialState, screen: "briefing" };
    case "BACK_TO_MENU":
      return { ...initialState };
    default:
      return state;
  }
}

function GameRoot() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleAnswer = useCallback((correct: boolean) => {
    dispatch({ type: "SUBMIT_ANSWER", correct });
  }, []);

  const handlePunishmentDone = useCallback(() => {
    dispatch({ type: "PUNISHMENT_DONE" });
  }, []);

  switch (state.screen) {
    case "menu":
      return <MenuScene onStart={() => dispatch({ type: "START_GAME" })} />;

    case "briefing":
      return (
        <BriefingScene onAccept={() => dispatch({ type: "ACCEPT_TICKET" })} />
      );

    case "task": {
      const task = TASKS[state.currentTask];
      return (
        <pixiContainer>
          <OfficeScene
            npcsPresent={task.scene.npcsPresent}
            punishmentNPC={null}
          />
          <TaskScene
            task={task}
            taskIndex={state.currentTask}
            totalTasks={TASKS.length}
            results={state.taskResults}
            onAnswer={handleAnswer}
          />
        </pixiContainer>
      );
    }

    case "punishment": {
      const task = TASKS[state.currentTask];
      const npc = state.punishmentNPC!;
      return (
        <pixiContainer>
          <OfficeScene
            npcsPresent={[...task.scene.npcsPresent, npc].filter(
              (v, i, a) => a.indexOf(v) === i,
            )}
            punishmentNPC={npc}
          />
          <PunishmentScene
            speaker={NPC_NAMES[npc]}
            dialog={task.onFail.dialog}
            onDone={handlePunishmentDone}
          />
        </pixiContainer>
      );
    }

    case "result":
      return (
        <ResultScene
          result={state.result}
          onRetry={() => dispatch({ type: "RETRY" })}
          onMenu={() => dispatch({ type: "BACK_TO_MENU" })}
        />
      );
  }
}

export default function App() {
  return (
    <Application
      background="#0a0a0a"
      resizeTo={undefined}
      width={1000}
      height={700}
    >
      <GameRoot />
    </Application>
  );
}
