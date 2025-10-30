import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EndSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seatName: string;
  customerName?: string;
  onConfirm?: () => void;
}

export function EndSessionDialog({
  open,
  onOpenChange,
  seatName,
  customerName,
  onConfirm,
}: EndSessionDialogProps) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[95vw] sm:w-full max-w-md p-4 sm:p-6" data-testid="dialog-end-session">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base sm:text-lg">End Session</AlertDialogTitle>
          <AlertDialogDescription className="text-xs sm:text-sm">
            Are you sure you want to end the session for {seatName}
            {customerName && ` (${customerName})`}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel data-testid="button-cancel-end" className="w-full sm:w-auto mt-0">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} data-testid="button-confirm-end" className="w-full sm:w-auto">
            End Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
