import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NetworkAlertProps {
  open: boolean;
  onRefresh: () => void;
  onDismiss: () => void;
}

export function NetworkAlert({ open, onRefresh, onDismiss }: NetworkAlertProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent 
        className="sm:max-w-md border-red-500/50 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20"
        data-testid="dialog-network-alert"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-3 rounded-full">
              <WifiOff className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Network Connection Lost
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-red-600/80 dark:text-red-300/80 pt-2">
            The application has lost connection to the server. This may happen when:
          </DialogDescription>
          <ul className="text-sm text-red-600/70 dark:text-red-300/70 list-disc list-inside space-y-1 pt-2">
            <li>Your internet connection is unstable</li>
            <li>The server went to sleep due to inactivity</li>
            <li>The application froze or became unresponsive</li>
          </ul>
        </DialogHeader>
        
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onDismiss}
            className="flex-1"
            data-testid="button-dismiss-network-alert"
          >
            Dismiss
          </Button>
          <Button
            onClick={onRefresh}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            data-testid="button-refresh-page"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
