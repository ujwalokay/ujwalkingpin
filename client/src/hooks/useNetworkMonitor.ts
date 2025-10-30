import { useEffect, useState, useRef } from "react";

const HEALTH_CHECK_INTERVAL = 30 * 1000; // 30 seconds
const HEALTH_CHECK_TIMEOUT = 20 * 1000; // 20 seconds timeout

export function useNetworkMonitor() {
  const [isOnline, setIsOnline] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const failureCountRef = useRef(0);

  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
        
        const response = await fetch("/api/health", {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          failureCountRef.current = 0;
          if (!isOnline) {
            setIsOnline(true);
            setShowAlert(false);
          }
        } else {
          throw new Error("Server responded with error");
        }
      } catch (error) {
        failureCountRef.current += 1;
        console.error("[Network Monitor] Health check failed:", error);
        
        // Show alert after 3 consecutive failures
        if (failureCountRef.current >= 3) {
          setIsOnline(false);
          setShowAlert(true);
        }
      }
    };

    // Check online status
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(false);
      failureCountRef.current = 0;
      checkServerHealth();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
    };

    // Listen to browser online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Start health check interval
    checkServerHealth();
    intervalRef.current = setInterval(checkServerHealth, HEALTH_CHECK_INTERVAL);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOnline]);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowAlert(false);
  };

  return {
    isOnline,
    showAlert,
    handleRefresh,
    handleDismiss,
  };
}
