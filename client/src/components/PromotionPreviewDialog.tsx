import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

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
  onConfirm,
}: PromotionPreviewDialogProps) {
  const [discountPercentage, setDiscountPercentage] = useState<number>(10);
  const [bonusHours, setBonusHours] = useState<string>("1");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const handleConfirm = () => {
    onConfirm({
      discountPercentage: type === 'discount' ? discountPercentage : undefined,
      bonusHours: type === 'bonus' ? bonusHours : undefined,
      startDate,
      endDate,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-promotion-preview">
        <DialogHeader>
          <DialogTitle>
            {type === 'discount' ? 'Add Discount Promotion' : 'Add Bonus Hours Promotion'}
          </DialogTitle>
          <DialogDescription>
            Configure the promotion for {category} - {duration} ({personCount} person{personCount > 1 ? 's' : ''})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Original Price: <span className="font-semibold">₹{price}</span>
            </p>
          </div>

          {type === 'discount' ? (
            <div className="space-y-2">
              <Label htmlFor="discount-percentage">Discount Percentage (%)</Label>
              <Input
                id="discount-percentage"
                type="number"
                min="1"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(parseInt(e.target.value) || 0)}
                data-testid="input-discount-percentage"
              />
              <p className="text-sm text-muted-foreground">
                Final Price: <span className="font-semibold">₹{(price * (100 - discountPercentage) / 100).toFixed(2)}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="bonus-hours">Bonus Hours</Label>
              <Input
                id="bonus-hours"
                type="text"
                placeholder="e.g., 1 or 0.5"
                value={bonusHours}
                onChange={(e) => setBonusHours(e.target.value)}
                data-testid="input-bonus-hours"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start" data-testid="button-start-date">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={(date) => date && setStartDate(date)} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start" data-testid="button-end-date">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={(date) => date && setEndDate(date)} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleConfirm} data-testid="button-confirm">
            Create Promotion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
