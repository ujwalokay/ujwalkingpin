import { TrendingUp, TrendingDown } from "lucide-react";

interface RevenueCardProps {
  title: string;
  amount: number;
  trend?: number;
  icon?: React.ReactNode;
  showCurrency?: boolean;
  suffix?: string;
}

export function RevenueCard({ title, amount, trend = 0, icon, showCurrency = true, suffix = "" }: RevenueCardProps) {
  const isPositive = trend >= 0;

  return (
    <div 
      className="relative group overflow-hidden"
      data-testid={`card-revenue-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-card/95 to-card/70 backdrop-blur-sm border border-border/50 transform skew-x-[-2deg] group-hover:border-primary/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20"></div>
      
      <div className="relative p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
          <div className="text-primary/80 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-3xl font-bold text-foreground" data-testid={`text-amount-${title.toLowerCase()}`}>
            {showCurrency && '₹'}{amount.toLocaleString()}{suffix}
          </div>
          
          {trend !== 0 && (
            <div className="flex items-center gap-1 text-xs">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={isPositive ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                {Math.abs(trend)}% from last period
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent blur-2xl group-hover:from-primary/20 transition-all duration-300"></div>
    </div>
  );
}
