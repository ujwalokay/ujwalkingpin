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
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[85vh] sm:max-h-[85vh] p-3 sm:p-6 flex flex-col" data-testid="dialog-add-food-to-booking">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base sm:text-xl">Add Food to Booking</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {seatName} - {customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Search Food Items</Label>
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search for food items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-9 text-xs sm:text-base h-8 sm:h-10"
                data-testid="input-search-food"
              />
            </div>
          </div>

          <div className="border rounded-lg max-h-[180px] sm:max-h-[280px] overflow-y-auto">
            <div className="grid gap-1.5 sm:gap-2 p-2 sm:p-3">
              {filteredFoodItems.map((item) => {
                const quantity = getQuantity(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    data-testid={`food-item-${item.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-base truncate">{item.name}</p>
                      <p className="text-[10px] sm:text-sm text-muted-foreground">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 sm:h-9 sm:w-9"
                        onClick={() => updateQuantity(item, -1)}
                        disabled={quantity === 0}
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="w-5 sm:w-7 text-center font-semibold text-xs sm:text-base" data-testid={`quantity-${item.id}`}>
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 sm:h-9 sm:w-9"
                        onClick={() => updateQuantity(item, 1)}
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedItems.size > 0 && (
            <div className="space-y-2 p-2.5 sm:p-4 border rounded-lg bg-accent/20">
              <h4 className="font-semibold text-[11px] sm:text-sm">Selected Items</h4>
              <div className="space-y-0.5 sm:space-y-1 max-h-[80px] sm:max-h-[100px] overflow-y-auto">
                {Array.from(selectedItems.values()).map((order, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-[10px] sm:text-sm gap-2"
                    data-testid={`selected-item-${index}`}
                  >
                    <span className="truncate">
                      {order.foodName} × {order.quantity}
                    </span>
                    <span className="font-semibold whitespace-nowrap">
                      ₹{(parseFloat(order.price) * order.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-1.5 sm:pt-2 border-t flex justify-between items-center">
                <span className="font-bold text-[11px] sm:text-sm">Total:</span>
                <span className="text-sm sm:text-lg font-bold text-primary" data-testid="text-total-amount">
                  ₹{calculateTotal().toFixed(0)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 flex-shrink-0 mt-3 sm:mt-4">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto h-9 text-xs sm:text-sm" data-testid="button-cancel-add-food-booking">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedItems.size === 0}
            className="w-full sm:w-auto h-9 text-xs sm:text-sm"
            data-testid="button-confirm-add-food-booking"
          >
            Add Food (₹{calculateTotal().toFixed(0)})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
