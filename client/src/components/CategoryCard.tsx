import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  title: string;
  icon: LucideIcon;
  available: number;
  total: number;
  color: string;
}

export function CategoryCard({ title, icon: Icon, available, total, color }: CategoryCardProps) {
  const occupied = total - available;
  const percentage = total > 0 ? (occupied / total) * 100 : 0;
  
  return (
    <Card className="glass-card group cursor-pointer shape-diagonal-rounded card-rectangular overflow-hidden" data-testid={`card-category-${title.toLowerCase()}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
        <Icon className={`h-7 w-7 ${color} group-hover:scale-110 transition-transform duration-300`} />
      </CardHeader>
      <CardContent className="flex flex-col justify-between h-full">
        <div className="text-4xl font-bold text-foreground mb-3" data-testid={`text-availability-${title.toLowerCase()}`}>
          {available}<span className="text-xl text-muted-foreground">/{total}</span>
        </div>
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-muted-foreground font-medium">
              Seat occupancy
            </p>
            <p className="text-xs font-bold text-foreground">
              {Math.round(percentage)}%
            </p>
          </div>
          <div className="h-6 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-inner border-2 border-gray-300 dark:border-gray-600">
            <div 
              className={`h-full ${color} bg-current transition-all duration-500 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
