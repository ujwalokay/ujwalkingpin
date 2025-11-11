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

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<BookingHistory | null>(null);
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

  const groupedByCustomer = useMemo(() => {
    const groups = new Map<string, BookingHistory[]>();
    filteredBookings.forEach(booking => {
      const customerName = booking.customerName;
      if (!groups.has(customerName)) {
        groups.set(customerName, []);
      }
      groups.get(customerName)!.push(booking);
    });
    return groups;
  }, [filteredBookings]);

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
          <p className="text-muted-foreground mt-2">View all completed bookings grouped by customer</p>
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
        {groupedByCustomer.size === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground" data-testid="text-no-history">
                {searchQuery ? "No bookings found matching your search" : "No booking history yet. Click 'Refresh List' on the Dashboard to archive completed/expired bookings."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-4">
            {Array.from(groupedByCustomer.entries()).map(([customerName, customerBookings]) => {
              const totalAmount = customerBookings.reduce((sum, booking) => sum + calculateTotal(booking), 0);
              
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
                            {customerBookings.length} booking{customerBookings.length > 1 ? 's' : ''}
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
                      {customerBookings.map((booking) => (
                        <Card key={booking.id} className="glass-card" data-testid={`card-booking-${booking.id}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg" data-testid={`text-seat-${booking.id}`}>
                                  {booking.seatName}
                                </CardTitle>
                                <CardDescription className="mt-1 flex gap-1 flex-wrap">
                                  <Badge variant="secondary" className="text-xs">
                                    {booking.category}
                                  </Badge>
                                  {booking.bookingType && booking.bookingType.length > 0 && booking.bookingType.map((type, idx) => (
                                    <Badge 
                                      key={idx}
                                      variant="outline" 
                                      className={`text-xs ${
                                        type === 'happy-hours' 
                                          ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700' 
                                          : type === 'upcoming'
                                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                                          : 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                                      }`}
                                      data-testid={`badge-booking-type-${type}-${booking.id}`}
                                    >
                                      {type === 'happy-hours' ? 'Happy Hours' : type === 'upcoming' ? 'Upcoming' : 'Walk-in'}
                                    </Badge>
                                  ))}
                                </CardDescription>
                              </div>
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                                Completed
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            {!isStaff && booking.whatsappNumber && (
                              <div className="flex items-center gap-2" data-testid={`text-phone-${booking.id}`}>
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">{booking.whatsappNumber}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2" data-testid={`text-start-time-${booking.id}`}>
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{formatDate(booking.startTime)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2" data-testid={`text-duration-${booking.id}`}>
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Duration: {calculateDuration(booking.startTime, booking.endTime)}
                              </span>
                            </div>

                            {booking.discountApplied || booking.bonusHoursApplied ? (
                              <div className="flex flex-wrap gap-2 pt-2 border-t">
                                {booking.discountApplied && (
                                  <Badge 
                                    variant="outline" 
                                    className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                                    data-testid={`badge-discount-used-${booking.id}`}
                                  >
                                    <Percent className="h-3 w-3 mr-1" />
                                    Discount
                                  </Badge>
                                )}
                                {booking.bonusHoursApplied && (
                                  <Badge 
                                    variant="outline" 
                                    className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                                    data-testid={`badge-bonus-used-${booking.id}`}
                                  >
                                    <Gift className="h-3 w-3 mr-1" />
                                    Free Hours
                                  </Badge>
                                )}
                              </div>
                            ) : null}

                            {booking.foodOrders && booking.foodOrders.length > 0 && (
                              <div className="pt-2 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                  <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-xs font-medium">
                                    {booking.foodOrders.length} item{booking.foodOrders.length > 1 ? 's' : ''}
                                  </p>
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
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => setSelectedBooking(booking)}
                              data-testid={`button-view-detail-${booking.id}`}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Detail
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </ScrollArea>

      {/* Booking Detail Dialog with Table */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-booking-detail">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information for this booking
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Customer Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-md">
                <div>
                  <p className="text-xs text-muted-foreground">Customer Name</p>
                  <p className="font-semibold" data-testid="detail-customer-name">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Seat</p>
                  <p className="font-semibold" data-testid="detail-seat-name">{selectedBooking.seatName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <Badge variant="secondary">{selectedBooking.category}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                    Completed
                  </Badge>
                </div>
              </div>

              {/* Booking Information Table */}
              <div>
                <h3 className="font-semibold mb-3">Booking Information</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isStaff && selectedBooking.whatsappNumber && (
                      <TableRow>
                        <TableCell className="font-medium">WhatsApp Number</TableCell>
                        <TableCell data-testid="detail-phone">{selectedBooking.whatsappNumber}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell className="font-medium">Start Time</TableCell>
                      <TableCell data-testid="detail-start-time">{formatDate(selectedBooking.startTime)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">End Time</TableCell>
                      <TableCell data-testid="detail-end-time">{formatDate(selectedBooking.endTime)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Duration</TableCell>
                      <TableCell data-testid="detail-duration">
                        {calculateDuration(selectedBooking.startTime, selectedBooking.endTime)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Archived At</TableCell>
                      <TableCell data-testid="detail-archived">{formatDate(selectedBooking.archivedAt)}</TableCell>
                    </TableRow>
                    {selectedBooking.personCount && (
                      <TableRow>
                        <TableCell className="font-medium">Person Count</TableCell>
                        <TableCell data-testid="detail-person-count">{selectedBooking.personCount}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pricing Table */}
              <div>
                <h3 className="font-semibold mb-3">Pricing Details</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBooking.originalPrice && selectedBooking.discountApplied && (
                      <TableRow>
                        <TableCell>Original Price</TableCell>
                        <TableCell className="text-right" data-testid="detail-original-price">₹{selectedBooking.originalPrice}</TableCell>
                      </TableRow>
                    )}
                    {selectedBooking.discountApplied && selectedBooking.manualDiscountPercentage && (
                      <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20">
                        <TableCell className="font-medium text-emerald-700 dark:text-emerald-400">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            Discount ({selectedBooking.manualDiscountPercentage}%)
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-emerald-700 dark:text-emerald-400" data-testid="detail-discount">
                          {selectedBooking.promotionDetails?.discountAmount && `-₹${selectedBooking.promotionDetails.discountAmount}`}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell className="font-medium">Gaming Price{selectedBooking.discountApplied ? ' (After Discount)' : ''}</TableCell>
                      <TableCell className="text-right font-semibold" data-testid="detail-gaming-price">₹{selectedBooking.price}</TableCell>
                    </TableRow>
                    {selectedBooking.bonusHoursApplied && selectedBooking.manualFreeHours && (
                      <TableRow className="bg-violet-50/50 dark:bg-violet-950/20">
                        <TableCell className="font-medium text-violet-700 dark:text-violet-400">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4" />
                            Free Hours Added
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-violet-700 dark:text-violet-400" data-testid="detail-free-hours">
                          +{selectedBooking.manualFreeHours} FREE
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Food Orders Table */}
              {selectedBooking.foodOrders && selectedBooking.foodOrders.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Food Orders</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBooking.foodOrders.map((order, idx) => (
                        <TableRow key={idx}>
                          <TableCell data-testid={`detail-food-name-${idx}`}>{order.foodName}</TableCell>
                          <TableCell className="text-center" data-testid={`detail-food-quantity-${idx}`}>{order.quantity}</TableCell>
                          <TableCell className="text-right">₹{parseFloat(order.price)}</TableCell>
                          <TableCell className="text-right font-medium" data-testid={`detail-food-total-${idx}`}>
                            ₹{(parseFloat(order.price) * order.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="font-bold text-lg">Grand Total</span>
                <span className="font-bold text-2xl text-primary" data-testid="detail-grand-total">
                  ₹{calculateTotal(selectedBooking)}
                </span>
              </div>

              {/* Payment Method */}
              {selectedBooking.paymentMethod && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Payment Method:</span>
                  <Badge variant="secondary" data-testid="detail-payment-method">
                    {selectedBooking.paymentMethod === 'cash' ? 'Cash' : 'UPI/Online'}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
