import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { PromotionUsageDialog } from "./PromotionUsageDialog";
import { Clock, X, Check, UtensilsCrossed, Search, Plus, MoreVertical, StopCircle, Trash2, Play, Pause, Award, Gift, Percent, DollarSign, ArrowRightLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  price: string;
  personCount?: number;
  status: BookingStatus;
  bookingType?: string[];
  foodOrders?: FoodOrder[];
  pausedRemainingTime?: number | null;
  originalPrice?: string;
  discountApplied?: string;
  bonusHoursApplied?: string;
  promotionDetails?: {
    discountPercentage?: number;
    discountAmount?: string;
    bonusHours?: string;
  };
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
  showTypeColumn?: boolean;
  selectedBookings?: Set<string>;
  onToggleSelection?: (bookingId: string) => void;
}

export function BookingTable({ bookings, onExtend, onEnd, onComplete, onAddFood, onStopTimer, onDeleteFood, showDateColumn = false, showTypeColumn = false, selectedBookings, onToggleSelection }: BookingTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { isAdmin, canMakeChanges } = useAuth();
  const { toast } = useToast();
  const [loyaltyDialog, setLoyaltyDialog] = useState<{open: boolean, whatsappNumber: string, customerName: string}>({open: false, whatsappNumber: "", customerName: ""});
  const [promotionDialog, setPromotionDialog] = useState<{open: boolean, whatsappNumber: string, customerName: string}>({open: false, whatsappNumber: "", customerName: ""});
  const [seatChangeDialog, setSeatChangeDialog] = useState<{open: boolean, bookingId: string, currentSeat: string, category: string}>({open: false, bookingId: "", currentSeat: "", category: ""});

  // Fetch loyalty tiers
  const { data: loyaltyTiers = [] } = useQuery<any[]>({
    queryKey: ["/api/loyalty-tiers"],
  });

  // Fetch loyalty rewards from catalog
  const { data: loyaltyRewards = [] } = useQuery<any[]>({
    queryKey: ["/api/loyalty-rewards"],
  });

  // Fetch customer loyalty data when dialog is open
  const { data: customerLoyalty } = useQuery<any>({
    queryKey: ["/api/customer-loyalty/by-phone", loyaltyDialog.whatsappNumber],
    queryFn: async () => {
      if (!loyaltyDialog.whatsappNumber) return null;
      const response = await fetch(`/api/customer-loyalty/by-phone/${loyaltyDialog.whatsappNumber}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: loyaltyDialog.open && !!loyaltyDialog.whatsappNumber,
  });

  const customerTier = useMemo(() => {
    if (!customerLoyalty) return null;
    return loyaltyTiers.find((tier: any) => tier.id === customerLoyalty.currentTierId);
  }, [customerLoyalty, loyaltyTiers]);

  const eligibleRewards = useMemo(() => {
    if (!customerLoyalty || !loyaltyRewards.length) return [];
    const pointsAvailable = parseInt(customerLoyalty.pointsAvailable || "0");
    return loyaltyRewards.filter((reward: any) => {
      const pointCost = parseInt(reward.pointCost || "0");
      return reward.enabled === 1 && pointsAvailable >= pointCost;
    });
  }, [customerLoyalty, loyaltyRewards]);

  // Fetch device configs and bookings for seat change
  const { data: deviceConfigs = [] } = useQuery<any[]>({
    queryKey: ["/api/device-config"],
  });

  const occupiedSeats = useMemo(() => {
    return new Set(
      bookings
        .filter(b => b.status === 'running' || b.status === 'paused')
        .map(b => b.seatName)
    );
  }, [bookings]);

  const availableSeatsForChange = useMemo(() => {
    return deviceConfigs.map(config => ({
      category: config.category,
      availableSeats: (config.seats || []).filter((seat: string) => !occupiedSeats.has(seat))
    }));
  }, [deviceConfigs, occupiedSeats]);

  // Seat change mutation with optimistic updates for instant UI response
  const changeSeatMutation = useMutation({
    mutationFn: async (data: { bookingId: string; newSeatName: string }) => {
      return await apiRequest("PATCH", `/api/bookings/${data.bookingId}/change-seat`, { newSeatName: data.newSeatName });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["/api/bookings"] });
      
      const previousBookings = queryClient.getQueryData(["/api/bookings"]);
      
      queryClient.setQueryData(["/api/bookings"], (old: any) => {
        if (!old) return old;
        return old.map((booking: any) => 
          booking.id === variables.bookingId 
            ? { ...booking, seatName: variables.newSeatName }
            : booking
        );
      });
      
      setSeatChangeDialog({open: false, bookingId: "", currentSeat: "", category: ""});
      
      return { previousBookings };
    },
    onSuccess: () => {
      toast({
        title: "Seat Changed!",
        description: "The booking has been moved successfully.",
      });
    },
    onError: (error: any, variables, context: any) => {
      if (context?.previousBookings) {
        queryClient.setQueryData(["/api/bookings"], context.previousBookings);
      }
      toast({
        title: "Seat Change Failed",
        description: error.message || "Failed to change seat. Changes reverted.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/device-config"] });
    },
  });


  const getRewardIcon = (type: string) => {
    switch (type) {
      case "free_hours":
        return <Clock className="h-4 w-4" />;
      case "discount":
        return <Percent className="h-4 w-4" />;
      case "cashback":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getRewardLabel = (type: string, value: string) => {
    switch (type) {
      case "free_hours":
        return `${value} hour${parseFloat(value) !== 1 ? 's' : ''} free`;
      case "discount":
        return `${value}% discount`;
      case "cashback":
        return `₹${value} cashback`;
      default:
        return value;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.seatName.toLowerCase().includes(searchLower) ||
      booking.customerName.toLowerCase().includes(searchLower) ||
      (booking.whatsappNumber && booking.whatsappNumber.includes(searchTerm))
    );
  });

  const groupedByCustomer = useMemo(() => {
    const groups = new Map<string, Booking[]>();
    filteredBookings.forEach(booking => {
      const customerName = booking.customerName;
      if (!groups.has(customerName)) {
        groups.set(customerName, []);
      }
      groups.get(customerName)!.push(booking);
    });
    return groups;
  }, [filteredBookings]);

  const handleSelectAllForCustomer = (customerName: string) => {
    if (!onToggleSelection) return;
    const customerBookings = groupedByCustomer.get(customerName) || [];
    const customerBookingIds = customerBookings.map(b => b.id);
    const allSelected = customerBookingIds.every(id => selectedBookings?.has(id));
    
    customerBookingIds.forEach(id => {
      if (allSelected) {
        if (selectedBookings?.has(id)) {
          onToggleSelection(id);
        }
      } else {
        if (!selectedBookings?.has(id)) {
          onToggleSelection(id);
        }
      }
    });
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
              <TableHead>Persons</TableHead>
              <TableHead>WhatsApp</TableHead>
              {showDateColumn && <TableHead>Date</TableHead>}
              {showTypeColumn && <TableHead>Type</TableHead>}
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
                <TableCell colSpan={13 + (showDateColumn ? 1 : 0) + (showTypeColumn ? 1 : 0)} className="text-center text-muted-foreground">
                  No bookings found
                </TableCell>
              </TableRow>
            ) : (
              Array.from(groupedByCustomer.entries()).map(([customerName, customerBookings], groupIndex) => {
                const customerBookingIds = customerBookings.map(b => b.id);
                const allSelected = customerBookingIds.every(id => selectedBookings?.has(id));
                const someSelected = customerBookingIds.some(id => selectedBookings?.has(id));
                const customerTotal = customerBookings.reduce((sum, booking) => {
                  const foodTotal = booking.foodOrders 
                    ? booking.foodOrders.reduce((fSum, order) => fSum + parseFloat(order.price) * order.quantity, 0)
                    : 0;
                  return sum + parseFloat(booking.price) + foodTotal;
                }, 0);

                return [
                  <TableRow 
                    key={`customer-header-${customerName}-${groupIndex}`}
                    className="bg-muted/50 hover:bg-muted/50 border-t-2 border-primary/20"
                  >
                    <TableCell colSpan={13 + (showDateColumn ? 1 : 0) + (showTypeColumn ? 1 : 0)} className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-base font-bold text-foreground" data-testid={`customer-group-${customerName}`}>
                            {customerName}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            ({customerBookings.length} PC{customerBookings.length > 1 ? 's' : ''})
                          </span>
                          <span className="text-sm font-semibold text-primary">
                            Total: ₹{customerTotal.toFixed(0)}
                          </span>
                          {(() => {
                            const hasDiscount = customerBookings.some(b => b.discountApplied);
                            const hasBonus = customerBookings.some(b => b.bonusHoursApplied);
                            const whatsappNumber = customerBookings[0]?.whatsappNumber;
                            
                            if (!whatsappNumber || (!hasDiscount && !hasBonus)) return null;
                            
                            return (
                              <div className="flex items-center gap-1.5">
                                {hasDiscount && (
                                  <Badge 
                                    variant="outline" 
                                    className="cursor-pointer bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                                    onClick={() => setPromotionDialog({
                                      open: true,
                                      whatsappNumber: whatsappNumber,
                                      customerName: customerName
                                    })}
                                    data-testid={`badge-discount-${customerName}`}
                                  >
                                    <Percent className="h-3 w-3 mr-1" />
                                    Discount
                                  </Badge>
                                )}
                                {hasBonus && (
                                  <Badge 
                                    variant="outline" 
                                    className="cursor-pointer bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-950/50"
                                    onClick={() => setPromotionDialog({
                                      open: true,
                                      whatsappNumber: whatsappNumber,
                                      customerName: customerName
                                    })}
                                    data-testid={`badge-bonus-${customerName}`}
                                  >
                                    <Gift className="h-3 w-3 mr-1" />
                                    Bonus
                                  </Badge>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectAllForCustomer(customerName)}
                            data-testid={`button-select-all-${customerName}`}
                            className="h-8"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            {allSelected ? 'Deselect All' : someSelected ? 'Select All' : 'Select All'}
                          </Button>
                          {customerBookings[0]?.whatsappNumber && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLoyaltyDialog({
                                open: true,
                                whatsappNumber: customerBookings[0].whatsappNumber || "",
                                customerName: customerName
                              })}
                              data-testid={`button-loyalty-${customerName}`}
                              className="h-8 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white border-yellow-600 shadow-lg shadow-yellow-500/50"
                            >
                              <Award className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>,
                  ...customerBookings.map((booking, bookingIndex) => {
                const hasFoodOrders = booking.foodOrders && booking.foodOrders.length > 0;
                const foodTotal = hasFoodOrders 
                  ? booking.foodOrders!.reduce((sum, order) => sum + parseFloat(order.price) * order.quantity, 0)
                  : 0;
                const totalAmount = parseFloat(booking.price) + foodTotal;
                const isSelected = selectedBookings?.has(booking.id);
                
                return (
                  <TableRow 
                    key={booking.id} 
                    data-testid={`row-booking-${booking.id}`}
                    className={isSelected ? "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50" : ""}
                  >
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
                    <TableCell data-testid={`text-persons-${booking.id}`}>
                      {booking.personCount || 1}
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
                    {showTypeColumn && (
                      <TableCell data-testid={`text-type-${booking.id}`}>
                        <div className="flex flex-wrap gap-1">
                          {booking.bookingType?.includes("walk-in") && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                              Walk-in
                            </span>
                          )}
                          {booking.bookingType?.includes("upcoming") && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              Upcoming
                            </span>
                          )}
                          {booking.bookingType?.includes("happy-hours") && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                              Happy Hours
                            </span>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell data-testid={`text-start-${booking.id}`}>
                      {(() => {
                        const hours = booking.startTime.getHours();
                        const minutes = booking.startTime.getMinutes();
                        const period = hours < 12 ? 'AM' : 'PM';
                        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                        return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
                      })()}
                    </TableCell>
                    <TableCell data-testid={`text-end-${booking.id}`}>
                      {(() => {
                        const hours = booking.endTime.getHours();
                        const minutes = booking.endTime.getMinutes();
                        const period = hours < 12 ? 'AM' : 'PM';
                        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                        return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
                      })()}
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
                          {(booking.status === "running" || booking.status === "paused") && canMakeChanges && (
                            <DropdownMenuItem
                              onClick={() => {
                                const category = booking.seatName.split('-')[0];
                                setSeatChangeDialog({
                                  open: true,
                                  bookingId: booking.id,
                                  currentSeat: booking.seatName,
                                  category: category
                                });
                              }}
                              data-testid={`action-change-seat-${booking.id}`}
                            >
                              <ArrowRightLeft className="mr-2 h-4 w-4" />
                              Change Seat
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              }),
                ];
              }).flat()
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={loyaltyDialog.open} onOpenChange={(open) => setLoyaltyDialog({...loyaltyDialog, open})}>
        <DialogContent className="max-w-md" data-testid="dialog-customer-loyalty">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              {loyaltyDialog.customerName} - Loyalty Status
            </DialogTitle>
            <DialogDescription>
              Customer loyalty rewards and tier information
            </DialogDescription>
          </DialogHeader>
          
          {customerLoyalty ? (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Available Points</span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {customerLoyalty.pointsAvailable}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Spent</span>
                      <span className="text-lg font-semibold">₹{customerLoyalty.totalSpent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Tier</span>
                      {customerTier && (
                        <Badge style={{ backgroundColor: customerTier.tierColor }}>
                          <Award className="mr-1 h-3 w-3" />
                          {customerTier.tierName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Available Rewards</h3>
                {eligibleRewards.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No rewards available yet. Keep spending to unlock rewards!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {eligibleRewards.map((reward: any) => {
                      return (
                        <Card 
                          key={reward.id} 
                          className="border-l-4 border-l-purple-500"
                          data-testid={`available-reward-${reward.id}`}
                        >
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900 dark:text-white">{reward.name}</span>
                                <Badge className="capitalize" variant="outline">{reward.cardType || 'bronze'}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {reward.description}
                              </p>
                              <div className="flex items-center gap-2">
                                {getRewardIcon(reward.rewardType || 'discount')}
                                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                                  {reward.rewardType === 'free_hour' ? `${reward.value} hrs` : reward.rewardType === 'free_food' ? `₹${reward.value} food` : `₹${reward.value}`}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Requires {reward.pointCost || 0} points
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground text-center py-4">
                  No loyalty data found for this customer.
                </p>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setLoyaltyDialog({open: false, whatsappNumber: "", customerName: ""});
              }}
              data-testid="button-close-loyalty"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PromotionUsageDialog
        open={promotionDialog.open}
        onOpenChange={(open) => setPromotionDialog({...promotionDialog, open})}
        whatsappNumber={promotionDialog.whatsappNumber}
        customerName={promotionDialog.customerName}
      />

      <Dialog open={seatChangeDialog.open} onOpenChange={(open) => setSeatChangeDialog({...seatChangeDialog, open})}>
        <DialogContent className="max-w-md" data-testid="dialog-seat-change">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-500" />
              Change Seat
            </DialogTitle>
            <DialogDescription>
              Select a new available seat to move this booking
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Current Seat:</p>
              <p className="text-lg font-semibold">{seatChangeDialog.currentSeat}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Select New Seat:</p>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {availableSeatsForChange
                  .filter((seat: any) => seat.category === seatChangeDialog.category)
                  .flatMap((seat: any) => seat.availableSeats)
                  .filter((seatName: string) => seatName !== seatChangeDialog.currentSeat)
                  .map((seatName: string) => (
                    <Button
                      key={seatName}
                      variant="outline"
                      className="h-12"
                      onClick={() => {
                        changeSeatMutation.mutate({
                          bookingId: seatChangeDialog.bookingId,
                          newSeatName: seatName
                        });
                      }}
                      disabled={changeSeatMutation.isPending}
                      data-testid={`button-select-seat-${seatName}`}
                    >
                      {seatName}
                    </Button>
                  ))}
              </div>
              {availableSeatsForChange
                .filter((seat: any) => seat.category === seatChangeDialog.category)
                .flatMap((seat: any) => seat.availableSeats)
                .filter((seatName: string) => seatName !== seatChangeDialog.currentSeat).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No available seats in this category
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSeatChangeDialog({open: false, bookingId: "", currentSeat: "", category: ""})}
              data-testid="button-cancel-seat-change"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
