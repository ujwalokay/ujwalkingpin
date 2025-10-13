import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Phone, MapPin, Clock, Mail, Wifi, Wind, Cpu, Gamepad2, Armchair, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";

interface MiniWebviewData {
  availability: Array<{
    category: string;
    total: number;
    available: number;
    percentage: number;
    games: Array<{ name: string; description?: string }>;
  }>;
  pricing: Record<string, Array<{ duration: string; price: string }>>;
  facilities: Array<{ id: string; name: string; description: string; icon: string }>;
  centerInfo?: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    hours: string;
  };
  settings: {
    isLiveEnabled: string;
    refreshInterval: number;
  };
}

const iconMap: Record<string, any> = {
  wifi: Wifi,
  wind: Wind,
  cpu: Cpu,
  gamepad: Gamepad2,
  armchair: Armchair,
  coffee: Coffee,
};

export default function MiniWebview() {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data, isLoading, refetch } = useQuery<MiniWebviewData>({
    queryKey: ["/api/mini-webview/live-data"],
  });

  useEffect(() => {
    if (!data?.settings) return;
    
    const isLiveEnabled = data.settings.isLiveEnabled === "true";
    if (!isLiveEnabled) return;
    
    const intervalSeconds = data.settings.refreshInterval || 5;
    const interval = setInterval(() => {
      refetch();
    }, intervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [data?.settings, refetch]);

  const handleCall = () => {
    if (data?.centerInfo?.phone) {
      window.location.href = `tel:${data.centerInfo.phone}`;
    }
  };

  const handleDirections = () => {
    if (data?.centerInfo?.address) {
      const encodedAddress = encodeURIComponent(data.centerInfo.address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  const isLiveEnabled = data?.settings?.isLiveEnabled === "true";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4 pb-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6" data-testid="header-mini-webview">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-900 rounded-xl flex items-center justify-center">
              <Gamepad2 className="w-7 h-7 text-purple-300" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg" data-testid="text-center-name">
                {data?.centerInfo?.name || "Ankylo Gaming"}
              </h1>
              <p className="text-purple-200 text-xs">
                Updated {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={!isLiveEnabled}
            className="text-white hover:bg-white/20 disabled:opacity-50"
            data-testid="button-refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>

        {/* Live Availability Section */}
        <div className="bg-white/95 rounded-2xl p-5 mb-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-purple-900 font-bold text-xl" data-testid="text-live-availability">
              Live Availability
            </h2>
            {!isLiveEnabled && (
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                Live Disabled
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Real-time status updated every {data?.settings?.refreshInterval || 5} seconds
          </p>

          {/* Station Cards */}
          <div className="space-y-3">
            {data?.availability?.map((station, index) => {
              const getProgressColor = (percentage: number) => {
                if (percentage >= 70) return "bg-green-500";
                if (percentage >= 40) return "bg-yellow-500";
                return "bg-orange-500";
              };

              return (
                <div key={station.category} className="bg-gray-50 rounded-xl p-4" data-testid={`card-station-${station.category.toLowerCase()}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        {station.category === "PC" ? (
                          <Cpu className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Gamepad2 className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900" data-testid={`text-category-${station.category.toLowerCase()}`}>
                          {station.category} Gaming
                        </h3>
                        <p className="text-xs text-gray-500">
                          {station.total} Total Stations
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900" data-testid={`text-available-${station.category.toLowerCase()}`}>
                        {station.available}
                      </div>
                      <div className="text-xs text-gray-500">Available</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Availability</span>
                      <span className="font-semibold text-gray-900" data-testid={`text-percentage-${station.category.toLowerCase()}`}>
                        {station.percentage}%
                      </span>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full ${getProgressColor(station.percentage)} transition-all duration-500`}
                        style={{ width: `${station.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">
                      {station.available} Stations Available
                    </span>
                    <span className="ml-auto px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                      Live
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View Pricing */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-white/95 rounded-2xl mb-4 backdrop-blur-sm">
          <CollapsibleTrigger className="w-full p-5 flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors" data-testid="button-view-pricing">
            <span className="font-semibold text-gray-900">View Pricing</span>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-5 pb-5 space-y-4">
              {Object.entries(data?.pricing || {}).map(([category, prices]) => (
                <div key={category}>
                  <h4 className="font-semibold text-gray-900 mb-2">{category} Gaming</h4>
                  <div className="space-y-1">
                    {prices.map((price, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">{price.duration}</span>
                        <span className="font-medium text-gray-900">₹{price.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Center Info */}
        {data?.centerInfo && (
          <div className="bg-white/95 rounded-2xl p-5 mb-4 backdrop-blur-sm">
            <h3 className="font-bold text-gray-900 text-lg mb-4" data-testid="text-center-info-title">
              {data.centerInfo.name}
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Address</p>
                  <p className="text-sm text-gray-600" data-testid="text-address">
                    {data.centerInfo.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600" data-testid="text-phone">
                    {data.centerInfo.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Hours</p>
                  <p className="text-sm text-gray-600" data-testid="text-hours">
                    {data.centerInfo.hours}
                  </p>
                </div>
              </div>

              {data.centerInfo.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600" data-testid="text-email">
                      {data.centerInfo.email}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button
                onClick={handleCall}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                data-testid="button-call"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </Button>
              <Button
                onClick={handleDirections}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50 gap-2"
                data-testid="button-directions"
              >
                <MapPin className="w-4 h-4" />
                Directions
              </Button>
            </div>
          </div>
        )}

        {/* Facilities */}
        {data?.facilities && data.facilities.length > 0 && (
          <div className="bg-white/95 rounded-2xl p-5 backdrop-blur-sm">
            <h3 className="font-bold text-gray-900 text-lg mb-4" data-testid="text-facilities-title">
              Facilities
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {data.facilities.map((facility) => {
                const IconComponent = iconMap[facility.icon.toLowerCase()] || Wifi;
                return (
                  <div
                    key={facility.id}
                    className="bg-gray-50 rounded-xl p-4 flex flex-col items-center text-center"
                    data-testid={`card-facility-${facility.id}`}
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                      <IconComponent className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">
                      {facility.name}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {facility.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/80 text-xs">
            © 2025 {data?.centerInfo?.name || "Ankylo Gaming Center"}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
