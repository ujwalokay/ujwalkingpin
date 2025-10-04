import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RevenueCard } from "@/components/RevenueCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download, DollarSign, Users, Clock } from "lucide-react";
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
}

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("daily");

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
    console.log("Exporting to Excel...");
  };

  const handleExportPDF = () => {
    console.log("Exporting to PDF...");
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "daily": return "Today's";
      case "weekly": return "This Week's";
      case "monthly": return "This Month's";
      default: return "Today's";
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
          <div className="grid gap-4 md:grid-cols-3">
            {statsLoading ? (
              <>
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </>
            ) : (
              <>
                <RevenueCard
                  title={`${getPeriodLabel()} Revenue`}
                  amount={stats?.totalRevenue || 0}
                  trend={0}
                  icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                />
                <RevenueCard
                  title="Total Sessions"
                  amount={stats?.totalSessions || 0}
                  trend={0}
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
                <RevenueCard
                  title="Avg Session Time"
                  amount={stats?.avgSessionMinutes || 0}
                  trend={0}
                  icon={<Clock className="h-4 w-4 text-muted-foreground" />}
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
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
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
                    <TableCell className="text-right font-bold text-primary" data-testid={`text-revenue-${record.id}`}>
                      ₹{record.price}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
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
