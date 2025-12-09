import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2 } from "lucide-react";

interface DeviceConfigCardProps {
  title: string;
  description: string;
  count: number;
  onCountChange: (newCount: number) => void;
  seats?: { name: string; visible: boolean }[];
  onToggleVisibility?: (seatName: string) => void;
  onDelete?: () => void;
}

export function DeviceConfigCard({
  title,
  description,
  count,
  onCountChange,
  seats = [],
  onToggleVisibility,
  onDelete,
}: DeviceConfigCardProps) {
  return (
    <Card className="glass-card" data-testid={`card-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {onDelete && (
          <Button
            size="icon"
            variant="destructive"
            onClick={onDelete}
            data-testid={`button-delete-${title.toLowerCase()}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Label>Quantity:</Label>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => onCountChange(Math.max(0, count - 1))}
              disabled={count === 0}
              data-testid={`button-decrease-${title.toLowerCase()}`}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center font-bold" data-testid={`text-count-${title.toLowerCase()}`}>
              {count}
            </span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => onCountChange(count + 1)}
              data-testid={`button-increase-${title.toLowerCase()}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {seats.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Seat Visibility:</Label>
            <div className="grid grid-cols-2 gap-2">
              {seats.map((seat) => (
                <div
                  key={seat.name}
                  className="flex items-center justify-between rounded-md border p-2"
                  data-testid={`seat-toggle-${seat.name.toLowerCase()}`}
                >
                  <span className="text-sm">{seat.name}</span>
                  <Switch
                    checked={seat.visible}
                    onCheckedChange={() => onToggleVisibility?.(seat.name)}
                    data-testid={`switch-${seat.name.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
