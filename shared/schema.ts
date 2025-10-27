import { z } from "zod";
import { sql } from "drizzle-orm";
import { pgTable, varchar, integer, timestamp, text, jsonb, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Session storage table for Replit Auth
// IMPORTANT: This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);


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
  bookingType: text("booking_type").array().notNull(),
  pausedRemainingTime: integer("paused_remaining_time"),
  personCount: integer("person_count").notNull().default(1),
  paymentMethod: varchar("payment_method"),
  foodOrders: jsonb("food_orders").$type<Array<{
    foodId: string;
    foodName: string;
    price: string;
    quantity: number;
  }>>().default([]),
  originalPrice: varchar("original_price"),
  discountApplied: varchar("discount_applied"),
  bonusHoursApplied: varchar("bonus_hours_applied"),
  loyaltyPointsUsed: integer("loyalty_points_used"),
  promotionDetails: jsonb("promotion_details").$type<{
    discountPercentage?: number;
    discountAmount?: string;
    bonusHours?: string;
  }>(),
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
  costPrice: varchar("cost_price"),
  currentStock: integer("current_stock").notNull().default(0),
  minStockLevel: integer("min_stock_level").notNull().default(10),
  inInventory: integer("in_inventory").notNull().default(0),
  category: varchar("category").notNull().default("trackable"),
  supplier: varchar("supplier"),
  expiryDate: timestamp("expiry_date"),
});

export const insertFoodItemSchema = createInsertSchema(foodItems).omit({ id: true }).extend({
  expiryDate: z.union([z.string(), z.date(), z.null(), z.undefined()]).transform(val => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  }).optional(),
});
export type InsertFoodItem = z.infer<typeof insertFoodItemSchema>;
export type FoodItem = typeof foodItems.$inferSelect;

export const stockBatches = pgTable("stock_batches", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  foodItemId: varchar("food_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  costPrice: varchar("cost_price").notNull(),
  supplier: varchar("supplier"),
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
  expiryDate: timestamp("expiry_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStockBatchSchema = createInsertSchema(stockBatches).omit({ id: true, createdAt: true }).extend({
  purchaseDate: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val).optional(),
  expiryDate: z.union([z.string(), z.date(), z.null(), z.undefined()]).transform(val => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  }).optional(),
});
export type InsertStockBatch = z.infer<typeof insertStockBatchSchema>;
export type StockBatch = typeof stockBatches.$inferSelect;

export const stockAdjustmentSchema = z.object({
  foodId: z.string(),
  quantity: z.number().int(),
  type: z.enum(["add", "remove"]),
  costPrice: z.string().optional(),
  supplier: z.string().optional(),
  expiryDate: z.union([z.string(), z.date(), z.null(), z.undefined()]).transform(val => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  }).optional(),
  notes: z.string().optional(),
});

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
  personCount: integer("person_count").notNull().default(1),
});

export const insertPricingConfigSchema = createInsertSchema(pricingConfigs).omit({ id: true }).refine(
  (data) => {
    // Only PS5 category can have personCount > 1, all others must be 1
    if (data.category !== "PS5" && data.personCount && data.personCount > 1) {
      return false;
    }
    return true;
  },
  {
    message: "Only PS5 category can have person count greater than 1",
    path: ["personCount"],
  }
);
export type InsertPricingConfig = z.infer<typeof insertPricingConfigSchema>;
export type PricingConfig = typeof pricingConfigs.$inferSelect;

export const happyHoursConfigs = pgTable("happy_hours_configs", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: varchar("category").notNull(),
  startTime: varchar("start_time").notNull(), // e.g., "14:00"
  endTime: varchar("end_time").notNull(), // e.g., "18:00"
  enabled: integer("enabled").notNull().default(1), // 1 = enabled, 0 = disabled
});

export const insertHappyHoursConfigSchema = createInsertSchema(happyHoursConfigs).omit({ id: true });
export type InsertHappyHoursConfig = z.infer<typeof insertHappyHoursConfigSchema>;
export type HappyHoursConfig = typeof happyHoursConfigs.$inferSelect;

export const happyHoursPricing = pgTable("happy_hours_pricing", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: varchar("category").notNull(),
  duration: varchar("duration").notNull(),
  price: varchar("price").notNull(),
  personCount: integer("person_count").notNull().default(1),
});

export const insertHappyHoursPricingSchema = createInsertSchema(happyHoursPricing).omit({ id: true }).refine(
  (data) => {
    // Only PS5 category can have personCount > 1, all others must be 1
    if (data.category !== "PS5" && data.personCount && data.personCount > 1) {
      return false;
    }
    return true;
  },
  {
    message: "Only PS5 category can have person count greater than 1",
    path: ["personCount"],
  }
);
export type InsertHappyHoursPricing = z.infer<typeof insertHappyHoursPricingSchema>;
export type HappyHoursPricing = typeof happyHoursPricing.$inferSelect;

export const discountPromotions = pgTable("discount_promotions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: varchar("category").notNull(),
  duration: varchar("duration").notNull(),
  personCount: integer("person_count").notNull().default(1),
  discountPercentage: integer("discount_percentage").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  enabled: integer("enabled").notNull().default(1),
  usageCount: integer("usage_count").notNull().default(0),
  totalSavings: varchar("total_savings").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDiscountPromotionSchema = createInsertSchema(discountPromotions).omit({ id: true, createdAt: true, usageCount: true, totalSavings: true }).extend({
  startDate: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  endDate: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  discountPercentage: z.number().min(1).max(100),
}).refine(
  (data) => {
    if (data.category !== "PS5" && data.personCount && data.personCount > 1) {
      return false;
    }
    return true;
  },
  {
    message: "Only PS5 category can have person count greater than 1",
    path: ["personCount"],
  }
);
export type InsertDiscountPromotion = z.infer<typeof insertDiscountPromotionSchema>;
export type DiscountPromotion = typeof discountPromotions.$inferSelect;

export const bonusHoursPromotions = pgTable("bonus_hours_promotions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: varchar("category").notNull(),
  duration: varchar("duration").notNull(),
  personCount: integer("person_count").notNull().default(1),
  bonusHours: varchar("bonus_hours").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  enabled: integer("enabled").notNull().default(1),
  usageCount: integer("usage_count").notNull().default(0),
  totalHoursGiven: varchar("total_hours_given").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBonusHoursPromotionSchema = createInsertSchema(bonusHoursPromotions).omit({ id: true, createdAt: true, usageCount: true, totalHoursGiven: true }).extend({
  startDate: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  endDate: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
}).refine(
  (data) => {
    if (data.category !== "PS5" && data.personCount && data.personCount > 1) {
      return false;
    }
    return true;
  },
  {
    message: "Only PS5 category can have person count greater than 1",
    path: ["personCount"],
  }
);
export type InsertBonusHoursPromotion = z.infer<typeof insertBonusHoursPromotionSchema>;
export type BonusHoursPromotion = typeof bonusHoursPromotions.$inferSelect;

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
  bookingType: text("booking_type").array().notNull(),
  pausedRemainingTime: integer("paused_remaining_time"),
  personCount: integer("person_count").notNull().default(1),
  paymentMethod: varchar("payment_method"),
  foodOrders: jsonb("food_orders").$type<Array<{
    foodId: string;
    foodName: string;
    price: string;
    quantity: number;
  }>>().default([]),
  originalPrice: varchar("original_price"),
  discountApplied: varchar("discount_applied"),
  bonusHoursApplied: varchar("bonus_hours_applied"),
  loyaltyPointsUsed: integer("loyalty_points_used"),
  promotionDetails: jsonb("promotion_details").$type<{
    discountPercentage?: number;
    discountAmount?: string;
    bonusHours?: string;
  }>(),
  createdAt: timestamp("created_at").notNull(),
  archivedAt: timestamp("archived_at").notNull().defaultNow(),
});

export const insertBookingHistorySchema = createInsertSchema(bookingHistory).omit({ id: true, archivedAt: true });
export type InsertBookingHistory = z.infer<typeof insertBookingHistorySchema>;
export type BookingHistory = typeof bookingHistory.$inferSelect;

// User storage table - supports both Replit Auth and staff/admin authentication
export const users = pgTable("users", {
  // IMPORTANT: Keep default() for existing ID compatibility
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Replit Auth fields
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // Staff/Admin auth fields (nullable for Replit Auth users)
  username: varchar("username").unique(),
  passwordHash: varchar("password_hash"),
  role: varchar("role"),
  onboardingCompleted: integer("onboarding_completed").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schema for staff/admin users (with username/password)
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, passwordHash: true }).extend({
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

// UpsertUser type for Replit Auth (upserts user on login)
export type UpsertUser = typeof users.$inferInsert;

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

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  entityType: varchar("entity_type"),
  entityId: varchar("entity_id"),
  activityLogId: varchar("activity_log_id"),
  isRead: integer("is_read").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const gamingCenterInfo = pgTable("gaming_center_info", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  phone: varchar("phone").notNull(),
  email: varchar("email"),
  hours: text("hours").notNull(),
  timezone: varchar("timezone").notNull().default("Asia/Kolkata"),
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

export const retentionConfig = pgTable("retention_config", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookingHistoryDays: integer("booking_history_days").notNull().default(730),
  activityLogsDays: integer("activity_logs_days").notNull().default(180),
  loadMetricsDays: integer("load_metrics_days").notNull().default(90),
  loadPredictionsDays: integer("load_predictions_days").notNull().default(90),
  expensesDays: integer("expenses_days").notNull().default(2555),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRetentionConfigSchema = createInsertSchema(retentionConfig).omit({ id: true, updatedAt: true });
export type InsertRetentionConfig = z.infer<typeof insertRetentionConfigSchema>;
export type RetentionConfig = typeof retentionConfig.$inferSelect;

export const deviceMaintenance = pgTable("device_maintenance", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: varchar("category").notNull(),
  seatName: varchar("seat_name").notNull(),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  totalUsageHours: real("total_usage_hours").notNull().default(0),
  totalSessions: integer("total_sessions").notNull().default(0),
  issuesReported: integer("issues_reported").notNull().default(0),
  maintenanceNotes: text("maintenance_notes"),
  status: varchar("status").notNull().default("healthy"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDeviceMaintenanceSchema = createInsertSchema(deviceMaintenance).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDeviceMaintenance = z.infer<typeof insertDeviceMaintenanceSchema>;
export type DeviceMaintenance = typeof deviceMaintenance.$inferSelect;

export const customerLoyalty = pgTable("customer_loyalty", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerName: varchar("customer_name").notNull(),
  whatsappNumber: varchar("whatsapp_number").notNull().unique(),
  totalSpent: varchar("total_spent").notNull().default("0"),
  pointsEarned: integer("points_earned").notNull().default(0),
  pointsAvailable: integer("points_available").notNull().default(0),
  lastPurchaseDate: timestamp("last_purchase_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomerLoyaltySchema = createInsertSchema(customerLoyalty).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomerLoyalty = z.infer<typeof insertCustomerLoyaltySchema>;
export type CustomerLoyalty = typeof customerLoyalty.$inferSelect;

export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  cardType: varchar("card_type").notNull().default("bronze"),
  rewardType: varchar("reward_type").notNull().default("discount"),
  pointCost: integer("point_cost").notNull().default(0),
  category: varchar("category").notNull().default("general"),
  value: varchar("value").notNull(),
  minSpent: varchar("min_spent").notNull().default("0"),
  maxSpent: varchar("max_spent"),
  pointsPerValue: integer("points_per_value").notNull().default(1),
  cardPointsRequired: integer("card_points_required").notNull().default(0),
  enabled: integer("enabled").notNull().default(1),
  stock: integer("stock"),
  totalRedeemed: integer("total_redeemed").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({ id: true, createdAt: true, updatedAt: true, totalRedeemed: true });
export type InsertLoyaltyReward = z.infer<typeof insertLoyaltyRewardSchema>;
export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;

export const rewardRedemptions = pgTable("reward_redemptions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: varchar("customer_id").notNull(),
  customerName: varchar("customer_name").notNull(),
  whatsappNumber: varchar("whatsapp_number").notNull(),
  rewardId: varchar("reward_id").notNull(),
  rewardName: varchar("reward_name").notNull(),
  pointsUsed: integer("points_used").notNull(),
  redeemedAt: timestamp("redeemed_at").notNull().defaultNow(),
});

export const insertRewardRedemptionSchema = createInsertSchema(rewardRedemptions).omit({ id: true, redeemedAt: true });
export type InsertRewardRedemption = z.infer<typeof insertRewardRedemptionSchema>;
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;

