import { useState, useEffect, memo } from "react";
import { Clock } from "lucide-react";

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
    <div className="relative w-4 h-6 md:w-5 md:h-7" style={{ perspective: '250px' }}>
      {/* Static top half */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card to-card/90 rounded-sm border border-border/60 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs md:text-sm text-white dark:text-white">
              {value}
            </div>
          </div>
        </div>
      </div>

      {/* Flipping top half */}
      {isFlipping && (
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ 
            transformStyle: 'preserve-3d',
            transformOrigin: 'center bottom'
          }}
        >
          <div 
            className="absolute inset-0 bg-gradient-to-b from-card to-card/90 rounded-sm border border-border/60 shadow-sm animate-flip"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs md:text-sm text-white dark:text-white">
                {prevValue}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Static bottom half */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-card/90 to-card rounded-sm border border-border/60 shadow-sm">
          <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs md:text-sm text-white dark:text-white" style={{ transform: 'translateY(-100%)' }}>
              {value}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

FlipDigit.displayName = 'FlipDigit';

function Separator() {
  return (
    <div className="flex flex-col gap-0.5 px-0.5 items-center justify-center">
      <div className="w-0.5 h-0.5 rounded-full bg-white/80 dark:bg-white/80 animate-pulse" />
      <div className="w-0.5 h-0.5 rounded-full bg-white/80 dark:bg-white/80 animate-pulse" style={{ animationDelay: '0.5s' }} />
    </div>
  );
}

interface TimeState {
  hours: [string, string];
  minutes: [string, string];
  seconds: [string, string];
  isPM: boolean;
  date: string;
}

export function FlipClock() {
  const [currentTime, setCurrentTime] = useState<TimeState>(() => {
    const now = new Date();
    const hours = now.getHours();
    const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    return {
      hours: [displayHours[0], displayHours[1]],
      minutes: [minutes[0], minutes[1]],
      seconds: [seconds[0], seconds[1]],
      isPM: hours >= 12,
      date: now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    };
  });

  const [prevTime, setPrevTime] = useState(currentTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrevTime(currentTime);
      
      const now = new Date();
      const hours = now.getHours();
      const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      
      setCurrentTime({
        hours: [displayHours[0], displayHours[1]],
        minutes: [minutes[0], minutes[1]],
        seconds: [seconds[0], seconds[1]],
        isPM: hours >= 12,
        date: now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTime]);

  return (
    <div 
      className="flex flex-col gap-1 px-1.5 py-1 rounded-md bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50 shadow-sm"
      data-testid="flip-clock"
    >
      <div className="flex items-center gap-0.5">
        <Clock className="h-2 w-2 text-white/70 dark:text-white/70 mr-0.5" />
        
        {/* Hours */}
        <div className="flex items-center gap-0.5">
          <FlipDigit value={currentTime.hours[0]} prevValue={prevTime.hours[0]} />
          <FlipDigit value={currentTime.hours[1]} prevValue={prevTime.hours[1]} />
        </div>
        
        <Separator />
        
        {/* Minutes */}
        <div className="flex items-center gap-0.5">
          <FlipDigit value={currentTime.minutes[0]} prevValue={prevTime.minutes[0]} />
          <FlipDigit value={currentTime.minutes[1]} prevValue={prevTime.minutes[1]} />
        </div>
        
        <Separator />
        
        {/* Seconds */}
        <div className="flex items-center gap-0.5">
          <FlipDigit value={currentTime.seconds[0]} prevValue={prevTime.seconds[0]} />
          <FlipDigit value={currentTime.seconds[1]} prevValue={prevTime.seconds[1]} />
        </div>
        
        <div className="ml-0.5 text-[8px] md:text-[9px] font-bold text-white/90 dark:text-white/90 min-w-[16px]">
          {currentTime.isPM ? 'PM' : 'AM'}
        </div>
      </div>
      
      <div className="text-[7px] md:text-[8px] text-center text-white/80 dark:text-white/80 font-medium border-t border-border/30 pt-0.5">
        {currentTime.date}
      </div>
    </div>
  );
}
