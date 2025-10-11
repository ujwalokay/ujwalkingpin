import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Monitor } from "lucide-react";
import type { Game } from "@shared/schema";

interface Availability {
  category: string;
  total: number;
  available: number;
  occupied: number;
  percentage: number;
}

interface PricingConfig {
  id: string;
  category: string;
  duration: string;
  price: string;
}

export default function ConsumerGames() {
  const { data: games, isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/consumer/games"],
  });

  const { data: availability, isLoading: availabilityLoading } = useQuery<Availability[]>({
    queryKey: ["/api/consumer/availability"],
    refetchInterval: 5000,
  });

  const { data: pricing, isLoading: pricingLoading } = useQuery<PricingConfig[]>({
    queryKey: ["/api/consumer/pricing"],
  });

  if (gamesLoading || availabilityLoading || pricingLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const pcGames = games?.filter((g) => g.category === "PC") || [];
  const ps5Games = games?.filter((g) => g.category === "PS5") || [];
  const pcAvailability = availability?.find((a) => a.category === "PC");
  const ps5Availability = availability?.find((a) => a.category === "PS5");
  const pcPricing = pricing?.filter((p) => p.category === "PC") || [];
  const ps5Pricing = pricing?.filter((p) => p.category === "PS5") || [];

  const renderAvailabilityCard = (categoryAvailability: Availability | undefined, categoryPricing: PricingConfig[]) => (
    <Card className="mb-6" data-testid={`card-availability-${categoryAvailability?.category.toLowerCase()}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {categoryAvailability?.category === "PC" ? (
              <Monitor className="h-5 w-5" />
            ) : (
              <Gamepad2 className="h-5 w-5" />
            )}
            <span>Real-Time Availability</span>
          </div>
          {categoryAvailability && (
            <Badge 
              variant={categoryAvailability.available > 0 ? "default" : "destructive"}
              data-testid={`badge-${categoryAvailability.category.toLowerCase()}-status`}
            >
              {categoryAvailability.available}/{categoryAvailability.total} Available
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoryAvailability && (
          <div className="space-y-2">
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  categoryAvailability.percentage > 50
                    ? "bg-green-500"
                    : categoryAvailability.percentage > 20
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${categoryAvailability.percentage}%` }}
                data-testid={`progress-${categoryAvailability.category.toLowerCase()}`}
              />
            </div>
            <p className="text-sm text-muted-foreground" data-testid={`text-${categoryAvailability.category.toLowerCase()}-percentage`}>
              {categoryAvailability.percentage}% capacity available
            </p>
          </div>
        )}
        
        {categoryPricing.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3">Pricing</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categoryPricing.map((price) => (
                <div key={price.id} className="p-3 rounded-lg bg-muted" data-testid={`pricing-${price.category.toLowerCase()}-${price.duration}`}>
                  <p className="text-sm font-medium">{price.duration}</p>
                  <p className="text-lg font-bold text-primary">₹{price.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderGamesList = (gamesList: Game[], categoryName: string) => {
    if (gamesList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gamepad2 className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No {categoryName} games listed yet</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gamesList.map((game) => (
          <Card key={game.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`game-${game.id}`}>
            <CardContent className="p-0">
              {game.imageUrl && (
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={game.imageUrl}
                    alt={game.name}
                    className="object-cover w-full h-full"
                    data-testid={`img-${game.id}`}
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1" data-testid={`text-name-${game.id}`}>{game.name}</h3>
                {game.description && (
                  <p className="text-sm text-muted-foreground" data-testid={`text-description-${game.id}`}>
                    {game.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold" data-testid="heading-games">Games Library</h1>
      <p className="text-lg text-muted-foreground">Explore our collection of games and check real-time availability</p>
      
      <Tabs defaultValue="pc" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2" data-testid="tabs-list">
          <TabsTrigger value="pc" data-testid="tab-pc">
            <Monitor className="h-4 w-4 mr-2" />
            PC Gaming
          </TabsTrigger>
          <TabsTrigger value="ps5" data-testid="tab-ps5">
            <Gamepad2 className="h-4 w-4 mr-2" />
            PS5 Gaming
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pc" className="space-y-6 mt-6">
          {renderAvailabilityCard(pcAvailability, pcPricing)}
          {renderGamesList(pcGames, "PC")}
        </TabsContent>
        
        <TabsContent value="ps5" className="space-y-6 mt-6">
          {renderAvailabilityCard(ps5Availability, ps5Pricing)}
          {renderGamesList(ps5Games, "PS5")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
