import { useState, useEffect, memo } from "react";
import { useServerTime } from "@/hooks/useServerTime";

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

const FlipPeriod = memo(({ value, prevValue }: FlipDigitProps) => {
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <div className="relative w-10 h-8" style={{ perspective: '200px' }}>
      <div className="absolute inset-0 overflow-visible rounded">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7B68EE] to-[#6A5ACD] rounded shadow-sm border border-white/10 flex items-center justify-center">
          <span className="font-mono font-bold text-sm text-white leading-none">{value}</span>
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
            <span className="font-mono font-bold text-sm text-white leading-none">{prevValue}</span>
          </div>
        </div>
      )}
    </div>
  );
});

FlipPeriod.displayName = 'FlipPeriod';

interface TimeState {
  hours: [string, string];
  minutes: [string, string];
  period: string;
  dateText: string;
}

export function FlipClock() {
  const { isReady, getTime } = useServerTime();
  
  const getISTTime = (): TimeState => {
    const now = getTime();
    const istTimeString = now.toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const [hours24Str, minutesStr] = istTimeString.split(':');
    const hours24 = parseInt(hours24Str);
    const hours12 = (hours24 % 12 || 12).toString().padStart(2, '0');
    const minutes = minutesStr.padStart(2, '0');
    const period = hours24 >= 12 ? 'PM' : 'AM';
    
    const dateText = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
    
    return {
      hours: [hours12[0], hours12[1]] as [string, string],
      minutes: [minutes[0], minutes[1]] as [string, string],
      period,
      dateText
    };
  };

  const [currentTime, setCurrentTime] = useState<TimeState>(getISTTime);
  const [prevTime, setPrevTime] = useState(currentTime);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrevTime(currentTime);
      setCurrentTime(getISTTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [currentTime, getTime]);

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
        
        <FlipPeriod value={currentTime.period} prevValue={prevTime.period} />
      </div>
      
      <div className="text-xs text-muted-foreground font-medium whitespace-nowrap">
        {currentTime.dateText}
      </div>
    </div>
  );
}
