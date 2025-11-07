import { useEffect, useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

export function InactivityRefreshPrompt() {
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [isInactive, setIsInactive] = useState(false);

  const updateActivity = useCallback(() => {
    setLastActivityTime(Date.now());
    setIsInactive(false);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const checkActivity = (e: Event) => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime;

      if (timeSinceLastActivity > INACTIVITY_TIMEOUT && !isInactive) {
        setIsInactive(true);
        setShowRefreshDialog(true);
      } else if (timeSinceLastActivity < INACTIVITY_TIMEOUT) {
        updateActivity();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, checkActivity, { passive: true });
    });

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime;

      if (timeSinceLastActivity > INACTIVITY_TIMEOUT && !isInactive) {
        setIsInactive(true);
      }
    }, 60000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, checkActivity);
      });
      clearInterval(interval);
    };
  }, [lastActivityTime, isInactive, updateActivity]);

  return (
    <AlertDialog open={showRefreshDialog} onOpenChange={setShowRefreshDialog}>
      <AlertDialogContent className="max-w-md" data-testid="dialog-inactivity-refresh">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-xl">Session Inactive</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base leading-relaxed">
            Your session has been inactive for more than 15 minutes. The server may have gone to sleep.
            <br /><br />
            <strong>Please refresh the page</strong> to ensure everything works properly and to reconnect to the server.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            onClick={handleRefresh}
            className="w-full gap-2"
            size="lg"
            data-testid="button-refresh-page"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page Now
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
