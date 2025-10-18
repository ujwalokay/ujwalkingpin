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
    <div 
      className="relative group cursor-pointer bg-card border border-border/40 rounded-xl p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
      data-testid={`card-category-${title.toLowerCase()}`}
    >
      <div className="flex items-start justify-between mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className={`p-2.5 rounded-lg bg-secondary/50 ${color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="text-5xl font-bold text-foreground tracking-tight" data-testid={`text-availability-${title.toLowerCase()}`}>
          {available}<span className="text-2xl text-muted-foreground font-semibold">/{total}</span>
        </div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Available seats
        </p>
      </div>
      
      <div className="mt-6 h-1.5 rounded-full bg-secondary/30 overflow-hidden">
        <div 
          className={`h-full ${color} bg-current transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
