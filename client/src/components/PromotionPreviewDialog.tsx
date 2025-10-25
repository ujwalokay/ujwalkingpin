import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PromotionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'discount' | 'bonus';
  category: string;
  duration: string;
  price: number;
  personCount: number;
  onConfirm: (data: {
    discountPercentage?: number;
    bonusHours?: string;
    startDate: Date;
    endDate: Date;
  }) => void;
}

export function PromotionPreviewDialog({
  open,
  onOpenChange,
  type,
  category,
  duration,
  price,
  personCount,
  onConfirm
}: PromotionPreviewDialogProps) {
  const [discountPercentage, setDiscountPercentage] = useState(20);
  const [bonusHours, setBonusHours] = useState("1");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  const getDurationMinutes = (dur: string): number => {
    const match = dur.match(/(\d+)\s*(mins?|hours?)/i);
    if (!match) return 30;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    return unit.startsWith('hour') ? value * 60 : value;
  };

  const getDurationHours = (mins: number): number => {
    return mins / 60;
  };

  const formatHours = (hours: number): string => {
    if (hours >= 1) {
      const whole = Math.floor(hours);
      const fraction = hours - whole;
      if (fraction === 0) return `${whole} hour${whole > 1 ? 's' : ''}`;
      if (fraction === 0.5) return `${whole}.5 hours`;
      return `${hours.toFixed(2)} hours`;
    }
    return `${(hours * 60).toFixed(0)} mins`;
  };

  const durationMins = getDurationMinutes(duration);
  const durationInHours = getDurationHours(durationMins);
  
  const discountAmount = type === 'discount' ? (price * discountPercentage / 100) : 0;
  const finalPrice = type === 'discount' ? price - discountAmount : price;
  
  const bonusHoursNum = parseFloat(bonusHours) || 0;
  const totalHours = type === 'bonus' ? durationInHours + bonusHoursNum : durationInHours;

  const handleConfirm = () => {
    if (type === 'discount') {
      onConfirm({
        discountPercentage,
        startDate,
        endDate
      });
    } else {
      onConfirm({
        bonusHours: bonusHours,
        startDate,
        endDate
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-promotion-preview">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            {type === 'discount' ? 'Add Discount Promotion' : 'Add Bonus Hours Promotion'}
          </DialogTitle>
          <DialogDescription>
            {type === 'discount' 
              ? 'Set a percentage discount for this pricing tier'
              : 'Set bonus hours customers get free with this purchase'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              <span className="font-bold text-foreground">{category}</span> - {duration}
              {personCount > 1 && ` + ${personCount} person`}
            </div>
            <div className="text-lg font-bold text-primary">Original Price: ₹{price}</div>
          </div>

          <div className="space-y-4 border-t pt-4">
            {type === 'discount' ? (
              <div className="space-y-2">
                <Label htmlFor="discount-percentage">Discount Percentage</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="discount-percentage"
                    type="number"
                    min="1"
                    max="100"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="flex-1"
                    data-testid="input-discount-percentage"
                  />
                  <span className="text-lg font-medium">%</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="bonus-hours">Bonus Hours</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="bonus-hours"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={bonusHours}
                    onChange={(e) => setBonusHours(e.target.value)}
                    className="flex-1"
                    data-testid="input-bonus-hours"
                  />
                  <span className="text-lg font-medium">hours</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      data-testid="button-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                      data-testid="button-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      disabled={(date) => date < startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h3 className="font-bold text-lg">Live Preview</h3>
            </div>
            <div className="space-y-2 text-sm" data-testid="promotion-preview">
              {type === 'discount' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Price:</span>
                    <span className="font-medium line-through">₹{price}</span>
                  </div>
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount ({discountPercentage}%):</span>
                    <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Customer Pays:</span>
                    <span className="text-primary">₹{finalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span>Duration:</span>
                    <span className="font-medium">{formatHours(durationInHours)}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-center font-bold text-green-600 dark:text-green-400">
                      Customer Saves: ₹{discountAmount.toFixed(2)}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer Pays:</span>
                    <span className="font-bold text-lg">₹{price}</span>
                  </div>
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Bonus Hours:</span>
                    <span className="font-medium">+{formatHours(bonusHoursNum)} FREE</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total Duration:</span>
                    <span className="text-primary">{formatHours(totalHours)}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-center font-bold text-green-600 dark:text-green-400">
                      Customer Gets: {formatHours(bonusHoursNum)} FREE!
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-promotion">
            Cancel
          </Button>
          <Button onClick={handleConfirm} data-testid="button-confirm-promotion">
            ✓ Use This {type === 'discount' ? 'Discount' : 'Bonus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
