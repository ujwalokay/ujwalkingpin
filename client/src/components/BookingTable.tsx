import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "./StatusBadge";
import { SessionTimer } from "./SessionTimer";
import { Clock, X, Check, UtensilsCrossed, Search, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type BookingStatus = "available" | "running" | "expired" | "upcoming" | "completed";

interface FoodOrder {
  foodId: string;
  foodName: string;
  price: string;
  quantity: number;
}

interface Booking {
  id: string;
  seatName: string;
  customerName: string;
  whatsappNumber?: string;
  startTime: Date;
  endTime: Date;
  price: number;
  status: BookingStatus;
  foodOrders?: FoodOrder[];
}

interface BookingTableProps {
  bookings: Booking[];
  onExtend?: (id: string) => void;
  onEnd?: (id: string) => void;
  onComplete?: (id: string) => void;
  onAddFood?: (id: string) => void;
}

export function BookingTable({ bookings, onExtend, onEnd, onComplete, onAddFood }: BookingTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.seatName.toLowerCase().includes(searchLower) ||
      booking.customerName.toLowerCase().includes(searchLower) ||
      (booking.whatsappNumber && booking.whatsappNumber.includes(searchTerm))
    );
  });

  const toggleSelection = (id: string) => {
    setSelectedBookings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAction = (bookingId: string, action: "extend" | "complete" | "delete" | "addFood") => {
    setSelectedBookings((prev) => {
      const newSet = new Set(prev);
      newSet.delete(bookingId);
      return newSet;
    });

    switch (action) {
      case "extend":
        if (onExtend) onExtend(bookingId);
        break;
      case "complete":
        if (onComplete) onComplete(bookingId);
        break;
      case "delete":
        if (onEnd) onEnd(bookingId);
        break;
      case "addFood":
        if (onAddFood) onAddFood(bookingId);
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by seat, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-bookings"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Seat</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Time Left</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Food</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => {
                const isSelected = selectedBookings.has(booking.id);
                const hasFoodOrders = booking.foodOrders && booking.foodOrders.length > 0;
                
                return (
                  <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(booking.id)}
                        data-testid={`checkbox-booking-${booking.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-seat-${booking.id}`}>
                      {booking.seatName}
                    </TableCell>
                    <TableCell data-testid={`text-customer-${booking.id}`}>
                      {booking.customerName}
                    </TableCell>
                    <TableCell data-testid={`text-whatsapp-${booking.id}`}>
                      {booking.whatsappNumber || "-"}
                    </TableCell>
                    <TableCell data-testid={`text-start-${booking.id}`}>
                      {booking.startTime.toLocaleTimeString()}
                    </TableCell>
                    <TableCell data-testid={`text-end-${booking.id}`}>
                      {booking.endTime.toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      {booking.status === "running" && <SessionTimer endTime={booking.endTime} />}
                    </TableCell>
                    <TableCell className="font-bold text-primary" data-testid={`text-price-${booking.id}`}>
                      ₹{booking.price}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell>
                      {hasFoodOrders ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="relative"
                              data-testid={`button-view-food-${booking.id}`}
                            >
                              <UtensilsCrossed className="h-5 w-5 text-primary" />
                              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                                {booking.foodOrders!.length}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80" data-testid={`popover-food-${booking.id}`}>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Food Orders</h4>
                              <div className="space-y-2">
                                {booking.foodOrders!.map((order, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center py-1 border-b last:border-0"
                                    data-testid={`food-order-${booking.id}-${index}`}
                                  >
                                    <div>
                                      <p className="text-sm font-medium">{order.foodName}</p>
                                      <p className="text-xs text-muted-foreground">Qty: {order.quantity}</p>
                                    </div>
                                    <p className="text-sm font-semibold">
                                      ₹{(parseFloat(order.price) * order.quantity).toFixed(0)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-semibold">Total:</p>
                                  <p className="text-sm font-bold text-primary">
                                    ₹{booking.foodOrders!.reduce((sum, order) => 
                                      sum + parseFloat(order.price) * order.quantity, 0
                                    ).toFixed(0)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isSelected ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-actions-${booking.id}`}
                            >
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" data-testid={`dropdown-actions-${booking.id}`}>
                            {booking.status === "running" && onExtend && (
                              <DropdownMenuItem
                                onClick={() => handleAction(booking.id, "extend")}
                                data-testid={`action-extend-${booking.id}`}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Extend Time
                              </DropdownMenuItem>
                            )}
                            {booking.status === "running" && onComplete && (
                              <DropdownMenuItem
                                onClick={() => handleAction(booking.id, "complete")}
                                data-testid={`action-complete-${booking.id}`}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Complete
                              </DropdownMenuItem>
                            )}
                            {(booking.status === "running" || booking.status === "upcoming") && onEnd && (
                              <DropdownMenuItem
                                onClick={() => handleAction(booking.id, "delete")}
                                className="text-destructive"
                                data-testid={`action-delete-${booking.id}`}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                            {(booking.status === "running" || booking.status === "upcoming") && onAddFood && (
                              <DropdownMenuItem
                                onClick={() => handleAction(booking.id, "addFood")}
                                data-testid={`action-add-food-${booking.id}`}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Food
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">Check to act</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
