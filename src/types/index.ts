export type Screen = "menu" | "briefing" | "task" | "punishment" | "result";
export type ResultType = "win" | "fired" | null;
export type PunishmentNPC = "ohim" | "aris" | "alif";
export type TaskType = "code-fix" | "terminal";

export type TaskOption = {
  text: string;
  correct: boolean;
};

export type TaskDef = {
  id: number;
  type: TaskType;
  title: string;
  scene: {
    npcsPresent: PunishmentNPC[];
  };
  code?: string;
  prompt?: string;
  options?: TaskOption[];
  correctAnswer?: string;
  onFail: {
    npc: PunishmentNPC;
    dialog: string;
  };
};

export type GameState = {
  screen: Screen;
  currentTask: number;
  failures: number;
  taskResults: boolean[];
  result: ResultType;
  punishmentNPC: PunishmentNPC | null;
};

export type GameAction =
  | { type: "START_GAME" }
  | { type: "ACCEPT_TICKET" }
  | { type: "SUBMIT_ANSWER"; correct: boolean }
  | { type: "PUNISHMENT_DONE" }
  | { type: "RETRY" }
  | { type: "BACK_TO_MENU" };
