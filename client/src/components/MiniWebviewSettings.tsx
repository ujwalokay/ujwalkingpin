import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Monitor } from "lucide-react";

interface MiniWebviewSettingsProps {
  isAdmin: boolean;
  canMakeChanges: boolean;
}

interface Settings {
  id?: string;
  isLiveEnabled: string;
  refreshInterval: number;
}

export function MiniWebviewSettings({ isAdmin, canMakeChanges }: MiniWebviewSettingsProps) {
  const { toast } = useToast();
  
  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/mini-webview/settings"],
    enabled: isAdmin,
  });

  const [isLiveEnabled, setIsLiveEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);

  useEffect(() => {
    if (settings) {
      setIsLiveEnabled(settings.isLiveEnabled === "true");
      setRefreshInterval(settings.refreshInterval || 5);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { isLiveEnabled: string; refreshInterval: number }) => {
      return await apiRequest("POST", "/api/mini-webview/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mini-webview/settings"] });
      toast({
        title: "Settings Updated",
        description: "Mini webview settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({
      isLiveEnabled: isLiveEnabled ? "true" : "false",
      refreshInterval: refreshInterval,
    });
  };

  if (!isAdmin) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 sm:text-xl">Mini Webview Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Live Availability Display
          </CardTitle>
          <CardDescription>
            Control the mini webview page that displays real-time availability to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="live-enabled" data-testid="label-live-enabled">
                Enable Live Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to see real-time availability updates
              </p>
            </div>
            <Switch
              id="live-enabled"
              checked={isLiveEnabled}
              onCheckedChange={setIsLiveEnabled}
              disabled={!canMakeChanges || updateSettingsMutation.isPending}
              data-testid="switch-live-enabled"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="refresh-interval" data-testid="label-refresh-interval">
              Refresh Interval (seconds)
            </Label>
            <Input
              id="refresh-interval"
              type="number"
              min="1"
              max="60"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 5)}
              disabled={!canMakeChanges || updateSettingsMutation.isPending}
              data-testid="input-refresh-interval"
            />
            <p className="text-sm text-muted-foreground">
              How often the mini webview page refreshes availability data
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={!canMakeChanges || updateSettingsMutation.isPending}
            data-testid="button-save-miniwebview-settings"
          >
            Save Mini Webview Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
