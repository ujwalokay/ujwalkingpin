import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Gift, TrendingDown, Trash2, Edit, Plus, DollarSign, Clock, Percent } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { LoyaltyTier, CustomerLoyalty } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

export default function LoyaltyRewards() {
  const { toast } = useToast();
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [tierForm, setTierForm] = useState({
    tierName: "",
    tierLevel: 1,
    minSpend: "",
    tierColor: "#94a3b8",
    rewardType: "discount" as "free_hours" | "discount" | "cashback",
    rewardValue: "",
    description: "",
    enabled: 1,
  });

  const { data: tiers = [] } = useQuery<LoyaltyTier[]>({
    queryKey: ["/api/loyalty-tiers"],
  });

  const { data: customers = [] } = useQuery<CustomerLoyalty[]>({
    queryKey: ["/api/customer-loyalty"],
  });

  const createTierMutation = useMutation({
    mutationFn: async (data: typeof tierForm) => {
      return await apiRequest("POST", "/api/loyalty-tiers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-tiers"] });
      toast({
        title: "Tier Created",
        description: "Loyalty tier has been created successfully.",
      });
      resetTierForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tier",
        variant: "destructive",
      });
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof tierForm> }) => {
      return await apiRequest("PATCH", `/api/loyalty-tiers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-tiers"] });
      toast({
        title: "Tier Updated",
        description: "Loyalty tier has been updated successfully.",
      });
      resetTierForm();
    },
  });

  const deleteTierMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/loyalty-tiers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-tiers"] });
      toast({
        title: "Tier Deleted",
        description: "Loyalty tier has been removed.",
      });
    },
  });

  const resetTierForm = () => {
    setTierForm({
      tierName: "",
      tierLevel: 1,
      minSpend: "",
      tierColor: "#94a3b8",
      rewardType: "discount",
      rewardValue: "",
      description: "",
      enabled: 1,
    });
    setEditingTier(null);
    setTierDialogOpen(false);
  };

  const handleAddTier = () => {
    setEditingTier(null);
    setTierDialogOpen(true);
  };

  const handleEditTier = (tier: LoyaltyTier) => {
    setEditingTier(tier);
    setTierForm({
      tierName: tier.tierName,
      tierLevel: tier.tierLevel,
      minSpend: tier.minSpend,
      tierColor: tier.tierColor,
      rewardType: tier.rewardType as any,
      rewardValue: tier.rewardValue,
      description: tier.description || "",
      enabled: tier.enabled,
    });
    setTierDialogOpen(true);
  };

  const handleSaveTier = () => {
    if (editingTier) {
      updateTierMutation.mutate({ id: editingTier.id, data: tierForm });
    } else {
      createTierMutation.mutate(tierForm);
    }
  };

  const handleDeleteTier = (id: string) => {
    if (confirm("Are you sure you want to delete this tier? This cannot be undone.")) {
      deleteTierMutation.mutate(id);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "free_hours":
        return <Clock className="h-4 w-4" />;
      case "discount":
        return <Percent className="h-4 w-4" />;
      case "cashback":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getRewardLabel = (type: string, value: string) => {
    switch (type) {
      case "free_hours":
        return `${value} hour${parseFloat(value) !== 1 ? 's' : ''} free`;
      case "discount":
        return `${value}% discount`;
      case "cashback":
        return `₹${value} cashback`;
      default:
        return value;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-pink-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Award className="h-8 w-8 text-purple-600" />
              Loyalty & Rewards
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage customer loyalty tiers and track rewards
            </p>
          </div>
        </div>

        <Tabs defaultValue="tiers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="tiers" data-testid="tab-tiers">Loyalty Tiers</TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="tiers" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Loyalty Tiers</CardTitle>
                    <CardDescription>
                      Configure tier levels based on customer spending
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddTier} data-testid="button-add-tier">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tier
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tiers.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No loyalty tiers configured yet. Create your first tier to get started!
                    </div>
                  ) : (
                    tiers.map((tier) => (
                      <Card key={tier.id} className="relative overflow-hidden" data-testid={`tier-card-${tier.id}`}>
                        <div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ backgroundColor: tier.tierColor }}
                        />
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Award className="h-5 w-5" style={{ color: tier.tierColor }} />
                              <CardTitle className="text-lg">{tier.tierName}</CardTitle>
                            </div>
                            <Badge variant={tier.enabled ? "default" : "secondary"}>
                              Level {tier.tierLevel}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                Min Spend: <span className="font-semibold text-gray-900 dark:text-white">₹{tier.minSpend}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {getRewardIcon(tier.rewardType)}
                              <span className="text-gray-600 dark:text-gray-400">
                                Reward: <span className="font-semibold text-purple-600 dark:text-purple-400">
                                  {getRewardLabel(tier.rewardType, tier.rewardValue)}
                                </span>
                              </span>
                            </div>
                          </div>
                          {tier.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t">
                              {tier.description}
                            </p>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEditTier(tier)}
                              data-testid={`button-edit-tier-${tier.id}`}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDeleteTier(tier.id)}
                              data-testid={`button-delete-tier-${tier.id}`}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Customer Loyalty Status</CardTitle>
                <CardDescription>
                  View customer loyalty tiers and spending history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No customer loyalty data yet. Customers will appear here once they make purchases.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customers.map((customer) => {
                      const tier = tiers.find((t) => t.id === customer.currentTierId);
                      return (
                        <Card key={customer.id} className="border-l-4" style={{ borderLeftColor: tier?.tierColor || "#94a3b8" }} data-testid={`customer-card-${customer.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{customer.customerName}</h3>
                                  {tier && (
                                    <Badge style={{ backgroundColor: tier.tierColor }}>
                                      <Award className="mr-1 h-3 w-3" />
                                      {tier.tierName}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {customer.whatsappNumber}
                                </p>
                              </div>
                              <div className="text-right space-y-1">
                                <div className="text-2xl font-bold text-purple-600">
                                  ₹{customer.totalSpent}
                                </div>
                                <div className="text-xs text-gray-500">Total Spent</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Points Earned</div>
                                <div className="text-lg font-semibold">{customer.pointsEarned}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Rewards Redeemed</div>
                                <div className="text-lg font-semibold">{customer.rewardsRedeemed}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-tier-form">
          <DialogHeader>
            <DialogTitle>{editingTier ? "Edit Tier" : "Create New Tier"}</DialogTitle>
            <DialogDescription>
              Configure loyalty tier requirements and rewards
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tierName">Tier Name</Label>
              <Input
                id="tierName"
                value={tierForm.tierName}
                onChange={(e) => setTierForm({ ...tierForm, tierName: e.target.value })}
                placeholder="e.g., Bronze, Silver, Gold"
                data-testid="input-tier-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tierLevel">Tier Level</Label>
                <Input
                  id="tierLevel"
                  type="number"
                  min="1"
                  value={tierForm.tierLevel}
                  onChange={(e) => setTierForm({ ...tierForm, tierLevel: parseInt(e.target.value) || 1 })}
                  data-testid="input-tier-level"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minSpend">Min Spend (₹)</Label>
                <Input
                  id="minSpend"
                  type="number"
                  min="0"
                  value={tierForm.minSpend}
                  onChange={(e) => setTierForm({ ...tierForm, minSpend: e.target.value })}
                  placeholder="1000"
                  data-testid="input-min-spend"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tierColor">Tier Color</Label>
              <div className="flex gap-2">
                <Input
                  id="tierColor"
                  type="color"
                  value={tierForm.tierColor}
                  onChange={(e) => setTierForm({ ...tierForm, tierColor: e.target.value })}
                  className="w-20 h-10"
                  data-testid="input-tier-color"
                />
                <Input
                  value={tierForm.tierColor}
                  onChange={(e) => setTierForm({ ...tierForm, tierColor: e.target.value })}
                  placeholder="#94a3b8"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rewardType">Reward Type</Label>
                <Select
                  value={tierForm.rewardType}
                  onValueChange={(value: any) => setTierForm({ ...tierForm, rewardType: value })}
                >
                  <SelectTrigger data-testid="select-reward-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free_hours">Free Hours</SelectItem>
                    <SelectItem value="discount">Discount %</SelectItem>
                    <SelectItem value="cashback">Cashback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rewardValue">Reward Value</Label>
                <Input
                  id="rewardValue"
                  type="number"
                  min="0"
                  step="0.1"
                  value={tierForm.rewardValue}
                  onChange={(e) => setTierForm({ ...tierForm, rewardValue: e.target.value })}
                  placeholder={tierForm.rewardType === "discount" ? "10" : tierForm.rewardType === "free_hours" ? "1" : "100"}
                  data-testid="input-reward-value"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={tierForm.description}
                onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })}
                placeholder="Additional tier benefits or description"
                rows={3}
                data-testid="input-tier-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetTierForm} data-testid="button-cancel-tier">
              Cancel
            </Button>
            <Button onClick={handleSaveTier} data-testid="button-save-tier">
              {editingTier ? "Update" : "Create"} Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
