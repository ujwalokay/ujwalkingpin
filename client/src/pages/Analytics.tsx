import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, Users, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<string>("today");

  const { data: stats, isLoading, refetch, isFetching } = useQuery<UsageStats>({
    queryKey: ["/api/analytics/usage", timeRange],
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Analytics</h1>
          <p className="text-muted-foreground mt-2">Loading usage data...</p>
        </div>
      </div>
    );
  }

  const occupancyPercentage = stats ? Math.round(stats.occupancyRate) : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="heading-analytics">
            Analytics Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Usage data and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]" data-testid="select-timerange">
              <SelectValue placeholder="Time Range" />
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-current-occupancy">
              {stats?.currentOccupancy || 0}/{stats?.totalCapacity || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {occupancyPercentage}% capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-occupancy-rate">
              {occupancyPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Click refresh to update
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-bookings">
              {stats?.activeBookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Running sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Seats</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-available-seats">
              {(stats?.totalCapacity || 0) - (stats?.currentOccupancy || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to book
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-Time Occupancy Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Occupancy Trend</CardTitle>
          <CardDescription>Seat occupancy over recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.realtimeData && stats.realtimeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.realtimeData}>
                <defs>
                  <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="timestamp" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="occupancy" 
                  stroke="#8b5cf6" 
                  fillOpacity={1} 
                  fill="url(#colorOccupancy)" 
                  name="Occupied Seats"
                />
                <Area 
                  type="monotone" 
                  dataKey="capacity" 
                  stroke="#3b82f6" 
                  fill="transparent"
                  strokeDasharray="5 5"
                  name="Total Capacity"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] border-2 border-dashed border-muted rounded-lg bg-muted/10">
              <div className="text-center p-6">
                <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2 text-foreground">No Data Available</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  To see real-time trends, first go to <strong className="text-foreground">Settings</strong> to configure device categories, then create bookings in the <strong className="text-foreground">Dashboard</strong>.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Category Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Category</CardTitle>
            <CardDescription>
              {timeRange === "today" ? "Today's" : timeRange === "week" ? "This week's" : timeRange === "month" ? "This month's" : "All time"} seat utilization per category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.categoryUsage && stats.categoryUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.categoryUsage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percentage }) => `${category}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="occupied"
                    nameKey="category"
                  >
                    {stats.categoryUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] border-2 border-dashed border-muted rounded-lg bg-muted/10">
                <div className="text-center p-6">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold mb-2 text-foreground">No Categories Configured</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Go to <strong className="text-foreground">Settings → Device Config</strong> to add gaming categories (PC, PS5, Xbox, etc.)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hourly Usage Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Usage</CardTitle>
            <CardDescription>
              {timeRange === "today" ? "Booking activity throughout today" : timeRange === "week" ? "Booking activity this week" : timeRange === "month" ? "Booking activity this month" : "All booking activity"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.hourlyUsage && stats.hourlyUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.hourlyUsage}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="hour" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="bookings" fill="#8b5cf6" name="Bookings" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] border-2 border-dashed border-muted rounded-lg bg-muted/10">
                <div className="text-center p-6">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold mb-2 text-foreground">No Bookings Today</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Create bookings in the <strong className="text-foreground">Dashboard</strong> to see hourly activity patterns
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>Category Status Details</CardTitle>
          <CardDescription>Real-time breakdown of seat availability</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.categoryUsage && stats.categoryUsage.length > 0 ? (
            <div className="space-y-4">
              {stats.categoryUsage.map((category, index) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{category.category}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {category.occupied}/{category.total} occupied
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{category.percentage}% utilized</span>
                    <span>{category.total - category.occupied} available</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 border-2 border-dashed border-muted rounded-lg bg-muted/10">
              <div className="text-center p-6">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-semibold mb-2 text-foreground">No Category Data</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Configure device categories in <strong className="text-foreground">Settings</strong> to see detailed status
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
