import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SiGoogle } from "react-icons/si";
import { useLocation } from "wouter";
import logoDark from "@assets/airavoto_logo.png";
import img1 from "@assets/generated_images/Modern_gaming_cafe_with_purple_lighting_1a0efc51.png";
import img2 from "@assets/generated_images/Luxury_gaming_lounge_purple_pink_98c3a8f3.png";
import img3 from "@assets/generated_images/Gaming_cafe_night_purple_neon_964a4486.png";

interface LoginProps {
  onLoginSuccess: (userData: any) => void;
}

const carouselImages = [
  { src: img1, caption: "Premium Gaming Experience" },
  { src: img2, caption: "Luxury Gaming Lounge" },
  { src: img3, caption: "Immersive Gaming Environment" }
];

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          if (data.needsStaffLogin) {
            setGoogleVerified(true);
            setGoogleEmail(data.googleEmail || "");
          } else if (data.twoStepComplete) {
            onLoginSuccess(data);
          }
        }
      } catch (error) {
      }
    };

    checkAuthStatus();

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
        credentials: "include"
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#2d2937]">
      <div className="w-full max-w-5xl bg-[#1e1a24] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side - Image Carousel */}
        <div className="hidden md:flex md:w-[45%] relative bg-gradient-to-br from-purple-900/50 to-purple-950/50 overflow-hidden">
          <div className="absolute top-6 left-6 z-20">
            <div className="flex items-center gap-3">
              <img 
                src={logoDark} 
                alt="Airavoto Gaming"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-white">AMU</h1>
              </div>
            </div>
          </div>

          {carouselImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image.src}
                alt={image.caption}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-transparent to-black/60"></div>
            </div>
          ))}

          <div className="absolute bottom-8 left-8 right-8 z-20 text-white">
            <h3 className="text-2xl font-bold mb-1">
              {carouselImages[currentImageIndex].caption}
            </h3>
            <p className="text-purple-200 text-sm">
              Experience gaming like never before
            </p>
            
            <div className="flex gap-2 mt-4">
              {carouselImages.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentImageIndex 
                      ? 'w-8 bg-purple-400' 
                      : 'w-1 bg-purple-400/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 p-8 md:p-12 bg-[#1e1a24]">
          <div className="max-w-md mx-auto space-y-8">
            <div className="md:hidden flex items-center gap-3 mb-6">
              <img 
                src={logoDark} 
                alt="Airavoto Gaming"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-white">AMU</h1>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Create an account
              </h2>
              <p className="text-gray-400 text-sm">
                Already have an account? <button className="text-purple-400 hover:text-purple-300">Sign In</button>
              </p>
              {googleVerified && googleEmail && (
                <p className="text-sm text-green-400 mt-2">
                  ✓ Google account verified: {googleEmail}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300 text-sm font-medium">
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
                    className="bg-[#2d2937] border-gray-700 text-white placeholder:text-gray-500 h-11 rounded-lg focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastname" className="text-gray-300 text-sm font-medium">
                    Last name
                  </Label>
                  <Input
                    id="lastname"
                    type="text"
                    placeholder="Enter your last name"
                    className="bg-[#2d2937] border-gray-700 text-white placeholder:text-gray-500 h-11 rounded-lg focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                  Create your password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="must be 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#2d2937] border-gray-700 text-white placeholder:text-gray-500 h-11 pr-12 rounded-lg focus:border-purple-500 focus:ring-purple-500/20"
                    disabled={isLockedOut}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 rounded border-gray-700 bg-[#2d2937] text-purple-600 focus:ring-purple-500/20"
                />
                <label htmlFor="terms" className="text-sm text-gray-400">
                  I agree to the Terms & Conditions
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg shadow-lg transition-all duration-200"
                data-testid="button-login"
                disabled={isLoggingIn || isLockedOut}
              >
                {isLoggingIn ? "Signing in..." : isLockedOut ? `Wait ${remainingTime}s` : "Create account"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#1e1a24] text-gray-400">Or</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="h-11 bg-[#2d2937] border-gray-700 text-white hover:bg-[#353142] rounded-lg"
                >
                  <SiGoogle className="w-5 h-5 mr-2" />
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 bg-[#2d2937] border-gray-700 text-white hover:bg-[#353142] rounded-lg"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  Apple
                </Button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminLogin(!isAdminLogin);
                    setUsername("");
                    setPassword("");
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  data-testid="button-toggle-login-type"
                  disabled={isLockedOut}
                >
                  Login as {isAdminLogin ? "Staff" : "Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
