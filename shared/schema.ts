import { z } from "zod";

export const insertBookingSchema = z.object({
  category: z.string(),
  seatNumber: z.number(),
  seatName: z.string(),
  customerName: z.string(),
  whatsappNumber: z.string().optional(),
  startTime: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  endTime: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  price: z.string(),
  status: z.string(),
  bookingType: z.string(),
  foodOrders: z.array(z.object({
    foodId: z.string(),
    foodName: z.string(),
    price: z.string(),
    quantity: z.number(),
  })).optional().default([]),
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;

export interface Booking extends InsertBooking {
  id: string;
  createdAt: Date;
}

export const insertFoodItemSchema = z.object({
  name: z.string(),
  price: z.string(),
});

export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;

export interface FoodItem extends InsertFoodItem {
  id: string;
}

export const insertDeviceConfigSchema = z.object({
  category: z.string(),
  count: z.number().default(0),
  seats: z.array(z.string()).default([]),
});

export type InsertDeviceConfig = z.infer<typeof insertDeviceConfigSchema>;

export interface DeviceConfig extends InsertDeviceConfig {
  id: string;
}

export const insertPricingConfigSchema = z.object({
  category: z.string(),
  duration: z.string(),
  price: z.string(),
});

export type InsertPricingConfig = z.infer<typeof insertPricingConfigSchema>;

export interface PricingConfig extends InsertPricingConfig {
  id: string;
}
