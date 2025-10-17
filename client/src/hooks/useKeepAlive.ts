import { useEffect, useRef } from "react";

const PING_INTERVAL = 10 * 60 * 1000;

export function useKeepAlive(hasActiveTimers: boolean) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (hasActiveTimers) {
      const pingServer = async () => {
        try {
          await fetch("/api/health");
          console.log("[Keep-Alive] Server pinged successfully");
        } catch (error) {
          console.error("[Keep-Alive] Failed to ping server:", error);
        }
      };

      pingServer();

      intervalRef.current = setInterval(pingServer, PING_INTERVAL);

      console.log("[Keep-Alive] Started - pinging every 10 minutes");
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log("[Keep-Alive] Stopped - no active timers");
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasActiveTimers]);
}
