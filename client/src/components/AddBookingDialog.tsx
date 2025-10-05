import { useState } from "react";
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
import { Plus, Minus } from "lucide-react";

interface AddBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (booking: {
    category: string;
    seatNumbers: number[];
    customerName: string;
    whatsappNumber?: string;
    duration: string;
    price: number;
    bookingType: "walk-in" | "upcoming";
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
}

export function AddBookingDialog({ open, onOpenChange, onConfirm, availableSeats }: AddBookingDialogProps) {
  const [category, setCategory] = useState<string>("");
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [bookingType, setBookingType] = useState<"walk-in" | "upcoming">("walk-in");

  const { data: pricingConfig = [] } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing-config"],
  });

  const selectedCategory = availableSeats.find(c => c.category === category);
  const slots = category 
    ? pricingConfig
        .filter(config => config.category === category)
        .map(config => ({ duration: config.duration, price: config.price }))
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

  const toggleSeat = (seatNumber: number) => {
    setSelectedSeats(prev =>
      prev.includes(seatNumber)
        ? prev.filter(s => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const handleConfirm = () => {
    const isWhatsappRequired = bookingType === "upcoming" && !whatsappNumber.trim();
    if (category && selectedSeats.length > 0 && customerName && duration && selectedSlot && !isWhatsappRequired) {
      onConfirm?.({
        category,
        seatNumbers: selectedSeats,
        customerName,
        whatsappNumber: whatsappNumber.trim() || undefined,
        duration,
        price: selectedSlot.price,
        bookingType,
      });
      setCategory("");
      setSelectedSeats([]);
      setCustomerName("");
      setWhatsappNumber("");
      setDurationMinutes(30);
      setBookingType("walk-in");
      onOpenChange(false);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setSelectedSeats([]);
  };

  const increaseDuration = () => {
    setDurationMinutes(prev => prev + 30);
  };

  const decreaseDuration = () => {
    setDurationMinutes(prev => Math.max(30, prev - 30));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-add-booking">
        <DialogHeader>
          <DialogTitle>Add New Booking</DialogTitle>
          <DialogDescription>
            Select multiple seats for the same customer and time slot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Booking Type</Label>
            <RadioGroup value={bookingType} onValueChange={(value) => setBookingType(value as "walk-in" | "upcoming")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="walk-in" id="walk-in" data-testid="radio-walk-in" />
                <Label htmlFor="walk-in" className="cursor-pointer font-normal">Walk-in (Start Now)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upcoming" id="upcoming" data-testid="radio-upcoming" />
                <Label htmlFor="upcoming" className="cursor-pointer font-normal">Upcoming Booking</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger id="category" data-testid="select-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {availableSeats.map((cat) => (
                  <SelectItem key={cat.category} value={cat.category} data-testid={`option-${cat.category.toLowerCase()}`}>
                    {cat.category} ({cat.seats.length} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category && selectedCategory && selectedCategory.seats.length > 0 && (
            <div className="space-y-2">
              <Label>
                Select Seats ({selectedSeats.length} selected)
              </Label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
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

          {category && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-booking">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!category || selectedSeats.length === 0 || !customerName || !duration || (bookingType === "upcoming" && !whatsappNumber.trim())}
            data-testid="button-confirm-booking"
          >
            Add Booking {selectedSeats.length > 0 && `(${selectedSeats.length} seats)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
