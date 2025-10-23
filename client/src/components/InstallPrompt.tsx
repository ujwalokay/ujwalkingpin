import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

interface InstallPromptProps {
  onClose?: () => void;
}

export function InstallPrompt({ onClose }: InstallPromptProps) {
  const { canInstall, isInstalled, promptToInstall } = useInstallPrompt();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the prompt in this session
    const hasBeenDismissed = sessionStorage.getItem('installPromptDismissed');
    
    if (hasBeenDismissed) {
      setDismissed(true);
      return;
    }

    // Show prompt after a short delay if the app can be installed
    if (canInstall && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000); // Show after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, dismissed]);

  const handleInstall = async () => {
    const accepted = await promptToInstall();
    if (accepted) {
      setShowPrompt(false);
      onClose?.();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('installPromptDismissed', 'true');
    onClose?.();
  };

  // Don't render if already installed or dismissed
  if (isInstalled || dismissed || !canInstall) {
    return null;
  }

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="max-w-md" data-testid="dialog-install-prompt">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-500" />
            Add to Home Screen
          </DialogTitle>
          <DialogDescription>
            Install Airavoto Gaming Admin Panel on your device for quick and easy access. Works offline and feels like a native app!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
              1
            </div>
            <div>
              <p className="font-medium">Launch from home screen</p>
              <p className="text-sm text-muted-foreground">Access instantly without opening your browser</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
              2
            </div>
            <div>
              <p className="font-medium">Works offline</p>
              <p className="text-sm text-muted-foreground">Continue managing bookings even without internet</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
              3
            </div>
            <div>
              <p className="font-medium">Full-screen experience</p>
              <p className="text-sm text-muted-foreground">App-like interface for better productivity</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleDismiss}
            data-testid="button-dismiss-install"
          >
            <X className="h-4 w-4 mr-2" />
            Not Now
          </Button>
          <Button
            onClick={handleInstall}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            data-testid="button-install-app"
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
