import { storage } from "./storage";

export interface LoadPredictionInput {
  activeSessions: number;
  avgSessionLength: number;
  foodOrders: number;
  capacityUtilization: number;
  timeOfDay: number;
  dayOfWeek: number;
}

export interface LoadPredictionResult {
  predictedLoad: number;
  horizon: string;
  confidence: number;
  features: Record<string, any>;
}

export async function calculateCurrentLoad(): Promise<{
  activeSessions: number;
  avgSessionLength: number;
  foodOrders: number;
  capacityUtilization: number;
}> {
  const bookings = await storage.getActiveBookings();
  const deviceConfigs = await storage.getAllDeviceConfigs();

  const totalCapacity = deviceConfigs.reduce((sum, config) => sum + config.count, 0);
  const activeSessions = bookings.length;
  
  const sessionDurations = bookings.map(booking => {
    const start = new Date(booking.startTime).getTime();
    const end = new Date(booking.endTime).getTime();
    return (end - start) / (1000 * 60);
  });
  
  const avgSessionLength = sessionDurations.length > 0
    ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
    : 0;

  const foodOrders = bookings.reduce((sum, booking) => {
    return sum + (booking.foodOrders?.length || 0);
  }, 0);

  const capacityUtilization = totalCapacity > 0 
    ? Math.round((activeSessions / totalCapacity) * 100)
    : 0;

  return {
    activeSessions,
    avgSessionLength,
    foodOrders,
    capacityUtilization,
  };
}

export async function generateLoadPrediction(
  currentMetrics: LoadPredictionInput,
  horizon: "1h" | "3h" | "6h" | "12h" | "24h"
): Promise<LoadPredictionResult> {
  const now = new Date();
  const timeOfDay = now.getHours();
  const dayOfWeek = now.getDay();
  
  // Pattern-based prediction logic (no real AI needed - just smart calculations)
  let predictedLoad = currentMetrics.capacityUtilization;
  let reasoning = "";
  let confidence = 0.75;
  
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const hourMultipliers: Record<string, number> = {
    "1h": 1,
    "3h": 3,
    "6h": 6,
    "12h": 12,
    "24h": 24
  };
  
  const hoursAhead = hourMultipliers[horizon];
  const futureHour = (timeOfDay + hoursAhead) % 24;
  
  // Peak hours logic: 6pm-11pm = busy, 12pm-2pm = moderate, 3pm-7pm weekday = moderate
  const isPeakTime = (hour: number) => (hour >= 18 && hour <= 23);
  const isLunchTime = (hour: number) => (hour >= 12 && hour <= 14);
  const isAfterSchool = (hour: number) => (hour >= 15 && hour <= 19);
  
  // Calculate base prediction
  if (isPeakTime(futureHour)) {
    predictedLoad = isWeekend ? 85 : 70;
    reasoning = `Peak hours (${futureHour}:00) ${isWeekend ? 'on weekend' : 'on weekday'}`;
  } else if (isLunchTime(futureHour)) {
    predictedLoad = 45;
    reasoning = `Lunch hours (${futureHour}:00) - moderate traffic`;
  } else if (isAfterSchool(futureHour) && !isWeekend) {
    predictedLoad = 55;
    reasoning = `After-school hours (${futureHour}:00) on weekday`;
  } else if (futureHour >= 0 && futureHour <= 6) {
    predictedLoad = 10;
    reasoning = `Late night/early morning (${futureHour}:00) - minimal traffic`;
  } else {
    predictedLoad = 30;
    reasoning = `Off-peak hours (${futureHour}:00)`;
  }
  
  // Weekend bonus
  if (isWeekend && !isPeakTime(futureHour)) {
    predictedLoad += 15;
    reasoning += " (weekend boost)";
  }
  
  // Trend adjustment based on current load
  const trendFactor = (currentMetrics.capacityUtilization - 50) * 0.2;
  predictedLoad = Math.round(predictedLoad + trendFactor);
  
  // Adjust confidence based on time horizon
  if (hoursAhead <= 3) confidence = 0.85;
  else if (hoursAhead <= 6) confidence = 0.75;
  else if (hoursAhead <= 12) confidence = 0.65;
  else confidence = 0.55;
  
  // Ensure bounds
  predictedLoad = Math.max(0, Math.min(100, predictedLoad));
  
  return {
    predictedLoad,
    horizon,
    confidence,
    features: {
      timeOfDay,
      dayOfWeek,
      currentUtilization: currentMetrics.capacityUtilization,
      reasoning,
      algorithm: "pattern-based-v1"
    },
  };
}

export async function storeCurrentLoadMetric(): Promise<void> {
  try {
    const currentLoad = await calculateCurrentLoad();
    await storage.createLoadMetric(currentLoad);
  } catch (error: any) {
    console.error("Failed to store load metric:", error.message);
  }
}

export async function generateAndStorePredictions(): Promise<void> {
  try {
    const currentLoad = await calculateCurrentLoad();
    const now = new Date();
    
    const input: LoadPredictionInput = {
      ...currentLoad,
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
    };

    const horizons: Array<"1h" | "3h" | "6h" | "12h" | "24h"> = ["1h", "3h", "6h", "12h", "24h"];

    for (const horizon of horizons) {
      const prediction = await generateLoadPrediction(input, horizon);
      
      await storage.createLoadPrediction({
        horizon: prediction.horizon,
        predictedLoad: prediction.predictedLoad,
        modelVersion: "pattern-based-v1",
        features: prediction.features,
      });
    }

    console.log("✅ Load predictions generated and stored successfully");
  } catch (error: any) {
    console.error("❌ Failed to generate predictions:", error.message);
  }
}
