import { useState } from "react";
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

//todo: remove mock functionality
const mockHistory = [
  { id: "1", date: "2025-10-01", seat: "PC-1", customer: "John Doe", duration: "2 hours", revenue: 130 },
  { id: "2", date: "2025-10-01", seat: "PS5-1", customer: "Mike Johnson", duration: "1 hour", revenue: 100 },
  { id: "3", date: "2025-10-01", seat: "VR-1", customer: "Sarah Williams", duration: "30 mins", revenue: 80 },
  { id: "4", date: "2025-09-30", seat: "PC-3", customer: "Jane Smith", duration: "1 hour", revenue: 70 },
  { id: "5", date: "2025-09-30", seat: "Car-1", customer: "Tom Brown", duration: "2 hours", revenue: 200 },
];

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("daily");

  const handleExportExcel = () => {
    console.log("Exporting to Excel...");
  };

  const handleExportPDF = () => {
    console.log("Exporting to PDF...");
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

        <TabsContent value="daily" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <RevenueCard
              title="Today's Revenue"
              amount={5480}
              trend={12.5}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
            <RevenueCard
              title="Total Sessions"
              amount={24}
              trend={8.3}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <RevenueCard
              title="Avg Session Time"
              amount={95}
              trend={-3.2}
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <RevenueCard
              title="This Week's Revenue"
              amount={32450}
              trend={15.8}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
            <RevenueCard
              title="Total Sessions"
              amount={168}
              trend={10.2}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <RevenueCard
              title="Avg Session Time"
              amount={102}
              trend={5.1}
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <RevenueCard
              title="This Month's Revenue"
              amount={128900}
              trend={22.4}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
            <RevenueCard
              title="Total Sessions"
              amount={672}
              trend={18.7}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <RevenueCard
              title="Avg Session Time"
              amount={98}
              trend={2.3}
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
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
              {mockHistory.map((record) => (
                <TableRow key={record.id} data-testid={`row-history-${record.id}`}>
                  <TableCell data-testid={`text-date-${record.id}`}>{record.date}</TableCell>
                  <TableCell className="font-medium" data-testid={`text-seat-${record.id}`}>
                    {record.seat}
                  </TableCell>
                  <TableCell data-testid={`text-customer-${record.id}`}>{record.customer}</TableCell>
                  <TableCell data-testid={`text-duration-${record.id}`}>{record.duration}</TableCell>
                  <TableCell className="text-right font-bold text-primary" data-testid={`text-revenue-${record.id}`}>
                    ₹{record.revenue}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
