import type { Booking, InsertBooking, DeviceConfig, PricingConfig } from "@shared/schema";

export async function fetchBookings(): Promise<Booking[]> {
  const response = await fetch("/api/bookings");
  if (!response.ok) {
    throw new Error("Failed to fetch bookings");
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
    throw new Error("Failed to create booking");
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
    throw new Error("Failed to update booking");
  }
  return response.json();
}

export async function deleteBooking(id: string): Promise<void> {
  const response = await fetch(`/api/bookings/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete booking");
  }
}

export async function fetchDeviceConfigs(): Promise<DeviceConfig[]> {
  const response = await fetch("/api/device-config");
  if (!response.ok) {
    throw new Error("Failed to fetch device configs");
  }
  return response.json();
}

export async function fetchPricingConfigs(): Promise<PricingConfig[]> {
  const response = await fetch("/api/pricing-config");
  if (!response.ok) {
    throw new Error("Failed to fetch pricing configs");
  }
  return response.json();
}
