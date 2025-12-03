/* api.ts - Offline-only API layer using local SQLite database via Tauri */

import type { Booking, InsertBooking, DeviceConfig, PricingConfig } from "@shared/schema";
import { localDb, isTauri } from './tauri-db';

export function getApiMode(): 'tauri' {
  return 'tauri';
}

export async function fetchBookings(): Promise<Booking[]> {
  return localDb.getAllBookings() as unknown as Promise<Booking[]>;
}

export async function fetchActiveBookings(): Promise<Booking[]> {
  return localDb.getActiveBookings() as unknown as Promise<Booking[]>;
}

export async function createBooking(booking: InsertBooking): Promise<Booking> {
  return localDb.createBooking(booking) as unknown as Promise<Booking>;
}

export async function updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking> {
  return localDb.updateBooking(id, data) as unknown as Promise<Booking>;
}

export async function deleteBooking(id: string): Promise<void> {
  return localDb.deleteBooking(id);
}

export async function fetchDeviceConfigs(): Promise<DeviceConfig[]> {
  return localDb.getAllDeviceConfigs() as unknown as Promise<DeviceConfig[]>;
}

export async function fetchPricingConfigs(): Promise<PricingConfig[]> {
  return localDb.getAllPricingConfigs() as unknown as Promise<PricingConfig[]>;
}

export async function getServerTime(): Promise<Date> {
  return new Date();
}

export async function fetchFoodItems() {
  return localDb.getAllFoodItems();
}

export async function fetchExpenses() {
  return localDb.getAllExpenses();
}

export async function fetchBookingHistory() {
  return localDb.getBookingHistory();
}

export async function fetchActivityLogs() {
  return localDb.getActivityLogs();
}

export async function fetchNotifications() {
  return localDb.getNotifications();
}

export async function fetchUnreadNotifications() {
  return localDb.getUnreadNotifications();
}

export async function fetchHappyHoursConfigs() {
  return localDb.getAllHappyHoursConfigs();
}

export async function fetchHappyHoursPricing() {
  return localDb.getAllHappyHoursPricing();
}

export async function fetchGamingCenterInfo() {
  return localDb.getGamingCenterInfo();
}

export { isTauri };
