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
import { useAuth } from "@/contexts/AuthContext";

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

interface LoyaltyConfig {
  id?: string;
  pointsPerCurrency: number;
  currencySymbol: string;
  tierThresholds: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

export default function Settings() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: deviceConfigs, isLoading: deviceLoading } = useQuery<DeviceConfig[]>({
    queryKey: ["/api/device-config"],
  });

  const { data: pricingConfigs, isLoading: pricingLoading } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing-config"],
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: loyaltyConfig, isLoading: loyaltyConfigLoading } = useQuery<LoyaltyConfig>({
    queryKey: ["/api/loyalty-config"],
  });

  const [categories, setCategories] = useState<CategoryState[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltyConfig>({
    pointsPerCurrency: 1,
    currencySymbol: "$",
    tierThresholds: {
      bronze: 0,
      silver: 100,
      gold: 500,
      platinum: 1000,
    },
  });

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

  useEffect(() => {
    if (loyaltyConfig) {
      setLoyaltySettings(loyaltyConfig);
    }
  }, [loyaltyConfig]);

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
      queryClient.invalidateQueries({ queryKey: ["/api/device-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-config"] });
    },
  });

  const saveLoyaltyConfigMutation = useMutation({
    mutationFn: async (config: Omit<LoyaltyConfig, "id">) => {
      return await apiRequest("PUT", "/api/loyalty-config", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-config"] });
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

  const addCategory = async () => {
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

    const newCategory = {
      category: newCategoryName.trim(),
      count: 0,
      seats: [],
      pricing: [{ duration: "30 mins", price: 0 }],
    };

    try {
      await saveDeviceConfigMutation.mutateAsync({
        category: newCategory.category,
        count: 0,
        seats: [],
      });

      await savePricingConfigMutation.mutateAsync({
        category: newCategory.category,
        configs: [{ duration: "30 mins", price: 0 }],
      });

      queryClient.invalidateQueries({ queryKey: ["/api/device-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-config"] });

      toast({
        title: "Category added",
        description: `${newCategory.category} has been created successfully`,
      });

      setNewCategoryName("");
      setShowAddDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add category",
        variant: "destructive",
      });
    }
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
    if (loyaltyConfigLoading) {
      toast({
        title: "Please wait",
        description: "Loading loyalty configuration...",
        variant: "destructive",
      });
      return;
    }

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

      savePromises.push(saveLoyaltyConfigMutation.mutateAsync({
        pointsPerCurrency: loyaltySettings.pointsPerCurrency,
        currencySymbol: loyaltySettings.currencySymbol,
        tierThresholds: loyaltySettings.tierThresholds,
      }));

      await Promise.all(savePromises);

      queryClient.invalidateQueries({ queryKey: ["/api/device-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-config"] });

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
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Settings</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Configure devices and pricing{!isAdmin && " (View Only)"}</p>
        </div>
        {isAdmin && (
          <Button 
            onClick={handleSave} 
            data-testid="button-save-settings"
            disabled={saveDeviceConfigMutation.isPending || savePricingConfigMutation.isPending || loyaltyConfigLoading}
            className="w-full sm:w-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        )}
      </div>

      <div>
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold sm:text-xl">Device Configuration</h2>
          {isAdmin && (
            <Button 
              variant="outline" 
              onClick={() => setShowAddDialog(true)}
              data-testid="button-add-category"
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {categories.map(cat => (
            <div key={cat.category} className="relative">
              <DeviceConfigCard
                title={cat.category}
                description={`Configure ${cat.category} (${getAvailableCount(cat.category, cat.count)}/${cat.count} available)`}
                count={cat.count}
                onCountChange={isAdmin ? (newCount) => updateCategoryCount(cat.category, newCount) : () => {}}
                seats={cat.seats}
                onToggleVisibility={isAdmin ? (seatName) => toggleSeatVisibility(cat.category, seatName) : () => {}}
              />
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => deleteCategory(cat.category)}
                  data-testid={`button-delete-${cat.category.toLowerCase()}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 sm:text-xl">Pricing Configuration</h2>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {categories.map(cat => (
            <PricingTable
              key={cat.category}
              category={cat.category}
              slots={cat.pricing}
              onUpdateSlots={isAdmin ? (pricing) => updateCategoryPricing(cat.category, pricing) : () => {}}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 sm:text-xl">Loyalty Program Configuration</h2>
        <div className="bg-card border rounded-lg p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="points-per-currency">Points Per Currency Unit</Label>
              <Input
                id="points-per-currency"
                type="number"
                min="0.1"
                step="0.1"
                value={loyaltySettings.pointsPerCurrency}
                onChange={(e) => setLoyaltySettings({
                  ...loyaltySettings,
                  pointsPerCurrency: parseFloat(e.target.value) || 1,
                })}
                disabled={!isAdmin}
                data-testid="input-points-per-currency"
              />
              <p className="text-sm text-muted-foreground">
                How many loyalty points customers earn per currency unit spent (can be decimal)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency-symbol">Currency Symbol</Label>
              <Input
                id="currency-symbol"
                value={loyaltySettings.currencySymbol}
                onChange={(e) => setLoyaltySettings({
                  ...loyaltySettings,
                  currencySymbol: e.target.value,
                })}
                disabled={!isAdmin}
                data-testid="input-currency-symbol"
              />
              <p className="text-sm text-muted-foreground">
                Symbol used for currency display
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Tier Thresholds</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="tier-bronze">Bronze Tier</Label>
                <Input
                  id="tier-bronze"
                  type="number"
                  min="0"
                  value={loyaltySettings.tierThresholds.bronze}
                  onChange={(e) => setLoyaltySettings({
                    ...loyaltySettings,
                    tierThresholds: {
                      ...loyaltySettings.tierThresholds,
                      bronze: parseInt(e.target.value) || 0,
                    },
                  })}
                  disabled={!isAdmin}
                  data-testid="input-tier-bronze"
                />
                <p className="text-xs text-muted-foreground">Starting points</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier-silver">Silver Tier</Label>
                <Input
                  id="tier-silver"
                  type="number"
                  min="0"
                  value={loyaltySettings.tierThresholds.silver}
                  onChange={(e) => setLoyaltySettings({
                    ...loyaltySettings,
                    tierThresholds: {
                      ...loyaltySettings.tierThresholds,
                      silver: parseInt(e.target.value) || 0,
                    },
                  })}
                  disabled={!isAdmin}
                  data-testid="input-tier-silver"
                />
                <p className="text-xs text-muted-foreground">Minimum points</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier-gold">Gold Tier</Label>
                <Input
                  id="tier-gold"
                  type="number"
                  min="0"
                  value={loyaltySettings.tierThresholds.gold}
                  onChange={(e) => setLoyaltySettings({
                    ...loyaltySettings,
                    tierThresholds: {
                      ...loyaltySettings.tierThresholds,
                      gold: parseInt(e.target.value) || 0,
                    },
                  })}
                  disabled={!isAdmin}
                  data-testid="input-tier-gold"
                />
                <p className="text-xs text-muted-foreground">Minimum points</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier-platinum">Platinum Tier</Label>
                <Input
                  id="tier-platinum"
                  type="number"
                  min="0"
                  value={loyaltySettings.tierThresholds.platinum}
                  onChange={(e) => setLoyaltySettings({
                    ...loyaltySettings,
                    tierThresholds: {
                      ...loyaltySettings.tierThresholds,
                      platinum: parseInt(e.target.value) || 0,
                    },
                  })}
                  disabled={!isAdmin}
                  data-testid="input-tier-platinum"
                />
                <p className="text-xs text-muted-foreground">Minimum points</p>
              </div>
            </div>
          </div>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCategoryName.trim()) {
                    addCategory();
                  }
                }}
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
