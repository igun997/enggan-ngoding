import { useReducer, useCallback } from "react";
import { GameState, GameAction } from "./types";
import { TASKS } from "./data/TaskData";
import Menu from "./ui/Menu";
import Briefing from "./ui/Briefing";
import TaskProgress from "./ui/TaskProgress";
import CodeFixTask from "./ui/CodeFixTask";
import TerminalTask from "./ui/TerminalTask";
import DialogBubble from "./ui/DialogBubble";
import Result from "./ui/Result";
import OfficeScene from "./game/OfficeScene";

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
      // Wrong answer
      const newFailures = state.failures + 1;
      const task = TASKS[state.currentTask];
      if (newFailures >= 3) {
        return {
          ...state,
          screen: "punishment",
          failures: newFailures,
          punishmentNPC: task.onFail.npc,
        };
      }
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

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleAnswer = useCallback((correct: boolean) => {
    dispatch({ type: "SUBMIT_ANSWER", correct });
  }, []);

  const handlePunishmentDone = useCallback(() => {
    dispatch({ type: "PUNISHMENT_DONE" });
  }, []);

  switch (state.screen) {
    case "menu":
      return <Menu onStart={() => dispatch({ type: "START_GAME" })} />;

    case "briefing":
      return <Briefing onAccept={() => dispatch({ type: "ACCEPT_TICKET" })} />;

    case "task": {
      const task = TASKS[state.currentTask];
      return (
        <div className="game-layout">
          <TaskProgress
            total={TASKS.length}
            current={state.currentTask}
            results={state.taskResults}
          />
          <div className="scene-area">
            <OfficeScene
              npcsPresent={task.scene.npcsPresent}
              punishmentNPC={null}
              onPunishmentAnimDone={() => {}}
            />
          </div>
          <div className="task-area">
            {task.type === "code-fix" && task.code && task.options && (
              <CodeFixTask
                title={task.title}
                code={task.code}
                options={task.options}
                onAnswer={handleAnswer}
              />
            )}
            {task.type === "terminal" && task.prompt && task.correctAnswer && (
              <TerminalTask
                title={task.title}
                prompt={task.prompt}
                correctAnswer={task.correctAnswer}
                onAnswer={handleAnswer}
              />
            )}
          </div>
        </div>
      );
    }

    case "punishment": {
      const task = TASKS[state.currentTask];
      const npc = state.punishmentNPC!;
      return (
        <div className="game-layout">
          <div className="scene-area">
            <OfficeScene
              npcsPresent={[...task.scene.npcsPresent, npc].filter(
                (v, i, a) => a.indexOf(v) === i,
              )}
              punishmentNPC={npc}
              onPunishmentAnimDone={handlePunishmentDone}
            />
          </div>
          <div className="punishment-overlay">
            <DialogBubble speaker={NPC_NAMES[npc]} text={task.onFail.dialog} />
          </div>
        </div>
      );
    }

    case "result":
      return (
        <Result
          result={state.result}
          onRetry={() => dispatch({ type: "RETRY" })}
          onMenu={() => dispatch({ type: "BACK_TO_MENU" })}
        />
      );
  }
}
