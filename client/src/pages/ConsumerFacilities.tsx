import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wifi, 
  Coffee, 
  Zap, 
  Snowflake, 
  Armchair, 
  Gamepad2,
  Monitor,
  Headphones,
  Users,
  Sparkles
} from "lucide-react";
import type { Facility } from "@shared/schema";

const iconMap: Record<string, any> = {
  wifi: Wifi,
  coffee: Coffee,
  power: Zap,
  ac: Snowflake,
  comfort: Armchair,
  gaming: Gamepad2,
  monitor: Monitor,
  headphones: Headphones,
  community: Users,
  premium: Sparkles,
};

export default function ConsumerFacilities() {
  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ["/api/consumer/facilities"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!facilities || facilities.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold" data-testid="heading-facilities">Facilities</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No facilities information available yet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold" data-testid="heading-facilities">Our Facilities</h1>
      <p className="text-lg text-muted-foreground">Everything you need for the perfect gaming experience</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities.map((facility) => {
          const IconComponent = iconMap[facility.icon] || Sparkles;
          return (
            <Card key={facility.id} className="hover:shadow-lg transition-shadow" data-testid={`facility-${facility.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <IconComponent className="h-6 w-6 text-primary" data-testid={`icon-${facility.id}`} />
                  </div>
                  <span data-testid={`text-name-${facility.id}`}>{facility.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground" data-testid={`text-description-${facility.id}`}>
                  {facility.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
