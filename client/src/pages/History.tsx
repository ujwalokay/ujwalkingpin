import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, Phone, DollarSign, Calendar, Search } from "lucide-react";
import { useState } from "react";
import { format, isValid, isSameDay, parseISO } from "date-fns";
import type { BookingHistory } from "@shared/schema";
import { getAdjustedTime } from "@/hooks/useServerTime";

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const { data: bookings = [], isLoading } = useQuery<BookingHistory[]>({
    queryKey: ["/api/booking-history"],
  });

  const filteredBookings = bookings.filter(booking => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      booking.customerName.toLowerCase().includes(query) ||
      booking.seatName.toLowerCase().includes(query) ||
      booking.whatsappNumber?.toLowerCase().includes(query) ||
      booking.category.toLowerCase().includes(query);
    
    if (!matchesSearch) return false;
    
    if (selectedDate) {
      const bookingDate = typeof booking.startTime === 'string' ? new Date(booking.startTime) : booking.startTime;
      const filterDate = new Date(selectedDate);
      return isValid(bookingDate) && isValid(filterDate) && isSameDay(bookingDate, filterDate);
    }
    
    return true;
  });

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return isValid(d) ? format(d, 'MMM dd, yyyy hh:mm a') : 'N/A';
  };

  const calculateDuration = (startTime: Date | string, endTime: Date | string) => {
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
    const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
    
    if (!isValid(start) || !isValid(end)) return 'N/A';
    
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const calculateTotal = (booking: BookingHistory) => {
    const basePrice = parseFloat(booking.price);
    const foodTotal = booking.foodOrders?.reduce((sum, order) => sum + (parseFloat(order.price) * order.quantity), 0) || 0;
    return basePrice + foodTotal;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Booking History</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-history">Booking History</h1>
          <p className="text-muted-foreground mt-2">View all completed bookings</p>
        </div>
        <div className="text-sm text-muted-foreground" data-testid="text-current-date">
          {getAdjustedTime().toLocaleDateString('en-IN', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 flex-col sm:flex-row flex-1">
          <Input
            placeholder="Search by customer, seat, phone, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 sm:max-w-xs"
            data-testid="input-search-history"
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto"
              data-testid="input-date-filter"
            />
            {selectedDate && (
              <Button
                variant="outline"
                onClick={() => setSelectedDate("")}
                data-testid="button-clear-date"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap" data-testid="text-booking-count">
          Total: {filteredBookings.length} bookings
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        {filteredBookings.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground" data-testid="text-no-history">
                {searchQuery ? "No bookings found matching your search" : "No booking history yet. Click 'Refresh List' on the Dashboard to archive completed/expired bookings."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="glass-card" data-testid={`card-booking-${booking.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-seat-${booking.id}`}>
                        {booking.seatName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {booking.category}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                      Completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2" data-testid={`text-customer-${booking.id}`}>
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{booking.customerName}</span>
                  </div>
                  
                  {booking.whatsappNumber && (
                    <div className="flex items-center gap-2" data-testid={`text-phone-${booking.id}`}>
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{booking.whatsappNumber}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2" data-testid={`text-start-time-${booking.id}`}>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{formatDate(booking.startTime)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid={`text-archived-${booking.id}`}>
                    <span>Archived: {formatDate(booking.archivedAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2" data-testid={`text-duration-${booking.id}`}>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Duration: {calculateDuration(booking.startTime, booking.endTime)}
                    </span>
                  </div>

                  {booking.foodOrders && booking.foodOrders.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium mb-2">Food Orders:</p>
                      <div className="space-y-1">
                        {booking.foodOrders.map((order, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                            <span>{order.foodName} x{order.quantity}</span>
                            <span>₹{parseFloat(order.price) * order.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t" data-testid={`text-total-${booking.id}`}>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">Total</span>
                    </div>
                    <span className="font-bold text-lg">₹{calculateTotal(booking)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
