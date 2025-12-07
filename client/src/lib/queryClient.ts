/* queryClient.ts - Offline-only query client configuration */

import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { localDb } from "./tauri-db";

type UnauthorizedBehavior = "returnNull" | "throw";

export async function apiRequest<T = any>(
  method: string,
  url: string,
  body?: any
): Promise<T> {
  const endpoint = url.replace(/^\/api\//, '');
  
  if (method === 'GET') {
    return handleGetRequest(endpoint) as T;
  } else if (method === 'POST') {
    return handlePostRequest(endpoint, body) as T;
  } else if (method === 'PATCH' || method === 'PUT') {
    return handlePatchRequest(endpoint, body) as T;
  } else if (method === 'DELETE') {
    return handleDeleteRequest(endpoint) as T;
  }
  
  throw new Error(`Unsupported method: ${method}`);
}

async function handleGetRequest(endpoint: string): Promise<any> {
  if (endpoint === 'bookings') return localDb.getAllBookings();
  if (endpoint === 'bookings/active') return localDb.getActiveBookings();
  if (endpoint.startsWith('bookings/')) {
    const id = endpoint.split('/')[1];
    return localDb.getBookingById(id);
  }
  if (endpoint === 'device-config') return localDb.getAllDeviceConfigs();
  if (endpoint === 'pricing-config') return localDb.getAllPricingConfigs();
  if (endpoint === 'food') return localDb.getAllFoodItems();
  if (endpoint === 'food-items') return localDb.getAllFoodItems();
  if (endpoint.startsWith('food-items/')) {
    const id = endpoint.split('/')[1];
    return localDb.getFoodItemById(id);
  }
  if (endpoint === 'expenses') return localDb.getAllExpenses();
  if (endpoint === 'history') return localDb.getBookingHistory();
  if (endpoint === 'booking-history') return localDb.getBookingHistory();
  if (endpoint === 'activity-logs') return localDb.getActivityLogs();
  if (endpoint === 'notifications') return localDb.getNotifications();
  if (endpoint === 'notifications/unread') return localDb.getUnreadNotifications();
  if (endpoint === 'happy-hours-config') return localDb.getAllHappyHoursConfigs();
  if (endpoint === 'happy-hours-pricing') return localDb.getAllHappyHoursPricing();
  if (endpoint === 'gaming-center-info') return localDb.getGamingCenterInfo();
  if (endpoint === 'session-groups') return localDb.getAllSessionGroups();
  if (endpoint === 'users') return localDb.getAllUsers();
  if (endpoint === 'staff-visibility') return localDb.getStaffVisibilitySettings();
  if (endpoint === 'app-settings') return localDb.getAppSettings();
  if (endpoint === 'server-time') return { serverTime: new Date().toISOString() };
  if (endpoint === 'inventory') return localDb.getInventoryItems();
  if (endpoint === 'inventory/low-stock') return localDb.getLowStockItems();
  if (endpoint === 'inventory/reorder-list') return localDb.getReorderList();
  if (endpoint === 'stock-batches') return localDb.getAllStockBatches();
  if (endpoint === 'food-items/inventory') return localDb.getInventoryItems();
  if (endpoint === 'food-items/expiring') return localDb.getExpiringItems();
  if (endpoint.startsWith('analytics/usage')) {
    const params = new URLSearchParams(endpoint.split('?')[1] || '');
    return localDb.getAnalyticsUsage(params.get('timeRange') || 'today');
  }
  if (endpoint === 'ai/traffic/predictions') return localDb.getTrafficPredictions();
  if (endpoint === 'ai/maintenance/predictions') return localDb.getMaintenancePredictions();
  
  // Reports endpoints with query params
  if (endpoint.startsWith('reports/stats')) {
    const params = new URLSearchParams(endpoint.split('?')[1] || '');
    const period = params.get('period') || 'daily';
    const startDate = params.get('startDate') || undefined;
    const endDate = params.get('endDate') || undefined;
    return localDb.getReportsStats(period, startDate, endDate);
  }
  if (endpoint.startsWith('reports/history')) {
    const params = new URLSearchParams(endpoint.split('?')[1] || '');
    const period = params.get('period') || 'daily';
    const startDate = params.get('startDate') || undefined;
    const endDate = params.get('endDate') || undefined;
    return localDb.getReportsHistory(period, startDate, endDate);
  }
  
  console.warn(`Unhandled GET endpoint: ${endpoint}`);
  return null;
}

async function handlePostRequest(endpoint: string, body: any): Promise<any> {
  if (endpoint === 'bookings') return localDb.createBooking(body);
  
  // Device config: if has category/count/seats, upsert; otherwise create single
  if (endpoint === 'device-config') {
    if (body.category && (body.count !== undefined || body.seats)) {
      return localDb.upsertDeviceConfig(body);
    }
    return localDb.createDeviceConfig(body);
  }
  
  // Pricing config: if has category and configs array, do bulk upsert
  if (endpoint === 'pricing-config') {
    if (body.category && Array.isArray(body.configs)) {
      // Delete existing configs for this category first, then upsert new ones
      await localDb.deleteAllPricingConfigsByCategory(body.category);
      const configsWithCategory = body.configs.map((c: any) => ({
        ...c,
        category: body.category,
      }));
      return localDb.upsertPricingConfigs(configsWithCategory);
    }
    return localDb.createPricingConfig(body);
  }
  
  // Happy hours config: if has category and configs array, do bulk upsert
  if (endpoint === 'happy-hours-config') {
    if (body.category && Array.isArray(body.configs)) {
      const configsWithCategory = body.configs.map((c: any) => ({
        ...c,
        category: body.category,
      }));
      return localDb.upsertHappyHoursConfigs(configsWithCategory);
    }
    return localDb.createHappyHoursConfig(body);
  }
  
  // Happy hours pricing: if has category and configs array, do bulk upsert
  if (endpoint === 'happy-hours-pricing') {
    if (body.category && Array.isArray(body.configs)) {
      await localDb.deleteAllHappyHoursPricingByCategory(body.category);
      const configsWithCategory = body.configs.map((c: any) => ({
        ...c,
        category: body.category,
      }));
      return localDb.upsertHappyHoursPricing(configsWithCategory);
    }
    return localDb.createHappyHoursPricing(body);
  }
  
  if (endpoint === 'food') return localDb.createFoodItem(body);
  if (endpoint === 'food-items') return localDb.createFoodItem(body);
  
  // Food items inventory operations
  const foodItemsInventoryMatch = endpoint.match(/^food-items\/([^/]+)\/add-to-inventory$/);
  if (foodItemsInventoryMatch) {
    const id = foodItemsInventoryMatch[1];
    return localDb.addToInventory(id);
  }
  
  const foodItemsRemoveInventoryMatch = endpoint.match(/^food-items\/([^/]+)\/remove-from-inventory$/);
  if (foodItemsRemoveInventoryMatch) {
    const id = foodItemsRemoveInventoryMatch[1];
    return localDb.removeFromInventory(id);
  }
  
  const foodItemsAdjustStockMatch = endpoint.match(/^food-items\/([^/]+)\/adjust-stock$/);
  if (foodItemsAdjustStockMatch) {
    const id = foodItemsAdjustStockMatch[1];
    return localDb.adjustStock(id, body.quantity, body.type);
  }
  
  if (endpoint === 'expenses') return localDb.createExpense(body);
  if (endpoint === 'activity-logs') return localDb.createActivityLog(body);
  if (endpoint === 'notifications') return localDb.createNotification(body);
  if (endpoint === 'notifications/mark-all-read') {
    await localDb.markAllNotificationsAsRead();
    return { success: true };
  }
  if (endpoint === 'session-groups') return localDb.createSessionGroup(body);
  if (endpoint === 'users') return localDb.createUser(body);
  if (endpoint === 'bookings/archive') return localDb.archiveBooking(body);
  if (endpoint === 'bookings/archive-expired') return localDb.archiveExpiredBookings();
  if (endpoint === 'bookings/payment-status') {
    const { bookingIds, paymentStatus, paymentMethod } = body;
    let count = 0;
    for (const id of bookingIds) {
      await localDb.updateBooking(id, { paymentStatus, paymentMethod });
      count++;
    }
    return { success: true, count };
  }
  if (endpoint === 'stock-batches') return localDb.createStockBatch(body);
  if (endpoint === 'auth/complete-onboarding') {
    return { success: true };
  }
  
  // Maintenance issue reporting
  const maintenanceReportMatch = endpoint.match(/^maintenance\/([^/]+)\/([^/]+)\/report-issue$/);
  if (maintenanceReportMatch) {
    const category = maintenanceReportMatch[1];
    const seatName = decodeURIComponent(maintenanceReportMatch[2]);
    return localDb.reportDeviceIssue(category, seatName, body.issueType);
  }
  
  console.warn(`Unhandled POST endpoint: ${endpoint}`);
  return null;
}

async function handlePatchRequest(endpoint: string, body: any): Promise<any> {
  if (endpoint.startsWith('bookings/')) {
    const id = endpoint.split('/')[1];
    return localDb.updateBooking(id, body);
  }
  if (endpoint.startsWith('device-config/')) {
    const id = endpoint.split('/')[1];
    return localDb.updateDeviceConfig(id, body);
  }
  if (endpoint.startsWith('pricing-config/')) {
    const id = endpoint.split('/')[1];
    return localDb.updatePricingConfig(id, body);
  }
  if (endpoint.startsWith('food/')) {
    const id = endpoint.split('/')[1];
    return localDb.updateFoodItem(id, body);
  }
  if (endpoint.startsWith('food-items/')) {
    const id = endpoint.split('/')[1];
    return localDb.updateFoodItem(id, body);
  }
  if (endpoint.startsWith('expenses/')) {
    const id = endpoint.split('/')[1];
    return localDb.updateExpense(id, body);
  }
  if (endpoint.startsWith('users/')) {
    const id = endpoint.split('/')[1];
    return localDb.updateUser(id, body);
  }
  if (endpoint.startsWith('notifications/') && endpoint.endsWith('/read')) {
    const id = endpoint.split('/')[1];
    await localDb.markNotificationAsRead(id);
    return { success: true };
  }
  if (endpoint.startsWith('happy-hours-config/')) {
    const id = endpoint.split('/')[1];
    return localDb.updateHappyHoursConfig(id, body);
  }
  if (endpoint.startsWith('happy-hours-pricing/')) {
    const id = endpoint.split('/')[1];
    return localDb.updateHappyHoursPricing(id, body);
  }
  if (endpoint === 'gaming-center-info') return localDb.updateGamingCenterInfo(body);
  if (endpoint === 'staff-visibility') return localDb.updateStaffVisibilitySettings(body);
  if (endpoint === 'app-settings') return localDb.updateAppSettings(body);
  
  // Maintenance status update (PUT request comes through PATCH handler)
  const maintenanceStatusMatch = endpoint.match(/^maintenance\/([^/]+)\/([^/]+)\/status$/);
  if (maintenanceStatusMatch) {
    const category = maintenanceStatusMatch[1];
    const seatName = decodeURIComponent(maintenanceStatusMatch[2]);
    return localDb.updateDeviceMaintenanceStatus(category, seatName, body.status, body.notes);
  }
  
  console.warn(`Unhandled PATCH endpoint: ${endpoint}`);
  return null;
}

async function handleDeleteRequest(endpoint: string): Promise<any> {
  if (endpoint.startsWith('bookings/')) {
    const id = endpoint.split('/')[1];
    await localDb.deleteBooking(id);
    return { success: true };
  }
  if (endpoint.startsWith('device-config/')) {
    const id = endpoint.split('/')[1];
    await localDb.deleteDeviceConfig(id);
    return { success: true };
  }
  if (endpoint.startsWith('pricing-config/')) {
    const id = endpoint.split('/')[1];
    await localDb.deletePricingConfig(id);
    return { success: true };
  }
  if (endpoint.startsWith('food/')) {
    const id = endpoint.split('/')[1];
    await localDb.deleteFoodItem(id);
    return { success: true };
  }
  if (endpoint.startsWith('food-items/')) {
    const id = endpoint.split('/')[1];
    await localDb.deleteFoodItem(id);
    return { success: true };
  }
  if (endpoint.startsWith('expenses/')) {
    const id = endpoint.split('/')[1];
    await localDb.deleteExpense(id);
    return { success: true };
  }
  if (endpoint.startsWith('users/')) {
    const id = endpoint.split('/')[1];
    await localDb.deleteUser(id);
    return { success: true };
  }
  if (endpoint.startsWith('session-groups/')) {
    const id = endpoint.split('/')[1];
    await localDb.deleteSessionGroup(id);
    return { success: true };
  }
  if (endpoint.startsWith('notifications/')) {
    const id = endpoint.split('/')[1];
    await localDb.deleteNotification(id);
    return { success: true };
  }
  if (endpoint.startsWith('happy-hours-config/')) {
    const id = endpoint.split('/')[1];
    await localDb.deleteHappyHoursConfig(id);
    return { success: true };
  }
  if (endpoint.startsWith('happy-hours-pricing/')) {
    const id = endpoint.split('/')[1];
    await localDb.deleteHappyHoursPricing(id);
    return { success: true };
  }
  
  console.warn(`Unhandled DELETE endpoint: ${endpoint}`);
  return null;
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/");
    const endpoint = url.replace(/^\/api\//, '');
    
    try {
      return await handleGetRequest(endpoint);
    } catch (error) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 30000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
