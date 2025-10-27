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
import { Award, Gift, TrendingDown, Trash2, Edit, Plus, DollarSign, Clock, Percent, Users, Trophy, Star } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { LoyaltyTier, CustomerLoyalty, LoyaltyReward } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

export default function LoyaltyRewards() {
  const { toast } = useToast();
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [tierForm, setTierForm] = useState({
    tierName: "",
    tierLevel: 1,
    minSpend: "",
    maxSpend: "",
    tierColor: "#94a3b8",
    rewardType: "discount" as "free_hours" | "discount" | "cashback",
    rewardValue: "",
    description: "",
    enabled: 1,
  });

  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [rewardForm, setRewardForm] = useState({
    name: "",
    description: "",
    pointCost: 100,
    category: "gaming",
    value: "",
    enabled: 1,
    stock: null as number | null,
  });

  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLoyalty | null>(null);
  const [selectedRewardForRedemption, setSelectedRewardForRedemption] = useState<string>("");

  const { data: tiers = [] } = useQuery<LoyaltyTier[]>({
    queryKey: ["/api/loyalty-tiers"],
  });

  const { data: customers = [] } = useQuery<CustomerLoyalty[]>({
    queryKey: ["/api/customer-loyalty"],
  });

  const { data: rewards = [] } = useQuery<LoyaltyReward[]>({
    queryKey: ["/api/loyalty-rewards"],
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

  const createRewardMutation = useMutation({
    mutationFn: async (data: typeof rewardForm) => {
      return await apiRequest("POST", "/api/loyalty-rewards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-rewards"] });
      toast({
        title: "Reward Created",
        description: "Loyalty reward has been created successfully.",
      });
      resetRewardForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create reward",
        variant: "destructive",
      });
    },
  });

  const updateRewardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof rewardForm> }) => {
      return await apiRequest("PATCH", `/api/loyalty-rewards/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-rewards"] });
      toast({
        title: "Reward Updated",
        description: "Loyalty reward has been updated successfully.",
      });
      resetRewardForm();
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/loyalty-rewards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-rewards"] });
      toast({
        title: "Reward Deleted",
        description: "Loyalty reward has been removed.",
      });
    },
  });

  const redeemRewardMutation = useMutation({
    mutationFn: async (data: { whatsappNumber: string; rewardId: string }) => {
      return await apiRequest("POST", "/api/rewards/redeem", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-loyalty"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-rewards"] });
      toast({
        title: "Reward Redeemed!",
        description: `Successfully redeemed reward. Remaining points: ${data.remainingPoints}`,
      });
      setRedemptionDialogOpen(false);
      setSelectedCustomer(null);
      setSelectedRewardForRedemption("");
    },
    onError: (error: any) => {
      toast({
        title: "Redemption Failed",
        description: error.message || "Failed to redeem reward",
        variant: "destructive",
      });
    },
  });

  const resetTierForm = () => {
    setTierForm({
      tierName: "",
      tierLevel: 1,
      minSpend: "",
      maxSpend: "",
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
      maxSpend: tier.maxSpend || "",
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

  const resetRewardForm = () => {
    setRewardForm({
      name: "",
      description: "",
      pointCost: 100,
      category: "gaming",
      value: "",
      enabled: 1,
      stock: null,
    });
    setEditingReward(null);
    setRewardDialogOpen(false);
  };

  const handleAddReward = () => {
    setEditingReward(null);
    setRewardDialogOpen(true);
  };

  const handleEditReward = (reward: LoyaltyReward) => {
    setEditingReward(reward);
    setRewardForm({
      name: reward.name,
      description: reward.description,
      pointCost: reward.pointCost,
      category: reward.category,
      value: reward.value,
      enabled: reward.enabled,
      stock: reward.stock,
    });
    setRewardDialogOpen(true);
  };

  const handleSaveReward = () => {
    if (editingReward) {
      updateRewardMutation.mutate({ id: editingReward.id, data: rewardForm });
    } else {
      createRewardMutation.mutate(rewardForm);
    }
  };

  const handleDeleteReward = (id: string) => {
    if (confirm("Are you sure you want to delete this reward? This cannot be undone.")) {
      deleteRewardMutation.mutate(id);
    }
  };

  const handleRedeemRewards = (customer: CustomerLoyalty) => {
    setSelectedCustomer(customer);
    setRedemptionDialogOpen(true);
  };

  const handleConfirmRedemption = () => {
    if (!selectedCustomer || !selectedRewardForRedemption) {
      toast({
        title: "Error",
        description: "Please select a reward to redeem",
        variant: "destructive",
      });
      return;
    }
    
    redeemRewardMutation.mutate({
      whatsappNumber: selectedCustomer.whatsappNumber,
      rewardId: selectedRewardForRedemption,
    });
  };

  const activeRewardsForRedemption = rewards.filter(r => r.enabled && (r.stock === null || r.stock > 0));

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

  const stats = {
    totalCustomers: customers.length,
    activeTiers: tiers.filter(t => t.enabled).length,
    totalRewardsRedeemed: customers.reduce((sum, c) => sum + (c.rewardsRedeemed || 0), 0),
    totalPointsEarned: customers.reduce((sum, c) => sum + (c.pointsEarned || 0), 0),
    activeRewards: rewards.filter(r => r.enabled).length,
    totalRewards: rewards.length,
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card" data-testid="card-total-customers">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Total Customers</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                {stats.totalCustomers}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card" data-testid="card-active-tiers">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Active Tiers</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                <Trophy className="h-6 w-6 text-purple-600" />
                {stats.activeTiers}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card" data-testid="card-total-points">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Total Points Earned</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-600" />
                {stats.totalPointsEarned}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card" data-testid="card-rewards-redeemed">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Rewards Redeemed</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                <Gift className="h-6 w-6 text-green-600" />
                {stats.totalRewardsRedeemed}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="tiers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="tiers" data-testid="tab-tiers">Loyalty Tiers</TabsTrigger>
            <TabsTrigger value="rewards" data-testid="tab-rewards">Rewards</TabsTrigger>
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
                                Spend Range: <span className="font-semibold text-gray-900 dark:text-white">
                                  ₹{tier.minSpend}{tier.maxSpend ? ` - ₹${tier.maxSpend}` : '+'}
                                </span>
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

          <TabsContent value="rewards" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Redeemable Rewards</CardTitle>
                    <CardDescription>
                      Manage rewards that customers can purchase with loyalty points
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddReward} data-testid="button-add-reward" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Reward
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rewards.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No rewards configured yet. Create your first reward to get started!
                    </div>
                  ) : (
                    rewards.map((reward) => (
                      <Card key={reward.id} className="relative" data-testid={`reward-card-${reward.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <Gift className="h-5 w-5 text-purple-600" />
                              <CardTitle className="text-lg">{reward.name}</CardTitle>
                            </div>
                            <Badge variant={reward.enabled ? "default" : "secondary"}>
                              {reward.enabled ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {reward.description}
                          </p>
                          <div className="space-y-2 pt-2 border-t">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Point Cost:</span>
                              <span className="font-bold text-purple-600 text-lg">{reward.pointCost}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Value:</span>
                              <span className="font-semibold">₹{reward.value}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Category:</span>
                              <span className="font-medium capitalize">{reward.category}</span>
                            </div>
                            {reward.stock !== null && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                                <span className={`font-semibold ${reward.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                                  {reward.stock} left
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Redeemed:</span>
                              <span className="font-medium">{reward.totalRedeemed}x</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEditReward(reward)}
                              data-testid={`button-edit-reward-${reward.id}`}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDeleteReward(reward.id)}
                              data-testid={`button-delete-reward-${reward.id}`}
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
                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Points Earned</div>
                                <div className="text-lg font-semibold">{customer.pointsEarned}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Points Available</div>
                                <div className="text-lg font-semibold text-purple-600">{customer.pointsAvailable}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Rewards Redeemed</div>
                                <div className="text-lg font-semibold">{customer.rewardsRedeemed}</div>
                              </div>
                            </div>
                            {customer.pointsAvailable >= 100 && (
                              <div className="mt-4 pt-4 border-t">
                                <Button 
                                  onClick={() => handleRedeemRewards(customer)} 
                                  className="w-full"
                                  variant="outline"
                                  data-testid={`button-redeem-${customer.id}`}
                                >
                                  <Gift className="mr-2 h-4 w-4" />
                                  Redeem Rewards ({customer.pointsAvailable} pts)
                                </Button>
                              </div>
                            )}
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
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="maxSpend">Max Spend (₹)</Label>
                <Input
                  id="maxSpend"
                  type="number"
                  min="0"
                  value={tierForm.maxSpend}
                  onChange={(e) => setTierForm({ ...tierForm, maxSpend: e.target.value })}
                  placeholder="5000 (optional)"
                  data-testid="input-max-spend"
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

      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto" data-testid="dialog-reward-form">
          <DialogHeader>
            <DialogTitle>{editingReward ? "Edit Reward" : "Create New Reward"}</DialogTitle>
            <DialogDescription>
              Configure reward details and point costs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rewardName">Reward Name *</Label>
                <Input
                  id="rewardName"
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  placeholder="e.g., Free Gaming Session"
                  data-testid="input-reward-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={rewardForm.category}
                  onValueChange={(value) => setRewardForm({ ...rewardForm, category: value })}
                >
                  <SelectTrigger data-testid="select-reward-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="food">Food & Beverage</SelectItem>
                    <SelectItem value="discount">Discount Voucher</SelectItem>
                    <SelectItem value="merchandise">Merchandise</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rewardDescription">Description *</Label>
              <Textarea
                id="rewardDescription"
                value={rewardForm.description}
                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                placeholder="Describe what the customer receives with this reward"
                rows={3}
                data-testid="input-reward-description"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pointCost">Point Cost * (min: 100)</Label>
                <Input
                  id="pointCost"
                  type="number"
                  min="100"
                  value={rewardForm.pointCost}
                  onChange={(e) => setRewardForm({ ...rewardForm, pointCost: parseInt(e.target.value) || 100 })}
                  placeholder="100"
                  data-testid="input-point-cost"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rewardValue">Value (₹) *</Label>
                <Input
                  id="rewardValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={rewardForm.value}
                  onChange={(e) => setRewardForm({ ...rewardForm, value: e.target.value })}
                  placeholder="100"
                  data-testid="input-reward-value-field"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock (leave empty for unlimited)</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={rewardForm.stock === null ? "" : rewardForm.stock}
                  onChange={(e) => setRewardForm({ 
                    ...rewardForm, 
                    stock: e.target.value === "" ? null : parseInt(e.target.value) || 0 
                  })}
                  placeholder="Unlimited"
                  data-testid="input-reward-stock"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enabled">Status *</Label>
                <Select
                  value={rewardForm.enabled.toString()}
                  onValueChange={(value) => setRewardForm({ ...rewardForm, enabled: parseInt(value) })}
                >
                  <SelectTrigger data-testid="select-reward-enabled">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:flex-row flex-col-reverse gap-2">
            <Button variant="outline" onClick={resetRewardForm} data-testid="button-cancel-reward" className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveReward} data-testid="button-save-reward" className="w-full sm:w-auto">
              {editingReward ? "Update" : "Create"} Reward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={redemptionDialogOpen} onOpenChange={setRedemptionDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" data-testid="dialog-redemption">
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>
              {selectedCustomer && (
                <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedCustomer.customerName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCustomer.whatsappNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{selectedCustomer.pointsAvailable}</p>
                      <p className="text-xs text-gray-500">Points Available</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {activeRewardsForRedemption.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active rewards available at this time.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeRewardsForRedemption.map((reward) => {
                  const canAfford = selectedCustomer && selectedCustomer.pointsAvailable >= reward.pointCost;
                  const meetsMinimum = selectedCustomer && selectedCustomer.pointsAvailable >= 100;
                  
                  return (
                    <Card 
                      key={reward.id} 
                      className={`cursor-pointer transition-all ${
                        selectedRewardForRedemption === reward.id 
                          ? 'ring-2 ring-purple-600 shadow-lg' 
                          : 'hover:shadow-md'
                      } ${!canAfford || !meetsMinimum ? 'opacity-50' : ''}`}
                      onClick={() => canAfford && meetsMinimum && setSelectedRewardForRedemption(reward.id)}
                      data-testid={`reward-option-${reward.id}`}
                    >
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <Gift className="h-5 w-5 text-purple-600" />
                            <h3 className="font-semibold">{reward.name}</h3>
                          </div>
                          {selectedRewardForRedemption === reward.id && (
                            <Badge className="bg-purple-600">Selected</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {reward.description}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Value: </span>
                            <span className="font-semibold">₹{reward.value}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">{reward.pointCost} pts</div>
                            {reward.stock !== null && (
                              <div className="text-xs text-gray-500">{reward.stock} in stock</div>
                            )}
                          </div>
                        </div>
                        {!canAfford && meetsMinimum && (
                          <p className="text-xs text-red-600 pt-1">Not enough points</p>
                        )}
                        {!meetsMinimum && (
                          <p className="text-xs text-red-600 pt-1">Need minimum 100 points to redeem</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="sm:flex-row flex-col-reverse gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setRedemptionDialogOpen(false);
                setSelectedCustomer(null);
                setSelectedRewardForRedemption("");
              }}
              data-testid="button-cancel-redemption"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmRedemption} 
              disabled={!selectedRewardForRedemption || redeemRewardMutation.isPending}
              data-testid="button-confirm-redemption"
              className="w-full sm:w-auto"
            >
              {redeemRewardMutation.isPending ? "Redeeming..." : "Confirm Redemption"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
