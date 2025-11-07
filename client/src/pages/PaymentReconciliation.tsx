import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Wallet, Clock, TrendingUp, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type PaymentLog = {
  id: string;
  bookingId: string;
  seatName: string;
  customerName: string;
  amount: string;
  paymentMethod: string;
  paymentStatus: string;
  userId: string;
  username: string;
  previousStatus: string | null;
  previousMethod: string | null;
  createdAt: Date;
};

export default function PaymentReconciliation() {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState("");
  const { isStaff } = useAuth();

  const { data: logs = [], isLoading } = useQuery<PaymentLog[]>({
    queryKey: ['/api/payment-logs', { date: selectedDate }],
  });

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    
    const query = searchQuery.toLowerCase();
    return logs.filter(log => 
      log.seatName.toLowerCase().includes(query) ||
      log.customerName.toLowerCase().includes(query) ||
      log.paymentMethod.toLowerCase().includes(query) ||
      log.paymentStatus.toLowerCase().includes(query) ||
      log.username.toLowerCase().includes(query) ||
      log.amount.includes(query)
    );
  }, [logs, searchQuery]);

  const totalAmount = filteredLogs.reduce((sum, log) => sum + parseFloat(log.amount || '0'), 0);
  const cashTotal = filteredLogs
    .filter(log => log.paymentMethod === 'cash')
    .reduce((sum, log) => sum + parseFloat(log.amount || '0'), 0);
  const upiTotal = filteredLogs
    .filter(log => log.paymentMethod === 'upi_online')
    .reduce((sum, log) => sum + parseFloat(log.amount || '0'), 0);
  const creditTotal = filteredLogs
    .filter(log => log.paymentMethod === 'credit')
    .reduce((sum, log) => sum + parseFloat(log.amount || '0'), 0);

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">Cash</Badge>;
      case 'upi_online':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">UPI/Online</Badge>;
      case 'credit':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400">Credit</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Pending</Badge>;
      case 'unpaid':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400">Unpaid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payment Reconciliation</h1>
        <p className="text-muted-foreground">Review all payment actions and transactions</p>
      </div>

      <div className={`grid gap-4 ${isStaff ? 'md:grid-cols-1' : 'md:grid-cols-4'}`}>
        {!isStaff && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{filteredLogs.length} transactions</p>
            </CardContent>
          </Card>
        )}

        {!isStaff && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash</CardTitle>
              <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{cashTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {filteredLogs.filter(l => l.paymentMethod === 'cash').length} payments
              </p>
            </CardContent>
          </Card>
        )}

        {!isStaff && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">UPI/Online</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{upiTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {filteredLogs.filter(l => l.paymentMethod === 'upi_online').length} payments
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit</CardTitle>
            <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{creditTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredLogs.filter(l => l.paymentMethod === 'credit').length} on credit
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Logs</CardTitle>
          <CardDescription>Filter by date and search transactions</CardDescription>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
                data-testid="input-date-filter"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by seat, customer, method, status, amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                data-testid="input-search-logs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading payment logs...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchQuery ? "No payment logs match your search" : "No payment logs found for this date"}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-3 p-4 border rounded-lg bg-card"
                  data-testid={`log-item-${log.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{log.seatName}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{log.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodBadge(log.paymentMethod)}
                      {getStatusBadge(log.paymentStatus)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{log.username}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(log.createdAt), 'h:mm a')}</span>
                      </div>
                      {log.previousStatus && (
                        <span className="text-xs">
                          Changed from: {log.previousStatus} 
                          {log.previousMethod && ` (${log.previousMethod})`}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-lg">₹{parseFloat(log.amount).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
