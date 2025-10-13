import { useState, useEffect } from "react";
import { Shield, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import loginImage from "@assets/stock_images/purple_gaming_setup,_c53078b3.jpg";
import logoDark from "@assets/WhatsApp Image 2025-10-10 at 18.33.50_a4a3fc99_1760107172482.jpg";

interface VerifyOtpProps {
  userId: string;
  maskedEmail: string;
  onVerifySuccess: (userData: any) => void;
  onBack: () => void;
}

export default function VerifyOtp({ userId, maskedEmail, onVerifySuccess, onBack }: VerifyOtpProps) {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast({
            title: "OTP Expired",
            description: "Your OTP has expired. Please login again.",
            variant: "destructive",
          });
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast, onBack]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, code: otp }),
      });

      if (response.ok) {
        const userData = await response.json();
        toast({
          title: "Verification successful",
          description: `Welcome ${userData.username}!`,
        });
        onVerifySuccess(userData);
      } else {
        const data = await response.json();
        toast({
          title: "Verification failed",
          description: data.message || "Invalid or expired OTP",
          variant: "destructive",
        });
        setOtp("");
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isVerifying && otp.length === 6) {
      handleVerifyOtp();
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-gray-900 to-black dark:from-purple-950 dark:via-gray-950 dark:to-black">
      <div className="w-full max-w-6xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-purple-500/20">
        <div className="flex flex-col md:flex-row">
          {/* Left Side - OTP Form */}
          <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-950">
            <div className="max-w-md mx-auto space-y-8">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <img 
                  src={logoDark} 
                  alt="Ankylo Gaming"
                  className="h-14 w-14 object-cover rounded-2xl shadow-lg ring-2 ring-purple-500/20"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ankylo Gaming</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Two-Factor Authentication</p>
                </div>
              </div>

              {/* Title */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Verify OTP
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  We've sent a 6-digit code to <span className="font-medium text-purple-600 dark:text-purple-400">{maskedEmail}</span>
                </p>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-between p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time remaining:</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatTime(timeLeft)}</span>
              </div>

              {/* OTP Input */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700 dark:text-gray-300 font-medium">
                    Enter OTP Code
                  </Label>
                  <Input
                    id="otp"
                    data-testid="input-otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={handleOtpChange}
                    onKeyPress={handleKeyPress}
                    className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 h-12 text-center text-2xl font-bold tracking-widest rounded-xl"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-700 hover:via-purple-600 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-200"
                  data-testid="button-verify-otp"
                  disabled={isVerifying || otp.length !== 6}
                >
                  {isVerifying ? "Verifying..." : "Verify Code"}
                </Button>

                <Button
                  onClick={onBack}
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                  data-testid="button-back-to-login"
                  disabled={isVerifying}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Didn't receive the code? Check your spam folder or contact your administrator.
                </p>
              </div>
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
              <h3 className="text-3xl font-bold mb-2">Secure Access</h3>
              <p className="text-purple-200">Two-factor authentication keeps your account safe</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
