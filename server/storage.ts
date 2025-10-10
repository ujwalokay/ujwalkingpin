import { 
  type Booking, 
  type InsertBooking, 
  type DeviceConfig,
  type InsertDeviceConfig,
  type PricingConfig,
  type InsertPricingConfig,
  type FoodItem,
  type InsertFoodItem,
  type BookingHistory,
  type InsertBookingHistory,
  type User,
  type InsertUser,
  type Expense,
  type InsertExpense,
  bookings,
  deviceConfigs,
  pricingConfigs,
  foodItems,
  bookingHistory,
  users,
  expenses,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface BookingStats {
  totalRevenue: number;
  totalFoodRevenue: number;
  totalSessions: number;
  avgSessionMinutes: number;
}

export interface BookingHistoryItem {
  id: string;
  date: string;
  seatName: string;
  customerName: string;
  duration: string;
  durationMinutes: number;
  price: string;
  foodAmount: number;
  totalAmount: number;
}

export interface IStorage {
  getAllBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getActiveBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<boolean>;
  
  getBookingStats(startDate: Date, endDate: Date): Promise<BookingStats>;
  getBookingHistory(startDate: Date, endDate: Date): Promise<BookingHistoryItem[]>;
  
  moveBookingsToHistory(): Promise<number>;
  getAllBookingHistory(): Promise<BookingHistory[]>;
  
  getAllDeviceConfigs(): Promise<DeviceConfig[]>;
  getDeviceConfig(category: string): Promise<DeviceConfig | undefined>;
  upsertDeviceConfig(config: InsertDeviceConfig): Promise<DeviceConfig>;
  deleteDeviceConfig(category: string): Promise<boolean>;
  
  getAllPricingConfigs(): Promise<PricingConfig[]>;
  getPricingConfigsByCategory(category: string): Promise<PricingConfig[]>;
  upsertPricingConfigs(category: string, configs: InsertPricingConfig[]): Promise<PricingConfig[]>;
  deletePricingConfig(category: string): Promise<boolean>;
  
  getAllFoodItems(): Promise<FoodItem[]>;
  getFoodItem(id: string): Promise<FoodItem | undefined>;
  createFoodItem(item: InsertFoodItem): Promise<FoodItem>;
  updateFoodItem(id: string, item: InsertFoodItem): Promise<FoodItem | undefined>;
  deleteFoodItem(id: string): Promise<boolean>;
  
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validatePassword(username: string, password: string): Promise<User | null>;
  
  getAllExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: InsertExpense): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>;
  
  initializeDefaults(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async initializeDefaults(): Promise<void> {
    // Check if defaults already exist
    const existingDevices = await db.select().from(deviceConfigs);
    const existingUsers = await db.select().from(users);
    
    // Initialize default device configs if not exist
    if (existingDevices.length === 0) {
      await db.insert(deviceConfigs).values([
        {
          category: "PC",
          count: 5,
          seats: ["PC-1", "PC-2", "PC-3", "PC-4", "PC-5"]
        },
        {
          category: "PS5",
          count: 3,
          seats: ["PS5-1", "PS5-2", "PS5-3"]
        }
      ]);

      // Initialize default pricing configs
      await db.insert(pricingConfigs).values([
        { category: "PC", duration: "30 mins", price: "10" },
        { category: "PC", duration: "1 hour", price: "18" },
        { category: "PC", duration: "2 hours", price: "30" },
        { category: "PS5", duration: "30 mins", price: "15" },
        { category: "PS5", duration: "1 hour", price: "25" },
        { category: "PS5", duration: "2 hours", price: "45" }
      ]);

      // Initialize default food items
      await db.insert(foodItems).values([
        { name: "Pizza", price: "8" },
        { name: "Burger", price: "6" },
        { name: "Fries", price: "3" },
        { name: "Soda", price: "2" },
        { name: "Water", price: "1" },
        { name: "Sandwich", price: "5" },
        { name: "Hot Dog", price: "4" },
        { name: "Coffee", price: "3" },
        { name: "Energy Drink", price: "4" },
        { name: "Nachos", price: "5" },
      ]);
    }

    // Initialize default users if no users exist
    if (existingUsers.length === 0) {
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;
      const staffUsername = process.env.STAFF_USERNAME;
      const staffPassword = process.env.STAFF_PASSWORD;
      
      if (!adminUsername || !adminPassword) {
        console.error('❌ ERROR: No admin user exists and ADMIN_USERNAME/ADMIN_PASSWORD environment variables are not set!');
        console.error('❌ Please set ADMIN_USERNAME and ADMIN_PASSWORD to create an admin user.');
        console.error('❌ The application will continue without users.');
        return;
      }
      
      if (adminPassword.length < 8) {
        throw new Error('ADMIN_PASSWORD must be at least 8 characters long. Please set a stronger password and restart.');
      }
      
      // Create admin user
      await this.createUser({
        username: adminUsername,
        password: adminPassword,
        role: "admin"
      });
      console.log(`✅ Admin user created with username: ${adminUsername}`);
      
      // Create staff user if credentials provided
      if (staffUsername && staffPassword) {
        if (staffPassword.length < 8) {
          console.error('❌ WARNING: STAFF_PASSWORD must be at least 8 characters long. Staff user not created.');
        } else {
          await this.createUser({
            username: staffUsername,
            password: staffPassword,
            role: "staff"
          });
          console.log(`✅ Staff user created with username: ${staffUsername}`);
        }
      } else {
        console.log('ℹ️  No staff user created. Set STAFF_USERNAME and STAFF_PASSWORD to create a staff user.');
      }
    }

    console.log('Database initialized with default data');
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getActiveBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking as any).returning();
    return newBooking;
  }

  async updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined> {
    const updateData: any = { ...data };
    if (data.foodOrders !== undefined) {
      updateData.foodOrders = data.foodOrders;
    }
    // Convert date strings to Date objects
    if (data.startTime && typeof data.startTime === 'string') {
      updateData.startTime = new Date(data.startTime);
    }
    if (data.endTime && typeof data.endTime === 'string') {
      updateData.endTime = new Date(data.endTime);
    }
    const [updated] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const result = await db.delete(bookings).where(eq(bookings.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getBookingStats(startDate: Date, endDate: Date): Promise<BookingStats> {
    const completedBookings = await db
      .select()
      .from(bookingHistory)
      .where(
        and(
          gte(bookingHistory.startTime, startDate),
          lte(bookingHistory.startTime, endDate)
        )
      );

    const totalRevenue = completedBookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.price);
    }, 0);

    const totalFoodRevenue = completedBookings.reduce((sum, booking) => {
      if (booking.foodOrders && booking.foodOrders.length > 0) {
        return sum + booking.foodOrders.reduce((foodSum, order) => 
          foodSum + parseFloat(order.price) * order.quantity, 0
        );
      }
      return sum;
    }, 0);

    const totalSessions = completedBookings.length;

    const totalMinutes = completedBookings.reduce((sum, booking) => {
      const duration = booking.endTime.getTime() - booking.startTime.getTime();
      return sum + (duration / 1000 / 60);
    }, 0);

    const avgSessionMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    return {
      totalRevenue,
      totalFoodRevenue,
      totalSessions,
      avgSessionMinutes
    };
  }

  async getBookingHistory(startDate: Date, endDate: Date): Promise<BookingHistoryItem[]> {
    const completedBookings = await db
      .select()
      .from(bookingHistory)
      .where(
        and(
          gte(bookingHistory.startTime, startDate),
          lte(bookingHistory.startTime, endDate)
        )
      );

    return completedBookings
      .map(booking => {
        const durationMs = booking.endTime.getTime() - booking.startTime.getTime();
        const durationMinutes = Math.round(durationMs / 1000 / 60);
        const hours = Math.floor(durationMinutes / 60);
        const mins = durationMinutes % 60;
        
        let duration: string;
        if (hours > 0 && mins > 0) {
          duration = `${hours} hour${hours > 1 ? 's' : ''} ${mins} mins`;
        } else if (hours > 0) {
          duration = `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
          duration = `${mins} mins`;
        }

        const foodAmount = booking.foodOrders && booking.foodOrders.length > 0
          ? booking.foodOrders.reduce((sum, order) => sum + parseFloat(order.price) * order.quantity, 0)
          : 0;

        const sessionPrice = parseFloat(booking.price);
        const totalAmount = sessionPrice + foodAmount;

        const dateObj = new Date(booking.startTime);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });

        return {
          id: booking.id,
          date: formattedDate,
          seatName: booking.seatName,
          customerName: booking.customerName,
          duration,
          durationMinutes,
          price: booking.price,
          foodAmount,
          totalAmount
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getAllDeviceConfigs(): Promise<DeviceConfig[]> {
    return await db.select().from(deviceConfigs);
  }

  async getDeviceConfig(category: string): Promise<DeviceConfig | undefined> {
    const [config] = await db
      .select()
      .from(deviceConfigs)
      .where(eq(deviceConfigs.category, category));
    return config || undefined;
  }

  async upsertDeviceConfig(config: InsertDeviceConfig): Promise<DeviceConfig> {
    const existing = await this.getDeviceConfig(config.category);
    
    if (existing) {
      const [updated] = await db
        .update(deviceConfigs)
        .set(config)
        .where(eq(deviceConfigs.category, config.category))
        .returning();
      return updated;
    } else {
      const [newConfig] = await db.insert(deviceConfigs).values(config).returning();
      return newConfig;
    }
  }

  async deleteDeviceConfig(category: string): Promise<boolean> {
    const result = await db.delete(deviceConfigs).where(eq(deviceConfigs.category, category));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAllPricingConfigs(): Promise<PricingConfig[]> {
    return await db.select().from(pricingConfigs);
  }

  async getPricingConfigsByCategory(category: string): Promise<PricingConfig[]> {
    return await db
      .select()
      .from(pricingConfigs)
      .where(eq(pricingConfigs.category, category));
  }

  async upsertPricingConfigs(category: string, configs: InsertPricingConfig[]): Promise<PricingConfig[]> {
    // Delete existing configs for this category
    await db.delete(pricingConfigs).where(eq(pricingConfigs.category, category));
    
    if (configs.length === 0) {
      return [];
    }
    
    // Insert new configs
    const result = await db.insert(pricingConfigs).values(configs).returning();
    return result;
  }

  async deletePricingConfig(category: string): Promise<boolean> {
    const result = await db.delete(pricingConfigs).where(eq(pricingConfigs.category, category));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAllFoodItems(): Promise<FoodItem[]> {
    return await db.select().from(foodItems);
  }

  async getFoodItem(id: string): Promise<FoodItem | undefined> {
    const [item] = await db.select().from(foodItems).where(eq(foodItems.id, id));
    return item || undefined;
  }

  async createFoodItem(item: InsertFoodItem): Promise<FoodItem> {
    const [newItem] = await db.insert(foodItems).values(item).returning();
    return newItem;
  }

  async updateFoodItem(id: string, item: InsertFoodItem): Promise<FoodItem | undefined> {
    const [updated] = await db
      .update(foodItems)
      .set(item)
      .where(eq(foodItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteFoodItem(id: string): Promise<boolean> {
    const result = await db.delete(foodItems).where(eq(foodItems.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async moveBookingsToHistory(): Promise<number> {
    const expiredAndCompleted = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "expired")
        )
      );

    const completed = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "completed")
        )
      );

    const bookingsToArchive = [...expiredAndCompleted, ...completed];

    if (bookingsToArchive.length === 0) {
      return 0;
    }

    const historyRecords = bookingsToArchive.map(booking => ({
      bookingId: booking.id,
      category: booking.category,
      seatNumber: booking.seatNumber,
      seatName: booking.seatName,
      customerName: booking.customerName,
      whatsappNumber: booking.whatsappNumber,
      startTime: booking.startTime,
      endTime: booking.endTime,
      price: booking.price,
      status: booking.status,
      bookingType: booking.bookingType,
      pausedRemainingTime: booking.pausedRemainingTime,
      foodOrders: booking.foodOrders,
      createdAt: booking.createdAt,
    }));

    await db.insert(bookingHistory).values(historyRecords as any);

    const bookingIds = bookingsToArchive.map(b => b.id);
    for (const id of bookingIds) {
      await db.delete(bookings).where(eq(bookings.id, id));
    }

    return bookingsToArchive.length;
  }

  async getAllBookingHistory(): Promise<BookingHistory[]> {
    return await db.select().from(bookingHistory);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(user.password, saltRounds);
    
    const [newUser] = await db.insert(users).values({
      username: user.username,
      passwordHash,
      role: user.role || "admin",
    }).returning();
    
    return newUser;
  }

  async validatePassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      return null;
    }
    
    return user;
  }

  async getAllExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses);
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense as any).returning();
    return newExpense;
  }

  async updateExpense(id: string, expense: InsertExpense): Promise<Expense | undefined> {
    const updateData: any = { ...expense };
    if (expense.date && typeof expense.date === 'string') {
      updateData.date = new Date(expense.date);
    }
    const [updated] = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(
        and(
          gte(expenses.date, startDate),
          lte(expenses.date, endDate)
        )
      );
  }
}

export const storage = new DatabaseStorage();
