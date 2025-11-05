import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface MergeSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  existingSeat: string;
  onMerge: () => void;
  onSeparate: () => void;
}

export function MergeSessionDialog({
  open,
  onOpenChange,
  customerName,
  existingSeat,
  onMerge,
  onSeparate,
}: MergeSessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-merge-session">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <DialogTitle>Username Match Found</DialogTitle>
          </div>
          <DialogDescription className="pt-2 space-y-3">
            <div>
              The username "<span className="font-semibold text-foreground">{customerName}</span>" matches an existing session at{" "}
              <span className="font-semibold text-foreground">{existingSeat}</span>.
            </div>
            <div className="p-3 bg-muted rounded-md text-sm">
              <div className="font-medium mb-2">What would you like to do?</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <span className="font-medium">Merge:</span> Combine the new booking with the existing session (same customer)</li>
                <li>• <span className="font-medium">Separate:</span> Create independent session (different customer with same name)</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onSeparate();
              onOpenChange(false);
            }}
            data-testid="button-separate-session"
            className="w-full sm:w-auto"
          >
            Keep Separate
          </Button>
          <Button
            onClick={() => {
              onMerge();
              onOpenChange(false);
            }}
            data-testid="button-merge-session"
            className="w-full sm:w-auto"
          >
            Merge Sessions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
