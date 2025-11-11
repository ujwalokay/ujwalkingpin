import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { RevenueCard } from "@/components/RevenueCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, IndianRupee, Users, Clock, Search, Eye, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAdjustedTime } from "@/hooks/useServerTime";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColumnVisibilityToggle } from "@/components/ColumnVisibilityToggle";
import RetentionCharts from "@/components/RetentionCharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BookingStats {
  totalRevenue: number;
  totalFoodRevenue: number;
  totalSessions: number;
  avgSessionMinutes: number;
  cashRevenue: number;
  upiRevenue: number;
  creditRevenue?: number;
  creditIssued?: number;
  creditRecovered?: number;
  creditOutstanding?: number;
}

interface BookingHistoryItem {
  id: string;
  date: string;
  seatName: string;
  customerName: string;
  duration: string;
  price: string;
  foodAmount: number;
  totalAmount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  cashAmount: string | null;
  upiAmount: string | null;
  discount?: string | null;
  bonus?: string | null;
  discountApplied?: string | null;
  bonusHoursApplied?: string | null;
}

interface GroupedBookingSession {
  id: string;
  date: string;
  customerName: string;
  seats: string[];
  duration: string;
  sessionPrice: number;
  foodAmount: number;
  cashAmount: number;
  upiAmount: number;
  totalAmount: number;
  bookingIds: string[];
  discount?: string;
  bonus?: string;
  discountApplied?: string;
  bonusHoursApplied?: string;
  paymentStatus: string;
}

export default function Reports() {
  const [mainTab, setMainTab] = useState<string>("reports");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("daily");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewSeatsDialog, setViewSeatsDialog] = useState<{ open: boolean; seats: string[] }>({ open: false, seats: [] });
  const [viewBonusDialog, setViewBonusDialog] = useState<{ open: boolean; bonusHours: string }>({ open: false, bonusHours: '' });
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const { toast } = useToast();

  const reportColumns = useMemo(() => [
    { id: "date", label: "Date", defaultVisible: true },
    { id: "seats", label: "Seats", defaultVisible: true },
    { id: "customer", label: "Customer", defaultVisible: true },
    { id: "duration", label: "Duration", defaultVisible: true },
    { id: "sessionPrice", label: "Session Price", defaultVisible: true },
    { id: "foodAmount", label: "Food Amount", defaultVisible: true },
    { id: "discount", label: "Discount", defaultVisible: true },
    { id: "bonus", label: "Bonus", defaultVisible: true },
    { id: "paymentStatus", label: "Payment Status", defaultVisible: true },
    { id: "cash", label: "Cash", defaultVisible: true },
    { id: "upi", label: "UPI", defaultVisible: true },
    { id: "total", label: "Total", defaultVisible: true },
  ], []);

  const handleVisibilityChange = useCallback((columns: string[]) => {
    setVisibleColumns(columns);
  }, []);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("period", selectedPeriod);
    
    if (selectedPeriod === "weekly" && startDate && endDate) {
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    } else if (selectedPeriod === "monthly" && selectedMonth) {
      const date = new Date(selectedMonth);
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      params.append("startDate", firstDay.toISOString().split('T')[0]);
      params.append("endDate", lastDay.toISOString().split('T')[0]);
    }
    
    return params.toString();
  };

  const { data: stats, isLoading: statsLoading } = useQuery<BookingStats>({
    queryKey: ["/api/reports/stats", selectedPeriod, startDate, endDate, selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/reports/stats?${buildQueryParams()}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: history, isLoading: historyLoading } = useQuery<BookingHistoryItem[]>({
    queryKey: ["/api/reports/history", selectedPeriod, startDate, endDate, selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/reports/history?${buildQueryParams()}`);
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
  });

  const groupedSessions = useMemo(() => {
    if (!history) return [];
    
    const sessionMap = new Map<string, GroupedBookingSession>();
    
    history.forEach((record, index) => {
      const recordDateTime = new Date(record.date);
      let foundSession = false;
      
      for (const [key, session] of Array.from(sessionMap.entries())) {
        const sessionDateTime = new Date(session.date);
        const timeDifferenceMs = Math.abs(recordDateTime.getTime() - sessionDateTime.getTime());
        const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);
        
        if (
          session.customerName === record.customerName &&
          session.duration === record.duration &&
          timeDifferenceMinutes < 5
        ) {
          session.seats.push(record.seatName);
          session.bookingIds.push(record.id);
          session.sessionPrice += parseFloat(record.price);
          session.foodAmount += record.foodAmount || 0;
          session.totalAmount += record.totalAmount || parseFloat(record.price);
          
          if (record.cashAmount) {
            session.cashAmount += parseFloat(record.cashAmount);
          } else if (record.paymentMethod === 'cash') {
            session.cashAmount += record.totalAmount || parseFloat(record.price);
          }
          
          if (record.upiAmount) {
            session.upiAmount += parseFloat(record.upiAmount);
          } else if (record.paymentMethod === 'upi_online') {
            session.upiAmount += record.totalAmount || parseFloat(record.price);
          }
          
          if (record.discountApplied) {
            session.discountApplied = session.discountApplied 
              ? `${session.discountApplied}, ${record.discountApplied}`
              : record.discountApplied;
          }
          if (record.bonusHoursApplied) {
            session.bonusHoursApplied = session.bonusHoursApplied 
              ? `${session.bonusHoursApplied}, ${record.bonusHoursApplied}`
              : record.bonusHoursApplied;
          }
          
          const currentStatus = session.paymentStatus || 'unpaid';
          const recordStatus = record.paymentStatus || 'unpaid';
          if (currentStatus !== recordStatus) {
            session.paymentStatus = "Mixed";
          }
          
          foundSession = true;
          break;
        }
      }
      
      if (!foundSession) {
        const sessionKey = `${record.customerName}-${record.date}-${record.duration}-${index}`;
        sessionMap.set(sessionKey, {
          id: record.id,
          date: record.date,
          customerName: record.customerName,
          seats: [record.seatName],
          duration: record.duration,
          sessionPrice: parseFloat(record.price),
          foodAmount: record.foodAmount || 0,
          cashAmount: record.cashAmount 
            ? parseFloat(record.cashAmount)
            : record.paymentMethod === 'cash' 
              ? (record.totalAmount || parseFloat(record.price))
              : 0,
          upiAmount: record.upiAmount 
            ? parseFloat(record.upiAmount)
            : record.paymentMethod === 'upi_online' 
              ? (record.totalAmount || parseFloat(record.price))
              : 0,
          totalAmount: record.totalAmount || parseFloat(record.price),
          bookingIds: [record.id],
          discount: record.discount || undefined,
          bonus: record.bonus || undefined,
          discountApplied: record.discountApplied || undefined,
          bonusHoursApplied: record.bonusHoursApplied || undefined,
          paymentStatus: record.paymentStatus || 'unpaid',
        });
      }
    });
    
    return Array.from(sessionMap.values());
  }, [history]);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return groupedSessions;

    const query = searchQuery.toLowerCase();
    return groupedSessions.filter(session => 
      session.seats.some(seat => seat.toLowerCase().includes(query)) ||
      session.customerName.toLowerCase().includes(query) ||
      session.date.toLowerCase().includes(query) ||
      session.duration.toLowerCase().includes(query)
    );
  }, [groupedSessions, searchQuery]);

  const handleExportExcel = () => {
    if (!filteredSessions || filteredSessions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no bookings for the selected period.",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = ["Date", "Seats", "Customer", "Duration", "Session Price (₹)", "Food Amount (₹)", "Cash (₹)", "UPI (₹)", "Total (₹)"];
      const csvContent = [
        headers.join(","),
        ...filteredSessions.map(session => {
          return [
            session.date,
            session.seats.join(' + '),
            session.customerName,
            session.duration,
            session.sessionPrice.toFixed(0),
            session.foodAmount.toFixed(0),
            session.cashAmount.toFixed(0),
            session.upiAmount.toFixed(0),
            session.totalAmount.toFixed(0)
          ].join(",");
        })
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `booking_report_${selectedPeriod}_${getAdjustedTime().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: "CSV file has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export CSV file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "daily": return "Today's";
      case "weekly": return "This Week's";
      case "monthly": return "This Month's";
      default: return "Today's";
    }
  };

  const handleExportPDF = () => {
    if (!filteredSessions || filteredSessions.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no bookings for the selected period.",
        variant: "destructive",
      });
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site to export PDF.",
          variant: "destructive",
        });
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Booking Report - ${getPeriodLabel()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat-card { flex: 1; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .stat-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
            .stat-card .value { font-size: 24px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .badge { display: inline-block; padding: 4px 8px; background: #f0f0f0; border-radius: 4px; margin: 2px; font-size: 11px; }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <h1>Booking Report - ${getPeriodLabel()}</h1>
          <div class="stats">
            <div class="stat-card">
              <h3>${getPeriodLabel()} Revenue</h3>
              <div class="value">₹${stats?.totalRevenue.toLocaleString() || 0}</div>
            </div>
            <div class="stat-card">
              <h3>Total Sessions</h3>
              <div class="value">${stats?.totalSessions || 0}</div>
            </div>
            <div class="stat-card">
              <h3>Avg Session Time</h3>
              <div class="value">${stats?.avgSessionMinutes || 0} mins</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Seats</th>
                <th>Customer</th>
                <th>Duration</th>
                <th class="text-right">Session Price</th>
                <th class="text-right">Food Amount</th>
                <th class="text-right">Cash</th>
                <th class="text-right">UPI</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSessions.map(session => {
                const seatsDisplay = session.seats.map(s => `<span class="badge">${s}</span>`).join(' ');
                return `
                  <tr>
                    <td>${session.date}</td>
                    <td>${seatsDisplay}</td>
                    <td>${session.customerName}</td>
                    <td>${session.duration}</td>
                    <td class="text-right">₹${session.sessionPrice.toFixed(0)}</td>
                    <td class="text-right">₹${session.foodAmount.toFixed(0)}</td>
                    <td class="text-right">${session.cashAmount > 0 ? '₹' + session.cashAmount.toFixed(0) : '-'}</td>
                    <td class="text-right">${session.upiAmount > 0 ? '₹' + session.upiAmount.toFixed(0) : '-'}</td>
                    <td class="text-right"><strong>₹${session.totalAmount.toFixed(0)}</strong></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
            window.onafterprint = () => {
              window.close();
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.print();
      };
      
      toast({
        title: "Print dialog opened",
        description: "Use the print dialog to save as PDF.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to open print dialog. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track revenue, bookings and customer retention</p>
        </div>
      </div>

      <Tabs defaultValue="reports" value={mainTab} onValueChange={setMainTab}>
        <TabsList data-testid="tabs-main" className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="reports" data-testid="tab-reports">
            <Calendar className="h-4 w-4 mr-2" />
            Revenue Reports
          </TabsTrigger>
          <TabsTrigger value="retention" data-testid="tab-retention">
            <TrendingUp className="h-4 w-4 mr-2" />
            Customer Retention
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel} data-testid="button-export-excel" size="sm" className="flex-1 sm:flex-none">
              <Download className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export </span>Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-pdf" size="sm" className="flex-1 sm:flex-none">
              <Download className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export </span>PDF
            </Button>
          </div>

          <Tabs defaultValue="daily" value={selectedPeriod} onValueChange={(value) => {
        setSelectedPeriod(value);
        setStartDate("");
        setEndDate("");
        setSelectedMonth("");
      }}>
        <TabsList data-testid="tabs-period" className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
        </TabsList>

        {selectedPeriod === "weekly" && (
          <div className="glass-card p-4 rounded-lg mt-4">
            <Label className="text-sm font-semibold mb-3 block">Select Date Range</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="start-date" className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                  data-testid="input-start-date"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="end-date" className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                  data-testid="input-end-date"
                />
              </div>
              {startDate && endDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="self-end"
                  data-testid="button-clear-date-range"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {selectedPeriod === "monthly" && (
          <div className="glass-card p-4 rounded-lg mt-4">
            <Label htmlFor="month-select" className="text-sm font-semibold mb-2 block">
              <Calendar className="inline-block mr-2 h-4 w-4" />
              Select Month & Year
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  id="month-select"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full"
                  placeholder="Choose a month"
                  data-testid="input-select-month"
                />
              </div>
              {selectedMonth && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth("")}
                  className="self-start sm:self-center"
                  data-testid="button-clear-month"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        <TabsContent value={selectedPeriod} className="space-y-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {statsLoading ? (
              <>
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </>
            ) : (
              <>
                <RevenueCard
                  title={`${getPeriodLabel()} Session Revenue`}
                  amount={stats?.totalRevenue || 0}
                  trend={0}
                  icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />}
                />
                <RevenueCard
                  title={`${getPeriodLabel()} Food Revenue`}
                  amount={stats?.totalFoodRevenue || 0}
                  trend={0}
                  icon={<IndianRupee className="h-4 w-4 text-muted-foreground" />}
                />
                <RevenueCard
                  title="Total Sessions"
                  amount={stats?.totalSessions || 0}
                  trend={0}
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                  showCurrency={false}
                />
                <RevenueCard
                  title="Avg Session Time"
                  amount={stats?.avgSessionMinutes || 0}
                  trend={0}
                  icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                  showCurrency={false}
                  suffix=" mins"
                />
              </>
            )}
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {statsLoading ? (
              <>
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </>
            ) : (
              <>
                <RevenueCard
                  title="Cash Revenue"
                  amount={stats?.cashRevenue || 0}
                  trend={0}
                  icon={<IndianRupee className="h-4 w-4 text-green-600 dark:text-green-400" />}
                />
                <RevenueCard
                  title="UPI/Online Revenue"
                  amount={stats?.upiRevenue || 0}
                  trend={0}
                  icon={<IndianRupee className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                />
              </>
            )}
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {statsLoading ? (
              <>
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </>
            ) : (stats && (stats.creditIssued || stats.creditRecovered || stats.creditOutstanding)) ? (
              <>
                <RevenueCard
                  title="Credit Issued"
                  amount={stats?.creditIssued || 0}
                  trend={0}
                  icon={<IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                />
                <RevenueCard
                  title="Credit Recovered"
                  amount={stats?.creditRecovered || 0}
                  trend={0}
                  icon={<IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                />
                <RevenueCard
                  title="Credit Outstanding"
                  amount={stats?.creditOutstanding || 0}
                  trend={0}
                  icon={<IndianRupee className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                />
              </>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">Booking History</h2>
          <div className="flex gap-2 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by seat, customer, date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-bookings"
              />
            </div>
            <ColumnVisibilityToggle
              columns={reportColumns}
              storageKey="reports-visible-columns"
              onVisibilityChange={handleVisibilityChange}
            />
          </div>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.includes("date") && <TableHead>Date</TableHead>}
                {visibleColumns.includes("seats") && <TableHead>Seats</TableHead>}
                {visibleColumns.includes("customer") && <TableHead>Customer</TableHead>}
                {visibleColumns.includes("duration") && <TableHead>Duration</TableHead>}
                {visibleColumns.includes("sessionPrice") && <TableHead className="text-right">Session Price</TableHead>}
                {visibleColumns.includes("foodAmount") && <TableHead className="text-right">Food Amount</TableHead>}
                {visibleColumns.includes("discount") && <TableHead className="text-right">Discount</TableHead>}
                {visibleColumns.includes("bonus") && <TableHead className="text-right">Bonus</TableHead>}
                {visibleColumns.includes("paymentStatus") && <TableHead>Payment Status</TableHead>}
                {visibleColumns.includes("cash") && <TableHead className="text-right">Cash</TableHead>}
                {visibleColumns.includes("upi") && <TableHead className="text-right">UPI</TableHead>}
                {visibleColumns.includes("total") && <TableHead className="text-right">Total</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : filteredSessions && filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <TableRow key={session.id} data-testid={`row-history-${session.id}`}>
                    {visibleColumns.includes("date") && (
                      <TableCell data-testid={`text-date-${session.id}`}>{session.date}</TableCell>
                    )}
                    {visibleColumns.includes("seats") && (
                      <TableCell className="font-medium" data-testid={`text-seats-${session.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewSeatsDialog({ open: true, seats: session.seats })}
                          data-testid={`button-view-seats-${session.id}`}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Seat
                        </Button>
                      </TableCell>
                    )}
                    {visibleColumns.includes("customer") && (
                      <TableCell data-testid={`text-customer-${session.id}`}>{session.customerName}</TableCell>
                    )}
                    {visibleColumns.includes("duration") && (
                      <TableCell data-testid={`text-duration-${session.id}`}>{session.duration}</TableCell>
                    )}
                    {visibleColumns.includes("sessionPrice") && (
                      <TableCell className="text-right" data-testid={`text-session-price-${session.id}`}>
                        ₹{session.sessionPrice.toFixed(0)}
                      </TableCell>
                    )}
                    {visibleColumns.includes("foodAmount") && (
                      <TableCell className="text-right" data-testid={`text-food-amount-${session.id}`}>
                        ₹{session.foodAmount.toFixed(0)}
                      </TableCell>
                    )}
                    {visibleColumns.includes("discount") && (
                      <TableCell className="text-right" data-testid={`text-discount-${session.id}`}>
                        {session.discountApplied || '-'}
                      </TableCell>
                    )}
                    {visibleColumns.includes("bonus") && (
                      <TableCell className="text-right" data-testid={`text-bonus-${session.id}`}>
                        {session.bonusHoursApplied ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewBonusDialog({ open: true, bonusHours: session.bonusHoursApplied! })}
                            data-testid={`button-view-bonus-${session.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Hours
                          </Button>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("paymentStatus") && (
                      <TableCell data-testid={`text-payment-status-${session.id}`}>
                        {session.paymentStatus ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            session.paymentStatus === 'paid' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                              : session.paymentStatus === 'unpaid'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : session.paymentStatus === 'partial'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                          }`}>
                            {session.paymentStatus.charAt(0).toUpperCase() + session.paymentStatus.slice(1)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("cash") && (
                      <TableCell className="text-right" data-testid={`text-cash-${session.id}`}>
                        {session.cashAmount > 0 ? (
                          <span className="text-green-600 dark:text-green-400">₹{session.cashAmount.toFixed(0)}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("upi") && (
                      <TableCell className="text-right" data-testid={`text-upi-${session.id}`}>
                        {session.upiAmount > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400">₹{session.upiAmount.toFixed(0)}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("total") && (
                      <TableCell className="text-right font-bold text-green-600 dark:text-green-400" data-testid={`text-total-${session.id}`}>
                        ₹{session.totalAmount.toFixed(0)}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="text-center text-muted-foreground">
                    {searchQuery.trim() ? 'No bookings found matching your search' : 'No booking history for this period'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={viewSeatsDialog.open} onOpenChange={(open) => setViewSeatsDialog({ open, seats: [] })}>
        <DialogContent data-testid="dialog-view-seats">
          <DialogHeader>
            <DialogTitle>Seat Information</DialogTitle>
            <DialogDescription>
              View the PC/seat details for this booking session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {viewSeatsDialog.seats.map((seat, idx) => (
                <div 
                  key={idx}
                  className="px-4 py-2 bg-primary/10 text-primary rounded-md font-semibold"
                  data-testid={`seat-badge-${idx}`}
                >
                  {seat}
                </div>
              ))}
            </div>
            {viewSeatsDialog.seats.length > 1 && (
              <p className="text-sm text-muted-foreground">
                Total Seats: {viewSeatsDialog.seats.length}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewBonusDialog.open} onOpenChange={(open) => setViewBonusDialog({ open, bonusHours: '' })}>
        <DialogContent data-testid="dialog-view-bonus">
          <DialogHeader>
            <DialogTitle>Bonus Free Hours</DialogTitle>
            <DialogDescription>
              Free hours given for this booking session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="px-6 py-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-semibold text-lg">
                {viewBonusDialog.bonusHours}
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              This session received free bonus hours
            </p>
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="retention" className="mt-4">
          <RetentionCharts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
