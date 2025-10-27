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
import { Award, Gift, Trash2, Edit, Plus, Users, Star, ShoppingCart } from "lucide-react";
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
    minSpent: "0",
    maxSpent: "" as string,
    pointsPerValue: 1,
    cardPointsRequired: 0,
    enabled: 1,
  });

  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLoyalty | null>(null);
  const [selectedRewardForRedemption, setSelectedRewardForRedemption] = useState<string>("");

  const { data: customers = [] } = useQuery<CustomerLoyalty[]>({
    queryKey: ["/api/customer-loyalty"],
  });

  const { data: rewards = [] } = useQuery<LoyaltyReward[]>({
    queryKey: ["/api/loyalty-rewards"],
  });

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
      toast({
        title: "Error",
        description: error.message || "Failed to create reward",
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

  const resetRewardForm = () => {
    setRewardForm({
      name: "",
      description: "",
      cardType: "bronze",
      rewardType: "discount",
      value: "",
      minSpent: "0",
      maxSpent: "",
      pointsPerValue: 1,
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
      minSpent: reward.minSpent || "0",
      maxSpent: reward.maxSpent || "",
      pointsPerValue: reward.pointsPerValue || 1,
      cardPointsRequired: reward.cardPointsRequired || 0,
      enabled: reward.enabled,
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

  const stats = {
    totalCustomers: customers.length,
    totalPointsEarned: customers.reduce((sum, c) => sum + (c.pointsEarned || 0), 0),
    activeRewards: rewards.filter(r => r.enabled).length,
    totalRedemptions: customers.reduce((sum, c) => sum + (c.pointsEarned - c.pointsAvailable || 0), 0),
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
          <Card className="glass-card" data-testid="card-total-points">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Total Points Earned</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-600" />
                {stats.totalPointsEarned}
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
          <Card className="glass-card" data-testid="card-total-redemptions">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Points Redeemed</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-green-600" />
                {stats.totalRedemptions}
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
                              <span className="font-semibold text-gray-900 dark:text-white">₹{reward.value}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Point Cost:</span>
                              <span className="font-bold text-purple-600">{reward.pointCost} pts</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Spend Range:</span>
                              <span className="text-xs font-medium">₹{reward.minSpent || '0'} - {reward.maxSpent || '∞'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Points/Value:</span>
                              <span className="text-xs font-medium">{reward.pointsPerValue || 1} pts</span>
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
                            <div className="ml-4">
                              <Button 
                                onClick={() => handleRedeemRewards(customer)}
                                disabled={customer.pointsAvailable === 0 || activeRewardsForRedemption.length === 0}
                                data-testid={`button-redeem-${customer.whatsappNumber}`}
                              >
                                <Gift className="mr-2 h-4 w-4" />
                                Redeem
                              </Button>
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
              <Label htmlFor="rewardValue">Reward Value (₹ or %)</Label>
              <Input
                id="rewardValue"
                value={rewardForm.value}
                onChange={(e) => setRewardForm({ ...rewardForm, value: e.target.value })}
                placeholder="e.g., 50 for ₹50 discount or 10 for 10% off"
                data-testid="input-reward-monetary-value"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minSpent">Min Spent (₹)</Label>
                <Input
                  id="minSpent"
                  value={rewardForm.minSpent}
                  onChange={(e) => setRewardForm({ ...rewardForm, minSpent: e.target.value })}
                  placeholder="e.g., 0"
                  data-testid="input-min-spent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSpent">Max Spent (₹)</Label>
                <Input
                  id="maxSpent"
                  value={rewardForm.maxSpent}
                  onChange={(e) => setRewardForm({ ...rewardForm, maxSpent: e.target.value })}
                  placeholder="e.g., 499 (optional)"
                  data-testid="input-max-spent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointsPerValue">Points Per Value</Label>
              <Input
                id="pointsPerValue"
                type="number"
                min="1"
                value={rewardForm.pointsPerValue}
                onChange={(e) => setRewardForm({ ...rewardForm, pointsPerValue: parseInt(e.target.value) || 1 })}
                placeholder="e.g., 2 (earn 2 points per ₹100 spent)"
                data-testid="input-points-per-value"
              />
              <p className="text-xs text-gray-500">How many points earned per spending range</p>
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
    </div>
  );
}
