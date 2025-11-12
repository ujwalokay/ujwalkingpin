import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import logoDark from "@assets/airavoto_logo.png";
import img1 from "@assets/generated_images/Modern_gaming_cafe_with_purple_lighting_1a0efc51.png";
import img2 from "@assets/generated_images/Luxury_gaming_lounge_purple_pink_98c3a8f3.png";
import img3 from "@assets/generated_images/Gaming_cafe_night_purple_neon_964a4486.png";
import { Separator } from "@/components/ui/separator";

interface LoginProps {
  onLoginSuccess: (userData: any) => void;
}

const carouselImages = [
  { src: img1, caption: "India's First Gaming Lounge Management POS" },
  { src: img2, caption: "Complete Software Solution for Gaming Centers" },
  { src: img3, caption: "Advanced Booking & Billing Management System" }
];

function TermsContent() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-3">1. Introduction and Acceptance</h2>
        <p className="text-muted-foreground leading-relaxed">
          Welcome to Airavoto Gaming Center. By using our gaming facilities, booking services, or participating in any activities at our center, you agree to comply with and be bound by these Terms and Conditions.
        </p>
      </section>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          Airavoto Gaming Center provides the following services:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
          <li><strong>Gaming Stations:</strong> Access to various gaming devices including PCs, PlayStation 5 consoles, VR headsets, and car racing simulators</li>
          <li><strong>Booking System:</strong> Walk-in and advance booking options with flexible session durations</li>
          <li><strong>Food & Beverage:</strong> In-house food and drink ordering during gaming sessions</li>
          <li><strong>Loyalty Program:</strong> Earn 1 point for every ₹1 spent and redeem rewards</li>
          <li><strong>Tournament Participation:</strong> Organized gaming competitions with prize pools</li>
        </ul>
      </section>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-3">3. Booking and Reservations</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          <strong>3.1 Walk-in Bookings:</strong> Available on a first-come, first-served basis subject to availability.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-3">
          <strong>3.2 Advance Bookings:</strong> Customers may book gaming sessions in advance. Advanced bookings are confirmed upon availability verification.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          <strong>3.3 No-Shows:</strong> Customers who fail to arrive within 15 minutes of their scheduled booking time may forfeit their reservation without refund.
        </p>
      </section>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-3">4. Pricing and Payment</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          <strong>4.1 Pricing Structure:</strong> Gaming sessions are priced based on device type, duration, and number of persons. Prices are displayed in Indian Rupees (₹).
        </p>
        <p className="text-muted-foreground leading-relaxed mb-3">
          <strong>4.2 Payment Methods:</strong> We accept Cash, UPI, Card, and Online payment methods.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          <strong>4.3 Refund Policy:</strong> Refunds are not provided for partially used sessions. In case of technical issues, appropriate credits will be issued at management's discretion.
        </p>
      </section>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-3">5. Equipment Usage and Conduct</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          <strong>5.1 Responsible Use:</strong> Customers must use all gaming equipment with care. Any damage caused by misuse will be charged to the customer.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          <strong>5.2 Code of Conduct:</strong> Customers must maintain respectful behavior. We reserve the right to terminate sessions for misconduct without refund.
        </p>
      </section>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-3">6. Data Privacy</h2>
        <p className="text-muted-foreground leading-relaxed">
          We collect customer information for service delivery and implement reasonable security measures to protect customer data.
        </p>
      </section>

      <Separator />

      <section>
        <h2 className="text-xl font-semibold mb-3">7. Liability and Disclaimers</h2>
        <p className="text-muted-foreground leading-relaxed mb-3">
          <strong>7.1 Personal Property:</strong> We are not responsible for loss, theft, or damage to personal belongings.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          <strong>7.2 Limitation of Liability:</strong> Our total liability shall not exceed the amount paid by the customer for the specific session.
        </p>
      </section>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground text-center">
          By using Airavoto Gaming Center services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
        </p>
      </div>
    </div>
  );
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);


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
    if (!agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the Terms & Conditions to continue",
        variant: "destructive",
      });
      return;
    }

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#2d2937] relative overflow-hidden">
      {/* Mobile Background Carousel - Full Screen */}
      <div className="md:hidden absolute inset-0">
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
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/60 via-black/50 to-black/70"></div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-5xl bg-[#1e1a24] md:bg-[#1e1a24] bg-transparent md:rounded-2xl md:shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
        
        {/* Left Side - Image Carousel (Desktop Only) */}
        <div className="hidden md:flex md:w-[45%] relative bg-gradient-to-br from-purple-900/50 to-purple-950/50 overflow-hidden">
          <div className="absolute top-6 left-6 z-20">
            <div className="flex items-center gap-3">
              <img 
                src={logoDark} 
                alt="Airavoto Gaming"
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-lg font-bold text-white">Airavoto Gaming</h1>
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
            {currentImageIndex === 0 && (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-3xl font-bold">India's First</p>
                  <div className="relative">
                    <div className="absolute -top-2 -right-2 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                    <div className="w-12 h-8 rounded-md overflow-hidden shadow-lg border-2 border-white/30 animate-pulse">
                      <div className="h-1/3 bg-gradient-to-r from-orange-500 to-orange-400"></div>
                      <div className="h-1/3 bg-white flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-blue-600 border border-blue-700"></div>
                      </div>
                      <div className="h-1/3 bg-gradient-to-r from-green-600 to-green-500"></div>
                    </div>
                  </div>
                </div>
                <p className="text-lg font-semibold text-purple-200">Gaming Lounge Management POS</p>
              </>
            )}
            {currentImageIndex === 1 && (
              <>
                <p className="text-3xl font-bold mb-1">Complete Software</p>
                <p className="text-lg font-semibold text-purple-200">Solution for Gaming Centers</p>
              </>
            )}
            {currentImageIndex === 2 && (
              <>
                <p className="text-3xl font-bold mb-1">Advanced Booking</p>
                <p className="text-lg font-semibold text-purple-200">& Billing Management System</p>
              </>
            )}
            <p className="text-purple-200 text-sm mt-2">
              Streamline your gaming center operations
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
        <div className="flex-1 p-6 md:p-12 bg-transparent md:bg-[#1e1a24]">
          <div className="max-w-md mx-auto space-y-6 md:space-y-8 bg-[#1e1a24]/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-2xl md:rounded-none p-8 md:p-0 shadow-2xl md:shadow-none border border-white/10 md:border-0">
            <div className="md:hidden flex flex-col items-center gap-3 mb-6">
              <img 
                src={logoDark} 
                alt="Airavoto Gaming"
                className="h-16 w-16 object-contain"
              />
              <div className="text-center">
                <h1 className="text-xl font-bold text-white">Airavoto Gaming</h1>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {currentImageIndex === 0 && (
                    <>
                      <div className="relative">
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                        <div className="w-8 h-6 rounded overflow-hidden shadow-lg border border-white/30 animate-pulse">
                          <div className="h-1/3 bg-gradient-to-r from-orange-500 to-orange-400"></div>
                          <div className="h-1/3 bg-white flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-blue-600 border border-blue-700"></div>
                          </div>
                          <div className="h-1/3 bg-gradient-to-r from-green-600 to-green-500"></div>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-white">India's First</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Welcome back
              </h2>
              <p className="text-gray-400 text-sm">
                Please sign in to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
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
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  data-testid="checkbox-terms"
                  className="border-gray-700 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <label htmlFor="terms" className="text-sm text-gray-400">
                  I agree to the{" "}
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-purple-400 hover:text-purple-300 underline"
                        data-testid="button-view-terms"
                      >
                        Terms & Conditions
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Terms and Conditions</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[60vh] pr-4">
                        <TermsContent />
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg shadow-lg transition-all duration-200"
                data-testid="button-login"
                disabled={isLoggingIn || isLockedOut || !agreedToTerms}
              >
                {isLoggingIn ? "Signing in..." : isLockedOut ? `Wait ${remainingTime}s` : "Login"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
