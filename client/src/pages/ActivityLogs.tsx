import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { ActivityLog } from "@shared/schema";

export default function ActivityLogs() {
  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  const getActionBadge = (action: string, role: string) => {
    if (action === "login") {
      return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">Login</Badge>;
    }
    if (action === "create") {
      return <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Created</Badge>;
    }
    if (action === "update") {
      return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">Updated</Badge>;
    }
    if (action === "delete") {
      return <Badge variant="outline" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">Deleted</Badge>;
    }
    return <Badge variant="outline">{action}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return <Badge className="bg-purple-600 dark:bg-purple-700">Admin</Badge>;
    }
    return <Badge variant="secondary">Staff</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity History</h1>
          <p className="text-muted-foreground">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  const adminLogs = logs?.filter(log => log.userRole === "admin") || [];
  const staffLogs = logs?.filter(log => log.userRole === "staff") || [];

  return (
    <div className="p-6 space-y-6" data-testid="page-activity-logs">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Activity History</h1>
        <p className="text-muted-foreground">View all admin changes and staff deletions</p>
      </div>

      {/* Admin Activity */}
      <Card data-testid="card-admin-activity">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Admin Activity
            <Badge className="bg-purple-600 dark:bg-purple-700">{adminLogs.length}</Badge>
          </CardTitle>
          <CardDescription>All actions performed by admin users</CardDescription>
        </CardHeader>
        <CardContent>
          {adminLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-no-admin-logs">No admin activity yet</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-admin-log-${log.id}`}>
                      <TableCell className="font-medium" data-testid={`text-time-${log.id}`}>
                        {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span data-testid={`text-username-${log.id}`}>{log.username}</span>
                          {getRoleBadge(log.userRole)}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`badge-action-${log.id}`}>
                        {getActionBadge(log.action, log.userRole)}
                      </TableCell>
                      <TableCell data-testid={`text-entity-${log.id}`}>
                        {log.entityType || "-"}
                      </TableCell>
                      <TableCell className="max-w-md truncate" data-testid={`text-details-${log.id}`}>
                        {log.details || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Activity */}
      <Card data-testid="card-staff-activity">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Staff Activity
            <Badge variant="secondary">{staffLogs.length}</Badge>
          </CardTitle>
          <CardDescription>All actions performed by staff users</CardDescription>
        </CardHeader>
        <CardContent>
          {staffLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="text-no-staff-logs">No staff activity yet</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-staff-log-${log.id}`}>
                      <TableCell className="font-medium" data-testid={`text-time-${log.id}`}>
                        {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span data-testid={`text-username-${log.id}`}>{log.username}</span>
                          {getRoleBadge(log.userRole)}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`badge-action-${log.id}`}>
                        {getActionBadge(log.action, log.userRole)}
                      </TableCell>
                      <TableCell data-testid={`text-entity-${log.id}`}>
                        {log.entityType || "-"}
                      </TableCell>
                      <TableCell className="max-w-md truncate" data-testid={`text-details-${log.id}`}>
                        {log.details || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
