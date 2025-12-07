import { useEffect, useState, useRef } from "react";
import splashLogo from "@assets/airavoto_logo.png";
import iconPattern from "@assets/WhatsApp Image 2025-10-22 at 11.12.35_fa6763ad_1761112003243.jpg";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showLogo, setShowLogo] = useState(false);
  const onCompleteRef = useRef(onComplete);
  
  // Keep the ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setTimeout(() => setShowLogo(true), 300);
    
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => onCompleteRef.current(), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 25);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-white dark:bg-gray-100">
      {/* Animated Background Pattern - Moving Left to Right */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 animate-scroll-bg opacity-20"
          style={{
            backgroundImage: `url(${iconPattern})`,
            backgroundSize: 'auto 100%',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: '0 center',
            width: '200%'
          }}
        ></div>
        <div 
          className="absolute inset-0 animate-scroll-bg-delay opacity-15"
          style={{
            backgroundImage: `url(${iconPattern})`,
            backgroundSize: 'auto 100%',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: '0 center',
            width: '200%'
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-8">
        
        {/* Logo with Fade In Animation */}
        <div className={`transition-all duration-1500 ${showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="relative">
            <img
              src={splashLogo}
              alt="Airavoto Gaming Logo"
              className="h-48 w-48 md:h-64 md:w-64 lg:h-80 lg:w-80 object-contain drop-shadow-2xl"
              data-testid="img-splash-logo"
            />
          </div>
        </div>

        {/* Brand Name */}
        <div className={`text-center space-y-3 transition-all duration-1500 delay-300 ${showLogo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 tracking-tight">
            AIRAVOTO GAMING
          </h1>
          <p className="text-purple-600 text-lg md:text-xl font-semibold">
            Ultimate Gaming Experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className={`w-80 md:w-96 space-y-3 transition-all duration-1500 delay-500 ${showLogo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative h-3 bg-gray-200 dark:bg-gray-300 rounded-full overflow-hidden shadow-lg">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600 rounded-full transition-all duration-300 relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-purple-700 text-sm md:text-base font-bold">
            <span>Loading Experience</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-bg {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
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
        
        .animate-scroll-bg {
          animation: scroll-bg 30s linear infinite;
        }
        
        .animate-scroll-bg-delay {
          animation: scroll-bg 40s linear infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
        
        .duration-1500 {
          transition-duration: 1500ms;
        }
        
        .delay-300 {
          transition-delay: 300ms;
        }
        
        .delay-500 {
          transition-delay: 500ms;
        }
      `}</style>
    </div>
  );
}
