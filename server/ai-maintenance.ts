import { storage } from "./storage";
import type { DeviceMaintenance } from "@shared/schema";

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

export interface MaintenanceInsights {
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

let cachedPredictions: { data: MaintenanceInsights; timestamp: number } | null = null;
let cacheGeneration = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export function invalidateMaintenanceCache() {
  cachedPredictions = null;
  cacheGeneration++;
}

export async function generateMaintenancePredictions(): Promise<MaintenanceInsights> {
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

    const prediction = calculateMaintenancePrediction(
      usageHours,
      totalSessions,
      issuesReported,
      daysSinceLastMaintenance
    );

    return {
      category: device.category,
      seatName: device.seatName,
      riskLevel: prediction.riskLevel,
      recommendedAction: prediction.recommendedAction,
      estimatedDaysUntilMaintenance: prediction.estimatedDays,
      reasoning: prediction.reasoning,
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

function calculateMaintenancePrediction(
  usageHours: number,
  totalSessions: number,
  issuesReported: number,
  daysSinceLastMaintenance: number | null
) {
  let riskLevel: "low" | "medium" | "high" = "low";
  let estimatedDays = 90;
  let recommendedAction = "Continue regular monitoring";
  let reasoning = "";

  const averageSessionDuration = totalSessions > 0 ? usageHours / totalSessions : 0;
  const usageIntensity = averageSessionDuration;
  
  let riskScore = 0;
  
  if (usageHours > 500) riskScore += 40;
  else if (usageHours > 300) riskScore += 25;
  else if (usageHours > 150) riskScore += 10;
  
  if (totalSessions > 200) riskScore += 25;
  else if (totalSessions > 100) riskScore += 15;
  else if (totalSessions > 50) riskScore += 5;
  
  if (issuesReported > 3) riskScore += 30;
  else if (issuesReported > 1) riskScore += 20;
  else if (issuesReported > 0) riskScore += 10;
  
  if (daysSinceLastMaintenance !== null) {
    if (daysSinceLastMaintenance > 90) riskScore += 35;
    else if (daysSinceLastMaintenance > 60) riskScore += 25;
    else if (daysSinceLastMaintenance > 30) riskScore += 10;
  } else {
    riskScore += 15;
  }
  
  if (usageIntensity > 3) riskScore += 10;
  else if (usageIntensity > 2) riskScore += 5;

  if (riskScore >= 70) {
    riskLevel = "high";
    estimatedDays = Math.max(3, 14 - Math.floor(riskScore / 10));
    recommendedAction = "Schedule immediate maintenance - device needs urgent attention";
    reasoning = `Critical condition detected: ${Math.round(usageHours)}h total usage, ${totalSessions} sessions, ${issuesReported} issue(s) reported${daysSinceLastMaintenance ? `, ${daysSinceLastMaintenance} days since last maintenance` : ', never serviced'}. Risk score: ${riskScore}/100. Immediate maintenance required to prevent breakdown.`;
  } else if (riskScore >= 40) {
    riskLevel = "medium";
    estimatedDays = Math.max(14, 45 - Math.floor(riskScore / 2));
    recommendedAction = "Plan preventive maintenance within 2-4 weeks";
    reasoning = `Moderate wear detected: ${Math.round(usageHours)}h total usage, ${totalSessions} sessions, ${issuesReported} issue(s) reported${daysSinceLastMaintenance ? `, ${daysSinceLastMaintenance} days since last maintenance` : ', never serviced'}. Risk score: ${riskScore}/100. Preventive maintenance recommended to avoid future issues.`;
  } else {
    riskLevel = "low";
    estimatedDays = Math.max(30, 90 - riskScore);
    recommendedAction = "Continue regular monitoring";
    reasoning = `Normal operation: ${Math.round(usageHours)}h total usage, ${totalSessions} sessions, ${issuesReported} issue(s) reported${daysSinceLastMaintenance ? `, ${daysSinceLastMaintenance} days since last maintenance` : ', never serviced'}. Risk score: ${riskScore}/100. Device is operating within safe parameters.`;
  }

  return { riskLevel, estimatedDays, recommendedAction, reasoning };
}

export async function getMaintenanceRecommendation(
  deviceData: {
    category: string;
    seatName: string;
    usageHours: number;
    sessions: number;
    issues: number;
    daysSinceMaintenance: number | null;
  }
): Promise<string> {
  const prediction = calculateMaintenancePrediction(
    deviceData.usageHours,
    deviceData.sessions,
    deviceData.issues,
    deviceData.daysSinceMaintenance
  );

  let recommendation = `${deviceData.category} - ${deviceData.seatName}: `;
  
  if (prediction.riskLevel === "high") {
    recommendation += `⚠️ URGENT - Schedule maintenance within ${prediction.estimatedDays} days. `;
    recommendation += `Device has accumulated ${Math.round(deviceData.usageHours)} hours of use across ${deviceData.sessions} sessions`;
    if (deviceData.issues > 0) {
      recommendation += ` with ${deviceData.issues} reported issue(s)`;
    }
    recommendation += `. Immediate attention required to prevent downtime.`;
  } else if (prediction.riskLevel === "medium") {
    recommendation += `📋 Plan maintenance within ${prediction.estimatedDays} days. `;
    recommendation += `Preventive servicing recommended based on ${Math.round(deviceData.usageHours)} usage hours`;
    if (deviceData.daysSinceMaintenance) {
      recommendation += ` and ${deviceData.daysSinceMaintenance} days since last service`;
    }
    recommendation += `. Early intervention will extend device lifespan.`;
  } else {
    recommendation += `✓ Operating normally. Next routine check recommended in ${prediction.estimatedDays} days. `;
    recommendation += `Current metrics are within acceptable ranges.`;
  }

  return recommendation;
}
