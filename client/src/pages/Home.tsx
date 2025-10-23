import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, MapPin, Clock, Gamepad2, Monitor, Zap, Gift, Lock, Crown } from "lucide-react";
import type { GamingCenterInfo } from "@shared/schema";
import { ParallelogramCard } from "@/components/ParallelogramCard";

interface Availability {
  category: string;
  total: number;
  available: number;
  occupied: number;
  percentage: number;
}

export default function Home() {
  const { data: centerInfo, isLoading: infoLoading } = useQuery<GamingCenterInfo>({
    queryKey: ["/api/consumer/center-info"],
  });

  const { data: availability, isLoading: availabilityLoading } = useQuery<Availability[]>({
    queryKey: ["/api/consumer/availability"],
    refetchInterval: 5000,
  });

  if (infoLoading || availabilityLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent" data-testid="text-center-name">
          {centerInfo?.name || "Airavoto Gaming Center"}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-center-description">
          {centerInfo?.description || "Experience the ultimate gaming destination"}
        </p>
      </div>

      <section className="py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Join <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">The Pantheon</span>
          </h2>
          <p className="text-muted-foreground text-lg">Power Comes to Those Who Wait.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <ParallelogramCard
            icon={<Zap className="w-full h-full" />}
            title="Early Access to the App"
            description="Be the first to book arenas and dominate leaderboards."
            iconColor="text-green-500"
            testId="card-early-access"
          />
          
          <ParallelogramCard
            icon={<Gift className="w-full h-full" />}
            title="Exclusive Hashdrop Rewards"
            description="Get limited-edition merch, coins, and tournament invites."
            iconColor="text-purple-500"
            testId="card-rewards"
          />
          
          <ParallelogramCard
            icon={<Crown className="w-full h-full" />}
            title="Founding Member Badge"
            description="Your tag will carry legacy. Forever."
            iconColor="text-yellow-500"
            testId="card-badge"
          />
          
          <ParallelogramCard
            icon={<Lock className="w-full h-full" />}
            title="Private Discord Access"
            description="Strategize with top gamers and influencers before launch."
            iconColor="text-cyan-500"
            testId="card-discord"
          />
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <Card data-testid="card-availability">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Real-Time Availability
            </CardTitle>
            <CardDescription>Check what's available right now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availability?.map((item) => (
              <div key={item.category} className="space-y-2" data-testid={`availability-${item.category.toLowerCase()}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.category === "PC" ? (
                      <Monitor className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Gamepad2 className="h-5 w-5 text-purple-500" />
                    )}
                    <span className="font-semibold text-lg">{item.category}</span>
                  </div>
                  <Badge variant={item.available > 0 ? "default" : "destructive"} data-testid={`badge-${item.category.toLowerCase()}-status`}>
                    {item.available}/{item.total} Available
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      item.percentage > 50
                        ? "bg-green-500"
                        : item.percentage > 20
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${item.percentage}%` }}
                    data-testid={`progress-${item.category.toLowerCase()}`}
                  />
                </div>
                <p className="text-sm text-muted-foreground" data-testid={`text-${item.category.toLowerCase()}-percentage`}>
                  {item.percentage}% capacity available
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card data-testid="card-contact-info">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Get in touch with us</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {centerInfo?.address && (
              <div className="flex items-start gap-3" data-testid="info-address">
                <MapPin className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{centerInfo.address}</p>
                </div>
              </div>
            )}
            {centerInfo?.phone && (
              <div className="flex items-start gap-3" data-testid="info-phone">
                <Phone className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Phone</p>
                  <a href={`tel:${centerInfo.phone}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {centerInfo.phone}
                  </a>
                </div>
              </div>
            )}
            {centerInfo?.email && (
              <div className="flex items-start gap-3" data-testid="info-email">
                <Mail className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <a href={`mailto:${centerInfo.email}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {centerInfo.email}
                  </a>
                </div>
              </div>
            )}
            {centerInfo?.hours && (
              <div className="flex items-start gap-3" data-testid="info-hours">
                <Clock className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Hours</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{centerInfo.hours}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
