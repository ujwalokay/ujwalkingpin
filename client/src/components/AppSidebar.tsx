import { Settings, LayoutDashboard, FileText, UtensilsCrossed, CalendarClock, History, Scale, Wallet, ScrollText, Award, BarChart3, Gamepad2, Sparkles, LogOut, Brain } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import logoDark from "@assets/WhatsApp_Image_2025-10-22_at_11.12.35_515bc8bb-removebg-preview_1761111967877.png";
import logoLight from "@assets/WhatsApp_Image_2025-10-22_at_11.12.35_515bc8bb-removebg-preview_1761111967877.png";

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
    title: "AI Maintenance",
    url: "/ai-maintenance",
    icon: Brain,
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
    <Sidebar className="border-r bg-white dark:bg-gray-950">
      <SidebarContent>
        {/* Logo Section */}
        <SidebarGroup>
          <div className="flex items-center gap-3 px-4 py-6 border-b border-gray-200 dark:border-gray-800">
            <img 
              src={theme === "dark" ? logoDark : logoLight} 
              alt="Ankylo Gaming Logo" 
              className="h-10 w-10 sm:h-12 sm:w-12 object-cover rounded-xl"
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Ankylo Gaming</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
            </div>
          </div>
        </SidebarGroup>

        {/* Menu Items */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                const hasAI = ['Analytics', 'AI Maintenance'].includes(item.title);
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={isActive ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 font-medium hover:bg-purple-100 dark:hover:bg-purple-950/50' : ''}
                      data-testid={`link-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className={isActive ? 'text-purple-600 dark:text-purple-400' : ''} />
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

      {/* Logout Button */}
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
