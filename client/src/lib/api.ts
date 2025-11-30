import type { Booking, InsertBooking, DeviceConfig, PricingConfig } from "@shared/schema";
import { localDb, isTauri } from './tauri-db';

async function parseErrorResponse(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      return errorData.message || fallbackMessage;
    } else {
      const text = await response.text();
      return text || fallbackMessage;
    }
  } catch {
    return fallbackMessage;
  }
}

export function getApiMode(): 'web' | 'tauri' {
  return isTauri() ? 'tauri' : 'web';
}

export async function fetchBookings(): Promise<Booking[]> {
  if (isTauri()) {
    return localDb.getAllBookings() as Promise<Booking[]>;
  }
  const response = await fetch("/api/bookings", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch bookings");
    throw new Error(message);
  }
  return response.json();
}

export async function fetchActiveBookings(): Promise<Booking[]> {
  if (isTauri()) {
    return localDb.getActiveBookings() as Promise<Booking[]>;
  }
  const response = await fetch("/api/bookings/active", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch active bookings");
    throw new Error(message);
  }
  return response.json();
}

export async function createBooking(booking: InsertBooking): Promise<Booking> {
  if (isTauri()) {
    return localDb.createBooking(booking) as Promise<Booking>;
  }
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to create booking");
    throw new Error(message);
  }
  return response.json();
}

export async function updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking> {
  if (isTauri()) {
    return localDb.updateBooking(id, data) as Promise<Booking>;
  }
  const response = await fetch(`/api/bookings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to update booking");
    throw new Error(message);
  }
  return response.json();
}

export async function deleteBooking(id: string): Promise<void> {
  if (isTauri()) {
    return localDb.deleteBooking(id);
  }
  const response = await fetch(`/api/bookings/${id}`, {
    method: "DELETE",
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to delete booking");
    throw new Error(message);
  }
}

export async function fetchDeviceConfigs(): Promise<DeviceConfig[]> {
  if (isTauri()) {
    return localDb.getAllDeviceConfigs() as Promise<DeviceConfig[]>;
  }
  const response = await fetch("/api/device-config", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch device configs");
    throw new Error(message);
  }
  return response.json();
}

export async function fetchPricingConfigs(): Promise<PricingConfig[]> {
  if (isTauri()) {
    return localDb.getAllPricingConfigs() as Promise<PricingConfig[]>;
  }
  const response = await fetch("/api/pricing-config", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch pricing configs");
    throw new Error(message);
  }
  return response.json();
}

export async function getServerTime(): Promise<Date> {
  if (isTauri()) {
    return new Date();
  }
  const response = await fetch("/api/server-time", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch server time");
    throw new Error(message);
  }
  const data = await response.json();
  return new Date(data.serverTime);
}

export async function fetchFoodItems() {
  if (isTauri()) {
    return localDb.getAllFoodItems();
  }
  const response = await fetch("/api/food", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch food items");
    throw new Error(message);
  }
  return response.json();
}

export async function fetchExpenses() {
  if (isTauri()) {
    return localDb.getAllExpenses();
  }
  const response = await fetch("/api/expenses", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch expenses");
    throw new Error(message);
  }
  return response.json();
}

export async function fetchBookingHistory() {
  if (isTauri()) {
    return localDb.getBookingHistory();
  }
  const response = await fetch("/api/history", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch booking history");
    throw new Error(message);
  }
  return response.json();
}

export async function fetchActivityLogs() {
  if (isTauri()) {
    return localDb.getActivityLogs();
  }
  const response = await fetch("/api/activity-logs", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch activity logs");
    throw new Error(message);
  }
  return response.json();
}

export async function fetchNotifications() {
  if (isTauri()) {
    return localDb.getNotifications();
  }
  const response = await fetch("/api/notifications", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch notifications");
    throw new Error(message);
  }
  return response.json();
}

export async function fetchUnreadNotifications() {
  if (isTauri()) {
    return localDb.getUnreadNotifications();
  }
  const response = await fetch("/api/notifications/unread", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch unread notifications");
    throw new Error(message);
  }
  return response.json();
}

export async function fetchHappyHoursConfigs() {
  if (isTauri()) {
    return localDb.getAllHappyHoursConfigs();
  }
  const response = await fetch("/api/happy-hours-config", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch happy hours configs");
    throw new Error(message);
  }
  return response.json();
}

export async function fetchHappyHoursPricing() {
  if (isTauri()) {
    return localDb.getAllHappyHoursPricing();
  }
  const response = await fetch("/api/happy-hours-pricing", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch happy hours pricing");
    throw new Error(message);
  }
  return response.json();
}

export async function fetchGamingCenterInfo() {
  if (isTauri()) {
    return localDb.getGamingCenterInfo();
  }
  const response = await fetch("/api/gaming-center-info", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch gaming center info");
    throw new Error(message);
  }
  return response.json();
}

export { isTauri };
