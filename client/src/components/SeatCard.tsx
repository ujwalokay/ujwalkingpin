import { Card } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { SessionTimer } from "./SessionTimer";
import { Button } from "@/components/ui/button";
import { Clock, X } from "lucide-react";

type SeatStatus = "available" | "running" | "expired" | "upcoming";

interface SeatCardProps {
  seatName: string;
  status: SeatStatus;
  customerName?: string;
  endTime?: Date;
  onExtend?: () => void;
  onEnd?: () => void;
}

export function SeatCard({ seatName, status, customerName, endTime, onExtend, onEnd }: SeatCardProps) {
  const isActive = status === "running";
  const isExpiring = endTime && (endTime.getTime() - new Date().getTime()) <= 5 * 60 * 1000;
  const isExpired = status === "expired";

  const glowClass = isExpired 
    ? "animate-pulse-danger" 
    : isExpiring 
    ? "animate-pulse-warning" 
    : isActive 
    ? "animate-pulse-glow" 
    : "";

  return (
    <Card 
      className={`p-4 hover-elevate transition-all ${glowClass}`} 
      data-testid={`card-seat-${seatName.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">{seatName}</h3>
          <StatusBadge status={status} />
        </div>

        {customerName && (
          <p className="text-sm text-muted-foreground" data-testid={`text-customer-${seatName}`}>
            {customerName}
          </p>
        )}

        {endTime && isActive && (
          <SessionTimer endTime={endTime} />
        )}

        {isActive && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1" 
              onClick={onExtend}
              data-testid={`button-extend-${seatName}`}
            >
              <Clock className="mr-2 h-4 w-4" />
              Extend
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={onEnd}
              data-testid={`button-end-${seatName}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {isExpired && (
          <Button 
            size="sm" 
            variant="destructive" 
            className="w-full"
            onClick={onEnd}
            data-testid={`button-clear-${seatName}`}
          >
            Clear Session
          </Button>
        )}
      </div>
    </Card>
  );
}
