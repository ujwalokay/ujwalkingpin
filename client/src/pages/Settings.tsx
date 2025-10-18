import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DeviceConfigCard } from "@/components/DeviceConfigCard";
import { PricingTable } from "@/components/PricingTable";
import { HappyHoursTable } from "@/components/HappyHoursTable";
import { HappyHoursPricing } from "@/components/HappyHoursPricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Plus, Trash2, Award } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  personCount?: number;
}

interface PricingSlot {
  duration: string;
  price: number;
  personCount?: number;
}

interface HappyHoursConfig {
  id: string;
  category: string;
  startTime: string;
  endTime: string;
  enabled: number;
}

interface HappyHoursSlot {
  startTime: string;
  endTime: string;
}

interface HappyHoursData {
  enabled: boolean;
  slots: HappyHoursSlot[];
}

interface CategoryState {
  category: string;
  count: number;
  seats: { name: string; visible: boolean }[];
  pricing: PricingSlot[];
  happyHours: HappyHoursData;
  happyHoursPricing: PricingSlot[];
}

export default function Settings() {
  const { toast } = useToast();
  const { isAdmin, canMakeChanges, deviceRestricted, user } = useAuth();

  const { data: deviceConfigs, isLoading: deviceLoading } = useQuery<DeviceConfig[]>({
    queryKey: ["/api/device-config"],
  });

  const { data: pricingConfigs, isLoading: pricingLoading } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing-config"],
  });

  const { data: happyHoursConfigs, isLoading: happyHoursLoading } = useQuery<HappyHoursConfig[]>({
    queryKey: ["/api/happy-hours-config"],
  });

  const { data: happyHoursPricingConfigs, isLoading: happyHoursPricingLoading } = useQuery<PricingConfig[]>({
    queryKey: ["/api/happy-hours-pricing"],
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const [categories, setCategories] = useState<CategoryState[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (deviceConfigs && pricingConfigs && happyHoursConfigs && happyHoursPricingConfigs) {
      const categoryMap = new Map<string, CategoryState>();

      deviceConfigs.forEach(config => {
        const pricing = pricingConfigs
          .filter(p => p.category === config.category)
          .map(p => ({ duration: p.duration, price: parseFloat(p.price), personCount: p.personCount || 1 }));

        const happyHoursSlots = happyHoursConfigs
          .filter(h => h.category === config.category)
          .map(h => ({ startTime: h.startTime, endTime: h.endTime }));

        const happyHoursEnabled = happyHoursConfigs.find(h => h.category === config.category)?.enabled === 1;

        const happyHoursPricing = happyHoursPricingConfigs
          .filter(p => p.category === config.category)
          .map(p => ({ duration: p.duration, price: parseFloat(p.price), personCount: p.personCount || 1 }));

        categoryMap.set(config.category, {
          category: config.category,
          count: config.count,
          seats: config.seats.map(seat => ({ name: seat, visible: true })),
          pricing: pricing.length > 0 ? pricing : [{ duration: "30 mins", price: 0, personCount: 1 }],
          happyHours: {
            enabled: happyHoursEnabled,
            slots: happyHoursSlots.length > 0 ? happyHoursSlots : [{ startTime: "10:00", endTime: "12:00" }],
          },
          happyHoursPricing: happyHoursPricing.length > 0 ? happyHoursPricing : [{ duration: "30 mins", price: 0, personCount: 1 }],
        });
      });

      pricingConfigs.forEach(config => {
        if (!categoryMap.has(config.category)) {
          categoryMap.set(config.category, {
            category: config.category,
            count: 0,
            seats: [],
            pricing: [{ duration: config.duration, price: parseFloat(config.price), personCount: config.personCount || 1 }],
            happyHours: { enabled: false, slots: [{ startTime: "10:00", endTime: "12:00" }] },
            happyHoursPricing: [{ duration: "30 mins", price: 0, personCount: 1 }],
          });
        }
      });

      setCategories(Array.from(categoryMap.values()));
    }
  }, [deviceConfigs, pricingConfigs, happyHoursConfigs, happyHoursPricingConfigs]);

  const saveDeviceConfigMutation = useMutation({
    mutationFn: async (config: { category: string; count: number; seats: string[] }) => {
      return await apiRequest("POST", "/api/device-config", config);
    },
  });

  const savePricingConfigMutation = useMutation({
    mutationFn: async (data: { category: string; configs: { duration: string; price: string | number; personCount?: number }[] }) => {
      return await apiRequest("POST", "/api/pricing-config", data);
    },
  });

  const saveHappyHoursConfigMutation = useMutation({
    mutationFn: async (data: { category: string; configs: { startTime: string; endTime: string; enabled: number }[] }) => {
      return await apiRequest("POST", "/api/happy-hours-config", data);
    },
  });

  const saveHappyHoursPricingMutation = useMutation({
    mutationFn: async (data: { category: string; configs: { duration: string; price: string | number; personCount?: number }[] }) => {
      return await apiRequest("POST", "/api/happy-hours-pricing", data);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (category: string) => {
      await apiRequest("DELETE", `/api/device-config/${category}`);
      await apiRequest("DELETE", `/api/pricing-config/${category}`);
      await apiRequest("DELETE", `/api/happy-hours-config/${category}`);
      await apiRequest("DELETE", `/api/happy-hours-pricing/${category}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/device-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/happy-hours-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/happy-hours-pricing"] });
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

  const updateCategoryHappyHours = (category: string, happyHours: HappyHoursData) => {
    setCategories(prev => prev.map(cat =>
      cat.category === category ? { ...cat, happyHours } : cat
    ));
  };

  const updateCategoryHappyHoursPricing = (category: string, happyHoursPricing: PricingSlot[]) => {
    setCategories(prev => prev.map(cat =>
      cat.category === category ? { ...cat, happyHoursPricing } : cat
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
      pricing: [{ duration: "30 mins", price: 0, personCount: 1 }],
    };

    try {
      await saveDeviceConfigMutation.mutateAsync({
        category: newCategory.category,
        count: 0,
        seats: [],
      });

      await savePricingConfigMutation.mutateAsync({
        category: newCategory.category,
        configs: [{ duration: "30 mins", price: "0", personCount: 1 }],
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
        saveHappyHoursConfigMutation.mutateAsync({
          category: cat.category,
          configs: cat.happyHours.slots.map(slot => ({
            ...slot,
            enabled: cat.happyHours.enabled ? 1 : 0,
          })),
        }),
        saveHappyHoursPricingMutation.mutateAsync({
          category: cat.category,
          configs: cat.happyHoursPricing.map(p => ({ ...p, price: p.price.toString() })),
        }),
      ]);

      await Promise.all(savePromises);

      queryClient.invalidateQueries({ queryKey: ["/api/device-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/happy-hours-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/happy-hours-pricing"] });

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

  if (deviceLoading || pricingLoading || happyHoursLoading || happyHoursPricingLoading) {
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
            disabled={saveDeviceConfigMutation.isPending || savePricingConfigMutation.isPending}
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
        <div className="grid gap-4 lg:gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
        <h2 className="text-lg font-semibold mb-4 sm:text-xl">Happy Hours Time Slots</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Define when happy hours are active. Enable/disable and set time periods for special pricing.
        </p>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {categories.map(cat => (
            <HappyHoursTable
              key={cat.category}
              category={cat.category}
              enabled={cat.happyHours.enabled}
              slots={cat.happyHours.slots}
              onUpdate={(data) => updateCategoryHappyHours(cat.category, data)}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 sm:text-xl">Happy Hours Pricing</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Set pricing tiers that apply during happy hours time slots. These prices are active only when happy hours are enabled and within the configured time periods.
        </p>
        <div className="grid gap-4 lg:gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {categories.map(cat => (
            <HappyHoursPricing
              key={cat.category}
              category={cat.category}
              slots={cat.happyHoursPricing}
              onUpdateSlots={isAdmin ? (happyHoursPricing) => updateCategoryHappyHoursPricing(cat.category, happyHoursPricing) : () => {}}
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
