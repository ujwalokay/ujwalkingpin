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
        <Accordion type="multiple" className="space-y-3" defaultValue={Array.from(groupedByCustomer.keys())}>
          {Array.from(groupedByCustomer.entries()).map(([customerName, customerBookings], groupIndex) => {
            const customerBookingIds = customerBookings.map(b => b.id);
            const allSelected = customerBookingIds.every(id => selectedBookings?.has(id));
            const someSelected = customerBookingIds.some(id => selectedBookings?.has(id));
            const customerTotal = customerBookings.reduce((sum, booking) => {
              const foodTotal = booking.foodOrders 
                ? booking.foodOrders.reduce((fSum, order) => fSum + parseFloat(order.price) * order.quantity, 0)
                : 0;
              return sum + parseFloat(booking.price) + foodTotal;
            }, 0);

            const hasPromotionalDiscount = customerBookings.some(b => b.isPromotionalDiscount === 1);
            const hasManualDiscount = customerBookings.some(b => b.manualDiscountPercentage && b.manualDiscountPercentage > 0);
            const hasPromotionalBonus = customerBookings.some(b => b.isPromotionalBonus === 1);
            const hasManualBonus = customerBookings.some(b => b.manualFreeHours);
            const hasGenericDiscount = customerBookings.some(b => b.discountApplied);
            const hasGenericBonus = customerBookings.some(b => b.bonusHoursApplied);
            const showSpecificBadges = hasPromotionalDiscount || hasManualDiscount || hasPromotionalBonus || hasManualBonus;
            const showGenericBadges = !showSpecificBadges && (hasGenericDiscount || hasGenericBonus);

            return (
              <AccordionItem 
                key={`customer-${customerName}-${groupIndex}`} 
                value={customerName}
                className="glass-card border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50" data-testid={`accordion-trigger-${customerName}`}>
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground" data-testid={`customer-group-${customerName}`}>
                          {customerName}
                        </h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {customerBookings.length} PC{customerBookings.length > 1 ? 's' : ''}
                      </Badge>
                      {customerBookings[0]?.groupCode && (
                        <Badge variant="outline" className="text-xs font-mono" data-testid={`badge-group-code-header-${customerName}`}>
                          <Users className="h-3 w-3 mr-1" />
                          {customerBookings[0].groupCode}
                        </Badge>
                      )}
                      <span className="text-base font-bold text-primary">
                        ₹{customerTotal.toFixed(0)}
                      </span>
                      {(showSpecificBadges || showGenericBadges) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {hasPromotionalDiscount && (
                            <Badge 
                              variant="outline" 
                              className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs"
                              data-testid={`badge-promotional-discount-${customerName}`}
                            >
                              <Percent className="h-3 w-3 mr-1" />
                              Promo Discount
                            </Badge>
                          )}
                          {hasManualDiscount && (
                            <Badge 
                              variant="outline" 
                              className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-xs"
                              data-testid={`badge-addons-discount-${customerName}`}
                            >
                              <IndianRupee className="h-3 w-3 mr-1" />
                              Discount
                            </Badge>
                          )}
                          {hasPromotionalBonus && (
                            <Badge 
                              variant="outline" 
                              className="bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 text-xs"
                              data-testid={`badge-promotional-bonus-${customerName}`}
                            >
                              <Gift className="h-3 w-3 mr-1" />
                              Promo Bonus
                            </Badge>
                          )}
                          {hasManualBonus && (
                            <Badge 
                              variant="outline" 
                              className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs"
                              data-testid={`badge-addons-bonus-${customerName}`}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Bonus
                            </Badge>
                          )}
                          {showGenericBadges && hasGenericDiscount && (
                            <Badge 
                              variant="outline" 
                              className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs"
                              data-testid={`badge-discount-${customerName}`}
                            >
                              <Percent className="h-3 w-3 mr-1" />
                              Discount
                            </Badge>
                          )}
                          {showGenericBadges && hasGenericBonus && (
                            <Badge 
                              variant="outline" 
                              className="bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 text-xs"
                              data-testid={`badge-bonus-${customerName}`}
                            >
                              <Gift className="h-3 w-3 mr-1" />
                              Bonus
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAllForCustomer(customerName);
                      }}
                      data-testid={`button-select-all-${customerName}`}
                      className="h-8"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {allSelected ? 'Deselect' : someSelected ? 'Select' : 'Select'}
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <div className="space-y-3">
                    {customerBookings.map((booking) => {
                      const hasFoodOrders = booking.foodOrders && booking.foodOrders.length > 0;
                      const foodTotal = hasFoodOrders 
                        ? booking.foodOrders!.reduce((sum, order) => sum + parseFloat(order.price) * order.quantity, 0)
                        : 0;
                      const totalAmount = parseFloat(booking.price) + foodTotal;
                      const isSelected = selectedBookings?.has(booking.id);
                      
                      return (
                        <Card 
                          key={booking.id}
                          className={`${isSelected ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700" : "bg-card"} transition-colors`}
                          data-testid={`card-booking-${booking.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <Checkbox
                                    checked={selectedBookings?.has(booking.id) || false}
                                    onCheckedChange={() => onToggleSelection?.(booking.id)}
                                    data-testid={`checkbox-booking-${booking.id}`}
                                  />
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xl font-bold text-primary" data-testid={`text-seat-${booking.id}`}>
                                        {booking.seatName}
                                      </span>
                                      <StatusBadge status={booking.status} />
                                      {booking.bookingCode && (
                                        <Badge variant="outline" className="text-xs font-mono" data-testid={`badge-booking-code-${booking.id}`}>
                                          {booking.bookingCode}
                                        </Badge>
                                      )}
                                      {booking.groupCode && (
                                        <Badge variant="secondary" className="text-xs font-mono" data-testid={`badge-group-code-${booking.id}`}>
                                          <Users className="h-3 w-3 mr-1" />
                                          {booking.groupCode}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                      {booking.whatsappNumber && (
                                        <div className="flex items-center gap-1" data-testid={`text-whatsapp-${booking.id}`}>
                                          <Phone className="h-3.5 w-3.5" />
                                          {booking.whatsappNumber}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1" data-testid={`text-persons-${booking.id}`}>
                                        <Users className="h-3.5 w-3.5" />
                                        {booking.personCount || 1} {booking.personCount === 1 ? 'Person' : 'Persons'}
                                      </div>
                                      {showDateColumn && (
                                        <div className="flex items-center gap-1" data-testid={`text-date-${booking.id}`}>
                                          <Calendar className="h-3.5 w-3.5" />
                                          {booking.startTime.toLocaleDateString('en-GB', { 
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
                              </div>

                              {showTypeColumn && booking.bookingType && booking.bookingType.length > 0 && (
                                <div className="flex flex-wrap gap-1" data-testid={`text-type-${booking.id}`}>
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
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">Start Time</p>
                                  <p className="text-sm font-semibold" data-testid={`text-start-${booking.id}`}>
                                    {formatTime(booking.startTime)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">End Time</p>
                                  <p className="text-sm font-semibold" data-testid={`text-end-${booking.id}`}>
                                    {formatTime(booking.endTime)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">Time Left</p>
                                  <div>
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
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground font-medium">Session Price</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-bold text-primary" data-testid={`text-price-${booking.id}`}>
                                      ₹{booking.price}
                                    </p>
                                    {booking.manualDiscountPercentage && (
                                      <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300" data-testid={`badge-discount-${booking.id}`}>
                                        Discount
                                      </Badge>
                                    )}
                                    {booking.manualFreeHours && (
                                      <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" data-testid={`badge-free-hour-${booking.id}`}>
                                        Free Hour
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {hasFoodOrders && (
                                <div className="border-t pt-3 space-y-2">
                                  <p className="text-sm font-semibold flex items-center gap-2">
                                    <UtensilsCrossed className="h-4 w-4" />
                                    Food Orders
                                  </p>
                                  <div className="space-y-1.5">
                                    {booking.foodOrders!.map((order, index) => (
                                      <div
                                        key={index}
                                        className="flex justify-between items-center py-2 px-3 bg-muted/50 rounded-md"
                                        data-testid={`food-order-${booking.id}-${index}`}
                                      >
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">{order.foodName}</p>
                                          <p className="text-xs text-muted-foreground">Qty: {order.quantity} × ₹{order.price}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-semibold">
                                            ₹{(parseFloat(order.price) * order.quantity).toFixed(0)}
                                          </p>
                                          {onDeleteFood && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-destructive hover:text-destructive"
                                              onClick={() => onDeleteFood(booking.id, index)}
                                              data-testid={`button-delete-food-${booking.id}-${index}`}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t">
                                      <p className="text-sm font-semibold">Food Total:</p>
                                      <p className="text-sm font-bold text-primary">
                                        ₹{foodTotal.toFixed(0)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="border-t pt-3 flex justify-between items-center">
                                <p className="text-base font-bold">Grand Total:</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid={`text-total-${booking.id}`}>
                                  ₹{totalAmount.toFixed(0)}
                                </p>
                              </div>
                            </div>
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
      ) : (
        <div className="rounded-md border glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 sm:w-12"></TableHead>
                  <TableHead className="whitespace-nowrap">Seat</TableHead>
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  <TableHead className="whitespace-nowrap">Persons</TableHead>
                  <TableHead className="whitespace-nowrap">WhatsApp</TableHead>
                  {showDateColumn && <TableHead className="whitespace-nowrap">Date</TableHead>}
                  {showTypeColumn && <TableHead className="whitespace-nowrap">Type</TableHead>}
                  <TableHead className="whitespace-nowrap">Start</TableHead>
                  <TableHead className="whitespace-nowrap">End</TableHead>
                  <TableHead className="whitespace-nowrap">Time Left</TableHead>
                  <TableHead className="whitespace-nowrap">Price</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Food</TableHead>
                  <TableHead className="whitespace-nowrap">Total</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(groupedByCustomer.entries()).map(([customerName, customerBookings], groupIndex) => {
                  const customerBookingIds = customerBookings.map(b => b.id);
                  const allSelected = customerBookingIds.every(id => selectedBookings?.has(id));
                  const someSelected = customerBookingIds.some(id => selectedBookings?.has(id));
                  const customerTotal = customerBookings.reduce((sum, booking) => {
                    const foodTotal = booking.foodOrders 
                      ? booking.foodOrders.reduce((fSum, order) => fSum + parseFloat(order.price) * order.quantity, 0)
                      : 0;
                    return sum + parseFloat(booking.price) + foodTotal;
                  }, 0);

                  const hasPromotionalDiscount = customerBookings.some(b => b.isPromotionalDiscount === 1);
                  const hasManualDiscount = customerBookings.some(b => b.manualDiscountPercentage && b.manualDiscountPercentage > 0);
                  const hasPromotionalBonus = customerBookings.some(b => b.isPromotionalBonus === 1);
                  const hasManualBonus = customerBookings.some(b => b.manualFreeHours);
                  const hasGenericDiscount = customerBookings.some(b => b.discountApplied);
                  const hasGenericBonus = customerBookings.some(b => b.bonusHoursApplied);
                  const showSpecificBadges = hasPromotionalDiscount || hasManualDiscount || hasPromotionalBonus || hasManualBonus;
                  const showGenericBadges = !showSpecificBadges && (hasGenericDiscount || hasGenericBonus);

                  return [
                    <TableRow 
                      key={`customer-header-${customerName}-${groupIndex}`}
                      className="bg-muted/50 hover:bg-muted/50 border-t-2 border-primary/20"
                    >
                      <TableCell colSpan={13 + (showDateColumn ? 1 : 0) + (showTypeColumn ? 1 : 0)} className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-base font-bold" data-testid={`customer-group-${customerName}`}>
                              {customerName}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              ({customerBookings.length} PC{customerBookings.length > 1 ? 's' : ''})
                            </span>
                            <span className="text-sm font-semibold text-primary">
                              Total: ₹{customerTotal.toFixed(0)}
                            </span>
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
                                {showGenericBadges && hasGenericDiscount && (
                                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs">
                                    <Percent className="h-3 w-3 mr-1" />
                                    Discount
                                  </Badge>
                                )}
                                {showGenericBadges && hasGenericBonus && (
                                  <Badge variant="outline" className="bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 text-xs">
                                    <Gift className="h-3 w-3 mr-1" />
                                    Bonus
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
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
                        </div>
                      </TableCell>
                    </TableRow>,
                    ...customerBookings.map((booking) => {
                      const hasFoodOrders = booking.foodOrders && booking.foodOrders.length > 0;
                      const foodTotal = hasFoodOrders 
                        ? booking.foodOrders!.reduce((sum, order) => sum + parseFloat(order.price) * order.quantity, 0)
                        : 0;
                      const totalAmount = parseFloat(booking.price) + foodTotal;
                      const isSelected = selectedBookings?.has(booking.id);

                      return (
                        <TableRow 
                          key={booking.id}
                          className={isSelected ? "bg-blue-50 dark:bg-blue-950/30" : ""}
                          data-testid={`row-booking-${booking.id}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => onToggleSelection?.(booking.id)}
                              data-testid={`checkbox-booking-${booking.id}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-seat-${booking.id}`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{booking.seatName}</span>
                              {booking.bookingCode && (
                                <Badge variant="outline" className="text-xs font-mono" data-testid={`badge-booking-code-${booking.id}`}>
                                  {booking.bookingCode}
                                </Badge>
                              )}
                              {booking.groupCode && (
                                <Badge variant="secondary" className="text-xs font-mono" data-testid={`badge-group-code-${booking.id}`}>
                                  <Users className="h-3 w-3 mr-1" />
                                  {booking.groupCode}
                                </Badge>
                              )}
                            </div>
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
                                year: 'numeric',
                                timeZone: 'Asia/Kolkata'
                              })}
                            </TableCell>
                          )}
                          {showTypeColumn && (
                            <TableCell data-testid={`text-type-${booking.id}`}>
                              <div className="flex flex-wrap gap-1">
                                {booking.bookingType?.includes("walk-in") && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    Walk-in
                                  </span>
                                )}
                                {booking.bookingType?.includes("upcoming") && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                    Upcoming
                                  </span>
                                )}
                                {booking.bookingType?.includes("happy-hours") && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                    Happy Hours
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          )}
                          <TableCell data-testid={`text-start-${booking.id}`}>
                            {formatTime(booking.startTime)}
                          </TableCell>
                          <TableCell data-testid={`text-end-${booking.id}`}>
                            {formatTime(booking.endTime)}
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
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                                  <Pause className="h-4 w-4" />
                                  <span className="font-mono text-sm font-semibold">{timeStr}</span>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="font-bold text-primary" data-testid={`text-price-${booking.id}`}>
                            <div className="flex flex-col gap-1">
                              <span>₹{booking.price}</span>
                              {booking.manualDiscountPercentage && (
                                <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                  Discount
                                </Badge>
                              )}
                              {booking.manualFreeHours && (
                                <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                                  Free Hour
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={booking.status} />
                          </TableCell>
                          <TableCell>
                            {hasFoodOrders ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-auto px-2 py-1">
                                    <UtensilsCrossed className="h-4 w-4 mr-1 text-primary" />
                                    <span className="text-sm font-medium">₹{foodTotal.toFixed(0)}</span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Food Orders</h4>
                                    <div className="space-y-2">
                                      {booking.foodOrders!.map((order, index) => (
                                        <div key={index} className="flex justify-between items-center py-1 border-b last:border-0">
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
                                                className="h-6 w-6 text-destructive"
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
                                    <div className="pt-2 border-t flex justify-between items-center">
                                      <p className="text-sm font-semibold">Food Total:</p>
                                      <p className="text-sm font-bold text-primary">₹{foodTotal.toFixed(0)}</p>
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
                                <Button variant="ghost" size="icon" data-testid={`button-actions-${booking.id}`}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" data-testid={`dropdown-actions-${booking.id}`}>
                                {(booking.status === "running" || booking.status === "expired" || booking.status === "completed") && onExtend && (
                                  <DropdownMenuItem onClick={() => onExtend(booking.id)} data-testid={`action-extend-${booking.id}`}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    Extend Time
                                  </DropdownMenuItem>
                                )}
                                {booking.status === "running" && onStopTimer && (
                                  <DropdownMenuItem onClick={() => onStopTimer(booking.id)} data-testid={`action-pause-timer-${booking.id}`}>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pause Timer
                                  </DropdownMenuItem>
                                )}
                                {booking.status === "paused" && onStopTimer && (
                                  <DropdownMenuItem onClick={() => onStopTimer(booking.id)} data-testid={`action-resume-timer-${booking.id}`}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Resume Timer
                                  </DropdownMenuItem>
                                )}
                                {booking.status === "running" && onComplete && (
                                  <DropdownMenuItem onClick={() => onComplete(booking.id)} data-testid={`action-complete-${booking.id}`}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Over (Complete)
                                  </DropdownMenuItem>
                                )}
                                {(booking.status === "running" || booking.status === "paused" || booking.status === "upcoming" || booking.status === "completed" || booking.status === "expired") && onEnd && (
                                  <DropdownMenuItem onClick={() => onEnd(booking.id)} className="text-destructive" data-testid={`action-delete-${booking.id}`}>
                                    <X className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                                {(booking.status === "running" || booking.status === "paused" || booking.status === "upcoming" || booking.status === "expired" || booking.status === "completed") && onAddFood && (
                                  <DropdownMenuItem onClick={() => onAddFood(booking.id)} data-testid={`action-add-food-${booking.id}`}>
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
                    })
                  ];
                }).flat()}
              </TableBody>
            </Table>
          </div>
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
                      variant="outline"
                      className="h-16 flex flex-col items-center justify-center gap-1 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200"
                      onClick={() => changeSeatMutation.mutate({ bookingId: seatChangeDialog.bookingId, newSeatName: seatName })}
                      data-testid={`button-seat-option-${seatName}`}
                    >
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-semibold">{seatName}</span>
                    </Button>
                  ))}
              </div>
              
              {availableSeatsForChange
                .filter((seat: any) => seat.category === seatChangeDialog.category)
                .flatMap((seat: any) => seat.availableSeats)
                .filter((seatName: string) => seatName !== seatChangeDialog.currentSeat).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No available seats in this category</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSeatChangeDialog({...seatChangeDialog, open: false})}
              data-testid="button-cancel-seat-change"
            >
              Cancel
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
