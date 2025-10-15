import { storage } from "./storage";

export interface CleanupResult {
  bookingHistory: number;
  activityLogs: number;
  loadMetrics: number;
  loadPredictions: number;
  expenses: number;
  totalDeleted: number;
}

export class RetentionService {
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
      const config = await storage.getRetentionConfig();
      
      // Clean booking history older than retention period
      results.bookingHistory = await storage.deleteOldBookingHistory(config.bookingHistoryDays);
      console.log(`  ✓ Deleted ${results.bookingHistory} old booking history records`);

      // Clean activity logs
      results.activityLogs = await storage.deleteOldActivityLogs(config.activityLogsDays);
      console.log(`  ✓ Deleted ${results.activityLogs} old activity logs`);

      // Clean load metrics
      results.loadMetrics = await storage.deleteOldLoadMetrics(config.loadMetricsDays);
      console.log(`  ✓ Deleted ${results.loadMetrics} old load metrics`);

      // Clean load predictions
      results.loadPredictions = await storage.deleteOldLoadPredictions(config.loadPredictionsDays);
      console.log(`  ✓ Deleted ${results.loadPredictions} old load predictions`);

      // Clean old expenses
      results.expenses = await storage.deleteOldExpenses(config.expensesDays);
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

  async getConfig() {
    return await storage.getRetentionConfig();
  }

  async updateConfig(newConfig: Partial<{ 
    bookingHistoryDays?: number;
    activityLogsDays?: number;
    loadMetricsDays?: number;
    loadPredictionsDays?: number;
    expensesDays?: number;
  }>) {
    const updated = await storage.updateRetentionConfig(newConfig);
    console.log('📝 Retention config updated:', updated);
    return updated;
  }
}

export const retentionService = new RetentionService();
