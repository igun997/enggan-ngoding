import { ResultType } from "../types";

type ResultProps = {
  result: ResultType;
  onRetry: () => void;
  onMenu: () => void;
};

const RESULT_MESSAGES: Record<string, { text: string; className: string }> = {
  win: {
    text: "Deploy berhasil! Angga selamat... untuk hari ini.",
    className: "win",
  },
  fired: {
    text: "ANGGA DIPECAT! Mang Alif sudah muak dengan developer yang gabisa ngoding.",
    className: "lose",
  },
};

export default function Result({ result, onRetry, onMenu }: ResultProps) {
  const msg = RESULT_MESSAGES[result ?? "win"];

  return (
    <div className="screen-center">
      <div className={`result-message ${msg.className}`}>{msg.text}</div>
      <div className="result-buttons">
        {result === "win" ? (
          <button className="btn btn-primary" onClick={onMenu}>
            Kembali ke Menu
          </button>
        ) : (
          <>
            <button className="btn btn-primary" onClick={onRetry}>
              Coba Lagi
            </button>
            <button className="btn btn-secondary" onClick={onMenu}>
              Kembali ke Menu
            </button>
          </>
        )}
      </div>
    </div>
  );
}
