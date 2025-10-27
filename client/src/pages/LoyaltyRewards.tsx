import { useState, useEffect } from "react";
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
import { Award, Gift, Trash2, Edit, Plus, Users, Star, Settings as SettingsIcon } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CustomerLoyalty, LoyaltyReward } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

export default function LoyaltyRewards() {
  const { toast } = useToast();
  
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [rewardForm, setRewardForm] = useState({
    name: "",
    description: "",
    cardType: "bronze",
    rewardType: "discount",
    value: "",
    cardPointsRequired: 0,
    enabled: 1,
  });

  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLoyalty | null>(null);
  const [selectedRewardForRedemption, setSelectedRewardForRedemption] = useState<string>("");
  
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    pointsPerVisit: 10,
    spendingRanges: [
      { minSpent: 0, maxSpent: 100, points: 5 },
      { minSpent: 101, maxSpent: 300, points: 15 },
      { minSpent: 301, maxSpent: 500, points: 30 },
      { minSpent: 501, maxSpent: null, points: 50 }
    ]
  });

  const { data: customers = [] } = useQuery<CustomerLoyalty[]>({
    queryKey: ["/api/customer-loyalty"],
  });

  const { data: rewards = [] } = useQuery<LoyaltyReward[]>({
    queryKey: ["/api/loyalty-rewards"],
  });
  
  const { data: loyaltySettings } = useQuery({
    queryKey: ["/api/loyalty-settings"],
  });
  
  useEffect(() => {
    if (loyaltySettings) {
      setSettingsForm({
        pointsPerVisit: (loyaltySettings as any).pointsPerVisit,
        spendingRanges: JSON.parse((loyaltySettings as any).spendingRanges)
      });
    }
  }, [loyaltySettings]);

  const createRewardMutation = useMutation({
    mutationFn: async (data: typeof rewardForm) => {
      const payload = {
        ...data,
        pointCost: 0,
        category: "general",
        stock: null,
      };
      return await apiRequest("POST", "/api/loyalty-rewards", payload);
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
      let errorMessage = "Failed to create reward";
      
      if (error.message) {
        try {
          const parsed = JSON.parse(error.message);
          if (Array.isArray(parsed)) {
            errorMessage = parsed.map((e: any) => e.message).join(", ");
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateRewardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof rewardForm> }) => {
      const payload = {
        ...data,
        pointCost: 0,
        category: "general",
      };
      return await apiRequest("PATCH", `/api/loyalty-rewards/${id}`, payload);
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

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settingsForm) => {
      return await apiRequest("PATCH", "/api/loyalty-settings", {
        pointsPerVisit: data.pointsPerVisit,
        spendingRanges: JSON.stringify(data.spendingRanges)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-settings"] });
      toast({
        title: "Settings Updated",
        description: "Loyalty point earning rules have been updated successfully.",
      });
      setSettingsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const resetRewardForm = () => {
    setRewardForm({
      name: "",
      description: "",
      cardType: "bronze",
      rewardType: "discount",
      value: "",
      cardPointsRequired: 0,
      enabled: 1,
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
      cardType: reward.cardType || "bronze",
      rewardType: reward.rewardType || "discount",
      value: reward.value,
      cardPointsRequired: reward.cardPointsRequired || 0,
      enabled: reward.enabled,
    });
    setRewardDialogOpen(true);
  };

  const handleSaveReward = () => {
    if (!rewardForm.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a reward name",
        variant: "destructive",
      });
      return;
    }
    
    if (!rewardForm.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a reward description",
        variant: "destructive",
      });
      return;
    }
    
    if (!rewardForm.value.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a reward value",
        variant: "destructive",
      });
      return;
    }
    
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

  const stats = {
    totalCustomers: customers.length,
    availablePoints: customers.reduce((sum, c) => sum + (c.pointsAvailable || 0), 0),
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
              Tiered card system with Bronze, Silver, Gold, Diamond & Platinum levels. Points and rewards vary by tier.
            </p>
          </div>
          <Button onClick={() => setSettingsDialogOpen(true)} variant="outline" data-testid="button-loyalty-settings">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Point Earning Rules
          </Button>
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
          <Card className="glass-card" data-testid="card-available-points">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Available Points</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-600" />
                {stats.availablePoints}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card" data-testid="card-active-rewards">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Active Rewards</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                <Gift className="h-6 w-6 text-purple-600" />
                {stats.activeRewards}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="glass-card" data-testid="card-total-rewards">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Total Rewards</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                <Award className="h-6 w-6 text-green-600" />
                {stats.totalRewards}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="rewards" data-testid="tab-rewards">Rewards Catalog</TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Rewards Catalog</CardTitle>
                    <CardDescription>
                      Create and manage rewards that customers can redeem with points
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddReward} data-testid="button-add-reward">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Reward
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rewards.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No rewards yet. Create your first reward to get started!
                    </div>
                  ) : (
                    rewards.map((reward) => (
                      <Card key={reward.id} className="relative overflow-hidden" data-testid={`reward-card-${reward.id}`}>
                        <div className={`absolute top-0 left-0 right-0 h-1 ${reward.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Gift className="h-5 w-5 text-purple-600" />
                              <CardTitle className="text-lg">{reward.name}</CardTitle>
                            </div>
                            <Badge variant={reward.enabled ? "default" : "secondary"}>
                              {reward.enabled ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm line-clamp-2">
                            {reward.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Card Tier:</span>
                              <Badge className="capitalize" variant="outline">{reward.cardType || 'bronze'}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Reward Type:</span>
                              <Badge variant="secondary" className="capitalize">{(reward.rewardType || 'discount').replace('_', ' ')}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Value:</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {reward.rewardType === 'free_hour' ? `${reward.value} hrs` : `₹${reward.value}`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Tier Points:</span>
                              <span className="text-xs font-medium">{reward.cardPointsRequired || 0} pts</span>
                            </div>
                            {reward.stock !== null && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                                <span className={`font-semibold ${reward.stock === 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                                  {reward.stock}
                                </span>
                              </div>
                            )}
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
                <CardTitle>Customer Loyalty</CardTitle>
                <CardDescription>
                  View customer points and redeem rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No customers with loyalty points yet.
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <Card key={customer.whatsappNumber} className="relative overflow-hidden" data-testid={`customer-card-${customer.whatsappNumber}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                  <span className="text-white font-bold text-lg">
                                    {customer.customerName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                    {customer.customerName}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {customer.whatsappNumber}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 mt-4">
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
                                  <p className="text-lg font-bold text-gray-900 dark:text-white">₹{customer.totalSpent}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Points Earned</p>
                                  <p className="text-lg font-bold text-yellow-600">{customer.pointsEarned}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Points Available</p>
                                  <p className="text-lg font-bold text-purple-600">{customer.pointsAvailable}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-reward-form">
          <DialogHeader>
            <DialogTitle>{editingReward ? "Edit Reward" : "Create New Reward"}</DialogTitle>
            <DialogDescription>
              Configure reward details and point cost
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="rewardName">Reward Name</Label>
              <Input
                id="rewardName"
                value={rewardForm.name}
                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                placeholder="e.g., Free Snack Voucher"
                data-testid="input-reward-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rewardDescription">Description</Label>
              <Textarea
                id="rewardDescription"
                value={rewardForm.description}
                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                placeholder="Describe the reward..."
                data-testid="input-reward-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardType">Card Type</Label>
              <Select
                value={rewardForm.cardType}
                onValueChange={(value) => setRewardForm({ ...rewardForm, cardType: value })}
              >
                <SelectTrigger data-testid="select-card-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze Card</SelectItem>
                  <SelectItem value="silver">Silver Card</SelectItem>
                  <SelectItem value="gold">Gold Card</SelectItem>
                  <SelectItem value="diamond">Diamond Card</SelectItem>
                  <SelectItem value="platinum">Platinum Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rewardType">Reward Type</Label>
              <Select
                value={rewardForm.rewardType}
                onValueChange={(value) => setRewardForm({ ...rewardForm, rewardType: value })}
              >
                <SelectTrigger data-testid="select-reward-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Discount</SelectItem>
                  <SelectItem value="cashback">Cashback</SelectItem>
                  <SelectItem value="free_hour">Free Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rewardValue">
                {rewardForm.rewardType === "discount" && "Discount Value (%)"}
                {rewardForm.rewardType === "cashback" && "Cashback Amount (₹)"}
                {rewardForm.rewardType === "free_hour" && "Free Time"}
              </Label>
              {rewardForm.rewardType === "discount" && (
                <div className="relative">
                  <Input
                    id="rewardValue"
                    type="number"
                    min="1"
                    max="100"
                    value={rewardForm.value}
                    onChange={(e) => setRewardForm({ ...rewardForm, value: e.target.value })}
                    placeholder="e.g., 10 for 10% off"
                    data-testid="input-reward-monetary-value"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>
              )}
              {rewardForm.rewardType === "cashback" && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="rewardValue"
                    type="number"
                    min="1"
                    value={rewardForm.value}
                    onChange={(e) => setRewardForm({ ...rewardForm, value: e.target.value })}
                    placeholder="e.g., 50 for ₹50 cashback"
                    data-testid="input-reward-monetary-value"
                    className="pl-8"
                  />
                </div>
              )}
              {rewardForm.rewardType === "free_hour" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Input
                      id="rewardValue"
                      type="number"
                      min="0"
                      max="24"
                      value={rewardForm.value.split(':')[0] || ""}
                      onChange={(e) => {
                        const hours = e.target.value;
                        const minutes = rewardForm.value.split(':')[1] || "0";
                        setRewardForm({ ...rewardForm, value: `${hours}:${minutes}` });
                      }}
                      placeholder="Hours"
                      data-testid="input-reward-monetary-value"
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">hrs</span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={rewardForm.value.split(':')[1] || ""}
                      onChange={(e) => {
                        const hours = rewardForm.value.split(':')[0] || "0";
                        const minutes = e.target.value;
                        setRewardForm({ ...rewardForm, value: `${hours}:${minutes}` });
                      }}
                      placeholder="Minutes"
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">min</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500">
                {rewardForm.rewardType === "discount" && "Enter percentage discount (1-100)"}
                {rewardForm.rewardType === "cashback" && "Enter cashback amount in rupees"}
                {rewardForm.rewardType === "free_hour" && "Enter free gaming time in hours and minutes"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardPointsRequired">Card Points Required</Label>
              <Input
                id="cardPointsRequired"
                type="number"
                min="0"
                value={rewardForm.cardPointsRequired}
                onChange={(e) => setRewardForm({ ...rewardForm, cardPointsRequired: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 50"
                data-testid="input-card-points-required"
              />
              <p className="text-xs text-gray-500">Points needed to redeem this card tier reward</p>
            </div>


            <div className="space-y-2">
              <Label htmlFor="rewardEnabled">Status</Label>
              <Select
                value={rewardForm.enabled.toString()}
                onValueChange={(value) => setRewardForm({ ...rewardForm, enabled: parseInt(value) as 0 | 1 })}
              >
                <SelectTrigger data-testid="select-reward-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetRewardForm} data-testid="button-cancel-reward">
              Cancel
            </Button>
            <Button onClick={handleSaveReward} data-testid="button-save-reward">
              {editingReward ? "Update" : "Create"} Reward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={redemptionDialogOpen} onOpenChange={setRedemptionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-reward-redemption">
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>
              Select a reward for {selectedCustomer?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedCustomer && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg space-y-2">
                <div className="font-semibold">{selectedCustomer.customerName}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Available Points: <span className="font-bold text-purple-600">{selectedCustomer.pointsAvailable}</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rewardSelect">Select Reward</Label>
              <Select
                value={selectedRewardForRedemption}
                onValueChange={setSelectedRewardForRedemption}
              >
                <SelectTrigger data-testid="select-reward-redemption">
                  <SelectValue placeholder="Choose a reward..." />
                </SelectTrigger>
                <SelectContent>
                  {activeRewardsForRedemption.map((reward) => (
                    <SelectItem key={reward.id} value={reward.id}>
                      {reward.name} - {reward.pointCost} pts (₹{reward.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRedemptionDialogOpen(false);
              setSelectedCustomer(null);
              setSelectedRewardForRedemption("");
            }} data-testid="button-cancel-redemption">
              Cancel
            </Button>
            <Button onClick={handleConfirmRedemption} data-testid="button-confirm-redemption">
              Redeem Reward
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" data-testid="dialog-loyalty-settings">
          <DialogHeader>
            <DialogTitle>Loyalty Point Earning Rules</DialogTitle>
            <DialogDescription>
              Configure how customers earn points with the hybrid system (visits + spending)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="pointsPerVisit">Points Per Visit</Label>
              <Input
                id="pointsPerVisit"
                type="number"
                min="0"
                value={settingsForm.pointsPerVisit}
                onChange={(e) => setSettingsForm({ ...settingsForm, pointsPerVisit: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 10"
                data-testid="input-points-per-visit"
              />
              <p className="text-xs text-gray-500">Base points awarded for each visit/booking</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Spending Ranges & Bonus Points</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSettingsForm({
                      ...settingsForm,
                      spendingRanges: [
                        ...settingsForm.spendingRanges,
                        { minSpent: 0, maxSpent: 100, points: 0 }
                      ]
                    });
                  }}
                  data-testid="button-add-spending-range"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Range
                </Button>
              </div>
              <p className="text-xs text-gray-500">Points earned based on how much customers spend (in addition to visit points)</p>
              
              <div className="space-y-2 border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
                {settingsForm.spendingRanges.map((range, index) => (
                  <div key={index} className="flex gap-2 items-center" data-testid={`spending-range-${index}`}>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={range.minSpent}
                        onChange={(e) => {
                          const newRanges = [...settingsForm.spendingRanges];
                          newRanges[index].minSpent = parseInt(e.target.value) || 0;
                          setSettingsForm({ ...settingsForm, spendingRanges: newRanges });
                        }}
                        placeholder="Min ₹"
                        data-testid={`input-min-spent-${index}`}
                      />
                      <Input
                        type="number"
                        min="0"
                        value={range.maxSpent || ""}
                        onChange={(e) => {
                          const newRanges = [...settingsForm.spendingRanges];
                          newRanges[index].maxSpent = e.target.value ? parseInt(e.target.value) : null;
                          setSettingsForm({ ...settingsForm, spendingRanges: newRanges });
                        }}
                        placeholder="Max ₹ (∞)"
                        data-testid={`input-max-spent-${index}`}
                      />
                      <Input
                        type="number"
                        min="0"
                        value={range.points}
                        onChange={(e) => {
                          const newRanges = [...settingsForm.spendingRanges];
                          newRanges[index].points = parseInt(e.target.value) || 0;
                          setSettingsForm({ ...settingsForm, spendingRanges: newRanges });
                        }}
                        placeholder="Points"
                        data-testid={`input-points-${index}`}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newRanges = settingsForm.spendingRanges.filter((_, i) => i !== index);
                        setSettingsForm({ ...settingsForm, spendingRanges: newRanges });
                      }}
                      data-testid={`button-remove-range-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
              <div className="font-semibold text-blue-900 dark:text-blue-100">How It Works (Hybrid System)</div>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>✓ Customer gets <strong>{settingsForm.pointsPerVisit} points</strong> just for visiting</p>
                <p>✓ PLUS bonus points based on what they spend:</p>
                {settingsForm.spendingRanges.map((range, idx) => (
                  <p key={idx} className="ml-4">
                    • ₹{range.minSpent} - ₹{range.maxSpent || '∞'}: <strong>{range.points} bonus points</strong>
                  </p>
                ))}
                <p className="mt-2 font-medium">Example: If a customer spends ₹250, they get {settingsForm.pointsPerVisit} (visit) + {settingsForm.spendingRanges.find(r => 250 >= r.minSpent && (r.maxSpent === null || 250 <= r.maxSpent))?.points || 0} (spending) = {settingsForm.pointsPerVisit + (settingsForm.spendingRanges.find(r => 250 >= r.minSpent && (r.maxSpent === null || 250 <= r.maxSpent))?.points || 0)} total points!</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)} data-testid="button-cancel-settings">
              Cancel
            </Button>
            <Button onClick={() => updateSettingsMutation.mutate(settingsForm)} data-testid="button-save-settings">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
