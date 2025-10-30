import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { Eye } from "lucide-react";

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
    <Card className="glass-card group shape-diagonal-rounded card-rectangular overflow-hidden" data-testid={`card-category-${title.toLowerCase()}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
        <Icon className={`h-7 w-7 ${color} group-hover:scale-110 transition-transform duration-300`} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pb-4">
        <div className="text-3xl sm:text-4xl font-bold text-foreground" data-testid={`text-availability-${title.toLowerCase()}`}>
          {available}<span className="text-lg sm:text-xl text-muted-foreground">/{total}</span>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs text-muted-foreground font-medium">
              Seat occupancy
            </p>
            <p className="text-xs font-bold text-foreground">
              {Math.round(percentage)}%
            </p>
          </div>
          <div className="h-5 sm:h-6 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-inner border-2 border-gray-300 dark:border-gray-600">
            <div 
              className={`h-full ${color} bg-current transition-all duration-500 ease-out`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="group/btn w-full mt-2 py-2 px-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-500/30 dark:border-purple-500/50 hover:border-purple-500/60 dark:hover:border-purple-500/80 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]"
            data-testid={`button-view-details-${title.toLowerCase()}`}
          >
            <span className="flex items-center justify-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 group-hover/btn:text-purple-600 dark:group-hover/btn:text-purple-200 transition-colors">
              <Eye className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
              <span>View Details</span>
            </span>
          </button>
        )}
      </CardContent>
    </Card>
  );
}
