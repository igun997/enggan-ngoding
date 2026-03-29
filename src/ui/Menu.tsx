type MenuProps = {
  onStart: () => void;
};

export default function Menu({ onStart }: MenuProps) {
  return (
    <div className="screen-center">
      <h1 className="game-title">Enggan Ngoding</h1>
      <p className="game-subtitle">
        Fix bug atau dipecat. Pilihan ada di tangan lu.
      </p>
      <button className="btn btn-primary" onClick={onStart}>
        Mulai
      </button>
    </div>
  );
}
