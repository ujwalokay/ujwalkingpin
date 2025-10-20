import { GoogleGenAI } from "@google/genai";
import { db } from "./db";
import { geminiUsage, type GeminiUsage } from "@shared/schema";
import { eq } from "drizzle-orm";

const LIMITS = {
  RPM: 8,
  RPD: 200,
  MIN_REQUEST_INTERVAL: 8000,
};

interface RequestLog {
  timestamp: number;
  model: string;
}

class GeminiRateLimiter {
  private ai: GoogleGenAI;
  private requestLog: RequestLog[] = [];
  private requestQueue: Array<{ execute: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private initialized = false;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.initializeFromDatabase();
    setInterval(() => this.syncToDatabase(), 60000);
  }

  private async initializeFromDatabase() {
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [usage] = await db.select().from(geminiUsage).where(eq(geminiUsage.id, "gemini_usage_singleton"));

        if (usage) {
          if (usage.lastResetDate === today) {
            this.requestLog = usage.requestLog || [];
            this.cleanupOldLogs();
          } else {
            await db.update(geminiUsage)
              .set({ 
                requestsToday: 0, 
                lastResetDate: today,
                requestLog: [],
                updatedAt: new Date()
              })
              .where(eq(geminiUsage.id, "gemini_usage_singleton"));
            this.requestLog = [];
          }
        } else {
          await db.insert(geminiUsage).values({
            requestsToday: 0,
            lastResetDate: today,
            requestLog: [],
          });
          this.requestLog = [];
        }
        this.initialized = true;
        console.log(`✓ Gemini rate limiter initialized. Usage today: ${this.getRequestsToday()}/${LIMITS.RPD}`);
        return;
      } catch (error) {
        retries++;
        console.error(`Failed to initialize Gemini usage from database (attempt ${retries}/${maxRetries}):`, error);
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * retries));
        }
      }
    }

    console.error("⚠️  CRITICAL: Failed to initialize Gemini rate limiter after max retries. AI features will be DISABLED.");
    this.initialized = false;
  }

  private async syncToDatabase(): Promise<boolean> {
    if (!this.initialized) return false;

    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await db.update(geminiUsage)
          .set({
            requestsToday: this.getRequestsToday(),
            lastResetDate: today,
            requestLog: this.requestLog,
            updatedAt: new Date()
          })
          .where(eq(geminiUsage.id, "gemini_usage_singleton"));
        return true;
      } catch (error) {
        retries++;
        console.error(`Failed to sync Gemini usage to database (attempt ${retries}/${maxRetries}):`, error);
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.error("⚠️  CRITICAL: Failed to persist Gemini usage after max retries. Blocking further AI requests.");
    this.initialized = false;
    return false;
  }

  private cleanupOldLogs() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    this.requestLog = this.requestLog.filter(log => log.timestamp > oneDayAgo);
  }

  private getRequestsInLastMinute(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    return this.requestLog.filter(log => log.timestamp > oneMinuteAgo).length;
  }

  private getRequestsToday(): number {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return this.requestLog.filter(log => log.timestamp > startOfDay.getTime()).length;
  }

  public getUsageStats() {
    return {
      requestsLastMinute: this.getRequestsInLastMinute(),
      requestsToday: this.getRequestsToday(),
      limits: {
        rpm: LIMITS.RPM,
        rpd: LIMITS.RPD,
      },
      percentageUsed: {
        rpm: (this.getRequestsInLastMinute() / LIMITS.RPM) * 100,
        rpd: (this.getRequestsToday() / LIMITS.RPD) * 100,
      },
      canMakeRequest: this.canMakeRequest(),
      queueLength: this.requestQueue.length,
    };
  }

  private canMakeRequest(): boolean {
    if (!this.initialized) {
      return false;
    }

    const requestsLastMinute = this.getRequestsInLastMinute();
    const requestsToday = this.getRequestsToday();
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (requestsToday >= LIMITS.RPD) {
      console.warn(`⚠️  Daily limit reached (${requestsToday}/${LIMITS.RPD}). Requests will use heuristics.`);
      return false;
    }

    if (requestsLastMinute >= LIMITS.RPM) {
      return false;
    }

    if (timeSinceLastRequest < LIMITS.MIN_REQUEST_INTERVAL) {
      return false;
    }

    return true;
  }

  private async waitForSlot(): Promise<void> {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    while (!this.canMakeRequest()) {
      const requestsLastMinute = this.getRequestsInLastMinute();
      const requestsToday = this.getRequestsToday();

      if (requestsToday >= LIMITS.RPD) {
        throw new Error("DAILY_LIMIT_REACHED");
      }

      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      const waitTime = Math.max(LIMITS.MIN_REQUEST_INTERVAL - timeSinceLastRequest, 1000);

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      try {
        await this.waitForSlot();

        const item = this.requestQueue.shift();
        if (!item) break;

        try {
          const result = await item.execute();
          this.lastRequestTime = Date.now();
          this.requestLog.push({
            timestamp: Date.now(),
            model: "gemini-2.5-flash",
          });
          
          const synced = await this.syncToDatabase();
          if (!synced) {
            item.reject(new Error("Failed to persist usage data. Request blocked for safety."));
          } else {
            item.resolve(result);
          }
        } catch (error) {
          item.reject(error);
        }
      } catch (error: any) {
        if (error.message === "DAILY_LIMIT_REACHED") {
          while (this.requestQueue.length > 0) {
            const item = this.requestQueue.shift();
            if (item) {
              item.reject(new Error("DAILY_LIMIT_REACHED"));
            }
          }
          break;
        }
      }
    }

    this.isProcessingQueue = false;
  }

  public async generateContent(params: {
    model: string;
    config?: any;
    contents: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        return await this.ai.models.generateContent(params);
      };

      this.requestQueue.push({ execute, resolve, reject });
      this.processQueue();
    });
  }

  public shouldUseFallback(): boolean {
    if (!this.initialized) {
      console.warn("⚠️  Gemini rate limiter not initialized. Using fallback.");
      return true;
    }

    const requestsToday = this.getRequestsToday();
    const requestsLastMinute = this.getRequestsInLastMinute();
    
    const dailyUsagePercent = (requestsToday / LIMITS.RPD) * 100;
    const minuteUsagePercent = (requestsLastMinute / LIMITS.RPM) * 100;

    return dailyUsagePercent >= 90 || minuteUsagePercent >= 90;
  }
}

let rateLimiter: GeminiRateLimiter | null = null;

export function getGeminiRateLimiter(): GeminiRateLimiter {
  if (!rateLimiter) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    rateLimiter = new GeminiRateLimiter(apiKey);
  }
  return rateLimiter;
}

export function getGeminiUsageStats() {
  return getGeminiRateLimiter().getUsageStats();
}
