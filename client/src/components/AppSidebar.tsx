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
    <div className={`relative h-screen flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16 sm:w-20' : 'w-56 sm:w-64'}`}>
      {/* Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/95 via-violet-600/95 to-purple-700/95 dark:from-purple-900/95 dark:via-violet-900/95 dark:to-purple-950/95 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg border border-purple-200 dark:border-purple-700 hover:bg-white dark:hover:bg-gray-700 transition-all hover:scale-110"
        data-testid="button-toggle-sidebar"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
        )}
      </button>

      {/* Logo Section */}
      <div className={`relative flex items-center gap-2 sm:gap-3 p-4 sm:p-6 ${isCollapsed ? 'justify-center px-2 sm:px-4' : ''}`}>
        <div className="relative">
          <div className="absolute inset-0 bg-white/20 dark:bg-white/10 rounded-xl blur-lg"></div>
          <img 
            src={theme === "dark" ? logoDark : logoLight} 
            alt="Ankylo Gaming Logo" 
            className={`relative object-cover rounded-xl transition-all shadow-lg ${isCollapsed ? 'h-8 w-8 sm:h-10 sm:w-10' : 'h-10 w-10 sm:h-12 sm:w-12'}`}
          />
        </div>
        {!isCollapsed && (
          <div className="text-white">
            <h2 className="text-sm sm:text-lg font-bold drop-shadow-lg">Ankylo Gaming</h2>
            <p className="text-[10px] sm:text-xs text-purple-100 drop-shadow">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="relative flex-1 px-2 sm:px-3 py-2 sm:py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <ul className="space-y-0.5 sm:space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.url;
            const hasAI = ['Analytics', 'AI Maintenance'].includes(item.title);
            
            return (
              <li key={item.title} className="relative">
                <Link href={item.url}>
                  <div
                    className={`relative flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all cursor-pointer group ${
                      isActive 
                        ? 'bg-white/95 dark:bg-white/90 shadow-lg scale-105' 
                        : 'hover:bg-white/10 hover:backdrop-blur-sm'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <item.icon className={`flex-shrink-0 ${isCollapsed ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-4 w-4 sm:h-5 sm:w-5'} ${
                      isActive 
                        ? 'text-purple-600 dark:text-purple-600' 
                        : 'text-white group-hover:text-purple-100'
                    }`} />
                    {!isCollapsed && (
                      <span className={`text-xs sm:text-sm font-medium flex items-center gap-1.5 ${
                        isActive 
                          ? 'text-purple-700 dark:text-purple-700' 
                          : 'text-white'
                      }`}>
                        {item.title}
                        {hasAI && (
                          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-500 animate-pulse" />
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
      <div className="relative p-2 sm:p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 text-white hover:bg-white/10 rounded-lg sm:rounded-xl transition-all backdrop-blur-sm ${
            isCollapsed ? 'justify-center' : ''
          }`}
          data-testid="button-logout"
        >
          <LogOut className={`flex-shrink-0 ${isCollapsed ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-4 w-4 sm:h-5 sm:w-5'}`} />
          {!isCollapsed && <span className="text-xs sm:text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}
