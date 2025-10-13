import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, ExternalLink, Calendar, Tag, Search, HardDrive, Sparkles, Zap } from "lucide-react";
import type { GameUpdate } from "@shared/schema";
import { format } from "date-fns";

const GAME_FILTERS = [
  { value: "all", label: "All Games" },
  { value: "Valorant", label: "Valorant" },
  { value: "CS:GO", label: "CS:GO / CS2" },
  { value: "Call of Duty", label: "Call of Duty" },
  { value: "FIFA", label: "FIFA / FC" },
  { value: "Mortal Kombat", label: "Mortal Kombat" },
  { value: "WWE", label: "WWE" },
  { value: "Marvel Rivals", label: "Marvel Rivals" },
  { value: "Fortnite", label: "Fortnite" },
  { value: "Apex Legends", label: "Apex Legends" },
  { value: "League of Legends", label: "League of Legends" }
];

const UPDATE_TYPE_COLORS: Record<string, string> = {
  "Patch": "bg-blue-500",
  "Event": "bg-purple-500",
  "Tournament": "bg-green-500",
  "News": "bg-orange-500",
  "Maintenance": "bg-red-500",
  "Release": "bg-yellow-500",
};

export default function GameUpdates() {
  const [selectedGame, setSelectedGame] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: updates, isLoading, refetch, isFetching } = useQuery<GameUpdate[]>({
    queryKey: selectedGame === "all" ? ['/api/game-updates'] : [`/api/game-updates?game=${selectedGame}`],
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    refetchIntervalInBackground: true, // Continue refetching when tab is not focused
  });

  // Filter updates by search query
  const filteredUpdates = (updates || []).filter((update) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      update.title.toLowerCase().includes(query) ||
      update.description.toLowerCase().includes(query) ||
      update.gameName.toLowerCase().includes(query) ||
      update.updateType.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading game updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="h-8 w-8 text-yellow-500 animate-pulse" />
              <Sparkles className="h-5 w-5 text-yellow-400 absolute -top-1 -right-1 animate-ping opacity-75" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-game-updates">
                Game Updates
              </h1>
              <p className="text-muted-foreground mt-1">
                Latest news, patches, and events for your favorite games
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger className="w-[180px]" data-testid="select-game-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GAME_FILTERS.map((game) => (
                  <SelectItem key={game.value} value={game.value}>
                    {game.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => refetch()} 
              disabled={isFetching}
              variant="outline"
              size="sm"
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search updates by game name, title, or update type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2"
              onClick={() => setSearchQuery("")}
              data-testid="button-clear-search"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Updates Grid */}
      {filteredUpdates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <Tag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Updates Available</h3>
              <p className="text-muted-foreground mb-4">
                {selectedGame === "all" 
                  ? "There are no game updates to display at the moment."
                  : `No updates found for ${GAME_FILTERS.find(g => g.value === selectedGame)?.label}.`
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Check back later or contact an admin to add game updates.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredUpdates.map((update) => (
            <Card 
              key={update.id} 
              className="hover:shadow-lg transition-all duration-300 overflow-hidden group"
              data-testid={`card-game-update-${update.id}`}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-muted">
                <img
                  src={update.imageUrl}
                  alt={update.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/400x300/1a1a1a/8b5cf6?text=" + encodeURIComponent(update.gameName);
                  }}
                  data-testid={`img-update-${update.id}`}
                />
                {/* Game Name Overlay */}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-black/70 text-white border-0" data-testid={`badge-game-${update.id}`}>
                    {update.gameName}
                  </Badge>
                </div>
                {/* Update Type Badge */}
                <div className="absolute top-2 right-2">
                  <Badge 
                    className={`${UPDATE_TYPE_COLORS[update.updateType] || "bg-gray-500"} text-white border-0`}
                    data-testid={`badge-type-${update.id}`}
                  >
                    {update.updateType}
                  </Badge>
                </div>
              </div>

              <CardHeader>
                <CardTitle className="line-clamp-2" data-testid={`text-title-${update.id}`}>
                  {update.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span data-testid={`text-date-${update.id}`}>
                    {format(new Date(update.publishedAt), "MMM dd, yyyy 'at' h:mm a")}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-description-${update.id}`}>
                  {update.description}
                </p>

                {/* Extract and display file size if available in description */}
                {update.description.match(/(\d+\.?\d*\s?(GB|MB|TB))/i) && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg" data-testid={`file-size-${update.id}`}>
                    <HardDrive className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Download: {update.description.match(/(\d+\.?\d*\s?(GB|MB|TB))/i)![0]}
                    </span>
                  </div>
                )}

                {update.sourceUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(update.sourceUrl!, '_blank')}
                    data-testid={`button-source-${update.id}`}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Read More
                  </Button>
                )}

                {update.source && (
                  <p className="text-xs text-muted-foreground text-center" data-testid={`text-source-${update.id}`}>
                    Source: {update.source}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      {filteredUpdates.length > 0 && (
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredUpdates.length}</span> {filteredUpdates.length === 1 ? 'update' : 'updates'}
                {selectedGame !== "all" && ` for ${GAME_FILTERS.find(g => g.value === selectedGame)?.label}`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
