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
import { Award, Gift, Trash2, Edit, Plus, DollarSign, Clock, Percent, Users, Trophy, Star, CreditCard, Settings } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { LoyaltyTier, CustomerLoyalty, LoyaltyReward, PointEarningRule, TierCardClaim } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

export default function LoyaltyRewards() {
  const { toast } = useToast();
  
  const [pointRuleDialogOpen, setPointRuleDialogOpen] = useState(false);
  const [editingPointRule, setEditingPointRule] = useState<PointEarningRule | null>(null);
  const [pointRuleForm, setPointRuleForm] = useState({
    ruleName: "",
    pointsPerRupee: 1,
    minSpendAmount: 0,
    isActive: 1,
  });

  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [tierForm, setTierForm] = useState({
    tierName: "",
    tierLevel: 1,
    pointCost: 100,
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

  const [tierClaimDialogOpen, setTierClaimDialogOpen] = useState(false);
  const [selectedTierForClaim, setSelectedTierForClaim] = useState<LoyaltyTier | null>(null);
  const [claimCustomerNumber, setClaimCustomerNumber] = useState("");

  const { data: pointRules = [] } = useQuery<PointEarningRule[]>({
    queryKey: ["/api/point-earning-rules"],
  });

  const { data: tiers = [] } = useQuery<LoyaltyTier[]>({
    queryKey: ["/api/loyalty-tiers"],
  });

  const { data: customers = [] } = useQuery<CustomerLoyalty[]>({
    queryKey: ["/api/customer-loyalty"],
  });

  const { data: rewards = [] } = useQuery<LoyaltyReward[]>({
    queryKey: ["/api/loyalty-rewards"],
  });

  const { data: tierClaims = [] } = useQuery<TierCardClaim[]>({
    queryKey: ["/api/tier-card-claims"],
  });

  const createPointRuleMutation = useMutation({
    mutationFn: async (data: typeof pointRuleForm) => {
      return await apiRequest("POST", "/api/point-earning-rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/point-earning-rules"] });
      toast({
        title: "Point Rule Created",
        description: "Point earning rule has been created successfully.",
      });
      resetPointRuleForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create point rule",
        variant: "destructive",
      });
    },
  });

  const updatePointRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof pointRuleForm> }) => {
      return await apiRequest("PATCH", `/api/point-earning-rules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/point-earning-rules"] });
      toast({
        title: "Point Rule Updated",
        description: "Point earning rule has been updated successfully.",
      });
      resetPointRuleForm();
    },
  });

  const deletePointRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/point-earning-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/point-earning-rules"] });
      toast({
        title: "Point Rule Deleted",
        description: "Point earning rule has been removed.",
      });
    },
  });

  const createTierMutation = useMutation({
    mutationFn: async (data: typeof tierForm) => {
      return await apiRequest("POST", "/api/loyalty-tiers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-tiers"] });
      toast({
        title: "Tier Card Created",
        description: "Tier card has been created successfully.",
      });
      resetTierForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tier card",
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
        title: "Tier Card Updated",
        description: "Tier card has been updated successfully.",
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
        title: "Tier Card Deleted",
        description: "Tier card has been removed.",
      });
    },
  });

  const claimTierCardMutation = useMutation({
    mutationFn: async (data: { whatsappNumber: string; tierId: string }) => {
      return await apiRequest("POST", "/api/tier-card-claims", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-loyalty"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tier-card-claims"] });
      toast({
        title: "Tier Card Claimed!",
        description: `Successfully claimed tier card. Remaining points: ${data.remainingPoints}`,
      });
      setTierClaimDialogOpen(false);
      setSelectedTierForClaim(null);
      setClaimCustomerNumber("");
    },
    onError: (error: any) => {
      toast({
        title: "Claim Failed",
        description: error.message || "Failed to claim tier card",
        variant: "destructive",
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

  const resetPointRuleForm = () => {
    setPointRuleForm({
      ruleName: "",
      pointsPerRupee: 1,
      minSpendAmount: 0,
      isActive: 1,
    });
    setEditingPointRule(null);
    setPointRuleDialogOpen(false);
  };

  const handleAddPointRule = () => {
    setEditingPointRule(null);
    setPointRuleDialogOpen(true);
  };

  const handleEditPointRule = (rule: PointEarningRule) => {
    setEditingPointRule(rule);
    setPointRuleForm({
      ruleName: rule.ruleName,
      pointsPerRupee: rule.pointsPerRupee,
      minSpendAmount: rule.minSpendAmount || 0,
      isActive: rule.isActive,
    });
    setPointRuleDialogOpen(true);
  };

  const handleSavePointRule = () => {
    if (editingPointRule) {
      updatePointRuleMutation.mutate({ id: editingPointRule.id, data: pointRuleForm });
    } else {
      createPointRuleMutation.mutate(pointRuleForm);
    }
  };

  const handleDeletePointRule = (id: string) => {
    if (confirm("Are you sure you want to delete this point rule? This cannot be undone.")) {
      deletePointRuleMutation.mutate(id);
    }
  };

  const resetTierForm = () => {
    setTierForm({
      tierName: "",
      tierLevel: 1,
      pointCost: 100,
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
      pointCost: tier.pointCost,
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
    if (confirm("Are you sure you want to delete this tier card? This cannot be undone.")) {
      deleteTierMutation.mutate(id);
    }
  };

  const handleClaimTierCard = (tier: LoyaltyTier) => {
    setSelectedTierForClaim(tier);
    setTierClaimDialogOpen(true);
  };

  const handleConfirmTierClaim = () => {
    if (!selectedTierForClaim || !claimCustomerNumber) {
      toast({
        title: "Error",
        description: "Please enter a customer WhatsApp number",
        variant: "destructive",
      });
      return;
    }
    
    claimTierCardMutation.mutate({
      whatsappNumber: claimCustomerNumber,
      tierId: selectedTierForClaim.id,
    });
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
    totalTierCardsClaimed: customers.reduce((sum, c) => sum + (c.tierCardsClaimed || 0), 0),
    totalPointsEarned: customers.reduce((sum, c) => sum + (c.pointsEarned || 0), 0),
    activeRewards: rewards.filter(r => r.enabled).length,
    activePointRules: pointRules.filter(r => r.isActive).length,
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
              Manage point-based tier cards and track customer rewards
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
              <CardDescription className="text-xs">Active Tier Cards</CardDescription>
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
          <Card className="glass-card" data-testid="card-tier-cards-claimed">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Tier Cards Claimed</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-green-600" />
                {stats.totalTierCardsClaimed}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="point-rules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
            <TabsTrigger value="point-rules" data-testid="tab-point-rules">Point Rules</TabsTrigger>
            <TabsTrigger value="tier-cards" data-testid="tab-tier-cards">Tier Cards</TabsTrigger>
            <TabsTrigger value="rewards" data-testid="tab-rewards">Rewards</TabsTrigger>
            <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="point-rules" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Point Earning Rules</CardTitle>
                    <CardDescription>
                      Configure how customers earn points from spending
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddPointRule} data-testid="button-add-point-rule">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pointRules.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No point earning rules configured yet. Create your first rule to get started!
                    </div>
                  ) : (
                    pointRules.map((rule) => (
                      <Card key={rule.id} className="relative overflow-hidden" data-testid={`point-rule-card-${rule.id}`}>
                        <div
                          className={`absolute top-0 left-0 right-0 h-1 ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                        />
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Settings className="h-5 w-5 text-blue-600" />
                              <CardTitle className="text-lg">{rule.ruleName}</CardTitle>
                            </div>
                            <Badge variant={rule.isActive ? "default" : "secondary"}>
                              {rule.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                Points per ₹: <span className="font-semibold text-gray-900 dark:text-white">
                                  {rule.pointsPerRupee}
                                </span>
                              </span>
                            </div>
                            {rule.minSpendAmount > 0 && (
                              <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  Min Spend: <span className="font-semibold text-gray-900 dark:text-white">
                                    ₹{rule.minSpendAmount}
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEditPointRule(rule)}
                              data-testid={`button-edit-point-rule-${rule.id}`}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDeletePointRule(rule.id)}
                              data-testid={`button-delete-point-rule-${rule.id}`}
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

          <TabsContent value="tier-cards" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tier Cards</CardTitle>
                    <CardDescription>
                      Manage claimable tier cards (Bronze, Silver, Gold, Platinum)
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddTier} data-testid="button-add-tier-card">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tier Card
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tiers.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No tier cards configured yet. Create your first tier card to get started!
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
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                Point Cost: <span className="font-semibold text-purple-600 dark:text-purple-400">
                                  {tier.pointCost} pts
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {getRewardIcon(tier.rewardType)}
                              <span className="text-gray-600 dark:text-gray-400">
                                Reward: <span className="font-semibold text-gray-900 dark:text-white">
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
                          <div className="flex gap-2 pt-2 flex-wrap">
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleClaimTierCard(tier)}
                              data-testid={`button-claim-tier-${tier.id}`}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Claim
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTier(tier)}
                              data-testid={`button-edit-tier-${tier.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteTier(tier.id)}
                              data-testid={`button-delete-tier-${tier.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
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
                  View customer points and tier card claims
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
                      const customerClaims = tierClaims.filter(c => c.whatsappNumber === customer.whatsappNumber);
                      return (
                        <Card key={customer.id} className="border-l-4 border-l-purple-500" data-testid={`customer-card-${customer.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{customer.customerName}</h3>
                                  {customer.tierCardsClaimed > 0 && (
                                    <Badge className="bg-purple-600">
                                      <Trophy className="mr-1 h-3 w-3" />
                                      {customer.tierCardsClaimed} Card{customer.tierCardsClaimed !== 1 ? 's' : ''}
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
                                <div className="text-sm text-gray-600 dark:text-gray-400">Tier Cards</div>
                                <div className="text-lg font-semibold">{customer.tierCardsClaimed}</div>
                              </div>
                            </div>
                            {customerClaims.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Claimed Tier Cards:</div>
                                <div className="flex flex-wrap gap-2">
                                  {customerClaims.map((claim) => (
                                    <Badge key={claim.id} variant="outline" className="text-xs">
                                      {claim.tierName} ({claim.pointsDeducted} pts)
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
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

      <Dialog open={pointRuleDialogOpen} onOpenChange={setPointRuleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-point-rule-form">
          <DialogHeader>
            <DialogTitle>{editingPointRule ? "Edit Point Rule" : "Create Point Rule"}</DialogTitle>
            <DialogDescription>
              Configure how customers earn points from spending
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ruleName">Rule Name</Label>
              <Input
                id="ruleName"
                value={pointRuleForm.ruleName}
                onChange={(e) => setPointRuleForm({ ...pointRuleForm, ruleName: e.target.value })}
                placeholder="e.g., Standard Points"
                data-testid="input-rule-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pointsPerRupee">Points per Rupee</Label>
              <Input
                id="pointsPerRupee"
                type="number"
                step="0.1"
                min="0"
                value={pointRuleForm.pointsPerRupee}
                onChange={(e) => setPointRuleForm({ ...pointRuleForm, pointsPerRupee: parseFloat(e.target.value) || 0 })}
                data-testid="input-points-per-rupee"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minSpendAmount">Minimum Spend Amount (₹)</Label>
              <Input
                id="minSpendAmount"
                type="number"
                min="0"
                value={pointRuleForm.minSpendAmount}
                onChange={(e) => setPointRuleForm({ ...pointRuleForm, minSpendAmount: parseInt(e.target.value) || 0 })}
                data-testid="input-min-spend"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select
                value={pointRuleForm.isActive.toString()}
                onValueChange={(value) => setPointRuleForm({ ...pointRuleForm, isActive: parseInt(value) as 0 | 1 })}
              >
                <SelectTrigger data-testid="select-rule-status">
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
            <Button variant="outline" onClick={resetPointRuleForm} data-testid="button-cancel-point-rule">
              Cancel
            </Button>
            <Button onClick={handleSavePointRule} data-testid="button-save-point-rule">
              {editingPointRule ? "Update" : "Create"} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-tier-form">
          <DialogHeader>
            <DialogTitle>{editingTier ? "Edit Tier Card" : "Create Tier Card"}</DialogTitle>
            <DialogDescription>
              Configure tier card point cost and rewards
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tierName">Tier Name</Label>
              <Input
                id="tierName"
                value={tierForm.tierName}
                onChange={(e) => setTierForm({ ...tierForm, tierName: e.target.value })}
                placeholder="e.g., Bronze, Silver, Gold, Platinum"
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
            <div className="space-y-2">
              <Label htmlFor="pointCost">Point Cost</Label>
              <Input
                id="pointCost"
                type="number"
                min="0"
                value={tierForm.pointCost}
                onChange={(e) => setTierForm({ ...tierForm, pointCost: parseInt(e.target.value) || 0 })}
                data-testid="input-point-cost"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tierColor">Tier Color</Label>
              <Input
                id="tierColor"
                type="color"
                value={tierForm.tierColor}
                onChange={(e) => setTierForm({ ...tierForm, tierColor: e.target.value })}
                data-testid="input-tier-color"
              />
            </div>
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
                  <SelectItem value="cashback">Cashback ₹</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rewardValue">Reward Value</Label>
              <Input
                id="rewardValue"
                value={tierForm.rewardValue}
                onChange={(e) => setTierForm({ ...tierForm, rewardValue: e.target.value })}
                placeholder={tierForm.rewardType === "free_hours" ? "e.g., 2" : tierForm.rewardType === "discount" ? "e.g., 10" : "e.g., 100"}
                data-testid="input-reward-value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={tierForm.description}
                onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })}
                placeholder="Describe the tier card benefits..."
                data-testid="input-tier-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enabled">Status</Label>
              <Select
                value={tierForm.enabled.toString()}
                onValueChange={(value) => setTierForm({ ...tierForm, enabled: parseInt(value) as 0 | 1 })}
              >
                <SelectTrigger data-testid="select-tier-status">
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
            <Button variant="outline" onClick={resetTierForm} data-testid="button-cancel-tier">
              Cancel
            </Button>
            <Button onClick={handleSaveTier} data-testid="button-save-tier">
              {editingTier ? "Update" : "Create"} Tier Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tierClaimDialogOpen} onOpenChange={setTierClaimDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-tier-claim">
          <DialogHeader>
            <DialogTitle>Claim Tier Card</DialogTitle>
            <DialogDescription>
              Enter customer WhatsApp number to claim {selectedTierForClaim?.tierName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedTierForClaim && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" style={{ color: selectedTierForClaim.tierColor }} />
                  <span className="font-semibold text-lg">{selectedTierForClaim.tierName}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Point Cost: <span className="font-bold text-purple-600">{selectedTierForClaim.pointCost} pts</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Reward: <span className="font-semibold">{getRewardLabel(selectedTierForClaim.rewardType, selectedTierForClaim.rewardValue)}</span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="claimWhatsappNumber">Customer WhatsApp Number</Label>
              <Input
                id="claimWhatsappNumber"
                value={claimCustomerNumber}
                onChange={(e) => setClaimCustomerNumber(e.target.value)}
                placeholder="Enter WhatsApp number"
                data-testid="input-claim-whatsapp"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setTierClaimDialogOpen(false);
                setSelectedTierForClaim(null);
                setClaimCustomerNumber("");
              }} 
              data-testid="button-cancel-claim"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmTierClaim} data-testid="button-confirm-claim">
              Confirm Claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-reward-form">
          <DialogHeader>
            <DialogTitle>{editingReward ? "Edit Reward" : "Create New Reward"}</DialogTitle>
            <DialogDescription>
              Configure reward details and point cost
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Label htmlFor="rewardPointCost">Point Cost</Label>
              <Input
                id="rewardPointCost"
                type="number"
                min="0"
                value={rewardForm.pointCost}
                onChange={(e) => setRewardForm({ ...rewardForm, pointCost: parseInt(e.target.value) || 0 })}
                data-testid="input-reward-point-cost"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rewardCategory">Category</Label>
              <Input
                id="rewardCategory"
                value={rewardForm.category}
                onChange={(e) => setRewardForm({ ...rewardForm, category: e.target.value })}
                placeholder="e.g., gaming, food, merchandise"
                data-testid="input-reward-category"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rewardValue">Value (₹)</Label>
              <Input
                id="rewardValue"
                value={rewardForm.value}
                onChange={(e) => setRewardForm({ ...rewardForm, value: e.target.value })}
                placeholder="e.g., 50"
                data-testid="input-reward-monetary-value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rewardStock">Stock (Optional)</Label>
              <Input
                id="rewardStock"
                type="number"
                min="0"
                value={rewardForm.stock || ""}
                onChange={(e) => setRewardForm({ ...rewardForm, stock: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Leave empty for unlimited"
                data-testid="input-reward-stock"
              />
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
