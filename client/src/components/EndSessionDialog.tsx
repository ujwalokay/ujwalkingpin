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
      <AlertDialogContent data-testid="dialog-end-session">
        <AlertDialogHeader>
          <AlertDialogTitle>End Session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to end the session for {seatName}
            {customerName && ` (${customerName})`}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-end">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} data-testid="button-confirm-end">
            End Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
