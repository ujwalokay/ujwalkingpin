import { useState, useEffect, useMemo } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { fetchPricingConfigs } from "@/lib/api";
import type { PricingConfig } from "@shared/schema";

interface ExtendSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seatName: string;
  category: string;
  personCount?: number;
  onConfirm?: (duration: string, price: string) => void;
}

export function ExtendSessionDialog({
  open,
  onOpenChange,
  seatName,
  category,
  personCount = 1,
  onConfirm,
}: ExtendSessionDialogProps) {
  const { data: allPricingConfigs = [], isLoading } = useQuery<PricingConfig[]>({
    queryKey: ['/api/pricing-config'],
    queryFn: fetchPricingConfigs,
  });

  const timeSlots = useMemo(() => {
    const categoryConfigs = allPricingConfigs.filter(
      (config) => config.category === category && config.personCount === personCount
    );
    
    if (categoryConfigs.length === 0) {
      return [
        { duration: "30 mins", price: "40" },
        { duration: "1 hour", price: "70" },
        { duration: "2 hours", price: "130" },
      ];
    }
    
    return categoryConfigs.map((config) => ({
      duration: config.duration,
      price: config.price,
    }));
  }, [allPricingConfigs, category, personCount]);

  const [selectedSlot, setSelectedSlot] = useState<string>("");

  useEffect(() => {
    if (timeSlots.length > 0 && !selectedSlot) {
      setSelectedSlot(timeSlots[0].duration);
    }
  }, [timeSlots, selectedSlot]);

  const handleConfirm = () => {
    const slot = timeSlots.find(s => s.duration === selectedSlot);
    if (slot && onConfirm) {
      onConfirm(slot.duration, slot.price);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-extend-session">
        <DialogHeader>
          <DialogTitle>Extend Session - {seatName}</DialogTitle>
          <DialogDescription>
            Select additional time to extend the current session.
            {category && ` (${category}${personCount > 1 ? ` - ${personCount} persons` : ''})`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading pricing...</div>
        ) : (
          <RadioGroup value={selectedSlot} onValueChange={setSelectedSlot} className="space-y-3">
            {timeSlots.map((slot) => (
              <div key={slot.duration} className="flex items-center space-x-3 rounded-md border p-3 hover-elevate">
                <RadioGroupItem value={slot.duration} id={slot.duration} data-testid={`radio-${slot.duration}`} />
                <Label htmlFor={slot.duration} className="flex-1 cursor-pointer">
                  <div className="flex justify-between">
                    <span>{slot.duration}</span>
                    <span className="font-bold text-primary">₹{slot.price}</span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-extend">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || !selectedSlot} data-testid="button-confirm-extend">
            Extend Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
