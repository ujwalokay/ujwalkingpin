import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Package, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { FoodItem } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Inventory() {
  const { toast } = useToast();
  const { canMakeChanges } = useAuth();
  const [addDialog, setAddDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: FoodItem | null }>({
    open: false,
    item: null,
  });

  const { data: allFoodItems = [], isLoading: loadingAll } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items"],
  });

  const { data: inventoryItems = [], isLoading: loadingInventory } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items/inventory"],
  });

  const availableItems = allFoodItems.filter(item => item.inInventory === 0);

  const addToInventoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/food-items/${id}/add-to-inventory`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/inventory"] });
      toast({ 
        title: "Added to Inventory", 
        description: `${data.name} has been added to inventory` 
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to add item to inventory", 
        variant: "destructive" 
      });
    },
  });

  const removeFromInventoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/food-items/${id}/remove-from-inventory`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/inventory"] });
      toast({ 
        title: "Removed from Inventory", 
        description: `${data.name} has been removed from inventory` 
      });
      setDeleteDialog({ open: false, item: null });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to remove item from inventory", 
        variant: "destructive" 
      });
    },
  });

  const openDeleteDialog = (item: FoodItem) => {
    setDeleteDialog({ open: true, item });
  };

  const handleRemoveFromInventory = () => {
    if (!deleteDialog.item) return;
    removeFromInventoryMutation.mutate(deleteDialog.item.id);
  };

  if (loadingAll || loadingInventory) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
        <p className="text-muted-foreground">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Selected food items available in inventory</p>
        </div>
        <Button 
          onClick={() => setAddDialog(true)}
          disabled={!canMakeChanges}
          data-testid="button-add-from-food"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add from Food
        </Button>
      </div>

      {inventoryItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No items in inventory</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add items from the Food page to start building your inventory
            </p>
            <Button onClick={() => setAddDialog(true)} disabled={!canMakeChanges} data-testid="button-add-first-item">
              <Plus className="mr-2 h-4 w-4" />
              Add Items
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {inventoryItems.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-lg p-4 space-y-3"
              data-testid={`card-inventory-${item.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground" data-testid={`text-inventory-name-${item.id}`}>
                      {item.name}
                    </h3>
                    <p className="text-lg font-bold text-primary" data-testid={`text-inventory-price-${item.id}`}>
                      ₹{item.price}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-inventory-stock-${item.id}`}>
                      Stock: {item.currentStock}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openDeleteDialog(item)}
                  disabled={!canMakeChanges}
                  data-testid={`button-remove-inventory-${item.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add from Food Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]" data-testid="dialog-add-from-food">
          <DialogHeader>
            <DialogTitle>Add Items to Inventory</DialogTitle>
            <DialogDescription>Select items from the Food catalog to add to your inventory</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[50vh]">
            {availableItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>All food items are already in inventory!</p>
                <p className="text-sm mt-2">Create new items in the Food page first.</p>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {availableItems.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 flex items-center justify-between hover:bg-muted/50"
                    data-testid={`item-available-${item.id}`}
                  >
                    <div>
                      <p className="font-medium" data-testid={`text-available-name-${item.id}`}>{item.name}</p>
                      <p className="text-sm text-primary font-semibold" data-testid={`text-available-price-${item.id}`}>₹{item.price}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addToInventoryMutation.mutate(item.id)}
                      disabled={addToInventoryMutation.isPending}
                      data-testid={`button-add-to-inventory-${item.id}`}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)} data-testid="button-close-add-dialog">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove from Inventory Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, item: null })}>
        <DialogContent data-testid="dialog-remove-from-inventory">
          <DialogHeader>
            <DialogTitle>Remove from Inventory</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{deleteDialog.item?.name}" from inventory?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Note: This will not delete the item from the Food catalog. You can add it back anytime.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, item: null })}
              data-testid="button-cancel-remove"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveFromInventory}
              disabled={removeFromInventoryMutation.isPending}
              data-testid="button-confirm-remove"
            >
              {removeFromInventoryMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
