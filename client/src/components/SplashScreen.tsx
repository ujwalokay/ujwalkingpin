import { useEffect, useState } from "react";
import { Sparkles, Zap, Gamepad2 } from "lucide-react";
import splashLogo from "@assets/20251020_115324_1760941507517.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900 via-violet-800 to-indigo-900 dark:from-purple-950 dark:via-violet-950 dark:to-indigo-950">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-8">
        {/* Floating Icons */}
        <div className="absolute -top-20 -left-20">
          <Gamepad2 className="h-12 w-12 text-purple-400/50 animate-bounce" />
        </div>
        <div className="absolute -top-16 -right-24">
          <Zap className="h-10 w-10 text-yellow-400/50 animate-ping" />
        </div>
        <div className="absolute -bottom-20 -left-16">
          <Sparkles className="h-10 w-10 text-pink-400/50 animate-pulse" />
        </div>
        <div className="absolute -bottom-24 -right-20">
          <Sparkles className="h-12 w-12 text-blue-400/50 animate-bounce" />
        </div>

        {/* Logo Container with Animation */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-purple-500/30 rounded-3xl blur-2xl animate-pulse"></div>
          
          {/* Logo with Multiple Animations */}
          <div className="relative transform transition-all duration-1000 animate-in zoom-in-50 fade-in">
            <div className="relative">
              {/* Rotating Ring */}
              <div className="absolute inset-0 -m-4 border-4 border-purple-500/30 rounded-3xl animate-spin-slow"></div>
              <div className="absolute inset-0 -m-8 border-4 border-violet-500/20 rounded-3xl animate-spin-slower"></div>
              
              {/* Logo Image */}
              <img
                src={splashLogo}
                alt="Ankylo Gaming"
                className="h-32 w-32 md:h-48 md:w-48 object-contain drop-shadow-2xl animate-float"
              />
              
              {/* Sparkles Around Logo */}
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-ping" />
              <Sparkles className="absolute -bottom-2 -left-2 h-8 w-8 text-purple-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Brand Name with Animation */}
        <div className="text-center space-y-2 animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-300">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Ankylo Gaming
          </h1>
          <p className="text-purple-200 text-lg md:text-xl font-medium animate-pulse">
            Manage your gaming center with ease
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 md:w-80 space-y-2 animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-500">
          <div className="h-2 bg-purple-950/50 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-purple-500 rounded-full transition-all duration-300 animate-shimmer"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-purple-300 text-sm font-medium">
            Loading... {progress}%
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes spin-slower {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 100% 0;
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-spin-slower {
          animation: spin-slower 12s linear infinite;
        }
        
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
        
        .delay-700 {
          animation-delay: 700ms;
        }
        
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
}
