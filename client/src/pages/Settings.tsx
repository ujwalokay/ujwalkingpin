import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Users, Bell, Clock, Trash2, Database, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import type { GamingCenterInfo } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const { data: centerInfo, isLoading } = useQuery<GamingCenterInfo>({
    queryKey: ["/api/gaming-center-info"],
  });

  const updateCenterInfoMutation = useMutation({
    mutationFn: async (data: Partial<GamingCenterInfo>) => {
      return apiRequest("PATCH", "/api/gaming-center-info", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gaming-center-info"] });
      toast({
        title: "Success",
        description: "Gaming center information updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveCenterInfo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateCenterInfoMutation.mutate({
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      description: formData.get("description") as string,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <SettingsIcon className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-settings-title">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your gaming lounge configuration</p>
        </div>
      </div>

      {/* Gaming Center Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Gaming Center Information
          </CardTitle>
          <CardDescription>
            Update your gaming lounge details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveCenterInfo} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Center Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={centerInfo?.name || ""}
                  placeholder="Airavoto Gaming"
                  data-testid="input-center-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={centerInfo?.phone || ""}
                  placeholder="+91 1234567890"
                  data-testid="input-phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={centerInfo?.email || ""}
                placeholder="contact@airavotogaming.com"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                defaultValue={centerInfo?.address || ""}
                placeholder="Enter your gaming center address"
                rows={2}
                data-testid="input-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={centerInfo?.description || ""}
                placeholder="Describe your gaming lounge"
                rows={3}
                data-testid="input-description"
              />
            </div>

            <Button
              type="submit"
              disabled={updateCenterInfoMutation.isPending}
              data-testid="button-save-center-info"
            >
              {updateCenterInfoMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive real-time updates about bookings, payments, and inventory
              </p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
              data-testid="switch-notifications"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="low-inventory-alerts">Low Inventory Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when food items are running low
              </p>
            </div>
            <Switch
              id="low-inventory-alerts"
              defaultChecked={true}
              data-testid="switch-inventory-alerts"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="payment-notifications">Payment Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts for completed payments
              </p>
            </div>
            <Switch
              id="payment-notifications"
              defaultChecked={true}
              data-testid="switch-payment-notifications"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure system-wide settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                name="session-timeout"
                type="number"
                defaultValue="30"
                min="5"
                max="120"
                data-testid="input-session-timeout"
              />
              <p className="text-xs text-muted-foreground">
                Auto-logout inactive users after this duration
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-retention">Data Retention (days)</Label>
              <Input
                id="data-retention"
                name="data-retention"
                type="number"
                defaultValue="90"
                min="30"
                max="365"
                data-testid="input-data-retention"
              />
              <p className="text-xs text-muted-foreground">
                Keep activity logs and analytics for this duration
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" data-testid="button-save-system-settings">
              Save System Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage staff accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Active Users</p>
              <p className="text-sm text-muted-foreground">
                Manage staff members with access to the system
              </p>
            </div>
            <Badge variant="outline" className="text-lg" data-testid="badge-active-users">
              2 Active
            </Badge>
          </div>
          <div className="mt-4">
            <Button variant="secondary" data-testid="button-manage-users">
              Manage Users
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
            <Trash2 className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Manage your data and perform cleanup operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Delete old activity logs and analytics data to free up storage space.
              This action cannot be undone.
            </p>
            <Button variant="destructive" data-testid="button-cleanup-data">
              <Trash2 className="h-4 w-4 mr-2" />
              Clean Up Old Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
