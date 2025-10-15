import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

interface ShortcutsContextType {
  shortcuts: KeyboardShortcut[];
  registerShortcuts: (pageShortcuts: KeyboardShortcut[]) => void;
  unregisterShortcuts: (pageShortcuts: KeyboardShortcut[]) => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null);

export function ShortcutsProvider({ 
  children, 
  globalShortcuts 
}: { 
  children: React.ReactNode;
  globalShortcuts: KeyboardShortcut[];
}) {
  const [pageShortcuts, setPageShortcuts] = useState<KeyboardShortcut[]>([]);

  const registerShortcuts = useCallback((shortcuts: KeyboardShortcut[]) => {
    setPageShortcuts(prev => [...prev, ...shortcuts]);
  }, []);

  const unregisterShortcuts = useCallback((shortcuts: KeyboardShortcut[]) => {
    setPageShortcuts(prev => 
      prev.filter(s => !shortcuts.some(rs => 
        rs.key === s.key && 
        rs.ctrlKey === s.ctrlKey && 
        rs.altKey === s.altKey &&
        rs.shiftKey === s.shiftKey
      ))
    );
  }, []);

  const allShortcuts = [...globalShortcuts, ...pageShortcuts];

  return (
    <ShortcutsContext.Provider value={{ 
      shortcuts: allShortcuts, 
      registerShortcuts, 
      unregisterShortcuts 
    }}>
      {children}
    </ShortcutsContext.Provider>
  );
}

export function useShortcutsContext() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useShortcutsContext must be used within ShortcutsProvider');
  }
  return context;
}

export function useRegisterShortcuts(shortcuts: KeyboardShortcut[]) {
  const { registerShortcuts, unregisterShortcuts } = useShortcutsContext();

  useEffect(() => {
    registerShortcuts(shortcuts);
    return () => unregisterShortcuts(shortcuts);
  }, [shortcuts, registerShortcuts, unregisterShortcuts]);
}
