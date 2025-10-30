import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  title: string;
  icon: LucideIcon;
  available: number;
  total: number;
  color: string;
  onViewDetails?: () => void;
}

export function CategoryCard({ title, icon: Icon, available, total, color, onViewDetails }: CategoryCardProps) {
  const occupied = total - available;
  const percentage = total > 0 ? (occupied / total) * 100 : 0;
  
  return (
    <Card 
      className="glass-card group shape-diagonal-rounded card-rectangular overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border-2 hover:border-primary/20" 
      data-testid={`card-category-${title.toLowerCase()}`}
      onClick={onViewDetails}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3 pt-5">
        <CardTitle className="text-base sm:text-lg font-bold text-foreground">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color} group-hover:scale-110 transition-transform duration-300`} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pb-5">
        <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground" data-testid={`text-availability-${title.toLowerCase()}`}>
          {available}<span className="text-xl sm:text-2xl md:text-3xl text-muted-foreground font-semibold">/{total}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Seat occupancy
            </p>
            <p className="text-xs sm:text-sm font-bold text-foreground px-2 py-0.5 rounded-md bg-muted">
              {Math.round(percentage)}%
            </p>
          </div>
          <div className="h-2.5 sm:h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-inner">
            <div 
              className={`h-full ${color} bg-current transition-all duration-500 ease-out rounded-full`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
