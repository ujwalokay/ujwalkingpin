import { useState, useEffect, memo } from "react";

interface FlipDigitProps {
  value: string;
  prevValue: string;
  label?: string;
}

const FlipDigit = memo(({ value, prevValue, label }: FlipDigitProps) => {
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-6 h-8" style={{ perspective: '200px' }}>
        <div className="absolute inset-0 overflow-hidden rounded">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7B68EE] to-[#6A5ACD] rounded shadow-md border border-white/10">
            <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden border-b border-white/5">
              <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-lg text-white">
                {value}
              </div>
            </div>
          </div>
        </div>

        {isFlipping && (
          <div 
            className="absolute inset-0 overflow-hidden rounded"
            style={{ 
              transformStyle: 'preserve-3d',
              transformOrigin: 'center bottom',
              animation: 'flip 0.6s ease-in-out'
            }}
          >
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#7B68EE] to-[#6A5ACD] rounded shadow-md border border-white/10"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-lg text-white">
                  {prevValue}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded">
          <div className="absolute inset-0 bg-gradient-to-br from-[#6A5ACD] to-[#5B4BC4] rounded shadow-md border border-white/10">
            <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden border-t border-white/5">
              <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-lg text-white" style={{ transform: 'translateY(-100%)' }}>
                {value}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {label && (
        <div className="text-[8px] font-bold text-foreground uppercase tracking-wide">
          {label}
        </div>
      )}
    </div>
  );
});

FlipDigit.displayName = 'FlipDigit';

interface TimeState {
  hours: [string, string];
  minutes: [string, string];
  seconds: [string, string];
  day: string;
  month: string;
  date: string;
  year: string;
}

export function FlipClock() {
  const [currentTime, setCurrentTime] = useState<TimeState>(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    return {
      hours: [hours[0], hours[1]],
      minutes: [minutes[0], minutes[1]],
      seconds: [seconds[0], seconds[1]],
      day: now.toLocaleDateString('en-US', { weekday: 'short' }),
      month: now.toLocaleDateString('en-US', { month: 'short' }),
      date: now.getDate().toString(),
      year: now.getFullYear().toString()
    };
  });

  const [prevTime, setPrevTime] = useState(currentTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrevTime(currentTime);
      
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      
      setCurrentTime({
        hours: [hours[0], hours[1]],
        minutes: [minutes[0], minutes[1]],
        seconds: [seconds[0], seconds[1]],
        day: now.toLocaleDateString('en-US', { weekday: 'short' }),
        month: now.toLocaleDateString('en-US', { month: 'short' }),
        date: now.getDate().toString(),
        year: now.getFullYear().toString()
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTime]);

  return (
    <div 
      className="flex items-center gap-2"
      data-testid="flip-clock"
    >
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          <FlipDigit value={currentTime.hours[0]} prevValue={prevTime.hours[0]} />
          <FlipDigit value={currentTime.hours[1]} prevValue={prevTime.hours[1]} label="HOURS" />
        </div>
        
        <div className="flex items-center gap-0.5">
          <FlipDigit value={currentTime.minutes[0]} prevValue={prevTime.minutes[0]} />
          <FlipDigit value={currentTime.minutes[1]} prevValue={prevTime.minutes[1]} label="MINUTES" />
        </div>
        
        <div className="flex items-center gap-0.5">
          <FlipDigit value={currentTime.seconds[0]} prevValue={prevTime.seconds[0]} />
          <FlipDigit value={currentTime.seconds[1]} prevValue={prevTime.seconds[1]} label="SECONDS" />
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground font-medium">
        {currentTime.day}, {currentTime.month} {currentTime.date}, {currentTime.year}
      </div>
    </div>
  );
}
