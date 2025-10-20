import { GoogleGenAI } from "@google/genai";
import { storage } from "./storage";
import type { DeviceMaintenance } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MaintenancePrediction {
  category: string;
  seatName: string;
  riskLevel: "low" | "medium" | "high";
  recommendedAction: string;
  estimatedDaysUntilMaintenance: number;
  reasoning: string;
  metrics: {
    usageHours: number;
    totalSessions: number;
    issuesReported: number;
    daysSinceLastMaintenance: number | null;
  };
}

export interface AIMaintenanceInsights {
  predictions: MaintenancePrediction[];
  summary: {
    highRiskDevices: number;
    mediumRiskDevices: number;
    lowRiskDevices: number;
    totalDevices: number;
    recommendedActions: string[];
  };
  generatedAt: Date;
}

let cachedPredictions: { data: AIMaintenanceInsights; timestamp: number } | null = null;
let cacheGeneration = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export function invalidateMaintenanceCache() {
  cachedPredictions = null;
  cacheGeneration++;
}

export async function generateMaintenancePredictions(): Promise<AIMaintenanceInsights> {
  if (cachedPredictions && Date.now() - cachedPredictions.timestamp < CACHE_DURATION) {
    return cachedPredictions.data;
  }

  const currentGeneration = cacheGeneration;

  const [maintenanceRecords, deviceConfigs, bookingHistory] = await Promise.all([
    storage.getAllDeviceMaintenance(),
    storage.getAllDeviceConfigs(),
    storage.getAllBookingHistory()
  ]);

  const allDevices: Array<{ category: string; seatName: string }> = [];
  deviceConfigs.forEach(config => {
    config.seats.forEach(seat => {
      allDevices.push({ category: config.category, seatName: seat });
    });
  });

  const hasGemini = !!process.env.GEMINI_API_KEY;

  const predictionPromises = allDevices.map(async (device) => {
    const maintenance = maintenanceRecords.find(
      m => m.category === device.category && m.seatName === device.seatName
    );

    const deviceBookings = bookingHistory.filter(
      b => b.category === device.category && b.seatName === device.seatName
    );
    const historicalUsageHours = deviceBookings.reduce((sum, b) => {
      const duration = new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
      return sum + (duration / (1000 * 60 * 60));
    }, 0);

    const usageHours = (maintenance?.totalUsageHours || 0) + historicalUsageHours;
    const totalSessions = (maintenance?.totalSessions || 0) + deviceBookings.length;
    const issuesReported = maintenance?.issuesReported || 0;
    const lastMaintenance = maintenance?.lastMaintenanceDate;
    
    const daysSinceLastMaintenance = lastMaintenance
      ? Math.floor((Date.now() - new Date(lastMaintenance).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let riskLevel: "low" | "medium" | "high" = "low";
    let estimatedDays = 90;
    let recommendedAction = "Continue regular monitoring";
    let reasoning = "";

    if (hasGemini) {
      try {
        const aiAnalysis = await getAIPrediction({
          category: device.category,
          seatName: device.seatName,
          usageHours,
          totalSessions,
          issuesReported,
          daysSinceLastMaintenance,
        });

        riskLevel = aiAnalysis.riskLevel;
        estimatedDays = aiAnalysis.estimatedDays;
        recommendedAction = aiAnalysis.recommendedAction;
        reasoning = aiAnalysis.reasoning;
      } catch (error) {
        console.error(`AI prediction failed for ${device.category} - ${device.seatName}, falling back to heuristics:`, error);
        const heuristic = getHeuristicPrediction(usageHours, totalSessions, issuesReported, daysSinceLastMaintenance);
        riskLevel = heuristic.riskLevel;
        estimatedDays = heuristic.estimatedDays;
        recommendedAction = heuristic.recommendedAction;
        reasoning = heuristic.reasoning;
      }
    } else {
      const heuristic = getHeuristicPrediction(usageHours, totalSessions, issuesReported, daysSinceLastMaintenance);
      riskLevel = heuristic.riskLevel;
      estimatedDays = heuristic.estimatedDays;
      recommendedAction = heuristic.recommendedAction;
      reasoning = heuristic.reasoning;
    }

    return {
      category: device.category,
      seatName: device.seatName,
      riskLevel,
      recommendedAction,
      estimatedDaysUntilMaintenance: estimatedDays,
      reasoning,
      metrics: {
        usageHours,
        totalSessions,
        issuesReported,
        daysSinceLastMaintenance,
      },
    };
  });

  const predictions = await Promise.all(predictionPromises);

  const highRisk = predictions.filter(p => p.riskLevel === "high");
  const mediumRisk = predictions.filter(p => p.riskLevel === "medium");
  const lowRisk = predictions.filter(p => p.riskLevel === "low");

  const recommendedActions: string[] = [];
  if (highRisk.length > 0) {
    recommendedActions.push(`Prioritize maintenance for ${highRisk.length} high-risk device(s)`);
  }
  if (mediumRisk.length > 0) {
    recommendedActions.push(`Schedule preventive maintenance for ${mediumRisk.length} medium-risk device(s)`);
  }
  recommendedActions.push(`${lowRisk.length} device(s) operating normally`);

  const result = {
    predictions: predictions.sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    }),
    summary: {
      highRiskDevices: highRisk.length,
      mediumRiskDevices: mediumRisk.length,
      lowRiskDevices: lowRisk.length,
      totalDevices: predictions.length,
      recommendedActions,
    },
    generatedAt: new Date(),
  };

  if (currentGeneration === cacheGeneration) {
    cachedPredictions = { data: result, timestamp: Date.now() };
  }

  return result;
}

function getHeuristicPrediction(
  usageHours: number,
  totalSessions: number,
  issuesReported: number,
  daysSinceLastMaintenance: number | null
) {
  let riskLevel: "low" | "medium" | "high" = "low";
  let estimatedDays = 90;
  let recommendedAction = "Continue regular monitoring";
  let reasoning = "";

  if (usageHours > 500 || (daysSinceLastMaintenance && daysSinceLastMaintenance > 60) || issuesReported > 2) {
    riskLevel = "high";
    estimatedDays = 7;
    recommendedAction = "Schedule immediate maintenance";
    reasoning = `High usage detected: ${usageHours}h usage, ${totalSessions} sessions, ${issuesReported} issues${daysSinceLastMaintenance ? `, ${daysSinceLastMaintenance} days since last maintenance` : ''}. Immediate attention required.`;
  } else if (usageHours > 300 || (daysSinceLastMaintenance && daysSinceLastMaintenance > 30) || issuesReported > 0) {
    riskLevel = "medium";
    estimatedDays = 30;
    recommendedAction = "Plan maintenance within the month";
    reasoning = `Moderate usage detected: ${usageHours}h usage, ${totalSessions} sessions, ${issuesReported} issues${daysSinceLastMaintenance ? `, ${daysSinceLastMaintenance} days since last maintenance` : ''}. Preventive maintenance recommended.`;
  } else {
    reasoning = `Normal operation: ${usageHours}h usage, ${totalSessions} sessions, ${issuesReported} issues${daysSinceLastMaintenance ? `, ${daysSinceLastMaintenance} days since last maintenance` : ''}. Device is operating within normal parameters.`;
  }

  return { riskLevel, estimatedDays, recommendedAction, reasoning };
}

async function getAIPrediction(deviceData: {
  category: string;
  seatName: string;
  usageHours: number;
  totalSessions: number;
  issuesReported: number;
  daysSinceLastMaintenance: number | null;
}): Promise<{
  riskLevel: "low" | "medium" | "high";
  estimatedDays: number;
  recommendedAction: string;
  reasoning: string;
}> {
  const prompt = `As a predictive maintenance AI for gaming center equipment, analyze this device and provide a structured assessment:

Device: ${deviceData.category} - ${deviceData.seatName}
Usage Hours: ${deviceData.usageHours}
Total Sessions: ${deviceData.totalSessions}
Issues Reported: ${deviceData.issuesReported}
Days Since Last Maintenance: ${deviceData.daysSinceLastMaintenance || 'Never serviced'}

Analyze the data and respond in this exact JSON format:
{
  "riskLevel": "low|medium|high",
  "estimatedDays": <number of days until next maintenance needed>,
  "recommendedAction": "<brief action to take>",
  "reasoning": "<2-3 sentence explanation of your analysis>"
}

Consider:
- Gaming equipment typically needs maintenance every 60-90 days
- High usage (>400h) or many issues (>2) indicate higher risk
- Devices never serviced or not serviced in 45+ days need attention
- Be practical and specific in your recommendations`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          riskLevel: { type: "string" },
          estimatedDays: { type: "number" },
          recommendedAction: { type: "string" },
          reasoning: { type: "string" },
        },
        required: ["riskLevel", "estimatedDays", "recommendedAction", "reasoning"],
      },
      systemInstruction: "You are an expert in predictive maintenance for gaming equipment. Analyze data and provide structured JSON responses only. Be concise and actionable.",
    },
    contents: prompt,
  });

  const rawJson = response.text;
  if (!rawJson) {
    throw new Error("No response from Gemini AI");
  }

  const parsed = JSON.parse(rawJson);
  
  return {
    riskLevel: parsed.riskLevel as "low" | "medium" | "high",
    estimatedDays: parsed.estimatedDays,
    recommendedAction: parsed.recommendedAction,
    reasoning: parsed.reasoning,
  };
}

export async function getAIMaintenanceRecommendation(
  deviceData: {
    category: string;
    seatName: string;
    usageHours: number;
    sessions: number;
    issues: number;
    daysSinceMaintenance: number | null;
  }
): Promise<string> {
  try {
    const prompt = `As a predictive maintenance expert for gaming center equipment, analyze this device and provide a concise recommendation:

Device: ${deviceData.category} - ${deviceData.seatName}
Usage Hours: ${deviceData.usageHours}
Total Sessions: ${deviceData.sessions}
Issues Reported: ${deviceData.issues}
Days Since Last Maintenance: ${deviceData.daysSinceMaintenance || 'Never serviced'}

Provide a brief, actionable recommendation (2-3 sentences) focusing on:
1. Immediate action needed (if any)
2. Preventive measures
3. Expected service interval

Keep it concise and practical for gaming center staff.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are an expert in predictive maintenance for gaming equipment. Provide concise, actionable recommendations.",
      },
      contents: prompt,
    });

    return response.text || "Unable to generate recommendation at this time.";
  } catch (error) {
    console.error("Error getting AI recommendation:", error);
    return "AI recommendation unavailable. Please use rule-based predictions.";
  }
}
