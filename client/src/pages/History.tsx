import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, Phone, DollarSign, Calendar, Search, FileText, Percent, Gift, UtensilsCrossed } from "lucide-react";
import { useState, useMemo } from "react";
import { format, isValid, isSameDay } from "date-fns";
import type { BookingHistory } from "@shared/schema";
import { getAdjustedTime } from "@/hooks/useServerTime";
import { useAuth } from "@/contexts/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DateGroup {
  date: string;
  bookings: BookingHistory[];
}

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedDateBookings, setSelectedDateBookings] = useState<BookingHistory[] | null>(null);
  const { isStaff } = useAuth();

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

  const groupedByCustomerAndDate = useMemo(() => {
    const customerGroups = new Map<string, DateGroup[]>();
    
    filteredBookings.forEach(booking => {
      const customerName = booking.customerName;
      const bookingDate = typeof booking.startTime === 'string' ? new Date(booking.startTime) : booking.startTime;
      const dateKey = isValid(bookingDate) ? format(bookingDate, 'yyyy-MM-dd') : 'Invalid Date';
      
      if (!customerGroups.has(customerName)) {
        customerGroups.set(customerName, []);
      }
      
      const customerDateGroups = customerGroups.get(customerName)!;
      let dateGroup = customerDateGroups.find(dg => dg.date === dateKey);
      
      if (!dateGroup) {
        dateGroup = { date: dateKey, bookings: [] };
        customerDateGroups.push(dateGroup);
      }
      
      dateGroup.bookings.push(booking);
    });
    
    customerGroups.forEach(dateGroups => {
      dateGroups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    
    return customerGroups;
  }, [filteredBookings]);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return isValid(d) ? format(d, 'MMM dd, yyyy hh:mm a') : 'N/A';
  };

  const formatDateShort = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return isValid(d) ? format(d, 'dd MMM yyyy') : 'N/A';
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

  const calculateGroupTotal = (bookings: BookingHistory[]) => {
    return bookings.reduce((sum, booking) => sum + calculateTotal(booking), 0);
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
          <p className="text-muted-foreground mt-2">View all completed bookings grouped by customer and date</p>
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
        {groupedByCustomerAndDate.size === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground" data-testid="text-no-history">
                {searchQuery ? "No bookings found matching your search" : "No booking history yet. Click 'Refresh List' on the Dashboard to archive completed/expired bookings."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {Array.from(groupedByCustomerAndDate.entries()).map(([customerName, dateGroups]) => {
              const totalAmount = dateGroups.reduce((sum, dg) => sum + calculateGroupTotal(dg.bookings), 0);
              const totalBookings = dateGroups.reduce((sum, dg) => sum + dg.bookings.length, 0);
              
              return (
                <AccordionItem 
                  key={customerName} 
                  value={customerName}
                  className="border rounded-md px-4 bg-card"
                  data-testid={`accordion-customer-${customerName}`}
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div className="text-left">
                          <div className="font-semibold text-base" data-testid={`text-customer-name-${customerName}`}>
                            {customerName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {totalBookings} booking{totalBookings > 1 ? 's' : ''} across {dateGroups.length} date{dateGroups.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm">
                          ₹{totalAmount}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4 pb-4">
                    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {dateGroups.map((dateGroup, idx) => {
                        const groupTotal = calculateGroupTotal(dateGroup.bookings);
                        const firstBooking = dateGroup.bookings[0];
                        const allSeats = dateGroup.bookings.map(b => b.seatName);
                        const allCategories = Array.from(new Set(dateGroup.bookings.map(b => b.category)));
                        const hasDiscounts = dateGroup.bookings.some(b => b.discountApplied);
                        const hasBonusHours = dateGroup.bookings.some(b => b.bonusHoursApplied);
                        const totalFoodItems = dateGroup.bookings.reduce((sum, b) => 
                          sum + (b.foodOrders?.length || 0), 0
                        );
                        
                        return (
                          <Card key={idx} className="glass-card" data-testid={`card-date-${dateGroup.date}`}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-lg flex items-center gap-2" data-testid={`text-date-${dateGroup.date}`}>
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {formatDateShort(dateGroup.date)}
                                  </CardTitle>
                                  <CardDescription className="mt-2 flex gap-1 flex-wrap">
                                    {allCategories.map((category, catIdx) => (
                                      <Badge key={catIdx} variant="secondary" className="text-xs">
                                        {category}
                                      </Badge>
                                    ))}
                                  </CardDescription>
                                </div>
                                <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                                  {dateGroup.bookings.length} PC{dateGroup.bookings.length > 1 ? 's' : ''}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                              <div className="flex flex-wrap gap-1" data-testid={`seats-${dateGroup.date}`}>
                                {allSeats.map((seat, seatIdx) => (
                                  <Badge 
                                    key={seatIdx} 
                                    variant="outline" 
                                    className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                                  >
                                    {seat}
                                  </Badge>
                                ))}
                              </div>

                              {!isStaff && firstBooking.whatsappNumber && (
                                <div className="flex items-center gap-2" data-testid={`text-phone-${dateGroup.date}`}>
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">{firstBooking.whatsappNumber}</span>
                                </div>
                              )}

                              {(hasDiscounts || hasBonusHours) && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t">
                                  {hasDiscounts && (
                                    <Badge 
                                      variant="outline" 
                                      className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                                      data-testid={`badge-discount-${dateGroup.date}`}
                                    >
                                      <Percent className="h-3 w-3 mr-1" />
                                      Discount
                                    </Badge>
                                  )}
                                  {hasBonusHours && (
                                    <Badge 
                                      variant="outline" 
                                      className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                                      data-testid={`badge-bonus-${dateGroup.date}`}
                                    >
                                      <Gift className="h-3 w-3 mr-1" />
                                      Free Hours
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {totalFoodItems > 0 && (
                                <div className="pt-2 border-t">
                                  <div className="flex items-center gap-2">
                                    <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-xs font-medium">
                                      {totalFoodItems} food item{totalFoodItems > 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between pt-2 border-t" data-testid={`text-total-${dateGroup.date}`}>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">Total</span>
                                </div>
                                <span className="font-bold text-lg">₹{groupTotal}</span>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-2"
                                onClick={() => setSelectedDateBookings(dateGroup.bookings)}
                                data-testid={`button-view-detail-${dateGroup.date}`}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Detail
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </ScrollArea>

      {/* Booking Detail Dialog with Table */}
      <Dialog open={!!selectedDateBookings} onOpenChange={() => setSelectedDateBookings(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-booking-detail">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information for all bookings on this date
            </DialogDescription>
          </DialogHeader>
          
          {selectedDateBookings && selectedDateBookings.length > 0 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-md">
                <div>
                  <p className="text-xs text-muted-foreground">Customer Name</p>
                  <p className="font-semibold" data-testid="detail-customer-name">{selectedDateBookings[0].customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold" data-testid="detail-date">
                    {formatDateShort(selectedDateBookings[0].startTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total PCs</p>
                  <p className="font-semibold">{selectedDateBookings.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                    Completed
                  </Badge>
                </div>
              </div>

              {/* Bookings Table */}
              <div>
                <h3 className="font-semibold mb-3">Booking Information</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seat</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDateBookings.map((booking, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium" data-testid={`detail-seat-${idx}`}>{booking.seatName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{booking.category}</Badge>
                        </TableCell>
                        <TableCell className="text-xs" data-testid={`detail-start-${idx}`}>
                          {format(typeof booking.startTime === 'string' ? new Date(booking.startTime) : booking.startTime, 'hh:mm a')}
                        </TableCell>
                        <TableCell className="text-xs" data-testid={`detail-end-${idx}`}>
                          {format(typeof booking.endTime === 'string' ? new Date(booking.endTime) : booking.endTime, 'hh:mm a')}
                        </TableCell>
                        <TableCell data-testid={`detail-duration-${idx}`}>
                          {calculateDuration(booking.startTime, booking.endTime)}
                        </TableCell>
                        <TableCell className="text-right font-medium" data-testid={`detail-price-${idx}`}>₹{booking.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Discounts and Bonuses */}
              {selectedDateBookings.some(b => b.discountApplied || b.bonusHoursApplied) && (
                <div>
                  <h3 className="font-semibold mb-3">Promotions Applied</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seat</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Benefit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDateBookings.map((booking, idx) => {
                        const promos = [];
                        if (booking.discountApplied) {
                          promos.push({
                            type: 'Discount',
                            details: booking.manualDiscountPercentage ? `${booking.manualDiscountPercentage}% off` : 'Applied',
                            benefit: booking.promotionDetails?.discountAmount ? `Saved ₹${booking.promotionDetails.discountAmount}` : '-'
                          });
                        }
                        if (booking.bonusHoursApplied) {
                          promos.push({
                            type: 'Free Hours',
                            details: booking.manualFreeHours ? `+${booking.manualFreeHours}` : 'Applied',
                            benefit: 'Extra Time'
                          });
                        }
                        return promos.map((promo, promoIdx) => (
                          <TableRow key={`${idx}-${promoIdx}`}>
                            <TableCell className="font-medium">{booking.seatName}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={promo.type === 'Discount' 
                                  ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                                  : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300'
                                }
                              >
                                {promo.type === 'Discount' ? <Percent className="h-3 w-3 mr-1" /> : <Gift className="h-3 w-3 mr-1" />}
                                {promo.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{promo.details}</TableCell>
                            <TableCell className="text-right">{promo.benefit}</TableCell>
                          </TableRow>
                        ));
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Food Orders Table */}
              {selectedDateBookings.some(b => b.foodOrders && b.foodOrders.length > 0) && (
                <div>
                  <h3 className="font-semibold mb-3">Food Orders</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seat</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDateBookings.map((booking, bookingIdx) => 
                        booking.foodOrders?.map((order, orderIdx) => (
                          <TableRow key={`${bookingIdx}-${orderIdx}`}>
                            <TableCell className="font-medium">{booking.seatName}</TableCell>
                            <TableCell data-testid={`detail-food-name-${bookingIdx}-${orderIdx}`}>{order.foodName}</TableCell>
                            <TableCell className="text-center" data-testid={`detail-food-quantity-${bookingIdx}-${orderIdx}`}>{order.quantity}</TableCell>
                            <TableCell className="text-right">₹{parseFloat(order.price)}</TableCell>
                            <TableCell className="text-right font-medium" data-testid={`detail-food-total-${bookingIdx}-${orderIdx}`}>
                              ₹{(parseFloat(order.price) * order.quantity).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="font-bold text-lg">Grand Total</span>
                <span className="font-bold text-2xl text-primary" data-testid="detail-grand-total">
                  ₹{calculateGroupTotal(selectedDateBookings)}
                </span>
              </div>

              {/* Payment Methods */}
              <div className="pt-2 border-t">
                <h3 className="font-semibold mb-3">Payment Methods</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDateBookings.map((booking, idx) => 
                    booking.paymentMethod && (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{booking.seatName}:</span>
                        <Badge variant="secondary">
                          {booking.paymentMethod === 'cash' ? 'Cash' : 'UPI/Online'}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
