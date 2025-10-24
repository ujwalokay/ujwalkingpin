import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Package, AlertTriangle, TrendingUp, TrendingDown, Trash2, RefreshCw } from "lucide-react";
import { useToastWithSound } from "@/hooks/useToastWithSound";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { FoodItem } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Inventory() {
  const { toast } = useToastWithSound();
  const { canMakeChanges } = useAuth();
  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; item: FoodItem | null; type: 'add' | 'remove' }>({
    open: false,
    item: null,
    type: 'add',
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: FoodItem | null }>({
    open: false,
    item: null,
  });
  const [quantity, setQuantity] = useState("");

  const { data: foodItems = [], isLoading } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items"],
  });

  const { data: lowStockItems = [] } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items/low-stock"],
  });

  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, quantity, type }: { id: string; quantity: number; type: 'add' | 'remove' }) => {
      const response = await fetch(`/api/food-items/${id}/adjust-stock`, {
        method: "POST",
        body: JSON.stringify({ quantity, type }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to adjust stock");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/low-stock"] });
      toast({ 
        title: "Stock Updated", 
        description: `${variables.type === 'add' ? 'Added' : 'Removed'} ${variables.quantity} items from stock` 
      });
      setAdjustDialog({ open: false, item: null, type: 'add' });
      setQuantity("");
    },
  });

  const deleteFoodItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/food-items/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/low-stock"] });
      const deletedItem = foodItems.find(item => item.id === deletedId);
      toast({ 
        title: "Item Deleted", 
        description: `${deletedItem?.name || 'Food item'} has been removed from inventory` 
      });
      setDeleteDialog({ open: false, item: null });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete food item", 
        variant: "destructive" 
      });
    },
  });

  const handleAdjustStock = () => {
    if (!adjustDialog.item) return;
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Error", description: "Please enter a valid quantity", variant: "destructive" });
      return;
    }
    adjustStockMutation.mutate({ id: adjustDialog.item.id, quantity: qty, type: adjustDialog.type });
  };

  const handleDeleteItem = () => {
    if (!deleteDialog.item) return;
    deleteFoodItemMutation.mutate(deleteDialog.item.id);
  };

  const openAdjustDialog = (item: FoodItem, type: 'add' | 'remove') => {
    setQuantity("");
    setAdjustDialog({ open: true, item, type });
  };

  const openDeleteDialog = (item: FoodItem) => {
    setDeleteDialog({ open: true, item });
  };

  const getStockStatus = (item: FoodItem) => {
    if (item.currentStock === 0) return { label: "Out of Stock", color: "bg-red-500", textColor: "text-red-500" };
    if (item.currentStock < item.minStockLevel) return { label: "Low Stock", color: "bg-yellow-500", textColor: "text-yellow-500" };
    return { label: "In Stock", color: "bg-green-500", textColor: "text-green-500" };
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
    queryClient.invalidateQueries({ queryKey: ["/api/food-items/low-stock"] });
    toast({ 
      title: "Inventory Refreshed", 
      description: "Food items data has been updated" 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
        <p className="text-muted-foreground">Loading inventory...</p>
      </div>
    );
  }

  const totalItems = foodItems.length;
  const totalStock = foodItems.reduce((sum, item) => sum + item.currentStock, 0);
  const lowStockCount = lowStockItems.length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track and manage stock levels for food items</p>
        </div>
        <Button 
          onClick={handleRefresh}
          variant="outline"
          data-testid="button-refresh-inventory"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{lowStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Alert variant="destructive" data-testid="alert-low-stock">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Low Stock Alert</AlertTitle>
          <AlertDescription>
            {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} running low on stock: {lowStockItems.map(item => item.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Manage stock levels for all food items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-muted-foreground">Item</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Price</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Current Stock</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Min Level</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {foodItems.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="border-b hover:bg-muted/50" data-testid={`row-inventory-${item.id}`}>
                      <td className="p-3 font-medium" data-testid={`text-item-name-${item.id}`}>{item.name}</td>
                      <td className="p-3" data-testid={`text-item-price-${item.id}`}>₹{item.price}</td>
                      <td className="p-3" data-testid={`text-item-stock-${item.id}`}>
                        <span className={`font-bold ${status.textColor}`}>{item.currentStock}</span>
                      </td>
                      <td className="p-3" data-testid={`text-item-min-${item.id}`}>{item.minStockLevel}</td>
                      <td className="p-3">
                        <Badge variant={item.currentStock === 0 ? "destructive" : item.currentStock < item.minStockLevel ? "secondary" : "default"} data-testid={`badge-status-${item.id}`}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAdjustDialog(item, 'add')}
                            disabled={!canMakeChanges}
                            data-testid={`button-add-stock-${item.id}`}
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAdjustDialog(item, 'remove')}
                            disabled={!canMakeChanges || item.currentStock === 0}
                            data-testid={`button-remove-stock-${item.id}`}
                          >
                            <TrendingDown className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openDeleteDialog(item)}
                            disabled={!canMakeChanges}
                            data-testid={`button-delete-item-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialog.open} onOpenChange={(open) => !open && setAdjustDialog({ open: false, item: null, type: 'add' })}>
        <DialogContent data-testid="dialog-adjust-stock">
          <DialogHeader>
            <DialogTitle>
              {adjustDialog.type === 'add' ? 'Add Stock' : 'Remove Stock'} - {adjustDialog.item?.name}
            </DialogTitle>
            <DialogDescription>
              Current stock: {adjustDialog.item?.currentStock} | Min level: {adjustDialog.item?.minStockLevel}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                data-testid="input-quantity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustDialog({ open: false, item: null, type: 'add' })}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustStock}
              disabled={adjustStockMutation.isPending}
              data-testid="button-confirm-adjust"
            >
              {adjustStockMutation.isPending ? "Updating..." : adjustDialog.type === 'add' ? 'Add Stock' : 'Remove Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, item: null })}>
        <DialogContent data-testid="dialog-delete-item">
          <DialogHeader>
            <DialogTitle>Delete Food Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.item?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, item: null })}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteItem}
              disabled={deleteFoodItemMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteFoodItemMutation.isPending ? "Deleting..." : "Delete Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
