import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card/50 backdrop-blur-sm border border-border/50"
      data-testid="live-clock"
    >
      <Clock className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
      <div className="flex flex-col gap-0.5 min-w-[120px]">
        <div 
          className="text-sm font-mono font-semibold tabular-nums tracking-tight leading-none transition-all duration-300"
          style={{
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatTime(time)}
        </div>
        <div className="text-[10px] text-muted-foreground font-medium leading-none">
          {formatDate(time)}
        </div>
      </div>
    </div>
  );
}
