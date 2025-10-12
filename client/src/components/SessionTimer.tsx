import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useServerTime } from "@/hooks/useServerTime";

interface SessionTimerProps {
  endTime: Date;
  className?: string;
}

export function SessionTimer({ endTime, className = "" }: SessionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpiring, setIsExpiring] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const { isReady, getTime } = useServerTime();

  useEffect(() => {
    const updateTimer = () => {
      const now = isReady ? getTime() : new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setIsExpired(true);
        setIsExpiring(false);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );

      setIsExpiring(diff <= 5 * 60 * 1000);
      setIsExpired(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime, isReady, getTime]);

  const timerColor = isExpired 
    ? "text-destructive" 
    : isExpiring 
    ? "text-chart-3" 
    : "text-chart-1";

  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid="timer-display">
      <Clock className={`h-4 w-4 ${timerColor}`} />
      <span className={`font-mono text-lg font-bold ${timerColor}`}>
        {timeLeft}
      </span>
    </div>
  );
}
