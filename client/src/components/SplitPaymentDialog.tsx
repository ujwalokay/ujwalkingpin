import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Smartphone, IndianRupee } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SplitPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingIds: string[];
  totalAmount: number;
  customerName?: string;
  whatsappNumber?: string;
  onSuccess?: () => void;
}

export function SplitPaymentDialog({
  open,
  onOpenChange,
  bookingIds,
  totalAmount,
  customerName: defaultCustomerName,
  whatsappNumber: defaultWhatsappNumber,
  onSuccess,
}: SplitPaymentDialogProps) {
  const [cashAmount, setCashAmount] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const cash = parseFloat(cashAmount) || 0;
    const remaining = Math.max(0, totalAmount - cash);
    setUpiAmount(remaining.toFixed(2));
  }, [cashAmount, totalAmount]);

  const splitPaymentMutation = useMutation({
    mutationFn: async (data: {
      bookingIds: string[];
      cashAmount: string;
      upiAmount: string;
    }) => {
      return await apiRequest("POST", "/api/bookings/split-payment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Split Payment Recorded",
        description: `Cash: ₹${cashAmount} | UPI: ₹${upiAmount}`,
      });
      handleClose();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async () => {
    const cash = parseFloat(cashAmount) || 0;
    const upi = parseFloat(upiAmount) || 0;

    if (cash < 0 || upi < 0) {
      toast({
        title: "Invalid Amounts",
        description: "Amounts cannot be negative",
        variant: "destructive",
      });
      return;
    }

    if (Math.abs(cash + upi - totalAmount) > 0.01) {
      toast({
        title: "Amount Mismatch",
        description: `Cash (₹${cash}) + UPI (₹${upi}) must equal Total (₹${totalAmount})`,
        variant: "destructive",
      });
      return;
    }

    if (cash === 0 && upi === 0) {
      toast({
        title: "No Payment",
        description: "Please enter payment amounts",
        variant: "destructive",
      });
      return;
    }

    await splitPaymentMutation.mutateAsync({
      bookingIds,
      cashAmount: cash.toFixed(2),
      upiAmount: upi.toFixed(2),
    });
  };

  const handleClose = () => {
    setCashAmount("");
    setUpiAmount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-split-payment">
        <DialogHeader>
          <DialogTitle>Split Payment (Cash + UPI)</DialogTitle>
          <DialogDescription>
            Customer paying with both cash and UPI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Total Amount
              </span>
              <span className="text-2xl font-bold text-primary" data-testid="text-total-amount">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cashAmount">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-green-600" />
                Cash Amount
              </div>
            </Label>
            <Input
              id="cashAmount"
              type="number"
              step="0.01"
              min="0"
              max={totalAmount}
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="Enter cash amount"
              data-testid="input-cash-amount"
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upiAmount">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-600" />
                UPI Amount
              </div>
            </Label>
            <Input
              id="upiAmount"
              type="number"
              step="0.01"
              value={upiAmount}
              readOnly
              className="bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700 text-lg"
              data-testid="input-upi-amount"
            />
            <p className="text-xs text-muted-foreground">
              Auto-calculated as remaining amount
            </p>
          </div>

          <div className="rounded-lg border p-3 bg-muted/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash:</span>
                <span className="font-semibold text-green-600">₹{cashAmount || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">UPI:</span>
                <span className="font-semibold text-blue-600">₹{upiAmount || "0.00"}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Total:</span>
                <span className="font-bold">₹{((parseFloat(cashAmount) || 0) + (parseFloat(upiAmount) || 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={splitPaymentMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={splitPaymentMutation.isPending}
            data-testid="button-confirm-split-payment"
          >
            {splitPaymentMutation.isPending ? "Processing..." : "Confirm Split Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
