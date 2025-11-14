import { createApiClient } from '@neondatabase/api-client';

interface DatabaseMetrics {
  name: string;
  projectId: string;
  storageBytes: number;
  storageMB: number;
  limitMB: number;
  percentUsed: number;
  computeTimeSeconds: number;
  activeTimeSeconds: number;
  quotaResetAt: string | null;
}

interface StorageMetricsResponse {
  databases: DatabaseMetrics[];
  totalStorageMB: number;
  totalLimitMB: number;
  totalPercentUsed: number;
  lastUpdated: string;
}

function extractProjectId(databaseUrl: string): string | null {
  try {
    const match = databaseUrl.match(/([a-z0-9-]+)\.([a-z0-9-]+)\.neon\.tech/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchNeonStorageMetrics(): Promise<StorageMetricsResponse> {
  const apiKey = process.env.NEON_API_KEY;
  
  if (!apiKey) {
    throw new Error('NEON_API_KEY is not configured');
  }

  const databases = [
    { name: 'Main', url: process.env.DATABASE_URL_MAIN || process.env.DATABASE_URL },
    { name: 'History', url: process.env.DATABASE_URL_HISTORY },
    { name: 'Payments', url: process.env.DATABASE_URL_PAYMENTS },
    { name: 'Expenses', url: process.env.DATABASE_URL_EXPENSES },
    { name: 'Logs', url: process.env.DATABASE_URL_LOGS },
    { name: 'Analytics', url: process.env.DATABASE_URL_ANALYTICS },
  ];

  const apiClient = createApiClient({
    apiKey,
  });

  const metrics: DatabaseMetrics[] = [];
  const FREE_TIER_LIMIT_MB = 512;

  for (const db of databases) {
    if (!db.url) {
      continue;
    }

    const projectId = extractProjectId(db.url);
    if (!projectId) {
      console.warn(`Could not extract project ID from ${db.name} database URL`);
      continue;
    }

    try {
      const response = await apiClient.getProject(projectId);
      const project = response.data.project;

      const storageBytes = project.synthetic_storage_size || 0;
      const storageMB = storageBytes / (1024 * 1024);
      const percentUsed = (storageMB / FREE_TIER_LIMIT_MB) * 100;

      metrics.push({
        name: db.name,
        projectId,
        storageBytes,
        storageMB: Math.round(storageMB * 100) / 100,
        limitMB: FREE_TIER_LIMIT_MB,
        percentUsed: Math.round(percentUsed * 100) / 100,
        computeTimeSeconds: project.compute_time_seconds || 0,
        activeTimeSeconds: project.active_time_seconds || 0,
        quotaResetAt: project.quota_reset_at || null,
      });
    } catch (error: any) {
      console.error(`Error fetching metrics for ${db.name}:`, error.message);
      metrics.push({
        name: db.name,
        projectId,
        storageBytes: 0,
        storageMB: 0,
        limitMB: FREE_TIER_LIMIT_MB,
        percentUsed: 0,
        computeTimeSeconds: 0,
        activeTimeSeconds: 0,
        quotaResetAt: null,
      });
    }
  }

  const totalStorageMB = metrics.reduce((sum, m) => sum + m.storageMB, 0);
  const totalLimitMB = metrics.length * FREE_TIER_LIMIT_MB;
  const totalPercentUsed = (totalStorageMB / totalLimitMB) * 100;

  return {
    databases: metrics,
    totalStorageMB: Math.round(totalStorageMB * 100) / 100,
    totalLimitMB,
    totalPercentUsed: Math.round(totalPercentUsed * 100) / 100,
    lastUpdated: new Date().toISOString(),
  };
}
