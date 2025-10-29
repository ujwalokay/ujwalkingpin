import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, X, Trash2, Calendar, TrendingDown, Gift, Users } from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DiscountPromotion, BonusHoursPromotion, PricingConfig } from "@shared/schema";

export function PromotionsManager() {
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    type: 'discount' | 'bonus';
    category: string;
    duration: string;
    price: number;
    personCount: number;
  } | null>(null);

  const { data: discountPromotions = [] } = useQuery<DiscountPromotion[]>({
    queryKey: ["/api/discount-promotions"],
  });

  const { data: bonusPromotions = [] } = useQuery<BonusHoursPromotion[]>({
    queryKey: ["/api/bonus-hours-promotions"],
  });

  const { data: pricingConfigs = [] } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing-config"],
  });

  const createDiscountMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/discount-promotions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discount-promotions"] });
      toast({
        title: "Discount Promotion Created",
        description: "The discount promotion has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create discount promotion",
        variant: "destructive",
      });
    },
  });

  const updateDiscountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/discount-promotions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discount-promotions"] });
      toast({
        title: "Promotion Updated",
        description: "The discount promotion has been updated.",
      });
    },
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/discount-promotions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discount-promotions"] });
      toast({
        title: "Promotion Deleted",
        description: "The discount promotion has been removed.",
      });
    },
  });

  const createBonusMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/bonus-hours-promotions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bonus-hours-promotions"] });
      toast({
        title: "Bonus Hours Promotion Created",
        description: "The bonus hours promotion has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bonus hours promotion",
        variant: "destructive",
      });
    },
  });

  const updateBonusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/bonus-hours-promotions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bonus-hours-promotions"] });
      toast({
        title: "Promotion Updated",
        description: "The bonus hours promotion has been updated.",
      });
    },
  });

  const deleteBonusMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/bonus-hours-promotions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bonus-hours-promotions"] });
      toast({
        title: "Promotion Deleted",
        description: "The bonus hours promotion has been removed.",
      });
    },
  });

  const handleAddPromotion = (
    type: 'discount' | 'bonus',
    category: string,
    duration: string,
    personCount: number
  ) => {
    const pricing = pricingConfigs.find(
      p => p.category === category && p.duration === duration && p.personCount === personCount
    );

    if (!pricing) {
      toast({
        title: "Error",
        description: "Pricing not found for this configuration",
        variant: "destructive",
      });
      return;
    }

    setPreviewData({
      type,
      category,
      duration,
      price: parseFloat(pricing.price),
      personCount,
    });
    setPreviewOpen(true);
  };

  const handleConfirmPromotion = (data: {
    discountPercentage?: number;
    bonusHours?: string;
    startDate: Date;
    endDate: Date;
  }) => {
    if (!previewData) return;

    if (previewData.type === 'discount' && data.discountPercentage) {
      createDiscountMutation.mutate({
        category: previewData.category,
        duration: previewData.duration,
        personCount: previewData.personCount,
        discountPercentage: data.discountPercentage,
        startDate: data.startDate,
        endDate: data.endDate,
        enabled: 1,
      });
    } else if (previewData.type === 'bonus' && data.bonusHours) {
      createBonusMutation.mutate({
        category: previewData.category,
        duration: previewData.duration,
        personCount: previewData.personCount,
        bonusHours: data.bonusHours,
        startDate: data.startDate,
        endDate: data.endDate,
        enabled: 1,
      });
    }
  };

  const handleDisablePromotion = (id: string, type: 'discount' | 'bonus') => {
    if (type === 'discount') {
      updateDiscountMutation.mutate({ id, data: { enabled: 0 } });
    } else {
      updateBonusMutation.mutate({ id, data: { enabled: 0 } });
    }
  };

  const handleDeletePromotion = (id: string, type: 'discount' | 'bonus') => {
    if (type === 'discount') {
      deleteDiscountMutation.mutate(id);
    } else {
      deleteBonusMutation.mutate(id);
    }
  };

  const getPromotionStatus = (startDate: Date, endDate: Date, enabled: number): {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    isExpired: boolean;
    isDisabled: boolean;
  } => {
    const now = new Date();
    if (enabled === 0) {
      return { label: "Disabled", variant: "secondary", isExpired: false, isDisabled: true };
    }
    if (isAfter(now, endDate)) {
      return { label: "Expired", variant: "destructive", isExpired: true, isDisabled: false };
    }
    if (isBefore(now, startDate)) {
      return { label: "Scheduled", variant: "outline", isExpired: false, isDisabled: false };
    }
    return { label: "Active", variant: "default", isExpired: false, isDisabled: false };
  };

  const groupedPricings = pricingConfigs.reduce((acc, config) => {
    const key = config.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(config);
    return acc;
  }, {} as Record<string, PricingConfig[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-yellow-500" />
        <h2 className="text-lg font-semibold sm:text-xl">Promotions Management</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(groupedPricings).map(([category, configs]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-lg font-semibold">{category}</h3>
            
            {configs.map((config) => {
              const existingDiscount = discountPromotions.find(
                p => p.category === category && p.duration === config.duration && p.personCount === config.personCount
              );
              const existingBonus = bonusPromotions.find(
                p => p.category === category && p.duration === config.duration && p.personCount === config.personCount
              );

              return (
                <Card key={`${category}-${config.duration}-${config.personCount}`} className="glass-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {config.duration}
                      {config.personCount > 1 && ` + ${config.personCount} person`}
                    </CardTitle>
                    <CardDescription className="text-lg font-bold text-primary">₹{config.price}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {existingDiscount ? (
                      <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-5 w-5 text-orange-600" />
                              <span className="font-semibold">{existingDiscount.discountPercentage}% Discount</span>
                            </div>
                            <Badge variant={getPromotionStatus(new Date(existingDiscount.startDate), new Date(existingDiscount.endDate), existingDiscount.enabled).variant}>
                              {getPromotionStatus(new Date(existingDiscount.startDate), new Date(existingDiscount.endDate), existingDiscount.enabled).label}
                            </Badge>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(existingDiscount.startDate), "PP")} - {format(new Date(existingDiscount.endDate), "PP")}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Used:</span>
                              <span className="font-semibold">{existingDiscount.usageCount} times</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Savings:</span>
                              <span className="font-semibold text-green-600">₹{existingDiscount.totalSavings}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {getPromotionStatus(new Date(existingDiscount.startDate), new Date(existingDiscount.endDate), existingDiscount.enabled).isExpired || 
                             getPromotionStatus(new Date(existingDiscount.startDate), new Date(existingDiscount.endDate), existingDiscount.enabled).isDisabled ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleDeletePromotion(existingDiscount.id, 'discount')}
                                data-testid="button-delete-discount"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleDisablePromotion(existingDiscount.id, 'discount')}
                                  data-testid="button-disable-discount"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Disable
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleDeletePromotion(existingDiscount.id, 'discount')}
                                  data-testid="button-delete-discount"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleAddPromotion('discount', category, config.duration, config.personCount)}
                        data-testid="button-add-discount"
                      >
                        <TrendingDown className="mr-2 h-4 w-4" />
                        Add Discount
                      </Button>
                    )}

                    {existingBonus ? (
                      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Gift className="h-5 w-5 text-green-600" />
                              <span className="font-semibold">+{existingBonus.bonusHours} Hours FREE</span>
                            </div>
                            <Badge variant={getPromotionStatus(new Date(existingBonus.startDate), new Date(existingBonus.endDate), existingBonus.enabled).variant}>
                              {getPromotionStatus(new Date(existingBonus.startDate), new Date(existingBonus.endDate), existingBonus.enabled).label}
                            </Badge>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(existingBonus.startDate), "PP")} - {format(new Date(existingBonus.endDate), "PP")}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Used:</span>
                              <span className="font-semibold">{existingBonus.usageCount} times</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Hours Given:</span>
                              <span className="font-semibold text-green-600">{existingBonus.totalHoursGiven} hours</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {getPromotionStatus(new Date(existingBonus.startDate), new Date(existingBonus.endDate), existingBonus.enabled).isExpired || 
                             getPromotionStatus(new Date(existingBonus.startDate), new Date(existingBonus.endDate), existingBonus.enabled).isDisabled ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleDeletePromotion(existingBonus.id, 'bonus')}
                                data-testid="button-delete-bonus"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleDisablePromotion(existingBonus.id, 'bonus')}
                                  data-testid="button-disable-bonus"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Disable
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleDeletePromotion(existingBonus.id, 'bonus')}
                                  data-testid="button-delete-bonus"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleAddPromotion('bonus', category, config.duration, config.personCount)}
                        data-testid="button-add-bonus"
                      >
                        <Gift className="mr-2 h-4 w-4" />
                        Add Bonus Hours
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
      </div>

      {previewData && (
        <PromotionPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          type={previewData.type}
          category={previewData.category}
          duration={previewData.duration}
          price={previewData.price}
          personCount={previewData.personCount}
          onConfirm={handleConfirmPromotion}
        />
      )}
    </div>
  );
}
