import { useState, useMemo } from "react";
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
import { Plus, Minus, CalendarIcon } from "lucide-react";
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
    bookingType: "walk-in" | "upcoming" | "happy-hours";
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
  pricePerHour: number;
  enabled: number;
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

  const { data: pricingConfig = [] } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing-config"],
  });

  const { data: happyHoursConfigs = [] } = useQuery<HappyHoursConfig[]>({
    queryKey: ["/api/happy-hours-config"],
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
  
  const getDurationString = (mins: number) => {
    if (mins < 60) return `${mins} mins`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (remainingMins === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMins} mins`;
  };

  const duration = getDurationString(durationMinutes);
  const selectedSlot = slots.find(s => s.duration === duration);
  
  // Calculate Happy Hours pricing
  const happyHoursPrice = happyHoursConfig 
    ? (happyHoursConfig.pricePerHour * (durationMinutes / 60)).toFixed(2)
    : "0";

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
      if (!happyHoursStatus?.active) {
        return; // Validation will show error message
      }
    }
    
    const hasValidPrice = bookingType === "happy-hours" ? happyHoursConfig : selectedSlot;
    
    if (category && selectedSeats.length > 0 && customerName && duration && hasValidPrice && !isWhatsappRequired && !isDateRequired && !isTimeSlotRequired) {
      let totalPrice: string;
      let finalPersonCount: number;
      
      if (bookingType === "happy-hours") {
        // Happy Hours pricing is per hour rate * duration
        totalPrice = happyHoursPrice;
        finalPersonCount = 1; // Happy Hours doesn't use multi-person pricing
      } else {
        const slotPersonCount = selectedSlot!.personCount || 1;
        finalPersonCount = slotPersonCount > 1 ? personCount : 1;
        const basePrice = parseFloat(selectedSlot!.price.toString());
        totalPrice = slotPersonCount > 1 ? (basePrice * personCount).toString() : basePrice.toString();
      }
      
      onConfirm?.({
        category,
        seatNumbers: selectedSeats,
        customerName,
        whatsappNumber: whatsappNumber.trim() || undefined,
        duration,
        price: totalPrice,
        personCount: finalPersonCount,
        bookingType,
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
      onOpenChange(false);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setSelectedSeats([]);
    setPersonCount(1);
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
            {bookingType === "happy-hours" && category && !happyHoursStatus?.active && (
              <p className="text-sm text-destructive">Happy Hours is not currently active for {category}. Please select a different booking type.</p>
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
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant={timePeriodFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriodFilter("all")}
                    data-testid="button-filter-all"
                    className="flex-1"
                  >
                    All Day
                  </Button>
                  <Button
                    type="button"
                    variant={timePeriodFilter === "am" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriodFilter("am")}
                    data-testid="button-filter-am"
                    className="flex-1"
                  >
                    AM
                  </Button>
                  <Button
                    type="button"
                    variant={timePeriodFilter === "pm" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimePeriodFilter("pm")}
                    data-testid="button-filter-pm"
                    className="flex-1"
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
            </>
          )}

          {(bookingType === "walk-in" || (bookingType === "upcoming" && bookingDate && timeSlot && durationMinutes > 0)) && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
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
                      className="cursor-pointer text-sm font-normal"
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

          {category === "PS5" && selectedSlot && selectedSlot.personCount && selectedSlot.personCount > 1 && (
            <div className="space-y-2">
              <Label>Number of Persons</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={decreasePersonCount}
                  disabled={personCount <= 1}
                  data-testid="button-decrease-person"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="flex-1 text-center font-semibold" data-testid="text-person-count">
                  {personCount} {personCount === 1 ? 'Person' : 'Persons'}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={increasePersonCount}
                  data-testid="button-increase-person"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {duration} + {selectedSlot.personCount} person: ₹{selectedSlot.price} × {personCount} = ₹{(parseFloat(selectedSlot.price.toString()) * personCount).toFixed(2)}
              </p>
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

          {bookingType === "walk-in" && category && (
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
              {selectedSlot && (
                <div className="text-sm text-muted-foreground" data-testid="text-price">
                  Price: ₹{selectedSlot.price}
                </div>
              )}
            </div>
          )}

          {bookingType === "upcoming" && category && selectedSlot && (
            <div className="text-sm text-muted-foreground" data-testid="text-price">
              Price: ₹{selectedSlot.price} for {duration}
            </div>
          )}

          {bookingType === "happy-hours" && category && happyHoursConfig && (
            <div className="space-y-2">
              <div className="text-sm font-medium" data-testid="text-happy-hours-price">
                Happy Hours Pricing: ₹{happyHoursConfig.pricePerHour}/hour
              </div>
              <div className="text-sm text-muted-foreground">
                Total for {duration}: ₹{happyHoursPrice}
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
              (bookingType === "happy-hours" && (!happyHoursConfig || !happyHoursStatus?.active))
            }
            data-testid="button-confirm-booking"
            className="w-full sm:w-auto"
          >
            Add Booking {selectedSeats.length > 0 && `(${selectedSeats.length} seats)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
