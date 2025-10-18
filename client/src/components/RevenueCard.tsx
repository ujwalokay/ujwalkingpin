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
      className="relative group bg-card border border-border/40 rounded-xl p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
      data-testid={`card-revenue-${title.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="flex items-start justify-between mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="text-4xl font-bold text-foreground tracking-tight" data-testid={`text-amount-${title.toLowerCase()}`}>
          {showCurrency && '₹'}{amount.toLocaleString()}{suffix}
        </div>
        
        {trend !== 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            {isPositive ? (
              <>
                <div className="p-1 rounded bg-green-500/10">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                </div>
                <span className="text-green-500 font-semibold">
                  +{Math.abs(trend)}%
                </span>
              </>
            ) : (
              <>
                <div className="p-1 rounded bg-red-500/10">
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                </div>
                <span className="text-red-500 font-semibold">
                  -{Math.abs(trend)}%
                </span>
              </>
            )}
            <span className="text-muted-foreground text-xs">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
}
