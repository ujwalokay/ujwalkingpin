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
    <Card className="hover-elevate transition-all" data-testid={`card-category-${title.toLowerCase()}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground" data-testid={`text-availability-${title.toLowerCase()}`}>
          {available}/{total}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Available seats
        </p>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div 
            className={`h-full ${color} bg-current transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
