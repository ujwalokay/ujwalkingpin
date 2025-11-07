import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  CreditCard,
  Wallet,
  Clock,
  User,
  Phone,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";

type CreditAccount = {
  id: string;
  customerName: string;
  whatsappNumber: string | null;
  currentBalance: string;
  createdAt: Date;
  updatedAt: Date;
};

type CreditEntry = {
  id: string;
  creditAccountId: string;
  bookingId: string;
  openingBalance: string;
  creditIssued: string;
  nonCreditPaid: string;
  remainingCredit: string;
  status: string;
  issuedAt: Date;
  lastActivityAt: Date;
};

type CreditPayment = {
  id: string;
  creditAccountId: string;
  creditEntryId: string | null;
  bookingId: string | null;
  amount: string;
  paymentMethod: string;
  recordedBy: string;
  recordedAt: Date;
  notes: string | null;
};

type CreditAccountWithDetails = CreditAccount & {
  entries: CreditEntry[];
  payments: CreditPayment[];
};

export default function CreditBalances() {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CreditAccountWithDetails | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi_online">("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: accounts = [], isLoading } = useQuery<CreditAccountWithDetails[]>({
    queryKey: ["/api/credits/accounts"],
  });

  const filteredAccounts = accounts.filter(
    (account) =>
      account.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.whatsappNumber?.includes(searchQuery)
  );

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: {
      accountId: string;
      amount: string;
      paymentMethod: string;
      notes?: string;
    }) => {
      return await apiRequest("POST", "/api/credits/payment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits/accounts"] });
      toast({
        title: "Payment Recorded",
        description: "Credit payment has been successfully recorded",
      });
      setPaymentDialogOpen(false);
      setSelectedAccount(null);
      setPaymentAmount("");
      setPaymentNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (entryId: string) => {
      return await apiRequest("PATCH", `/api/credits/entries/${entryId}/mark-paid`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits/accounts"] });
      toast({
        title: "Marked as Paid",
        description: "Credit entry has been marked as paid and will appear in reports",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Mark as Paid",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAccountExpanded = (accountId: string) => {
    setExpandedAccounts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const handleRecordPayment = (account: CreditAccountWithDetails) => {
    setSelectedAccount(account);
    setPaymentAmount(account.currentBalance);
    setPaymentDialogOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedAccount) return;

    const amount = parseFloat(paymentAmount);
    const balance = parseFloat(selectedAccount.currentBalance);

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Amount Too Large",
        description: "Payment amount cannot exceed outstanding balance",
        variant: "destructive",
      });
      return;
    }

    await recordPaymentMutation.mutateAsync({
      accountId: selectedAccount.id,
      amount: amount.toFixed(2),
      paymentMethod,
      notes: paymentNotes.trim() || undefined,
    });
  };

  const totalOutstanding = accounts.reduce(
    (sum, account) => sum + parseFloat(account.currentBalance),
    0
  );

  const accountsWithBalance = accounts.filter(
    (account) => parseFloat(account.currentBalance) > 0
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Credit Balances
          </h1>
          <p className="text-muted-foreground">
            Manage customer credit accounts and payments
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-total-accounts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-accounts">
              {accounts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {accountsWithBalance.length} with outstanding balance
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-outstanding">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-total-outstanding">
              ₹{totalOutstanding.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending credit payments
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-balance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Balance</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-balance">
              ₹{accountsWithBalance.length > 0 ? (totalOutstanding / accountsWithBalance.length).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per customer with balance
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Credit Accounts</CardTitle>
          <CardDescription>
            View and manage all customer credit accounts
          </CardDescription>
          <div className="mt-4">
            <Input
              placeholder="Search by name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
              data-testid="input-search"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading credit accounts...</p>
          ) : filteredAccounts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No accounts match your search" : "No credit accounts found"}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredAccounts.map((account) => {
                const isExpanded = expandedAccounts.has(account.id);
                const hasBalance = parseFloat(account.currentBalance) > 0;

                return (
                  <div
                    key={account.id}
                    className="border rounded-lg overflow-hidden"
                    data-testid={`account-card-${account.id}`}
                  >
                    <div
                      className="p-4 bg-card hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleAccountExpanded(account.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{account.customerName}</span>
                            {account.whatsappNumber && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {account.whatsappNumber}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Created {format(new Date(account.createdAt), "MMM d, yyyy")}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">Balance</div>
                            <div
                              className={`text-xl font-bold ${
                                hasBalance
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-green-600 dark:text-green-400"
                              }`}
                              data-testid={`text-balance-${account.id}`}
                            >
                              ₹{parseFloat(account.currentBalance).toFixed(2)}
                            </div>
                          </div>

                          {hasBalance && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRecordPayment(account);
                              }}
                              data-testid={`button-record-payment-${account.id}`}
                            >
                              <Wallet className="h-4 w-4 mr-2" />
                              Record Payment
                            </Button>
                          )}

                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t bg-muted/30 p-4 space-y-4">
                        {account.entries.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Receipt className="h-4 w-4" />
                              Credit Entries ({account.entries.length})
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Booking ID</TableHead>
                                  <TableHead>Issued</TableHead>
                                  <TableHead>Cash Paid</TableHead>
                                  <TableHead>Remaining</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {account.entries.map((entry) => (
                                  <TableRow key={entry.id}>
                                    <TableCell className="font-mono text-xs">
                                      {entry.bookingId.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>₹{parseFloat(entry.creditIssued).toFixed(2)}</TableCell>
                                    <TableCell>₹{parseFloat(entry.nonCreditPaid).toFixed(2)}</TableCell>
                                    <TableCell className="font-semibold">
                                      ₹{parseFloat(entry.remainingCredit).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={entry.status === "paid" ? "default" : "secondary"}
                                        className={entry.status === "paid" ? "bg-green-600" : ""}
                                      >
                                        {entry.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {format(new Date(entry.issuedAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                      {entry.status === "pending" && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => markAsPaidMutation.mutate(entry.id)}
                                          disabled={markAsPaidMutation.isPending}
                                          data-testid={`button-mark-paid-${entry.id}`}
                                        >
                                          <CreditCard className="h-4 w-4 mr-2" />
                                          Mark as Paid
                                        </Button>
                                      )}
                                      {entry.status === "paid" && (
                                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                          ✓ Completed
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {account.payments.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Wallet className="h-4 w-4" />
                              Payment History ({account.payments.length})
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Method</TableHead>
                                  <TableHead>Recorded By</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Notes</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {account.payments.map((payment) => (
                                  <TableRow key={payment.id}>
                                    <TableCell className="font-semibold">
                                      ₹{parseFloat(payment.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">
                                        {payment.paymentMethod === "cash" ? "Cash" : "UPI/Online"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{payment.recordedBy}</TableCell>
                                    <TableCell>
                                      {format(new Date(payment.recordedAt), "MMM d, yyyy h:mm a")}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {payment.notes || "-"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {account.entries.length === 0 && account.payments.length === 0 && (
                          <p className="text-center py-4 text-muted-foreground">
                            No transaction history
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent data-testid="dialog-record-payment">
          <DialogHeader>
            <DialogTitle>Record Credit Payment</DialogTitle>
            <DialogDescription>
              Record a payment received from {selectedAccount?.customerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Balance</span>
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  ₹{selectedAccount ? parseFloat(selectedAccount.currentBalance).toFixed(2) : "0.00"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min="0"
                max={selectedAccount ? parseFloat(selectedAccount.currentBalance) : 0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
                data-testid="input-payment-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: any) => setPaymentMethod(value)}
              >
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
              <Label htmlFor="paymentNotes">Notes (Optional)</Label>
              <Textarea
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any notes about this payment..."
                rows={3}
                data-testid="input-payment-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPaymentDialogOpen(false);
                setSelectedAccount(null);
                setPaymentAmount("");
                setPaymentNotes("");
              }}
              disabled={recordPaymentMutation.isPending}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayment}
              disabled={recordPaymentMutation.isPending}
              data-testid="button-confirm-payment"
            >
              {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
