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
  if (endpoint === 'expenses') return localDb.getAllExpenses();
  if (endpoint === 'history') return localDb.getBookingHistory();
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
  
  console.warn(`Unhandled GET endpoint: ${endpoint}`);
  return null;
}

async function handlePostRequest(endpoint: string, body: any): Promise<any> {
  if (endpoint === 'bookings') return localDb.createBooking(body);
  if (endpoint === 'device-config') return localDb.createDeviceConfig(body);
  if (endpoint === 'pricing-config') return localDb.createPricingConfig(body);
  if (endpoint === 'food') return localDb.createFoodItem(body);
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
  if (endpoint === 'gaming-center-info') return localDb.updateGamingCenterInfo(body);
  if (endpoint === 'staff-visibility') return localDb.updateStaffVisibilitySettings(body);
  if (endpoint === 'app-settings') return localDb.updateAppSettings(body);
  
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
