type BriefingProps = {
  onAccept: () => void;
};

export default function Briefing({ onAccept }: BriefingProps) {
  return (
    <div className="screen-center">
      <div className="briefing-card">
        <h2>Hari Ini di Kantor</h2>
        <p className="ohim-message">
          Ohim: "Angga, fix bug ini sebelum deadline. Gua awasin lu."
        </p>
        <p className="objective">Selesaikan 3 task coding untuk survive.</p>
        <button className="btn btn-primary" onClick={onAccept}>
          Terima Kerjaan
        </button>
      </div>
    </div>
  );
}
