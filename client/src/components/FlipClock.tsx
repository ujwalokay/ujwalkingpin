import { useState, useEffect, memo } from "react";

interface FlipDigitProps {
  value: string;
  prevValue: string;
}

const FlipDigit = memo(({ value, prevValue }: FlipDigitProps) => {
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <div className="relative w-6 h-8" style={{ perspective: '200px' }}>
      <div className="absolute inset-0 overflow-visible rounded">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7B68EE] to-[#6A5ACD] rounded shadow-sm border border-white/10 flex items-center justify-center">
          <span className="font-mono font-bold text-xl text-white leading-none">{value}</span>
        </div>
      </div>

      {isFlipping && (
        <div 
          className="absolute inset-0 overflow-visible rounded"
          style={{ 
            transformStyle: 'preserve-3d',
            transformOrigin: 'center bottom',
            animation: 'flip 0.6s ease-in-out'
          }}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-br from-[#7B68EE] to-[#6A5ACD] rounded shadow-sm border border-white/10 flex items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="font-mono font-bold text-xl text-white leading-none">{prevValue}</span>
          </div>
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
  dateText: string;
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
      dateText: now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
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
        dateText: now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTime]);

  return (
    <div 
      className="flex items-center gap-2"
      data-testid="flip-clock"
    >
      <div className="flex items-center gap-1">
        <FlipDigit value={currentTime.hours[0]} prevValue={prevTime.hours[0]} />
        <FlipDigit value={currentTime.hours[1]} prevValue={prevTime.hours[1]} />
        
        <span className="text-lg font-bold text-muted-foreground mx-0.5">:</span>
        
        <FlipDigit value={currentTime.minutes[0]} prevValue={prevTime.minutes[0]} />
        <FlipDigit value={currentTime.minutes[1]} prevValue={prevTime.minutes[1]} />
        
        <span className="text-lg font-bold text-muted-foreground mx-0.5">:</span>
        
        <FlipDigit value={currentTime.seconds[0]} prevValue={prevTime.seconds[0]} />
        <FlipDigit value={currentTime.seconds[1]} prevValue={prevTime.seconds[1]} />
      </div>
      
      <div className="text-xs text-muted-foreground font-medium whitespace-nowrap">
        {currentTime.dateText}
      </div>
    </div>
  );
}
