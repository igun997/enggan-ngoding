import { TaskOption } from "../types";

type CodeFixTaskProps = {
  title: string;
  code: string;
  options: TaskOption[];
  onAnswer: (correct: boolean) => void;
};

export default function CodeFixTask({
  title,
  code,
  options,
  onAnswer,
}: CodeFixTaskProps) {
  return (
    <div className="task-panel">
      <h3 className="task-title">{title}</h3>
      <pre className="code-viewer">
        <code>{code}</code>
      </pre>
      <div className="task-options">
        {options.map((opt, i) => (
          <button
            key={i}
            className="btn btn-option"
            onClick={() => onAnswer(opt.correct)}
          >
            {String.fromCharCode(65 + i)}) {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
