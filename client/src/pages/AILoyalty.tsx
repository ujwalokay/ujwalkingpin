import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, Gift, Plus, Edit, Trash2, Star, AlertCircle, Eye, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { LoyaltyMember, LoyaltyEvent } from "@shared/schema";

interface User {
  id: string;
  username: string;
  role: string;
}

export default function AILoyalty() {
  const { toast } = useToast();
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; member?: LoyaltyMember }>({ open: false });
  const [formData, setFormData] = useState({
    customerName: "",
    whatsappNumber: "",
    tier: "bronze",
    points: 0,
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: members = [], isLoading } = useQuery<LoyaltyMember[]>({
    queryKey: ["/api/loyalty-members"],
  });

  const { data: events = [] } = useQuery<LoyaltyEvent[]>({
    queryKey: ["/api/loyalty-events"],
  });

  const isAdmin = currentUser?.role === "admin";
  const canEdit = isAdmin;

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/loyalty-members", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-members"] });
      setAddDialog(false);
      setFormData({ customerName: "", whatsappNumber: "", tier: "bronze", points: 0 });
      toast({
        title: "Success",
        description: "Loyalty member added successfully",
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PUT", `/api/loyalty-members/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-members"] });
      setEditDialog({ open: false });
      setFormData({ customerName: "", whatsappNumber: "", tier: "bronze", points: 0 });
      toast({
        title: "Success",
        description: "Loyalty member updated successfully",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/loyalty-members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-members"] });
      toast({
        title: "Success",
        description: "Loyalty member deleted successfully",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editDialog.member) {
      updateMutation.mutate({ id: editDialog.member.id, data: formData });
    }
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: "bg-orange-700",
      silver: "bg-gray-400 text-gray-900",
      gold: "bg-yellow-500 text-yellow-950",
      platinum: "bg-purple-600",
    };
    return (
      <Badge className={colors[tier] || "bg-gray-500"} data-testid={`badge-tier-${tier}`}>
        {tier.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Loyalty System</h1>
            <p className="text-muted-foreground">Manage customer loyalty program</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  const totalMembers = members.length;
  const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
  const tierBreakdown = members.reduce((acc, m) => {
    acc[m.tier] = (acc[m.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">AI Loyalty System</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage customer loyalty program" : "View loyalty program members"}
          </p>
        </div>
        {!canEdit && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>Read-Only Access</span>
          </div>
        )}
      </div>

      {!canEdit && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You have read-only access to the loyalty system. Only administrators can add, edit, or delete loyalty members.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-members">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-members">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">Active loyalty members</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-points">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-points">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">Points in circulation</p>
          </CardContent>
        </Card>

        <Card data-testid="card-gold-members">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gold Members</CardTitle>
            <Gift className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-gold-members">{tierBreakdown.gold || 0}</div>
            <p className="text-xs text-muted-foreground">Premium tier</p>
          </CardContent>
        </Card>

        <Card data-testid="card-platinum-members">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platinum Members</CardTitle>
            <Trophy className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-platinum-members">{tierBreakdown.platinum || 0}</div>
            <p className="text-xs text-muted-foreground">VIP tier</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-members-table">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Loyalty Members</CardTitle>
              <CardDescription>Manage your loyalty program members</CardDescription>
            </div>
            {canEdit && (
              <Dialog open={addDialog} onOpenChange={setAddDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-member">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Loyalty Member</DialogTitle>
                    <DialogDescription>Add a new member to the loyalty program</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        data-testid="input-customer-name"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                      <Input
                        id="whatsappNumber"
                        data-testid="input-whatsapp"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier">Tier</Label>
                      <Select
                        value={formData.tier}
                        onValueChange={(value) => setFormData({ ...formData, tier: value })}
                      >
                        <SelectTrigger data-testid="select-tier">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bronze">Bronze</SelectItem>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="points">Initial Points</Label>
                      <Input
                        id="points"
                        type="number"
                        data-testid="input-points"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" data-testid="button-submit" disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Adding..." : "Add Member"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Joined</TableHead>
                {canEdit && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 6 : 5} className="text-center text-muted-foreground">
                    No loyalty members yet. {canEdit && "Add your first member to get started!"}
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${member.id}`}>{member.customerName}</TableCell>
                    <TableCell data-testid={`text-whatsapp-${member.id}`}>{member.whatsappNumber}</TableCell>
                    <TableCell>{getTierBadge(member.tier)}</TableCell>
                    <TableCell data-testid={`text-points-${member.id}`}>{member.points}</TableCell>
                    <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-edit-${member.id}`}
                            onClick={() => {
                              setFormData({
                                customerName: member.customerName,
                                whatsappNumber: member.whatsappNumber,
                                tier: member.tier,
                                points: member.points,
                              });
                              setEditDialog({ open: true, member });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-delete-${member.id}`}
                            onClick={() => {
                              if (confirm(`Delete ${member.customerName}?`)) {
                                deleteMutation.mutate(member.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Loyalty Member</DialogTitle>
            <DialogDescription>Update member information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-customerName">Customer Name</Label>
              <Input
                id="edit-customerName"
                data-testid="input-edit-customer-name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-whatsappNumber">WhatsApp Number</Label>
              <Input
                id="edit-whatsappNumber"
                data-testid="input-edit-whatsapp"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tier">Tier</Label>
              <Select
                value={formData.tier}
                onValueChange={(value) => setFormData({ ...formData, tier: value })}
              >
                <SelectTrigger data-testid="select-edit-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-points">Points</Label>
              <Input
                id="edit-points"
                type="number"
                data-testid="input-edit-points"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              />
            </div>
            <DialogFooter>
              <Button type="submit" data-testid="button-update" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
