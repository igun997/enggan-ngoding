export type Screen = "menu" | "briefing" | "playing" | "result";
export type ResultType = "win" | "lose-coffee" | "lose-time" | null;

export type TerminalEntry = {
  id: number;
  type: "player" | "ai" | "error" | "system";
  text: string;
};

export type SpecialEffect =
  | "moonwalk"
  | "vibrate"
  | "spin"
  | "flip"
  | "flyoff"
  | "flag-runs";

export type Action = {
  action: "move" | "idle" | "confused";
  direction?: "left" | "right" | "up" | "down" | "random";
  speed?: number;
  hallucinated: boolean;
  flavor: string;
  specialEffect?: SpecialEffect;
};

export type HallucinationOption = {
  action: Action;
  weight: number;
};

export type KeywordEntry = {
  keywords: string[];
  category: string;
  correctAction: Partial<Action>;
  hallucinations: HallucinationOption[];
};

export type Level = {
  id: number;
  title: string;
  objective: string;
  ohimMessage: string;
  timerSeconds: number;
  coffeeCost: number;
  keywordEntries: KeywordEntry[];
  defaultAction: Action;
};

export type GameState = {
  screen: Screen;
  coffee: number;
  timeLeft: number;
  terminalLog: TerminalEntry[];
  currentAction: Action | null;
  result: ResultType;
  isProcessing: boolean;
  characterX: number;
  flagX: number;
};

export type GameAction =
  | { type: "START_GAME" }
  | { type: "ACCEPT_TICKET" }
  | { type: "SUBMIT_PROMPT"; action: Action; coffeeCost: number }
  | { type: "SET_PROCESSING"; isProcessing: boolean }
  | { type: "ADD_TERMINAL"; entry: Omit<TerminalEntry, "id"> }
  | { type: "EXECUTE_ACTION"; action: Action }
  | { type: "TICK_TIMER" }
  | { type: "UPDATE_CHARACTER_X"; x: number }
  | { type: "CHECK_WIN" }
  | { type: "SET_RESULT"; result: ResultType }
  | { type: "RETRY" }
  | { type: "BACK_TO_MENU" };
