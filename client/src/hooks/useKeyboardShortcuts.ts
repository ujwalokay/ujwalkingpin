import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  category?: string;
}

export const useKeyboardShortcut = (shortcut: KeyboardShortcut) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const isModifierMatch = 
        (shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey) &&
        (shortcut.altKey === undefined || event.altKey === shortcut.altKey) &&
        (shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey) &&
        (shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey);

      if (event.key.toLowerCase() === shortcut.key.toLowerCase() && isModifierMatch) {
        // Prevent default only if not typing in an input
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          event.preventDefault();
          shortcut.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [shortcut]);
};

export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.metaKey) parts.push('⌘');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
};
