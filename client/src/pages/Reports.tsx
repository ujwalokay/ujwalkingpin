import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RevenueCard } from "@/components/RevenueCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, DollarSign, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface BookingStats {
  totalRevenue: number;
  totalFoodRevenue: number;
  totalSessions: number;
  avgSessionMinutes: number;
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
}

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("daily");
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useQuery<BookingStats>({
    queryKey: ["/api/reports/stats", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/stats?period=${selectedPeriod}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: history, isLoading: historyLoading } = useQuery<BookingHistoryItem[]>({
    queryKey: ["/api/reports/history", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/history?period=${selectedPeriod}`);
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
  });

  const handleExportExcel = () => {
    if (!history || history.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no bookings for the selected period.",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = ["Date", "Seat", "Customer", "Duration", "Session Price (₹)", "Food Amount (₹)", "Total (₹)"];
      const csvContent = [
        headers.join(","),
        ...history.map(record => [
          record.date,
          record.seatName,
          record.customerName,
          record.duration,
          record.price,
          (record.foodAmount || 0).toFixed(0),
          (record.totalAmount || parseFloat(record.price)).toFixed(0)
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `booking_report_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
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
    if (!history || history.length === 0) {
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
                <th>Seat</th>
                <th>Customer</th>
                <th>Duration</th>
                <th class="text-right">Session Price</th>
                <th class="text-right">Food Amount</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${history.map(record => `
                <tr>
                  <td>${record.date}</td>
                  <td>${record.seatName}</td>
                  <td>${record.customerName}</td>
                  <td>${record.duration}</td>
                  <td class="text-right">₹${record.price}</td>
                  <td class="text-right">₹${(record.foodAmount || 0).toFixed(0)}</td>
                  <td class="text-right"><strong>₹${(record.totalAmount || parseFloat(record.price)).toFixed(0)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 100);
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Track revenue and booking history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel} data-testid="button-export-excel">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-pdf">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="daily" value={selectedPeriod} onValueChange={setSelectedPeriod}>
        <TabsList data-testid="tabs-period">
          <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                />
                <RevenueCard
                  title={`${getPeriodLabel()} Food Revenue`}
                  amount={stats?.totalFoodRevenue || 0}
                  trend={0}
                  icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
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
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Booking History</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Session Price</TableHead>
                <TableHead className="text-right">Food Amount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : history && history.length > 0 ? (
                history.map((record) => (
                  <TableRow key={record.id} data-testid={`row-history-${record.id}`}>
                    <TableCell data-testid={`text-date-${record.id}`}>{record.date}</TableCell>
                    <TableCell className="font-medium" data-testid={`text-seat-${record.id}`}>
                      {record.seatName}
                    </TableCell>
                    <TableCell data-testid={`text-customer-${record.id}`}>{record.customerName}</TableCell>
                    <TableCell data-testid={`text-duration-${record.id}`}>{record.duration}</TableCell>
                    <TableCell className="text-right" data-testid={`text-session-price-${record.id}`}>
                      ₹{record.price}
                    </TableCell>
                    <TableCell className="text-right" data-testid={`text-food-amount-${record.id}`}>
                      ₹{(record.foodAmount || 0).toFixed(0)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600 dark:text-green-400" data-testid={`text-total-${record.id}`}>
                      ₹{(record.totalAmount || parseFloat(record.price)).toFixed(0)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No booking history for this period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
