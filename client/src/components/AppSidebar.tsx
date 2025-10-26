import { Settings, LayoutDashboard, FileText, UtensilsCrossed, CalendarClock, History, Scale, Wallet, ScrollText, Award, BarChart3, Gamepad2, Sparkles, LogOut, Brain, Package } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import logoDark from "@assets/airavoto_logo.png";
import logoLight from "@assets/airavoto_logo.png";
import type { FoodItem, Expense } from "@shared/schema";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  countKey?: string;
  hasAI?: boolean;
  adminOnly?: boolean;
}

interface MenuCategory {
  label: string;
  items: MenuItem[];
}

const menuCategories: MenuCategory[] = [
  {
    label: "Main Menu",
    items: [
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
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Food",
        url: "/food",
        icon: UtensilsCrossed,
      },
      {
        title: "Inventory",
        url: "/inventory",
        icon: Package,
        countKey: "lowStock",
      },
      {
        title: "Expenses",
        url: "/expenses",
        icon: Wallet,
      },
      {
        title: "Loyalty & Rewards",
        url: "/loyalty",
        icon: Award,
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
        hasAI: true,
      },
      {
        title: "Reports",
        url: "/reports",
        icon: FileText,
        adminOnly: true,
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        title: "AI Maintenance",
        url: "/ai-maintenance",
        icon: Brain,
        hasAI: true,
      },
      {
        title: "Activity Logs",
        url: "/activity-logs",
        icon: ScrollText,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
      },
      {
        title: "Terms & Conditions",
        url: "/terms",
        icon: Scale,
        adminOnly: true,
      },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { theme } = useTheme();
  const { toast } = useToast();
  const { isStaff } = useAuth();

  const { data: foodItems = [] } = useQuery<FoodItem[]>({
    queryKey: ["/api/food"],
  });

  const lowStockCount = foodItems.filter(
    item => item.currentStock <= item.minStockLevel && item.category === "trackable"
  ).length;

  const counts = {
    lowStock: lowStockCount,
  };

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
        <SidebarGroup>
          <div className="flex items-center gap-3 px-4 py-6 border-b border-gray-200 dark:border-gray-800">
            <img 
              src={theme === "dark" ? logoDark : logoLight} 
              alt="Airavoto Gaming Logo" 
              className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Airavoto Gaming</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</p>
            </div>
          </div>
        </SidebarGroup>

        {menuCategories.map((category) => {
          const filteredItems = category.items.filter((item) => {
            if (isStaff && item.adminOnly) {
              return false;
            }
            return true;
          });

          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={category.label}>
              <SidebarGroupLabel className="text-xs text-gray-500 dark:text-gray-400 px-4 py-2">
                {category.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => {
                    const isActive = location === item.url;
                    const count = item.countKey ? counts[item.countKey as keyof typeof counts] : 0;
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className={isActive ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 font-medium hover:bg-purple-100 dark:hover:bg-purple-950/50' : ''}
                          data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Link href={item.url}>
                            <item.icon className={isActive ? 'text-purple-600 dark:text-purple-400' : ''} />
                            <span className="flex items-center gap-1.5 flex-1">
                              {item.title}
                              {item.hasAI && (
                                <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
                              )}
                            </span>
                            {count > 0 && (
                              <Badge 
                                variant="secondary" 
                                className="ml-auto bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0"
                              >
                                {count}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
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
