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
  const percentage = total > 0 ? (available / total) * 100 : 0;
  
  return (
    <Card className="glass-card group cursor-pointer shape-diagonal-rounded card-rectangular overflow-hidden" data-testid={`card-category-${title.toLowerCase()}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
        <Icon className={`h-7 w-7 ${color} group-hover:scale-110 transition-transform duration-300`} />
      </CardHeader>
      <CardContent className="flex flex-col justify-between h-full">
        <div className="text-4xl font-bold text-foreground mb-2" data-testid={`text-availability-${title.toLowerCase()}`}>
          {available}<span className="text-xl text-muted-foreground">/{total}</span>
        </div>
        <div className="mt-auto">
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            Available seats
          </p>
          <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
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
