import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Database, HardDrive, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

interface DatabaseMetrics {
  name: string;
  projectId: string;
  storageBytes: number;
  storageMB: number;
  limitMB: number;
  percentUsed: number;
  computeTimeSeconds: number;
  activeTimeSeconds: number;
  quotaResetAt: string | null;
}

interface StorageMetricsResponse {
  databases: DatabaseMetrics[];
  totalStorageMB: number;
  totalLimitMB: number;
  totalPercentUsed: number;
  lastUpdated: string;
}

export default function Settings() {
  const { data: metrics, isLoading, error, refetch } = useQuery<StorageMetricsResponse>({
    queryKey: ["/api/storage/metrics"],
    refetchInterval: 60000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/storage/metrics"] });
  };

  const getStatusColor = (percentUsed: number) => {
    if (percentUsed >= 90) return "text-red-500";
    if (percentUsed >= 75) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusIcon = (percentUsed: number) => {
    if (percentUsed >= 90) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (percentUsed >= 75) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const getProgressColor = (percentUsed: number) => {
    if (percentUsed >= 90) return "[&>*]:bg-red-500";
    if (percentUsed >= 75) return "[&>*]:bg-yellow-500";
    return "[&>*]:bg-green-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading storage metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Metrics</CardTitle>
            <CardDescription>Failed to fetch storage metrics. Please ensure NEON_API_KEY is configured correctly.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Unknown error'}</p>
            <Button onClick={handleRefresh} className="mt-4" data-testid="button-retry">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings and monitor storage</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Total Storage Usage
              </CardTitle>
              <CardDescription>
                Across all 6 Neon free databases
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg" data-testid="badge-total-usage">
              {metrics.totalStorageMB.toFixed(2)} MB / {metrics.totalLimitMB} MB
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Progress</span>
              <span className={`text-sm font-bold ${getStatusColor(metrics.totalPercentUsed)}`} data-testid="text-total-percent">
                {metrics.totalPercentUsed.toFixed(2)}%
              </span>
            </div>
            <Progress value={metrics.totalPercentUsed} className={`h-3 ${getProgressColor(metrics.totalPercentUsed)}`} data-testid="progress-total" />
          </div>
          <p className="text-xs text-muted-foreground" data-testid="text-last-updated">
            Last updated: {formatDate(metrics.lastUpdated)}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.databases.map((db, index) => (
          <Card key={db.projectId} className="hover-elevate" data-testid={`card-database-${index}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {db.name}
                </CardTitle>
                {getStatusIcon(db.percentUsed)}
              </div>
              <CardDescription className="text-xs truncate" data-testid={`text-project-id-${index}`}>
                {db.projectId}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <span className={`text-sm font-medium ${getStatusColor(db.percentUsed)}`} data-testid={`text-storage-${index}`}>
                    {db.storageMB.toFixed(2)} / {db.limitMB} MB
                  </span>
                </div>
                <Progress value={db.percentUsed} className={`h-2 ${getProgressColor(db.percentUsed)}`} data-testid={`progress-storage-${index}`} />
                <p className={`text-xs text-right mt-1 ${getStatusColor(db.percentUsed)}`} data-testid={`text-percent-${index}`}>
                  {db.percentUsed.toFixed(2)}% used
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                <div>
                  <p className="text-muted-foreground">Compute</p>
                  <p className="font-medium" data-testid={`text-compute-${index}`}>
                    {(db.computeTimeSeconds / 3600).toFixed(2)}h
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Active</p>
                  <p className="font-medium" data-testid={`text-active-${index}`}>
                    {(db.activeTimeSeconds / 3600).toFixed(2)}h
                  </p>
                </div>
              </div>

              {db.quotaResetAt && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Quota resets</p>
                  <p className="text-xs font-medium" data-testid={`text-quota-reset-${index}`}>
                    {formatDate(db.quotaResetAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {metrics.totalPercentUsed >= 75 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
              <AlertTriangle className="h-5 w-5" />
              Storage Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              You're using {metrics.totalPercentUsed.toFixed(2)}% of your total storage across all databases.
              {metrics.totalPercentUsed >= 90 ? (
                <span className="block mt-2 text-red-600 dark:text-red-500 font-medium">
                  ⚠️ Critical: Consider upgrading to a paid plan or optimizing your data.
                </span>
              ) : (
                <span className="block mt-2">
                  Consider monitoring your usage more closely and planning for future needs.
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
