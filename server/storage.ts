import { 
  type Booking, 
  type InsertBooking, 
  type DeviceConfig,
  type InsertDeviceConfig,
  type PricingConfig,
  type InsertPricingConfig,
  type FoodItem,
  type InsertFoodItem,
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private bookings: Map<string, Booking> = new Map();
  private deviceConfigs: Map<string, DeviceConfig> = new Map();
  private pricingConfigs: Map<string, PricingConfig> = new Map();
  private foodItems: Map<string, FoodItem> = new Map();

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults() {
    const pcId = crypto.randomUUID();
    const ps5Id = crypto.randomUUID();

    const pcDeviceConfig: DeviceConfig = {
      id: pcId,
      category: "PC",
      count: 5,
      seats: ["PC-1", "PC-2", "PC-3", "PC-4", "PC-5"]
    };

    const ps5DeviceConfig: DeviceConfig = {
      id: ps5Id,
      category: "PS5",
      count: 3,
      seats: ["PS5-1", "PS5-2", "PS5-3"]
    };

    this.deviceConfigs.set(pcId, pcDeviceConfig);
    this.deviceConfigs.set(ps5Id, ps5DeviceConfig);

    const pcPricing30Id = crypto.randomUUID();
    const pcPricing1hId = crypto.randomUUID();
    const pcPricing2hId = crypto.randomUUID();
    const ps5Pricing30Id = crypto.randomUUID();
    const ps5Pricing1hId = crypto.randomUUID();
    const ps5Pricing2hId = crypto.randomUUID();

    const pcPricingConfigs: PricingConfig[] = [
      { id: pcPricing30Id, category: "PC", duration: "30 mins", price: "10" },
      { id: pcPricing1hId, category: "PC", duration: "1 hour", price: "18" },
      { id: pcPricing2hId, category: "PC", duration: "2 hours", price: "30" }
    ];

    const ps5PricingConfigs: PricingConfig[] = [
      { id: ps5Pricing30Id, category: "PS5", duration: "30 mins", price: "15" },
      { id: ps5Pricing1hId, category: "PS5", duration: "1 hour", price: "25" },
      { id: ps5Pricing2hId, category: "PS5", duration: "2 hours", price: "45" }
    ];

    pcPricingConfigs.forEach(config => this.pricingConfigs.set(config.id, config));
    ps5PricingConfigs.forEach(config => this.pricingConfigs.set(config.id, config));

    const sampleFoodItems: FoodItem[] = [
      { id: crypto.randomUUID(), name: "Pizza", price: "8" },
      { id: crypto.randomUUID(), name: "Burger", price: "6" },
      { id: crypto.randomUUID(), name: "Fries", price: "3" },
      { id: crypto.randomUUID(), name: "Soda", price: "2" },
      { id: crypto.randomUUID(), name: "Water", price: "1" },
      { id: crypto.randomUUID(), name: "Sandwich", price: "5" },
      { id: crypto.randomUUID(), name: "Hot Dog", price: "4" },
      { id: crypto.randomUUID(), name: "Coffee", price: "3" },
      { id: crypto.randomUUID(), name: "Energy Drink", price: "4" },
      { id: crypto.randomUUID(), name: "Nachos", price: "5" },
    ];

    sampleFoodItems.forEach(item => this.foodItems.set(item.id, item));
  }

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
      foodOrders: booking.foodOrders || [],
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

        const foodAmount = booking.foodOrders && booking.foodOrders.length > 0
          ? booking.foodOrders.reduce((sum, order) => sum + parseFloat(order.price) * order.quantity, 0)
          : 0;

        const sessionPrice = parseFloat(booking.price);
        const totalAmount = sessionPrice + foodAmount;

        return {
          id: booking.id,
          date: booking.startTime.toISOString().split('T')[0],
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

  async deleteDeviceConfig(category: string): Promise<boolean> {
    const existing = await this.getDeviceConfig(category);
    if (existing) {
      this.deviceConfigs.delete(existing.id);
      return true;
    }
    return false;
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

  async deletePricingConfig(category: string): Promise<boolean> {
    const existing = Array.from(this.pricingConfigs.values()).filter(c => c.category === category);
    if (existing.length > 0) {
      existing.forEach(c => this.pricingConfigs.delete(c.id));
      return true;
    }
    return false;
  }

  async getAllFoodItems(): Promise<FoodItem[]> {
    return Array.from(this.foodItems.values());
  }

  async getFoodItem(id: string): Promise<FoodItem | undefined> {
    return this.foodItems.get(id);
  }

  async createFoodItem(item: InsertFoodItem): Promise<FoodItem> {
    const id = crypto.randomUUID();
    const newItem: FoodItem = { ...item, id };
    this.foodItems.set(id, newItem);
    return newItem;
  }

  async updateFoodItem(id: string, item: InsertFoodItem): Promise<FoodItem | undefined> {
    const existing = this.foodItems.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...item };
    this.foodItems.set(id, updated);
    return updated;
  }

  async deleteFoodItem(id: string): Promise<boolean> {
    return this.foodItems.delete(id);
  }
}

export const storage = new MemStorage();
