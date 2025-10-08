import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react";

interface PriceSlot {
  duration: string;
  price: number;
}

interface PricingTableProps {
  category: string;
  slots: PriceSlot[];
  onUpdateSlots?: (slots: PriceSlot[]) => void;
}

export function PricingTable({ category, slots, onUpdateSlots }: PricingTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDurationHours, setEditDurationHours] = useState(0);
  const [editDurationMins, setEditDurationMins] = useState(0);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(slots[index].price.toString());
    const totalMins = getDurationMinutes(slots[index].duration);
    setEditDurationHours(Math.floor(totalMins / 60));
    setEditDurationMins(totalMins % 60);
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      const newSlots = [...slots];
      const totalMins = editDurationHours * 60 + editDurationMins;
      newSlots[editingIndex].price = parseInt(editValue) || 0;
      newSlots[editingIndex].duration = getDurationString(totalMins);
      onUpdateSlots?.(newSlots);
      setEditingIndex(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
    setEditDurationHours(0);
    setEditDurationMins(0);
  };

  const getDurationMinutes = (duration: string): number => {
    const match = duration.match(/(\d+)\s*(mins?|hours?)/i);
    if (!match) return 30;
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    return unit.startsWith('hour') ? value * 60 : value;
  };

  const getDurationString = (mins: number): string => {
    if (mins < 60) return `${mins} mins`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (remainingMins === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMins} mins`;
  };

  const addSlot = () => {
    if (slots.length === 0) {
      const newSlots = [{ duration: "30 mins", price: 0 }];
      onUpdateSlots?.(newSlots);
      return;
    }
    const lastSlot = slots[slots.length - 1];
    const lastMins = getDurationMinutes(lastSlot.duration);
    const newMins = lastMins + 30;
    const newSlots = [...slots, { duration: getDurationString(newMins), price: 0 }];
    onUpdateSlots?.(newSlots);
  };

  const removeSlot = (index: number) => {
    if (slots.length > 1) {
      const newSlots = slots.filter((_, i) => i !== index);
      onUpdateSlots?.(newSlots);
    }
  };

  return (
    <Card className="glass-card" data-testid={`card-pricing-${category.toLowerCase()}`}>
      <CardHeader>
        <CardTitle>{category} Pricing</CardTitle>
        <CardDescription>Set pricing for different time slots</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {slots.map((slot, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-md border p-3 hover-elevate"
              data-testid={`row-pricing-${category.toLowerCase()}-${index}`}
            >
              {editingIndex === index ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      value={editDurationHours}
                      onChange={(e) => setEditDurationHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-12 h-8 text-center"
                      data-testid={`input-duration-hours-${category.toLowerCase()}-${index}`}
                    />
                    <span className="text-xs text-muted-foreground">hr</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      step="30"
                      value={editDurationMins}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setEditDurationMins(value >= 30 ? 30 : 0);
                      }}
                      className="w-12 h-8 text-center"
                      data-testid={`input-duration-mins-${category.toLowerCase()}-${index}`}
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
              ) : (
                <span className="text-sm font-medium">{slot.duration}</span>
              )}
              <div className="flex items-center gap-2">
                {editingIndex === index ? (
                  <>
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24 h-8"
                      data-testid={`input-price-${category.toLowerCase()}-${index}`}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveEdit} data-testid={`button-save-${index}`}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit} data-testid={`button-cancel-${index}`}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-primary" data-testid={`text-price-${category.toLowerCase()}-${index}`}>
                      ₹{slot.price}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => startEdit(index)}
                      data-testid={`button-edit-${category.toLowerCase()}-${index}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {slots.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => removeSlot(index)}
                        data-testid={`button-remove-${category.toLowerCase()}-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full"
            onClick={addSlot}
            data-testid={`button-add-slot-${category.toLowerCase()}`}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Time Slot (+30 mins)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
