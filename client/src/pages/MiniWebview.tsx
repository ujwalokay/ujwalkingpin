import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Eye, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WebviewSettings } from "@shared/schema";
import { insertWebviewSettingsSchema } from "@shared/schema";

export default function MiniWebview() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<WebviewSettings>({
    queryKey: ["/api/webview-settings"],
  });

  const form = useForm({
    resolver: zodResolver(insertWebviewSettingsSchema),
    values: settings || {
      businessName: "Ankylo Gaming",
      logoUrl: "",
      headerTitle: "Live Availability",
      headerSubtitle: "Real-time status updated every 5 seconds",
      updateInterval: 5,
      showPricing: 1,
      showContactInfo: 1,
      contactSectionTitle: "Ankylo Gaming Center",
      address: "123 Gaming Street, Tech District, City - 400001",
      phone: "+91 98765 43210",
      hours: "10:00 AM - 11:00 PM (Mon-Sun)",
      email: "info@ankylgaming.com",
      showCallNowButton: 1,
      showDirectionsButton: 1,
      showFacilities: 1,
      primaryColor: "#a855f7",
      accentColor: "#8b5cf6",
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/webview-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webview-settings"] });
      toast({
        title: "Settings saved",
        description: "Consumer webview settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    saveSettingsMutation.mutate(data);
  };

  const openPreview = () => {
    window.open("/status", "_blank");
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white dark:text-white" data-testid="text-page-title">Mini Webview Settings</h1>
          <p className="text-gray-400 dark:text-gray-400 mt-2" data-testid="text-page-description">
            Customize how your consumer-facing public status page looks and behaves
          </p>
        </div>
        <Button 
          onClick={openPreview} 
          variant="outline" 
          className="gap-2"
          data-testid="button-preview"
        >
          <Eye className="w-4 h-4" />
          Preview Page
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-gray-800/50 dark:bg-gray-800/50 border-gray-700 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-white dark:text-white">Branding</CardTitle>
              <CardDescription className="text-gray-400 dark:text-gray-400">
                Configure your business name, logo, and colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white dark:text-white">Business Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ankylo Gaming"
                        className="bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600 text-white dark:text-white"
                        data-testid="input-business-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white dark:text-white">Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        placeholder="https://example.com/logo.png"
                        className="bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600 text-white dark:text-white"
                        data-testid="input-logo-url"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400 dark:text-gray-400">
                      Leave empty to use the business name as text
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white dark:text-white">Primary Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            {...field} 
                            type="color"
                            className="w-16 h-10 bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600"
                            data-testid="input-primary-color"
                          />
                          <Input 
                            {...field} 
                            placeholder="#a855f7"
                            className="flex-1 bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600 text-white dark:text-white"
                            data-testid="input-primary-color-text"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accentColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white dark:text-white">Accent Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input 
                            {...field} 
                            type="color"
                            className="w-16 h-10 bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600"
                            data-testid="input-accent-color"
                          />
                          <Input 
                            {...field} 
                            placeholder="#8b5cf6"
                            className="flex-1 bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600 text-white dark:text-white"
                            data-testid="input-accent-color-text"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 dark:bg-gray-800/50 border-gray-700 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-white dark:text-white">Header Section</CardTitle>
              <CardDescription className="text-gray-400 dark:text-gray-400">
                Customize the header title and update frequency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="headerTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white dark:text-white">Header Title</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Live Availability"
                        className="bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600 text-white dark:text-white"
                        data-testid="input-header-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="headerSubtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white dark:text-white">Header Subtitle</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Real-time status updated every 5 seconds"
                        className="bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600 text-white dark:text-white"
                        data-testid="input-header-subtitle"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="updateInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white dark:text-white">Update Interval (seconds)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        min={1}
                        max={60}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600 text-white dark:text-white"
                        data-testid="input-update-interval"
                      />
                    </FormControl>
                    <FormDescription className="text-gray-400 dark:text-gray-400">
                      How often the availability updates (1-60 seconds)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 dark:bg-gray-800/50 border-gray-700 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-white dark:text-white">Contact Information</CardTitle>
              <CardDescription className="text-gray-400 dark:text-gray-400">
                Display your gaming center's contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="showContactInfo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 dark:border-gray-600 p-4 bg-gray-900 dark:bg-gray-900">
                    <div className="space-y-0.5">
                      <FormLabel className="text-white dark:text-white">Show Contact Section</FormLabel>
                      <FormDescription className="text-gray-400 dark:text-gray-400">
                        Display contact information on the public page
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 1}
                        onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                        data-testid="switch-show-contact"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactSectionTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white dark:text-white">Section Title</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ankylo Gaming Center"
                        className="bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600 text-white dark:text-white"
                        data-testid="input-contact-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white dark:text-white">Address</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        placeholder="123 Gaming Street, Tech District, City - 400001"
                        className="bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600 text-white dark:text-white"
                        data-testid="input-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white dark:text-white">Phone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""}
                          placeholder="+91 98765 43210"
                          className="bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600 text-white dark:text-white"
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white dark:text-white">Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          value={field.value || ""}
                          placeholder="info@ankylgaming.com"
                          className="bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600 text-white dark:text-white"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white dark:text-white">Operating Hours</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ""}
                        placeholder="10:00 AM - 11:00 PM (Mon-Sun)"
                        className="bg-gray-900 dark:bg-gray-900 border-gray-600 dark:border-gray-600 text-white dark:text-white"
                        data-testid="input-hours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 dark:bg-gray-800/50 border-gray-700 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-white dark:text-white">Display Options</CardTitle>
              <CardDescription className="text-gray-400 dark:text-gray-400">
                Toggle visibility of different sections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="showPricing"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 dark:border-gray-600 p-4 bg-gray-900 dark:bg-gray-900">
                    <div className="space-y-0.5">
                      <FormLabel className="text-white dark:text-white">Show Pricing</FormLabel>
                      <FormDescription className="text-gray-400 dark:text-gray-400">
                        Display pricing information
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 1}
                        onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                        data-testid="switch-show-pricing"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showCallNowButton"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 dark:border-gray-600 p-4 bg-gray-900 dark:bg-gray-900">
                    <div className="space-y-0.5">
                      <FormLabel className="text-white dark:text-white">Show Call Now Button</FormLabel>
                      <FormDescription className="text-gray-400 dark:text-gray-400">
                        Display call to action button
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 1}
                        onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                        data-testid="switch-show-call-button"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showDirectionsButton"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 dark:border-gray-600 p-4 bg-gray-900 dark:bg-gray-900">
                    <div className="space-y-0.5">
                      <FormLabel className="text-white dark:text-white">Show Directions Button</FormLabel>
                      <FormDescription className="text-gray-400 dark:text-gray-400">
                        Display directions button
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 1}
                        onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                        data-testid="switch-show-directions-button"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showFacilities"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-gray-600 dark:border-gray-600 p-4 bg-gray-900 dark:bg-gray-900">
                    <div className="space-y-0.5">
                      <FormLabel className="text-white dark:text-white">Show Facilities</FormLabel>
                      <FormDescription className="text-gray-400 dark:text-gray-400">
                        Display facilities section
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 1}
                        onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                        data-testid="switch-show-facilities"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              disabled={saveSettingsMutation.isPending}
              className="gap-2 bg-purple-600 dark:bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-700"
              data-testid="button-save"
            >
              {saveSettingsMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
