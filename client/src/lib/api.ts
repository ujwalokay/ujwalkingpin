import type { Booking, InsertBooking, DeviceConfig, PricingConfig } from "@shared/schema";

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

export async function fetchBookings(): Promise<Booking[]> {
  const response = await fetch("/api/bookings", {
    credentials: "include"
  });
  if (!response.ok) {
    const message = await parseErrorResponse(response, "Failed to fetch bookings");
    throw new Error(message);
  }
  return response.json();
}

export async function createBooking(booking: InsertBooking): Promise<Booking> {
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
