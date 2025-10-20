import OpenAI from "openai";
import { storage } from "./storage";
import type { DeviceMaintenance } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export async function generateMaintenancePredictions(): Promise<AIMaintenanceInsights> {
  const maintenanceRecords = await storage.getAllDeviceMaintenance();
  const deviceConfigs = await storage.getAllDeviceConfigs();

  const allDevices: Array<{ category: string; seatName: string }> = [];
  deviceConfigs.forEach(config => {
    config.seats.forEach(seat => {
      allDevices.push({ category: config.category, seatName: seat });
    });
  });

  const predictions: MaintenancePrediction[] = [];

  for (const device of allDevices) {
    const maintenance = maintenanceRecords.find(
      m => m.category === device.category && m.seatName === device.seatName
    );

    const usageHours = maintenance?.totalUsageHours || 0;
    const totalSessions = maintenance?.totalSessions || 0;
    const issuesReported = maintenance?.issuesReported || 0;
    const lastMaintenance = maintenance?.lastMaintenanceDate;
    
    const daysSinceLastMaintenance = lastMaintenance
      ? Math.floor((Date.now() - new Date(lastMaintenance).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let riskLevel: "low" | "medium" | "high" = "low";
    let estimatedDays = 90;
    let recommendedAction = "Continue regular monitoring";

    if (usageHours > 500 || (daysSinceLastMaintenance && daysSinceLastMaintenance > 60) || issuesReported > 2) {
      riskLevel = "high";
      estimatedDays = 7;
      recommendedAction = "Schedule immediate maintenance";
    } else if (usageHours > 300 || (daysSinceLastMaintenance && daysSinceLastMaintenance > 30) || issuesReported > 0) {
      riskLevel = "medium";
      estimatedDays = 30;
      recommendedAction = "Plan maintenance within the month";
    }

    const prediction: MaintenancePrediction = {
      category: device.category,
      seatName: device.seatName,
      riskLevel,
      recommendedAction,
      estimatedDaysUntilMaintenance: estimatedDays,
      reasoning: `Based on ${usageHours}h usage, ${totalSessions} sessions, ${issuesReported} issues${daysSinceLastMaintenance ? `, ${daysSinceLastMaintenance} days since last maintenance` : ''}`,
      metrics: {
        usageHours,
        totalSessions,
        issuesReported,
        daysSinceLastMaintenance,
      },
    };

    predictions.push(prediction);
  }

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

  return {
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert in predictive maintenance for gaming equipment. Provide concise, actionable recommendations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "Unable to generate recommendation at this time.";
  } catch (error) {
    console.error("Error getting AI recommendation:", error);
    return "AI recommendation unavailable. Please use rule-based predictions.";
  }
}
