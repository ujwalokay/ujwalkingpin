import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DeviceConfigCard } from "@/components/DeviceConfigCard";
import { PricingTable } from "@/components/PricingTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Booking } from "@shared/schema";

interface DeviceConfig {
  id: string;
  category: string;
  count: number;
  seats: string[];
}

interface PricingConfig {
  id: string;
  category: string;
  duration: string;
  price: string;
}

interface PricingSlot {
  duration: string;
  price: number;
}

interface CategoryState {
  category: string;
  count: number;
  seats: { name: string; visible: boolean }[];
  pricing: PricingSlot[];
}

export default function Settings() {
  const { toast } = useToast();

  const { data: deviceConfigs, isLoading: deviceLoading } = useQuery<DeviceConfig[]>({
    queryKey: ["device-configs"],
  });

  const { data: pricingConfigs, isLoading: pricingLoading } = useQuery<PricingConfig[]>({
    queryKey: ["pricing-configs"],
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["bookings"],
  });

  const [categories, setCategories] = useState<CategoryState[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (deviceConfigs && pricingConfigs) {
      const categoryMap = new Map<string, CategoryState>();

      deviceConfigs.forEach(config => {
        const pricing = pricingConfigs
          .filter(p => p.category === config.category)
          .map(p => ({ duration: p.duration, price: parseFloat(p.price) }));

        categoryMap.set(config.category, {
          category: config.category,
          count: config.count,
          seats: config.seats.map(seat => ({ name: seat, visible: true })),
          pricing: pricing.length > 0 ? pricing : [{ duration: "30 mins", price: 0 }],
        });
      });

      pricingConfigs.forEach(config => {
        if (!categoryMap.has(config.category)) {
          categoryMap.set(config.category, {
            category: config.category,
            count: 0,
            seats: [],
            pricing: [{ duration: config.duration, price: parseFloat(config.price) }],
          });
        }
      });

      setCategories(Array.from(categoryMap.values()));
    }
  }, [deviceConfigs, pricingConfigs]);

  const saveDeviceConfigMutation = useMutation({
    mutationFn: async (config: { category: string; count: number; seats: string[] }) => {
      return await apiRequest("POST", "/api/device-config", config);
    },
  });

  const savePricingConfigMutation = useMutation({
    mutationFn: async (data: { category: string; configs: { duration: string; price: string | number }[] }) => {
      return await apiRequest("POST", "/api/pricing-config", data);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (category: string) => {
      await apiRequest("DELETE", `/api/device-config/${category}`);
      await apiRequest("DELETE", `/api/pricing-config/${category}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-configs"] });
      queryClient.invalidateQueries({ queryKey: ["pricing-configs"] });
    },
  });

  const updateCategoryCount = (category: string, newCount: number) => {
    setCategories(prev => prev.map(cat => {
      if (cat.category !== category) return cat;

      const currentSeats = cat.seats.length;
      let newSeats = cat.seats;

      if (newCount > currentSeats) {
        const additional = Array.from({ length: newCount - currentSeats }, (_, i) => ({
          name: `${category}-${currentSeats + i + 1}`,
          visible: true,
        }));
        newSeats = [...cat.seats, ...additional];
      } else if (newCount < currentSeats) {
        newSeats = cat.seats.slice(0, newCount);
      }

      return { ...cat, count: newCount, seats: newSeats };
    }));
  };

  const toggleSeatVisibility = (category: string, seatName: string) => {
    setCategories(prev => prev.map(cat => 
      cat.category === category
        ? {
            ...cat,
            seats: cat.seats.map(seat =>
              seat.name === seatName ? { ...seat, visible: !seat.visible } : seat
            )
          }
        : cat
    ));
  };

  const updateCategoryPricing = (category: string, pricing: PricingSlot[]) => {
    setCategories(prev => prev.map(cat =>
      cat.category === category ? { ...cat, pricing } : cat
    ));
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const exists = categories.some(c => c.category.toLowerCase() === newCategoryName.trim().toLowerCase());
    if (exists) {
      toast({
        title: "Category exists",
        description: "A category with this name already exists",
        variant: "destructive",
      });
      return;
    }

    setCategories(prev => [...prev, {
      category: newCategoryName.trim(),
      count: 0,
      seats: [],
      pricing: [{ duration: "30 mins", price: 0 }],
    }]);
    setNewCategoryName("");
    setShowAddDialog(false);
  };

  const deleteCategory = async (category: string) => {
    const hasBookings = bookings.some(b => b.category === category && b.status === "running");
    if (hasBookings) {
      toast({
        title: "Cannot delete",
        description: "This category has active bookings",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteCategoryMutation.mutateAsync(category);
      setCategories(prev => prev.filter(c => c.category !== category));
      toast({
        title: "Category deleted",
        description: `${category} has been removed successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      const savePromises = categories.flatMap(cat => [
        saveDeviceConfigMutation.mutateAsync({
          category: cat.category,
          count: cat.count,
          seats: cat.seats.filter(s => s.visible).map(s => s.name),
        }),
        savePricingConfigMutation.mutateAsync({
          category: cat.category,
          configs: cat.pricing.map(p => ({ ...p, price: p.price.toString() })),
        }),
      ]);

      await Promise.all(savePromises);

      queryClient.invalidateQueries({ queryKey: ["device-configs"] });
      queryClient.invalidateQueries({ queryKey: ["pricing-configs"] });

      toast({
        title: "Settings Saved",
        description: "Your configuration has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const getAvailableCount = (category: string, totalCount: number): number => {
    const occupied = bookings.filter(
      b => b.category === category && b.status === "running"
    ).length;
    return totalCount - occupied;
  };

  if (deviceLoading || pricingLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure devices and pricing</p>
        </div>
        <Button 
          onClick={handleSave} 
          data-testid="button-save-settings"
          disabled={saveDeviceConfigMutation.isPending || savePricingConfigMutation.isPending}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Device Configuration</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-category"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map(cat => (
            <div key={cat.category} className="relative">
              <DeviceConfigCard
                title={cat.category}
                description={`Configure ${cat.category} (${getAvailableCount(cat.category, cat.count)}/${cat.count} available)`}
                count={cat.count}
                onCountChange={(newCount) => updateCategoryCount(cat.category, newCount)}
                seats={cat.seats}
                onToggleVisibility={(seatName) => toggleSeatVisibility(cat.category, seatName)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => deleteCategory(cat.category)}
                data-testid={`button-delete-${cat.category.toLowerCase()}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Pricing Configuration</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map(cat => (
            <PricingTable
              key={cat.category}
              category={cat.category}
              slots={cat.pricing}
              onUpdateSlots={(pricing) => updateCategoryPricing(cat.category, pricing)}
            />
          ))}
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent data-testid="dialog-add-category">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new device category for your gaming center
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Xbox, Nintendo Switch"
                data-testid="input-category-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addCategory} data-testid="button-confirm-add-category">
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
