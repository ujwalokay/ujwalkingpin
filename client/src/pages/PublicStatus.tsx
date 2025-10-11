import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Gamepad2, Glasses, Car, Cpu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeviceAvailability {
  category: string;
  total: number;
  available: number;
  occupied: number;
}

const getIconForCategory = (category: string) => {
  const icons: Record<string, any> = {
    "PC": Monitor,
    "PS5": Gamepad2,
    "VR": Glasses,
    "Car": Car,
    "Xbox": Gamepad2,
    "Nintendo": Gamepad2,
  };
  return icons[category] || Cpu;
};

export default function PublicStatus() {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data: availability = [], isLoading, refetch, dataUpdatedAt } = useQuery<DeviceAvailability[]>({
    queryKey: ["/api/public/status"],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdate(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-xl text-muted-foreground">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent" data-testid="text-status-title">
            Gaming Center Status
          </h1>
          <p className="text-xl text-muted-foreground">Real-time device availability</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="h-7"
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {availability.length === 0 ? (
          <Card className="border-2">
            <CardContent className="p-12 text-center">
              <p className="text-xl text-muted-foreground">No devices configured yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {availability.map((device) => {
              const Icon = getIconForCategory(device.category);
              const percentage = device.total > 0 ? Math.round((device.available / device.total) * 100) : 0;
              const isAvailable = device.available > 0;
              
              return (
                <Card 
                  key={device.category} 
                  className={`border-2 transition-all hover:scale-105 ${
                    isAvailable 
                      ? 'border-green-500/50 bg-green-500/5' 
                      : 'border-red-500/50 bg-red-500/5'
                  }`}
                  data-testid={`card-device-${device.category}`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-6 w-6 ${isAvailable ? 'text-green-500' : 'text-red-500'}`} />
                        <span className="text-2xl" data-testid={`text-category-${device.category}`}>{device.category}</span>
                      </div>
                      <Badge 
                        variant={isAvailable ? "default" : "destructive"}
                        className={isAvailable ? "bg-green-600 hover:bg-green-700" : ""}
                        data-testid={`badge-status-${device.category}`}
                      >
                        {isAvailable ? "Available" : "Full"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Available</span>
                        <span className="text-3xl font-bold text-green-500" data-testid={`text-available-${device.category}`}>
                          {device.available}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Occupied</span>
                        <span className="text-3xl font-bold text-red-500" data-testid={`text-occupied-${device.category}`}>
                          {device.occupied}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-2xl font-semibold" data-testid={`text-total-${device.category}`}>
                          {device.total}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Availability</span>
                        <span className={`font-semibold ${isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                          {percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            isAvailable ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                          data-testid={`progress-${device.category}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>This page automatically refreshes every 30 seconds</p>
          <p className="text-xs">For bookings, please contact our staff or use the admin panel</p>
        </div>
      </div>
    </div>
  );
}
