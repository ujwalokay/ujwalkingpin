import { Settings, LayoutDashboard, FileText, UtensilsCrossed, CalendarClock, History, Scale, Wallet, ScrollText, Award, BarChart3, Gamepad2, Sparkles, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import logoDark from "@assets/20251020_115324_1760941507517.png";
import logoLight from "@assets/20251020_115324_1760941507517.png";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Timeline",
    url: "/timeline",
    icon: CalendarClock,
  },
  {
    title: "History",
    url: "/history",
    icon: History,
  },
  {
    title: "Activity Logs",
    url: "/activity-logs",
    icon: ScrollText,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Food",
    url: "/food",
    icon: UtensilsCrossed,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Wallet,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
  },
  {
    title: "Terms & Conditions",
    url: "/terms",
    icon: Scale,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { theme } = useTheme();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // Try Google logout first
      window.location.href = "/api/auth/google/logout";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Sidebar className="glass border-r">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-3 px-4 py-6">
            <img 
              src={theme === "dark" ? logoDark : logoLight} 
              alt="Ankylo Gaming Logo" 
              className="h-12 w-12 object-cover rounded-xl"
            />
            <div>
              <h2 className="text-lg font-bold text-foreground">Ankylo Gaming</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const hasAI = ['Analytics'].includes(item.title);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                      <Link href={item.url}>
                        <item.icon />
                        <span className="flex items-center gap-1.5">
                          {item.title}
                          {hasAI && (
                            <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
                          )}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} data-testid="button-logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
