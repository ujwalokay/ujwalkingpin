import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Plus, Users, Calendar as CalendarIcon, DollarSign, Medal, Trash2, UserPlus, Award, Target, Gamepad2, Crown, Star, Image, X, Settings2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Checkbox } from "@/components/ui/checkbox";

const tournamentSchema = z.object({
  name: z.string().min(3, "Tournament name must be at least 3 characters"),
  game: z.string().min(1, "Game is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date().optional(),
  maxParticipants: z.string().min(1, "Max participants is required"),
  entryFee: z.string().default("0"),
  prizePool: z.string().optional(),
  status: z.string().default("upcoming"),
  rules: z.string().optional(),
  customFormFields: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(["text", "email", "tel", "number"]),
    required: z.boolean(),
  })).default([]),
  createdBy: z.string().default("admin"),
});

const participantSchema = z.object({
  playerName: z.string().min(1, "Player name is required"),
  playerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  playerPhone: z.string().optional(),
  customFields: z.record(z.string()).default({}),
  status: z.string().default("registered"),
});

interface Tournament {
  id: string;
  name: string;
  game: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  startDate: string;
  endDate: string | null;
  maxParticipants: number;
  entryFee: string;
  prizePool: string | null;
  status: string;
  rules: string | null;
  customFormFields: Array<{
    name: string;
    label: string;
    type: "text" | "email" | "tel" | "number";
    required: boolean;
  }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Participant {
  id: string;
  tournamentId: string;
  playerName: string;
  playerEmail: string | null;
  playerPhone: string | null;
  customFields: Record<string, string>;
  registeredAt: string;
  placement: number | null;
  score: string | null;
  status: string;
}

export default function Tournaments() {
  const { toast } = useToast();
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showParticipantDialog, setShowParticipantDialog] = useState(false);

  const { data: tournaments = [], isLoading } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments"],
  });

  const { data: participants = [] } = useQuery<Participant[]>({
    queryKey: ["/api/tournaments", selectedTournament?.id, "participants"],
    enabled: !!selectedTournament?.id,
  });

  const form = useForm<z.infer<typeof tournamentSchema>>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      game: "",
      category: "PC",
      description: "",
      imageUrl: "",
      startDate: new Date(),
      endDate: undefined,
      maxParticipants: "16",
      entryFee: "0",
      prizePool: "",
      status: "upcoming",
      rules: "",
      customFormFields: [],
      createdBy: "admin",
    },
  });

  const participantForm = useForm({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      playerName: "",
      playerEmail: "",
      playerPhone: "",
      customFields: {} as Record<string, string>,
      status: "registered",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof tournamentSchema>) => {
      return await apiRequest("POST", `/api/tournaments`, {
        ...data,
        maxParticipants: parseInt(data.maxParticipants),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Tournament Created",
        description: "Tournament has been created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tournament",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/tournaments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      toast({
        title: "Tournament Deleted",
        description: "Tournament has been deleted successfully",
      });
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: async (data: z.infer<typeof participantSchema>) => {
      return await apiRequest("POST", `/api/tournaments/${selectedTournament?.id}/participants`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", selectedTournament?.id, "participants"] });
      setShowParticipantDialog(false);
      participantForm.reset();
      toast({
        title: "Participant Added",
        description: "Player has been registered successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add participant",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const tournament = tournaments.find(t => t.id === id);
      if (!tournament) {
        throw new Error("Tournament not found");
      }
      return await apiRequest("PUT", `/api/tournaments/${id}`, {
        name: tournament.name,
        game: tournament.game,
        category: tournament.category,
        description: tournament.description || undefined,
        imageUrl: tournament.imageUrl || undefined,
        startDate: new Date(tournament.startDate),
        endDate: tournament.endDate ? new Date(tournament.endDate) : undefined,
        maxParticipants: tournament.maxParticipants,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool || undefined,
        rules: tournament.rules || undefined,
        customFormFields: tournament.customFormFields || [],
        status,
        createdBy: tournament.createdBy,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      toast({
        title: "Status Updated",
        description: "Tournament status updated successfully",
      });
    },
  });

  const declareWinnerMutation = useMutation({
    mutationFn: async ({ participantId, placement }: { participantId: string; placement: number }) => {
      return await apiRequest("PUT", `/api/tournaments/${selectedTournament?.id}/participants/${participantId}`, {
        placement,
        status: placement === 1 ? "winner" : "completed",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments", selectedTournament?.id, "participants"] });
      toast({
        title: "Winner Declared",
        description: "Placement updated successfully!",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof tournamentSchema>) => {
    createMutation.mutate(data);
  };

  const onParticipantSubmit = (data: z.infer<typeof participantSchema>) => {
    addParticipantMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-cyan-600 hover:bg-cyan-700">Upcoming</Badge>;
      case "ongoing":
        return <Badge className="bg-green-600 hover:bg-green-700">Ongoing</Badge>;
      case "completed":
        return <Badge className="bg-gray-600 hover:bg-gray-700">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const upcomingTournaments = tournaments.filter(t => t.status === "upcoming");
  const ongoingTournaments = tournaments.filter(t => t.status === "ongoing");
  const completedTournaments = tournaments.filter(t => t.status === "completed");

  const winners = participants.filter(p => p.placement && p.placement <= 3).sort((a, b) => (a.placement || 0) - (b.placement || 0));

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6" data-testid="page-tournaments">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Tournament Management
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Organize gaming competitions and track champions
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" data-testid="button-create-tournament">
              <Plus className="h-4 w-4" />
              Create Tournament
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Tournament</DialogTitle>
              <DialogDescription>Set up a new gaming competition</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tournament Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. FIFA 24 Championship" {...field} data-testid="input-tournament-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="game"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Game</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. FIFA 24" {...field} data-testid="input-game" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PC">PC</SelectItem>
                            <SelectItem value="PS5">PS5</SelectItem>
                            <SelectItem value="VR">VR</SelectItem>
                            <SelectItem value="Car Simulator">Car Simulator</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tournament details..." {...field} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tournament Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} data-testid="input-image-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <DateTimePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select start date and time"
                            data-testid="input-start-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <DateTimePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select end date and time"
                            data-testid="input-end-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Players</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="16" {...field} data-testid="input-max-participants" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Fee (₹)</FormLabel>
                        <FormControl>
                          <Input placeholder="0" {...field} data-testid="input-entry-fee" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prizePool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prize Pool (₹)</FormLabel>
                        <FormControl>
                          <Input placeholder="5000" {...field} data-testid="input-prize-pool" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="rules"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rules</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tournament rules and regulations..." {...field} data-testid="input-rules" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customFormFields"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Custom Registration Fields
                      </FormLabel>
                      <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
                        {field.value.map((customField, index) => (
                          <div key={index} className="flex gap-2 items-start bg-background p-3 rounded border">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <Input
                                placeholder="Field name"
                                value={customField.name}
                                onChange={(e) => {
                                  const updated = [...field.value];
                                  updated[index].name = e.target.value;
                                  field.onChange(updated);
                                }}
                                data-testid={`input-custom-field-name-${index}`}
                              />
                              <Input
                                placeholder="Field label"
                                value={customField.label}
                                onChange={(e) => {
                                  const updated = [...field.value];
                                  updated[index].label = e.target.value;
                                  field.onChange(updated);
                                }}
                                data-testid={`input-custom-field-label-${index}`}
                              />
                              <Select
                                value={customField.type}
                                onValueChange={(value: "text" | "email" | "tel" | "number") => {
                                  const updated = [...field.value];
                                  updated[index].type = value;
                                  field.onChange(updated);
                                }}
                              >
                                <SelectTrigger data-testid={`select-custom-field-type-${index}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="tel">Phone</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={customField.required}
                                onCheckedChange={(checked) => {
                                  const updated = [...field.value];
                                  updated[index].required = checked === true;
                                  field.onChange(updated);
                                }}
                                data-testid={`checkbox-custom-field-required-${index}`}
                              />
                              <span className="text-sm text-muted-foreground">Required</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const updated = field.value.filter((_, i) => i !== index);
                                  field.onChange(updated);
                                }}
                                data-testid={`button-remove-custom-field-${index}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            field.onChange([
                              ...field.value,
                              { name: "", label: "", type: "text" as const, required: false },
                            ]);
                          }}
                          className="w-full"
                          data-testid="button-add-custom-field"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Custom Field
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-tournament">
                  {createMutation.isPending ? "Creating..." : "Create Tournament"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournaments.length}</div>
          </CardContent>
        </Card>
        <Card className="border-cyan-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{upcomingTournaments.length}</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Ongoing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{ongoingTournaments.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({tournaments.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingTournaments.length})</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing ({ongoingTournaments.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTournaments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onSelect={() => setSelectedTournament(tournament)}
                onDelete={() => deleteMutation.mutate(tournament.id)}
                onStatusChange={(status) => updateStatusMutation.mutate({ id: tournament.id, status })}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onSelect={() => setSelectedTournament(tournament)}
                onDelete={() => deleteMutation.mutate(tournament.id)}
                onStatusChange={(status) => updateStatusMutation.mutate({ id: tournament.id, status })}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ongoing">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ongoingTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onSelect={() => setSelectedTournament(tournament)}
                onDelete={() => deleteMutation.mutate(tournament.id)}
                onStatusChange={(status) => updateStatusMutation.mutate({ id: tournament.id, status })}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                onSelect={() => setSelectedTournament(tournament)}
                onDelete={() => deleteMutation.mutate(tournament.id)}
                onStatusChange={(status) => updateStatusMutation.mutate({ id: tournament.id, status })}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedTournament && (
        <Dialog open={!!selectedTournament} onOpenChange={() => setSelectedTournament(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                {selectedTournament.name}
              </DialogTitle>
              <DialogDescription>
                {selectedTournament.game} • {selectedTournament.category}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[600px] w-full pr-4">
              <div className="space-y-6">
                {winners.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      Champions
                    </h3>
                    <div className="grid gap-2">
                      {winners.map((winner) => (
                        <Card key={winner.id} className={`${
                          winner.placement === 1 ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" :
                          winner.placement === 2 ? "border-gray-400 bg-gray-50 dark:bg-gray-950/20" :
                          "border-orange-600 bg-orange-50 dark:bg-orange-950/20"
                        }`}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {winner.placement === 1 && <Trophy className="h-6 w-6 text-yellow-500" />}
                              {winner.placement === 2 && <Medal className="h-6 w-6 text-gray-400" />}
                              {winner.placement === 3 && <Award className="h-6 w-6 text-orange-600" />}
                              <div>
                                <p className="font-semibold">{winner.playerName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {winner.placement === 1 ? "1st Place - Champion" :
                                   winner.placement === 2 ? "2nd Place - Runner-up" :
                                   "3rd Place"}
                                </p>
                              </div>
                            </div>
                            {winner.score && <Badge>{winner.score} pts</Badge>}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Participants ({participants.length}/{selectedTournament.maxParticipants})
                    </h3>
                    <Dialog open={showParticipantDialog} onOpenChange={setShowParticipantDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2" data-testid="button-add-participant">
                          <UserPlus className="h-4 w-4" />
                          Add Player
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Register Participant</DialogTitle>
                        </DialogHeader>
                        <Form {...participantForm}>
                          <form onSubmit={participantForm.handleSubmit(onParticipantSubmit)} className="space-y-4">
                            <FormField
                              control={participantForm.control}
                              name="playerName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Player Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} data-testid="input-player-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={participantForm.control}
                              name="playerEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email (Optional)</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="player@example.com" {...field} data-testid="input-player-email" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={participantForm.control}
                              name="playerPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="+91 1234567890" {...field} data-testid="input-player-phone" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {selectedTournament.customFormFields && selectedTournament.customFormFields.length > 0 && (
                              <div className="space-y-4 pt-2 border-t">
                                <p className="text-sm font-medium text-muted-foreground">Additional Information</p>
                                {selectedTournament.customFormFields.map((customField, index) => (
                                  <FormField
                                    key={customField.name}
                                    control={participantForm.control}
                                    name={`customFields.${customField.name}` as any}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>
                                          {customField.label}
                                          {customField.required && <span className="text-red-500 ml-1">*</span>}
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type={customField.type}
                                            placeholder={customField.label}
                                            {...field}
                                            value={participantForm.watch('customFields')?.[customField.name] || ''}
                                            onChange={(e) => {
                                              const currentCustomFields = participantForm.getValues('customFields') || {};
                                              participantForm.setValue('customFields', {
                                                ...currentCustomFields,
                                                [customField.name]: e.target.value
                                              });
                                            }}
                                            data-testid={`input-custom-${customField.name}`}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                            )}
                            
                            <Button type="submit" className="w-full" disabled={addParticipantMutation.isPending} data-testid="button-submit-participant">
                              {addParticipantMutation.isPending ? "Adding..." : "Add Participant"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-2">
                    {participants.map((participant, index) => (
                      <Card key={participant.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{participant.playerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {participant.playerEmail || participant.playerPhone || "No contact info"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedTournament.status === "ongoing" && !participant.placement && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" onClick={() => declareWinnerMutation.mutate({ participantId: participant.id, placement: 1 })} data-testid={`button-1st-${participant.id}`}>
                                  <Trophy className="h-3 w-3 text-yellow-500" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => declareWinnerMutation.mutate({ participantId: participant.id, placement: 2 })} data-testid={`button-2nd-${participant.id}`}>
                                  <Medal className="h-3 w-3 text-gray-400" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => declareWinnerMutation.mutate({ participantId: participant.id, placement: 3 })} data-testid={`button-3rd-${participant.id}`}>
                                  <Award className="h-3 w-3 text-orange-600" />
                                </Button>
                              </div>
                            )}
                            <Badge variant={participant.placement ? "default" : "outline"}>
                              {participant.placement ? `#${participant.placement}` : `#${index + 1}`}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TournamentCard({
  tournament,
  onSelect,
  onDelete,
  onStatusChange,
  getStatusBadge,
}: {
  tournament: Tournament;
  onSelect: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  return (
    <Card className="border-2 hover:border-cyan-500/50 transition-colors cursor-pointer" onClick={onSelect} data-testid={`card-tournament-${tournament.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-cyan-500" />
              {tournament.name}
            </CardTitle>
            <CardDescription className="mt-1">{tournament.game}</CardDescription>
          </div>
          {getStatusBadge(tournament.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span>{tournament.category}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{tournament.maxParticipants} max</span>
          </div>
        </div>
        
        {tournament.prizePool && (
          <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
            <Trophy className="h-4 w-4" />
            <span>₹{tournament.prizePool} Prize Pool</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span>{format(new Date(tournament.startDate), "MMM dd, yyyy 'at' hh:mm a")}</span>
        </div>

        {tournament.entryFee !== "0" && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>₹{tournament.entryFee} Entry Fee</span>
          </div>
        )}

        <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          {tournament.status === "upcoming" && (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onStatusChange("ongoing")} data-testid={`button-start-${tournament.id}`}>
              Start
            </Button>
          )}
          {tournament.status === "ongoing" && (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onStatusChange("completed")} data-testid={`button-complete-${tournament.id}`}>
              Complete
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={onDelete} data-testid={`button-delete-${tournament.id}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
