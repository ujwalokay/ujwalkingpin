import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Minus, CalendarIcon, Award, Gift, Percent, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isSameDay } from "date-fns";

interface AddBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (booking: {
    category: string;
    seatNumbers: number[];
    customerName: string;
    whatsappNumber?: string;
    duration: string;
    price: string;
    personCount: number;
    bookingType: string[];
    bookingDate?: Date;
    timeSlot?: string;
  }) => void;
  availableSeats: {
    category: string;
    seats: number[];
  }[];
}

interface PricingConfig {
  category: string;
  duration: string;
  price: number;
  personCount?: number;
}

interface HappyHoursConfig {
  id: string;
  category: string;
  startTime: string;
  endTime: string;
  enabled: number;
}

interface HappyHoursPricing {
  id: string;
  category: string;
  duration: string;
  price: string;
  personCount: number;
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
  bookingType: string[];
  pausedRemainingTime?: number;
  foodOrders: Array<{
    foodId: string;
    foodName: string;
    price: string;
    quantity: number;
  }>;
  createdAt: string;
}

export function AddBookingDialog({ open, onOpenChange, onConfirm, availableSeats }: AddBookingDialogProps) {
  const [category, setCategory] = useState<string>("");
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [personCount, setPersonCount] = useState<number>(1);
  const [bookingType, setBookingType] = useState<"walk-in" | "upcoming" | "happy-hours">("walk-in");
  const [bookingDate, setBookingDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [timePeriodFilter, setTimePeriodFilter] = useState<"all" | "am" | "pm">("all");
  const [useHappyHoursPricing, setUseHappyHoursPricing] = useState<boolean>(false);
  const [loyaltyCustomerId, setLoyaltyCustomerId] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<{
    type: "free_hours" | "discount" | "cashback";
    value: string;
    tierId: string;
  } | null>(null);
  const [loyaltyDialogOpen, setLoyaltyDialogOpen] = useState<boolean>(false);

  const { data: pricingConfig = [] } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing-config"],
  });

  const { data: happyHoursConfigs = [] } = useQuery<HappyHoursConfig[]>({
    queryKey: ["/api/happy-hours-config"],
  });

  const { data: happyHoursPricing = [] } = useQuery<HappyHoursPricing[]>({
    queryKey: ["/api/happy-hours-pricing"],
  });

  const { data: happyHoursStatus } = useQuery<{ active: boolean }>({
    queryKey: ["/api/happy-hours-active", category],
    queryFn: async () => {
      if (!category) return { active: false };
      const response = await fetch(`/api/happy-hours-active/${category}`);
      if (!response.ok) throw new Error('Failed to check happy hours status');
      return response.json();
    },
    enabled: !!category && bookingType === "happy-hours",
  });

  // Check if Happy Hours is active for the selected upcoming time slot
  const { data: upcomingHappyHoursStatus } = useQuery<{ active: boolean }>({
    queryKey: ["/api/happy-hours-active-for-time", category, timeSlot],
    queryFn: async () => {
      if (!category || !timeSlot) return { active: false };
      const response = await fetch(`/api/happy-hours-active-for-time/${category}?timeSlot=${timeSlot}`);
      if (!response.ok) throw new Error('Failed to check happy hours status for time slot');
      return response.json();
    },
    enabled: !!category && !!timeSlot && bookingType === "upcoming",
  });

  // Check if happy hours is enabled (not time-based) for the category
  const isHappyHoursEnabled = useMemo(() => {
    if (!category || bookingType !== "happy-hours") return false;
    const config = happyHoursConfigs.find(c => c.category === category && c.enabled === 1);
    return !!config;
  }, [category, bookingType, happyHoursConfigs]);

  // Check if happy hours is both enabled AND currently active (within time slots)
  const isHappyHoursActiveNow = isHappyHoursEnabled && happyHoursStatus?.active;

  const { data: allBookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: bookingType === "upcoming" && !!bookingDate,
  });

  const { data: upcomingAvailableSeats = [], isLoading: isLoadingSeats } = useQuery<{ category: string; seats: number[] }[]>({
    queryKey: ["/api/bookings/available-seats", { 
      date: bookingDate?.toISOString(), 
      timeSlot, 
      durationMinutes 
    }],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey as [string, { date?: string; timeSlot?: string; durationMinutes?: number }];
      const searchParams = new URLSearchParams();
      if (params.date) searchParams.append('date', params.date);
      if (params.timeSlot) searchParams.append('timeSlot', params.timeSlot);
      if (params.durationMinutes) searchParams.append('durationMinutes', params.durationMinutes.toString());
      
      const response = await fetch(`${url}?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch available seats');
      }
      return response.json();
    },
    enabled: bookingType === "upcoming" && !!bookingDate && !!timeSlot && durationMinutes > 0,
  });

  // Fetch loyalty tiers
  const { data: loyaltyTiers = [] } = useQuery<any[]>({
    queryKey: ["/api/loyalty-tiers"],
  });

  // Fetch customer loyalty data when WhatsApp number is entered
  const { data: customerLoyalty } = useQuery<any>({
    queryKey: ["/api/customer-loyalty/by-phone", whatsappNumber],
    queryFn: async () => {
      if (!whatsappNumber || whatsappNumber.length < 10) return null;
      const response = await fetch(`/api/customer-loyalty/by-phone/${whatsappNumber}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: whatsappNumber.length >= 10,
  });

  // Get customer's current tier
  const customerTier = useMemo(() => {
    if (!customerLoyalty) return null;
    return loyaltyTiers.find((tier: any) => tier.id === customerLoyalty.currentTierId);
  }, [customerLoyalty, loyaltyTiers]);

  // Get all tiers customer is eligible for (based on total spending)
  const eligibleTiers = useMemo(() => {
    if (!customerLoyalty || !loyaltyTiers.length) return [];
    const totalSpent = parseFloat(customerLoyalty.totalSpent || "0");
    return loyaltyTiers.filter((tier: any) => {
      const minSpend = parseFloat(tier.minSpend);
      return totalSpent >= minSpend && tier.enabled === 1;
    });
  }, [customerLoyalty, loyaltyTiers]);

  // Helper to get reward icon
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

  // Helper to get reward label
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

  // Calculate final price with reward applied
  const calculateFinalPrice = () => {
    const shouldUseHappyHoursPricing = bookingType === "happy-hours" || (bookingType === "upcoming" && useHappyHoursPricing);
    const slot = shouldUseHappyHoursPricing ? selectedHappyHoursSlot : selectedSlot;
    if (!slot) return null;

    let basePrice = parseFloat(slot.price.toString());
    
    // Apply selected reward
    if (selectedReward) {
      if (selectedReward.type === "discount") {
        const discountPercent = parseFloat(selectedReward.value);
        basePrice = basePrice * (1 - discountPercent / 100);
      } else if (selectedReward.type === "cashback") {
        const cashback = parseFloat(selectedReward.value);
        basePrice = Math.max(0, basePrice - cashback);
      } else if (selectedReward.type === "free_hours") {
        // For free hours, calculate proportional discount
        const freeHours = parseFloat(selectedReward.value);
        const durationHours = durationMinutes / 60;
        
        if (durationHours <= freeHours) {
          // Entire booking is covered by free hours
          basePrice = 0;
        } else {
          // Partial coverage: subtract the value of free hours from total
          // Calculate hourly rate and subtract the free hours value
          const hourlyRate = basePrice / durationHours;
          const freeHoursValue = hourlyRate * freeHours;
          basePrice = Math.max(0, basePrice - freeHoursValue);
        }
      }
    }

    return Math.round(basePrice).toString();
  };

  const handleUseReward = (tier: any) => {
    setSelectedReward({
      type: tier.rewardType,
      value: tier.rewardValue,
      tierId: tier.id
    });
    setLoyaltyDialogOpen(false);
  };

  const handleClearReward = () => {
    setSelectedReward(null);
  };

  const seatsToDisplay = bookingType === "upcoming" && bookingDate && timeSlot && durationMinutes > 0
    ? upcomingAvailableSeats
    : availableSeats;

  const selectedCategory = seatsToDisplay.find(c => c.category === category);
  
  // Get Happy Hours config for the category
  const happyHoursConfig = happyHoursConfigs.find(config => 
    config.category === category && config.enabled === 1
  );
  
  const slots = category 
    ? pricingConfig
        .filter(config => config.category === category)
        .map(config => ({ duration: config.duration, price: config.price, personCount: config.personCount }))
    : [];
  
  // Get Happy Hours pricing slots for the category
  const happyHoursSlots = category
    ? happyHoursPricing
        .filter(pricing => pricing.category === category)
        .map(pricing => ({ duration: pricing.duration, price: pricing.price, personCount: pricing.personCount }))
    : [];
  
  const getDurationString = (mins: number) => {
    if (mins < 60) return `${mins} mins`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (remainingMins === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMins} mins`;
  };

  const duration = getDurationString(durationMinutes);
  // For PS5, match both duration and personCount; for others, just match duration
  const selectedSlot = category === "PS5" 
    ? slots.find(s => s.duration === duration && s.personCount === personCount)
    : slots.find(s => s.duration === duration);
  const selectedHappyHoursSlot = category === "PS5"
    ? happyHoursSlots.find(s => s.duration === duration && s.personCount === personCount)
    : happyHoursSlots.find(s => s.duration === duration);
  
  // Check if next person count has pricing configured (for PS5)
  const hasNextPersonPricing = category === "PS5" && bookingType !== "happy-hours"
    ? slots.some(s => s.duration === duration && s.personCount === personCount + 1)
    : false;
  const hasNextPersonHappyHoursPricing = category === "PS5" && bookingType === "happy-hours"
    ? happyHoursSlots.some(s => s.duration === duration && s.personCount === personCount + 1)
    : false;

  const toggleSeat = (seatNumber: number) => {
    setSelectedSeats(prev =>
      prev.includes(seatNumber)
        ? prev.filter(s => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const handleConfirm = () => {
    const isWhatsappRequired = bookingType === "upcoming" && !whatsappNumber.trim();
    const isDateRequired = bookingType === "upcoming" && !bookingDate;
    const isTimeSlotRequired = bookingType === "upcoming" && !timeSlot;
    
    // Validate Happy Hours
    if (bookingType === "happy-hours") {
      if (!isHappyHoursActiveNow) {
        return; // Validation will show error message
      }
    }
    
    // Determine which pricing to use
    const shouldUseHappyHoursPricing = bookingType === "happy-hours" || (bookingType === "upcoming" && useHappyHoursPricing);
    const hasValidPrice = shouldUseHappyHoursPricing ? selectedHappyHoursSlot : selectedSlot;
    
    if (category && selectedSeats.length > 0 && customerName && duration && hasValidPrice && !isWhatsappRequired && !isDateRequired && !isTimeSlotRequired) {
      let finalPersonCount: number;
      
      if (shouldUseHappyHoursPricing) {
        // Happy Hours pricing
        finalPersonCount = category === "PS5" ? personCount : 1;
      } else if (category === "PS5") {
        // PS5 pricing
        finalPersonCount = personCount;
      } else {
        // Other categories
        finalPersonCount = 1;
      }
      
      // Calculate final price with any rewards applied
      const finalPrice = calculateFinalPrice() || hasValidPrice.price.toString();
      
      // Determine booking types array
      let bookingTypes: string[];
      if (bookingType === "upcoming" && useHappyHoursPricing) {
        bookingTypes = ["upcoming", "happy-hours"];
      } else {
        bookingTypes = [bookingType];
      }
      
      onConfirm?.({
        category,
        seatNumbers: selectedSeats,
        customerName,
        whatsappNumber: whatsappNumber.trim() || undefined,
        duration,
        price: finalPrice,
        personCount: finalPersonCount,
        bookingType: bookingTypes,
        bookingDate: bookingType === "upcoming" ? bookingDate : undefined,
        timeSlot: bookingType === "upcoming" ? timeSlot : undefined,
      });
      setCategory("");
      setSelectedSeats([]);
      setCustomerName("");
      setWhatsappNumber("");
      setDurationMinutes(30);
      setPersonCount(1);
      setBookingType("walk-in");
      setBookingDate(undefined);
      setTimeSlot("");
      setUseHappyHoursPricing(false);
      setSelectedReward(null);
      onOpenChange(false);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setSelectedSeats([]);
    setPersonCount(1);
    setUseHappyHoursPricing(false);
  };

  const increaseDuration = () => {
    setDurationMinutes(prev => prev + 30);
  };

  const decreaseDuration = () => {
    setDurationMinutes(prev => Math.max(30, prev - 30));
  };

  const increasePersonCount = () => {
    setPersonCount(prev => prev + 1);
  };

  const decreasePersonCount = () => {
    setPersonCount(prev => Math.max(1, prev - 1));
  };

  const latestBookingEndTime = useMemo(() => {
    if (!bookingDate || !allBookings.length) return null;
    
    const isToday = isSameDay(bookingDate, new Date());
    if (!isToday) return null;
    
    const todayBookings = allBookings.filter(booking => {
      const bookingStart = new Date(booking.startTime);
      return isSameDay(bookingStart, bookingDate) && 
             (booking.status === "running" || booking.status === "paused" || booking.status === "upcoming");
    });
    
    if (todayBookings.length === 0) return null;
    
    const latestEnd = todayBookings.reduce((latest, booking) => {
      const endTime = new Date(booking.endTime);
      return endTime > latest ? endTime : latest;
    }, new Date(0));
    
    return latestEnd;
  }, [bookingDate, allBookings]);

  const generateTimeSlots = () => {
    const allSlots = [];
    const totalMinutesInDay = 24 * 60;
    
    let startMinutes = 0;
    
    if (latestBookingEndTime && bookingDate && isSameDay(bookingDate, new Date())) {
      const endHour = latestBookingEndTime.getHours();
      const endMin = latestBookingEndTime.getMinutes();
      startMinutes = endHour * 60 + endMin;
    }
    
    while (startMinutes < totalMinutesInDay) {
      const endMinutes = startMinutes + durationMinutes;
      if (endMinutes > totalMinutesInDay) break;
      
      const startHour = Math.floor(startMinutes / 60);
      const startMin = startMinutes % 60;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      
      const formatTime = (hour: number, min: number) => {
        const period = hour < 12 ? 'AM' : 'PM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const displayMin = min.toString().padStart(2, '0');
        return `${displayHour}:${displayMin} ${period}`;
      };
      
      const label = `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`;
      const value = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
      
      allSlots.push({ label, value, startHour });
      
      startMinutes = endMinutes;
    }
    
    if (timePeriodFilter === "am") {
      return allSlots.filter(slot => slot.startHour < 12);
    } else if (timePeriodFilter === "pm") {
      return allSlots.filter(slot => slot.startHour >= 12);
    }
    
    return allSlots;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-add-booking">
        <DialogHeader>
          <DialogTitle>Add New Booking</DialogTitle>
          <DialogDescription>
            Select multiple seats for the same customer and time slot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Booking Type</Label>
            <RadioGroup value={bookingType} onValueChange={(value) => setBookingType(value as "walk-in" | "upcoming" | "happy-hours")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="walk-in" id="walk-in" data-testid="radio-walk-in" />
                <Label htmlFor="walk-in" className="cursor-pointer font-normal">Walk-in (Start Now)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upcoming" id="upcoming" data-testid="radio-upcoming" />
                <Label htmlFor="upcoming" className="cursor-pointer font-normal">Upcoming Booking</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="happy-hours" id="happy-hours" data-testid="radio-happy-hours" />
                <Label htmlFor="happy-hours" className="cursor-pointer font-normal">Happy Hours (Special Pricing)</Label>
              </div>
            </RadioGroup>
            {bookingType === "happy-hours" && category && !isHappyHoursActiveNow && (
              <p className="text-sm text-destructive">
                {!isHappyHoursEnabled 
                  ? `Happy Hours is not enabled for ${category}. Please select a different booking type.`
                  : `Happy Hours is not currently active for ${category}. Current time is outside the configured time slots.`
                }
              </p>
            )}
          </div>

          {bookingType === "upcoming" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration <span className="text-destructive">*</span></Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        value={Math.floor(durationMinutes / 60)}
                        onChange={(e) => {
                          const hours = Math.max(0, parseInt(e.target.value) || 0);
                          const mins = durationMinutes % 60;
                          setDurationMinutes(hours * 60 + mins);
                        }}
                        className="w-16 text-center"
                        data-testid="input-hours"
                      />
                      <span className="text-sm text-muted-foreground">hr</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        step="30"
                        value={durationMinutes % 60}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          const mins = value >= 30 ? 30 : 0;
                          const hours = Math.floor(durationMinutes / 60);
                          setDurationMinutes(hours * 60 + mins);
                        }}
                        className="w-16 text-center"
                        data-testid="input-minutes"
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      type="button"
                      variant="outline" 
                      size="icon"
                      onClick={decreaseDuration}
                      disabled={durationMinutes <= 30}
                      data-testid="button-decrease-duration"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="icon"
                      onClick={increaseDuration}
                      data-testid="button-increase-duration"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Date <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-select-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {bookingDate ? format(bookingDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={bookingDate}
                      onSelect={setBookingDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeSlot">
                  Time Slot <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Button
                    type="button"
                    variant={timePeriodFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriodFilter("all")}
                    data-testid="button-filter-all"
                  >
                    All Day
                  </Button>
                  <Button
                    type="button"
                    variant={timePeriodFilter === "am" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriodFilter("am")}
                    data-testid="button-filter-am"
                  >
                    AM
                  </Button>
                  <Button
                    type="button"
                    variant={timePeriodFilter === "pm" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriodFilter("pm")}
                    data-testid="button-filter-pm"
                  >
                    PM
                  </Button>
                </div>
                <Select value={timeSlot} onValueChange={setTimeSlot}>
                  <SelectTrigger id="timeSlot" data-testid="select-time-slot">
                    <SelectValue placeholder={`Select ${duration} time slot`} />
                  </SelectTrigger>
                  <SelectContent>
                    {generateTimeSlots().map((slot) => (
                      <SelectItem key={slot.value} value={slot.value} data-testid={`option-timeslot-${slot.value}`}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Happy Hours Pricing Option for Upcoming Bookings */}
              {category && upcomingHappyHoursStatus?.active && happyHoursSlots.length > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <Checkbox
                    id="use-happy-hours-pricing"
                    checked={useHappyHoursPricing}
                    onCheckedChange={(checked) => setUseHappyHoursPricing(checked as boolean)}
                    data-testid="checkbox-use-happy-hours-pricing"
                  />
                  <div className="flex-1">
                    <Label htmlFor="use-happy-hours-pricing" className="cursor-pointer font-medium text-yellow-900 dark:text-yellow-100">
                      Use Happy Hours Pricing 🎉
                    </Label>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      This time slot falls within Happy Hours! Get special pricing.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {(bookingType === "walk-in" || bookingType === "happy-hours" || (bookingType === "upcoming" && bookingDate && timeSlot && durationMinutes > 0)) && (
            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingSeats && bookingType === "upcoming" ? (
                    <SelectItem value="loading" disabled data-testid="option-loading">
                      Loading available seats...
                    </SelectItem>
                  ) : seatsToDisplay.length === 0 ? (
                    <SelectItem value="none" disabled data-testid="option-no-seats">
                      No seats available for this time slot
                    </SelectItem>
                  ) : (
                    seatsToDisplay.map((cat) => (
                      <SelectItem key={cat.category} value={cat.category} data-testid={`option-${cat.category.toLowerCase()}`}>
                        {cat.category} ({cat.seats.length} available)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {category && selectedCategory && selectedCategory.seats.length > 0 && (
            <div className="space-y-2">
              <Label>
                Select Seats ({selectedSeats.length} selected)
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-3 border rounded-md bg-muted/30">
                {selectedCategory.seats.map((seat) => (
                  <div
                    key={seat}
                    className="flex items-center space-x-2"
                    data-testid={`checkbox-seat-${seat}`}
                  >
                    <Checkbox
                      id={`seat-${seat}`}
                      checked={selectedSeats.includes(seat)}
                      onCheckedChange={() => toggleSeat(seat)}
                    />
                    <Label
                      htmlFor={`seat-${seat}`}
                      className="cursor-pointer text-sm font-normal whitespace-nowrap"
                    >
                      {category}-{seat}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="customer">Customer Name</Label>
            <Input
              id="customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              data-testid="input-customer-name"
            />
          </div>

          {category === "PS5" && (
            <div className="space-y-2">
              <Label>Number of Persons</Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={decreasePersonCount}
                    disabled={personCount <= 1}
                    data-testid="button-decrease-person"
                    className="shrink-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center font-semibold py-2" data-testid="text-person-count">
                    {personCount} {personCount === 1 ? 'Person' : 'Persons'}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={increasePersonCount}
                    disabled={bookingType === "happy-hours" ? !hasNextPersonHappyHoursPricing : !hasNextPersonPricing}
                    data-testid="button-increase-person"
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {(bookingType === "happy-hours" ? selectedHappyHoursSlot : selectedSlot) ? (
                <p className="text-xs text-muted-foreground">
                  {duration} for {personCount} {personCount === 1 ? 'person' : 'persons'}: ₹{
                    bookingType === "happy-hours" 
                      ? selectedHappyHoursSlot!.price
                      : selectedSlot!.price
                  } (Total Price)
                </p>
              ) : (
                <p className="text-xs text-destructive">
                  No pricing configured for {duration} with {personCount} {personCount === 1 ? 'person' : 'persons'}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="whatsapp">
              WhatsApp Number {bookingType === "upcoming" && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="whatsapp"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="Enter WhatsApp number"
              data-testid="input-whatsapp-number"
            />
            {bookingType === "upcoming" && (
              <p className="text-xs text-muted-foreground">Required for upcoming bookings</p>
            )}
          </div>

          {customerLoyalty && customerTier && (
            <Card className="border-l-4" style={{ borderLeftColor: customerTier.tierColor }}>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5" style={{ color: customerTier.tierColor }} />
                      <div>
                        <div className="font-semibold">Loyalty Member</div>
                        <div className="flex items-center gap-2">
                          <Badge style={{ backgroundColor: customerTier.tierColor }} className="text-xs">
                            {customerTier.tierName}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {customerLoyalty.pointsEarned} points
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setLoyaltyDialogOpen(true)}
                      data-testid="button-view-rewards"
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      View Rewards
                    </Button>
                  </div>
                  
                  {selectedReward && (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getRewardIcon(selectedReward.type)}
                          <div>
                            <div className="text-sm font-medium text-green-900 dark:text-green-100">
                              Reward Applied
                            </div>
                            <div className="text-xs text-green-700 dark:text-green-300">
                              {getRewardLabel(selectedReward.type, selectedReward.value)}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearReward}
                          data-testid="button-clear-reward"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {(bookingType === "walk-in" || bookingType === "happy-hours") && category && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      value={Math.floor(durationMinutes / 60)}
                      onChange={(e) => {
                        const hours = Math.max(0, parseInt(e.target.value) || 0);
                        const mins = durationMinutes % 60;
                        setDurationMinutes(hours * 60 + mins);
                      }}
                      className="w-16 text-center"
                      data-testid="input-hours"
                    />
                    <span className="text-sm text-muted-foreground">hr</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      step="30"
                      value={durationMinutes % 60}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        const mins = value >= 30 ? 30 : 0;
                        const hours = Math.floor(durationMinutes / 60);
                        setDurationMinutes(hours * 60 + mins);
                      }}
                      className="w-16 text-center"
                      data-testid="input-minutes"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon"
                    onClick={decreaseDuration}
                    disabled={durationMinutes <= 30}
                    data-testid="button-decrease-duration"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon"
                    onClick={increaseDuration}
                    data-testid="button-increase-duration"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {bookingType === "walk-in" && selectedSlot && (
                <div className="text-sm text-muted-foreground" data-testid="text-price">
                  {selectedReward ? (
                    <>
                      <span className="line-through mr-2">₹{selectedSlot.price}</span>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        ₹{calculateFinalPrice()}
                      </span>
                    </>
                  ) : (
                    `Price: ₹${selectedSlot.price}`
                  )}
                </div>
              )}
            </div>
          )}

          {bookingType === "upcoming" && category && (useHappyHoursPricing ? selectedHappyHoursSlot : selectedSlot) && (
            <div className="text-sm text-muted-foreground" data-testid="text-price">
              {selectedReward ? (
                <>
                  <span className="line-through mr-2">
                    ₹{useHappyHoursPricing && selectedHappyHoursSlot ? selectedHappyHoursSlot.price : selectedSlot?.price}
                  </span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    ₹{calculateFinalPrice()}
                  </span>
                  <span className="ml-2">for {duration}</span>
                </>
              ) : (
                <>
                  Price: ₹{useHappyHoursPricing && selectedHappyHoursSlot ? selectedHappyHoursSlot.price : selectedSlot?.price} for {duration}
                  {useHappyHoursPricing && selectedHappyHoursSlot && (
                    <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                      (Happy Hours 🎉)
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {bookingType === "happy-hours" && category && (
            <div className="space-y-2">
              {selectedHappyHoursSlot ? (
                <>
                  <div className="text-sm font-medium" data-testid="text-happy-hours-price">
                    Happy Hours Pricing: ₹{selectedHappyHoursSlot.price} for {duration}
                  </div>
                  {happyHoursStatus?.active ? (
                    <div className="text-sm text-green-600 dark:text-green-400">
                      ✓ Happy Hours is currently active
                    </div>
                  ) : (
                    <div className="text-sm text-destructive">
                      Happy Hours is not currently active
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No happy hours pricing configured for {duration}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-booking" className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={
              !category || 
              selectedSeats.length === 0 || 
              !customerName || 
              !duration || 
              (bookingType === "upcoming" && (!whatsappNumber.trim() || !bookingDate || !timeSlot)) ||
              (bookingType === "happy-hours" && (!selectedHappyHoursSlot || !isHappyHoursActiveNow))
            }
            data-testid="button-confirm-booking"
            className="w-full sm:w-auto"
          >
            Add Booking {selectedSeats.length > 0 && `(${selectedSeats.length} seats)`}
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={loyaltyDialogOpen} onOpenChange={setLoyaltyDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-loyalty-rewards">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Loyalty Rewards
            </DialogTitle>
            <DialogDescription>
              Your loyalty status and available rewards
            </DialogDescription>
          </DialogHeader>
          
          {customerLoyalty && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Points</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {customerLoyalty.pointsEarned}
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
                          {customerTier.tierName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Available Rewards</h3>
                {eligibleTiers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No rewards available yet. Keep spending to unlock rewards!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {eligibleTiers.map((tier: any) => {
                      const isSelected = selectedReward?.tierId === tier.id;
                      return (
                        <Card 
                          key={tier.id} 
                          className={`border-l-4 ${isSelected ? 'bg-green-50 dark:bg-green-950 border-green-500' : ''}`}
                          style={{ borderLeftColor: isSelected ? undefined : tier.tierColor }}
                          data-testid={`reward-card-${tier.id}`}
                        >
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" style={{ borderColor: tier.tierColor, color: tier.tierColor }}>
                                      {tier.tierName}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getRewardIcon(tier.rewardType)}
                                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                                      {getRewardLabel(tier.rewardType, tier.rewardValue)}
                                    </span>
                                  </div>
                                  {tier.description && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {tier.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Required: ₹{tier.minSpend} total spend
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant={isSelected ? "secondary" : "default"}
                                size="sm"
                                className="w-full"
                                onClick={() => handleUseReward(tier)}
                                disabled={isSelected}
                                data-testid={`button-use-reward-${tier.id}`}
                              >
                                {isSelected ? (
                                  <>
                                    <Award className="mr-2 h-4 w-4" />
                                    Applied
                                  </>
                                ) : (
                                  <>
                                    <Gift className="mr-2 h-4 w-4" />
                                    Use It
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {loyaltyTiers.length > eligibleTiers.length && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Locked Rewards</h3>
                  <div className="space-y-2">
                    {loyaltyTiers
                      .filter((tier: any) => !eligibleTiers.find((et: any) => et.id === tier.id))
                      .map((tier: any) => (
                        <Card key={tier.id} className="opacity-60" data-testid={`locked-reward-${tier.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" style={{ borderColor: tier.tierColor }}>
                                    {tier.tierName}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getRewardIcon(tier.rewardType)}
                                  <span className="font-semibold">
                                    {getRewardLabel(tier.rewardType, tier.rewardValue)}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Need ₹{(parseFloat(tier.minSpend) - parseFloat(customerLoyalty.totalSpent)).toFixed(2)} more to unlock
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLoyaltyDialogOpen(false)} data-testid="button-close-loyalty-dialog">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
