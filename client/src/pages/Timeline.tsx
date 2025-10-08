import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
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
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
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
        return 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-600 shadow-lg shadow-green-500/30';
      case 'upcoming':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-600 shadow-lg shadow-blue-500/30';
      case 'completed':
        return 'bg-gradient-to-r from-gray-500 to-slate-500 border-gray-600 shadow-lg shadow-gray-500/20';
      case 'expired':
        return 'bg-gradient-to-r from-red-500 to-rose-500 border-red-600 shadow-lg shadow-red-500/30';
      default:
        return 'bg-gradient-to-r from-gray-500 to-slate-500 border-gray-600';
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
  const majorTimeMarkers = [0, 6, 12, 18, 24];

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getCurrentTimePosition = () => {
    if (!isToday) return null;
    const now = new Date();
    return getTimePosition(now);
  };

  const currentTimePos = getCurrentTimePosition();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            Timeline View
          </h1>
          <p className="text-muted-foreground mt-1">Visual schedule of all bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)} data-testid="button-prev-day">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setSelectedDate(new Date())} disabled={isToday} data-testid="button-today" className="min-w-[80px]">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => changeDate(1)} data-testid="button-next-day">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-6 glass-card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-2xl">
              {selectedDate.toLocaleDateString('en-IN', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedDate.getFullYear()}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : Object.keys(groupedByCategory).length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-10 w-10 opacity-50" />
            </div>
            <p className="text-lg font-medium">No bookings found</p>
            <p className="text-sm mt-1">Schedule is clear for this day</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedByCategory).map(([category, seats]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-1 bg-primary rounded-full"></div>
                  <h3 className="text-xl font-bold text-foreground">{category}</h3>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(seats).map(([seatName, seatBookings]) => (
                    <div key={seatName} className="group" data-testid={`timeline-seat-${seatName}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-28 pt-4 flex-shrink-0">
                          <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 text-center">
                            <div className="font-bold text-sm text-foreground">{seatName}</div>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="relative bg-muted/40 rounded-lg border-2 border-border/50 overflow-hidden" style={{ height: '80px' }}>
                            <div className="absolute inset-0 flex">
                              {timeMarkers.map((hour) => (
                                <div
                                  key={hour}
                                  className={`flex-1 ${hour < 24 ? 'border-r' : ''} ${
                                    majorTimeMarkers.includes(hour) ? 'border-border' : 'border-border/20'
                                  }`}
                                  style={{ width: `${100 / 24}%` }}
                                >
                                  {majorTimeMarkers.includes(hour) && (
                                    <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-full pb-2">
                                      <div className="text-xs font-semibold text-muted-foreground bg-background px-2 py-1 rounded border shadow-sm">
                                        {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {currentTimePos !== null && (
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                                style={{ left: `${currentTimePos}%` }}
                              >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
                                  <div className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg">
                                    NOW
                                  </div>
                                </div>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                              </div>
                            )}

                            {seatBookings.map((booking) => {
                              const start = new Date(booking.startTime);
                              const end = new Date(booking.endTime);
                              const left = getTimePosition(start);
                              const width = getDuration(start, end);

                              return (
                                <div
                                  key={booking.id}
                                  className={`absolute top-2 bottom-2 rounded-lg border-2 ${getStatusColor(booking.status)} text-white px-3 py-2 overflow-hidden cursor-pointer hover:scale-105 hover:z-10 transition-all duration-200`}
                                  style={{
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    minWidth: '120px'
                                  }}
                                  data-testid={`booking-block-${booking.id}`}
                                  title={`${booking.customerName} - ${formatTime(start)} to ${formatTime(end)} - ₹${booking.price}`}
                                >
                                  <div className="flex flex-col h-full justify-center">
                                    <div className="text-sm font-bold truncate">
                                      {booking.customerName}
                                    </div>
                                    <div className="text-xs font-medium opacity-90 truncate">
                                      {formatTime(start)} - {formatTime(end)}
                                    </div>
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
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 glass-card">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <div className="h-6 w-1 bg-primary rounded-full"></div>
          Status Legend
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30 border-2 border-green-600"></div>
            <div>
              <div className="font-semibold text-sm">Running</div>
              <div className="text-xs text-muted-foreground">Active now</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 border-2 border-blue-600"></div>
            <div>
              <div className="font-semibold text-sm">Upcoming</div>
              <div className="text-xs text-muted-foreground">Scheduled</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-gray-500 to-slate-500 shadow-lg shadow-gray-500/20 border-2 border-gray-600"></div>
            <div>
              <div className="font-semibold text-sm">Completed</div>
              <div className="text-xs text-muted-foreground">Finished</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/30 border-2 border-red-600"></div>
            <div>
              <div className="font-semibold text-sm">Expired</div>
              <div className="text-xs text-muted-foreground">Overdue</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
