import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface HourlyTrafficPrediction {
  hour: string;
  predictedVisitors: number;
  confidence: "low" | "medium" | "high";
}

export interface TrafficPredictionResult {
  predictions: HourlyTrafficPrediction[];
  summary: {
    peakHour: string;
    peakVisitors: number;
    totalPredictedVisitors: number;
    averageVisitors: number;
    insights: string[];
  };
  generatedAt: Date;
}

export async function generateTrafficPredictions(): Promise<TrafficPredictionResult> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const allBookings = await storage.getAllBookings();
  const allHistoricalBookings = await storage.getAllBookingHistory();

  const historicalData = [];
  for (let daysAgo = 1; daysAgo <= 30; daysAgo++) {
    const dayStart = new Date(now);
    dayStart.setDate(now.getDate() - daysAgo);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayBookings = allHistoricalBookings.filter(b => {
      const start = new Date(b.startTime);
      return start >= dayStart && start <= dayEnd && b.bookingType === "walk-in";
    });

    const hourlyPattern = Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date(dayStart);
      hourStart.setHours(hour);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1);

      const hourBookings = dayBookings.filter(b => {
        const start = new Date(b.startTime);
        return start >= hourStart && start < hourEnd;
      });

      return hourBookings.length;
    });

    historicalData.push({
      date: dayStart.toISOString().split('T')[0],
      dayOfWeek: dayStart.toLocaleDateString('en-US', { weekday: 'long' }),
      hourlyPattern,
    });
  }

  const todayDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = now.getHours();

  const todayActual = allBookings.filter(b => {
    const start = new Date(b.startTime);
    return start >= todayStart && start <= todayEnd && b.bookingType === "walk-in";
  });

  const todayHistorical = allHistoricalBookings.filter(b => {
    const start = new Date(b.startTime);
    return start >= todayStart && start <= todayEnd && b.bookingType === "walk-in";
  });

  const todayBookings = [...todayActual, ...todayHistorical];

  const hasGemini = !!process.env.GEMINI_API_KEY;

  let predictions: HourlyTrafficPrediction[] = [];

  if (hasGemini && historicalData.length > 0) {
    try {
      predictions = await getAITrafficPrediction(
        historicalData,
        todayDayOfWeek,
        currentHour,
        todayBookings
      );
    } catch (error) {
      console.error("AI traffic prediction failed, falling back to heuristics:", error);
      predictions = getHeuristicTrafficPrediction(historicalData, todayDayOfWeek, currentHour, todayBookings);
    }
  } else {
    predictions = getHeuristicTrafficPrediction(historicalData, todayDayOfWeek, currentHour, todayBookings);
  }

  const peakPrediction = predictions.reduce((max, p) => 
    p.predictedVisitors > max.predictedVisitors ? p : max
  , predictions[0] || { hour: "12:00", predictedVisitors: 0 });

  const totalPredicted = predictions.reduce((sum, p) => sum + p.predictedVisitors, 0);
  const avgVisitors = predictions.length > 0 ? Math.round(totalPredicted / predictions.length) : 0;

  const insights: string[] = [];
  const highConfidence = predictions.filter(p => p.confidence === "high").length;
  const futureHours = predictions.filter(p => {
    const [hour] = p.hour.split(':').map(Number);
    return hour >= currentHour;
  });

  if (peakPrediction.predictedVisitors > 0) {
    insights.push(`Peak traffic expected at ${peakPrediction.hour} with ${peakPrediction.predictedVisitors} visitors`);
  }

  if (futureHours.length > 0) {
    const avgFuture = Math.round(futureHours.reduce((s, p) => s + p.predictedVisitors, 0) / futureHours.length);
    insights.push(`Average ${avgFuture} visitors expected per hour for rest of the day`);
  }

  if (highConfidence > 0) {
    insights.push(`${highConfidence} hours have high-confidence predictions based on historical patterns`);
  }

  return {
    predictions,
    summary: {
      peakHour: peakPrediction.hour,
      peakVisitors: peakPrediction.predictedVisitors,
      totalPredictedVisitors: totalPredicted,
      averageVisitors: avgVisitors,
      insights,
    },
    generatedAt: new Date(),
  };
}

function getHeuristicTrafficPrediction(
  historicalData: any[],
  todayDayOfWeek: string,
  currentHour: number,
  todayBookings: any[]
): HourlyTrafficPrediction[] {
  const predictions: HourlyTrafficPrediction[] = [];

  const sameDayData = historicalData.filter(d => d.dayOfWeek === todayDayOfWeek);
  
  for (let hour = 0; hour < 24; hour++) {
    if (hour < currentHour) {
      const actualCount = todayBookings.filter(b => {
        const start = new Date(b.startTime);
        return start.getHours() === hour;
      }).length;

      predictions.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        predictedVisitors: actualCount,
        confidence: "high",
      });
    } else {
      let predictedVisitors = 0;
      let confidence: "low" | "medium" | "high" = "low";

      if (sameDayData.length > 0) {
        const hourlyAvg = sameDayData.reduce((sum, d) => sum + d.hourlyPattern[hour], 0) / sameDayData.length;
        predictedVisitors = Math.round(hourlyAvg);
        confidence = sameDayData.length >= 4 ? "high" : sameDayData.length >= 2 ? "medium" : "low";
      } else if (historicalData.length > 0) {
        const allDaysAvg = historicalData.reduce((sum, d) => sum + d.hourlyPattern[hour], 0) / historicalData.length;
        predictedVisitors = Math.round(allDaysAvg);
        confidence = "medium";
      }

      predictions.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        predictedVisitors,
        confidence,
      });
    }
  }

  return predictions;
}

async function getAITrafficPrediction(
  historicalData: any[],
  todayDayOfWeek: string,
  currentHour: number,
  todayBookings: any[]
): Promise<HourlyTrafficPrediction[]> {
  const sameDayData = historicalData.filter(d => d.dayOfWeek === todayDayOfWeek).slice(0, 4);
  
  const historicalSummary = sameDayData.map((d, i) => {
    const peakHour = d.hourlyPattern.indexOf(Math.max(...d.hourlyPattern));
    const total = d.hourlyPattern.reduce((s: number, v: number) => s + v, 0);
    return `Day ${i + 1} (${d.date}): Peak at ${peakHour}:00 with ${d.hourlyPattern[peakHour]} visitors, Total: ${total}`;
  }).join('\n');

  const todayPattern = Array.from({ length: currentHour }, (_, hour) => {
    const count = todayBookings.filter(b => {
      const start = new Date(b.startTime);
      return start.getHours() === hour;
    }).length;
    return `${hour}:00 - ${count} visitors`;
  }).join(', ');

  const prompt = `As an AI traffic prediction system for a gaming center, analyze historical data and predict visitor traffic for the remaining hours of today.

Today: ${todayDayOfWeek}
Current Hour: ${currentHour}:00
Today's Pattern So Far: ${todayPattern || 'No visitors yet'}

Historical Data (same day of week):
${historicalSummary}

Predict visitor count for hours ${currentHour} to 23. Respond in this exact JSON format:
{
  "predictions": [
    {"hour": "${currentHour}:00", "visitors": <number>, "confidence": "low|medium|high"},
    ...continue for each remaining hour until 23:00
  ]
}

Consider:
- Similar day patterns from history
- Today's trend so far
- Typical gaming center peak hours (evening 18:00-22:00)
- Be realistic with numbers (0-20 range typical)`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          predictions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                hour: { type: "string" },
                visitors: { type: "number" },
                confidence: { type: "string" },
              },
              required: ["hour", "visitors", "confidence"],
            },
          },
        },
        required: ["predictions"],
      },
      systemInstruction: "You are an expert in visitor traffic prediction for entertainment venues. Analyze patterns and provide structured JSON responses only.",
    },
    contents: prompt,
  });

  const rawJson = response.text;
  if (!rawJson) {
    throw new Error("No response from Gemini AI");
  }

  const parsed = JSON.parse(rawJson);
  const aiPredictions = parsed.predictions || [];

  const predictions: HourlyTrafficPrediction[] = [];

  for (let hour = 0; hour < 24; hour++) {
    if (hour < currentHour) {
      const actualCount = todayBookings.filter(b => {
        const start = new Date(b.startTime);
        return start.getHours() === hour;
      }).length;

      predictions.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        predictedVisitors: actualCount,
        confidence: "high",
      });
    } else {
      const aiPred = aiPredictions.find((p: any) => p.hour === `${hour}:00`);
      if (aiPred) {
        predictions.push({
          hour: aiPred.hour,
          predictedVisitors: Math.max(0, Math.round(aiPred.visitors)),
          confidence: aiPred.confidence || "medium",
        });
      } else {
        predictions.push({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          predictedVisitors: 0,
          confidence: "low",
        });
      }
    }
  }

  return predictions;
}
