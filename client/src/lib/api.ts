import type { Booking, InsertBooking, DeviceConfig, PricingConfig } from "@shared/schema";

export async function fetchBookings(): Promise<Booking[]> {
  const response = await fetch("/api/bookings");
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch bookings" }));
    throw new Error(errorData.message || "Failed to fetch bookings");
  }
  return response.json();
}

export async function createBooking(booking: InsertBooking): Promise<Booking> {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to create booking" }));
    throw new Error(errorData.message || "Failed to create booking");
  }
  return response.json();
}

export async function updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking> {
  const response = await fetch(`/api/bookings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to update booking" }));
    throw new Error(errorData.message || "Failed to update booking");
  }
  return response.json();
}

export async function deleteBooking(id: string): Promise<void> {
  const response = await fetch(`/api/bookings/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to delete booking" }));
    throw new Error(errorData.message || "Failed to delete booking");
  }
}

export async function fetchDeviceConfigs(): Promise<DeviceConfig[]> {
  const response = await fetch("/api/device-config");
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch device configs" }));
    throw new Error(errorData.message || "Failed to fetch device configs");
  }
  return response.json();
}

export async function fetchPricingConfigs(): Promise<PricingConfig[]> {
  const response = await fetch("/api/pricing-config");
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch pricing configs" }));
    throw new Error(errorData.message || "Failed to fetch pricing configs");
  }
  return response.json();
}

export async function getServerTime(): Promise<Date> {
  const response = await fetch("/api/server-time");
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch server time" }));
    throw new Error(errorData.message || "Failed to fetch server time");
  }
  const data = await response.json();
  return new Date(data.serverTime);
}
