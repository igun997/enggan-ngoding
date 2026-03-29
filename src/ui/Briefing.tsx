import { Level } from '../types';

type BriefingProps = {
  level: Level;
  onAccept: () => void;
};

export default function Briefing({ level, onAccept }: BriefingProps) {
  return (
    <div className="screen-center">
      <div className="briefing-card">
        <h2>{level.title}</h2>
        <p className="ohim-message">Ohim: "{level.ohimMessage}"</p>
        <p className="objective">{level.objective}</p>
        <button className="btn btn-primary" onClick={onAccept}>
          Terima Tiket
        </button>
      </div>
    </div>
  );
}
