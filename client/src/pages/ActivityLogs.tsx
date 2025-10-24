import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Search, Filter, X, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import type { ActivityLog } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ActivityLogs() {
  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (logId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

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

  const uniqueActions = useMemo(() => {
    if (!logs) return [];
    return Array.from(new Set(logs.map(log => log.action)));
  }, [logs]);

  const uniqueEntities = useMemo(() => {
    if (!logs) return [];
    return Array.from(new Set(logs.map(log => log.entityType).filter(Boolean))) as string[];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    return logs.filter(log => {
      const matchesSearch = searchQuery === "" || 
        log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.entityType?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === "all" || log.userRole === roleFilter;
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesEntity = entityFilter === "all" || (log.entityType || "") === entityFilter;
      
      return matchesSearch && matchesRole && matchesAction && matchesEntity;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [logs, searchQuery, roleFilter, actionFilter, entityFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setActionFilter("all");
    setEntityFilter("all");
  };

  const hasActiveFilters = searchQuery !== "" || roleFilter !== "all" || actionFilter !== "all" || entityFilter !== "all";

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Activity History</h1>
          <p className="text-muted-foreground">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6" data-testid="page-activity-logs">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-page-title">Activity History</h1>
        <p className="text-sm md:text-base text-muted-foreground">View and filter all admin and staff activity</p>
      </div>

      <Card data-testid="card-filters">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Search and filter activity logs by user, action, or entity type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, entity, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger data-testid="select-role-filter">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin Only</SelectItem>
                <SelectItem value="staff">Staff Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger data-testid="select-action-filter">
                <SelectValue placeholder="Filter by Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger data-testid="select-entity-filter">
                <SelectValue placeholder="Filter by Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {uniqueEntities.map(entity => (
                  <SelectItem key={entity} value={entity}>
                    {entity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredLogs.length}</span> of <span className="font-medium text-foreground">{logs?.length || 0}</span> logs
            </span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                Filtered
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card data-testid="card-activity-table">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl">Activity Logs</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            All activity sorted by most recent. Click on details to expand.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground" data-testid="text-no-logs">
                {hasActiveFilters ? "No logs match your filters" : "No activity logs yet"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full">
              <div className="min-w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[140px]">Time</TableHead>
                      <TableHead className="min-w-[120px]">User</TableHead>
                      <TableHead className="min-w-[100px]">Action</TableHead>
                      <TableHead className="min-w-[100px]">Entity</TableHead>
                      <TableHead className="min-w-[250px]">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const isExpanded = expandedRows.has(log.id);
                      const hasDetails = log.details && log.details.length > 0;
                      const shouldTruncate = log.details && log.details.length > 80;
                      
                      return (
                        <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                          <TableCell className="font-medium text-xs md:text-sm whitespace-nowrap" data-testid={`text-time-${log.id}`}>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-muted-foreground hidden md:inline" />
                              {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            <div className="flex flex-col gap-1">
                              <span data-testid={`text-username-${log.id}`} className="font-medium">
                                {log.username}
                              </span>
                              <div>{getRoleBadge(log.userRole)}</div>
                            </div>
                          </TableCell>
                          <TableCell data-testid={`badge-action-${log.id}`}>
                            {getActionBadge(log.action, log.userRole)}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm" data-testid={`text-entity-${log.id}`}>
                            <Badge variant="outline" className="text-xs">
                              {log.entityType || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs md:text-sm" data-testid={`text-details-${log.id}`}>
                            {!hasDetails ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <div className="space-y-2">
                                <p className={`break-words ${!isExpanded && shouldTruncate ? 'line-clamp-2' : ''}`}>
                                  {log.details}
                                </p>
                                {shouldTruncate && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleRowExpansion(log.id)}
                                    className="h-6 px-2 text-xs"
                                    data-testid={`button-toggle-details-${log.id}`}
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="h-3 w-3 mr-1" />
                                        Show Less
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        Show More
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
