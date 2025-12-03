/* src/lib/tauri-db.ts
   Consolidated Tauri local DB adapter for Airavoto Gaming POS.
   This file provides complete offline functionality using local SQLite database.
*/

type AnyObject = Record<string, any>;

let db: any = null;
let dbInitPromise: Promise<any> | null = null;
let dbInitialized = false;

/**
 * Robust Tauri v2 detection.
 * - Prefer internal bridge existence if available.
 * - Fall back to userAgent check for "tauri".
 */
export function isTauri(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if ('__TAURI_INTERNALS__' in (window as any)) return true;
    if ('__TAURI__' in (window as any)) return true;
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      return navigator.userAgent.toLowerCase().includes('tauri');
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Initialize the Tauri SQL database (singleton).
 */
export async function initDatabase() {
  if (!isTauri()) {
    throw new Error('Cannot initialize Tauri database in web mode');
  }

  if (db && dbInitialized) return db;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    try {
      console.log('[DB] Initializing Tauri database...');
      const sqlModule = await import('@tauri-apps/plugin-sql');
      const Database = sqlModule.default || (sqlModule as any).Database || sqlModule;
      db = await Database.load('sqlite:airavoto_pos.db');
      dbInitialized = true;
      console.log('[DB] Tauri database initialized successfully');
      return db;
    } catch (error) {
      console.error('[DB] Failed to initialize Tauri database:', error);
      dbInitPromise = null;
      throw error;
    }
  })();

  return dbInitPromise;
}

/**
 * Get the initialized database instance.
 */
export async function getDatabase() {
  if (!isTauri()) {
    throw new Error('Cannot get Tauri database in web mode');
  }
  if (!db || !dbInitialized) {
    return initDatabase();
  }
  return db;
}

export function isDatabaseReady(): boolean {
  return isTauri() && dbInitialized && db !== null;
}

/* Utility helpers */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateCode(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.floor(Math.random() * 0xFFFFFF)
    .toString(16)
    .toUpperCase()
    .padStart(6, '0');
  return `${prefix}-${timestamp.slice(-5)}${randomPart.slice(0, 4)}`;
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function transformRow(row: AnyObject): AnyObject {
  const transformed: AnyObject = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = snakeToCamel(key);
    transformed[camelKey] = value;
  }
  return transformed;
}

function safeJsonParse<T = any>(s: any, fallback: T): T {
  if (s === null || s === undefined) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function parseDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateRequired(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function transformBookingRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    bookingCode: row.booking_code,
    groupId: row.group_id,
    groupCode: row.group_code,
    category: row.category,
    seatNumber: row.seat_number,
    seatName: row.seat_name,
    customerName: row.customer_name,
    whatsappNumber: row.whatsapp_number,
    startTime: parseDateRequired(row.start_time),
    endTime: parseDateRequired(row.end_time),
    price: row.price,
    status: row.status,
    bookingType: safeJsonParse(row.booking_type, []),
    pausedRemainingTime: row.paused_remaining_time,
    personCount: row.person_count,
    paymentMethod: row.payment_method,
    cashAmount: row.cash_amount,
    upiAmount: row.upi_amount,
    paymentStatus: row.payment_status,
    lastPaymentAction: safeJsonParse(row.last_payment_action, null),
    foodOrders: safeJsonParse(row.food_orders, []),
    originalPrice: row.original_price,
    discountApplied: row.discount_applied,
    bonusHoursApplied: row.bonus_hours_applied,
    promotionDetails: safeJsonParse(row.promotion_details, null),
    isPromotionalDiscount: row.is_promotional_discount,
    isPromotionalBonus: row.is_promotional_bonus,
    manualDiscountPercentage: row.manual_discount_percentage,
    manualFreeHours: row.manual_free_hours,
    discount: row.discount,
    bonus: row.bonus,
    createdAt: parseDateRequired(row.created_at),
  };
}

function transformFoodItemRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    costPrice: row.cost_price,
    currentStock: row.current_stock,
    minStockLevel: row.min_stock_level,
    inInventory: row.in_inventory,
    category: row.category,
    supplier: row.supplier,
    expiryDate: parseDate(row.expiry_date),
  };
}

function transformExpenseRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    amount: row.amount,
    date: parseDateRequired(row.date),
    createdAt: parseDateRequired(row.created_at),
  };
}

function transformActivityLogRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    userRole: row.user_role,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details,
    createdAt: parseDateRequired(row.created_at),
  };
}

function transformNotificationRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    entityType: row.entity_type,
    entityId: row.entity_id,
    activityLogId: row.activity_log_id,
    isRead: row.is_read,
    createdAt: parseDateRequired(row.created_at),
  };
}

function transformUserRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    onboardingCompleted: row.onboarding_completed,
    profileImageUrl: row.profile_image_url,
    createdAt: parseDateRequired(row.created_at),
    updatedAt: parseDate(row.updated_at),
  };
}

function transformDeviceConfigRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    count: row.count,
    seats: safeJsonParse(row.seats, []),
  };
}

function transformPricingConfigRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    duration: row.duration,
    price: row.price,
    personCount: row.person_count,
  };
}

function transformBookingHistoryRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    bookingId: row.booking_id,
    bookingCode: row.booking_code,
    groupId: row.group_id,
    groupCode: row.group_code,
    category: row.category,
    seatNumber: row.seat_number,
    seatName: row.seat_name,
    customerName: row.customer_name,
    whatsappNumber: row.whatsapp_number,
    startTime: parseDateRequired(row.start_time),
    endTime: parseDateRequired(row.end_time),
    price: row.price,
    status: row.status,
    bookingType: safeJsonParse(row.booking_type, []),
    pausedRemainingTime: row.paused_remaining_time,
    personCount: row.person_count,
    paymentMethod: row.payment_method,
    cashAmount: row.cash_amount,
    upiAmount: row.upi_amount,
    paymentStatus: row.payment_status,
    lastPaymentAction: safeJsonParse(row.last_payment_action, null),
    foodOrders: safeJsonParse(row.food_orders, []),
    originalPrice: row.original_price,
    discountApplied: row.discount_applied,
    bonusHoursApplied: row.bonus_hours_applied,
    promotionDetails: safeJsonParse(row.promotion_details, null),
    isPromotionalDiscount: row.is_promotional_discount,
    isPromotionalBonus: row.is_promotional_bonus,
    manualDiscountPercentage: row.manual_discount_percentage,
    manualFreeHours: row.manual_free_hours,
    discount: row.discount,
    bonus: row.bonus,
    createdAt: parseDateRequired(row.created_at),
    archivedAt: parseDate(row.archived_at),
  };
}

function transformGamingCenterInfoRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    address: row.address,
    phone: row.phone,
    email: row.email,
    hours: row.hours,
    timezone: row.timezone,
    updatedAt: parseDate(row.updated_at),
  };
}

function transformSessionGroupRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    groupCode: row.group_code,
    groupName: row.group_name,
    category: row.category,
    bookingType: safeJsonParse(row.booking_type, []),
    createdAt: parseDateRequired(row.created_at),
  };
}

/* -------------------------
   localDb API (all functions)
   ------------------------- */
export const localDb = {
  /* BOOKINGS */
  async getAllBookings() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM bookings ORDER BY created_at DESC');
    return (result || []).map(transformBookingRow);
  },

  async getActiveBookings() {
    const database = await getDatabase();
    const result = await database.select(
      "SELECT * FROM bookings WHERE status IN ('running', 'paused', 'upcoming') ORDER BY start_time"
    );
    return (result || []).map(transformBookingRow);
  },

  async getBookingById(id: string) {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM bookings WHERE id = $1', [id]);
    return result[0] ? transformBookingRow(result[0]) : null;
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
        JSON.stringify(booking.promotionDetails || null), booking.isPromotionalDiscount ? 1 : 0,
        booking.isPromotionalBonus ? 1 : 0, booking.manualDiscountPercentage || null,
        booking.manualFreeHours || null, booking.discount || null, booking.bonus || null, now
      ]
    );

    return {
      id,
      bookingCode,
      groupId: booking.groupId || null,
      groupCode: booking.groupCode || null,
      category: booking.category,
      seatNumber: booking.seatNumber,
      seatName: booking.seatName,
      customerName: booking.customerName,
      whatsappNumber: booking.whatsappNumber || null,
      startTime: booking.startTime,
      endTime: booking.endTime,
      price: booking.price,
      status: booking.status,
      bookingType: booking.bookingType || [],
      pausedRemainingTime: booking.pausedRemainingTime || null,
      personCount: booking.personCount || 1,
      paymentMethod: booking.paymentMethod || null,
      cashAmount: booking.cashAmount || null,
      upiAmount: booking.upiAmount || null,
      paymentStatus: booking.paymentStatus || 'unpaid',
      lastPaymentAction: booking.lastPaymentAction || null,
      foodOrders: booking.foodOrders || [],
      originalPrice: booking.originalPrice || null,
      discountApplied: booking.discountApplied || null,
      bonusHoursApplied: booking.bonusHoursApplied || null,
      promotionDetails: booking.promotionDetails || null,
      isPromotionalDiscount: booking.isPromotionalDiscount ? 1 : 0,
      isPromotionalBonus: booking.isPromotionalBonus ? 1 : 0,
      manualDiscountPercentage: booking.manualDiscountPercentage || null,
      manualFreeHours: booking.manualFreeHours || null,
      discount: booking.discount || null,
      bonus: booking.bonus || null,
      createdAt: now,
    };
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
    
    const updated = await this.getBookingById(id);
    return updated;
  },

  async deleteBooking(id: string) {
    const database = await getDatabase();
    await database.execute('DELETE FROM bookings WHERE id = $1', [id]);
  },

  /* FOOD ITEMS */
  async getAllFoodItems() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM food_items ORDER BY name');
    return (result || []).map(transformFoodItemRow);
  },

  async getFoodItemById(id: string) {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM food_items WHERE id = $1', [id]);
    return result[0] ? transformFoodItemRow(result[0]) : null;
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
    return {
      id,
      name: item.name,
      price: item.price,
      costPrice: item.costPrice || null,
      currentStock: item.currentStock || 0,
      minStockLevel: item.minStockLevel || 10,
      inInventory: item.inInventory || 0,
      category: item.category || 'trackable',
      supplier: item.supplier || null,
      expiryDate: item.expiryDate || null,
    };
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
    return await this.getFoodItemById(id);
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
    return await this.getFoodItemById(foodId);
  },

  /* DEVICE CONFIGS */
  async getAllDeviceConfigs() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM device_configs ORDER BY category');
    return (result || []).map(transformDeviceConfigRow);
  },

  async getDeviceConfigById(id: string) {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM device_configs WHERE id = $1', [id]);
    return result[0] ? transformDeviceConfigRow(result[0]) : null;
  },

  async createDeviceConfig(config: any) {
    const database = await getDatabase();
    const id = generateUUID();
    await database.execute(
      'INSERT INTO device_configs (id, category, count, seats) VALUES ($1, $2, $3, $4)',
      [id, config.category, config.count || 0, JSON.stringify(config.seats || [])]
    );
    return {
      id,
      category: config.category,
      count: config.count || 0,
      seats: config.seats || [],
    };
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
    return await this.getDeviceConfigById(id);
  },

  async deleteDeviceConfig(id: string) {
    const database = await getDatabase();
    await database.execute('DELETE FROM device_configs WHERE id = $1', [id]);
  },

  /* PRICING CONFIGS */
  async getAllPricingConfigs() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM pricing_configs ORDER BY category, duration');
    return (result || []).map(transformPricingConfigRow);
  },

  async getPricingConfigById(id: string) {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM pricing_configs WHERE id = $1', [id]);
    return result[0] ? transformPricingConfigRow(result[0]) : null;
  },

  async createPricingConfig(config: any) {
    const database = await getDatabase();
    const id = generateUUID();
    await database.execute(
      'INSERT INTO pricing_configs (id, category, duration, price, person_count) VALUES ($1, $2, $3, $4, $5)',
      [id, config.category, config.duration, config.price, config.personCount || 1]
    );
    return {
      id,
      category: config.category,
      duration: config.duration,
      price: config.price,
      personCount: config.personCount || 1,
    };
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
    return await this.getPricingConfigById(id);
  },

  async deletePricingConfig(id: string) {
    const database = await getDatabase();
    await database.execute('DELETE FROM pricing_configs WHERE id = $1', [id]);
  },

  /* HAPPY HOURS */
  async getAllHappyHoursConfigs() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM happy_hours_configs');
    return (result || []).map((row: any) => ({
      id: row.id,
      category: row.category,
      startTime: row.start_time,
      endTime: row.end_time,
      enabled: row.enabled
    }));
  },

  async getAllHappyHoursPricing() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM happy_hours_pricing');
    return (result || []).map((row: any) => ({
      id: row.id,
      category: row.category,
      duration: row.duration,
      price: row.price,
      personCount: row.person_count
    }));
  },

  /* EXPENSES */
  async getAllExpenses() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM expenses ORDER BY date DESC');
    return (result || []).map(transformExpenseRow);
  },

  async getExpenseById(id: string) {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM expenses WHERE id = $1', [id]);
    return result[0] ? transformExpenseRow(result[0]) : null;
  },

  async createExpense(expense: any) {
    const database = await getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    await database.execute(
      'INSERT INTO expenses (id, category, description, amount, date, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, expense.category, expense.description, expense.amount, expense.date, now]
    );
    return {
      id,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      createdAt: now,
    };
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
    return await this.getExpenseById(id);
  },

  async deleteExpense(id: string) {
    const database = await getDatabase();
    await database.execute('DELETE FROM expenses WHERE id = $1', [id]);
  },

  /* BOOKING HISTORY */
  async getBookingHistory() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM booking_history ORDER BY archived_at DESC');
    return (result || []).map(transformBookingHistoryRow);
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
    
    return { ...booking, id, bookingId: booking.id, archivedAt: now };
  },

  /* USERS */
  async getAllUsers() {
    const database = await getDatabase();
    const result = await database.select('SELECT id, username, role, onboarding_completed, profile_image_url, created_at, updated_at FROM users');
    return (result || []).map(transformUserRow);
  },

  async getUserById(id: string) {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM users WHERE id = $1', [id]);
    return result[0] ? transformUserRow(result[0]) : null;
  },

  async getUserByUsername(username: string) {
    const database = await getDatabase();
    const result = await database.select(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    if (!result[0]) return null;
    return {
      ...transformUserRow(result[0]),
      passwordHash: result[0].password_hash,
    };
  },

  async validatePassword(username: string, password: string) {
    const user = await this.getUserByUsername(username);
    if (!user || !user.passwordHash) return null;
    
    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async createUser(userData: { username: string; password: string; role: string }) {
    const database = await getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(userData.password, 10);
    
    await database.execute(
      `INSERT INTO users (id, username, password_hash, role, onboarding_completed, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, userData.username, passwordHash, userData.role, 0, now, now]
    );
    
    return {
      id,
      username: userData.username,
      role: userData.role,
      onboardingCompleted: 0,
      profileImageUrl: null,
      createdAt: now,
      updatedAt: now,
    };
  },

  async updateUser(id: string, updates: any) {
    const database = await getDatabase();
    const now = new Date().toISOString();
    const setClauses: string[] = ['updated_at = $1'];
    const values: any[] = [now];
    let paramIndex = 2;

    const fieldMappings: Record<string, string> = {
      onboardingCompleted: 'onboarding_completed',
      profileImageUrl: 'profile_image_url',
    };

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'password') {
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(value as string, 10);
        setClauses.push(`password_hash = $${paramIndex}`);
        values.push(passwordHash);
      } else {
        const dbField = fieldMappings[key] || key;
        setClauses.push(`${dbField} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }

    values.push(id);
    await database.execute(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
    return await this.getUserById(id);
  },

  async deleteUser(id: string) {
    const database = await getDatabase();
    await database.execute('DELETE FROM users WHERE id = $1', [id]);
  },

  /* ACTIVITY LOGS */
  async getActivityLogs() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 1000');
    return (result || []).map(transformActivityLogRow);
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
    return {
      id,
      userId: log.userId,
      username: log.username,
      userRole: log.userRole,
      action: log.action,
      entityType: log.entityType || null,
      entityId: log.entityId || null,
      details: log.details || null,
      createdAt: now,
    };
  },

  /* NOTIFICATIONS */
  async getNotifications() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100');
    return (result || []).map(transformNotificationRow);
  },

  async getUnreadNotifications() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC');
    return (result || []).map(transformNotificationRow);
  },

  async createNotification(notification: any) {
    const database = await getDatabase();
    const id = generateUUID();
    const now = new Date().toISOString();
    await database.execute(
      `INSERT INTO notifications (id, type, title, message, entity_type, entity_id, activity_log_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, notification.type, notification.title, notification.message, 
       notification.entityType || null, notification.entityId || null, 
       notification.activityLogId || null, 0, now]
    );
    return {
      id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      entityType: notification.entityType || null,
      entityId: notification.entityId || null,
      activityLogId: notification.activityLogId || null,
      isRead: 0,
      createdAt: now,
    };
  },

  async markNotificationAsRead(id: string) {
    const database = await getDatabase();
    await database.execute('UPDATE notifications SET is_read = 1 WHERE id = $1', [id]);
  },

  async markAllNotificationsAsRead() {
    const database = await getDatabase();
    await database.execute('UPDATE notifications SET is_read = 1 WHERE is_read = 0');
  },

  /* GAMING CENTER INFO */
  async getGamingCenterInfo() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM gaming_center_info LIMIT 1');
    return result[0] ? transformGamingCenterInfoRow(result[0]) : null;
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

  /* SESSION GROUPS */
  async getAllSessionGroups() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM session_groups ORDER BY created_at DESC');
    return (result || []).map(transformSessionGroupRow);
  },

  async createSessionGroup(group: any) {
    const database = await getDatabase();
    const id = generateUUID();
    const groupCode = generateCode('GRP');
    const now = new Date().toISOString();
    
    await database.execute(
      `INSERT INTO session_groups (id, group_code, group_name, category, booking_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, groupCode, group.groupName, group.category, JSON.stringify(group.bookingType || []), now]
    );
    
    return {
      id,
      groupCode,
      groupName: group.groupName,
      category: group.category,
      bookingType: group.bookingType || [],
      createdAt: now,
    };
  },

  async deleteSessionGroup(id: string) {
    const database = await getDatabase();
    await database.execute('DELETE FROM session_groups WHERE id = $1', [id]);
  },

  /* STAFF VISIBILITY SETTINGS */
  async getStaffVisibilitySettings() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM staff_visibility_settings LIMIT 1');
    if (!result[0]) return null;
    return {
      id: result[0].id,
      pages: safeJsonParse(result[0].pages, {}),
      dashboard: safeJsonParse(result[0].dashboard, {}),
      updatedAt: result[0].updated_at,
    };
  },

  async updateStaffVisibilitySettings(settings: any) {
    const database = await getDatabase();
    const existing = await this.getStaffVisibilitySettings();
    const now = new Date().toISOString();
    
    if (existing) {
      await database.execute(
        `UPDATE staff_visibility_settings SET pages = $1, dashboard = $2, updated_at = $3 WHERE id = $4`,
        [JSON.stringify(settings.pages || {}), JSON.stringify(settings.dashboard || {}), now, existing.id]
      );
      return { ...existing, ...settings, updatedAt: now };
    } else {
      const id = generateUUID();
      await database.execute(
        `INSERT INTO staff_visibility_settings (id, pages, dashboard, updated_at)
         VALUES ($1, $2, $3, $4)`,
        [id, JSON.stringify(settings.pages || {}), JSON.stringify(settings.dashboard || {}), now]
      );
      return { id, ...settings, updatedAt: now };
    }
  },

  /* APP SETTINGS */
  async getAppSettings() {
    const database = await getDatabase();
    const result = await database.select('SELECT * FROM app_settings LIMIT 1');
    if (!result[0]) return null;
    return {
      id: result[0].id,
      theme: result[0].theme,
      language: result[0].language,
      notifications: safeJsonParse(result[0].notifications, {}),
      updatedAt: result[0].updated_at,
    };
  },

  async updateAppSettings(settings: any) {
    const database = await getDatabase();
    const existing = await this.getAppSettings();
    const now = new Date().toISOString();
    
    if (existing) {
      await database.execute(
        `UPDATE app_settings SET theme = $1, language = $2, notifications = $3, updated_at = $4 WHERE id = $5`,
        [settings.theme || 'system', settings.language || 'en', JSON.stringify(settings.notifications || {}), now, existing.id]
      );
      return { ...existing, ...settings, updatedAt: now };
    } else {
      const id = generateUUID();
      await database.execute(
        `INSERT INTO app_settings (id, theme, language, notifications, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, settings.theme || 'system', settings.language || 'en', JSON.stringify(settings.notifications || {}), now]
      );
      return { id, ...settings, updatedAt: now };
    }
  },
};
