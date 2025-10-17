import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, DollarSign, TrendingUp, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";

interface ROIInputs {
  // Startup Costs
  equipmentCost: number;
  furnitureCost: number;
  improvementsCost: number;
  inventoryCost: number;
  licensesCost: number;
  marketingCost: number;

  // Operations
  numStations: number;
  pricePerHour: number;
  hoursPerDay: number;
  daysPerMonth: number;
  weekdayUtilization: number;
  weekendUtilization: number;
  avgSessionLength: number;

  // Revenue
  avgFBSpend: number;
  eventRevenue: number;
  membershipRevenue: number;

  // Operating Costs
  rent: number;
  salaries: number;
  insurance: number;
  internet: number;
  softwareLicenses: number;
  utilities: number;
  maintenance: number;
  marketingMonthly: number;
  fbCostPercent: number;
}

interface ROIResults {
  totalStartupCost: number;
  monthlyGamingRevenue: number;
  monthlyFBRevenue: number;
  monthlyEventRevenue: number;
  monthlyMembershipRevenue: number;
  totalMonthlyRevenue: number;
  totalFixedCosts: number;
  totalVariableCosts: number;
  totalMonthlyOperatingCosts: number;
  monthlyNetProfit: number;
  monthlyROI: number;
  annualROI: number;
  breakEvenMonths: number;
  profitMargin: number;
  revenuePerStation: number;
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export default function RoiCalculator() {
  const [inputs, setInputs] = useState<ROIInputs>({
    equipmentCost: 30000,
    furnitureCost: 20000,
    improvementsCost: 35000,
    inventoryCost: 7500,
    licensesCost: 5000,
    marketingCost: 10000,
    numStations: 20,
    pricePerHour: 8,
    hoursPerDay: 12,
    daysPerMonth: 30,
    weekdayUtilization: 50,
    weekendUtilization: 75,
    avgSessionLength: 2,
    avgFBSpend: 8,
    eventRevenue: 2000,
    membershipRevenue: 3000,
    rent: 6000,
    salaries: 35000,
    insurance: 1000,
    internet: 1000,
    softwareLicenses: 2000,
    utilities: 2000,
    maintenance: 1000,
    marketingMonthly: 1500,
    fbCostPercent: 30,
  });

  const [results, setResults] = useState<ROIResults | null>(null);

  const handleInputChange = (field: keyof ROIInputs, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const calculateROI = () => {
    const totalStartupCost = 
      inputs.equipmentCost + 
      inputs.furnitureCost + 
      inputs.improvementsCost + 
      inputs.inventoryCost + 
      inputs.licensesCost + 
      inputs.marketingCost;

    const avgUtilization = ((inputs.weekdayUtilization * 5) + (inputs.weekendUtilization * 2)) / 7 / 100;
    
    const totalGamingHours = 
      inputs.numStations * 
      avgUtilization * 
      inputs.hoursPerDay * 
      inputs.daysPerMonth;
    
    const monthlyGamingRevenue = totalGamingHours * inputs.pricePerHour;

    const estimatedCustomers = inputs.avgSessionLength > 0 
      ? totalGamingHours / inputs.avgSessionLength 
      : 0;
    const monthlyFBRevenue = estimatedCustomers * inputs.avgFBSpend;

    const totalMonthlyRevenue = 
      monthlyGamingRevenue + 
      monthlyFBRevenue + 
      inputs.eventRevenue + 
      inputs.membershipRevenue;

    const totalFixedCosts = 
      inputs.rent + 
      inputs.salaries + 
      inputs.insurance + 
      inputs.internet + 
      inputs.softwareLicenses;

    const fbCOGS = monthlyFBRevenue * (inputs.fbCostPercent / 100);
    const totalVariableCosts = 
      fbCOGS + 
      inputs.utilities + 
      inputs.maintenance + 
      inputs.marketingMonthly;

    const totalMonthlyOperatingCosts = totalFixedCosts + totalVariableCosts;
    const monthlyNetProfit = totalMonthlyRevenue - totalMonthlyOperatingCosts;
    const monthlyROI = totalStartupCost > 0 ? (monthlyNetProfit / totalStartupCost) * 100 : 0;
    const annualROI = monthlyROI * 12;
    const breakEvenMonths = monthlyNetProfit > 0 ? totalStartupCost / monthlyNetProfit : 0;
    const profitMargin = totalMonthlyRevenue > 0 ? (monthlyNetProfit / totalMonthlyRevenue) * 100 : 0;
    const revenuePerStation = inputs.numStations > 0 ? totalMonthlyRevenue / inputs.numStations : 0;

    setResults({
      totalStartupCost,
      monthlyGamingRevenue,
      monthlyFBRevenue,
      monthlyEventRevenue: inputs.eventRevenue,
      monthlyMembershipRevenue: inputs.membershipRevenue,
      totalMonthlyRevenue,
      totalFixedCosts,
      totalVariableCosts,
      totalMonthlyOperatingCosts,
      monthlyNetProfit,
      monthlyROI,
      annualROI,
      breakEvenMonths,
      profitMargin,
      revenuePerStation,
    });
  };

  const revenueData = results ? [
    { name: 'Gaming', value: results.monthlyGamingRevenue },
    { name: 'Food & Beverage', value: results.monthlyFBRevenue },
    { name: 'Events', value: results.monthlyEventRevenue },
    { name: 'Memberships', value: results.monthlyMembershipRevenue },
  ] : [];

  const costData = results ? [
    { name: 'Fixed Costs', value: results.totalFixedCosts },
    { name: 'Variable Costs', value: results.totalVariableCosts },
  ] : [];

  const cashFlowData = results ? Array.from({ length: 12 }, (_, i) => ({
    month: `Month ${i + 1}`,
    revenue: results.totalMonthlyRevenue,
    costs: results.totalMonthlyOperatingCosts,
    profit: results.monthlyNetProfit,
    cumulative: results.monthlyNetProfit * (i + 1) - results.totalStartupCost,
  })) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="heading-roi-calculator">ROI Calculator</h1>
          <p className="text-purple-200" data-testid="text-description">Calculate your gaming cafe return on investment</p>
        </div>

        <Tabs defaultValue="inputs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
            <TabsTrigger value="inputs" data-testid="tab-inputs">
              <Calculator className="w-4 h-4 mr-2" />
              Inputs
            </TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">
              <TrendingUp className="w-4 h-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="charts" data-testid="tab-charts">
              <DollarSign className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inputs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Startup Costs</CardTitle>
                  <CardDescription>One-time investment expenses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="equipmentCost">Gaming Equipment (PCs/Consoles)</Label>
                    <Input
                      id="equipmentCost"
                      type="number"
                      value={inputs.equipmentCost}
                      onChange={(e) => handleInputChange('equipmentCost', e.target.value)}
                      data-testid="input-equipment-cost"
                    />
                  </div>
                  <div>
                    <Label htmlFor="furnitureCost">Furniture & Decor</Label>
                    <Input
                      id="furnitureCost"
                      type="number"
                      value={inputs.furnitureCost}
                      onChange={(e) => handleInputChange('furnitureCost', e.target.value)}
                      data-testid="input-furniture-cost"
                    />
                  </div>
                  <div>
                    <Label htmlFor="improvementsCost">Leasehold Improvements</Label>
                    <Input
                      id="improvementsCost"
                      type="number"
                      value={inputs.improvementsCost}
                      onChange={(e) => handleInputChange('improvementsCost', e.target.value)}
                      data-testid="input-improvements-cost"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inventoryCost">Initial Inventory (F&B)</Label>
                    <Input
                      id="inventoryCost"
                      type="number"
                      value={inputs.inventoryCost}
                      onChange={(e) => handleInputChange('inventoryCost', e.target.value)}
                      data-testid="input-inventory-cost"
                    />
                  </div>
                  <div>
                    <Label htmlFor="licensesCost">Licenses & Permits</Label>
                    <Input
                      id="licensesCost"
                      type="number"
                      value={inputs.licensesCost}
                      onChange={(e) => handleInputChange('licensesCost', e.target.value)}
                      data-testid="input-licenses-cost"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marketingCost">Marketing Launch</Label>
                    <Input
                      id="marketingCost"
                      type="number"
                      value={inputs.marketingCost}
                      onChange={(e) => handleInputChange('marketingCost', e.target.value)}
                      data-testid="input-marketing-cost"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gaming Operations</CardTitle>
                  <CardDescription>Station and pricing details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="numStations">Number of Gaming Stations</Label>
                    <Input
                      id="numStations"
                      type="number"
                      value={inputs.numStations}
                      onChange={(e) => handleInputChange('numStations', e.target.value)}
                      data-testid="input-num-stations"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pricePerHour">Price per Hour ($)</Label>
                    <Input
                      id="pricePerHour"
                      type="number"
                      value={inputs.pricePerHour}
                      onChange={(e) => handleInputChange('pricePerHour', e.target.value)}
                      data-testid="input-price-per-hour"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hoursPerDay">Hours Open per Day</Label>
                    <Input
                      id="hoursPerDay"
                      type="number"
                      value={inputs.hoursPerDay}
                      onChange={(e) => handleInputChange('hoursPerDay', e.target.value)}
                      data-testid="input-hours-per-day"
                    />
                  </div>
                  <div>
                    <Label htmlFor="daysPerMonth">Days per Month</Label>
                    <Input
                      id="daysPerMonth"
                      type="number"
                      value={inputs.daysPerMonth}
                      onChange={(e) => handleInputChange('daysPerMonth', e.target.value)}
                      data-testid="input-days-per-month"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weekdayUtilization">Weekday Utilization (%)</Label>
                    <Input
                      id="weekdayUtilization"
                      type="number"
                      value={inputs.weekdayUtilization}
                      onChange={(e) => handleInputChange('weekdayUtilization', e.target.value)}
                      data-testid="input-weekday-utilization"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weekendUtilization">Weekend Utilization (%)</Label>
                    <Input
                      id="weekendUtilization"
                      type="number"
                      value={inputs.weekendUtilization}
                      onChange={(e) => handleInputChange('weekendUtilization', e.target.value)}
                      data-testid="input-weekend-utilization"
                    />
                  </div>
                  <div>
                    <Label htmlFor="avgSessionLength">Avg Session Length (hours)</Label>
                    <Input
                      id="avgSessionLength"
                      type="number"
                      step="0.5"
                      value={inputs.avgSessionLength}
                      onChange={(e) => handleInputChange('avgSessionLength', e.target.value)}
                      data-testid="input-avg-session-length"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Revenue</CardTitle>
                  <CardDescription>Other income streams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="avgFBSpend">Avg F&B Spend per Customer ($)</Label>
                    <Input
                      id="avgFBSpend"
                      type="number"
                      value={inputs.avgFBSpend}
                      onChange={(e) => handleInputChange('avgFBSpend', e.target.value)}
                      data-testid="input-avg-fb-spend"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventRevenue">Monthly Event Revenue ($)</Label>
                    <Input
                      id="eventRevenue"
                      type="number"
                      value={inputs.eventRevenue}
                      onChange={(e) => handleInputChange('eventRevenue', e.target.value)}
                      data-testid="input-event-revenue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="membershipRevenue">Monthly Membership Revenue ($)</Label>
                    <Input
                      id="membershipRevenue"
                      type="number"
                      value={inputs.membershipRevenue}
                      onChange={(e) => handleInputChange('membershipRevenue', e.target.value)}
                      data-testid="input-membership-revenue"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Operating Costs</CardTitle>
                  <CardDescription>Recurring expenses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="rent">Rent ($)</Label>
                    <Input
                      id="rent"
                      type="number"
                      value={inputs.rent}
                      onChange={(e) => handleInputChange('rent', e.target.value)}
                      data-testid="input-rent"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salaries">Salaries ($)</Label>
                    <Input
                      id="salaries"
                      type="number"
                      value={inputs.salaries}
                      onChange={(e) => handleInputChange('salaries', e.target.value)}
                      data-testid="input-salaries"
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurance">Insurance ($)</Label>
                    <Input
                      id="insurance"
                      type="number"
                      value={inputs.insurance}
                      onChange={(e) => handleInputChange('insurance', e.target.value)}
                      data-testid="input-insurance"
                    />
                  </div>
                  <div>
                    <Label htmlFor="internet">High-Speed Internet ($)</Label>
                    <Input
                      id="internet"
                      type="number"
                      value={inputs.internet}
                      onChange={(e) => handleInputChange('internet', e.target.value)}
                      data-testid="input-internet"
                    />
                  </div>
                  <div>
                    <Label htmlFor="softwareLicenses">Software/Game Licenses ($)</Label>
                    <Input
                      id="softwareLicenses"
                      type="number"
                      value={inputs.softwareLicenses}
                      onChange={(e) => handleInputChange('softwareLicenses', e.target.value)}
                      data-testid="input-software-licenses"
                    />
                  </div>
                  <div>
                    <Label htmlFor="utilities">Utilities ($)</Label>
                    <Input
                      id="utilities"
                      type="number"
                      value={inputs.utilities}
                      onChange={(e) => handleInputChange('utilities', e.target.value)}
                      data-testid="input-utilities"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maintenance">Maintenance/Repairs ($)</Label>
                    <Input
                      id="maintenance"
                      type="number"
                      value={inputs.maintenance}
                      onChange={(e) => handleInputChange('maintenance', e.target.value)}
                      data-testid="input-maintenance"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marketingMonthly">Monthly Marketing ($)</Label>
                    <Input
                      id="marketingMonthly"
                      type="number"
                      value={inputs.marketingMonthly}
                      onChange={(e) => handleInputChange('marketingMonthly', e.target.value)}
                      data-testid="input-marketing-monthly"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fbCostPercent">F&B Cost Percentage (%)</Label>
                    <Input
                      id="fbCostPercent"
                      type="number"
                      value={inputs.fbCostPercent}
                      onChange={(e) => handleInputChange('fbCostPercent', e.target.value)}
                      data-testid="input-fb-cost-percent"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <Button 
                onClick={calculateROI} 
                size="lg" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                data-testid="button-calculate-roi"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculate ROI
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="results">
            {results ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Total Investment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="text-total-investment">
                      ${results.totalStartupCost.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Monthly Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="text-monthly-revenue">
                      ${results.totalMonthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Monthly Costs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="text-monthly-costs">
                      ${results.totalMonthlyOperatingCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Monthly Profit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="text-monthly-profit">
                      ${results.monthlyNetProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-sm mt-2 opacity-90">
                      {results.profitMargin.toFixed(1)}% profit margin
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Annual ROI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="text-annual-roi">
                      {results.annualROI.toFixed(1)}%
                    </p>
                    <p className="text-sm mt-2 opacity-90">
                      {results.monthlyROI.toFixed(2)}% monthly
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Break-Even
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold" data-testid="text-break-even">
                      {results.breakEvenMonths.toFixed(1)} months
                    </p>
                  </CardContent>
                </Card>

                <Card className="col-span-full">
                  <CardHeader>
                    <CardTitle>Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Gaming Revenue</span>
                        <span className="font-bold" data-testid="text-gaming-revenue">
                          ${results.monthlyGamingRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Food & Beverage</span>
                        <span className="font-bold" data-testid="text-fb-revenue">
                          ${results.monthlyFBRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Events</span>
                        <span className="font-bold" data-testid="text-event-revenue">
                          ${results.monthlyEventRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Memberships</span>
                        <span className="font-bold" data-testid="text-membership-revenue">
                          ${results.monthlyMembershipRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t">
                        <span className="font-bold">Revenue per Station</span>
                        <span className="font-bold text-lg" data-testid="text-revenue-per-station">
                          ${results.revenuePerStation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calculator className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground" data-testid="text-no-results">
                    No results yet. Go to the Inputs tab and click Calculate ROI.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="charts">
            {results ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={revenueData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {revenueData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cost Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={costData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {costData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="col-span-full">
                  <CardHeader>
                    <CardTitle>12-Month Cash Flow Projection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={cashFlowData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" strokeWidth={2} />
                        <Line type="monotone" dataKey="costs" stroke="#ef4444" name="Costs" strokeWidth={2} />
                        <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Profit" strokeWidth={2} />
                        <Line type="monotone" dataKey="cumulative" stroke="#8b5cf6" name="Cumulative Profit" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="col-span-full">
                  <CardHeader>
                    <CardTitle>Revenue vs Costs Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { name: 'Monthly', Revenue: results.totalMonthlyRevenue, Costs: results.totalMonthlyOperatingCosts, Profit: results.monthlyNetProfit }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                        <Legend />
                        <Bar dataKey="Revenue" fill="#10b981" />
                        <Bar dataKey="Costs" fill="#ef4444" />
                        <Bar dataKey="Profit" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calculator className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground" data-testid="text-no-charts">
                    No data to display. Go to the Inputs tab and click Calculate ROI.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
