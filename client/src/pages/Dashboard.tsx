import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CategoryCard } from "@/components/CategoryCard";
import { BookingTable } from "@/components/BookingTable";
import { AddBookingDialog } from "@/components/AddBookingDialog";
import { ExtendSessionDialog } from "@/components/ExtendSessionDialog";
import { EndSessionDialog } from "@/components/EndSessionDialog";
import { AddFoodToBookingDialog } from "@/components/AddFoodToBookingDialog";
import { Plus, Monitor, Gamepad2, Glasses, Car, Cpu, Tv, Radio, Box, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchBookings, createBooking, updateBooking, deleteBooking, fetchDeviceConfigs } from "@/lib/api";
import type { Booking as DBBooking, DeviceConfig } from "@shared/schema";

type BookingStatus = "available" | "running" | "expired" | "upcoming" | "completed" | "paused";

interface FoodOrder {
  foodId: string;
  foodName: string;
  price: string;
  quantity: number;
}

interface Booking {
  id: string;
  category: string;
  seatNumber: number;
  seatName: string;
  customerName: string;
  whatsappNumber?: string;
  startTime: Date;
  endTime: Date;
  price: number;
  status: BookingStatus;
  bookingType: "walk-in" | "upcoming";
  foodOrders?: FoodOrder[];
  pausedRemainingTime?: number | null;
}

const availableIcons = [Monitor, Gamepad2, Glasses, Car, Cpu, Tv, Radio, Box];
const availableColors = ["text-chart-1", "text-chart-2", "text-chart-3", "text-chart-4", "text-chart-5"];

const getIconForCategory = (category: string, index: number) => {
  const predefinedIcons: Record<string, any> = {
    "PC": Monitor,
    "PS5": Gamepad2,
    "VR": Glasses,
    "Car": Car,
    "Xbox": Gamepad2,
    "Nintendo": Gamepad2,
    "Switch": Gamepad2,
  };
  return predefinedIcons[category] || availableIcons[index % availableIcons.length];
};

const getColorForCategory = (index: number) => {
  return availableColors[index % availableColors.length];
};

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addDialog, setAddDialog] = useState(false);
  const [extendDialog, setExtendDialog] = useState({ open: false, bookingId: "" });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, bookingId: "", seatName: "", customerName: "" });
  const [foodDialog, setFoodDialog] = useState({ open: false, bookingId: "", seatName: "", customerName: "" });
  const [hideCompleted, setHideCompleted] = useState(false);

  const { data: dbBookings = [], isLoading } = useQuery({ 
    queryKey: ['bookings'], 
    queryFn: fetchBookings 
  });

  const { data: deviceConfigs = [] } = useQuery<DeviceConfig[]>({ 
    queryKey: ['device-configs'], 
    queryFn: fetchDeviceConfigs 
  });

  const categories = useMemo(() => {
    return deviceConfigs.map((config, index) => ({
      name: config.category,
      total: config.count,
      icon: getIconForCategory(config.category, index),
      color: getColorForCategory(index),
    }));
  }, [deviceConfigs]);

  const bookings: Booking[] = useMemo(() => {
    return dbBookings.map((dbBooking: DBBooking) => ({
      id: dbBooking.id,
      category: dbBooking.category,
      seatNumber: dbBooking.seatNumber,
      seatName: dbBooking.seatName,
      customerName: dbBooking.customerName,
      whatsappNumber: dbBooking.whatsappNumber || undefined,
      startTime: new Date(dbBooking.startTime),
      endTime: new Date(dbBooking.endTime),
      price: parseFloat(dbBooking.price),
      status: dbBooking.status as BookingStatus,
      bookingType: dbBooking.bookingType as "walk-in" | "upcoming",
      foodOrders: dbBooking.foodOrders || [],
      pausedRemainingTime: dbBooking.pausedRemainingTime,
    }));
  }, [dbBookings]);

  const getOccupiedSeats = (category: string) => {
    return bookings
      .filter(b => b.category === category && (b.status === "running" || b.status === "paused"))
      .map(b => b.seatNumber);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      const updatedBookings = bookings.map(booking => {
        if (booking.status === "running" && booking.endTime < now) {
          return { ...booking, status: "expired" as BookingStatus };
        }
        if (booking.status === "upcoming" && booking.startTime <= now) {
          return { ...booking, status: "running" as BookingStatus };
        }
        return booking;
      });

      for (let i = 0; i < bookings.length; i++) {
        if (bookings[i].status !== updatedBookings[i].status) {
          try {
            await updateBooking(bookings[i].id, { status: updatedBookings[i].status });
          } catch (error) {
            console.error("Failed to update booking status:", error);
          }
        }
      }

      if (updatedBookings.some((b, i) => b.status !== bookings[i].status)) {
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bookings, queryClient]);

  const getAvailableSeats = (category: string) => {
    const cat = categories.find(c => c.name === category);
    if (!cat) return [];
    
    const config = deviceConfigs.find(c => c.category === category);
    const occupied = getOccupiedSeats(category);
    
    if (!config || config.seats.length === 0) {
      return Array.from({ length: cat.total }, (_, i) => i + 1).filter(n => !occupied.includes(n));
    }
    
    const visibleSeats = config.seats.map(seatName => {
      const match = seatName.match(/\d+$/);
      return match ? parseInt(match[0]) : 0;
    }).filter(n => n > 0);
    
    return visibleSeats.filter(n => !occupied.includes(n));
  };

  const availableSeatsData = categories.map(cat => ({
    category: cat.name,
    seats: getAvailableSeats(cat.name),
  }));

  const addBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/available-seats'] });
    },
  });

  const handleAddBooking = async (newBooking: {
    category: string;
    seatNumbers: number[];
    customerName: string;
    whatsappNumber?: string;
    duration: string;
    price: string;
    bookingType: "walk-in" | "upcoming";
    bookingDate?: Date;
    timeSlot?: string;
  }) => {
    try {
      const now = new Date();
      const durationMap: { [key: string]: number } = {
        "30 mins": 30,
        "1 hour": 60,
        "2 hours": 120,
      };
      const minutes = durationMap[newBooking.duration] || 60;
      
      let startTime: Date;
      if (newBooking.bookingType === "walk-in") {
        startTime = now;
      } else {
        if (newBooking.bookingDate && newBooking.timeSlot) {
          const [startTime_str] = newBooking.timeSlot.split('-');
          const [startHour, startMin] = startTime_str.split(':').map(Number);
          startTime = new Date(newBooking.bookingDate);
          startTime.setHours(startHour, startMin, 0, 0);
        } else {
          startTime = new Date(now.getTime() + 30 * 60 * 1000);
        }
      }
      
      const endTime = new Date(startTime.getTime() + minutes * 60 * 1000);

      const seatNames: string[] = [];
      
      for (const seatNumber of newBooking.seatNumbers) {
        const seatName = `${newBooking.category}-${seatNumber}`;
        seatNames.push(seatName);
        
        await addBookingMutation.mutateAsync({
          category: newBooking.category,
          seatNumber,
          seatName,
          customerName: newBooking.customerName,
          whatsappNumber: newBooking.whatsappNumber,
          startTime: startTime.toISOString() as any,
          endTime: endTime.toISOString() as any,
          price: newBooking.price,
          status: newBooking.bookingType === "walk-in" ? "running" : "upcoming",
          bookingType: newBooking.bookingType,
          foodOrders: [],
        });
      }
      
      toast({
        title: "Booking Added",
        description: `${seatNames.join(", ")} booked for ${newBooking.customerName}`,
      });
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. The seat may already be booked for this time slot.",
        variant: "destructive",
      });
    }
  };

  const handleExtend = (bookingId: string) => {
    setExtendDialog({ open: true, bookingId });
  };

  const extendBookingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ endTime: Date; price: string }> }) =>
      updateBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const handleConfirmExtend = async (duration: string, price: string) => {
    const booking = bookings.find(b => b.id === extendDialog.bookingId);
    if (booking) {
      const durationMap: { [key: string]: number } = {
        "30 mins": 30,
        "1 hour": 60,
        "2 hours": 120,
      };
      const minutes = durationMap[duration] || 60;
      
      const newEndTime = new Date(booking.endTime.getTime() + minutes * 60 * 1000);
      const newPrice = (booking.price + price).toString();
      
      await extendBookingMutation.mutateAsync({
        id: extendDialog.bookingId,
        data: { endTime: newEndTime.toISOString() as any, price: newPrice },
      });
      
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

  const deleteBookingMutation = useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const handleConfirmDelete = async () => {
    await deleteBookingMutation.mutateAsync(deleteDialog.bookingId);
    toast({
      title: "Booking Deleted",
      description: `${deleteDialog.seatName} booking removed`,
      variant: "destructive",
    });
    setDeleteDialog({ open: false, bookingId: "", seatName: "", customerName: "" });
  };

  const completeBookingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateBooking(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const handleComplete = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      await completeBookingMutation.mutateAsync({
        id: bookingId,
        data: { status: "completed" },
      });
      toast({
        title: "Session Completed",
        description: `${booking.seatName} - ${booking.customerName} session marked as complete`,
      });
    }
  };

  const handleAddFood = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setFoodDialog({ 
        open: true, 
        bookingId, 
        seatName: booking.seatName, 
        customerName: booking.customerName 
      });
    }
  };

  const addFoodMutation = useMutation({
    mutationFn: ({ id, foodOrders, additionalCost }: { 
      id: string; 
      foodOrders: FoodOrder[];
      additionalCost: number;
    }) => {
      const booking = bookings.find(b => b.id === id);
      if (!booking) throw new Error("Booking not found");
      
      const existingFoodOrders = booking.foodOrders || [];
      const allFoodOrders = [...existingFoodOrders, ...foodOrders];
      const newPrice = (parseFloat(booking.price.toString()) + additionalCost).toFixed(2);
      
      return updateBooking(id, { 
        foodOrders: allFoodOrders as any,
        price: newPrice 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const handleConfirmAddFood = async (bookingId: string, foodOrders: FoodOrder[]) => {
    const additionalCost = foodOrders.reduce(
      (sum, order) => sum + parseFloat(order.price) * order.quantity,
      0
    );
    
    await addFoodMutation.mutateAsync({ id: bookingId, foodOrders, additionalCost });
    
    toast({
      title: "Food Added",
      description: `Food items added to ${foodDialog.seatName} - ₹${additionalCost.toFixed(0)}`,
    });
    
    setFoodDialog({ open: false, bookingId: "", seatName: "", customerName: "" });
  };

  const handleStopTimer = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const now = new Date();

    if (booking.status === "running") {
      const remainingTime = booking.endTime.getTime() - now.getTime();
      
      await completeBookingMutation.mutateAsync({
        id: bookingId,
        data: { 
          status: "paused",
          pausedRemainingTime: remainingTime
        },
      });
      toast({
        title: "Timer Paused",
        description: `${booking.seatName} - Session paused`,
      });
    } else if (booking.status === "paused") {
      const remainingTime = booking.pausedRemainingTime || 0;
      const newEndTime = new Date(now.getTime() + remainingTime);
      
      await completeBookingMutation.mutateAsync({
        id: bookingId,
        data: { 
          status: "running",
          endTime: newEndTime.toISOString() as any,
          pausedRemainingTime: null
        },
      });
      toast({
        title: "Timer Resumed",
        description: `${booking.seatName} - Session resumed`,
      });
    }
  };

  const handleDeleteFood = async (bookingId: string, foodIndex: number) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || !booking.foodOrders) return;
    
    const foodItem = booking.foodOrders[foodIndex];
    const foodItemCost = parseFloat(foodItem.price) * foodItem.quantity;
    
    const updatedFoodOrders = booking.foodOrders.filter((_, index) => index !== foodIndex);
    const newPrice = (booking.price - foodItemCost).toString();
    
    await completeBookingMutation.mutateAsync({
      id: bookingId,
      data: { 
        foodOrders: updatedFoodOrders as any,
        price: newPrice
      },
    });
    
    toast({
      title: "Food Item Removed",
      description: `${foodItem.foodName} removed from ${booking.seatName}`,
      variant: "destructive",
    });
  };

  const handleRefresh = async () => {
    try {
      const response = await fetch('/api/bookings/archive', {
        method: 'POST',
      });
      const data = await response.json();
      
      setHideCompleted(true);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/booking-history'] });
      
      toast({
        title: "List Refreshed",
        description: `${data.count} booking(s) moved to history`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive bookings",
        variant: "destructive",
      });
    }
  };

  const filteredBookings = useMemo(() => {
    if (hideCompleted) {
      return bookings.filter(b => b.status !== "completed" && b.status !== "expired");
    }
    return bookings;
  }, [bookings, hideCompleted]);

  const walkInBookings = filteredBookings.filter(b => b.bookingType === "walk-in");
  const upcomingBookings = filteredBookings.filter(b => b.bookingType === "upcoming");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Seat Management</h1>
            <p className="text-muted-foreground">Loading bookings...</p>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between gap-4">
          <TabsList data-testid="tabs-bookings">
            <TabsTrigger value="walk-in" data-testid="tab-walk-in">
              Walk-in List ({walkInBookings.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming Bookings ({upcomingBookings.length})
            </TabsTrigger>
          </TabsList>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            data-testid="button-refresh-list"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh List
          </Button>
        </div>

        <TabsContent value="walk-in" className="space-y-4">
          <BookingTable
            bookings={walkInBookings}
            onExtend={handleExtend}
            onEnd={handleDelete}
            onComplete={handleComplete}
            onAddFood={handleAddFood}
            onStopTimer={handleStopTimer}
            onDeleteFood={handleDeleteFood}
          />
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <BookingTable
            bookings={upcomingBookings}
            onEnd={handleDelete}
            onComplete={handleComplete}
            onAddFood={handleAddFood}
            onStopTimer={handleStopTimer}
            onDeleteFood={handleDeleteFood}
            showDateColumn={true}
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

      <AddFoodToBookingDialog
        open={foodDialog.open}
        onOpenChange={(open) => setFoodDialog({ ...foodDialog, open })}
        bookingId={foodDialog.bookingId}
        seatName={foodDialog.seatName}
        customerName={foodDialog.customerName}
        onConfirm={handleConfirmAddFood}
      />
    </div>
  );
}
