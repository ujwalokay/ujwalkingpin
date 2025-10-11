import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, Gamepad2, Glasses, Car, Cpu, RefreshCw, Phone, MapPin, Clock, Mail, ChevronDown, ChevronUp, Wifi, Wind, Armchair, Pizza } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DeviceAvailability {
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

interface Facility {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const getIconForCategory = (category: string) => {
  const icons: Record<string, any> = {
    "PC": Monitor,
    "PS5": Gamepad2,
    "VR": Glasses,
    "Car": Car,
    "Xbox": Gamepad2,
    "Nintendo": Gamepad2,
  };
  return icons[category] || Cpu;
};

const getFacilityIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    "wifi": Wifi,
    "air-conditioning": Wind,
    "gaming-chair": Armchair,
    "refreshments": Pizza,
    "monitor": Monitor,
    "gamepad": Gamepad2,
  };
  return icons[iconName] || Cpu;
};

const getProgressBarColor = (percentage: number) => {
  if (percentage >= 60) return "#22c55e";
  if (percentage >= 40) return "#eab308";
  return "#ef4444";
};

export default function PublicStatus() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const activeSettings = {
    businessName: "Ankylo Gaming",
    logoUrl: undefined,
    headerTitle: "Live Availability",
    headerSubtitle: "Real-time status updated every 5 seconds",
    updateInterval: 5,
    showPricing: 1,
    showContactInfo: 1,
    contactSectionTitle: "Ankylo Gaming Center",
    address: "123 Gaming Street, Tech District, City - 400001",
    phone: "+91 98765 43210",
    hours: "10:00 AM - 11:00 PM (Mon-Sun)",
    email: "info@ankylgaming.com",
    showCallNowButton: 1,
    showDirectionsButton: 1,
    showFacilities: 1,
    primaryColor: "#a855f7",
    accentColor: "#8b5cf6"
  };

  const { data: availability = [], isLoading, refetch, dataUpdatedAt } = useQuery<DeviceAvailability[]>({
    queryKey: ["/api/public/status"],
    refetchInterval: (activeSettings.updateInterval || 5) * 1000,
  });

  const { data: pricing = [] } = useQuery<PricingConfig[]>({
    queryKey: ["/api/consumer/pricing"],
    enabled: activeSettings.showPricing === 1,
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/consumer/facilities"],
    enabled: activeSettings.showFacilities === 1,
  });

  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdate(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  const primaryColor = activeSettings.primaryColor || "#a855f7";
  const accentColor = activeSettings.accentColor || "#8b5cf6";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: primaryColor }} />
          <p className="text-xl text-gray-600 dark:text-gray-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  const groupedPricing = pricing.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PricingConfig[]>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-50 pb-8">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between bg-white dark:bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            {activeSettings.logoUrl ? (
              <img src={activeSettings.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg" />
            ) : (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white dark:text-white font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {activeSettings.businessName.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-900" data-testid="text-business-name">
                {activeSettings.businessName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Updated {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="rounded-full"
            data-testid="button-refresh"
          >
            <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-600" />
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 
            className="text-3xl font-bold"
            style={{ color: primaryColor }}
            data-testid="text-header-title"
          >
            {activeSettings.headerTitle}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-600" data-testid="text-header-subtitle">
            {activeSettings.headerSubtitle}
          </p>
        </div>

        <div className="space-y-3">
          {availability.map((device) => {
            const Icon = getIconForCategory(device.category);
            const isAvailable = device.available > 0;
            const progressColor = getProgressBarColor(device.percentage);
            
            return (
              <Card 
                key={device.category}
                className="bg-white dark:bg-white border-gray-200 dark:border-gray-200 rounded-2xl overflow-hidden"
                data-testid={`card-device-${device.category}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-900" data-testid={`text-category-${device.category}`}>
                          {device.category}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          {device.total} Total Stations
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-900" data-testid={`text-available-${device.category}`}>
                        {device.available}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-500">Available</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-600">Availability</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-900">{device.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 rounded-full"
                        style={{ 
                          width: `${device.percentage}%`,
                          backgroundColor: progressColor
                        }}
                        data-testid={`progress-${device.category}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-600">Stations Available</span>
                    </div>
                    <Badge 
                      className="ml-auto text-xs"
                      style={{ 
                        backgroundColor: `${primaryColor}20`,
                        color: primaryColor,
                        border: 'none'
                      }}
                      data-testid={`badge-status-${device.category}`}
                    >
                      Live
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {activeSettings.showPricing === 1 && pricing.length > 0 && (
          <Collapsible open={isPricingOpen} onOpenChange={setIsPricingOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between text-gray-900 dark:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-100 rounded-2xl py-6"
                data-testid="button-toggle-pricing"
              >
                <span className="font-semibold">View Pricing</span>
                {isPricingOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3">
              {Object.entries(groupedPricing).map(([category, items]) => (
                <Card key={category} className="bg-white dark:bg-white border-gray-200 dark:border-gray-200 rounded-2xl">
                  <CardContent className="p-4">
                    <h4 className="font-bold text-gray-900 dark:text-gray-900 mb-3">{category}</h4>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-600">{item.duration}</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-900">₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {activeSettings.showContactInfo === 1 && (
          <Card className="bg-white dark:bg-white border-gray-200 dark:border-gray-200 rounded-2xl">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-900" data-testid="text-contact-title">
                {activeSettings.contactSectionTitle}
              </h3>

              {activeSettings.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5" style={{ color: primaryColor }} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-900">Address</p>
                    <p className="text-sm text-gray-600 dark:text-gray-600" data-testid="text-address">{activeSettings.address}</p>
                  </div>
                </div>
              )}

              {activeSettings.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 mt-0.5" style={{ color: primaryColor }} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600 dark:text-gray-600" data-testid="text-phone">{activeSettings.phone}</p>
                  </div>
                </div>
              )}

              {activeSettings.hours && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 mt-0.5" style={{ color: primaryColor }} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-900">Hours</p>
                    <p className="text-sm text-gray-600 dark:text-gray-600" data-testid="text-hours">{activeSettings.hours}</p>
                  </div>
                </div>
              )}

              {activeSettings.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 mt-0.5" style={{ color: primaryColor }} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-900">Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-600" data-testid="text-email">{activeSettings.email}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {activeSettings.showCallNowButton === 1 && activeSettings.phone && (
                  <Button
                    className="flex-1 rounded-full text-white dark:text-white"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => window.location.href = `tel:${activeSettings.phone}`}
                    data-testid="button-call-now"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                )}
                {activeSettings.showDirectionsButton === 1 && activeSettings.address && (
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full border-gray-300 dark:border-gray-300"
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeSettings.address || '')}`, '_blank')}
                    data-testid="button-directions"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Directions
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSettings.showFacilities === 1 && facilities.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-900">Facilities</h3>
            <div className="grid grid-cols-2 gap-3">
              {facilities.map((facility) => {
                const Icon = getFacilityIcon(facility.icon);
                return (
                  <Card 
                    key={facility.id}
                    className="bg-white dark:bg-white border-gray-200 dark:border-gray-200 rounded-2xl"
                    data-testid={`card-facility-${facility.id}`}
                  >
                    <CardContent className="p-4 text-center">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: primaryColor }} />
                      </div>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-900">{facility.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{facility.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-500 dark:text-gray-500 pt-4">
          <p>© 2025 {activeSettings.businessName}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
