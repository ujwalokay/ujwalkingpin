import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface HappyHoursSlot {
  startTime: string;
  endTime: string;
}

interface HappyHoursData {
  enabled: boolean;
  slots: HappyHoursSlot[];
}

interface HappyHoursTableProps {
  category: string;
  enabled: boolean;
  slots: HappyHoursSlot[];
  onUpdate: (data: HappyHoursData) => void;
}

export function HappyHoursTable({
  category,
  enabled: initialEnabled,
  slots: initialSlots,
  onUpdate,
}: HappyHoursTableProps) {
  const { isAdmin } = useAuth();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [slots, setSlots] = useState<HappyHoursSlot[]>(
    initialSlots.length > 0 ? initialSlots : [{ startTime: "10:00", endTime: "12:00" }]
  );

  const formatTimeToAMPM = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleSlotChange = (index: number, field: keyof HappyHoursSlot, value: string) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
    onUpdate({ enabled, slots: newSlots });
  };

  const addSlot = () => {
    const newSlots = [...slots, { startTime: "10:00", endTime: "12:00" }];
    setSlots(newSlots);
    onUpdate({ enabled, slots: newSlots });
  };

  const removeSlot = (index: number) => {
    const newSlots = slots.filter((_, i) => i !== index);
    setSlots(newSlots);
    onUpdate({ enabled, slots: newSlots });
  };

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    onUpdate({ enabled: checked, slots });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle data-testid={`text-happy-hours-${category.toLowerCase()}`}>{category}</CardTitle>
            <CardDescription>Configure happy hours time slots and pricing</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`enabled-${category}`} className="text-sm font-medium">
              Enabled
            </Label>
            <Switch
              id={`enabled-${category}`}
              checked={enabled}
              onCheckedChange={handleEnabledChange}
              disabled={!isAdmin}
              data-testid={`switch-happy-hours-enabled-${category.toLowerCase()}`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {slots.map((slot, index) => (
            <div key={index} className="flex flex-col gap-3 p-3 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`start-${category}-${index}`} className="text-sm">
                    Start Time
                  </Label>
                  <div className="space-y-1">
                    <Input
                      id={`start-${category}-${index}`}
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleSlotChange(index, "startTime", e.target.value)}
                      disabled={!isAdmin}
                      data-testid={`input-happy-hours-start-${category.toLowerCase()}-${index}`}
                    />
                    <div className="text-xs text-muted-foreground font-medium px-1">
                      {formatTimeToAMPM(slot.startTime)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`end-${category}-${index}`} className="text-sm">
                    End Time
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Input
                        id={`end-${category}-${index}`}
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => handleSlotChange(index, "endTime", e.target.value)}
                        disabled={!isAdmin}
                        data-testid={`input-happy-hours-end-${category.toLowerCase()}-${index}`}
                      />
                      <div className="text-xs text-muted-foreground font-medium px-1">
                        {formatTimeToAMPM(slot.endTime)}
                      </div>
                    </div>
                    {isAdmin && slots.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSlot(index)}
                        data-testid={`button-remove-happy-hours-slot-${category.toLowerCase()}-${index}`}
                        className="mt-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isAdmin && (
            <Button
              variant="outline"
              onClick={addSlot}
              className="w-full"
              data-testid={`button-add-happy-hours-slot-${category.toLowerCase()}`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Time Slot
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
