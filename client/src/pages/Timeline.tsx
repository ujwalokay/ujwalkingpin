import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  startTime: string;
  endTime: string;
  price: string;
  status: string;
  bookingType: string;
  foodOrders?: FoodOrder[];
  createdAt: string;
}

export default function Timeline() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getTimePosition = (time: Date) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    return ((hours * 60 + minutes) / (24 * 60)) * 100;
  };

  const getDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    return (diff / (24 * 60 * 60 * 1000)) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300';
      case 'upcoming':
        return 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300';
      case 'completed':
        return 'bg-gray-500/20 border-gray-500 text-gray-700 dark:text-gray-300';
      case 'expired':
        return 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-500/20 border-gray-500 text-gray-700 dark:text-gray-300';
    }
  };

  const groupedByCategory = bookings.reduce((acc, booking) => {
    if (!acc[booking.category]) {
      acc[booking.category] = {};
    }
    if (!acc[booking.category][booking.seatName]) {
      acc[booking.category][booking.seatName] = [];
    }
    acc[booking.category][booking.seatName].push(booking);
    return acc;
  }, {} as Record<string, Record<string, Booking[]>>);

  const timeMarkers = Array.from({ length: 25 }, (_, i) => i);

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Timeline View</h1>
          <p className="text-muted-foreground">Visual timeline of all bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => changeDate(-1)} data-testid="button-prev-day">
            Previous Day
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())} disabled={isToday} data-testid="button-today">
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => changeDate(1)} data-testid="button-next-day">
            Next Day
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">
            {selectedDate.toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : Object.keys(groupedByCategory).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No bookings found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByCategory).map(([category, seats]) => (
              <div key={category} className="space-y-4">
                <h2 className="text-xl font-semibold text-primary">{category}</h2>
                
                {Object.entries(seats).map(([seatName, seatBookings]) => (
                  <div key={seatName} className="space-y-2" data-testid={`timeline-seat-${seatName}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-24 pt-2 font-medium text-sm flex-shrink-0">
                        {seatName}
                      </div>
                      <div className="flex-1 relative">
                        <div className="relative h-16 bg-muted/30 rounded-lg border border-border">
                          <div className="absolute inset-0 flex">
                            {timeMarkers.map((hour) => (
                              <div
                                key={hour}
                                className="flex-1 border-r border-border/30 last:border-r-0"
                                style={{ width: `${100 / 24}%` }}
                              >
                                {hour % 3 === 0 && (
                                  <div className="absolute top-0 -translate-x-1/2 -translate-y-full pb-1 text-xs text-muted-foreground">
                                    {hour}:00
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {seatBookings.map((booking) => {
                            const start = new Date(booking.startTime);
                            const end = new Date(booking.endTime);
                            const left = getTimePosition(start);
                            const width = getDuration(start, end);

                            return (
                              <div
                                key={booking.id}
                                className={`absolute top-1 bottom-1 rounded border-2 ${getStatusColor(booking.status)} px-2 py-1 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow`}
                                style={{
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  minWidth: '80px'
                                }}
                                data-testid={`booking-block-${booking.id}`}
                                title={`${booking.customerName} - ${formatTime(start)} to ${formatTime(end)}`}
                              >
                                <div className="text-xs font-semibold truncate">
                                  {booking.customerName}
                                </div>
                                <div className="text-xs truncate opacity-80">
                                  {formatTime(start)} - {formatTime(end)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-green-500/20 border-2 border-green-500"></div>
            <span className="text-sm">Running</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-500/20 border-2 border-blue-500"></div>
            <span className="text-sm">Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gray-500/20 border-2 border-gray-500"></div>
            <span className="text-sm">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-red-500/20 border-2 border-red-500"></div>
            <span className="text-sm">Expired</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
