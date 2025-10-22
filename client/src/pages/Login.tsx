import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SiGoogle } from "react-icons/si";
import { useLocation } from "wouter";
import loginImage from "@assets/stock_images/purple_gaming_setup,_c53078b3.jpg";
import logoDark from "@assets/WhatsApp_Image_2025-10-22_at_11.12.35_515bc8bb-removebg-preview_1761111967877.png";

interface LoginProps {
  onLoginSuccess: (userData: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [location] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [googleVerified, setGoogleVerified] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const { toast } = useToast();

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  useEffect(() => {
    // Check authentication status on component mount
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.needsStaffLogin) {
            // Google verified, need staff login
            setGoogleVerified(true);
            setGoogleEmail(data.googleEmail || "");
          } else if (data.twoStepComplete) {
            // Already fully authenticated
            onLoginSuccess(data);
          }
        }
      } catch (error) {
        // Not authenticated, stay on login page
      }
    };

    checkAuthStatus();

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const googleVerifiedParam = urlParams.get('google_verified');
    
    if (googleVerifiedParam === 'true') {
      setGoogleVerified(true);
      toast({
        title: "Google Authentication Successful",
        description: "Please enter your staff/admin credentials to continue.",
        duration: 5000,
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'access_denied') {
      toast({
        title: "Access Denied",
        description: "Your email is not authorized to access this application. Please contact the administrator.",
        variant: "destructive",
        duration: 8000,
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'google_auth_failed') {
      toast({
        title: "Google Authentication Failed",
        description: "Failed to authenticate with Google. Please try again.",
        variant: "destructive",
        duration: 6000,
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error === 'authentication_failed') {
      toast({
        title: "Authentication Failed",
        description: "Authentication failed. Please try again.",
        variant: "destructive",
        duration: 6000,
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast, onLoginSuccess]);

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
        setFailedAttempts(0);
        setLockoutTime(null);
        onLoginSuccess(userData);
        toast({
          title: "Login successful",
          description: `Welcome ${userData.username} (${userData.role})`,
        });
      } else {
        const data = await response.json();
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);

        if (newFailedAttempts >= 3) {
          const lockTime = Date.now() + 30000;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  const isLockedOut = !!(lockoutTime && Date.now() < lockoutTime);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-gray-900 to-black dark:from-purple-950 dark:via-gray-950 dark:to-black">
      <div className="w-full max-w-6xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-purple-500/20">
        <div className="flex flex-col md:flex-row">
          {/* Left Side - Login Form */}
          <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-950">
            <div className="max-w-md mx-auto space-y-8">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <img 
                  src={logoDark} 
                  alt="Ankylo Gaming"
                  className="h-20 w-20 object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ankylo Gaming</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Staff Panel</p>
                </div>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {googleVerified ? (isAdminLogin ? "Admin Login" : "Staff Login") : "Welcome"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {googleVerified ? `Sign in to access the ${isAdminLogin ? "admin" : "staff"} panel` : "Sign in to access the staff panel"}
                </p>
                {googleVerified && googleEmail && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ✓ Google account verified: {googleEmail}
                  </p>
                )}
              </div>

              {!googleVerified ? (
                // Step 1: Google Login Only
                <div className="space-y-6">
                  <Button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full h-12 text-base font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600"
                    data-testid="button-google-login"
                  >
                    <SiGoogle className="mr-2 h-5 w-5" />
                    Continue with Google
                  </Button>
                </div>
              ) : (
                // Step 2: Staff/Admin Login Form
                <>
                <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700 dark:text-gray-300 font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    data-testid="input-username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLockedOut}
                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 h-12 text-base rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      data-testid="input-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 h-12 text-base pr-12 rounded-xl"
                      disabled={isLockedOut}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      data-testid="button-toggle-password"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      disabled={isLockedOut}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-700 hover:via-purple-600 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-200"
                  data-testid="button-login"
                  disabled={isLoggingIn || isLockedOut}
                >
                  {isLoggingIn ? "Signing in..." : isLockedOut ? `Wait ${remainingTime}s` : "Sign In"}
                </Button>

                <div className="text-center pt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdminLogin(!isAdminLogin);
                      setUsername("");
                      setPassword("");
                    }}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
                    data-testid="button-toggle-login-type"
                    disabled={isLockedOut}
                  >
                    Login as {isAdminLogin ? "Staff" : "Admin"}
                  </button>
                </div>
              </form>
                </>
              )}
            </div>
          </div>

          {/* Right Side - Image */}
          <div className="hidden md:block md:w-1/2 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/20 mix-blend-overlay z-10"></div>
            <img
              src={loginImage}
              alt="Gaming Setup"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-950/60 via-transparent to-purple-900/40 z-10"></div>
            <div className="absolute bottom-8 left-8 right-8 z-20 text-white">
              <h3 className="text-3xl font-bold mb-2">Ankylo Gaming</h3>
              <p className="text-purple-200">Manage your gaming center with ease</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
