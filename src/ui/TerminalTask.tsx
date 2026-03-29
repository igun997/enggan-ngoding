import { useState, FormEvent } from "react";

type TerminalTaskProps = {
  title: string;
  prompt: string;
  correctAnswer: string;
  onAnswer: (correct: boolean) => void;
};

export default function TerminalTask({
  title,
  prompt,
  correctAnswer,
  onAnswer,
}: TerminalTaskProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim().toLowerCase();
    const expected = correctAnswer.trim().toLowerCase();
    onAnswer(trimmed === expected);
    setInput("");
  };

  return (
    <div className="task-panel">
      <h3 className="task-title">{title}</h3>
      <div className="terminal-prompt">{prompt}</div>
      <form className="terminal-input-form" onSubmit={handleSubmit}>
        <span className="terminal-caret">&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik command..."
          autoFocus
        />
        <button type="submit" className="btn btn-primary btn-submit">
          Enter
        </button>
      </form>
    </div>
  );
}
