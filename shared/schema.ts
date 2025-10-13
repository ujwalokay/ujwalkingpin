import { z } from "zod";
import { pgTable, varchar, integer, timestamp, text, jsonb, real } from "drizzle-orm/pg-core";
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
  email: varchar("email"),
  role: varchar("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, passwordHash: true }).extend({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  email: z.string().email("Invalid email address").optional(),
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

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull(),
  username: varchar("username").notNull(),
  userRole: varchar("user_role").notNull(),
  action: varchar("action").notNull(), // 'create', 'update', 'delete', 'login'
  entityType: varchar("entity_type"), // 'booking', 'food', 'config', etc.
  entityId: varchar("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

export const gamingCenterInfo = pgTable("gaming_center_info", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  hours: text("hours").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGamingCenterInfoSchema = createInsertSchema(gamingCenterInfo).omit({ id: true, updatedAt: true });
export type InsertGamingCenterInfo = z.infer<typeof insertGamingCenterInfoSchema>;
export type GamingCenterInfo = typeof gamingCenterInfo.$inferSelect;

export const galleryImages = pgTable("gallery_images", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({ id: true, createdAt: true });
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type GalleryImage = typeof galleryImages.$inferSelect;

export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon").notNull(),
});

export const insertFacilitySchema = createInsertSchema(facilities).omit({ id: true });
export type InsertFacility = z.infer<typeof insertFacilitySchema>;
export type Facility = typeof facilities.$inferSelect;

export const games = pgTable("games", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  category: varchar("category").notNull(),
});

export const insertGameSchema = createInsertSchema(games).omit({ id: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export const loadMetrics = pgTable("load_metrics", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  activeSessions: integer("active_sessions").notNull().default(0),
  avgSessionLength: integer("avg_session_length").notNull().default(0),
  foodOrders: integer("food_orders").notNull().default(0),
  capacityUtilization: integer("capacity_utilization").notNull().default(0),
});

export const insertLoadMetricSchema = createInsertSchema(loadMetrics).omit({ id: true, timestamp: true });
export type InsertLoadMetric = z.infer<typeof insertLoadMetricSchema>;
export type LoadMetric = typeof loadMetrics.$inferSelect;

export const loadPredictions = pgTable("load_predictions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  horizon: varchar("horizon").notNull(),
  predictedLoad: integer("predicted_load").notNull(),
  modelVersion: varchar("model_version").notNull(),
  features: jsonb("features").$type<Record<string, any>>().default({}),
});

export const insertLoadPredictionSchema = createInsertSchema(loadPredictions).omit({ id: true, timestamp: true });
export type InsertLoadPrediction = z.infer<typeof insertLoadPredictionSchema>;
export type LoadPrediction = typeof loadPredictions.$inferSelect;

export const loyaltyMembers = pgTable("loyalty_members", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id"),
  customerName: varchar("customer_name").notNull(),
  whatsappNumber: varchar("whatsapp_number").notNull().unique(),
  tier: varchar("tier").notNull().default("bronze"),
  points: integer("points").notNull().default(0),
  totalSpent: varchar("total_spent").notNull().default("0"),
  visitCount: integer("visit_count").notNull().default(0),
  lastVisit: timestamp("last_visit"),
  redemptionHistory: jsonb("redemption_history").$type<Array<{
    date: string;
    points: number;
    reward: string;
  }>>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLoyaltyMemberSchema = createInsertSchema(loyaltyMembers).omit({ id: true, createdAt: true });
export type InsertLoyaltyMember = z.infer<typeof insertLoyaltyMemberSchema>;
export type LoyaltyMember = typeof loyaltyMembers.$inferSelect;

export const loyaltyEvents = pgTable("loyalty_events", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: varchar("member_id").notNull(),
  type: varchar("type").notNull(),
  deltaPoints: integer("delta_points").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLoyaltyEventSchema = createInsertSchema(loyaltyEvents).omit({ id: true, createdAt: true });
export type InsertLoyaltyEvent = z.infer<typeof insertLoyaltyEventSchema>;
export type LoyaltyEvent = typeof loyaltyEvents.$inferSelect;

export const loyaltyConfig = pgTable("loyalty_config", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pointsPerCurrency: real("points_per_currency").notNull().default(1),
  currencySymbol: varchar("currency_symbol").notNull().default("$"),
  tierThresholds: jsonb("tier_thresholds").$type<{
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  }>().default({ bronze: 0, silver: 100, gold: 500, platinum: 1000 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLoyaltyConfigSchema = createInsertSchema(loyaltyConfig).omit({ id: true, updatedAt: true }).extend({
  pointsPerCurrency: z.coerce.number().positive("Points per currency must be positive"),
  tierThresholds: z.object({
    bronze: z.coerce.number().nonnegative().default(0),
    silver: z.coerce.number().nonnegative().default(100),
    gold: z.coerce.number().nonnegative().default(500),
    platinum: z.coerce.number().nonnegative().default(1000),
  }).default({ bronze: 0, silver: 100, gold: 500, platinum: 1000 }),
});
export type InsertLoyaltyConfig = z.infer<typeof insertLoyaltyConfigSchema>;
export type LoyaltyConfig = typeof loyaltyConfig.$inferSelect;

export const gameUpdates = pgTable("game_updates", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  gameName: varchar("game_name").notNull(),
  updateType: varchar("update_type").notNull(),
  source: varchar("source"),
  sourceUrl: text("source_url"),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGameUpdateSchema = createInsertSchema(gameUpdates).omit({ id: true, createdAt: true }).extend({
  publishedAt: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
});
export type InsertGameUpdate = z.infer<typeof insertGameUpdateSchema>;
export type GameUpdate = typeof gameUpdates.$inferSelect;

