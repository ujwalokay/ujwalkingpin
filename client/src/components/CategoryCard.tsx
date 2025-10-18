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
      className="relative group overflow-hidden cursor-pointer"
      data-testid={`card-category-${title.toLowerCase()}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-card/95 to-card/70 backdrop-blur-sm border border-border/50 transform skew-x-[-2deg] group-hover:border-primary/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20"></div>
      
      <div className="relative p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
          <Icon className={`h-7 w-7 ${color} group-hover:scale-110 transition-transform duration-300`} />
        </div>
        
        <div className="space-y-2">
          <div className="text-4xl font-bold text-foreground" data-testid={`text-availability-${title.toLowerCase()}`}>
            {available}<span className="text-xl text-muted-foreground">/{total}</span>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Available seats
          </p>
        </div>
        
        <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
          <div 
            className={`h-full ${color} bg-current transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 blur-2xl group-hover:opacity-20 transition-all duration-300`}></div>
    </div>
  );
}
