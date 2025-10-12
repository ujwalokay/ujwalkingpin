import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, Users, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [timeRange] = useState<string>("today");

  const { data: stats, isLoading } = useQuery<UsageStats>({
    queryKey: ["/api/analytics/usage", timeRange],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time data
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="heading-analytics">
            Real-Time Analytics
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Live usage data and performance metrics
          </p>
        </div>
        <Badge variant="outline" className="animate-pulse bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
          <Activity className="h-3 w-3 mr-1" />
          Live
        </Badge>
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
              Live update every 5s
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
          <CardTitle>Real-Time Occupancy Trend</CardTitle>
          <CardDescription>Live seat occupancy over the last 10 minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats?.realtimeData || []}>
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
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Category Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Category</CardTitle>
            <CardDescription>Current seat utilization per category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.categoryUsage || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="occupied"
                  nameKey="category"
                >
                  {(stats?.categoryUsage || []).map((entry, index) => (
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
          </CardContent>
        </Card>

        {/* Hourly Usage Pattern */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Hourly Usage</CardTitle>
            <CardDescription>Booking activity throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.hourlyUsage || []}>
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
          <div className="space-y-4">
            {stats?.categoryUsage?.map((category, index) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
