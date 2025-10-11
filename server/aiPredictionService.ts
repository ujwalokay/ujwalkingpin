import OpenAI from "openai";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  try {
    const now = new Date();
    const timeOfDay = now.getHours();
    const dayOfWeek = now.getDay();

    const prompt = `You are an AI assistant for a gaming center that predicts customer load and demand. Based on the following current metrics, predict the expected load for the next ${horizon}.

Current Metrics:
- Active Sessions: ${currentMetrics.activeSessions}
- Average Session Length: ${currentMetrics.avgSessionLength} minutes
- Food Orders: ${currentMetrics.foodOrders}
- Capacity Utilization: ${currentMetrics.capacityUtilization}%
- Time of Day: ${timeOfDay}:00 (24-hour format)
- Day of Week: ${dayOfWeek} (0=Sunday, 6=Saturday)

Consider typical patterns:
- Gaming centers are busiest on weekends and evenings (6pm-11pm)
- Lunch hours (12pm-2pm) and dinner hours (6pm-8pm) typically see more food orders
- After-school hours (3pm-7pm) on weekdays attract younger customers
- Late nights (10pm-2am) on weekends see high capacity

Provide a prediction in JSON format with:
{
  "predictedLoad": <integer 0-100 representing predicted capacity utilization %>,
  "confidence": <float 0-1 representing prediction confidence>,
  "reasoning": "<brief explanation of the prediction>"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert at predicting customer demand patterns for gaming centers. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      predictedLoad: Math.max(0, Math.min(100, Math.round(result.predictedLoad || 0))),
      horizon,
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      features: {
        timeOfDay,
        dayOfWeek,
        currentUtilization: currentMetrics.capacityUtilization,
        reasoning: result.reasoning || "No reasoning provided",
      },
    };
  } catch (error: any) {
    throw new Error(`Failed to generate load prediction: ${error.message}`);
  }
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
        modelVersion: "gpt-5-v1",
        features: prediction.features,
      });
    }

    console.log("✅ Load predictions generated and stored successfully");
  } catch (error: any) {
    console.error("❌ Failed to generate predictions:", error.message);
  }
}
