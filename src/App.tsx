import { useReducer, useCallback } from "react";
import { GameState, GameAction } from "./types";
import { LEVEL_1 } from "./engine/LevelData";
import { processPrompt } from "./engine/HallucinationEngine";
import Menu from "./ui/Menu";
import Briefing from "./ui/Briefing";
import HUD from "./ui/HUD";
import Terminal from "./ui/Terminal";
import Result from "./ui/Result";
import GameWorld from "./game/GameWorld";

let terminalIdCounter = 0;

const initialState: GameState = {
  screen: "menu",
  coffee: 100,
  timeLeft: LEVEL_1.timerSeconds,
  terminalLog: [],
  currentAction: null,
  result: null,
  isProcessing: false,
  characterX: 10,
  flagX: 85,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return { ...state, screen: "briefing" };
    case "ACCEPT_TICKET":
      return {
        ...initialState,
        screen: "playing",
        terminalLog: [
          {
            id: ++terminalIdCounter,
            type: "system",
            text: `📋 ${LEVEL_1.objective}`,
          },
          {
            id: ++terminalIdCounter,
            type: "system",
            text: "Ketik prompt untuk mengendalikan karakter...",
          },
        ],
      };
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.isProcessing };
    case "ADD_TERMINAL":
      return {
        ...state,
        terminalLog: [
          ...state.terminalLog,
          { ...action.entry, id: ++terminalIdCounter },
        ],
      };
    case "SUBMIT_PROMPT":
      return {
        ...state,
        coffee: Math.max(0, state.coffee - action.coffeeCost),
      };
    case "EXECUTE_ACTION":
      return { ...state, currentAction: action.action };
    case "TICK_TIMER":
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };
    case "UPDATE_CHARACTER_X":
      return { ...state, characterX: action.x };
    case "SET_RESULT":
      return { ...state, screen: "result", result: action.result };
    case "RETRY":
      return {
        ...initialState,
        screen: "briefing",
      };
    case "BACK_TO_MENU":
      return { ...initialState };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handlePromptSubmit = useCallback(
    async (input: string) => {
      if (state.isProcessing) return;

      // Add player's prompt to terminal
      dispatch({
        type: "ADD_TERMINAL",
        entry: { type: "player", text: `> ${input}` },
      });

      // Deduct coffee
      dispatch({
        type: "SUBMIT_PROMPT",
        action: processPrompt(input, LEVEL_1, state.coffee),
        coffeeCost: LEVEL_1.coffeeCost,
      });

      // Show thinking
      dispatch({ type: "SET_PROCESSING", isProcessing: true });
      dispatch({
        type: "ADD_TERMINAL",
        entry: { type: "system", text: "AI sedang berpikir..." },
      });

      // Fake delay
      await new Promise((r) => setTimeout(r, 1000));

      // Process
      const action = processPrompt(input, LEVEL_1, state.coffee);

      // Show AI response
      dispatch({
        type: "ADD_TERMINAL",
        entry: {
          type: action.hallucinated ? "error" : "ai",
          text: action.flavor,
        },
      });

      // Execute
      dispatch({ type: "EXECUTE_ACTION", action });
      dispatch({ type: "SET_PROCESSING", isProcessing: false });
    },
    [state.isProcessing, state.coffee],
  );

  const handleWin = useCallback(() => {
    dispatch({ type: "SET_RESULT", result: "win" });
  }, []);

  const handleTimerTick = useCallback(() => {
    dispatch({ type: "TICK_TIMER" });
  }, []);

  const handleCharacterMove = useCallback((x: number) => {
    dispatch({ type: "UPDATE_CHARACTER_X", x });
  }, []);

  switch (state.screen) {
    case "menu":
      return <Menu onStart={() => dispatch({ type: "START_GAME" })} />;
    case "briefing":
      return (
        <Briefing
          level={LEVEL_1}
          onAccept={() => dispatch({ type: "ACCEPT_TICKET" })}
        />
      );
    case "playing":
      return (
        <div className="game-layout">
          <HUD
            coffee={state.coffee}
            timeLeft={state.timeLeft}
            levelTitle={LEVEL_1.title}
            onTimerTick={handleTimerTick}
            onTimeUp={() =>
              dispatch({ type: "SET_RESULT", result: "lose-time" })
            }
            onCoffeeEmpty={() =>
              dispatch({ type: "SET_RESULT", result: "lose-coffee" })
            }
          />
          <div className="game-main">
            <div className="game-left">
              <GameWorld
                currentAction={state.currentAction}
                characterX={state.characterX}
                flagX={state.flagX}
                onCharacterMove={handleCharacterMove}
                onWin={handleWin}
              />
              <div className="objective-bar">📋 {LEVEL_1.objective}</div>
            </div>
            <Terminal
              log={state.terminalLog}
              onSubmit={handlePromptSubmit}
              isProcessing={state.isProcessing}
            />
          </div>
        </div>
      );
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
