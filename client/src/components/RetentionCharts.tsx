import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Users, TrendingUp, TrendingDown, IndianRupee } from "lucide-react";

interface RetentionMetrics {
  summary: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    retentionRate: number;
    churnRate: number;
    avgVisitFrequency: number;
    avgLifetimeValue: number;
  };
  series: {
    period: string;
    newCustomers: number;
    returningCustomers: number;
    totalVisits: number;
    retentionRate: number;
    revenue: number;
  }[];
}

export default function RetentionCharts() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>("monthly");
  const [months, setMonths] = useState<number>(6);

  const { data: metrics, isLoading } = useQuery<RetentionMetrics>({
    queryKey: ["/api/reports/retention-metrics", period, months],
    queryFn: async () => {
      const response = await fetch(`/api/reports/retention-metrics?period=${period}&months=${months}`);
      if (!response.ok) throw new Error("Failed to fetch retention metrics");
      return response.json();
    },
  });

  const formatPeriod = (periodStr: string) => {
    if (period === 'monthly') {
      const [year, month] = periodStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return periodStr;
  };

  const chartData = metrics?.series.map(item => ({
    ...item,
    period: formatPeriod(item.period),
    retentionRate: parseFloat(item.retentionRate.toFixed(1)),
  })) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} data-testid={`skeleton-card-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No retention data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" data-testid="text-retention-title">
            Customer Retention Analytics
          </h2>
          <p className="text-muted-foreground">
            Track customer loyalty and repeat business
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={period} onValueChange={(value) => setPeriod(value as any)}>
            <SelectTrigger className="w-32" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={months.toString()} onValueChange={(value) => setMonths(parseInt(value))}>
            <SelectTrigger className="w-32" data-testid="select-months">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-customers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-customers">
              {metrics.summary.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.summary.newCustomers} new, {metrics.summary.returningCustomers} returning
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-retention-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-retention-rate">
              {metrics.summary.retentionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Customers who return
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-churn-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-churn-rate">
              {metrics.summary.churnRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Inactive for 30+ days
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-lifetime-value">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Lifetime Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-lifetime-value">
              ₹{metrics.summary.avgLifetimeValue.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.summary.avgVisitFrequency.toFixed(1)} avg visits
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-customer-trend">
          <CardHeader>
            <CardTitle>New vs Returning Customers</CardTitle>
            <CardDescription>
              Track customer acquisition and retention over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Bar dataKey="newCustomers" fill="hsl(var(--chart-1))" name="New Customers" />
                <Bar dataKey="returningCustomers" fill="hsl(var(--chart-2))" name="Returning Customers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="card-retention-trend">
          <CardHeader>
            <CardTitle>Retention Rate Trend</CardTitle>
            <CardDescription>
              Percentage of returning customers per period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="retentionRate" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  name="Retention Rate"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2" data-testid="card-revenue-trend">
          <CardHeader>
            <CardTitle>Revenue by Period</CardTitle>
            <CardDescription>
              Total revenue generated from customer visits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => `₹${value.toFixed(2)}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--chart-4))" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
