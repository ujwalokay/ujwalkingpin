import { useEffect, useState } from "react";
import { Sparkles, Zap, Gamepad2, Heart, Shield, Star, Headphones } from "lucide-react";
import splashLogo from "@assets/WhatsApp_Image_2025-10-22_at_11.12.35_515bc8bb-removebg-preview_1761111967877.png";
import iconPattern from "@assets/WhatsApp Image 2025-10-22 at 11.12.35_fa6763ad_1761112003243.jpg";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 100);
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 800);
          return 100;
        }
        return prev + 2;
      });
    }, 25);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Background Pattern with Overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${iconPattern})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-violet-800 to-indigo-900 dark:from-black dark:via-purple-950 dark:to-indigo-950"></div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[500px] md:h-[500px] bg-indigo-500/20 rounded-full blur-3xl animate-pulse-slower"></div>
      </div>

      {/* Floating Gaming Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 animate-float-1">
          <Gamepad2 className="h-10 w-10 md:h-12 md:w-12 text-purple-400/30" />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-float-2">
          <Headphones className="h-8 w-8 md:h-10 md:w-10 text-violet-400/30" />
        </div>
        <div className="absolute bottom-1/3 left-1/3 animate-float-3">
          <Star className="h-10 w-10 md:h-12 md:w-12 text-yellow-400/30" />
        </div>
        <div className="absolute bottom-1/4 right-1/3 animate-float-4">
          <Shield className="h-9 w-9 md:h-11 md:w-11 text-blue-400/30" />
        </div>
        <div className="absolute top-1/2 left-1/5 animate-float-1">
          <Heart className="h-8 w-8 md:h-10 md:w-10 text-pink-400/30" />
        </div>
        <div className="absolute top-2/3 right-1/5 animate-float-3">
          <Zap className="h-10 w-10 md:h-12 md:w-12 text-yellow-400/30" />
        </div>
      </div>

      {/* Main Content */}
      <div className={`relative z-10 flex flex-col items-center gap-6 md:gap-8 px-6 md:px-8 transition-all duration-1000 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        
        {/* Logo Container with Epic Animation */}
        <div className="relative">
          {/* Multiple Glow Layers */}
          <div className="absolute inset-0 bg-purple-500/40 rounded-full blur-3xl animate-pulse scale-150"></div>
          <div className="absolute inset-0 bg-violet-500/30 rounded-full blur-2xl animate-pulse-slow scale-125"></div>
          
          {/* Logo with Animations */}
          <div className="relative">
            {/* Rotating Rings */}
            <div className="absolute inset-0 -m-6 md:-m-8 border-[3px] border-purple-500/40 rounded-full animate-spin-slow"></div>
            <div className="absolute inset-0 -m-10 md:-m-12 border-[3px] border-violet-500/30 rounded-full animate-spin-slower"></div>
            <div className="absolute inset-0 -m-14 md:-m-16 border-2 border-pink-500/20 rounded-full animate-spin-reverse"></div>
            
            {/* Logo Image with Hover Effect */}
            <div className="relative bg-black/20 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-purple-500/30">
              <img
                src={splashLogo}
                alt="Ankylo Gaming Logo"
                className="h-40 w-40 md:h-56 md:w-56 lg:h-64 lg:w-64 object-contain drop-shadow-2xl animate-float"
                data-testid="img-splash-logo"
              />
            </div>
            
            {/* Corner Sparkles */}
            <Sparkles className="absolute -top-4 -right-4 h-8 w-8 md:h-10 md:w-10 text-yellow-400 animate-ping" />
            <Sparkles className="absolute -bottom-4 -left-4 h-8 w-8 md:h-10 md:w-10 text-purple-400 animate-pulse" />
            <Star className="absolute -top-4 -left-4 h-8 w-8 md:h-10 md:w-10 text-pink-400 animate-spin-slow" />
            <Zap className="absolute -bottom-4 -right-4 h-8 w-8 md:h-10 md:w-10 text-violet-400 animate-bounce" />
          </div>
        </div>

        {/* Brand Name with Glowing Text Effect */}
        <div className="text-center space-y-2 md:space-y-3">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-pink-400 tracking-tight animate-gradient drop-shadow-2xl">
            ANKYLO GAMING
          </h1>
          <div className="flex items-center justify-center gap-2 text-purple-200 text-base md:text-xl font-semibold">
            <Gamepad2 className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
            <p className="animate-pulse">
              Ultimate Gaming Experience
            </p>
            <Headphones className="h-5 w-5 md:h-6 md:w-6 animate-pulse" />
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="w-72 md:w-96 space-y-3">
          <div className="relative h-3 md:h-4 bg-black/40 backdrop-blur-sm rounded-full overflow-hidden border border-purple-500/30 shadow-2xl">
            {/* Background shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shine"></div>
            
            {/* Progress fill */}
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-violet-500 to-pink-500 rounded-full transition-all duration-300 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-purple-300 text-sm md:text-base font-bold">
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 bg-purple-400 rounded-full animate-pulse"></div>
              Loading Experience
            </span>
            <span className="text-purple-200">{progress}%</span>
          </div>
        </div>

        {/* Fun Loading Messages */}
        <div className="text-center text-purple-300/80 text-xs md:text-sm font-medium animate-pulse">
          {progress < 30 && "🎮 Powering up gaming stations..."}
          {progress >= 30 && progress < 60 && "🎯 Loading epic adventures..."}
          {progress >= 60 && progress < 90 && "⚡ Activating turbo mode..."}
          {progress >= 90 && "🚀 Almost ready to game!"}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-25px);
          }
        }
        
        @keyframes float-1 {
          0%, 100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(20px, -20px);
          }
          66% {
            transform: translate(-20px, 20px);
          }
        }
        
        @keyframes float-2 {
          0%, 100% {
            transform: translate(0, 0);
          }
          33% {
            transform: translate(-30px, 15px);
          }
          66% {
            transform: translate(15px, -30px);
          }
        }
        
        @keyframes float-3 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(25px, 25px);
          }
        }
        
        @keyframes float-4 {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-25px, -25px);
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
        
        @keyframes spin-reverse {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        @keyframes pulse-slower {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-float-1 {
          animation: float-1 8s ease-in-out infinite;
        }
        
        .animate-float-2 {
          animation: float-2 10s ease-in-out infinite;
        }
        
        .animate-float-3 {
          animation: float-3 7s ease-in-out infinite;
        }
        
        .animate-float-4 {
          animation: float-4 9s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        
        .animate-spin-slower {
          animation: spin-slower 15s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 20s linear infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-pulse-slower {
          animation: pulse-slower 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
