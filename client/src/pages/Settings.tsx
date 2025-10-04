import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DeviceConfigCard } from "@/components/DeviceConfigCard";
import { PricingTable } from "@/components/PricingTable";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function Settings() {
  const { toast } = useToast();

  const { data: deviceConfigs, isLoading: deviceLoading } = useQuery<DeviceConfig[]>({
    queryKey: ["/api/device-config"],
  });

  const { data: pricingConfigs, isLoading: pricingLoading } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing-config"],
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const [pcCount, setPcCount] = useState(0);
  const [ps5Count, setPs5Count] = useState(0);
  const [vrCount, setVrCount] = useState(0);
  const [carCount, setCarCount] = useState(0);
  const [pcSeats, setPcSeats] = useState<{ name: string; visible: boolean }[]>([]);
  const [pcPricing, setPcPricing] = useState<PricingSlot[]>([]);
  const [ps5Pricing, setPs5Pricing] = useState<PricingSlot[]>([]);

  useEffect(() => {
    if (deviceConfigs) {
      const pcConfig = deviceConfigs.find(c => c.category === "PC");
      const ps5Config = deviceConfigs.find(c => c.category === "PS5");
      const vrConfig = deviceConfigs.find(c => c.category === "VR");
      const carConfig = deviceConfigs.find(c => c.category === "Car");

      setPcCount(pcConfig?.count || 0);
      setPs5Count(ps5Config?.count || 0);
      setVrCount(vrConfig?.count || 0);
      setCarCount(carConfig?.count || 0);

      if (pcConfig && pcConfig.seats.length > 0) {
        setPcSeats(pcConfig.seats.map(seat => ({ name: seat, visible: true })));
      }
    }
  }, [deviceConfigs]);

  useEffect(() => {
    if (pricingConfigs) {
      const pcPrices = pricingConfigs
        .filter(p => p.category === "PC")
        .map(p => ({ duration: p.duration, price: parseFloat(p.price) }));
      const ps5Prices = pricingConfigs
        .filter(p => p.category === "PS5")
        .map(p => ({ duration: p.duration, price: parseFloat(p.price) }));

      setPcPricing(pcPrices.length > 0 ? pcPrices : [
        { duration: "30 mins", price: 40 },
        { duration: "1 hour", price: 70 },
        { duration: "2 hours", price: 130 },
      ]);
      setPs5Pricing(ps5Prices.length > 0 ? ps5Prices : [
        { duration: "30 mins", price: 60 },
        { duration: "1 hour", price: 100 },
        { duration: "2 hours", price: 180 },
      ]);
    }
  }, [pricingConfigs]);

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

  const toggleSeatVisibility = (seatName: string) => {
    setPcSeats(seats =>
      seats.map(seat =>
        seat.name === seatName ? { ...seat, visible: !seat.visible } : seat
      )
    );
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        saveDeviceConfigMutation.mutateAsync({
          category: "PC",
          count: pcCount,
          seats: pcSeats.filter(s => s.visible).map(s => s.name),
        }),
        saveDeviceConfigMutation.mutateAsync({
          category: "PS5",
          count: ps5Count,
          seats: [],
        }),
        saveDeviceConfigMutation.mutateAsync({
          category: "VR",
          count: vrCount,
          seats: [],
        }),
        saveDeviceConfigMutation.mutateAsync({
          category: "Car",
          count: carCount,
          seats: [],
        }),
        savePricingConfigMutation.mutateAsync({
          category: "PC",
          configs: pcPricing.map(p => ({ ...p, price: p.price.toString() })),
        }),
        savePricingConfigMutation.mutateAsync({
          category: "PS5",
          configs: ps5Pricing.map(p => ({ ...p, price: p.price.toString() })),
        }),
      ]);

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

  const handlePcCountChange = (newCount: number) => {
    setPcCount(newCount);
    const currentSeats = pcSeats.length;
    if (newCount > currentSeats) {
      const newSeats = Array.from({ length: newCount - currentSeats }, (_, i) => ({
        name: `PC-${currentSeats + i + 1}`,
        visible: true,
      }));
      setPcSeats([...pcSeats, ...newSeats]);
    } else if (newCount < currentSeats) {
      setPcSeats(pcSeats.slice(0, newCount));
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
        <h2 className="text-xl font-semibold mb-4">Device Configuration</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <DeviceConfigCard
            title="PC Gaming"
            description={`Configure PC gaming stations (${getAvailableCount("PC", pcCount)}/${pcCount} available)`}
            count={pcCount}
            onCountChange={handlePcCountChange}
            seats={pcSeats}
            onToggleVisibility={toggleSeatVisibility}
          />
          <DeviceConfigCard
            title="PS5"
            description={`Configure PlayStation 5 consoles (${getAvailableCount("PS5", ps5Count)}/${ps5Count} available)`}
            count={ps5Count}
            onCountChange={setPs5Count}
          />
          <DeviceConfigCard
            title="VR Simulators"
            description={`Configure VR gaming stations (${getAvailableCount("VR", vrCount)}/${vrCount} available)`}
            count={vrCount}
            onCountChange={setVrCount}
          />
          <DeviceConfigCard
            title="Car Simulators"
            description={`Configure racing simulators (${getAvailableCount("Car", carCount)}/${carCount} available)`}
            count={carCount}
            onCountChange={setCarCount}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Pricing Configuration</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <PricingTable
            category="PC"
            slots={pcPricing}
            onUpdateSlots={setPcPricing}
          />
          <PricingTable
            category="PS5"
            slots={ps5Pricing}
            onUpdateSlots={setPs5Pricing}
          />
        </div>
      </div>
    </div>
  );
}
