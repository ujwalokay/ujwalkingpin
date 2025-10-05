import { 
  type Booking, 
  type InsertBooking, 
  type DeviceConfig,
  type InsertDeviceConfig,
  type PricingConfig,
  type InsertPricingConfig,
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private bookings: Map<string, Booking> = new Map();
  private deviceConfigs: Map<string, DeviceConfig> = new Map();
  private pricingConfigs: Map<string, PricingConfig> = new Map();

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getActiveBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      booking => booking.status === "running" || booking.status === "upcoming"
    );
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = crypto.randomUUID();
    const newBooking: Booking = {
      ...booking,
      startTime: typeof booking.startTime === 'string' ? new Date(booking.startTime) : booking.startTime,
      endTime: typeof booking.endTime === 'string' ? new Date(booking.endTime) : booking.endTime,
      id,
      createdAt: new Date()
    };
    this.bookings.set(id, newBooking);
    return newBooking;
  }

  async updateBooking(id: string, data: Partial<InsertBooking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updated = { 
      ...booking, 
      ...data,
      startTime: data.startTime ? (typeof data.startTime === 'string' ? new Date(data.startTime) : data.startTime) : booking.startTime,
      endTime: data.endTime ? (typeof data.endTime === 'string' ? new Date(data.endTime) : data.endTime) : booking.endTime,
    };
    this.bookings.set(id, updated);
    return updated;
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookings.delete(id);
  }

  async getBookingStats(startDate: Date, endDate: Date): Promise<BookingStats> {
    const completedBookings = Array.from(this.bookings.values()).filter(
      booking => 
        (booking.status === "completed" || booking.status === "expired") &&
        booking.startTime >= startDate &&
        booking.startTime <= endDate
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
    const completedBookings = Array.from(this.bookings.values()).filter(
      booking => 
        (booking.status === "completed" || booking.status === "expired") &&
        booking.startTime >= startDate &&
        booking.startTime <= endDate
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
    return Array.from(this.deviceConfigs.values());
  }

  async getDeviceConfig(category: string): Promise<DeviceConfig | undefined> {
    return Array.from(this.deviceConfigs.values()).find(c => c.category === category);
  }

  async upsertDeviceConfig(config: InsertDeviceConfig): Promise<DeviceConfig> {
    const existing = await this.getDeviceConfig(config.category);
    
    if (existing) {
      const updated = { ...existing, ...config };
      this.deviceConfigs.set(existing.id, updated);
      return updated;
    } else {
      const id = crypto.randomUUID();
      const newConfig: DeviceConfig = { ...config, id };
      this.deviceConfigs.set(id, newConfig);
      return newConfig;
    }
  }

  async getAllPricingConfigs(): Promise<PricingConfig[]> {
    return Array.from(this.pricingConfigs.values());
  }

  async getPricingConfigsByCategory(category: string): Promise<PricingConfig[]> {
    return Array.from(this.pricingConfigs.values()).filter(c => c.category === category);
  }

  async upsertPricingConfigs(category: string, configs: InsertPricingConfig[]): Promise<PricingConfig[]> {
    const existing = Array.from(this.pricingConfigs.values()).filter(c => c.category === category);
    existing.forEach(c => this.pricingConfigs.delete(c.id));
    
    if (configs.length === 0) {
      return [];
    }
    
    const result = configs.map(config => {
      const id = crypto.randomUUID();
      const newConfig: PricingConfig = { ...config, id };
      this.pricingConfigs.set(id, newConfig);
      return newConfig;
    });
    
    return result;
  }
}

export const storage = new MemStorage();
