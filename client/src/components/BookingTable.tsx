import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Clock, X, Check, UtensilsCrossed, Search, Plus, MoreVertical, Trash2, Play, Pause, Gift, Percent, IndianRupee, ArrowRightLeft, Monitor, User, Phone, Users, Calendar, LayoutGrid, Table2 } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  bookingCode?: string;
  groupId?: string;
  groupCode?: string;
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
  isPromotionalDiscount?: number;
  isPromotionalBonus?: number;
  manualDiscountPercentage?: number;
  manualFreeHours?: string;
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
  const [seatChangeDialog, setSeatChangeDialog] = useState<{open: boolean, bookingId: string, currentSeat: string, category: string}>({open: false, bookingId: "", currentSeat: "", category: ""});
  const [selectedNewSeat, setSelectedNewSeat] = useState("");
  const [showRefreshDialog, setShowRefreshDialog] = useState(false);

  // View mode state with localStorage persistence and responsive defaults
  const getDefaultViewMode = (): "table" | "card" => {
    const saved = localStorage.getItem("booking-view-mode");
    if (saved === "table" || saved === "card") return saved;
    // Responsive default: mobile=card, desktop=table
    return window.matchMedia("(max-width: 768px)").matches ? "card" : "table";
  };
  
  const [viewMode, setViewMode] = useState<"table" | "card">(getDefaultViewMode);

  useEffect(() => {
    localStorage.setItem("booking-view-mode", viewMode);
  }, [viewMode]);

  const { data: deviceConfigs = [] } = useQuery<any[]>({
    queryKey: ["/api/device-config"],
  });

  const occupiedSeats = useMemo(() => {
    return new Set(
      bookings
        .filter(b => b.status === 'running' || b.status === 'paused' || b.status === 'upcoming')
        .map(b => b.seatName)
    );
  }, [bookings]);

  const availableSeatsForChange = useMemo(() => {
    return deviceConfigs.map(config => ({
      category: config.category,
      availableSeats: (config.seats || []).filter((seat: string) => !occupiedSeats.has(seat))
    }));
  }, [deviceConfigs, occupiedSeats]);

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
      setShowRefreshDialog(true);
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

  const filteredBookings = bookings.filter((booking) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      booking.seatName.toLowerCase().includes(searchLower) ||
      booking.customerName.toLowerCase().includes(searchLower) ||
      (booking.whatsappNumber && booking.whatsappNumber.includes(searchTerm))
    );
  });

  // Group bookings by groupId first (for multi-device sessions), then by individual bookings
  const groupedSessions = useMemo(() => {
    const sessions: { key: string; bookings: Booking[]; isGrouped: boolean }[] = [];
    const groupedByGroupId = new Map<string, Booking[]>();
    const individualBookings: Booking[] = [];

    filteredBookings.forEach(booking => {
      if (booking.groupId) {
        if (!groupedByGroupId.has(booking.groupId)) {
          groupedByGroupId.set(booking.groupId, []);
        }
        groupedByGroupId.get(booking.groupId)!.push(booking);
      } else {
        individualBookings.push(booking);
      }
    });

    // Add grouped sessions
    groupedByGroupId.forEach((bookings, groupId) => {
      sessions.push({ key: groupId, bookings, isGrouped: true });
    });

    // Add individual bookings as single-booking sessions
    individualBookings.forEach(booking => {
      sessions.push({ key: booking.id, bookings: [booking], isGrouped: false });
    });

    return sessions;
  }, [filteredBookings]);


  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
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
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-8 px-3"
                  data-testid="button-table-view"
                >
                  <Table2 className="h-4 w-4 mr-2" />
                  Table
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View bookings in detailed table format showing all information</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === "card" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                  className="h-8 px-3"
                  data-testid="button-card-view"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Cards
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View bookings grouped by customer in card layout (better for mobile)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            No bookings found
          </CardContent>
        </Card>
      ) : viewMode === "card" ? (
        <div className="space-y-3">
          {groupedSessions.map((session) => {
            const sessionBookings = session.bookings;
            const firstBooking = sessionBookings[0];
            const sessionBookingIds = sessionBookings.map(b => b.id);
            const allSelected = sessionBookingIds.every(id => selectedBookings?.has(id));
            const someSelected = sessionBookingIds.some(id => selectedBookings?.has(id));
            const sessionTotal = sessionBookings.reduce((sum, booking) => {
              const foodTotal = booking.foodOrders 
                ? booking.foodOrders.reduce((fSum, order) => fSum + parseFloat(order.price) * order.quantity, 0)
                : 0;
              return sum + parseFloat(booking.price) + foodTotal;
            }, 0);

            const hasPromotionalDiscount = sessionBookings.some(b => b.isPromotionalDiscount === 1);
            const hasManualDiscount = sessionBookings.some(b => b.manualDiscountPercentage && b.manualDiscountPercentage > 0);
            const hasPromotionalBonus = sessionBookings.some(b => b.isPromotionalBonus === 1);
            const hasManualBonus = sessionBookings.some(b => b.manualFreeHours);
            const hasGenericDiscount = sessionBookings.some(b => b.discountApplied);
            const hasGenericBonus = sessionBookings.some(b => b.bonusHoursApplied);
            const showSpecificBadges = hasPromotionalDiscount || hasManualDiscount || hasPromotionalBonus || hasManualBonus;
            const showGenericBadges = !showSpecificBadges && (hasGenericDiscount || hasGenericBonus);
            const deviceNames = sessionBookings.map(b => b.seatName).join(", ");

            return (
              <Card 
                key={session.key}
                className={`glass-card border rounded-lg overflow-hidden ${allSelected ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700" : ""}`}
                data-testid={`session-card-${session.key}`}
              >
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Session Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => {
                            sessionBookingIds.forEach(id => {
                              if (allSelected) {
                                if (selectedBookings?.has(id)) onToggleSelection?.(id);
                              } else {
                                if (!selectedBookings?.has(id)) onToggleSelection?.(id);
                              }
                            });
                          }}
                          data-testid={`checkbox-session-${session.key}`}
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <User className="h-5 w-5 text-primary" />
                            <span className="text-lg font-bold text-foreground" data-testid={`text-customer-${session.key}`}>
                              {firstBooking.customerName}
                            </span>
                            <StatusBadge status={firstBooking.status} />
                          </div>
                          {/* Devices List */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            {session.isGrouped ? (
                              <div className="flex flex-col gap-1">
                                {sessionBookings.map((booking, idx) => (
                                  <div key={booking.id} className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-sm font-bold" data-testid={`badge-device-${booking.id}`}>
                                      {booking.seatName}
                                    </Badge>
                                    {booking.bookingCode && (
                                      <Badge variant="secondary" className="text-xs font-mono">
                                        {booking.bookingCode}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-sm font-bold" data-testid={`badge-device-${firstBooking.id}`}>
                                  {firstBooking.seatName}
                                </Badge>
                                {firstBooking.bookingCode && (
                                  <Badge variant="secondary" className="text-xs font-mono">
                                    {firstBooking.bookingCode}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Group ID Badge */}
                          {session.isGrouped && firstBooking.groupCode && (
                            <Badge variant="outline" className="text-xs font-mono bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" data-testid={`badge-group-${session.key}`}>
                              <Users className="h-3 w-3 mr-1" />
                              Group: {firstBooking.groupCode}
                            </Badge>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            {firstBooking.whatsappNumber && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {firstBooking.whatsappNumber}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {firstBooking.personCount || 1} {(firstBooking.personCount || 1) === 1 ? 'Person' : 'Persons'}
                            </div>
                            {showDateColumn && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {firstBooking.startTime.toLocaleDateString('en-GB', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric',
                                  timeZone: 'Asia/Kolkata'
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-lg font-bold text-primary">₹{sessionTotal.toFixed(0)}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${session.key}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {firstBooking.status === "running" && onExtend && (
                              <DropdownMenuItem onClick={() => sessionBookingIds.forEach(id => onExtend(id))}>
                                <Clock className="mr-2 h-4 w-4" />
                                Extend Time (All)
                              </DropdownMenuItem>
                            )}
                            {firstBooking.status === "running" && onStopTimer && (
                              <DropdownMenuItem onClick={() => sessionBookingIds.forEach(id => onStopTimer(id))}>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause (All)
                              </DropdownMenuItem>
                            )}
                            {firstBooking.status === "running" && onEnd && (
                              <DropdownMenuItem onClick={() => sessionBookingIds.forEach(id => onEnd(id))} className="text-destructive">
                                <X className="mr-2 h-4 w-4" />
                                End Session (All)
                              </DropdownMenuItem>
                            )}
                            {onAddFood && (
                              <DropdownMenuItem onClick={() => onAddFood(firstBooking.id)}>
                                <UtensilsCrossed className="mr-2 h-4 w-4" />
                                Add Food
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatTime(firstBooking.startTime)} - {formatTime(firstBooking.endTime)}
                        </span>
                      </div>
                      {firstBooking.status === "running" && (
                        <SessionTimer
                          endTime={firstBooking.endTime}
                        />
                      )}
                    </div>

                    {/* Promotion Badges */}
                    {(showSpecificBadges || showGenericBadges) && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {hasPromotionalDiscount && (
                          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs">
                            <Percent className="h-3 w-3 mr-1" />
                            Promo Discount
                          </Badge>
                        )}
                        {hasManualDiscount && (
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-xs">
                            <IndianRupee className="h-3 w-3 mr-1" />
                            Discount
                          </Badge>
                        )}
                        {hasPromotionalBonus && (
                          <Badge variant="outline" className="bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 text-xs">
                            <Gift className="h-3 w-3 mr-1" />
                            Promo Bonus
                          </Badge>
                        )}
                        {hasManualBonus && (
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Bonus
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Food Orders */}
                    {sessionBookings.some(b => b.foodOrders && b.foodOrders.length > 0) && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <UtensilsCrossed className="h-4 w-4" />
                          Food Orders
                        </div>
                        {sessionBookings.map(booking => 
                          booking.foodOrders?.map((order, idx) => (
                            <div key={`${booking.id}-food-${idx}`} className="flex items-center justify-between text-sm bg-muted/30 rounded px-2 py-1">
                              <span>{order.foodName} x{order.quantity}</span>
                              <div className="flex items-center gap-2">
                                <span>₹{(parseFloat(order.price) * order.quantity).toFixed(0)}</span>
                                {onDeleteFood && canMakeChanges && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => onDeleteFood(booking.id, idx)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {groupedSessions.map((session) => {
            const sessionBookings = session.bookings;
            const sessionBookingIds = sessionBookings.map(b => b.id);
            const allSelected = sessionBookingIds.every(id => selectedBookings?.has(id));
            const pcCount = sessionBookings.length;
            const firstBooking = sessionBookings[0];
            
            const baseTotal = sessionBookings.reduce((sum, booking) => 
              sum + parseFloat(booking.price), 0);
            
            const foodTotal = sessionBookings.reduce((sum, booking) => {
              return sum + (booking.foodOrders?.reduce((fSum, order) => 
                fSum + parseFloat(order.price) * order.quantity, 0) || 0);
            }, 0);
            
            const grandTotal = baseTotal + foodTotal;
            const deviceNames = sessionBookings.map(b => b.seatName).join(", ");

            const headerLabel = session.isGrouped && firstBooking.groupCode 
              ? `Group: ${firstBooking.groupCode}` 
              : session.isGrouped 
                ? `Group Session` 
                : firstBooking.seatName;

            return (
              <div 
                key={session.key} 
                className={`rounded-lg border glass-card overflow-hidden ${allSelected ? "border-blue-400 dark:border-blue-600" : ""}`}
                data-testid={`session-group-${session.key}`}
              >
                <div className={`flex items-center justify-between gap-4 px-4 py-3 bg-muted/50 border-b ${allSelected ? "bg-blue-50 dark:bg-blue-950/30" : ""}`}>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => {
                        sessionBookingIds.forEach(id => {
                          if (allSelected) {
                            if (selectedBookings?.has(id)) onToggleSelection?.(id);
                          } else {
                            if (!selectedBookings?.has(id)) onToggleSelection?.(id);
                          }
                        });
                      }}
                      data-testid={`checkbox-session-${session.key}`}
                    />
                    <div className="flex items-center gap-3 flex-wrap">
                      {session.isGrouped ? (
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Monitor className="h-5 w-5 text-primary" />
                      )}
                      <span className="text-lg font-bold text-foreground" data-testid={`text-header-${session.key}`}>
                        {headerLabel}
                      </span>
                      {session.isGrouped && (
                        <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                          {pcCount} {pcCount === 1 ? 'Device' : 'Devices'}: {deviceNames}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        <User className="h-3 w-3 mr-1" />
                        {firstBooking.customerName}
                      </Badge>
                      <StatusBadge status={firstBooking.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-primary" data-testid={`text-total-${session.key}`}>
                      Total: ₹{grandTotal.toFixed(0)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-actions-session-${session.key}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {firstBooking.status === "running" && onExtend && (
                          <DropdownMenuItem onClick={() => sessionBookingIds.forEach(id => onExtend(id))}>
                            <Clock className="mr-2 h-4 w-4" />
                            Extend All
                          </DropdownMenuItem>
                        )}
                        {firstBooking.status === "running" && onStopTimer && (
                          <DropdownMenuItem onClick={() => sessionBookingIds.forEach(id => onStopTimer(id))}>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause All
                          </DropdownMenuItem>
                        )}
                        {firstBooking.status === "running" && onEnd && (
                          <DropdownMenuItem onClick={() => sessionBookingIds.forEach(id => onEnd(id))} className="text-destructive">
                            <X className="mr-2 h-4 w-4" />
                            End All
                          </DropdownMenuItem>
                        )}
                        {onAddFood && (
                          <DropdownMenuItem onClick={() => onAddFood(firstBooking.id)}>
                            <UtensilsCrossed className="mr-2 h-4 w-4" />
                            Add Food
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20">
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="whitespace-nowrap">Device</TableHead>
                        <TableHead className="whitespace-nowrap">Customer</TableHead>
                        <TableHead className="whitespace-nowrap">Persons</TableHead>
                        <TableHead className="whitespace-nowrap">WhatsApp</TableHead>
                        {showDateColumn && <TableHead className="whitespace-nowrap">Date</TableHead>}
                        {showTypeColumn && <TableHead className="whitespace-nowrap">Type</TableHead>}
                        <TableHead className="whitespace-nowrap">Start</TableHead>
                        <TableHead className="whitespace-nowrap">End</TableHead>
                        <TableHead className="whitespace-nowrap">Time Left</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap">Price</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionBookings.map((booking) => {
                        const bookingFoodTotal = booking.foodOrders?.reduce((sum, order) => 
                          sum + parseFloat(order.price) * order.quantity, 0) || 0;
                        const bookingTotal = parseFloat(booking.price) + bookingFoodTotal;
                        const isSelected = selectedBookings?.has(booking.id);
                        
                        return (
                          <TableRow 
                            key={booking.id}
                            className={isSelected ? "bg-blue-50 dark:bg-blue-950/30" : ""}
                          >
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => onToggleSelection?.(booking.id)}
                                data-testid={`checkbox-booking-${booking.id}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-sm font-bold" data-testid={`badge-device-${booking.id}`}>
                                  {booking.seatName}
                                </Badge>
                                {booking.bookingCode && (
                                  <Badge variant="secondary" className="text-xs font-mono">
                                    {booking.bookingCode}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{booking.customerName}</TableCell>
                            <TableCell>{booking.personCount || 1}</TableCell>
                            <TableCell>{booking.whatsappNumber || '-'}</TableCell>
                            {showDateColumn && (
                              <TableCell>
                                {booking.startTime.toLocaleDateString('en-GB', { 
                                  day: '2-digit', 
                                  month: 'short',
                                  year: 'numeric',
                                  timeZone: 'Asia/Kolkata'
                                })}
                              </TableCell>
                            )}
                            {showTypeColumn && (
                              <TableCell>
                                {booking.bookingType?.includes("walk-in") && (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">Walk-in</Badge>
                                )}
                              </TableCell>
                            )}
                            <TableCell>{formatTime(booking.startTime)}</TableCell>
                            <TableCell>{formatTime(booking.endTime)}</TableCell>
                            <TableCell>
                              {booking.status === "running" && <SessionTimer endTime={booking.endTime} />}
                              {booking.status === "paused" && (
                                <div className="flex items-center gap-1 text-amber-600">
                                  <Pause className="h-3 w-3" />
                                  <span className="text-xs">Paused</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell><StatusBadge status={booking.status} /></TableCell>
                            <TableCell className="font-medium">₹{bookingTotal.toFixed(0)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" data-testid={`button-actions-booking-${booking.id}`}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {booking.status === "running" && onExtend && (
                                    <DropdownMenuItem onClick={() => onExtend(booking.id)}>
                                      <Clock className="mr-2 h-4 w-4" />
                                      Extend
                                    </DropdownMenuItem>
                                  )}
                                  {booking.status === "running" && onStopTimer && (
                                    <DropdownMenuItem onClick={() => onStopTimer(booking.id)}>
                                      <Pause className="mr-2 h-4 w-4" />
                                      Pause
                                    </DropdownMenuItem>
                                  )}
                                  {booking.status === "running" && onEnd && (
                                    <DropdownMenuItem onClick={() => onEnd(booking.id)} className="text-destructive">
                                      <X className="mr-2 h-4 w-4" />
                                      End
                                    </DropdownMenuItem>
                                  )}
                                  {onAddFood && (
                                    <DropdownMenuItem onClick={() => onAddFood(booking.id)}>
                                      <UtensilsCrossed className="mr-2 h-4 w-4" />
                                      Add Food
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={seatChangeDialog.open} onOpenChange={(open) => setSeatChangeDialog({...seatChangeDialog, open})}>
        <DialogContent className="max-w-2xl" data-testid="dialog-seat-change">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <ArrowRightLeft className="h-6 w-6 text-white" />
              </div>
              Change Seat
            </DialogTitle>
            <DialogDescription className="text-base">
              Select a new available seat from {seatChangeDialog.category} category
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="relative overflow-hidden p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
              <div className="relative flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Current Seat</p>
                  <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{seatChangeDialog.currentSeat}</p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">{seatChangeDialog.category}</p>
                </div>
                <div className="p-3 bg-white/80 dark:bg-gray-900/80 rounded-full backdrop-blur-sm">
                  <Monitor className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Available Seats
                </p>
                <Badge variant="secondary" className="text-xs">
                  {availableSeatsForChange
                    .filter((seat: any) => seat.category === seatChangeDialog.category)
                    .flatMap((seat: any) => seat.availableSeats)
                    .filter((seatName: string) => seatName !== seatChangeDialog.currentSeat).length} seats
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-1">
                {availableSeatsForChange
                  .filter((seat: any) => seat.category === seatChangeDialog.category)
                  .flatMap((seat: any) => seat.availableSeats)
                  .filter((seatName: string) => seatName !== seatChangeDialog.currentSeat)
                  .map((seatName: string) => (
                    <Button
                      key={seatName}
                      variant={selectedNewSeat === seatName ? "default" : "outline"}
                      className={`h-auto py-4 text-lg font-bold transition-all ${
                        selectedNewSeat === seatName 
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg scale-105"
                          : "border-2 hover:border-blue-400"
                      }`}
                      onClick={() => setSelectedNewSeat(seatName)}
                      data-testid={`button-select-seat-${seatName}`}
                    >
                      {seatName}
                    </Button>
                  ))}
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSeatChangeDialog({ open: false, bookingId: "", currentSeat: "", category: "" });
                setSelectedNewSeat("");
              }}
              className="px-6"
              data-testid="button-cancel-seat-change"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedNewSeat && seatChangeDialog.bookingId) {
                  changeSeatMutation.mutate({ bookingId: seatChangeDialog.bookingId, newSeatName: selectedNewSeat });
                }
              }}
              disabled={!selectedNewSeat || changeSeatMutation?.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 shadow-lg"
              data-testid="button-confirm-seat-change"
            >
              {changeSeatMutation?.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Changing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Change to {selectedNewSeat || "..."}
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRefreshDialog} onOpenChange={setShowRefreshDialog}>
        <DialogContent data-testid="dialog-refresh-prompt">
          <DialogHeader>
            <DialogTitle>Seat Changed Successfully</DialogTitle>
            <DialogDescription>
              The seat has been updated. Please refresh the page to see the changes reflected in the seat availability.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefreshDialog(false)}
              data-testid="button-close-refresh"
            >
              Close
            </Button>
            <Button
              onClick={() => window.location.reload()}
              data-testid="button-refresh-page"
            >
              Refresh Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
