import { useCallback, useRef } from 'react';

export type SoundType = 'success' | 'error' | 'warning' | 'info' | 'timer';

export function useSoundAlert() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playBeep = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    const ctx = initAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [initAudioContext]);

  const playSound = useCallback((soundType: SoundType) => {
    switch (soundType) {
      case 'success':
        // Happy ascending tones
        playBeep(523.25, 0.1); // C5
        setTimeout(() => playBeep(659.25, 0.15), 100); // E5
        break;
      case 'error':
        // Harsh descending tones
        playBeep(493.88, 0.1, 'square'); // B4
        setTimeout(() => playBeep(329.63, 0.2, 'square'), 100); // E4
        break;
      case 'warning':
        // Alert pattern
        playBeep(880, 0.1); // A5
        setTimeout(() => playBeep(880, 0.1), 150);
        break;
      case 'info':
        // Gentle single beep
        playBeep(523.25, 0.15); // C5
        break;
      case 'timer':
        // Urgent repeating beeps
        playBeep(1046.5, 0.2); // C6
        setTimeout(() => playBeep(1046.5, 0.2), 250);
        setTimeout(() => playBeep(1046.5, 0.2), 500);
        break;
    }
  }, [playBeep]);

  return { playSound };
}
