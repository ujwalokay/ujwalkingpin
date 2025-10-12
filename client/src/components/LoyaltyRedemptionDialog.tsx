import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Award, Crown, Star, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LoyaltyMember {
  id: string;
  customerName: string;
  whatsappNumber: string;
  tier: string;
  points: number;
  totalSpent: string;
  visitCount: number;
}

interface LoyaltyConfig {
  pointsPerCurrency: number;
  currencySymbol: string;
  tierThresholds: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

interface LoyaltyRedemptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappNumber: string;
  customerName: string;
  totalAmount: number;
  onApplyDiscount?: (discountAmount: number, pointsUsed: number) => void;
}

export function LoyaltyRedemptionDialog({
  open,
  onOpenChange,
  whatsappNumber,
  customerName,
  totalAmount,
  onApplyDiscount,
}: LoyaltyRedemptionDialogProps) {
  const { toast } = useToast();
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  const { data: member, isLoading: memberLoading } = useQuery<LoyaltyMember>({
    queryKey: ["/api/loyalty/member", whatsappNumber],
    enabled: open && !!whatsappNumber,
    retry: false,
  });

  const { data: config } = useQuery<LoyaltyConfig>({
    queryKey: ["/api/loyalty/config"],
  });

  const redeemMutation = useMutation({
    mutationFn: async (points: number) => {
      return await apiRequest("POST", "/api/loyalty/redeem", {
        whatsappNumber,
        pointsToRedeem: points,
      });
    },
    onSuccess: (data: { discountAmount: number; remainingPoints: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/member", whatsappNumber] });
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/members"] });
      
      toast({
        title: "Points Redeemed!",
        description: `₹${data.discountAmount} discount applied. Remaining points: ${data.remainingPoints}`,
      });
      
      onApplyDiscount?.(data.discountAmount, pointsToRedeem);
      onOpenChange(false);
      setPointsToRedeem(0);
    },
    onError: (error: any) => {
      toast({
        title: "Redemption Failed",
        description: error.message || "Could not redeem points",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!open) {
      setPointsToRedeem(0);
    }
  }, [open]);

  const getTierIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "platinum":
        return <Crown className="h-5 w-5 text-purple-500" />;
      case "gold":
        return <Award className="h-5 w-5 text-yellow-500" />;
      case "silver":
        return <Star className="h-5 w-5 text-gray-400" />;
      default:
        return <TrendingUp className="h-5 w-5 text-orange-500" />;
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      platinum: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      silver: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      bronze: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    return (
      <Badge className={colors[tier?.toLowerCase() as keyof typeof colors] || colors.bronze}>
        {tier?.charAt(0).toUpperCase() + tier?.slice(1) || "Bronze"}
      </Badge>
    );
  };

  if (memberLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading Loyalty Info...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (!member) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Not a Loyalty Member</DialogTitle>
            <DialogDescription>
              {customerName} will be automatically enrolled in the loyalty program after 3 visits.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const currencySymbol = config?.currencySymbol || "₹";
  const pointsPerCurrency = config?.pointsPerCurrency || 1;
  const discountAmount = pointsToRedeem / pointsPerCurrency;
  const finalAmount = Math.max(0, totalAmount - discountAmount);
  const maxPointsForThisAmount = Math.min(member.points, Math.floor(totalAmount * pointsPerCurrency));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-loyalty-redemption">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTierIcon(member.tier)}
            Loyalty Rewards
          </DialogTitle>
          <DialogDescription>
            Redeem points for instant discount on this booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Info */}
          <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
            <div>
              <p className="font-semibold">{member.customerName}</p>
              <p className="text-sm text-muted-foreground">{member.whatsappNumber}</p>
            </div>
            {getTierBadge(member.tier)}
          </div>

          {/* Points Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Available Points</p>
              <p className="text-2xl font-bold text-primary">{member.points.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-secondary/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Visits</p>
              <p className="text-2xl font-bold">{member.visitCount}</p>
            </div>
          </div>

          {/* Redemption */}
          {member.points > 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="points">Points to Redeem</Label>
                <div className="flex gap-2">
                  <Input
                    id="points"
                    type="number"
                    min="0"
                    max={maxPointsForThisAmount}
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(Math.min(parseInt(e.target.value) || 0, maxPointsForThisAmount))}
                    placeholder="Enter points"
                    data-testid="input-points-to-redeem"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setPointsToRedeem(maxPointsForThisAmount)}
                    data-testid="button-use-max-points"
                  >
                    Use Max
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {pointsPerCurrency} point = {currencySymbol}1 discount (Max: {maxPointsForThisAmount} points for this booking)
                </p>
              </div>

              {/* Calculation Preview */}
              {pointsToRedeem > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Original Amount:</span>
                    <span>{currencySymbol}{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount ({pointsToRedeem} points):</span>
                    <span>- {currencySymbol}{discountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Final Amount:</span>
                    <span className="text-green-600 dark:text-green-400">{currencySymbol}{finalAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Remaining points after redemption: {member.points - pointsToRedeem}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {pointsToRedeem > 0 && (
            <Button
              onClick={() => redeemMutation.mutate(pointsToRedeem)}
              disabled={redeemMutation.isPending || pointsToRedeem === 0}
              data-testid="button-apply-discount"
            >
              {redeemMutation.isPending ? "Applying..." : `Apply Discount`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
