import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Database, HardDrive, RefreshCw, AlertTriangle, CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DeviceConfigCard } from "@/components/DeviceConfigCard";
import { PricingTable } from "@/components/PricingTable";
import { HappyHoursPricing } from "@/components/HappyHoursPricing";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { DeviceConfig, PricingConfig, HappyHoursConfig, HappyHoursPricing as HappyHoursPricingType } from "@shared/schema";

interface DatabaseMetrics {
  name: string;
  projectId: string;
  storageBytes: number;
  storageMB: number;
  limitMB: number;
  percentUsed: number;
  computeTimeSeconds: number;
  activeTimeSeconds: number;
  quotaResetAt: string | null;
}

interface StorageMetricsResponse {
  databases: DatabaseMetrics[];
  totalStorageMB: number;
  totalLimitMB: number;
  totalPercentUsed: number;
  lastUpdated: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export default function Settings() {
  const { toast } = useToast();
  
  // Fetch device configs
  const { data: deviceConfigs } = useQuery<DeviceConfig[]>({
    queryKey: ["/api/device-config"],
  });

  // Fetch pricing configs
  const { data: pricingConfigs } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing-config"],
  });

  // Fetch happy hours configs
  const { data: happyHoursConfigs } = useQuery<HappyHoursConfig[]>({
    queryKey: ["/api/happy-hours-config"],
  });

  // Fetch happy hours pricing
  const { data: happyHoursPricing } = useQuery<HappyHoursPricingType[]>({
    queryKey: ["/api/happy-hours-pricing"],
  });

  // Fetch storage metrics (optional - won't block page if NEON_API_KEY not set)
  const { data: metrics, error: metricsError } = useQuery<StorageMetricsResponse>({
    queryKey: ["/api/storage/metrics"],
    refetchInterval: 60000,
    retry: false,
  });

  // Mock storage metrics for display when API is not available
  const mockMetrics: StorageMetricsResponse = {
    databases: [
      { name: "Production DB", projectId: "prod-db-001", storageBytes: 524288000, storageMB: 500, limitMB: 512, percentUsed: 97.66, computeTimeSeconds: 3600, activeTimeSeconds: 3200, quotaResetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      { name: "Development DB", projectId: "dev-db-002", storageBytes: 314572800, storageMB: 300, limitMB: 512, percentUsed: 58.59, computeTimeSeconds: 1800, activeTimeSeconds: 1500, quotaResetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      { name: "Staging DB", projectId: "stage-db-003", storageBytes: 209715200, storageMB: 200, limitMB: 512, percentUsed: 39.06, computeTimeSeconds: 1200, activeTimeSeconds: 1000, quotaResetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      { name: "Analytics DB", projectId: "analytics-db-004", storageBytes: 419430400, storageMB: 400, limitMB: 512, percentUsed: 78.13, computeTimeSeconds: 2400, activeTimeSeconds: 2100, quotaResetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      { name: "Backup DB", projectId: "backup-db-005", storageBytes: 104857600, storageMB: 100, limitMB: 512, percentUsed: 19.53, computeTimeSeconds: 600, activeTimeSeconds: 500, quotaResetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      { name: "Testing DB", projectId: "test-db-006", storageBytes: 52428800, storageMB: 50, limitMB: 512, percentUsed: 9.77, computeTimeSeconds: 300, activeTimeSeconds: 250, quotaResetAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    totalStorageMB: 1550,
    totalLimitMB: 3072,
    totalPercentUsed: 50.46,
    lastUpdated: new Date().toISOString(),
  };

  // Use real metrics if available, otherwise use mock data
  const displayMetrics = metrics || mockMetrics;

  // Local state for device configs
  const [pcConfig, setPcConfig] = useState({ count: 30, seats: [] as { name: string; visible: boolean }[] });
  const [ps5Config, setPs5Config] = useState({ count: 20, seats: [] as { name: string; visible: boolean }[] });

  // Local state for pricing
  const [pcPricing, setPcPricing] = useState<{ duration: string; price: number; personCount?: number }[]>([]);
  const [ps5Pricing, setPs5Pricing] = useState<{ duration: string; price: number; personCount?: number }[]>([]);

  // Local state for happy hours time slots
  const [pcHappyHoursEnabled, setPcHappyHoursEnabled] = useState(true);
  const [ps5HappyHoursEnabled, setPs5HappyHoursEnabled] = useState(true);
  const [pcTimeSlots, setPcTimeSlots] = useState<TimeSlot[]>([]);
  const [ps5TimeSlots, setPs5TimeSlots] = useState<TimeSlot[]>([]);

  // Local state for happy hours pricing
  const [pcHappyHoursPricing, setPcHappyHoursPricing] = useState<{ duration: string; price: number; personCount?: number }[]>([]);
  const [ps5HappyHoursPricing, setPs5HappyHoursPricing] = useState<{ duration: string; price: number; personCount?: number }[]>([]);

  // Initialize local state from API data
  useEffect(() => {
    if (deviceConfigs) {
      const pc = deviceConfigs.find((c) => c.category === "PC");
      const ps5 = deviceConfigs.find((c) => c.category === "PS5");

      if (pc) {
        setPcConfig({
          count: pc.count,
          seats: pc.seats.map((name) => ({ name, visible: true })),
        });
      }

      if (ps5) {
        setPs5Config({
          count: ps5.count,
          seats: ps5.seats.map((name) => ({ name, visible: true })),
        });
      }
    }
  }, [deviceConfigs]);

  useEffect(() => {
    if (pricingConfigs) {
      const pcConfigs = pricingConfigs.filter((c) => c.category === "PC");
      const ps5Configs = pricingConfigs.filter((c) => c.category === "PS5");

      setPcPricing(pcConfigs.map((c) => ({ duration: c.duration, price: parseFloat(c.price), personCount: c.personCount })));
      setPs5Pricing(ps5Configs.map((c) => ({ duration: c.duration, price: parseFloat(c.price), personCount: c.personCount })));
    }
  }, [pricingConfigs]);

  useEffect(() => {
    if (happyHoursConfigs) {
      const pcConfigs = happyHoursConfigs.filter((c) => c.category === "PC");
      const ps5Configs = happyHoursConfigs.filter((c) => c.category === "PS5");

      setPcHappyHoursEnabled(pcConfigs.length > 0 && pcConfigs[0].enabled === 1);
      setPs5HappyHoursEnabled(ps5Configs.length > 0 && ps5Configs[0].enabled === 1);

      setPcTimeSlots(pcConfigs.map((c) => ({ startTime: c.startTime, endTime: c.endTime })));
      setPs5TimeSlots(ps5Configs.map((c) => ({ startTime: c.startTime, endTime: c.endTime })));
    }
  }, [happyHoursConfigs]);

  useEffect(() => {
    if (happyHoursPricing) {
      const pcPricing = happyHoursPricing.filter((c) => c.category === "PC");
      const ps5Pricing = happyHoursPricing.filter((c) => c.category === "PS5");

      setPcHappyHoursPricing(pcPricing.map((c) => ({ duration: c.duration, price: parseFloat(c.price), personCount: c.personCount })));
      setPs5HappyHoursPricing(ps5Pricing.map((c) => ({ duration: c.duration, price: parseFloat(c.price), personCount: c.personCount })));
    }
  }, [happyHoursPricing]);

  // Save mutations
  const saveDeviceConfigMutation = useMutation({
    mutationFn: async ({ category, count, seats }: { category: string; count: number; seats: string[] }) => {
      return apiRequest("PUT", "/api/device-config", { category, count, seats });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/device-config"] });
      toast({ title: "Success", description: "Device configuration saved" });
    },
  });

  const savePricingMutation = useMutation({
    mutationFn: async ({ category, configs }: { category: string; configs: { duration: string; price: number; personCount?: number }[] }) => {
      return apiRequest("PUT", "/api/pricing-config", {
        category,
        configs: configs.map((c) => ({ duration: c.duration, price: c.price.toString(), personCount: c.personCount || 1 })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-config"] });
      toast({ title: "Success", description: "Pricing configuration saved" });
    },
  });

  const saveHappyHoursConfigMutation = useMutation({
    mutationFn: async ({ category, enabled, timeSlots }: { category: string; enabled: boolean; timeSlots: TimeSlot[] }) => {
      return apiRequest("PUT", "/api/happy-hours-config", {
        category,
        configs: timeSlots.map((slot) => ({ startTime: slot.startTime, endTime: slot.endTime, enabled: enabled ? 1 : 0 })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/happy-hours-config"] });
      toast({ title: "Success", description: "Happy hours configuration saved" });
    },
  });

  const saveHappyHoursPricingMutation = useMutation({
    mutationFn: async ({ category, configs }: { category: string; configs: { duration: string; price: number; personCount?: number }[] }) => {
      return apiRequest("PUT", "/api/happy-hours-pricing", {
        category,
        configs: configs.map((c) => ({ duration: c.duration, price: c.price.toString(), personCount: c.personCount || 1 })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/happy-hours-pricing"] });
      toast({ title: "Success", description: "Happy hours pricing saved" });
    },
  });

  const handleSaveAll = () => {
    // Save device configs
    saveDeviceConfigMutation.mutate({
      category: "PC",
      count: pcConfig.count,
      seats: pcConfig.seats.map((s) => s.name),
    });

    saveDeviceConfigMutation.mutate({
      category: "PS5",
      count: ps5Config.count,
      seats: ps5Config.seats.map((s) => s.name),
    });

    // Save pricing
    savePricingMutation.mutate({ category: "PC", configs: pcPricing });
    savePricingMutation.mutate({ category: "PS5", configs: ps5Pricing });

    // Save happy hours config
    if (pcTimeSlots.length > 0) {
      saveHappyHoursConfigMutation.mutate({ category: "PC", enabled: pcHappyHoursEnabled, timeSlots: pcTimeSlots });
    }
    if (ps5TimeSlots.length > 0) {
      saveHappyHoursConfigMutation.mutate({ category: "PS5", enabled: ps5HappyHoursEnabled, timeSlots: ps5TimeSlots });
    }

    // Save happy hours pricing
    if (pcHappyHoursPricing.length > 0) {
      saveHappyHoursPricingMutation.mutate({ category: "PC", configs: pcHappyHoursPricing });
    }
    if (ps5HappyHoursPricing.length > 0) {
      saveHappyHoursPricingMutation.mutate({ category: "PS5", configs: ps5HappyHoursPricing });
    }
  };

  const handlePcCountChange = (newCount: number) => {
    const newSeats = Array.from({ length: newCount }, (_, i) => ({
      name: `PC-${i + 1}`,
      visible: i < pcConfig.seats.length ? pcConfig.seats[i].visible : true,
    }));
    setPcConfig({ count: newCount, seats: newSeats });
  };

  const handlePs5CountChange = (newCount: number) => {
    const newSeats = Array.from({ length: newCount }, (_, i) => ({
      name: `PS5-${i + 1}`,
      visible: i < ps5Config.seats.length ? ps5Config.seats[i].visible : true,
    }));
    setPs5Config({ count: newCount, seats: newSeats });
  };

  const handlePcToggleVisibility = (seatName: string) => {
    setPcConfig((prev) => ({
      ...prev,
      seats: prev.seats.map((s) => (s.name === seatName ? { ...s, visible: !s.visible } : s)),
    }));
  };

  const handlePs5ToggleVisibility = (seatName: string) => {
    setPs5Config((prev) => ({
      ...prev,
      seats: prev.seats.map((s) => (s.name === seatName ? { ...s, visible: !s.visible } : s)),
    }));
  };

  const addPcTimeSlot = () => {
    setPcTimeSlots([...pcTimeSlots, { startTime: "11:55 AM", endTime: "01:59 PM" }]);
  };

  const addPs5TimeSlot = () => {
    setPs5TimeSlots([...ps5TimeSlots, { startTime: "01:00 AM", endTime: "11:00 AM" }]);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (percentUsed: number) => {
    if (percentUsed >= 90) return "text-red-500";
    if (percentUsed >= 75) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusIcon = (percentUsed: number) => {
    if (percentUsed >= 90) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (percentUsed >= 75) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const getProgressColor = (percentUsed: number) => {
    if (percentUsed >= 90) return "[&>*]:bg-red-500";
    if (percentUsed >= 75) return "[&>*]:bg-yellow-500";
    return "[&>*]:bg-green-500";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground">Configure devices and pricing</p>
        </div>
        <Button onClick={handleSaveAll} data-testid="button-save-changes">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Storage Metrics Section */}
      {displayMetrics && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Total Storage Usage
                  </CardTitle>
                  <CardDescription>
                    Across all 6 Neon free databases {metricsError && "(Demo Data)"}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg" data-testid="badge-total-usage">
                  {displayMetrics.totalStorageMB.toFixed(2)} MB / {displayMetrics.totalLimitMB} MB
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Progress</span>
                  <span className={`text-sm font-bold ${getStatusColor(displayMetrics.totalPercentUsed)}`} data-testid="text-total-percent">
                    {displayMetrics.totalPercentUsed.toFixed(2)}%
                  </span>
                </div>
                <Progress value={displayMetrics.totalPercentUsed} className={`h-3 ${getProgressColor(displayMetrics.totalPercentUsed)}`} data-testid="progress-total" />
              </div>
              <p className="text-xs text-muted-foreground" data-testid="text-last-updated">
                Last updated: {formatDate(displayMetrics.lastUpdated)}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayMetrics.databases.map((db, index) => (
              <Card key={db.projectId} className="hover-elevate" data-testid={`card-database-${index}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      {db.name}
                    </CardTitle>
                    {getStatusIcon(db.percentUsed)}
                  </div>
                  <CardDescription className="text-xs truncate" data-testid={`text-project-id-${index}`}>
                    {db.projectId}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Storage</span>
                      <span className={`text-sm font-medium ${getStatusColor(db.percentUsed)}`} data-testid={`text-storage-${index}`}>
                        {db.storageMB.toFixed(2)} / {db.limitMB} MB
                      </span>
                    </div>
                    <Progress value={db.percentUsed} className={`h-2 ${getProgressColor(db.percentUsed)}`} data-testid={`progress-storage-${index}`} />
                    <p className={`text-xs text-right mt-1 ${getStatusColor(db.percentUsed)}`} data-testid={`text-percent-${index}`}>
                      {db.percentUsed.toFixed(2)}% used
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                    <div>
                      <p className="text-muted-foreground">Compute</p>
                      <p className="font-medium" data-testid={`text-compute-${index}`}>
                        {(db.computeTimeSeconds / 3600).toFixed(2)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Active</p>
                      <p className="font-medium" data-testid={`text-active-${index}`}>
                        {(db.activeTimeSeconds / 3600).toFixed(2)}h
                      </p>
                    </div>
                  </div>

                  {db.quotaResetAt && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Quota resets</p>
                      <p className="text-xs font-medium" data-testid={`text-quota-reset-${index}`}>
                        {formatDate(db.quotaResetAt)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Device Configuration */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Device Configuration</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <DeviceConfigCard
            title="PC"
            description={`Configure PC (30/30 available)`}
            count={pcConfig.count}
            onCountChange={handlePcCountChange}
            seats={pcConfig.seats}
            onToggleVisibility={handlePcToggleVisibility}
          />
          <DeviceConfigCard
            title="PS5"
            description={`Configure PS5 (20/20 available)`}
            count={ps5Config.count}
            onCountChange={handlePs5CountChange}
            seats={ps5Config.seats}
            onToggleVisibility={handlePs5ToggleVisibility}
          />
        </div>
      </div>

      {/* Pricing Configuration */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Pricing Configuration</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <PricingTable category="PC" slots={pcPricing} onUpdateSlots={setPcPricing} />
          <PricingTable category="PS5" slots={ps5Pricing} onUpdateSlots={setPs5Pricing} />
        </div>
      </div>

      {/* Happy Hours Time Slots */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Happy Hours Time Slots</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Define when happy hours are active. Enable/disable and set time periods for special pricing.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>PC</CardTitle>
                  <CardDescription>Configure happy hours time slots and pricing</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="pc-enabled">Enabled</Label>
                  <Switch id="pc-enabled" checked={pcHappyHoursEnabled} onCheckedChange={setPcHappyHoursEnabled} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pcTimeSlots.map((slot, index) => (
                <div key={index} className="space-y-2 p-3 rounded-md border">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Start Time</Label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const newSlots = [...pcTimeSlots];
                          newSlots[index].startTime = e.target.value;
                          setPcTimeSlots(newSlots);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Time</Label>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const newSlots = [...pcTimeSlots];
                          newSlots[index].endTime = e.target.value;
                          setPcTimeSlots(newSlots);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addPcTimeSlot}>
                + Add Time Slot
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>PS5</CardTitle>
                  <CardDescription>Configure happy hours time slots and pricing</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="ps5-enabled">Enabled</Label>
                  <Switch id="ps5-enabled" checked={ps5HappyHoursEnabled} onCheckedChange={setPs5HappyHoursEnabled} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {ps5TimeSlots.map((slot, index) => (
                <div key={index} className="space-y-2 p-3 rounded-md border">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Start Time</Label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const newSlots = [...ps5TimeSlots];
                          newSlots[index].startTime = e.target.value;
                          setPs5TimeSlots(newSlots);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Time</Label>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const newSlots = [...ps5TimeSlots];
                          newSlots[index].endTime = e.target.value;
                          setPs5TimeSlots(newSlots);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addPs5TimeSlot}>
                + Add Time Slot
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Happy Hours Pricing */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Happy Hours Pricing</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Set pricing tiers that apply during happy hours time slots. These prices are active only when happy hours are enabled and within the configured time periods.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <HappyHoursPricing category="PC" slots={pcHappyHoursPricing} onUpdateSlots={setPcHappyHoursPricing} />
          <HappyHoursPricing category="PS5" slots={ps5HappyHoursPricing} onUpdateSlots={setPs5HappyHoursPricing} />
        </div>
      </div>
    </div>
  );
}
