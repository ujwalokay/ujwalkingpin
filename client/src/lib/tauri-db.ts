import Database from '@tauri-apps/plugin-sql';

let db: Awaited<ReturnType<typeof Database.load>> | null = null;

export async function initDatabase() {
  if (db) return db;
  db = await Database.load('sqlite:airavoto_pos.db');
  return db;
}

export async function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateCode(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
  return `${prefix}-${timestamp.slice(-5)}${randomPart.slice(0, 4)}`;
}

export const localDb = {
  async getAllBookings() {
    const database = await getDatabase();
    const result = await database.select<any[]>('SELECT * FROM bookings ORDER BY created_at DESC');
    return result.map(row => ({
      ...row,
      bookingType: JSON.parse(row.booking_type || '[]'),
      foodOrders: JSON.parse(row.food_orders || '[]'),
      lastPaymentAction: row.last_payment_action ? JSON.parse(row.last_payment_action) : null,
      promotionDetails: row.promotion_details ? JSON.parse(row.promotion_details) : null,
    }));
  },

  async getActiveBookings() {
    const database = await getDatabase();
    const result = await database.select<any[]>(
      "SELECT * FROM bookings WHERE status IN ('running', 'paused', 'upcoming') ORDER BY start_time"
    );
    return result.map(row => ({
      ...row,
      bookingType: JSON.parse(row.booking_type || '[]'),
      foodOrders: JSON.parse(row.food_orders || '[]'),
      lastPaymentAction: row.last_payment_action ? JSON.parse(row.last_payment_action) : null,
      promotionDetails: row.promotion_details ? JSON.parse(row.promotion_details) : null,
    }));
  },

  async createBooking(booking: any) {
    const database = await getDatabase();
    const id = generateUUID();
    const bookingCode = generateCode('BK');
    const now = new Date().toISOString();
    
    await database.execute(
      `INSERT INTO bookings (
        id, booking_code, group_id, group_code, category, seat_number, seat_name,
        customer_name, whatsapp_number, start_time, end_time, price, status,
        booking_type, paused_remaining_time, person_count, payment_method,
        cash_amount, upi_amount, payment_status, last_payment_action, food_orders,
        original_price, discount_applied, bonus_hours_applied, promotion_details,
        is_promotional_discount, is_promotional_bonus, manual_discount_percentage,
        manual_free_hours, discount, bonus, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)`,
      [
        id, bookingCode, booking.groupId || null, booking.groupCode || null,
        booking.category, booking.seatNumber, booking.seatName,
        booking.customerName, booking.whatsappNumber || null,
        booking.startTime, booking.endTime, booking.price, booking.status,
        JSON.stringify(booking.bookingType || []), booking.pausedRemainingTime || null,
        booking.personCount || 1, booking.paymentMethod || null,
        booking.cashAmount || null, booking.upiAmount || null,
        booking.paymentStatus || 'unpaid', JSON.stringify(booking.lastPaymentAction || null),
        JSON.stringify(booking.foodOrders || []), booking.originalPrice || null,
        booking.discountApplied || null, booking.bonusHoursApplied || null,
        JSON.stringify(booking.promotionDetails || null), booking.isPromotionalDiscount || 0,
        booking.isPromotionalBonus || 0, booking.manualDiscountPercentage || null,
        booking.manualFreeHours || null, booking.discount || null, booking.bonus || null, now
      ]
    );
    
    return { id, bookingCode, ...booking, createdAt: now };
  },

  async updateBooking(id: string, updates: any) {
    const database = await getDatabase();
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      groupId: 'group_id', groupCode: 'group_code', seatNumber: 'seat_number',
      seatName: 'seat_name', customerName: 'customer_name', whatsappNumber: 'whatsapp_number',
      startTime: 'start_time', endTime: 'end_time', bookingType: 'booking_type',
      pausedRemainingTime: 'paused_remaining_time', personCount: 'person_count',
      paymentMethod: 'payment_method', cashAmount: 'cash_amount', upiAmount: 'upi_amount',
      paymentStatus: 'payment_status', lastPaymentAction: 'last_payment_action',
      foodOrders: 'food_orders', originalPrice: 'original_price', discountApplied: 'discount_applied',
      bonusHoursApplied: 'bonus_hours_applied', promotionDetails: 'promotion_details',
      isPromotionalDiscount: 'is_promotional_discount', isPromotionalBonus: 'is_promotional_bonus',
      manualDiscountPercentage: 'manual_discount_percentage', manualFreeHours: 'manual_free_hours',
    };

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMappings[key] || key;
      setClauses.push(`${dbField} = $${paramIndex}`);
      if (['bookingType', 'foodOrders', 'lastPaymentAction', 'promotionDetails'].includes(key)) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      paramIndex++;
    }

    values.push(id);
    await database.execute(
      `UPDATE bookings SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    
    return { id, ...updates };
  },

  async deleteBooking(id: string) {
    const database = await getDatabase();
    await database.execute('DELETE FROM bookings WHERE id = $1', [id]);
  },

  async getAllFoodItems() {
    const database = await getDatabase();
    return database.select<any[]>('SELECT * FROM food_items ORDER BY name');
  },

  async createFoodItem(item: any) {
    const database = await getDatabase();
    const id = generateUUID();
    await database.execute(
      `INSERT INTO food_items (id, name, price, cost_price, current_stock, min_stock_level, in_inventory, category, supplier, expiry_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, item.name, item.price, item.costPrice || null, item.currentStock || 0,
       item.minStockLevel || 10, item.inInventory || 0, item.category || 'trackable',
       item.supplier || null, item.expiryDate || null]
    );
    return { id, ...item };
  },

  async updateFoodItem(id: string, updates: any) {
    const database = await getDatabase();
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMappings: Record<string, string> = {
      costPrice: 'cost_price', currentStock: 'current_stock', minStockLevel: 'min_stock_level',
      inInventory: 'in_inventory', expiryDate: 'expiry_date'
    };

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMappings[key] || key;
      setClauses.push(`${dbField} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    values.push(id);
    await database.execute(
      `UPDATE food_items SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    return { id, ...updates };
  },

  async deleteFoodItem(id: string) {
    const database = await getDatabase();
    await database.execute('DELETE FROM food_items WHERE id = $1', [id]);
  },

  async adjustStock(foodId: string, quantity: number, type: 'add' | 'remove') {
    const database = await getDatabase();
    const operator = type === 'add' ? '+' : '-';
    await database.execute(
      `UPDATE food_items SET current_stock = current_stock ${operator} $1 WHERE id = $2`,
      [quantity, foodId]
    );
  },

  async getAllDeviceConfigs() {
    const database = await getDatabase();
    const result = await database.select<any[]>('SELECT * FROM device_configs ORDER BY category');
    return result.map(row => ({
      ...row,
      seats: JSON.parse(row.seats || '[]')
    }));
  },

  async createDeviceConfig(config: any) {
    const database = await getDatabase();
    const id = generateUUID();
    await database.execute(
      'INSERT INTO device_configs (id, category, count, seats) VALUES ($1, $2, $3, $4)',
      [id, config.category, config.count || 0, JSON.stringify(config.seats || [])]
    );
    return { id, ...config };
  },

  async updateDeviceConfig(id: string, updates: any) {
    const database = await getDatabase();
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(key === 'seats' ? JSON.stringify(value) : value);
      paramIndex++;
    }

    values.push(id);
    await database.execute(
      `UPDATE device_configs SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    return { id, ...updates };
  },

  async deleteDeviceConfig(id: string) {
    const database = await getDatabase();
    await database.execute('DELETE FROM device_configs WHERE id = $1', [id]);
  },

  async getAllPricingConfigs() {
    const database = await getDatabase();
    return database.select<any[]>('SELECT * FROM pricing_configs ORDER BY category, duration');
  },

  async createPricingConfig(config: any) {
    const database = await getDatabase();
    const id = generateUUID();
    await database.execute(
      'INSERT INTO pricing_configs (id, category, duration, price, person_count) VALUES ($1, $2, $3, $4, $5)',
      [id, config.category, config.duration, config.price, config.personCount || 1]
    );
    return { id, ...config };
  },

  async updatePricingConfig(id: string, updates: any) {
    const database = await getDatabase();
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      const dbField = key === 'personCount' ? 'person_count' : key;
      setClauses.push(`${dbField} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    values.push(id);
    await database.execute(
      `UPDATE pricing_configs SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    return { id, ...updates };
  },

  async deletePricingConfig(id: string) {
    const database = await getDatabase();
    await database.execute('DELETE FROM pricing_configs WHERE id = $1', [id]);
  },

  async getAllHappyHoursConfigs() {
    const database = await getDatabase();
    const result = await database.select<any[]>('SELECT * FROM happy_hours_configs');
    return result.map(row => ({
      id: row.id,
      category: row.category,
      startTime: row.start_time,
      endTime: row.end_time,
      enabled: row.enabled
    }));
  },

  async getAllHappyHoursPricing() {
    const database = await getDatabase();
    const result = await database.select<any[]>('SELECT * FROM happy_hours_pricing');
    return result.map(row => ({
      id: row.id,
      category: row.category,
      duration: row.duration,
      price: row.price,
      personCount: row.person_count
    }));
  },

  async getAllExpenses() {
    const database = await getDatabase();
    return database.select<any[]>('SELECT * FROM expenses ORDER BY date DESC');
  },

  async createExpense(expense: any) {
    const database = await getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    await database.execute(
      'INSERT INTO expenses (id, category, description, amount, date, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, expense.category, expense.description, expense.amount, expense.date, now]
    );
    return { id, ...expense, createdAt: now };
  },

  async updateExpense(id: string, updates: any) {
    const database = await getDatabase();
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    values.push(id);
    await database.execute(
      `UPDATE expenses SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    return { id, ...updates };
  },

  async deleteExpense(id: string) {
    const database = await getDatabase();
    await database.execute('DELETE FROM expenses WHERE id = $1', [id]);
  },

  async getBookingHistory() {
    const database = await getDatabase();
    const result = await database.select<any[]>('SELECT * FROM booking_history ORDER BY archived_at DESC');
    return result.map(row => ({
      ...row,
      bookingType: JSON.parse(row.booking_type || '[]'),
      foodOrders: JSON.parse(row.food_orders || '[]'),
      lastPaymentAction: row.last_payment_action ? JSON.parse(row.last_payment_action) : null,
      promotionDetails: row.promotion_details ? JSON.parse(row.promotion_details) : null,
    }));
  },

  async archiveBooking(booking: any) {
    const database = await getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    
    await database.execute(
      `INSERT INTO booking_history (
        id, booking_id, booking_code, group_id, group_code, category, seat_number, seat_name,
        customer_name, whatsapp_number, start_time, end_time, price, status,
        booking_type, paused_remaining_time, person_count, payment_method,
        cash_amount, upi_amount, payment_status, last_payment_action, food_orders,
        original_price, discount_applied, bonus_hours_applied, promotion_details,
        is_promotional_discount, is_promotional_bonus, manual_discount_percentage,
        manual_free_hours, discount, bonus, created_at, archived_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35)`,
      [
        id, booking.id, booking.bookingCode, booking.groupId, booking.groupCode,
        booking.category, booking.seatNumber, booking.seatName,
        booking.customerName, booking.whatsappNumber,
        booking.startTime, booking.endTime, booking.price, booking.status,
        JSON.stringify(booking.bookingType || []), booking.pausedRemainingTime,
        booking.personCount, booking.paymentMethod,
        booking.cashAmount, booking.upiAmount, booking.paymentStatus,
        JSON.stringify(booking.lastPaymentAction || null), JSON.stringify(booking.foodOrders || []),
        booking.originalPrice, booking.discountApplied, booking.bonusHoursApplied,
        JSON.stringify(booking.promotionDetails || null), booking.isPromotionalDiscount,
        booking.isPromotionalBonus, booking.manualDiscountPercentage,
        booking.manualFreeHours, booking.discount, booking.bonus,
        booking.createdAt, now
      ]
    );
    
    return { id, ...booking, archivedAt: now };
  },

  async getAllUsers() {
    const database = await getDatabase();
    return database.select<any[]>('SELECT id, username, role, onboarding_completed, created_at, updated_at FROM users');
  },

  async getUserByUsername(username: string) {
    const database = await getDatabase();
    const result = await database.select<any[]>(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result[0] || null;
  },

  async validatePassword(username: string, password: string) {
    const user = await this.getUserByUsername(username);
    if (!user || !user.password_hash) return null;
    
    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? user : null;
  },

  async getActivityLogs() {
    const database = await getDatabase();
    return database.select<any[]>('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 1000');
  },

  async createActivityLog(log: any) {
    const database = await getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    await database.execute(
      `INSERT INTO activity_logs (id, user_id, username, user_role, action, entity_type, entity_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, log.userId, log.username, log.userRole, log.action, log.entityType || null, log.entityId || null, log.details || null, now]
    );
    return { id, ...log, createdAt: now };
  },

  async getNotifications() {
    const database = await getDatabase();
    return database.select<any[]>('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100');
  },

  async getUnreadNotifications() {
    const database = await getDatabase();
    return database.select<any[]>('SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC');
  },

  async markNotificationAsRead(id: string) {
    const database = await getDatabase();
    await database.execute('UPDATE notifications SET is_read = 1 WHERE id = $1', [id]);
  },

  async markAllNotificationsAsRead() {
    const database = await getDatabase();
    await database.execute('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
  },

  async getGamingCenterInfo() {
    const database = await getDatabase();
    const result = await database.select<any[]>('SELECT * FROM gaming_center_info LIMIT 1');
    return result[0] || null;
  },

  async updateGamingCenterInfo(info: any) {
    const database = await getDatabase();
    const existing = await this.getGamingCenterInfo();
    const now = new Date().toISOString();
    
    if (existing) {
      await database.execute(
        `UPDATE gaming_center_info SET name = $1, description = $2, address = $3, phone = $4, email = $5, hours = $6, timezone = $7, updated_at = $8 WHERE id = $9`,
        [info.name, info.description, info.address, info.phone, info.email || null, info.hours, info.timezone || 'Asia/Kolkata', now, existing.id]
      );
      return { ...existing, ...info, updatedAt: now };
    } else {
      const id = generateUUID();
      await database.execute(
        `INSERT INTO gaming_center_info (id, name, description, address, phone, email, hours, timezone, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, info.name, info.description, info.address, info.phone, info.email || null, info.hours, info.timezone || 'Asia/Kolkata', now]
      );
      return { id, ...info, updatedAt: now };
    }
  },
};

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
