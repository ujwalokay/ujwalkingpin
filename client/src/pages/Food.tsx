import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, UtensilsCrossed, Package, CalendarClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { FoodItem } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

interface FormData {
  name: string;
  price: string;
  costPrice: string;
  category: string;
  supplier: string;
  expiryDate: string;
  minStockLevel: string;
}

const initialFormData: FormData = {
  name: "",
  price: "",
  costPrice: "",
  category: "trackable",
  supplier: "",
  expiryDate: "",
  minStockLevel: "10",
};

export default function Food() {
  const { toast } = useToast();
  const { canMakeChanges } = useAuth();
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; item: FoodItem | null }>({
    open: false,
    item: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: "",
    name: "",
  });
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const { data: foodItems = [], isLoading } = useQuery<FoodItem[]>({
    queryKey: ["/api/food-items"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        name: data.name,
        price: data.price,
        costPrice: data.costPrice || undefined,
        category: data.category,
        supplier: data.supplier || undefined,
        expiryDate: data.expiryDate || undefined,
        minStockLevel: parseInt(data.minStockLevel) || 10,
        currentStock: 0,
        inInventory: 0,
      };
      return apiRequest("POST", "/api/food-items", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      toast({ title: "Food Item Added", description: "New item has been added to the menu" });
      setAddDialog(false);
      setFormData(initialFormData);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const payload = {
        name: data.name,
        price: data.price,
        costPrice: data.costPrice || undefined,
        category: data.category,
        supplier: data.supplier || undefined,
        expiryDate: data.expiryDate || undefined,
        minStockLevel: parseInt(data.minStockLevel) || 10,
      };
      return apiRequest("PATCH", `/api/food-items/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      toast({ title: "Food Item Updated", description: "Item has been updated successfully" });
      setEditDialog({ open: false, item: null });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/food-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/food-items"] });
      toast({ title: "Food Item Deleted", description: "Item has been removed from the menu", variant: "destructive" });
      setDeleteDialog({ open: false, id: "", name: "" });
    },
  });

  const handleAdd = () => {
    if (!formData.name || !formData.price) {
      toast({ title: "Error", description: "Please fill in name and price", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (!editDialog.item) return;
    if (!formData.name || !formData.price) {
      toast({ title: "Error", description: "Please fill in name and price", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: editDialog.item.id, data: formData });
  };

  const openEditDialog = (item: FoodItem) => {
    setFormData({
      name: item.name,
      price: item.price,
      costPrice: item.costPrice || "",
      category: item.category || "trackable",
      supplier: item.supplier || "",
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : "",
      minStockLevel: item.minStockLevel.toString(),
    });
    setEditDialog({ open: true, item });
  };

  const openDeleteDialog = (id: string, name: string) => {
    setDeleteDialog({ open: true, id, name });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Food Management</h1>
        <p className="text-muted-foreground">Loading food items...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Food Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage food items available for customers</p>
        </div>
        <Button onClick={() => { setAddDialog(true); setFormData(initialFormData); }} data-testid="button-add-food" data-joyride="add-food-button" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Food Item
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-joyride="food-items-grid">
        {foodItems.map((item) => (
          <div
            key={item.id}
            className="glass-card rounded-lg p-4 space-y-3"
            data-testid={`card-food-${item.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground" data-testid={`text-food-name-${item.id}`}>
                    {item.name}
                  </h3>
                  <p className="text-lg font-bold text-primary" data-testid={`text-food-price-${item.id}`}>
                    ₹{item.price}
                  </p>
                  {item.costPrice && (
                    <p className="text-xs text-muted-foreground">
                      Cost: ₹{item.costPrice} | Profit: ₹{(parseFloat(item.price) - parseFloat(item.costPrice)).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(item)}
                  disabled={!canMakeChanges}
                  data-testid={`button-edit-food-${item.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openDeleteDialog(item.id, item.name)}
                  disabled={!canMakeChanges}
                  data-testid={`button-delete-food-${item.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-1 rounded ${item.category === 'trackable' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-green-500/20 text-green-600 dark:text-green-400'}`}>
                {item.category === 'trackable' ? (
                  <><Package className="h-3 w-3 inline mr-1" />Trackable</>
                ) : (
                  'Made to Order'
                )}
              </span>
              {item.expiryDate && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  {new Date(item.expiryDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-add-food">
          <DialogHeader>
            <DialogTitle>Add Food Item</DialogTitle>
            <DialogDescription>Add a new item to the food menu</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Food Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cold Drink, Chips"
                  data-testid="input-food-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trackable">Trackable (Chips, Drinks)</SelectItem>
                    <SelectItem value="made-to-order">Made to Order (Burger, Pizza)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Selling Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Price customers pay"
                  data-testid="input-food-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (₹)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="What you paid"
                  data-testid="input-cost-price"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Supplier name"
                  data-testid="input-supplier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Min Stock Level *</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                  placeholder="Reorder threshold"
                  data-testid="input-min-stock"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                data-testid="input-expiry-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)} data-testid="button-cancel-add-food">
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createMutation.isPending} data-testid="button-confirm-add-food">
              {createMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ ...editDialog, open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-food">
          <DialogHeader>
            <DialogTitle>Edit Food Item</DialogTitle>
            <DialogDescription>Update the food item details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Food Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cold Drink, Chips"
                  data-testid="input-edit-food-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger data-testid="select-edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trackable">Trackable (Chips, Drinks)</SelectItem>
                    <SelectItem value="made-to-order">Made to Order (Burger, Pizza)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Selling Price (₹) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Price customers pay"
                  data-testid="input-edit-food-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-costPrice">Cost Price (₹)</Label>
                <Input
                  id="edit-costPrice"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="What you paid"
                  data-testid="input-edit-cost-price"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-supplier">Supplier</Label>
                <Input
                  id="edit-supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Supplier name"
                  data-testid="input-edit-supplier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-minStockLevel">Min Stock Level *</Label>
                <Input
                  id="edit-minStockLevel"
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
                  placeholder="Reorder threshold"
                  data-testid="input-edit-min-stock"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="edit-expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                data-testid="input-edit-expiry-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, item: null })} data-testid="button-cancel-edit-food">
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending} data-testid="button-confirm-edit-food">
              {updateMutation.isPending ? "Updating..." : "Update Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent data-testid="dialog-delete-food">
          <DialogHeader>
            <DialogTitle>Delete Food Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, id: "", name: "" })} data-testid="button-cancel-delete-food">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleteDialog.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-food"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
