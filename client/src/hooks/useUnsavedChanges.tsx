import { useEffect, useCallback, useState } from "react";
import { useLocation } from "wouter";

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  message?: string;
}

export function useUnsavedChanges({ hasUnsavedChanges, message = "You have unsaved changes. Are you sure you want to leave?" }: UseUnsavedChangesOptions) {
  const [location] = useLocation();
  const [pendingLocation, setPendingLocation] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Handle browser navigation (refresh, close tab, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, message]);

  // Create a navigation blocker
  const confirmNavigation = useCallback(() => {
    setShowConfirmDialog(false);
    if (pendingLocation) {
      // Navigate to the pending location
      window.location.href = pendingLocation;
    }
  }, [pendingLocation]);

  const cancelNavigation = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingLocation(null);
  }, []);

  // Intercept clicks on links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      const target = e.target as HTMLElement;
      const link = target.closest("a");
      
      if (link && link.href && !link.href.includes(location)) {
        e.preventDefault();
        e.stopPropagation();
        setPendingLocation(link.href);
        setShowConfirmDialog(true);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hasUnsavedChanges, location]);

  return {
    showConfirmDialog,
    confirmNavigation,
    cancelNavigation,
    message,
  };
}
