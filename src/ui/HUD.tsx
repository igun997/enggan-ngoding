import { useEffect, useRef } from "react";

type HUDProps = {
  coffee: number;
  timeLeft: number;
  levelTitle: string;
  onTimerTick: () => void;
  onTimeUp: () => void;
  onCoffeeEmpty: () => void;
};

export default function HUD({
  coffee,
  timeLeft,
  levelTitle,
  onTimerTick,
  onTimeUp,
  onCoffeeEmpty,
}: HUDProps) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      onTimerTick();
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onTimerTick]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
    }
  }, [timeLeft, onTimeUp]);

  useEffect(() => {
    if (coffee <= 0) {
      onCoffeeEmpty();
    }
  }, [coffee, onCoffeeEmpty]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="hud">
      <div className="hud-item">
        <span>Kopi:</span>
        <div className="coffee-bar">
          <div className="coffee-fill" style={{ width: `${coffee}%` }} />
        </div>
        <span>{coffee}%</span>
      </div>
      <div className="hud-item">
        <span>Waktu:</span>
        <span>{timeStr}</span>
      </div>
      <div className="hud-item">
        <span>{levelTitle}</span>
      </div>
    </div>
  );
}
