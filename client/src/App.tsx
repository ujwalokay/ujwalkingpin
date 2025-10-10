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
import { Lock, Eye, EyeOff } from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Reports from "@/pages/Reports";
import Food from "@/pages/Food";
import Expenses from "@/pages/Expenses";
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
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

  // Handle lockout countdown
  useEffect(() => {
    if (lockoutTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.ceil((lockoutTime - now) / 1000);
        
        if (timeLeft <= 0) {
          setLockoutTime(null);
          setFailedAttempts(0);
          setRemainingTime(0);
        } else {
          setRemainingTime(timeLeft);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  const handleLogin = async () => {
    // Check if locked out
    if (lockoutTime && Date.now() < lockoutTime) {
      toast({
        title: "Too many attempts",
        description: `Please wait ${remainingTime} seconds before trying again`,
        variant: "destructive",
      });
      return;
    }

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
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        setShowLogin(false);
        setFailedAttempts(0);
        setLockoutTime(null);
        toast({
          title: "Login successful",
          description: `Welcome ${userData.username} (${userData.role})`,
        });
      } else {
        const data = await response.json();
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);

        if (newFailedAttempts >= 3) {
          const lockTime = Date.now() + 30000; // 30 seconds
          setLockoutTime(lockTime);
          setRemainingTime(30);
          toast({
            title: "Login failed",
            description: "Too many failed attempts. Please wait 30 seconds.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login failed",
            description: `${data.message || "Invalid username or password"}. ${3 - newFailedAttempts} attempts remaining.`,
            variant: "destructive",
          });
        }
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
    if (e.key === "Enter" && !isLoggingIn && !(lockoutTime && Date.now() < lockoutTime)) {
      handleLogin();
    }
  };

  const isLockedOut = !!(lockoutTime && Date.now() < lockoutTime);

  const handleLock = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
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
                      disabled={isLockedOut}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        data-testid="input-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="pr-10"
                        disabled={isLockedOut}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="button-toggle-password"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        disabled={isLockedOut}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button 
                    onClick={handleLogin} 
                    className="w-full"
                    data-testid="button-login"
                    disabled={isLoggingIn || isLockedOut}
                  >
                    {isLoggingIn ? "Logging in..." : isLockedOut ? `Wait ${remainingTime}s` : "Login"}
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
        <AuthProvider user={user}>
          <TooltipProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1">
                  <header className="flex items-center justify-between p-4 border-b sticky top-0 z-50 glass">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <div className="flex items-center gap-4">
                      {user && (
                        <div className="text-sm font-medium" data-testid="text-user-info">
                          {user.username} <span className="text-xs text-muted-foreground">({user.role})</span>
                        </div>
                      )}
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
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
