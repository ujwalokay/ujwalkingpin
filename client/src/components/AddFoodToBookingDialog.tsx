import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Minus } from "lucide-react";
import type { FoodItem } from "@shared/schema";

interface FoodOrder {
  foodId: string;
  foodName: string;
  price: string;
  quantity: number;
}

interface AddFoodToBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  seatName: string;
  customerName: string;
  onConfirm: (bookingId: string, foodOrders: FoodOrder[]) => void;
}

export function AddFoodToBookingDialog({
  open,
  onOpenChange,
  bookingId,
  seatName,
  customerName,
  onConfirm,
}: AddFoodToBookingDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<Map<string, FoodOrder>>(new Map());

  const { data: foodItems = [] } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items"],
  });

  const filteredFoodItems = foodItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateQuantity = (item: FoodItem, delta: number) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(item.id);

      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          newMap.delete(item.id);
        } else {
          newMap.set(item.id, { ...existing, quantity: newQuantity });
        }
      } else if (delta > 0) {
        newMap.set(item.id, {
          foodId: item.id,
          foodName: item.name,
          price: item.price,
          quantity: 1,
        });
      }

      return newMap;
    });
  };

  const getQuantity = (itemId: string): number => {
    return selectedItems.get(itemId)?.quantity || 0;
  };

  const calculateTotal = (): number => {
    return Array.from(selectedItems.values()).reduce(
      (sum, order) => sum + parseFloat(order.price) * order.quantity,
      0
    );
  };

  const handleConfirm = () => {
    if (selectedItems.size === 0) return;
    onConfirm(bookingId, Array.from(selectedItems.values()));
    setSelectedItems(new Map());
    setSearchTerm("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedItems(new Map());
    setSearchTerm("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]" data-testid="dialog-add-food-to-booking">
        <DialogHeader>
          <DialogTitle>Add Food to Booking</DialogTitle>
          <DialogDescription>
            {seatName} - {customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Food Items</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for food items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-food"
              />
            </div>
          </div>

          <div className="border rounded-lg max-h-[300px] overflow-y-auto">
            <div className="grid gap-2 p-4">
              {filteredFoodItems.map((item) => {
                const quantity = getQuantity(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    data-testid={`food-item-${item.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item, -1)}
                        disabled={quantity === 0}
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold" data-testid={`quantity-${item.id}`}>
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item, 1)}
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedItems.size > 0 && (
            <div className="space-y-2 p-4 border rounded-lg bg-accent/20">
              <h4 className="font-semibold text-sm">Selected Items</h4>
              <div className="space-y-1">
                {Array.from(selectedItems.values()).map((order, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm"
                    data-testid={`selected-item-${index}`}
                  >
                    <span>
                      {order.foodName} × {order.quantity}
                    </span>
                    <span className="font-semibold">
                      ₹{(parseFloat(order.price) * order.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="font-bold">Total Amount:</span>
                <span className="text-lg font-bold text-primary" data-testid="text-total-amount">
                  ₹{calculateTotal().toFixed(0)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} data-testid="button-cancel-add-food-booking">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedItems.size === 0}
            data-testid="button-confirm-add-food-booking"
          >
            Add Food (₹{calculateTotal().toFixed(0)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
