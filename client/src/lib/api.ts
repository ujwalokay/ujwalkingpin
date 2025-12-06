/* api.ts - Offline-only API layer using local SQLite database via Tauri */

import type { Booking, InsertBooking, DeviceConfig, PricingConfig } from "@shared/schema";
import { localDb, isTauri } from './tauri-db';

export function getApiMode(): 'tauri' {
  return 'tauri';
}

export async function fetchBookings(): Promise<Booking[]> {
  return localDb.getAllBookings();
}

export async function fetchActiveBookings(): Promise<Booking[]> {
  return localDb.getActiveBookings();
}

export async function fetchBookingById(id: string): Promise<Booking | null> {
  return localDb.getBookingById(id);
}

export async function createBooking(booking: InsertBooking): Promise<Booking> {
  return localDb.createBooking(booking);
}

export async function updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking> {
  return localDb.updateBooking(id, data);
}

export async function deleteBooking(id: string): Promise<void> {
  return localDb.deleteBooking(id);
}

export async function fetchDeviceConfigs(): Promise<DeviceConfig[]> {
  return localDb.getAllDeviceConfigs();
}

export async function fetchDeviceConfigById(id: string): Promise<DeviceConfig | null> {
  return localDb.getDeviceConfigById(id);
}

export async function createDeviceConfig(config: any): Promise<DeviceConfig> {
  return localDb.createDeviceConfig(config);
}

export async function updateDeviceConfig(id: string, updates: any): Promise<DeviceConfig | null> {
  return localDb.updateDeviceConfig(id, updates);
}

export async function deleteDeviceConfig(id: string): Promise<void> {
  return localDb.deleteDeviceConfig(id);
}

export async function upsertDeviceConfig(config: any): Promise<DeviceConfig> {
  return localDb.upsertDeviceConfig(config);
}

export async function fetchPricingConfigs(): Promise<PricingConfig[]> {
  return localDb.getAllPricingConfigs();
}

export async function fetchPricingConfigById(id: string): Promise<PricingConfig | null> {
  return localDb.getPricingConfigById(id);
}

export async function createPricingConfig(config: any): Promise<PricingConfig> {
  return localDb.createPricingConfig(config);
}

export async function updatePricingConfig(id: string, updates: any): Promise<PricingConfig | null> {
  return localDb.updatePricingConfig(id, updates);
}

export async function deletePricingConfig(id: string): Promise<void> {
  return localDb.deletePricingConfig(id);
}

export async function upsertPricingConfigs(configs: any[]): Promise<PricingConfig[]> {
  return localDb.upsertPricingConfigs(configs);
}

export async function deleteAllPricingConfigsByCategory(category: string): Promise<void> {
  return localDb.deleteAllPricingConfigsByCategory(category);
}

export async function getServerTime(): Promise<Date> {
  return new Date();
}

export async function fetchFoodItems() {
  return localDb.getAllFoodItems();
}

export async function fetchFoodItemById(id: string) {
  return localDb.getFoodItemById(id);
}

export async function createFoodItem(item: any) {
  return localDb.createFoodItem(item);
}

export async function updateFoodItem(id: string, updates: any) {
  return localDb.updateFoodItem(id, updates);
}

export async function deleteFoodItem(id: string) {
  return localDb.deleteFoodItem(id);
}

export async function adjustStock(foodId: string, quantity: number, type: 'add' | 'remove') {
  return localDb.adjustStock(foodId, quantity, type);
}

export async function fetchExpenses() {
  return localDb.getAllExpenses();
}

export async function fetchExpenseById(id: string) {
  return localDb.getExpenseById(id);
}

export async function createExpense(expense: any) {
  return localDb.createExpense(expense);
}

export async function updateExpense(id: string, updates: any) {
  return localDb.updateExpense(id, updates);
}

export async function deleteExpense(id: string) {
  return localDb.deleteExpense(id);
}

export async function fetchBookingHistory() {
  return localDb.getBookingHistory();
}

export async function archiveBooking(booking: any) {
  return localDb.archiveBooking(booking);
}

export async function fetchActivityLogs() {
  return localDb.getActivityLogs();
}

export async function createActivityLog(log: any) {
  return localDb.createActivityLog(log);
}

export async function fetchNotifications() {
  return localDb.getNotifications();
}

export async function fetchUnreadNotifications() {
  return localDb.getUnreadNotifications();
}

export async function createNotification(notification: any) {
  return localDb.createNotification(notification);
}

export async function markNotificationAsRead(id: string) {
  return localDb.markNotificationAsRead(id);
}

export async function markAllNotificationsAsRead() {
  return localDb.markAllNotificationsAsRead();
}

export async function deleteNotification(id: string) {
  return localDb.deleteNotification(id);
}

export async function getUnreadNotificationCount() {
  return localDb.getUnreadNotificationCount();
}

export async function clearAllNotifications() {
  return localDb.clearAllNotifications();
}

export async function fetchHappyHoursConfigs() {
  return localDb.getAllHappyHoursConfigs();
}

export async function createHappyHoursConfig(config: any) {
  return localDb.createHappyHoursConfig(config);
}

export async function updateHappyHoursConfig(id: string, updates: any) {
  return localDb.updateHappyHoursConfig(id, updates);
}

export async function deleteHappyHoursConfig(id: string) {
  return localDb.deleteHappyHoursConfig(id);
}

export async function upsertHappyHoursConfigs(configs: any[]) {
  return localDb.upsertHappyHoursConfigs(configs);
}

export async function fetchHappyHoursPricing() {
  return localDb.getAllHappyHoursPricing();
}

export async function createHappyHoursPricing(pricing: any) {
  return localDb.createHappyHoursPricing(pricing);
}

export async function updateHappyHoursPricing(id: string, updates: any) {
  return localDb.updateHappyHoursPricing(id, updates);
}

export async function deleteHappyHoursPricing(id: string) {
  return localDb.deleteHappyHoursPricing(id);
}

export async function upsertHappyHoursPricing(pricings: any[]) {
  return localDb.upsertHappyHoursPricing(pricings);
}

export async function deleteAllHappyHoursPricingByCategory(category: string) {
  return localDb.deleteAllHappyHoursPricingByCategory(category);
}

export async function isHappyHoursActive(category?: string) {
  return localDb.isHappyHoursActive(category);
}

export async function isHappyHoursActiveForTime(time: Date, category?: string) {
  return localDb.isHappyHoursActiveForTime(time, category);
}

export async function fetchGamingCenterInfo() {
  return localDb.getGamingCenterInfo();
}

export async function updateGamingCenterInfo(info: any) {
  return localDb.updateGamingCenterInfo(info);
}

export async function fetchUsers() {
  return localDb.getAllUsers();
}

export async function fetchUserById(id: string) {
  return localDb.getUserById(id);
}

export async function fetchUserByUsername(username: string) {
  return localDb.getUserByUsername(username);
}

export async function validatePassword(username: string, password: string) {
  return localDb.validatePassword(username, password);
}

export async function createUser(userData: { username: string; password: string; role: string }) {
  return localDb.createUser(userData);
}

export async function updateUser(id: string, updates: any) {
  return localDb.updateUser(id, updates);
}

export async function deleteUser(id: string) {
  return localDb.deleteUser(id);
}

export async function fetchSessionGroups() {
  return localDb.getAllSessionGroups();
}

export async function createSessionGroup(group: any) {
  return localDb.createSessionGroup(group);
}

export async function deleteSessionGroup(id: string) {
  return localDb.deleteSessionGroup(id);
}

export async function fetchStaffVisibilitySettings() {
  return localDb.getStaffVisibilitySettings();
}

export async function updateStaffVisibilitySettings(settings: any) {
  return localDb.updateStaffVisibilitySettings(settings);
}

export async function fetchAppSettings() {
  return localDb.getAppSettings();
}

export async function updateAppSettings(settings: any) {
  return localDb.updateAppSettings(settings);
}

export async function fetchGalleryImages() {
  return localDb.getAllGalleryImages();
}

export async function createGalleryImage(image: any) {
  return localDb.createGalleryImage(image);
}

export async function deleteGalleryImage(id: string) {
  return localDb.deleteGalleryImage(id);
}

export async function fetchFacilities() {
  return localDb.getAllFacilities();
}

export async function createFacility(facility: any) {
  return localDb.createFacility(facility);
}

export async function updateFacility(id: string, updates: any) {
  return localDb.updateFacility(id, updates);
}

export async function deleteFacility(id: string) {
  return localDb.deleteFacility(id);
}

export async function fetchGames() {
  return localDb.getAllGames();
}

export async function createGame(game: any) {
  return localDb.createGame(game);
}

export async function updateGame(id: string, updates: any) {
  return localDb.updateGame(id, updates);
}

export async function deleteGame(id: string) {
  return localDb.deleteGame(id);
}

export async function fetchDeviceMaintenance() {
  return localDb.getAllDeviceMaintenance();
}

export async function fetchDeviceMaintenanceById(id: string) {
  return localDb.getDeviceMaintenanceById(id);
}

export async function fetchDeviceMaintenanceBySeat(category: string, seatName: string) {
  return localDb.getDeviceMaintenanceBySeat(category, seatName);
}

export async function upsertDeviceMaintenance(maintenance: any) {
  return localDb.upsertDeviceMaintenance(maintenance);
}

export async function updateDeviceMaintenanceStatus(id: string, status: string, notes?: string) {
  return localDb.updateDeviceMaintenanceStatus(id, status, notes);
}

export async function recordMaintenanceCompleted(id: string, notes?: string) {
  return localDb.recordMaintenanceCompleted(id, notes);
}

export async function fetchStockBatches() {
  return localDb.getAllStockBatches();
}

export async function fetchStockBatchesByFoodItem(foodItemId: string) {
  return localDb.getStockBatchesByFoodItem(foodItemId);
}

export async function createStockBatch(batch: any) {
  return localDb.createStockBatch(batch);
}

export async function fetchLowStockItems() {
  return localDb.getLowStockItems();
}

export async function fetchInventoryItems() {
  return localDb.getInventoryItems();
}

export async function fetchReorderList() {
  return localDb.getReorderList();
}

export async function fetchExpiringItems(daysAhead: number = 7) {
  return localDb.getExpiringItems(daysAhead);
}

export async function addToInventory(foodItemId: string) {
  return localDb.addToInventory(foodItemId);
}

export async function removeFromInventory(foodItemId: string) {
  return localDb.removeFromInventory(foodItemId);
}

export async function fetchBookingStats(startDate?: string, endDate?: string) {
  return localDb.getBookingStats(startDate, endDate);
}

export async function fetchRetentionMetrics() {
  return localDb.getRetentionMetrics();
}

export async function fetchFilteredBookingHistory(filters: { startDate?: string; endDate?: string; category?: string; status?: string }) {
  return localDb.getFilteredBookingHistory(filters);
}

export async function fetchDailyRevenue(date: string) {
  return localDb.getDailyRevenue(date);
}

export async function fetchMonthlyRevenue(year: number, month: number) {
  return localDb.getMonthlyRevenue(year, month);
}

export { isTauri };
