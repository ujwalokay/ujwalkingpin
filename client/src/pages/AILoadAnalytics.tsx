import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, Users, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { LoadMetric, LoadPrediction } from "@shared/schema";

export default function AILoadAnalytics() {
  const { data: metrics = [], isLoading: metricsLoading } = useQuery<LoadMetric[]>({
    queryKey: ["/api/load-metrics"],
    refetchInterval: 5000,
  });

  const { data: predictions = [], isLoading: predictionsLoading } = useQuery<LoadPrediction[]>({
    queryKey: ["/api/load-predictions"],
    refetchInterval: 60000,
  });

  const currentMetric = metrics[metrics.length - 1];

  const recentMetrics = metrics.slice(-20).map((metric, index) => ({
    time: new Date(metric.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    utilization: metric.capacityUtilization,
    sessions: metric.activeSessions,
    foodOrders: metric.foodOrders,
  }));

  const predictionData = predictions
    .filter(p => ['1h', '3h', '6h', '12h'].includes(p.horizon))
    .map(pred => ({
      horizon: pred.horizon,
      predicted: pred.predictedLoad,
      current: currentMetric?.capacityUtilization || 0,
    }));

  if (metricsLoading || predictionsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">AI Load Analytics</h1>
            <p className="text-muted-foreground">Real-time usage and AI-powered predictions</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">AI Load Analytics</h1>
          <p className="text-muted-foreground">Real-time usage and AI-powered load predictions</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4 animate-pulse text-green-500" />
          <span>Live Updates</span>
        </div>
      </div>

      {predictionData.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No AI predictions available yet. Run the AI prediction service to generate forecasts.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-metric-utilization">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-utilization-value">
              {currentMetric?.capacityUtilization || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Current load level</p>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-sessions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-sessions-value">
              {currentMetric?.activeSessions || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-session-length">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Length</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-session-length-value">
              {currentMetric?.avgSessionLength || 0}m
            </div>
            <p className="text-xs text-muted-foreground">Average duration</p>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-food-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Food Orders</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-food-orders-value">
              {currentMetric?.foodOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-real-time-chart">
          <CardHeader>
            <CardTitle>Real-Time Load Metrics</CardTitle>
            <CardDescription>Last 20 data points - Updates every 5 seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recentMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="utilization" 
                  stroke="hsl(var(--chart-1))" 
                  name="Utilization %" 
                  strokeWidth={2}
                  data-testid="line-utilization"
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="hsl(var(--chart-2))" 
                  name="Active Sessions" 
                  strokeWidth={2}
                  data-testid="line-sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="card-predictions-chart">
          <CardHeader>
            <CardTitle>AI Load Predictions</CardTitle>
            <CardDescription>AI-powered forecast for next 12 hours</CardDescription>
          </CardHeader>
          <CardContent>
            {predictionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={predictionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="horizon" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="current" 
                    stroke="hsl(var(--chart-3))" 
                    fill="hsl(var(--chart-3))" 
                    name="Current Load" 
                    fillOpacity={0.3}
                    data-testid="area-current"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="hsl(var(--chart-4))" 
                    fill="hsl(var(--chart-4))" 
                    name="Predicted Load" 
                    fillOpacity={0.6}
                    data-testid="area-predicted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No predictions available yet</p>
                  <p className="text-sm">Run the AI prediction service to generate forecasts</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-food-orders-chart">
        <CardHeader>
          <CardTitle>Food Orders Trend</CardTitle>
          <CardDescription>Track food order patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={recentMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="foodOrders" 
                stroke="hsl(var(--chart-5))" 
                name="Food Orders" 
                strokeWidth={2}
                data-testid="line-food-orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
