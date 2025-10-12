import { useState, useEffect } from "react";
import { getServerTime } from "@/lib/api";

let timeOffset: number | null = null;
let offsetPromise: Promise<void> | null = null;

async function initializeTimeOffset() {
  if (timeOffset !== null) return;
  if (offsetPromise) {
    await offsetPromise;
    return;
  }

  offsetPromise = (async () => {
    try {
      const serverTime = await getServerTime();
      const clientTime = new Date();
      timeOffset = serverTime.getTime() - clientTime.getTime();
    } catch (error) {
      console.error("Failed to get server time, using client time", error);
      timeOffset = 0;
    } finally {
      offsetPromise = null;
    }
  })();

  await offsetPromise;
}

export function getAdjustedTime(): Date {
  const now = new Date();
  if (timeOffset === null) {
    return now;
  }
  return new Date(now.getTime() + timeOffset);
}

export function useServerTime() {
  const [isReady, setIsReady] = useState(timeOffset !== null);

  useEffect(() => {
    if (!isReady) {
      initializeTimeOffset().then(() => setIsReady(true));
    }
  }, [isReady]);

  return { isReady, getTime: getAdjustedTime };
}
