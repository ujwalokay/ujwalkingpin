import { Settings, LayoutDashboard, FileText, UtensilsCrossed, CalendarClock, History, Scale, Wallet, ScrollText, Award, BarChart3, Gamepad2, Sparkles, LogOut, Brain } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
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
    <div className="relative h-screen flex flex-col bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      {/* Logo Section */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-800">
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

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.url;
            const hasAI = ['Analytics', 'AI Maintenance'].includes(item.title);
            
            return (
              <li key={item.title}>
                <Link href={item.url}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer group ${
                      isActive 
                        ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 font-medium' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                    }`}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${
                      isActive 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    }`} />
                    <span className="text-sm flex items-center gap-1.5">
                      {item.title}
                      {hasAI && (
                        <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
                      )}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-all"
          data-testid="button-logout"
        >
          <LogOut className="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
