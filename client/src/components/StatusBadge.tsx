import { Badge } from "@/components/ui/badge";
import { Circle } from "lucide-react";

type Status = "available" | "running" | "expired" | "upcoming" | "completed";

interface StatusBadgeProps {
  status: Status;
}

const statusConfig = {
  available: {
    label: "Available",
    className: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    dotClassName: "text-chart-4",
  },
  running: {
    label: "Running",
    className: "bg-chart-5/20 text-chart-5 border-chart-5/30",
    dotClassName: "text-chart-5",
  },
  expired: {
    label: "Expired",
    className: "bg-destructive/20 text-destructive border-destructive/30",
    dotClassName: "text-destructive",
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    dotClassName: "text-chart-2",
  },
  completed: {
    label: "Completed",
    className: "bg-green-500/20 text-green-600 border-green-500/30",
    dotClassName: "text-green-600",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config.className} data-testid={`badge-${status}`}>
      <Circle className={`mr-1 h-2 w-2 fill-current ${config.dotClassName}`} />
      {config.label}
    </Badge>
  );
}
