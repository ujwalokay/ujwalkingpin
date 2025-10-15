import { retentionService } from "./retention";

export class CleanupScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  start() {
    if (this.isRunning) {
      console.log('⏰ Cleanup scheduler is already running');
      return;
    }

    console.log('⏰ Starting automatic data cleanup scheduler...');
    console.log('📅 Cleanup will run daily at 2:00 AM');
    
    this.scheduleNextCleanup();
    this.isRunning = true;
  }

  stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('⏰ Cleanup scheduler stopped');
    }
  }

  private scheduleNextCleanup() {
    const now = new Date();
    const next2AM = new Date();
    
    next2AM.setHours(2, 0, 0, 0);
    
    if (now.getHours() >= 2) {
      next2AM.setDate(next2AM.getDate() + 1);
    }
    
    const msUntilNextRun = next2AM.getTime() - now.getTime();
    
    console.log(`⏰ Next cleanup scheduled for: ${next2AM.toLocaleString()}`);
    
    this.intervalId = setTimeout(async () => {
      await this.runCleanup();
      this.scheduleNextCleanup();
    }, msUntilNextRun);
  }

  private async runCleanup() {
    try {
      console.log('\n⏰ Running scheduled data cleanup...');
      const result = await retentionService.runCleanup();
      console.log(`✅ Scheduled cleanup completed. Total records deleted: ${result.totalDeleted}`);
    } catch (error) {
      console.error('❌ Error during scheduled cleanup:', error);
    }
  }

  async runNow(): Promise<void> {
    console.log('🔧 Running manual cleanup...');
    await this.runCleanup();
  }
}

export const cleanupScheduler = new CleanupScheduler();
