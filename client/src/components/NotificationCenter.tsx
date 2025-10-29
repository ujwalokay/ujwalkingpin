import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, X, Check, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@shared/schema";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 10000,
  });

  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 10000,
  });

  const unreadCount = unreadCountData?.count || 0;
  
  const visibleNotifications = notifications;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(`/api/notifications/${id}/read`, "PATCH"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/notifications/read-all", "PATCH"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(`/api/notifications/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const filteredNotifications = notifications
    .filter(n => activeTab === "unread" ? n.isRead === 0 : true);

  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const notificationDate = new Date(notification.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let group = "Older";
    if (notificationDate.toDateString() === today.toDateString()) {
      group = "Today";
    } else if (notificationDate.toDateString() === yesterday.toDateString()) {
      group = "Yesterday";
    }

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return "📅";
      case "payment":
        return "💰";
      case "inventory":
        return "📦";
      case "activity":
        return "📝";
      case "expense":
        return "💳";
      case "alert":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-unread-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                className="h-8 text-xs"
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all" data-testid="tab-all-notifications">
                All notifications
                {visibleNotifications.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {visibleNotifications.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread" data-testid="tab-unread-notifications">
                Unread
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="m-0 mt-2">
            <ScrollArea className="h-[calc(100vh-140px)]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm">
                    {activeTab === "unread" 
                      ? "No unread notifications" 
                      : "No notifications yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
                    <div key={group} className="px-4">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                        {group}
                      </p>
                      <div className="space-y-2">
                        {groupNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-lg border transition-colors ${
                              notification.isRead === 0
                                ? "bg-primary/5 border-primary/20"
                                : "bg-card hover:bg-accent"
                            }`}
                            data-testid={`notification-${notification.id}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="text-2xl flex-shrink-0">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium">
                                        {notification.title}
                                      </p>
                                      {notification.isRead === 0 && (
                                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {formatDistanceToNow(new Date(notification.createdAt), {
                                        addSuffix: true,
                                      })}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {notification.isRead === 0 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => markAsReadMutation.mutate(notification.id)}
                                        data-testid={`button-mark-read-${notification.id}`}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                      data-testid={`button-delete-${notification.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
