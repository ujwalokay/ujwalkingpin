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
    <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer" data-testid={`card-category-${title.toLowerCase()}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
        <Icon className={`h-6 w-6 ${color} group-hover:scale-110 transition-transform duration-300`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground" data-testid={`text-availability-${title.toLowerCase()}`}>
          {available}<span className="text-lg text-muted-foreground">/{total}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Available seats
        </p>
        <div className="mt-4 h-2 rounded-full glass overflow-hidden">
          <div 
            className={`h-full ${color} bg-current transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
