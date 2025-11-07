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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wallet, CreditCard, IndianRupee } from "lucide-react";
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
  const [creditAmount, setCreditAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi_online">("cash");
  const [customerName, setCustomerName] = useState(defaultCustomerName || "");
  const [whatsappNumber, setWhatsappNumber] = useState(defaultWhatsappNumber || "");
  const { toast } = useToast();

  useEffect(() => {
    if (defaultCustomerName) setCustomerName(defaultCustomerName);
    if (defaultWhatsappNumber) setWhatsappNumber(defaultWhatsappNumber);
  }, [defaultCustomerName, defaultWhatsappNumber]);

  useEffect(() => {
    const cash = parseFloat(cashAmount) || 0;
    const remaining = Math.max(0, totalAmount - cash);
    setCreditAmount(remaining.toFixed(2));
  }, [cashAmount, totalAmount]);

  const splitPaymentMutation = useMutation({
    mutationFn: async (data: {
      bookingIds: string[];
      cashAmount: string;
      creditAmount: string;
      paymentMethod: string;
      customerName: string;
      whatsappNumber?: string;
    }) => {
      return await apiRequest("POST", "/api/credits/split-payment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits/accounts"] });
      toast({
        title: "Split Payment Recorded",
        description: `₹${cashAmount} collected, ₹${creditAmount} added to credit account`,
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
    if (!customerName.trim()) {
      toast({
        title: "Customer Name Required",
        description: "Please enter the customer name",
        variant: "destructive",
      });
      return;
    }

    const cash = parseFloat(cashAmount) || 0;
    const credit = parseFloat(creditAmount) || 0;

    if (cash < 0 || credit < 0) {
      toast({
        title: "Invalid Amounts",
        description: "Amounts cannot be negative",
        variant: "destructive",
      });
      return;
    }

    if (Math.abs(cash + credit - totalAmount) > 0.01) {
      toast({
        title: "Amount Mismatch",
        description: `Cash (₹${cash}) + Credit (₹${credit}) must equal Total (₹${totalAmount})`,
        variant: "destructive",
      });
      return;
    }

    if (credit <= 0) {
      toast({
        title: "No Credit Amount",
        description: "Please enter a credit amount greater than zero",
        variant: "destructive",
      });
      return;
    }

    await splitPaymentMutation.mutateAsync({
      bookingIds,
      cashAmount: cash.toFixed(2),
      creditAmount: credit.toFixed(2),
      paymentMethod,
      customerName: customerName.trim(),
      whatsappNumber: whatsappNumber.trim() || undefined,
    });
  };

  const handleClose = () => {
    setCashAmount("");
    setCreditAmount("");
    setPaymentMethod("cash");
    setCustomerName(defaultCustomerName || "");
    setWhatsappNumber(defaultWhatsappNumber || "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-split-payment">
        <DialogHeader>
          <DialogTitle>Split Payment</DialogTitle>
          <DialogDescription>
            Split the payment between cash/UPI and credit for customer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              data-testid="input-customer-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp Number (Optional)</Label>
            <Input
              id="whatsappNumber"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="Enter WhatsApp number"
              data-testid="input-whatsapp-number"
            />
          </div>

          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Amount</span>
              <span className="text-xl font-bold" data-testid="text-total-amount">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cashAmount">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Cash/UPI Amount
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
              placeholder="Enter amount paid now"
              data-testid="input-cash-amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method (for cash portion)</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi_online">UPI/Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="creditAmount">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Credit Amount (Balance)
              </div>
            </Label>
            <Input
              id="creditAmount"
              type="number"
              step="0.01"
              value={creditAmount}
              readOnly
              className="bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700"
              data-testid="input-credit-amount"
            />
            <p className="text-xs text-muted-foreground">
              This amount will be added to the customer's credit account
            </p>
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
