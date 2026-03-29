type TaskProgressProps = {
  total: number;
  current: number;
  results: boolean[];
};

export default function TaskProgress({
  total,
  current,
  results,
}: TaskProgressProps) {
  return (
    <div className="task-progress">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`task-dot ${i < results.length ? "done" : ""} ${i === current ? "active" : ""}`}
        >
          {i < results.length ? "✓" : i + 1}
        </span>
      ))}
    </div>
  );
}
