import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  seatNumber: integer("seat_number").notNull(),
  seatName: text("seat_name").notNull(),
  customerName: text("customer_name").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  bookingType: text("booking_type").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
}).extend({
  startTime: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
  endTime: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export const settings = pgTable("settings", {
  id: text("id").primaryKey().default("global"),
  adminDeletePinHash: text("admin_delete_pin_hash"),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockUntil: timestamp("lock_until"),
});

export const insertSettingsSchema = createInsertSchema(settings);
export const updateSettingsSchema = createInsertSchema(settings).partial();

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
