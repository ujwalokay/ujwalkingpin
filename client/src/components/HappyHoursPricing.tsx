import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react";

interface PriceSlot {
  duration: string;
  price: number;
  personCount?: number;
}

interface HappyHoursPricingProps {
  category: string;
  slots: PriceSlot[];
  onUpdateSlots?: (slots: PriceSlot[]) => void;
}

export function HappyHoursPricing({ category, slots, onUpdateSlots }: HappyHoursPricingProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDurationHours, setEditDurationHours] = useState(0);
  const [editDurationMins, setEditDurationMins] = useState(0);
  const [editPersonCount, setEditPersonCount] = useState(1);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(slots[index].price.toString());
    const totalMins = getDurationMinutes(slots[index].duration);
    setEditDurationHours(Math.floor(totalMins / 60));
    setEditDurationMins(totalMins % 60);
    setEditPersonCount(slots[index].personCount || 1);
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      const newSlots = [...slots];
      const totalMins = editDurationHours * 60 + editDurationMins;
      newSlots[editingIndex].price = parseInt(editValue) || 0;
      newSlots[editingIndex].duration = getDurationString(totalMins);
      // Only PS5 category can have personCount > 1, force others to 1
      newSlots[editingIndex].personCount = category === "PS5" ? editPersonCount : 1;
      onUpdateSlots?.(newSlots);
      setEditingIndex(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
    setEditDurationHours(0);
    setEditDurationMins(0);
    setEditPersonCount(1);
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
      const newSlots = [{ duration: "30 mins", price: 0, personCount: 1 }];
      onUpdateSlots?.(newSlots);
      return;
    }
    const lastSlot = slots[slots.length - 1];
    const lastMins = getDurationMinutes(lastSlot.duration);
    const newMins = lastMins + 30;
    const newSlots = [...slots, { duration: getDurationString(newMins), price: 0, personCount: 1 }];
    onUpdateSlots?.(newSlots);
  };

  const removeSlot = (index: number) => {
    if (slots.length > 1) {
      const newSlots = slots.filter((_, i) => i !== index);
      onUpdateSlots?.(newSlots);
    }
  };

  return (
    <Card className="glass-card" data-testid={`card-happy-hours-pricing-${category.toLowerCase()}`}>
      <CardHeader>
        <CardTitle>{category} Happy Hours Pricing</CardTitle>
        <CardDescription>Set happy hours pricing for different time slots</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {slots.map((slot, index) => (
            <div
              key={index}
              className="rounded-md border p-3 lg:p-4 hover-elevate transition-all"
              data-testid={`row-happy-hours-pricing-${category.toLowerCase()}-${index}`}
            >
              {editingIndex === index ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="0"
                        value={editDurationHours}
                        onChange={(e) => setEditDurationHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 lg:w-20 h-9 lg:h-10 text-center text-sm lg:text-base"
                        data-testid={`input-hh-duration-hours-${category.toLowerCase()}-${index}`}
                      />
                      <span className="text-xs lg:text-sm text-muted-foreground font-medium">hr</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="0"
                        step="30"
                        value={editDurationMins}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setEditDurationMins(value >= 30 ? 30 : 0);
                        }}
                        className="w-16 lg:w-20 h-9 lg:h-10 text-center text-sm lg:text-base"
                        data-testid={`input-hh-duration-mins-${category.toLowerCase()}-${index}`}
                      />
                      <span className="text-xs lg:text-sm text-muted-foreground font-medium">min</span>
                    </div>
                    {category === "PS5" && (
                      <>
                        <span className="text-xs lg:text-sm text-muted-foreground">+</span>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min="1"
                            value={editPersonCount}
                            onChange={(e) => setEditPersonCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 lg:w-20 h-9 lg:h-10 text-center text-sm lg:text-base"
                            data-testid={`input-hh-person-count-${category.toLowerCase()}-${index}`}
                          />
                          <span className="text-xs lg:text-sm text-muted-foreground font-medium">person</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="flex items-center gap-1.5 lg:gap-2 flex-1">
                      <span className="text-sm lg:text-base text-muted-foreground font-semibold">₹</span>
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full max-w-[200px] h-9 lg:h-10 text-sm lg:text-base"
                        placeholder="Price"
                        data-testid={`input-hh-price-${category.toLowerCase()}-${index}`}
                      />
                    </div>
                    <Button size="icon" variant="ghost" className="h-9 w-9 lg:h-10 lg:w-10 shrink-0 hover:bg-green-100 dark:hover:bg-green-900" onClick={saveEdit} data-testid={`button-hh-save-${index}`}>
                      <Check className="h-4 w-4 lg:h-5 lg:w-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-9 w-9 lg:h-10 lg:w-10 shrink-0 hover:bg-red-100 dark:hover:bg-red-900" onClick={cancelEdit} data-testid={`button-hh-cancel-${index}`}>
                      <X className="h-4 w-4 lg:h-5 lg:w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm lg:text-base font-medium flex-1">
                    {slot.duration}{category === "PS5" ? ` + ${slot.personCount || 1} person` : ''}
                  </div>
                  <div className="flex items-center gap-2 lg:gap-3">
                    <span className="font-bold text-primary text-lg lg:text-xl" data-testid={`text-hh-price-${category.toLowerCase()}-${index}`}>
                      ₹{slot.price}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 lg:h-10 lg:w-10 shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                      onClick={() => startEdit(index)}
                      data-testid={`button-hh-edit-${category.toLowerCase()}-${index}`}
                    >
                      <Pencil className="h-4 w-4 lg:h-5 lg:w-5" />
                    </Button>
                    {slots.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 lg:h-10 lg:w-10 shrink-0 hover:bg-red-100 dark:hover:bg-red-900"
                        onClick={() => removeSlot(index)}
                        data-testid={`button-hh-remove-${category.toLowerCase()}-${index}`}
                      >
                        <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full"
            onClick={addSlot}
            data-testid={`button-hh-add-slot-${category.toLowerCase()}`}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Time Slot (+30 mins)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
