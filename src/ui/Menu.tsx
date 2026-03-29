type MenuProps = {
  onStart: () => void;
};

export default function Menu({ onStart }: MenuProps) {
  return (
    <div className="screen-center">
      <h1 className="game-title">Enggan Ngoding</h1>
      <p className="game-subtitle">
        Kenapa coding sendiri kalau bisa suruh AI?
      </p>
      <button className="btn btn-primary" onClick={onStart}>
        Mulai
      </button>
    </div>
  );
}
