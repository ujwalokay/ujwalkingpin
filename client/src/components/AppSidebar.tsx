import { Settings, LayoutDashboard, FileText, UtensilsCrossed, CalendarClock, History, Scale, Wallet, ScrollText, Award, BarChart3, Gamepad2, Sparkles, LogOut, Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <div className={`relative h-screen flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Sidebar Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-600 to-purple-700 dark:from-purple-700 dark:via-purple-700 dark:to-purple-800"></div>
      
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-50 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        data-testid="button-toggle-sidebar"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Logo Section */}
      <div className={`relative flex items-center gap-3 p-6 ${isCollapsed ? 'justify-center px-4' : ''}`}>
        <img 
          src={theme === "dark" ? logoDark : logoLight} 
          alt="Ankylo Gaming Logo" 
          className={`object-cover rounded-xl transition-all ${isCollapsed ? 'h-10 w-10' : 'h-12 w-12'}`}
        />
        {!isCollapsed && (
          <div className="text-white">
            <h2 className="text-lg font-bold">Ankylo Gaming</h2>
            <p className="text-xs text-purple-100">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="relative flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.url;
            const hasAI = ['Analytics', 'AI Maintenance'].includes(item.title);
            
            return (
              <li key={item.title} className="relative">
                {/* Curved Background for Active Item */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-l-xl"></div>
                    <div className="absolute -top-4 right-0 w-4 h-4">
                      <div className="absolute inset-0 bg-transparent rounded-br-xl shadow-[0_8px_0_0_white] dark:shadow-[0_8px_0_0_rgb(17,24,39)]"></div>
                    </div>
                    <div className="absolute -bottom-4 right-0 w-4 h-4">
                      <div className="absolute inset-0 bg-transparent rounded-tr-xl shadow-[0_-8px_0_0_white] dark:shadow-[0_-8px_0_0_rgb(17,24,39)]"></div>
                    </div>
                  </>
                )}
                
                <Link href={item.url}>
                  <div
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-l-xl transition-all cursor-pointer group ${
                      isActive 
                        ? 'text-purple-600 dark:text-purple-500' 
                        : 'text-white hover:bg-white/10'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <item.icon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
                    {!isCollapsed && (
                      <span className="font-medium flex items-center gap-1.5">
                        {item.title}
                        {hasAI && (
                          <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" />
                        )}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="relative p-3">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-all ${
            isCollapsed ? 'justify-center' : ''
          }`}
          data-testid="button-logout"
        >
          <LogOut className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}
