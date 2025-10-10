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
import { StatusBadge } from "./StatusBadge";
import { SessionTimer } from "./SessionTimer";
import { Clock, X, Check, UtensilsCrossed, Search, Plus, MoreVertical, StopCircle, Trash2, Play, Pause } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAuth } from "@/contexts/AuthContext";

type BookingStatus = "available" | "running" | "expired" | "upcoming" | "completed" | "paused";

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
  pausedRemainingTime?: number | null;
}

interface BookingTableProps {
  bookings: Booking[];
  onExtend?: (id: string) => void;
  onEnd?: (id: string) => void;
  onComplete?: (id: string) => void;
  onAddFood?: (id: string) => void;
  onStopTimer?: (id: string) => void;
  onDeleteFood?: (bookingId: string, foodIndex: number) => void;
  showDateColumn?: boolean;
  selectedBookings?: Set<string>;
  onToggleSelection?: (bookingId: string) => void;
}

export function BookingTable({ bookings, onExtend, onEnd, onComplete, onAddFood, onStopTimer, onDeleteFood, showDateColumn = false, selectedBookings, onToggleSelection }: BookingTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { isAdmin } = useAuth();

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.seatName.toLowerCase().includes(searchLower) ||
      booking.customerName.toLowerCase().includes(searchLower) ||
      (booking.whatsappNumber && booking.whatsappNumber.includes(searchTerm))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by seat, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 glass-input"
            data-testid="input-search-bookings"
          />
        </div>
      </div>

      <div className="rounded-md border glass-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Seat</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>WhatsApp</TableHead>
              {showDateColumn && <TableHead>Date</TableHead>}
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Time Left</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Food</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showDateColumn ? 13 : 12} className="text-center text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => {
                const hasFoodOrders = booking.foodOrders && booking.foodOrders.length > 0;
                const foodTotal = hasFoodOrders 
                  ? booking.foodOrders!.reduce((sum, order) => sum + parseFloat(order.price) * order.quantity, 0)
                  : 0;
                const totalAmount = booking.price + foodTotal;
                
                return (
                  <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBookings?.has(booking.id) || false}
                        onCheckedChange={() => onToggleSelection?.(booking.id)}
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
                    {showDateColumn && (
                      <TableCell data-testid={`text-date-${booking.id}`}>
                        {booking.startTime.toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </TableCell>
                    )}
                    <TableCell data-testid={`text-start-${booking.id}`}>
                      {booking.startTime.toLocaleTimeString()}
                    </TableCell>
                    <TableCell data-testid={`text-end-${booking.id}`}>
                      {booking.endTime.toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      {booking.status === "running" && <SessionTimer endTime={booking.endTime} />}
                      {booking.status === "paused" && booking.pausedRemainingTime && (() => {
                        const remainingMs = booking.pausedRemainingTime;
                        const totalSeconds = Math.floor(remainingMs / 1000);
                        const hours = Math.floor(totalSeconds / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;
                        
                        const timeStr = hours > 0 
                          ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                          : `${minutes}:${seconds.toString().padStart(2, '0')}`;
                        
                        return (
                          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500" data-testid="timer-paused">
                            <Pause className="h-4 w-4" />
                            <span className="font-mono text-sm font-semibold">{timeStr}</span>
                          </div>
                        );
                      })()}
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
                              size="sm"
                              className="relative h-auto px-2 py-1"
                              data-testid={`button-view-food-${booking.id}`}
                            >
                              <UtensilsCrossed className="h-4 w-4 mr-1 text-primary" />
                              <span className="text-sm font-medium">₹{foodTotal.toFixed(0)}</span>
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
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{order.foodName}</p>
                                      <p className="text-xs text-muted-foreground">Qty: {order.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-semibold">
                                        ₹{(parseFloat(order.price) * order.quantity).toFixed(0)}
                                      </p>
                                      {onDeleteFood && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-destructive hover:text-destructive"
                                          onClick={() => onDeleteFood(booking.id, index)}
                                          data-testid={`button-delete-food-${booking.id}-${index}`}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-semibold">Food Total:</p>
                                  <p className="text-sm font-bold text-primary">
                                    ₹{foodTotal.toFixed(0)}
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
                    <TableCell className="font-bold text-lg text-green-600 dark:text-green-400" data-testid={`text-total-${booking.id}`}>
                      ₹{totalAmount.toFixed(0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-actions-${booking.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" data-testid={`dropdown-actions-${booking.id}`}>
                          {booking.status === "running" && onExtend && (
                            <DropdownMenuItem
                              onClick={() => onExtend(booking.id)}
                              data-testid={`action-extend-${booking.id}`}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Extend Time
                            </DropdownMenuItem>
                          )}
                          {booking.status === "running" && onStopTimer && (
                            <DropdownMenuItem
                              onClick={() => onStopTimer(booking.id)}
                              data-testid={`action-pause-timer-${booking.id}`}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Pause Timer
                            </DropdownMenuItem>
                          )}
                          {booking.status === "paused" && onStopTimer && (
                            <DropdownMenuItem
                              onClick={() => onStopTimer(booking.id)}
                              data-testid={`action-resume-timer-${booking.id}`}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Resume Timer
                            </DropdownMenuItem>
                          )}
                          {booking.status === "running" && onComplete && (
                            <DropdownMenuItem
                              onClick={() => onComplete(booking.id)}
                              data-testid={`action-complete-${booking.id}`}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Over (Complete)
                            </DropdownMenuItem>
                          )}
                          {(booking.status === "running" || booking.status === "paused" || booking.status === "upcoming" || booking.status === "completed") && onEnd && (
                            <DropdownMenuItem
                              onClick={() => onEnd(booking.id)}
                              className="text-destructive"
                              data-testid={`action-delete-${booking.id}`}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                          {(booking.status === "running" || booking.status === "paused" || booking.status === "upcoming") && onAddFood && (
                            <DropdownMenuItem
                              onClick={() => onAddFood(booking.id)}
                              data-testid={`action-add-food-${booking.id}`}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Food
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
