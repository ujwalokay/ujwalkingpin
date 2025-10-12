import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Award, Crown, Star, TrendingUp, Users, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

interface LoyaltyMember {
  id: string;
  customerName: string;
  whatsappNumber: string;
  tier: string;
  points: number;
  totalSpent: string;
  visitCount: number;
  lastVisit: string;
  createdAt: string;
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

export default function Loyalty() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configSettings, setConfigSettings] = useState<LoyaltyConfig>({
    pointsPerCurrency: 1,
    currencySymbol: "₹",
    tierThresholds: { bronze: 0, silver: 100, gold: 500, platinum: 1000 },
  });

  const { data: members = [], isLoading } = useQuery<LoyaltyMember[]>({
    queryKey: ["/api/loyalty/members"],
  });

  const { data: config } = useQuery<LoyaltyConfig>({
    queryKey: ["/api/loyalty/config"],
  });

  useEffect(() => {
    if (config) {
      setConfigSettings(config);
    }
  }, [config]);

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: LoyaltyConfig) => {
      const configWithBronze = {
        ...newConfig,
        tierThresholds: {
          ...newConfig.tierThresholds,
          bronze: 0,
        },
      };
      return await apiRequest("POST", "/api/loyalty/config", configWithBronze);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/config"] });
      toast({ title: "Success", description: "Loyalty settings updated successfully" });
      setShowConfigDialog(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update loyalty settings", variant: "destructive" });
    },
  });

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "platinum":
        return <Crown className="h-4 w-4 text-purple-500" />;
      case "gold":
        return <Award className="h-4 w-4 text-yellow-500" />;
      case "silver":
        return <Star className="h-4 w-4 text-gray-400" />;
      default:
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
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
      <Badge className={colors[tier.toLowerCase() as keyof typeof colors] || colors.bronze}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const totalMembers = members.length;
  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
  const avgPoints = totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0;
  const tierCounts = members.reduce((acc, m) => {
    acc[m.tier] = (acc[m.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-loyalty">Loyalty Program</h1>
          <p className="text-muted-foreground mt-2">Manage loyalty members and rewards</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowConfigDialog(true)} data-testid="button-loyalty-settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Auto-enrolled after 3 visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {avgPoints} per member
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platinum Members</CardTitle>
            <Crown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tierCounts.platinum || 0}</div>
            <p className="text-xs text-muted-foreground">
              {config?.tierThresholds.platinum || 1000}+ points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gold Members</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tierCounts.gold || 0}</div>
            <p className="text-xs text-muted-foreground">
              {config?.tierThresholds.gold || 500}+ points
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Members</CardTitle>
          <CardDescription>
            All customers enrolled in the loyalty program
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No loyalty members yet. Customers are auto-enrolled after 3 visits.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead>Last Visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                      <TableCell className="font-medium">{member.customerName}</TableCell>
                      <TableCell>{member.whatsappNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTierIcon(member.tier)}
                          {getTierBadge(member.tier)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {member.points.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {config?.currencySymbol || "₹"}{parseFloat(member.totalSpent).toFixed(0)}
                      </TableCell>
                      <TableCell className="text-right">{member.visitCount}</TableCell>
                      <TableCell>
                        {member.lastVisit ? new Date(member.lastVisit).toLocaleDateString() : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-loyalty-config">
          <DialogHeader>
            <DialogTitle>Loyalty Program Settings</DialogTitle>
            <DialogDescription>
              Configure points earning and tier thresholds
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pointsPerCurrency">Points per {configSettings.currencySymbol}1 Spent</Label>
              <Input
                id="pointsPerCurrency"
                type="number"
                min="0.1"
                step="0.1"
                value={configSettings.pointsPerCurrency}
                onChange={(e) => setConfigSettings({
                  ...configSettings,
                  pointsPerCurrency: parseFloat(e.target.value) || 1,
                })}
                data-testid="input-points-per-currency"
              />
              <p className="text-xs text-muted-foreground">
                Customer earns this many points for every {configSettings.currencySymbol}1 spent
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currencySymbol">Currency Symbol</Label>
              <Input
                id="currencySymbol"
                value={configSettings.currencySymbol}
                onChange={(e) => setConfigSettings({
                  ...configSettings,
                  currencySymbol: e.target.value || "₹",
                })}
                placeholder="₹"
                data-testid="input-currency-symbol"
              />
            </div>

            <div className="space-y-2">
              <Label>Tier Thresholds (Points Required)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="silver" className="text-sm text-muted-foreground">Silver</Label>
                  <Input
                    id="silver"
                    type="number"
                    min="0"
                    value={configSettings.tierThresholds.silver}
                    onChange={(e) => setConfigSettings({
                      ...configSettings,
                      tierThresholds: {
                        ...configSettings.tierThresholds,
                        silver: parseInt(e.target.value) || 100,
                      },
                    })}
                    data-testid="input-silver-threshold"
                  />
                </div>
                <div>
                  <Label htmlFor="gold" className="text-sm text-muted-foreground">Gold</Label>
                  <Input
                    id="gold"
                    type="number"
                    min="0"
                    value={configSettings.tierThresholds.gold}
                    onChange={(e) => setConfigSettings({
                      ...configSettings,
                      tierThresholds: {
                        ...configSettings.tierThresholds,
                        gold: parseInt(e.target.value) || 500,
                      },
                    })}
                    data-testid="input-gold-threshold"
                  />
                </div>
                <div>
                  <Label htmlFor="platinum" className="text-sm text-muted-foreground">Platinum</Label>
                  <Input
                    id="platinum"
                    type="number"
                    min="0"
                    value={configSettings.tierThresholds.platinum}
                    onChange={(e) => setConfigSettings({
                      ...configSettings,
                      tierThresholds: {
                        ...configSettings.tierThresholds,
                        platinum: parseInt(e.target.value) || 1000,
                      },
                    })}
                    data-testid="input-platinum-threshold"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Bronze tier starts at 0 points
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateConfigMutation.mutate(configSettings)}
              disabled={updateConfigMutation.isPending}
              data-testid="button-save-config"
            >
              {updateConfigMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
