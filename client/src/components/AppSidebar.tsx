import { Settings, LayoutDashboard, FileText, UtensilsCrossed, CalendarClock, History, Scale, Wallet, ScrollText } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import logoDark from "@assets/WhatsApp Image 2025-10-10 at 18.33.50_a4a3fc99_1760107172482.jpg";
import logoLight from "@assets/WhatsApp Image 2025-10-10 at 18.33.50_d321359c_1760107172482.jpg";

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

  return (
    <Sidebar className="glass border-r">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-3 px-4 py-6">
            <img 
              src={theme === "dark" ? logoDark : logoLight} 
              alt="Ankylo Gaming Logo" 
              className="h-12 w-12 object-contain"
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
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
