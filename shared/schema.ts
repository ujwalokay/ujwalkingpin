import { z } from "zod";
import { pgTable, varchar, integer, timestamp, text, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Drizzle table definitions
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: varchar("category").notNull(),
  seatNumber: integer("seat_number").notNull(),
  seatName: varchar("seat_name").notNull(),
  customerName: varchar("customer_name").notNull(),
  whatsappNumber: varchar("whatsapp_number"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  price: varchar("price").notNull(),
  status: varchar("status").notNull(),
  bookingType: varchar("booking_type").notNull(),
  pausedRemainingTime: integer("paused_remaining_time"),
  foodOrders: jsonb("food_orders").$type<Array<{
    foodId: string;
    foodName: string;
    price: string;
    quantity: number;
  }>>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true }).extend({
  startTime: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  endTime: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  pausedRemainingTime: z.number().nullable().optional(),
});
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export const foodItems = pgTable("food_items", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name").notNull(),
  price: varchar("price").notNull(),
});

export const insertFoodItemSchema = createInsertSchema(foodItems).omit({ id: true });
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type FoodItem = typeof foodItems.$inferSelect;

export const deviceConfigs = pgTable("device_configs", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: varchar("category").notNull().unique(),
  count: integer("count").notNull().default(0),
  seats: text("seats").array().notNull().default([]),
});

export const insertDeviceConfigSchema = createInsertSchema(deviceConfigs).omit({ id: true });
export type InsertDeviceConfig = z.infer<typeof insertDeviceConfigSchema>;
export type DeviceConfig = typeof deviceConfigs.$inferSelect;

export const pricingConfigs = pgTable("pricing_configs", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: varchar("category").notNull(),
  duration: varchar("duration").notNull(),
  price: varchar("price").notNull(),
});

export const insertPricingConfigSchema = createInsertSchema(pricingConfigs).omit({ id: true });
export type InsertPricingConfig = z.infer<typeof insertPricingConfigSchema>;
export type PricingConfig = typeof pricingConfigs.$inferSelect;

export const bookingHistory = pgTable("booking_history", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookingId: varchar("booking_id").notNull(),
  category: varchar("category").notNull(),
  seatNumber: integer("seat_number").notNull(),
  seatName: varchar("seat_name").notNull(),
  customerName: varchar("customer_name").notNull(),
  whatsappNumber: varchar("whatsapp_number"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  price: varchar("price").notNull(),
  status: varchar("status").notNull(),
  bookingType: varchar("booking_type").notNull(),
  pausedRemainingTime: integer("paused_remaining_time"),
  foodOrders: jsonb("food_orders").$type<Array<{
    foodId: string;
    foodName: string;
    price: string;
    quantity: number;
  }>>().default([]),
  createdAt: timestamp("created_at").notNull(),
  archivedAt: timestamp("archived_at").notNull().defaultNow(),
});

export const insertBookingHistorySchema = createInsertSchema(bookingHistory).omit({ id: true, archivedAt: true });
export type InsertBookingHistory = z.infer<typeof insertBookingHistorySchema>;
export type BookingHistory = typeof bookingHistory.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: varchar("username").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  role: varchar("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, passwordHash: true }).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: varchar("category").notNull(),
  description: text("description").notNull(),
  amount: varchar("amount").notNull(),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true }).extend({
  date: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a valid positive number"
  }),
});
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
