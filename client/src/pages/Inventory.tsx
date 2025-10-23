import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Package, AlertTriangle, TrendingUp, TrendingDown, ShoppingCart, X, RefreshCw } from "lucide-react";
import { useToastWithSound } from "@/hooks/useToastWithSound";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";
import type { FoodItem } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Inventory() {
  const { toast } = useToastWithSound();
  const { canMakeChanges } = useAuth();
  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; item: FoodItem | null; type: 'add' | 'remove' }>({
    open: false,
    item: null,
    type: 'add',
  });
  const [selectItemsDialog, setSelectItemsDialog] = useState(false);
  const [tempSelectedItems, setTempSelectedItems] = useState<Set<string>>(new Set());
  const [itemsToOrder, setItemsToOrder] = useState<Set<string>>(new Set());
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

  const handleAdjustStock = () => {
    if (!adjustDialog.item) return;
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Error", description: "Please enter a valid quantity", variant: "destructive" });
      return;
    }
    adjustStockMutation.mutate({ id: adjustDialog.item.id, quantity: qty, type: adjustDialog.type });
  };

  const openAdjustDialog = (item: FoodItem, type: 'add' | 'remove') => {
    setQuantity("");
    setAdjustDialog({ open: true, item, type });
  };

  const getStockStatus = (item: FoodItem) => {
    if (item.currentStock === 0) return { label: "Out of Stock", color: "bg-red-500", textColor: "text-red-500" };
    if (item.currentStock < item.minStockLevel) return { label: "Low Stock", color: "bg-yellow-500", textColor: "text-yellow-500" };
    return { label: "In Stock", color: "bg-green-500", textColor: "text-green-500" };
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(tempSelectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setTempSelectedItems(newSelected);
  };

  const handleSelectLowStockItems = () => {
    const lowStockIds = new Set(lowStockItems.map(item => item.id));
    setTempSelectedItems(lowStockIds);
  };

  const handleClearSelection = () => {
    setTempSelectedItems(new Set());
  };

  const handleConfirmSelection = () => {
    if (tempSelectedItems.size === 0) {
      toast({ title: "No Items Selected", description: "Please select items you need to order", variant: "destructive" });
      return;
    }

    setItemsToOrder(new Set(tempSelectedItems));
    
    const selectedItemNames = foodItems
      .filter(item => tempSelectedItems.has(item.id))
      .map(item => item.name);

    toast({ 
      title: "Items Added to Order List", 
      description: `${tempSelectedItems.size} item(s) added: ${selectedItemNames.join(', ')}` 
    });
    
    setSelectItemsDialog(false);
    setTempSelectedItems(new Set());
  };

  const removeFromOrderList = (itemId: string) => {
    const newItems = new Set(itemsToOrder);
    newItems.delete(itemId);
    setItemsToOrder(newItems);
    
    const item = foodItems.find(f => f.id === itemId);
    if (item) {
      toast({ 
        title: "Item Removed", 
        description: `${item.name} removed from order list` 
      });
    }
  };

  const clearOrderList = () => {
    setItemsToOrder(new Set());
    toast({ title: "Order List Cleared", description: "All items removed from order list" });
  };

  const openSelectDialog = () => {
    setTempSelectedItems(new Set(itemsToOrder));
    setSelectItemsDialog(true);
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
  const itemsToOrderList = foodItems.filter(item => itemsToOrder.has(item.id));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track and manage stock levels for food items</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={handleRefresh}
            variant="outline"
            data-testid="button-refresh-inventory"
            className="flex-1 sm:flex-initial"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={openSelectDialog}
            disabled={!canMakeChanges}
            data-testid="button-select-items"
            className="flex-1 sm:flex-initial"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Select Items to Order
            {itemsToOrder.size > 0 && (
              <Badge variant="secondary" className="ml-2" data-testid="badge-order-count">
                {itemsToOrder.size}
              </Badge>
            )}
          </Button>
        </div>
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

      {/* Items to Order List */}
      {itemsToOrder.size > 0 && (
        <Card data-testid="card-order-list">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Items to Order</CardTitle>
                <CardDescription>Food items selected for ordering</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearOrderList}
                data-testid="button-clear-order-list"
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {itemsToOrderList.map((item) => {
                const status = getStockStatus(item);
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`order-item-${item.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <p className="font-medium" data-testid={`text-order-name-${item.id}`}>{item.name}</p>
                        <p className="text-sm text-muted-foreground">₹{item.price}</p>
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${status.textColor}`}>
                          Stock: {item.currentStock}
                        </p>
                      </div>
                      <Badge variant={item.currentStock === 0 ? "destructive" : item.currentStock < item.minStockLevel ? "secondary" : "default"}>
                        {status.label}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromOrderList(item.id)}
                      data-testid={`button-remove-order-${item.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Select Items Dialog */}
      <Dialog open={selectItemsDialog} onOpenChange={setSelectItemsDialog}>
        <DialogContent className="max-w-2xl" data-testid="dialog-select-items">
          <DialogHeader>
            <DialogTitle>Select Items to Order</DialogTitle>
            <DialogDescription>
              Choose food items that need to be ordered or restocked
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectLowStockItems}
                data-testid="button-select-low-stock"
              >
                Select Low Stock Items
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearSelection}
                data-testid="button-clear-selection"
              >
                Clear Selection
              </Button>
            </div>

            <ScrollArea className="h-[400px] border rounded-md">
              <div className="p-4 space-y-3">
                {foodItems.map((item) => {
                  const status = getStockStatus(item);
                  const isSelected = tempSelectedItems.has(item.id);
                  
                  return (
                    <div 
                      key={item.id} 
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50"
                      data-testid={`item-select-${item.id}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`checkbox-item-${item.id}`}
                      />
                      <div 
                        className="flex-1 grid grid-cols-4 gap-4 cursor-pointer"
                        onClick={() => toggleItemSelection(item.id)}
                      >
                        <div>
                          <p className="font-medium" data-testid={`text-select-name-${item.id}`}>{item.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">₹{item.price}</p>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${status.textColor}`}>
                            Stock: {item.currentStock}
                          </p>
                        </div>
                        <div>
                          <Badge variant={item.currentStock === 0 ? "destructive" : item.currentStock < item.minStockLevel ? "secondary" : "default"}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="text-sm text-muted-foreground">
              {tempSelectedItems.size} item{tempSelectedItems.size !== 1 ? 's' : ''} selected
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectItemsDialog(false);
                setTempSelectedItems(new Set());
              }}
              data-testid="button-cancel-select"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSelection}
              data-testid="button-confirm-select"
            >
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
