import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import { Activity, TrendingUp, Users, DollarSign, Zap, RefreshCw, Calendar, Clock, ShoppingBag, UserCheck, Sparkles, Brain, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveChartAsImage } from "@/lib/chartUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UsageStats {
  currentOccupancy: number;
  totalCapacity: number;
  occupancyRate: number;
  activeBookings: number;
  categoryUsage: Array<{
    category: string;
    occupied: number;
    total: number;
    percentage: number;
  }>;
  hourlyUsage: Array<{
    hour: string;
    bookings: number;
    revenue: number;
  }>;
  realtimeData: Array<{
    timestamp: string;
    occupancy: number;
    capacity: number;
  }>;
  uniqueCustomers: number;
  avgSessionDuration: number;
  totalFoodOrders: number;
  foodRevenue: number;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<string>("today");
  const [activeTab, setActiveTab] = useState<string>("overview");

  const { data: stats, isLoading, refetch, isFetching } = useQuery<UsageStats>({
    queryKey: [`/api/analytics/usage?timeRange=${timeRange}`],
  });

  // Convert UTC time to India Standard Time (Asia/Kolkata)
  const convertToIST = (utcTimeString: string, isHourFormat: boolean = false): string => {
    if (isHourFormat) {
      // For hour format like "14:00", create a date object and convert to IST
      const [hour] = utcTimeString.split(':').map(Number);
      const utcDate = new Date();
      utcDate.setUTCHours(hour, 0, 0, 0);
      const istHour = utcDate.toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return istHour;
    } else {
      // For timestamp format, parse and convert to IST
      const now = new Date();
      const [time] = utcTimeString.split(' ');
      const [hours, minutes, seconds] = time.split(':').map(Number);
      now.setUTCHours(hours, minutes, seconds || 0, 0);
      return now.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    }
  };

  // Transform data with IST timezone conversion
  const transformedStats = useMemo(() => {
    if (!stats) return null;

    return {
      ...stats,
      hourlyUsage: stats.hourlyUsage?.map(item => ({
        ...item,
        hour: convertToIST(item.hour, true)
      })) || [],
      realtimeData: stats.realtimeData?.map(item => ({
        ...item,
        timestamp: convertToIST(item.timestamp, false)
      })) || []
    };
  }, [stats]);

  const metrics = useMemo(() => {
    if (!transformedStats) return null;

    const totalRevenue = transformedStats.hourlyUsage?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0;
    const avgBookingsPerHour = transformedStats.hourlyUsage && transformedStats.hourlyUsage.length > 0
      ? Math.round(transformedStats.hourlyUsage.reduce((sum, item) => sum + item.bookings, 0) / transformedStats.hourlyUsage.length)
      : 0;

    const peakHours = [...(transformedStats.hourlyUsage || [])]
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 3);

    return {
      totalRevenue,
      avgBookingsPerHour,
      peakHours,
      occupancyPercentage: Math.round(transformedStats.occupancyRate || 0),
      availableSeats: (transformedStats.totalCapacity || 0) - (transformedStats.currentOccupancy || 0)
    };
  }, [transformedStats]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="h-8 w-8 text-blue-500 animate-pulse" />
            <Sparkles className="h-5 w-5 text-blue-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-analytics">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time insights and performance metrics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]" data-testid="select-timerange">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => refetch()} 
            disabled={isFetching}
            variant="outline"
            size="sm"
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="hover:shadow-lg transition-shadow shape-left-rounded">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
            <Users className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-current-occupancy">
              {transformedStats?.currentOccupancy || 0}/{transformedStats?.totalCapacity || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.occupancyPercentage}% capacity
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow shape-right-rounded">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-occupancy-rate">
              {metrics?.occupancyPercentage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time utilization
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow shape-diagonal-rounded">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-bookings">
              {transformedStats?.activeBookings || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Running now
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow shape-left-rounded">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-available-seats">
              {metrics?.availableSeats || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Seats ready
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow shape-right-rounded">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ₹{metrics?.totalRevenue.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {timeRange === "today" ? "Today" : "Period total"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow shape-diagonal-rounded">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-unique-customers">
              {transformedStats?.uniqueCustomers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique walk-ins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow shape-left-rounded">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-session">
              {transformedStats?.avgSessionDuration || 0} min
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per customer
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow shape-right-rounded">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Food Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-food-orders">
              {transformedStats?.totalFoodOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total orders
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow shape-diagonal-rounded">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Food Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-food-revenue">
              ₹{transformedStats?.foodRevenue?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From food sales
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow shape-left-rounded">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg/Hour</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-bookings">
              {metrics?.avgBookingsPerHour || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bookings/hr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card id="occupancy-trend-chart">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Occupancy Trend</CardTitle>
                <CardDescription>Real-time seat utilization over time</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveChartAsImage("occupancy-trend-chart", "occupancy-trend")}
                data-testid="button-save-occupancy-trend"
              >
                <Download className="h-4 w-4 mr-2" />
                Save as Image
              </Button>
            </CardHeader>
            <CardContent>
              {transformedStats?.realtimeData && transformedStats.realtimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={transformedStats.realtimeData}>
                    <defs>
                      <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="timestamp" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Area type="monotone" dataKey="occupancy" stroke="#8b5cf6" fill="url(#occupancyGradient)" name="Occupied" />
                    <Area type="monotone" dataKey="capacity" stroke="#3b82f6" fill="transparent" strokeDasharray="5 5" name="Capacity" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center p-6">
                    <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-semibold">No Data Available</p>
                    <p className="text-sm text-muted-foreground mt-1">Create bookings to see trends</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card id="category-distribution-chart">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>Usage by device category</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveChartAsImage("category-distribution-chart", "category-distribution")}
                  data-testid="button-save-category-distribution"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Save as Image
                </Button>
              </CardHeader>
              <CardContent>
                {transformedStats?.categoryUsage && transformedStats.categoryUsage.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={transformedStats.categoryUsage}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category}: ${percentage}%`}
                        outerRadius={80}
                        dataKey="occupied"
                      >
                        {transformedStats.categoryUsage.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center border-2 border-dashed rounded-lg">
                    <div className="text-center p-4">
                      <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm">Configure categories in Settings</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card id="hourly-activity-chart">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Hourly Activity</CardTitle>
                  <CardDescription>Bookings throughout the day</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveChartAsImage("hourly-activity-chart", "hourly-activity")}
                  data-testid="button-save-hourly-activity"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Save as Image
                </Button>
              </CardHeader>
              <CardContent>
                {transformedStats?.hourlyUsage && transformedStats.hourlyUsage.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={transformedStats.hourlyUsage}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hour" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="bookings" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center border-2 border-dashed rounded-lg">
                    <div className="text-center p-4">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm">No bookings yet</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4 mt-6">
          <Card id="revenue-bookings-chart">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revenue & Bookings</CardTitle>
                <CardDescription>Combined performance metrics</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveChartAsImage("revenue-bookings-chart", "revenue-bookings")}
                data-testid="button-save-revenue-bookings"
              >
                <Download className="h-4 w-4 mr-2" />
                Save as Image
              </Button>
            </CardHeader>
            <CardContent>
              {transformedStats?.hourlyUsage && transformedStats.hourlyUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={transformedStats.hourlyUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue (₹)" radius={[6, 6, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#8b5cf6" strokeWidth={2} name="Bookings" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center p-6">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm">Create bookings to see performance data</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4 mt-6">
          <Card id="peak-hours-chart">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Peak Hours</CardTitle>
                <CardDescription>Top 3 busiest hours</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveChartAsImage("peak-hours-chart", "peak-hours")}
                data-testid="button-save-peak-hours"
              >
                <Download className="h-4 w-4 mr-2" />
                Save as Image
              </Button>
            </CardHeader>
            <CardContent>
              {metrics?.peakHours && metrics.peakHours.length > 0 ? (
                <div className="space-y-4">
                  {metrics.peakHours.map((peak, index) => (
                    <div key={peak.hour} className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold">{peak.hour}</span>
                          <span className="text-sm text-muted-foreground">{peak.bookings} bookings</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(peak.bookings / (metrics.peakHours[0]?.bookings || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Peak Insight</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {metrics.peakHours[0]?.hour} is your busiest hour with {metrics.peakHours[0]?.bookings} bookings
                      {metrics.peakHours[0]?.revenue ? ` generating ₹${Number(metrics.peakHours[0].revenue).toFixed(2)}` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center p-6">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm">No peak hours data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
