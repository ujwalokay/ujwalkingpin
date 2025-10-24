import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Package, Plus, Trash2, Minus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { FoodItem } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Inventory() {
  const { toast } = useToast();
  const { canMakeChanges } = useAuth();
  const [addDialog, setAddDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: FoodItem | null }>({
    open: false,
    item: null,
  });
  const [stockDialog, setStockDialog] = useState<{
    open: boolean;
    item: FoodItem | null;
    type: 'add' | 'remove';
  }>({
    open: false,
    item: null,
    type: 'add',
  });
  const [stockQuantity, setStockQuantity] = useState("");

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

  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, quantity, type }: { id: string; quantity: number; type: 'add' | 'remove' }) => {
      return await apiRequest("POST", `/api/food-items/${id}/adjust-stock`, { quantity, type });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/inventory"] });
      toast({ 
        title: "Stock Updated", 
        description: `${variables.type === 'add' ? 'Added' : 'Removed'} ${variables.quantity} units` 
      });
      setStockDialog({ open: false, item: null, type: 'add' });
      setStockQuantity("");
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update stock", 
        variant: "destructive" 
      });
    },
  });

  const openDeleteDialog = (item: FoodItem) => {
    setDeleteDialog({ open: true, item });
  };

  const openStockDialog = (item: FoodItem, type: 'add' | 'remove') => {
    setStockDialog({ open: true, item, type });
    setStockQuantity("");
  };

  const handleRemoveFromInventory = () => {
    if (!deleteDialog.item) return;
    removeFromInventoryMutation.mutate(deleteDialog.item.id);
  };

  const handleAdjustStock = () => {
    if (!stockDialog.item || !stockQuantity) return;
    const quantity = parseInt(stockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid positive number",
        variant: "destructive"
      });
      return;
    }
    adjustStockMutation.mutate({
      id: stockDialog.item.id,
      quantity,
      type: stockDialog.type
    });
  };

  const lowStockItems = inventoryItems.filter(item => item.currentStock < item.minStockLevel);

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
          <p className="text-sm sm:text-base text-muted-foreground">Manage your food inventory stock levels</p>
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

      {lowStockItems.length > 0 && (
        <Alert variant="destructive" data-testid="alert-low-stock">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Low Stock Warning:</strong> {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} below minimum quantity - {lowStockItems.map(item => item.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Food Name</TableHead>
                <TableHead className="w-[150px]">Min Quantity</TableHead>
                <TableHead className="w-[150px]">Available Quantity</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => {
                const isLowStock = item.currentStock < item.minStockLevel;
                return (
                  <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                    <TableCell className="font-medium" data-testid={`text-food-name-${item.id}`}>
                      {item.name}
                      <div className="text-sm text-muted-foreground">₹{item.price}</div>
                    </TableCell>
                    <TableCell data-testid={`text-min-quantity-${item.id}`}>
                      {item.minStockLevel}
                    </TableCell>
                    <TableCell data-testid={`text-available-quantity-${item.id}`}>
                      <span className={isLowStock ? "text-destructive font-semibold" : ""}>
                        {item.currentStock}
                      </span>
                    </TableCell>
                    <TableCell data-testid={`text-status-${item.id}`}>
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-destructive text-sm">
                          <AlertTriangle className="h-3 w-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400 text-sm">
                          In Stock
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStockDialog(item, 'add')}
                          disabled={!canMakeChanges}
                          data-testid={`button-add-stock-${item.id}`}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStockDialog(item, 'remove')}
                          disabled={!canMakeChanges}
                          data-testid={`button-remove-stock-${item.id}`}
                        >
                          <Minus className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(item)}
                          disabled={!canMakeChanges}
                          data-testid={`button-delete-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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

      {/* Stock Adjustment Dialog */}
      <Dialog open={stockDialog.open} onOpenChange={(open) => !open && setStockDialog({ open: false, item: null, type: 'add' })}>
        <DialogContent data-testid="dialog-adjust-stock">
          <DialogHeader>
            <DialogTitle>{stockDialog.type === 'add' ? 'Add Stock' : 'Remove Stock'}</DialogTitle>
            <DialogDescription>
              {stockDialog.type === 'add' 
                ? `Add stock quantity to "${stockDialog.item?.name}"`
                : `Remove stock quantity from "${stockDialog.item?.name}"`
              }
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Current Stock: {stockDialog.item?.currentStock} | Min Level: {stockDialog.item?.minStockLevel}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                data-testid="input-stock-quantity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStockDialog({ open: false, item: null, type: 'add' })}
              data-testid="button-cancel-adjust"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustStock}
              disabled={adjustStockMutation.isPending || !stockQuantity}
              data-testid="button-confirm-adjust"
            >
              {adjustStockMutation.isPending ? "Updating..." : stockDialog.type === 'add' ? 'Add Stock' : 'Remove Stock'}
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
