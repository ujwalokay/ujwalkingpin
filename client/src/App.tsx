import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Lock } from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Reports from "@/pages/Reports";
import Food from "@/pages/Food";
import Timeline from "@/pages/Timeline";
import History from "@/pages/History";
import TermsAndConditions from "@/pages/TermsAndConditions";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/history" component={History} />
      <Route path="/food" component={Food} />
      <Route path="/settings" component={Settings} />
      <Route path="/reports" component={Reports} />
      <Route path="/terms" component={TermsAndConditions} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setShowLogin(false);
        toast({
          title: "Login successful",
          description: "Welcome to Ankylo Gaming Admin Panel",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Login failed",
          description: data.message || "Invalid username or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoggingIn) {
      handleLogin();
    }
  };

  const handleLock = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      setShowLogin(true);
      setUsername("");
      setPassword("");
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
            <Dialog open={showLogin} onOpenChange={() => {}}>
              <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Ankylo Gaming Admin</DialogTitle>
                  <DialogDescription>
                    Please enter your credentials to access the admin panel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      data-testid="input-username"
                      type="text"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      data-testid="input-password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <Button 
                    onClick={handleLogin} 
                    className="w-full"
                    data-testid="button-login"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? "Logging in..." : "Login"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <header className="flex items-center justify-between p-4 border-b sticky top-0 z-50 glass">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
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
                    >
                      <Lock className="h-5 w-5" />
                    </Button>
                  </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
