import { storage } from "./storage";

export interface RetentionConfig {
  bookingHistory: number; // days
  activityLogs: number; // days
  loadMetrics: number; // days
  loadPredictions: number; // days
  expenses: number; // days - keep longer for accounting
}

export const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
  bookingHistory: 730, // 2 years
  activityLogs: 180, // 6 months
  loadMetrics: 90, // 3 months
  loadPredictions: 90, // 3 months
  expenses: 2555, // 7 years (for tax/accounting purposes)
};

export interface CleanupResult {
  bookingHistory: number;
  activityLogs: number;
  loadMetrics: number;
  loadPredictions: number;
  expenses: number;
  totalDeleted: number;
}

export class RetentionService {
  private config: RetentionConfig;

  constructor(config: RetentionConfig = DEFAULT_RETENTION_CONFIG) {
    this.config = config;
  }

  async runCleanup(): Promise<CleanupResult> {
    console.log('🧹 Starting data retention cleanup...');
    
    const results: CleanupResult = {
      bookingHistory: 0,
      activityLogs: 0,
      loadMetrics: 0,
      loadPredictions: 0,
      expenses: 0,
      totalDeleted: 0,
    };

    try {
      // Clean booking history older than retention period
      results.bookingHistory = await storage.deleteOldBookingHistory(this.config.bookingHistory);
      console.log(`  ✓ Deleted ${results.bookingHistory} old booking history records`);

      // Clean activity logs
      results.activityLogs = await storage.deleteOldActivityLogs(this.config.activityLogs);
      console.log(`  ✓ Deleted ${results.activityLogs} old activity logs`);

      // Clean load metrics
      results.loadMetrics = await storage.deleteOldLoadMetrics(this.config.loadMetrics);
      console.log(`  ✓ Deleted ${results.loadMetrics} old load metrics`);

      // Clean load predictions
      results.loadPredictions = await storage.deleteOldLoadPredictions(this.config.loadPredictions);
      console.log(`  ✓ Deleted ${results.loadPredictions} old load predictions`);

      // Clean old expenses (7 years default for tax purposes)
      results.expenses = await storage.deleteOldExpenses(this.config.expenses);
      console.log(`  ✓ Deleted ${results.expenses} old expenses`);

      results.totalDeleted = Object.values(results).reduce((sum, count) => 
        typeof count === 'number' ? sum + count : sum, 0
      );

      console.log(`✅ Cleanup complete! Total records deleted: ${results.totalDeleted}`);
      
      return results;
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }

  getConfig(): RetentionConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<RetentionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📝 Retention config updated:', this.config);
  }
}

export const retentionService = new RetentionService();
