import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, and, inArray, gte, lte, sql } from "drizzle-orm";
import { 
  type User, 
  type InsertUser, 
  type Booking, 
  type InsertBooking, 
  type DeviceConfig,
  type InsertDeviceConfig,
  type PricingConfig,
  type InsertPricingConfig,
  users, 
  bookings,
  deviceConfig,
  pricingConfig
} from "@shared/schema";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});
const db = drizzle({ client: pool });

export interface BookingStats {
  totalRevenue: number;
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
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getActiveBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<boolean>;
  
  getBookingStats(startDate: Date, endDate: Date): Promise<BookingStats>;
  getBookingHistory(startDate: Date, endDate: Date): Promise<BookingHistoryItem[]>;
  
  getAllDeviceConfigs(): Promise<DeviceConfig[]>;
  getDeviceConfig(category: string): Promise<DeviceConfig | undefined>;
  upsertDeviceConfig(config: InsertDeviceConfig): Promise<DeviceConfig>;
  
  getAllPricingConfigs(): Promise<PricingConfig[]>;
  getPricingConfigsByCategory(category: string): Promise<PricingConfig[]>;
  upsertPricingConfigs(category: string, configs: InsertPricingConfig[]): Promise<PricingConfig[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }

  async getActiveBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).where(
      inArray(bookings.status, ["running", "upcoming"])
    );
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined> {
    const result = await db.update(bookings)
      .set(data)
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  async deleteBooking(id: string): Promise<boolean> {
    const result = await db.delete(bookings).where(eq(bookings.id, id)).returning();
    return result.length > 0;
  }

  async getBookingStats(startDate: Date, endDate: Date): Promise<BookingStats> {
    const completedBookings = await db.select().from(bookings).where(
      and(
        inArray(bookings.status, ["completed", "expired"]),
        gte(bookings.startTime, startDate),
        lte(bookings.startTime, endDate)
      )
    );

    const totalRevenue = completedBookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.price);
    }, 0);

    const totalSessions = completedBookings.length;

    const totalMinutes = completedBookings.reduce((sum, booking) => {
      const duration = booking.endTime.getTime() - booking.startTime.getTime();
      return sum + (duration / 1000 / 60);
    }, 0);

    const avgSessionMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    return {
      totalRevenue,
      totalSessions,
      avgSessionMinutes
    };
  }

  async getBookingHistory(startDate: Date, endDate: Date): Promise<BookingHistoryItem[]> {
    const completedBookings = await db.select().from(bookings).where(
      and(
        inArray(bookings.status, ["completed", "expired"]),
        gte(bookings.startTime, startDate),
        lte(bookings.startTime, endDate)
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

        return {
          id: booking.id,
          date: booking.startTime.toISOString().split('T')[0],
          seatName: booking.seatName,
          customerName: booking.customerName,
          duration,
          durationMinutes,
          price: booking.price
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getAllDeviceConfigs(): Promise<DeviceConfig[]> {
    return await db.select().from(deviceConfig);
  }

  async getDeviceConfig(category: string): Promise<DeviceConfig | undefined> {
    const result = await db.select().from(deviceConfig).where(eq(deviceConfig.category, category));
    return result[0];
  }

  async upsertDeviceConfig(config: InsertDeviceConfig): Promise<DeviceConfig> {
    const existing = await this.getDeviceConfig(config.category);
    
    if (existing) {
      const result = await db.update(deviceConfig)
        .set(config)
        .where(eq(deviceConfig.category, config.category))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(deviceConfig).values(config).returning();
      return result[0];
    }
  }

  async getAllPricingConfigs(): Promise<PricingConfig[]> {
    return await db.select().from(pricingConfig);
  }

  async getPricingConfigsByCategory(category: string): Promise<PricingConfig[]> {
    return await db.select().from(pricingConfig).where(eq(pricingConfig.category, category));
  }

  async upsertPricingConfigs(category: string, configs: InsertPricingConfig[]): Promise<PricingConfig[]> {
    await db.delete(pricingConfig).where(eq(pricingConfig.category, category));
    
    if (configs.length === 0) {
      return [];
    }
    
    const result = await db.insert(pricingConfig).values(configs).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
