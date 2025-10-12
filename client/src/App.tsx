import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Reports from "@/pages/Reports";
import Analytics from "@/pages/Analytics";
import Food from "@/pages/Food";
import Expenses from "@/pages/Expenses";
import Timeline from "@/pages/Timeline";
import History from "@/pages/History";
import ActivityLogs from "@/pages/ActivityLogs";
import Loyalty from "@/pages/Loyalty";
import TermsAndConditions from "@/pages/TermsAndConditions";
import PublicStatus from "@/pages/PublicStatus";
import Home from "@/pages/Home";
import ConsumerGallery from "@/pages/ConsumerGallery";
import ConsumerFacilities from "@/pages/ConsumerFacilities";
import ConsumerGames from "@/pages/ConsumerGames";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import { ConsumerNav } from "@/components/ConsumerNav";
import { CursorTrail } from "@/components/CursorTrail";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/history" component={History} />
      <Route path="/activity-logs" component={ActivityLogs} />
      <Route path="/loyalty" component={Loyalty} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/food" component={Food} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/settings" component={Settings} />
      <Route path="/reports" component={Reports} />
      <Route path="/terms" component={TermsAndConditions} />
      <Route component={NotFound} />
    </Switch>
  );
}

interface User {
  id: string;
  username: string;
  role: "admin" | "staff";
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const { toast } = useToast();

  const style = {
    "--sidebar-width": "16rem",
  };

  useEffect(() => {
    // Check if user is already authenticated via session
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setShowLogin(true);
        }
      } catch (error) {
        setShowLogin(true);
      }
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowLogin(false);
  };

  const handleLock = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setIsAuthenticated(false);
      setShowLogin(true);
      toast({
        title: "Locked",
        description: "Please login again to continue",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Switch>
              <Route path="/status" component={PublicStatus} />
              <Route path="/home">
                <ConsumerNav />
                <Home />
              </Route>
              <Route path="/gallery">
                <ConsumerNav />
                <ConsumerGallery />
              </Route>
              <Route path="/facilities">
                <ConsumerNav />
                <ConsumerFacilities />
              </Route>
              <Route path="/games">
                <ConsumerNav />
                <ConsumerGames />
              </Route>
              <Route path="/staff">
                {showLogin && <Login onLoginSuccess={handleLoginSuccess} />}
              </Route>
              <Route>
                {showLogin && <Login onLoginSuccess={handleLoginSuccess} />}
              </Route>
            </Switch>
            <CursorTrail />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider user={user}>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1">
                  <header className="flex items-center justify-between p-3 md:p-4 border-b sticky top-0 z-50 glass">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <div className="flex items-center gap-2 md:gap-4">
                      {user && (
                        <div className="text-xs md:text-sm font-medium hidden sm:block" data-testid="text-user-info">
                          {user.username} <span className="text-xs text-muted-foreground hidden md:inline">({user.role})</span>
                        </div>
                      )}
                      <div className="text-xs md:text-sm text-muted-foreground hidden md:block">
                        {new Date().toLocaleDateString('en-IN', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <ThemeToggle />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLock}
                        data-testid="button-lock"
                        aria-label="Lock screen"
                        className="h-8 w-8 md:h-10 md:w-10"
                      >
                        <Lock className="h-4 w-4 md:h-5 md:w-5" />
                      </Button>
                    </div>
                  </header>
                  <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
            <CursorTrail />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
