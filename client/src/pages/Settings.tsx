import { useState } from "react";
import { DeviceConfigCard } from "@/components/DeviceConfigCard";
import { PricingTable } from "@/components/PricingTable";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

//todo: remove mock functionality
export default function Settings() {
  const { toast } = useToast();
  
  const [pcCount, setPcCount] = useState(5);
  const [ps5Count, setPs5Count] = useState(3);
  const [vrCount, setVrCount] = useState(2);
  const [carCount, setCarCount] = useState(1);

  const [pcSeats, setPcSeats] = useState([
    { name: "PC-1", visible: true },
    { name: "PC-2", visible: true },
    { name: "PC-3", visible: true },
    { name: "PC-4", visible: false },
    { name: "PC-5", visible: true },
  ]);

  const [pcPricing] = useState([
    { duration: "30 mins", price: 40 },
    { duration: "1 hour", price: 70 },
    { duration: "2 hours", price: 130 },
  ]);

  const [ps5Pricing] = useState([
    { duration: "30 mins", price: 60 },
    { duration: "1 hour", price: 100 },
    { duration: "2 hours", price: 180 },
  ]);

  const toggleSeatVisibility = (seatName: string) => {
    setPcSeats(seats => 
      seats.map(seat => 
        seat.name === seatName ? { ...seat, visible: !seat.visible } : seat
      )
    );
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your configuration has been updated successfully.",
    });
    console.log("Settings saved:", { pcCount, ps5Count, vrCount, carCount });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure devices and pricing</p>
        </div>
        <Button onClick={handleSave} data-testid="button-save-settings">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Device Configuration</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <DeviceConfigCard
            title="PC Gaming"
            description="Configure PC gaming stations"
            count={pcCount}
            onCountChange={setPcCount}
            seats={pcSeats}
            onToggleVisibility={toggleSeatVisibility}
          />
          <DeviceConfigCard
            title="PS5"
            description="Configure PlayStation 5 consoles"
            count={ps5Count}
            onCountChange={setPs5Count}
          />
          <DeviceConfigCard
            title="VR Simulators"
            description="Configure VR gaming stations"
            count={vrCount}
            onCountChange={setVrCount}
          />
          <DeviceConfigCard
            title="Car Simulators"
            description="Configure racing simulators"
            count={carCount}
            onCountChange={setCarCount}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Pricing Configuration</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <PricingTable
            category="PC"
            slots={pcPricing}
            onUpdateSlots={(slots) => console.log("PC pricing updated:", slots)}
          />
          <PricingTable
            category="PS5"
            slots={ps5Pricing}
            onUpdateSlots={(slots) => console.log("PS5 pricing updated:", slots)}
          />
        </div>
      </div>
    </div>
  );
}
