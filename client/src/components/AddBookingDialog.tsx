import { useState } from "react";
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

interface AddBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (booking: {
    category: string;
    seatNumbers: number[];
    customerName: string;
    duration: string;
    price: number;
    bookingType: "walk-in" | "upcoming";
  }) => void;
  availableSeats: {
    category: string;
    seats: number[];
  }[];
}

const timeSlots = {
  PC: [
    { duration: "30 mins", price: 40 },
    { duration: "1 hour", price: 70 },
    { duration: "2 hours", price: 130 },
  ],
  PS5: [
    { duration: "30 mins", price: 60 },
    { duration: "1 hour", price: 100 },
    { duration: "2 hours", price: 180 },
  ],
  VR: [
    { duration: "30 mins", price: 80 },
    { duration: "1 hour", price: 140 },
    { duration: "2 hours", price: 250 },
  ],
  Car: [
    { duration: "30 mins", price: 100 },
    { duration: "1 hour", price: 180 },
    { duration: "2 hours", price: 320 },
  ],
};

export function AddBookingDialog({ open, onOpenChange, onConfirm, availableSeats }: AddBookingDialogProps) {
  const [category, setCategory] = useState<string>("");
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [bookingType, setBookingType] = useState<"walk-in" | "upcoming">("walk-in");

  const selectedCategory = availableSeats.find(c => c.category === category);
  const slots = category ? timeSlots[category as keyof typeof timeSlots] || [] : [];
  const selectedSlot = slots.find(s => s.duration === duration);

  const toggleSeat = (seatNumber: number) => {
    setSelectedSeats(prev =>
      prev.includes(seatNumber)
        ? prev.filter(s => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const handleConfirm = () => {
    if (category && selectedSeats.length > 0 && customerName && duration && selectedSlot) {
      onConfirm?.({
        category,
        seatNumbers: selectedSeats,
        customerName,
        duration,
        price: selectedSlot.price,
        bookingType,
      });
      setCategory("");
      setSelectedSeats([]);
      setCustomerName("");
      setDuration("");
      setBookingType("walk-in");
      onOpenChange(false);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setSelectedSeats([]);
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

          {category && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration" data-testid="select-duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((slot) => (
                    <SelectItem key={slot.duration} value={slot.duration} data-testid={`option-${slot.duration}`}>
                      {slot.duration} - ₹{slot.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-booking">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!category || selectedSeats.length === 0 || !customerName || !duration}
            data-testid="button-confirm-booking"
          >
            Add Booking {selectedSeats.length > 0 && `(${selectedSeats.length} seats)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
