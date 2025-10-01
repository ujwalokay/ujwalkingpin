import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/CategoryCard";
import { BookingTable } from "@/components/BookingTable";
import { AddBookingDialog } from "@/components/AddBookingDialog";
import { ExtendSessionDialog } from "@/components/ExtendSessionDialog";
import { EndSessionDialog } from "@/components/EndSessionDialog";
import { Plus, Monitor, Gamepad2, Glasses, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type BookingStatus = "available" | "running" | "expired" | "upcoming";

interface Booking {
  id: string;
  category: string;
  seatNumber: number;
  seatName: string;
  customerName: string;
  startTime: Date;
  endTime: Date;
  price: number;
  status: BookingStatus;
  bookingType: "walk-in" | "upcoming";
}

const categories = [
  { name: "PC", total: 10, icon: Monitor, color: "text-chart-1" },
  { name: "PS5", total: 5, icon: Gamepad2, color: "text-chart-5" },
  { name: "VR", total: 3, icon: Glasses, color: "text-chart-2" },
  { name: "Car", total: 2, icon: Car, color: "text-chart-3" },
];

export default function Dashboard() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [addDialog, setAddDialog] = useState(false);
  const [extendDialog, setExtendDialog] = useState({ open: false, bookingId: "" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, bookingId: "", seatName: "", customerName: "" });

  const getOccupiedSeats = (category: string) => {
    return bookings
      .filter(b => b.category === category && b.status === "running")
      .map(b => b.seatNumber);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setBookings(prevBookings => 
        prevBookings.map(booking => {
          if (booking.status === "running" && booking.endTime < now) {
            return { ...booking, status: "expired" as BookingStatus };
          }
          if (booking.status === "upcoming" && booking.startTime <= now) {
            return { ...booking, status: "running" as BookingStatus };
          }
          return booking;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getAvailableSeats = (category: string) => {
    const cat = categories.find(c => c.name === category);
    if (!cat) return [];
    const occupied = getOccupiedSeats(category);
    return Array.from({ length: cat.total }, (_, i) => i + 1).filter(n => !occupied.includes(n));
  };

  const availableSeatsData = categories.map(cat => ({
    category: cat.name,
    seats: getAvailableSeats(cat.name),
  }));

  const handleAddBooking = (newBooking: {
    category: string;
    seatNumber: number;
    customerName: string;
    duration: string;
    price: number;
    bookingType: "walk-in" | "upcoming";
  }) => {
    const now = new Date();
    const durationMap: { [key: string]: number } = {
      "30 mins": 30,
      "1 hour": 60,
      "2 hours": 120,
    };
    const minutes = durationMap[newBooking.duration] || 60;
    
    const startTime = newBooking.bookingType === "walk-in" ? now : new Date(now.getTime() + 30 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + minutes * 60 * 1000);

    const booking: Booking = {
      id: Date.now().toString(),
      category: newBooking.category,
      seatNumber: newBooking.seatNumber,
      seatName: `${newBooking.category}-${newBooking.seatNumber}`,
      customerName: newBooking.customerName,
      startTime,
      endTime,
      price: newBooking.price,
      status: newBooking.bookingType === "walk-in" ? "running" : "upcoming",
      bookingType: newBooking.bookingType,
    };

    setBookings([...bookings, booking]);
    toast({
      title: "Booking Added",
      description: `${booking.seatName} booked for ${newBooking.customerName}`,
    });
  };

  const handleExtend = (bookingId: string) => {
    setExtendDialog({ open: true, bookingId });
  };

  const handleConfirmExtend = (duration: string, price: number) => {
    const booking = bookings.find(b => b.id === extendDialog.bookingId);
    if (booking) {
      const durationMap: { [key: string]: number } = {
        "30 mins": 30,
        "1 hour": 60,
        "2 hours": 120,
      };
      const minutes = durationMap[duration] || 60;
      
      setBookings(bookings.map(b => 
        b.id === extendDialog.bookingId 
          ? { ...b, endTime: new Date(b.endTime.getTime() + minutes * 60 * 1000), price: b.price + price }
          : b
      ));
      
      toast({
        title: "Session Extended",
        description: `${booking.seatName} extended by ${duration}`,
      });
    }
    setExtendDialog({ open: false, bookingId: "" });
  };

  const handleDelete = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setDeleteDialog({ 
        open: true, 
        bookingId, 
        seatName: booking.seatName, 
        customerName: booking.customerName 
      });
    }
  };

  const handleConfirmDelete = () => {
    setBookings(bookings.filter(b => b.id !== deleteDialog.bookingId));
    toast({
      title: "Booking Deleted",
      description: `${deleteDialog.seatName} booking removed`,
      variant: "destructive",
    });
    setDeleteDialog({ open: false, bookingId: "", seatName: "", customerName: "" });
  };

  const walkInBookings = bookings.filter(b => b.bookingType === "walk-in");
  const upcomingBookings = bookings.filter(b => b.bookingType === "upcoming");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Seat Management</h1>
          <p className="text-muted-foreground">Monitor and manage all gaming seats</p>
        </div>
        <Button onClick={() => setAddDialog(true)} data-testid="button-add-booking">
          <Plus className="mr-2 h-4 w-4" />
          Add Booking
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => {
          const available = getAvailableSeats(cat.name).length;
          return (
            <CategoryCard
              key={cat.name}
              title={cat.name}
              icon={cat.icon}
              available={available}
              total={cat.total}
              color={cat.color}
            />
          );
        })}
      </div>

      <Tabs defaultValue="walk-in" className="space-y-4">
        <TabsList data-testid="tabs-bookings">
          <TabsTrigger value="walk-in" data-testid="tab-walk-in">
            Walk-in List ({walkInBookings.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            Upcoming Bookings ({upcomingBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="walk-in" className="space-y-4">
          <BookingTable
            bookings={walkInBookings}
            onExtend={handleExtend}
            onEnd={handleDelete}
          />
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <BookingTable
            bookings={upcomingBookings}
            onEnd={handleDelete}
          />
        </TabsContent>
      </Tabs>

      <AddBookingDialog
        open={addDialog}
        onOpenChange={setAddDialog}
        onConfirm={handleAddBooking}
        availableSeats={availableSeatsData}
      />

      <ExtendSessionDialog
        open={extendDialog.open}
        onOpenChange={(open) => setExtendDialog({ ...extendDialog, open })}
        seatName={bookings.find(b => b.id === extendDialog.bookingId)?.seatName || ""}
        onConfirm={handleConfirmExtend}
      />

      <EndSessionDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        seatName={deleteDialog.seatName}
        customerName={deleteDialog.customerName}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
