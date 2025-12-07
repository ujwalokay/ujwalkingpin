import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Package, Plus, Trash2, Minus, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { FoodItem } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { localDb, isTauri } from "@/lib/tauri-db";

interface StockFormData {
  quantity: string;
  costPrice: string;
  supplier: string;
  expiryDate: string;
  notes: string;
}

const initialStockFormData: StockFormData = {
  quantity: "",
  costPrice: "",
  supplier: "",
  expiryDate: "",
  notes: "",
};

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
  const [stockFormData, setStockFormData] = useState<StockFormData>(initialStockFormData);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: allFoodItems = [], isLoading: loadingAll } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items"],
    queryFn: async () => {
      if (isTauri()) {
        return localDb.getAllFoodItems();
      }
      const response = await fetch("/api/food-items");
      if (!response.ok) throw new Error("Failed to fetch food items");
      return response.json();
    },
  });

  const { data: inventoryItems = [], isLoading: loadingInventory } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items/inventory"],
    queryFn: async () => {
      if (isTauri()) {
        return localDb.getInventoryItems();
      }
      const response = await fetch("/api/food-items/inventory");
      if (!response.ok) throw new Error("Failed to fetch inventory items");
      return response.json();
    },
  });

  const { data: expiringItems = [] } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items/expiring"],
    queryFn: async () => {
      if (isTauri()) {
        return localDb.getExpiringItems(7);
      }
      const response = await fetch("/api/food-items/expiring");
      if (!response.ok) throw new Error("Failed to fetch expiring items");
      return response.json();
    },
  });

  const availableItems = allFoodItems.filter(item => item.inInventory === 0);

  const addToInventoryMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isTauri()) {
        return localDb.addToInventory(id);
      }
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
      if (isTauri()) {
        return localDb.removeFromInventory(id);
      }
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
    mutationFn: async ({ id, data }: { id: string; data: StockFormData & { type: 'add' | 'remove' } }) => {
      const quantity = parseInt(data.quantity);
      if (isTauri()) {
        return localDb.adjustStock(id, quantity, data.type);
      }
      const payload = {
        quantity,
        type: data.type,
        costPrice: data.costPrice || undefined,
        supplier: data.supplier || undefined,
        expiryDate: data.expiryDate || undefined,
        notes: data.notes || undefined,
      };
      return await apiRequest("POST", `/api/food-items/${id}/adjust-stock`, payload);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/food-items/expiring"] });
      toast({ 
        title: "Stock Updated", 
        description: `${variables.data.type === 'add' ? 'Added' : 'Removed'} ${variables.data.quantity} units` 
      });
      setStockDialog({ open: false, item: null, type: 'add' });
      setStockFormData(initialStockFormData);
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
    setStockFormData({
      ...initialStockFormData,
      costPrice: item.costPrice || "",
      supplier: item.supplier || "",
    });
  };

  const handleRemoveFromInventory = () => {
    if (!deleteDialog.item) return;
    removeFromInventoryMutation.mutate(deleteDialog.item.id);
  };

  const handleAdjustStock = () => {
    if (!stockDialog.item || !stockFormData.quantity) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid positive number",
        variant: "destructive"
      });
      return;
    }
    const quantity = parseInt(stockFormData.quantity);
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
      data: { ...stockFormData, type: stockDialog.type }
    });
  };

  const filteredItems = categoryFilter === "all" 
    ? inventoryItems 
    : inventoryItems.filter(item => item.category === categoryFilter);

  const lowStockItems = filteredItems.filter(item => item.currentStock < item.minStockLevel);
  const trackableLowStock = inventoryItems.filter(item => item.category === 'trackable' && item.currentStock < item.minStockLevel);

  const calculateProfit = (item: FoodItem) => {
    if (!item.costPrice) return null;
    const profit = parseFloat(item.price) - parseFloat(item.costPrice);
    const margin = (profit / parseFloat(item.price)) * 100;
    return { profit, margin };
  };

  const isExpiringSoon = (item: FoodItem) => {
    if (!item.expiryDate) return false;
    const expiryDate = new Date(item.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
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
          <p className="text-sm sm:text-base text-muted-foreground">Manage your food inventory stock levels</p>
        </div>
        <Button 
          onClick={() => setAddDialog(true)}
          disabled={!canMakeChanges}
          data-testid="button-add-from-food"
          data-joyride="add-to-inventory-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add from Food
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Alert variant="destructive" data-testid="alert-low-stock" data-joyride="low-stock-alert">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Low Stock Warning:</strong> {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} below minimum quantity - {lowStockItems.map(item => item.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {expiringItems.length > 0 && (
        <Alert className="border-orange-500 bg-orange-500/10" data-testid="alert-expiring">
          <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertDescription className="text-orange-600 dark:text-orange-400">
            <strong>Expiring Soon:</strong> {expiringItems.length} item{expiringItems.length > 1 ? 's' : ''} expiring within 7 days - {expiringItems.map(item => item.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={categoryFilter} onValueChange={setCategoryFilter} data-joyride="inventory-tabs">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="trackable">Trackable Only</TabsTrigger>
          <TabsTrigger value="made-to-order">Made to Order</TabsTrigger>
        </TabsList>

        <TabsContent value={categoryFilter} className="mt-4" data-joyride="inventory-table">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No items in this category</h3>
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
                    <TableHead className="w-[250px]">Food Name</TableHead>
                    <TableHead className="w-[120px]">Category</TableHead>
                    <TableHead className="w-[120px]">Min Qty</TableHead>
                    <TableHead className="w-[120px]">Available</TableHead>
                    <TableHead className="w-[150px]">Profit/Margin</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const isLowStock = item.currentStock < item.minStockLevel;
                    const profitData = calculateProfit(item);
                    const expiringSoon = isExpiringSoon(item);
                    
                    return (
                      <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                        <TableCell className="font-medium" data-testid={`text-food-name-${item.id}`}>
                          {item.name}
                          <div className="text-sm text-muted-foreground">₹{item.price}</div>
                          {expiringSoon && (
                            <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              Expires: {new Date(item.expiryDate!).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded ${item.category === 'trackable' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-green-500/20 text-green-600 dark:text-green-400'}`}>
                            {item.category === 'trackable' ? 'Trackable' : 'Made to Order'}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`text-min-quantity-${item.id}`}>
                          {item.minStockLevel}
                        </TableCell>
                        <TableCell data-testid={`text-available-quantity-${item.id}`}>
                          <span className={isLowStock ? "text-destructive font-semibold" : ""}>
                            {item.currentStock}
                          </span>
                        </TableCell>
                        <TableCell data-testid={`text-profit-${item.id}`}>
                          {profitData ? (
                            <div className="flex items-center gap-1 text-sm">
                              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                              <span className="text-green-600 dark:text-green-400">
                                ₹{profitData.profit.toFixed(2)} ({profitData.margin.toFixed(1)}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
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
                            {item.category === 'trackable' && (
                              <>
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
                              </>
                            )}
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
        </TabsContent>
      </Tabs>

      {trackableLowStock.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Reorder List (Trackable Items Below Min Stock)
            </h3>
            <div className="space-y-2">
              {trackableLowStock.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg" data-testid={`reorder-item-${item.id}`}>
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Need: {item.minStockLevel - item.currentStock} more units
                    </span>
                    {item.supplier && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (Supplier: {item.supplier})
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openStockDialog(item, 'add')}
                    disabled={!canMakeChanges}
                    data-testid={`button-restock-${item.id}`}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
                      <span className="text-xs text-muted-foreground">
                        {item.category === 'trackable' ? 'Trackable' : 'Made to Order'}
                      </span>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-adjust-stock">
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
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={stockFormData.quantity}
                onChange={(e) => setStockFormData({ ...stockFormData, quantity: e.target.value })}
                data-testid="input-stock-quantity"
              />
            </div>
            {stockDialog.type === 'add' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch-costPrice">Cost Price (₹)</Label>
                    <Input
                      id="batch-costPrice"
                      type="number"
                      placeholder="Purchase cost per unit"
                      value={stockFormData.costPrice}
                      onChange={(e) => setStockFormData({ ...stockFormData, costPrice: e.target.value })}
                      data-testid="input-batch-cost-price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-supplier">Supplier</Label>
                    <Input
                      id="batch-supplier"
                      placeholder="Supplier name"
                      value={stockFormData.supplier}
                      onChange={(e) => setStockFormData({ ...stockFormData, supplier: e.target.value })}
                      data-testid="input-batch-supplier"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-expiryDate">Expiry Date</Label>
                  <Input
                    id="batch-expiryDate"
                    type="date"
                    value={stockFormData.expiryDate}
                    onChange={(e) => setStockFormData({ ...stockFormData, expiryDate: e.target.value })}
                    data-testid="input-batch-expiry-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-notes">Notes</Label>
                  <Input
                    id="batch-notes"
                    placeholder="Any additional notes"
                    value={stockFormData.notes}
                    onChange={(e) => setStockFormData({ ...stockFormData, notes: e.target.value })}
                    data-testid="input-batch-notes"
                  />
                </div>
              </>
            )}
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
              disabled={adjustStockMutation.isPending || !stockFormData.quantity}
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
