import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";

interface PriceSlot {
  duration: string;
  price: number;
}

interface PricingTableProps {
  category: string;
  slots: PriceSlot[];
  onUpdateSlots?: (slots: PriceSlot[]) => void;
}

export function PricingTable({ category, slots: initialSlots, onUpdateSlots }: PricingTableProps) {
  const [slots, setSlots] = useState(initialSlots);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(slots[index].price.toString());
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      const newSlots = [...slots];
      newSlots[editingIndex].price = parseInt(editValue) || 0;
      setSlots(newSlots);
      onUpdateSlots?.(newSlots);
      setEditingIndex(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  return (
    <Card data-testid={`card-pricing-${category.toLowerCase()}`}>
      <CardHeader>
        <CardTitle>{category} Pricing</CardTitle>
        <CardDescription>Set pricing for different time slots</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {slots.map((slot, index) => (
            <div
              key={slot.duration}
              className="flex items-center justify-between rounded-md border p-3 hover-elevate"
              data-testid={`row-pricing-${category.toLowerCase()}-${index}`}
            >
              <span className="text-sm font-medium">{slot.duration}</span>
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
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
