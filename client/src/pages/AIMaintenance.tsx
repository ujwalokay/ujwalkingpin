import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Brain, AlertTriangle, CheckCircle2, Clock, Wrench, RefreshCw, TrendingUp, AlertCircle, Bug, Zap, Info } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface MaintenancePrediction {
  category: string;
  seatName: string;
  riskLevel: "low" | "medium" | "high";
  recommendedAction: string;
  estimatedDaysUntilMaintenance: number;
  reasoning: string;
  metrics: {
    usageHours: number;
    totalSessions: number;
    issuesReported: number;
    daysSinceLastMaintenance: number | null;
  };
}

interface AIMaintenanceInsights {
  predictions: MaintenancePrediction[];
  summary: {
    highRiskDevices: number;
    mediumRiskDevices: number;
    lowRiskDevices: number;
    totalDevices: number;
    recommendedActions: string[];
  };
  generatedAt: string;
}


export default function AIMaintenance() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingProgress, setLoadingProgress] = useState(0);

  const { data: insights, isLoading, refetch } = useQuery<AIMaintenanceInsights>({
    queryKey: ["/api/ai/maintenance/predictions"],
  });


  useEffect(() => {
    if (isLoading) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [isLoading]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ category, seatName, status, notes }: { category: string; seatName: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/maintenance/${category}/${encodeURIComponent(seatName)}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/maintenance/predictions"] });
      toast({
        title: "Status Updated",
        description: "Device maintenance status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update device status.",
        variant: "destructive",
      });
    },
  });

  const reportIssueMutation = useMutation({
    mutationFn: async ({ category, seatName, issueType }: { category: string; seatName: string; issueType: string }) => {
      const response = await fetch(`/api/maintenance/${category}/${encodeURIComponent(seatName)}/report-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueType }),
      });
      if (!response.ok) throw new Error("Failed to report issue");
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/maintenance/predictions"] });
      toast({
        title: "Issue Reported",
        description: data.aiSuggestion || "Issue has been recorded and AI will analyze the device.",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Report Failed",
        description: error.message || "Failed to report issue.",
        variant: "destructive",
      });
    },
  });

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />High Risk</Badge>;
      case "medium":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700 gap-1"><Clock className="h-3 w-3" />Medium Risk</Badge>;
      case "low":
        return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Low Risk</Badge>;
      default:
        return <Badge variant="outline">{riskLevel}</Badge>;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high": return "border-red-500 dark:border-red-900 bg-red-50 dark:bg-red-950/20";
      case "medium": return "border-yellow-500 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/20";
      case "low": return "border-green-500 dark:border-green-900 bg-green-50 dark:bg-green-950/20";
      default: return "";
    }
  };

  const highRiskDevices = insights?.predictions.filter(p => p.riskLevel === "high") || [];
  const mediumRiskDevices = insights?.predictions.filter(p => p.riskLevel === "medium") || [];
  const lowRiskDevices = insights?.predictions.filter(p => p.riskLevel === "low") || [];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Predictive Maintenance
          </h1>
          <p className="text-muted-foreground mb-4">Analyzing device usage and generating predictions...</p>
          <div className="space-y-2">
            <Progress value={loadingProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">Processing {loadingProgress}%</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6" data-testid="page-ai-maintenance">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <Brain className="h-8 w-8 text-purple-600" />
            Ankylo AI - Predictive Maintenance
          </h1>
          <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2 mt-1">
            <Sparkles className="h-4 w-4 text-purple-500" />
            Custom calculation-based device health analysis and predictions
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="gap-2"
          data-testid="button-refresh-predictions"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Predictions
        </Button>
      </div>

      {/* Ankylo AI Info */}
      <Alert className="border-cyan-500/50 bg-cyan-50 dark:bg-cyan-950/20">
        <Zap className="h-4 w-4 text-cyan-600" />
        <AlertDescription className="text-sm">
          <div className="flex items-center justify-between">
            <div>
              <strong className="font-semibold text-cyan-900 dark:text-cyan-100">Ankylo AI System:</strong>
              <span className="ml-2 text-cyan-800 dark:text-cyan-200">
                Using accurate calculations based on your real gaming center data
              </span>
            </div>
            <Badge className="ml-2 bg-cyan-600 hover:bg-cyan-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
          <p className="text-xs text-cyan-700 dark:text-cyan-300 mt-2">
            ✓ No external AI services - 100% accurate predictions using mathematical formulas based on usage hours, sessions, issues, and maintenance history
          </p>
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.summary.totalDevices || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-red-500/50 dark:border-red-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {insights?.summary.highRiskDevices || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/50 dark:border-yellow-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Medium Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {insights?.summary.mediumRiskDevices || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/50 dark:border-green-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Healthy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {insights?.summary.lowRiskDevices || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {insights && insights.summary.recommendedActions.length > 0 && (
        <Alert className="border-purple-500/50 bg-purple-50 dark:bg-purple-950/20">
          <TrendingUp className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-sm">
            <strong className="font-semibold text-purple-900 dark:text-purple-100">Ankylo AI Recommendations:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              {insights.summary.recommendedActions.map((action, idx) => (
                <li key={idx} className="text-purple-800 dark:text-purple-200">{action}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Device Predictions Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="high" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
            High Risk ({highRiskDevices.length})
          </TabsTrigger>
          <TabsTrigger value="medium" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
            Medium ({mediumRiskDevices.length})
          </TabsTrigger>
          <TabsTrigger value="low">Healthy ({lowRiskDevices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Devices</CardTitle>
              <CardDescription>Complete overview of all device health predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full">
                <div className="space-y-3">
                  {insights?.predictions.map((prediction, idx) => (
                    <DevicePredictionCard
                      key={idx}
                      prediction={prediction}
                      getRiskBadge={getRiskBadge}
                      getRiskColor={getRiskColor}
                      updateStatusMutation={updateStatusMutation}
                      reportIssueMutation={reportIssueMutation}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high" className="space-y-4 mt-4">
          <ScrollArea className="h-[600px] w-full">
            <div className="space-y-3">
              {highRiskDevices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No high-risk devices found</p>
              ) : (
                highRiskDevices.map((prediction, idx) => (
                  <DevicePredictionCard
                    key={idx}
                    prediction={prediction}
                    getRiskBadge={getRiskBadge}
                    getRiskColor={getRiskColor}
                    updateStatusMutation={updateStatusMutation}
                    reportIssueMutation={reportIssueMutation}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="medium" className="space-y-4 mt-4">
          <ScrollArea className="h-[600px] w-full">
            <div className="space-y-3">
              {mediumRiskDevices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No medium-risk devices found</p>
              ) : (
                mediumRiskDevices.map((prediction, idx) => (
                  <DevicePredictionCard
                    key={idx}
                    prediction={prediction}
                    getRiskBadge={getRiskBadge}
                    getRiskColor={getRiskColor}
                    updateStatusMutation={updateStatusMutation}
                    reportIssueMutation={reportIssueMutation}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="low" className="space-y-4 mt-4">
          <ScrollArea className="h-[600px] w-full">
            <div className="space-y-3">
              {lowRiskDevices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No healthy devices found</p>
              ) : (
                lowRiskDevices.map((prediction, idx) => (
                  <DevicePredictionCard
                    key={idx}
                    prediction={prediction}
                    getRiskBadge={getRiskBadge}
                    getRiskColor={getRiskColor}
                    updateStatusMutation={updateStatusMutation}
                    reportIssueMutation={reportIssueMutation}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DevicePredictionCard({
  prediction,
  getRiskBadge,
  getRiskColor,
  updateStatusMutation,
  reportIssueMutation,
}: {
  prediction: MaintenancePrediction;
  getRiskBadge: (level: string) => JSX.Element;
  getRiskColor: (level: string) => string;
  updateStatusMutation: any;
  reportIssueMutation: any;
}) {
  return (
    <Card className={`${getRiskColor(prediction.riskLevel)} border-2`} data-testid={`card-device-${prediction.category}-${prediction.seatName}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {prediction.category} - {prediction.seatName}
            </CardTitle>
            <CardDescription className="mt-1">{getRiskBadge(prediction.riskLevel)}</CardDescription>
          </div>
          {prediction.riskLevel === "high" && (
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 animate-pulse" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Usage Hours</p>
            <p className="font-semibold">{prediction.metrics.usageHours.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Sessions</p>
            <p className="font-semibold">{prediction.metrics.totalSessions}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Issues</p>
            <p className="font-semibold">{prediction.metrics.issuesReported}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Last Service</p>
            <p className="font-semibold">
              {prediction.metrics.daysSinceLastMaintenance ? `${prediction.metrics.daysSinceLastMaintenance}d ago` : 'Never'}
            </p>
          </div>
        </div>

        <div className="bg-background/50 dark:bg-background/30 p-3 rounded-lg">
          <p className="text-sm font-medium mb-1">Ankylo AI Analysis:</p>
          <p className="text-sm text-muted-foreground">{prediction.reasoning}</p>
        </div>

        <div className="space-y-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{prediction.recommendedAction}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Est. {prediction.estimatedDaysUntilMaintenance} days until next service
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2 flex-1 min-w-[140px]"
              onClick={() =>
                updateStatusMutation.mutate({
                  category: prediction.category,
                  seatName: prediction.seatName,
                  status: "healthy",
                  notes: "Maintenance completed via AI predictions",
                })
              }
              data-testid={`button-mark-maintained-${prediction.category}-${prediction.seatName}`}
            >
              <Wrench className="h-4 w-4" />
              Mark Maintained
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="gap-2 flex-1 min-w-[140px] border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              onClick={() =>
                reportIssueMutation.mutate({
                  category: prediction.category,
                  seatName: prediction.seatName,
                  issueType: "repair",
                })
              }
              disabled={reportIssueMutation.isPending}
              data-testid={`button-report-repair-${prediction.category}-${prediction.seatName}`}
            >
              <AlertCircle className="h-4 w-4" />
              Needs Repair
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="gap-2 flex-1 min-w-[140px] border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              onClick={() =>
                reportIssueMutation.mutate({
                  category: prediction.category,
                  seatName: prediction.seatName,
                  issueType: "glitch",
                })
              }
              disabled={reportIssueMutation.isPending}
              data-testid={`button-report-glitch-${prediction.category}-${prediction.seatName}`}
            >
              <Bug className="h-4 w-4" />
              Has Glitch
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
