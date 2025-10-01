import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface RevenueCardProps {
  title: string;
  amount: number;
  trend?: number;
  icon?: React.ReactNode;
}

export function RevenueCard({ title, amount, trend = 0, icon }: RevenueCardProps) {
  const isPositive = trend >= 0;

  return (
    <Card data-testid={`card-revenue-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground" data-testid={`text-amount-${title.toLowerCase()}`}>
          ₹{amount.toLocaleString()}
        </div>
        {trend !== 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-chart-4" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
            <span className={isPositive ? "text-chart-4" : "text-destructive"}>
              {Math.abs(trend)}% from last period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
