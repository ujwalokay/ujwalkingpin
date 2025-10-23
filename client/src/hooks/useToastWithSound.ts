import { useToast } from "@/hooks/use-toast";
import { useSoundAlert, type SoundType } from "@/hooks/useSoundAlert";
import { useCallback } from "react";

export function useToastWithSound() {
  const { toast: originalToast } = useToast();
  const { playSound } = useSoundAlert();

  const toast = useCallback(
    (props: Parameters<typeof originalToast>[0]) => {
      // Determine sound type based on toast variant
      let soundType: SoundType = 'info';
      
      const titleStr = typeof props.title === 'string' ? props.title : '';
      const descStr = typeof props.description === 'string' ? props.description : '';
      
      if (props.variant === 'destructive') {
        soundType = 'error';
      } else if (titleStr.toLowerCase().includes('success') || 
                 descStr.toLowerCase().includes('success') ||
                 titleStr.toLowerCase().includes('added') ||
                 titleStr.toLowerCase().includes('created') ||
                 titleStr.toLowerCase().includes('updated')) {
        soundType = 'success';
      } else if (titleStr.toLowerCase().includes('warning') || 
                 descStr.toLowerCase().includes('warning') ||
                 titleStr.toLowerCase().includes('low stock')) {
        soundType = 'warning';
      }

      // Play sound based on type
      playSound(soundType);

      // Call original toast
      return originalToast(props);
    },
    [originalToast, playSound]
  );

  return { toast };
}
