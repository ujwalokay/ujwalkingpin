import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SeatCard } from "@/components/SeatCard";
import { BookingTable } from "@/components/BookingTable";
import { ExtendSessionDialog } from "@/components/ExtendSessionDialog";
import { EndSessionDialog } from "@/components/EndSessionDialog";
import { Filter } from "lucide-react";

//todo: remove mock functionality
const mockSeats = [
  { seatName: "PC-1", status: "running" as const, customerName: "John Doe", endTime: new Date(Date.now() + 25 * 60 * 1000) },
  { seatName: "PC-2", status: "available" as const },
  { seatName: "PC-3", status: "expired" as const, customerName: "Jane Smith", endTime: new Date(Date.now() - 5 * 60 * 1000) },
  { seatName: "PS5-1", status: "running" as const, customerName: "Mike Johnson", endTime: new Date(Date.now() + 90 * 60 * 1000) },
  { seatName: "PS5-2", status: "upcoming" as const, customerName: "Sarah Williams" },
  { seatName: "VR-1", status: "available" as const },
];

const mockWalkInBookings = [
  {
    id: "1",
    seatName: "PC-1",
    customerName: "John Doe",
    startTime: new Date(Date.now() - 35 * 60 * 1000),
    endTime: new Date(Date.now() + 25 * 60 * 1000),
    price: 70,
    status: "running" as const,
  },
  {
    id: "2",
    seatName: "PS5-1",
    customerName: "Mike Johnson",
    startTime: new Date(Date.now() - 30 * 60 * 1000),
    endTime: new Date(Date.now() + 90 * 60 * 1000),
    price: 130,
    status: "running" as const,
  },
];

const mockUpcomingBookings = [
  {
    id: "3",
    seatName: "PS5-2",
    customerName: "Sarah Williams",
    startTime: new Date(Date.now() + 30 * 60 * 1000),
    endTime: new Date(Date.now() + 150 * 60 * 1000),
    price: 130,
    status: "upcoming" as const,
  },
];

export default function Dashboard() {
  const [extendDialog, setExtendDialog] = useState({ open: false, seatName: "" });
  const [endDialog, setEndDialog] = useState({ open: false, seatName: "", customerName: "" });
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const handleExtend = (seatName: string) => {
    setExtendDialog({ open: true, seatName });
  };

  const handleEnd = (seatName: string, customerName = "") => {
    setEndDialog({ open: true, seatName, customerName });
  };

  const handleConfirmExtend = (duration: string, price: number) => {
    console.log(`Extended ${extendDialog.seatName} by ${duration} for ₹${price}`);
  };

  const handleConfirmEnd = () => {
    console.log(`Ended session for ${endDialog.seatName}`);
  };

  const filteredSeats = activeFilter === "all" 
    ? mockSeats 
    : mockSeats.filter(seat => seat.status === activeFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Seat Management</h1>
          <p className="text-muted-foreground">Monitor and manage all gaming seats</p>
        </div>
        <Button variant="outline" data-testid="button-filter">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "available", "running", "expired", "upcoming"].map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(filter)}
            data-testid={`button-filter-${filter}`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredSeats.map((seat) => (
          <SeatCard
            key={seat.seatName}
            {...seat}
            onExtend={() => handleExtend(seat.seatName)}
            onEnd={() => handleEnd(seat.seatName, seat.customerName)}
          />
        ))}
      </div>

      <Tabs defaultValue="walk-in" className="space-y-4">
        <TabsList data-testid="tabs-bookings">
          <TabsTrigger value="walk-in" data-testid="tab-walk-in">Walk-in List</TabsTrigger>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="walk-in" className="space-y-4">
          <BookingTable
            bookings={mockWalkInBookings}
            onExtend={(id) => handleExtend(`Booking ${id}`)}
            onEnd={(id) => handleEnd(`Booking ${id}`)}
          />
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <BookingTable bookings={mockUpcomingBookings} />
        </TabsContent>
      </Tabs>

      <ExtendSessionDialog
        open={extendDialog.open}
        onOpenChange={(open) => setExtendDialog({ ...extendDialog, open })}
        seatName={extendDialog.seatName}
        onConfirm={handleConfirmExtend}
      />

      <EndSessionDialog
        open={endDialog.open}
        onOpenChange={(open) => setEndDialog({ ...endDialog, open })}
        seatName={endDialog.seatName}
        customerName={endDialog.customerName}
        onConfirm={handleConfirmEnd}
      />
    </div>
  );
}
