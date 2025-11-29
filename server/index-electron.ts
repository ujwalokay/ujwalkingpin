import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { db, initializeSqliteDatabase, sqlite } from "./db-sqlite";
import * as schema from "../shared/schema-sqlite";
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initializeSqliteDatabase();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

const MemoryStore = session.MemoryStore;

app.use(session({
  store: new MemoryStore(),
  secret: 'airavoto-gaming-pos-offline-secret-key-' + Date.now(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  async (username: string, password: string, done: (error: any, user?: any, options?: { message: string }) => void) => {
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
      if (!user) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      if (!user.passwordHash) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return done(null, false, { message: 'Invalid username or password' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    done(null, user || null);
  } catch (error) {
    done(error, null);
  }
});

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
}

function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as any)?.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Admin access required' });
}

app.post('/api/auth/login', passport.authenticate('local'), (req, res) => {
  const user = req.user as any;
  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    onboardingCompleted: user.onboardingCompleted === 1,
    profileImageUrl: user.profileImageUrl
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted === 1,
      profileImageUrl: user.profileImageUrl
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: 'offline',
    database: 'sqlite'
  });
});

app.get('/api/bookings', isAuthenticated, async (req, res) => {
  try {
    const bookings = await db.select().from(schema.bookings);
    const parsedBookings = bookings.map(b => ({
      ...b,
      bookingType: JSON.parse(b.bookingType || '[]'),
      foodOrders: JSON.parse(b.foodOrders || '[]'),
      lastPaymentAction: b.lastPaymentAction ? JSON.parse(b.lastPaymentAction) : null,
      promotionDetails: b.promotionDetails ? JSON.parse(b.promotionDetails) : null,
    }));
    res.json(parsedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

app.post('/api/bookings', isAuthenticated, async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      bookingType: JSON.stringify(req.body.bookingType || []),
      foodOrders: JSON.stringify(req.body.foodOrders || []),
      lastPaymentAction: req.body.lastPaymentAction ? JSON.stringify(req.body.lastPaymentAction) : null,
      promotionDetails: req.body.promotionDetails ? JSON.stringify(req.body.promotionDetails) : null,
      startTime: new Date(req.body.startTime),
      endTime: new Date(req.body.endTime),
    };
    const [booking] = await db.insert(schema.bookings).values(bookingData).returning();
    res.json({
      ...booking,
      bookingType: JSON.parse(booking.bookingType || '[]'),
      foodOrders: JSON.parse(booking.foodOrders || '[]'),
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
});

app.patch('/api/bookings/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };
    if (req.body.bookingType) {
      updateData.bookingType = JSON.stringify(req.body.bookingType);
    }
    if (req.body.foodOrders) {
      updateData.foodOrders = JSON.stringify(req.body.foodOrders);
    }
    if (req.body.lastPaymentAction) {
      updateData.lastPaymentAction = JSON.stringify(req.body.lastPaymentAction);
    }
    if (req.body.promotionDetails) {
      updateData.promotionDetails = JSON.stringify(req.body.promotionDetails);
    }
    if (req.body.startTime) {
      updateData.startTime = new Date(req.body.startTime);
    }
    if (req.body.endTime) {
      updateData.endTime = new Date(req.body.endTime);
    }
    const [booking] = await db.update(schema.bookings).set(updateData).where(eq(schema.bookings.id, id)).returning();
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({
      ...booking,
      bookingType: JSON.parse(booking.bookingType || '[]'),
      foodOrders: JSON.parse(booking.foodOrders || '[]'),
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ message: 'Failed to update booking' });
  }
});

app.delete('/api/bookings/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.bookings).where(eq(schema.bookings.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Failed to delete booking' });
  }
});

app.get('/api/device-configs', isAuthenticated, async (req, res) => {
  try {
    const configs = await db.select().from(schema.deviceConfigs);
    const parsedConfigs = configs.map(c => ({
      ...c,
      seats: JSON.parse(c.seats || '[]'),
    }));
    res.json(parsedConfigs);
  } catch (error) {
    console.error('Error fetching device configs:', error);
    res.status(500).json({ message: 'Failed to fetch device configs' });
  }
});

app.post('/api/device-configs', isAdmin, async (req, res) => {
  try {
    const configData = {
      ...req.body,
      seats: JSON.stringify(req.body.seats || []),
    };
    const [config] = await db.insert(schema.deviceConfigs).values(configData).returning();
    res.json({
      ...config,
      seats: JSON.parse(config.seats || '[]'),
    });
  } catch (error) {
    console.error('Error creating device config:', error);
    res.status(500).json({ message: 'Failed to create device config' });
  }
});

app.get('/api/pricing-configs', isAuthenticated, async (req, res) => {
  try {
    const configs = await db.select().from(schema.pricingConfigs);
    res.json(configs);
  } catch (error) {
    console.error('Error fetching pricing configs:', error);
    res.status(500).json({ message: 'Failed to fetch pricing configs' });
  }
});

app.get('/api/food-items', isAuthenticated, async (req, res) => {
  try {
    const items = await db.select().from(schema.foodItems);
    res.json(items);
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({ message: 'Failed to fetch food items' });
  }
});

app.post('/api/food-items', isAuthenticated, async (req, res) => {
  try {
    const [item] = await db.insert(schema.foodItems).values(req.body).returning();
    res.json(item);
  } catch (error) {
    console.error('Error creating food item:', error);
    res.status(500).json({ message: 'Failed to create food item' });
  }
});

app.patch('/api/food-items/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const [item] = await db.update(schema.foodItems).set(req.body).where(eq(schema.foodItems.id, id)).returning();
    if (!item) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({ message: 'Failed to update food item' });
  }
});

app.delete('/api/food-items/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.foodItems).where(eq(schema.foodItems.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ message: 'Failed to delete food item' });
  }
});

// Server time for syncing
app.get('/api/server-time', (req, res) => {
  res.json({ serverTime: new Date().toISOString() });
});

// Session Groups API
const generateUniqueCode = (prefix: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
  return `${prefix}-${timestamp.slice(-5)}${randomPart.slice(0, 4)}`;
};

app.get('/api/session-groups', isAuthenticated, async (req, res) => {
  try {
    const groups = await db.select().from(schema.sessionGroups);
    res.json(groups);
  } catch (error) {
    console.error('Error fetching session groups:', error);
    res.status(500).json({ message: 'Failed to fetch session groups' });
  }
});

app.post('/api/session-groups', isAuthenticated, async (req, res) => {
  try {
    const groupCode = generateUniqueCode('GRP');
    const [group] = await db.insert(schema.sessionGroups).values({
      ...req.body,
      groupCode,
    }).returning();
    res.json(group);
  } catch (error) {
    console.error('Error creating session group:', error);
    res.status(500).json({ message: 'Failed to create session group' });
  }
});

app.get('/api/session-groups/:id/bookings', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await db.select().from(schema.bookings).where(eq(schema.bookings.groupId, id));
    const parsedBookings = bookings.map(b => ({
      ...b,
      bookingType: JSON.parse(b.bookingType || '[]'),
      foodOrders: JSON.parse(b.foodOrders || '[]'),
    }));
    res.json(parsedBookings);
  } catch (error) {
    console.error('Error fetching group bookings:', error);
    res.status(500).json({ message: 'Failed to fetch group bookings' });
  }
});

app.delete('/api/session-groups/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.sessionGroups).where(eq(schema.sessionGroups.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting session group:', error);
    res.status(500).json({ message: 'Failed to delete session group' });
  }
});

// Booking History
app.get('/api/booking-history', isAuthenticated, async (req, res) => {
  try {
    const history = await db.select().from(schema.bookingHistory);
    const parsedHistory = history.map(b => ({
      ...b,
      bookingType: JSON.parse(b.bookingType || '[]'),
      foodOrders: JSON.parse(b.foodOrders || '[]'),
    }));
    res.json(parsedHistory);
  } catch (error) {
    console.error('Error fetching booking history:', error);
    res.status(500).json({ message: 'Failed to fetch booking history' });
  }
});

app.post('/api/booking-history', isAuthenticated, async (req, res) => {
  try {
    const historyData = {
      ...req.body,
      bookingType: JSON.stringify(req.body.bookingType || []),
      foodOrders: JSON.stringify(req.body.foodOrders || []),
      archivedAt: new Date(),
    };
    const [history] = await db.insert(schema.bookingHistory).values(historyData).returning();
    res.json(history);
  } catch (error) {
    console.error('Error creating booking history:', error);
    res.status(500).json({ message: 'Failed to create booking history' });
  }
});

// Device Config routes
app.get('/api/device-config', isAuthenticated, async (req, res) => {
  try {
    const configs = await db.select().from(schema.deviceConfigs);
    const parsedConfigs = configs.map(c => ({
      ...c,
      seats: JSON.parse(c.seats || '[]'),
    }));
    res.json(parsedConfigs);
  } catch (error) {
    console.error('Error fetching device configs:', error);
    res.status(500).json({ message: 'Failed to fetch device configs' });
  }
});

app.patch('/api/device-config/:category', isAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    const updateData = {
      ...req.body,
      seats: JSON.stringify(req.body.seats || []),
    };
    const [existing] = await db.select().from(schema.deviceConfigs).where(eq(schema.deviceConfigs.category, category));
    if (existing) {
      const [config] = await db.update(schema.deviceConfigs).set(updateData).where(eq(schema.deviceConfigs.category, category)).returning();
      res.json({ ...config, seats: JSON.parse(config.seats || '[]') });
    } else {
      const [config] = await db.insert(schema.deviceConfigs).values({ category, ...updateData }).returning();
      res.json({ ...config, seats: JSON.parse(config.seats || '[]') });
    }
  } catch (error) {
    console.error('Error updating device config:', error);
    res.status(500).json({ message: 'Failed to update device config' });
  }
});

// Pricing Config routes
app.get('/api/pricing-config', isAuthenticated, async (req, res) => {
  try {
    const configs = await db.select().from(schema.pricingConfigs);
    res.json(configs);
  } catch (error) {
    console.error('Error fetching pricing configs:', error);
    res.status(500).json({ message: 'Failed to fetch pricing configs' });
  }
});

app.post('/api/pricing-config', isAdmin, async (req, res) => {
  try {
    const [config] = await db.insert(schema.pricingConfigs).values(req.body).returning();
    res.json(config);
  } catch (error) {
    console.error('Error creating pricing config:', error);
    res.status(500).json({ message: 'Failed to create pricing config' });
  }
});

app.patch('/api/pricing-config/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [config] = await db.update(schema.pricingConfigs).set(req.body).where(eq(schema.pricingConfigs.id, id)).returning();
    res.json(config);
  } catch (error) {
    console.error('Error updating pricing config:', error);
    res.status(500).json({ message: 'Failed to update pricing config' });
  }
});

app.delete('/api/pricing-config/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.pricingConfigs).where(eq(schema.pricingConfigs.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing config:', error);
    res.status(500).json({ message: 'Failed to delete pricing config' });
  }
});

// Happy Hours Config routes
app.get('/api/happy-hours-config', isAuthenticated, async (req, res) => {
  try {
    const configs = await db.select().from(schema.happyHoursConfigs);
    res.json(configs);
  } catch (error) {
    console.error('Error fetching happy hours configs:', error);
    res.status(500).json({ message: 'Failed to fetch happy hours configs' });
  }
});

app.post('/api/happy-hours-config', isAdmin, async (req, res) => {
  try {
    const [config] = await db.insert(schema.happyHoursConfigs).values(req.body).returning();
    res.json(config);
  } catch (error) {
    console.error('Error creating happy hours config:', error);
    res.status(500).json({ message: 'Failed to create happy hours config' });
  }
});

app.patch('/api/happy-hours-config/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [config] = await db.update(schema.happyHoursConfigs).set(req.body).where(eq(schema.happyHoursConfigs.id, id)).returning();
    res.json(config);
  } catch (error) {
    console.error('Error updating happy hours config:', error);
    res.status(500).json({ message: 'Failed to update happy hours config' });
  }
});

app.delete('/api/happy-hours-config/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.happyHoursConfigs).where(eq(schema.happyHoursConfigs.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting happy hours config:', error);
    res.status(500).json({ message: 'Failed to delete happy hours config' });
  }
});

// Happy Hours Pricing routes
app.get('/api/happy-hours-pricing', isAuthenticated, async (req, res) => {
  try {
    const pricing = await db.select().from(schema.happyHoursPricing);
    res.json(pricing);
  } catch (error) {
    console.error('Error fetching happy hours pricing:', error);
    res.status(500).json({ message: 'Failed to fetch happy hours pricing' });
  }
});

app.post('/api/happy-hours-pricing', isAdmin, async (req, res) => {
  try {
    const [pricing] = await db.insert(schema.happyHoursPricing).values(req.body).returning();
    res.json(pricing);
  } catch (error) {
    console.error('Error creating happy hours pricing:', error);
    res.status(500).json({ message: 'Failed to create happy hours pricing' });
  }
});

app.patch('/api/happy-hours-pricing/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [pricing] = await db.update(schema.happyHoursPricing).set(req.body).where(eq(schema.happyHoursPricing.id, id)).returning();
    res.json(pricing);
  } catch (error) {
    console.error('Error updating happy hours pricing:', error);
    res.status(500).json({ message: 'Failed to update happy hours pricing' });
  }
});

app.delete('/api/happy-hours-pricing/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.happyHoursPricing).where(eq(schema.happyHoursPricing.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting happy hours pricing:', error);
    res.status(500).json({ message: 'Failed to delete happy hours pricing' });
  }
});

// Activity Logs routes
app.get('/api/activity-logs', isAuthenticated, async (req, res) => {
  try {
    const logs = await db.select().from(schema.activityLogs);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
});

app.post('/api/activity-logs', isAuthenticated, async (req, res) => {
  try {
    const [log] = await db.insert(schema.activityLogs).values(req.body).returning();
    res.json(log);
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({ message: 'Failed to create activity log' });
  }
});

// Profile routes
app.get('/api/profile', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

app.patch('/api/profile', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const [updated] = await db.update(schema.users).set(req.body).where(eq(schema.users.id, user.id)).returning();
    res.json({
      id: updated.id,
      username: updated.username,
      role: updated.role,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

app.post('/api/profile/change-password', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const { currentPassword, newPassword } = req.body;
    
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(schema.users).set({ passwordHash: newHash }).where(eq(schema.users.id, user.id));
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Staff management routes
app.get('/api/staff', isAdmin, async (req, res) => {
  try {
    const staff = await db.select().from(schema.users).where(eq(schema.users.role, 'staff'));
    const safeStaff = staff.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
    }));
    res.json(safeStaff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Failed to fetch staff' });
  }
});

app.post('/api/staff', isAdmin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(schema.users).values({
      username,
      passwordHash,
      role: 'staff',
    }).returning();
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ message: 'Failed to create staff' });
  }
});

app.delete('/api/staff/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.users).where(eq(schema.users.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ message: 'Failed to delete staff' });
  }
});

app.post('/api/staff/:id/reset-password', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, id));
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Analytics routes
app.get('/api/analytics/usage', isAuthenticated, async (req, res) => {
  try {
    const bookings = await db.select().from(schema.bookings);
    const deviceConfigs = await db.select().from(schema.deviceConfigs);
    
    const activeBookings = bookings.filter(b => b.status === 'running' || b.status === 'paused');
    let totalCapacity = 0;
    deviceConfigs.forEach(c => {
      const seats = JSON.parse(c.seats || '[]');
      totalCapacity += seats.length || c.count;
    });
    
    const categoryUsage = deviceConfigs.map(c => {
      const seats = JSON.parse(c.seats || '[]');
      const total = seats.length || c.count;
      const occupied = activeBookings.filter(b => b.category === c.category).length;
      return {
        category: c.category,
        occupied,
        total,
        percentage: total > 0 ? Math.round((occupied / total) * 100) : 0,
      };
    });
    
    res.json({
      currentOccupancy: activeBookings.length,
      totalCapacity,
      occupancyRate: totalCapacity > 0 ? Math.round((activeBookings.length / totalCapacity) * 100) : 0,
      activeBookings: activeBookings.length,
      categoryUsage,
      hourlyUsage: [],
      realtimeData: [],
      uniqueCustomers: new Set(bookings.map(b => b.customerName)).size,
      avgSessionDuration: 60,
      totalFoodOrders: 0,
      foodRevenue: 0,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Reports routes
app.get('/api/reports/stats', isAuthenticated, async (req, res) => {
  try {
    const history = await db.select().from(schema.bookingHistory);
    
    let totalRevenue = 0;
    let totalFoodRevenue = 0;
    let cashRevenue = 0;
    let upiRevenue = 0;
    let totalMinutes = 0;
    
    history.forEach(b => {
      const price = parseFloat(b.price) || 0;
      totalRevenue += price;
      
      const foodOrders = JSON.parse(b.foodOrders || '[]');
      foodOrders.forEach((order: any) => {
        totalFoodRevenue += (parseFloat(order.price) || 0) * (order.quantity || 1);
      });
      
      if (b.paymentMethod === 'cash') cashRevenue += price;
      if (b.paymentMethod === 'upi') upiRevenue += price;
      
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      totalMinutes += (end.getTime() - start.getTime()) / 60000;
    });
    
    res.json({
      totalRevenue,
      totalFoodRevenue,
      totalSessions: history.length,
      avgSessionMinutes: history.length > 0 ? Math.round(totalMinutes / history.length) : 0,
      cashRevenue,
      upiRevenue,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// Stock batches routes
app.get('/api/stock-batches', isAuthenticated, async (req, res) => {
  try {
    const batches = await db.select().from(schema.stockBatches);
    res.json(batches);
  } catch (error) {
    console.error('Error fetching stock batches:', error);
    res.status(500).json({ message: 'Failed to fetch stock batches' });
  }
});

app.post('/api/stock-batches', isAuthenticated, async (req, res) => {
  try {
    const [batch] = await db.insert(schema.stockBatches).values(req.body).returning();
    res.json(batch);
  } catch (error) {
    console.error('Error creating stock batch:', error);
    res.status(500).json({ message: 'Failed to create stock batch' });
  }
});

// Gaming center info routes
app.get('/api/gaming-center-info', async (req, res) => {
  try {
    const [info] = await db.select().from(schema.gamingCenterInfo);
    res.json(info || {
      name: 'Gaming Center',
      description: 'Your local gaming destination',
      address: '',
      phone: '',
      email: '',
      hours: '10:00 AM - 10:00 PM',
      timezone: 'Asia/Kolkata',
    });
  } catch (error) {
    console.error('Error fetching gaming center info:', error);
    res.status(500).json({ message: 'Failed to fetch gaming center info' });
  }
});

app.patch('/api/gaming-center-info', isAdmin, async (req, res) => {
  try {
    const [existing] = await db.select().from(schema.gamingCenterInfo);
    if (existing) {
      const [info] = await db.update(schema.gamingCenterInfo).set(req.body).where(eq(schema.gamingCenterInfo.id, existing.id)).returning();
      res.json(info);
    } else {
      const [info] = await db.insert(schema.gamingCenterInfo).values(req.body).returning();
      res.json(info);
    }
  } catch (error) {
    console.error('Error updating gaming center info:', error);
    res.status(500).json({ message: 'Failed to update gaming center info' });
  }
});

// Payment logs routes
app.get('/api/payment-logs', isAuthenticated, async (req, res) => {
  try {
    const logs = await db.select().from(schema.paymentLogs);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching payment logs:', error);
    res.status(500).json({ message: 'Failed to fetch payment logs' });
  }
});

app.post('/api/payment-logs', isAuthenticated, async (req, res) => {
  try {
    const [log] = await db.insert(schema.paymentLogs).values(req.body).returning();
    res.json(log);
  } catch (error) {
    console.error('Error creating payment log:', error);
    res.status(500).json({ message: 'Failed to create payment log' });
  }
});

// Delete expense route
app.delete('/api/expenses/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.expenses).where(eq(schema.expenses.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const [notification] = await db.update(schema.notifications).set({ isRead: 1 }).where(eq(schema.notifications.id, id)).returning();
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// AI Traffic predictions (simplified for offline)
app.get('/api/ai/traffic/predictions', isAuthenticated, async (req, res) => {
  try {
    res.json({
      predictions: [],
      summary: {
        peakHour: '18:00',
        peakVisitors: 20,
        totalPredictedVisitors: 100,
        averageVisitors: 10,
        insights: ['Based on historical data'],
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ message: 'Failed to fetch predictions' });
  }
});

app.get('/api/users', isAdmin, async (req, res) => {
  try {
    const allUsers = await db.select().from(schema.users);
    const safeUsers = allUsers.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      onboardingCompleted: u.onboardingCompleted === 1,
      profileImageUrl: u.profileImageUrl,
      createdAt: u.createdAt,
    }));
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.post('/api/users', isAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(schema.users).values({
      username,
      passwordHash,
      role: role || 'staff',
    }).returning();
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted === 1,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

app.delete('/api/users/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.users).where(eq(schema.users.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

app.get('/api/expenses', isAuthenticated, async (req, res) => {
  try {
    const allExpenses = await db.select().from(schema.expenses);
    res.json(allExpenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', isAuthenticated, async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      date: new Date(req.body.date),
    };
    const [expense] = await db.insert(schema.expenses).values(expenseData).returning();
    res.json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Failed to create expense' });
  }
});

app.get('/api/notifications', isAuthenticated, async (req, res) => {
  try {
    const allNotifications = await db.select().from(schema.notifications);
    res.json(allNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

app.get('/api/staff-visibility', isAuthenticated, async (req, res) => {
  try {
    const [settings] = await db.select().from(schema.staffVisibilitySettings);
    if (settings) {
      res.json({
        ...settings,
        pages: JSON.parse(settings.pages),
        elements: JSON.parse(settings.elements),
      });
    } else {
      res.json({
        pages: {
          dashboard: true,
          bookings: true,
          history: true,
          food: true,
          inventory: false,
          expenses: false,
          ledger: false,
          analytics: false,
          maintenance: false,
          settings: false,
        },
        elements: {
          customerPhone: true,
          paymentDetails: true,
          revenueNumbers: false,
          expenseAmounts: false,
          profitLoss: false,
          costPrices: false,
        },
      });
    }
  } catch (error) {
    console.error('Error fetching staff visibility:', error);
    res.status(500).json({ message: 'Failed to fetch staff visibility settings' });
  }
});

async function initializeDefaultData() {
  try {
    const existingDevices = await db.select().from(schema.deviceConfigs);
    const existingUsers = await db.select().from(schema.users);

    if (existingDevices.length === 0) {
      await db.insert(schema.deviceConfigs).values([
        { category: "PC", count: 5, seats: JSON.stringify(["PC-1", "PC-2", "PC-3", "PC-4", "PC-5"]) },
        { category: "PS5", count: 3, seats: JSON.stringify(["PS5-1", "PS5-2", "PS5-3"]) }
      ]);

      await db.insert(schema.pricingConfigs).values([
        { category: "PC", duration: "30 mins", price: "10" },
        { category: "PC", duration: "1 hour", price: "18" },
        { category: "PC", duration: "2 hours", price: "30" },
        { category: "PS5", duration: "30 mins", price: "15" },
        { category: "PS5", duration: "1 hour", price: "25" },
        { category: "PS5", duration: "2 hours", price: "45" }
      ]);

      await db.insert(schema.foodItems).values([
        { name: "Pizza", price: "8" },
        { name: "Burger", price: "6" },
        { name: "Fries", price: "3" },
        { name: "Soda", price: "2" },
        { name: "Water", price: "1" },
      ]);

      console.log('Default data initialized');
    }

    if (existingUsers.length === 0) {
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      await db.insert(schema.users).values({
        username: 'admin',
        passwordHash: adminPasswordHash,
        role: 'admin',
      });
      console.log('Default admin user created (username: admin, password: admin123)');
      console.log('IMPORTANT: Please change the admin password after first login!');
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}

function getDistPath(): string {
  const appPath = process.env.APP_PATH;
  console.log('APP_PATH:', appPath);
  
  if (appPath) {
    const distFromApp = path.join(appPath, 'dist-electron', 'dist');
    try {
      if (fs.existsSync(path.join(distFromApp, 'index.html'))) {
        console.log('Found dist at:', distFromApp);
        return distFromApp;
      }
    } catch (e) {}
    
    const distFromAppAlt = path.join(appPath, 'dist');
    try {
      if (fs.existsSync(path.join(distFromAppAlt, 'index.html'))) {
        console.log('Found dist at:', distFromAppAlt);
        return distFromAppAlt;
      }
    } catch (e) {}
  }
  
  const devPaths = [
    path.join(__dirname, '../dist'),
    path.join(__dirname, '../../dist'),
    path.join(__dirname, '../../dist-electron/dist'),
  ];
  for (const p of devPaths) {
    try { if (fs.existsSync(path.join(p, 'index.html'))) return p; } catch (e) {}
  }
  
  return appPath ? path.join(appPath, 'dist-electron', 'dist') : path.join(__dirname, '../dist');
}

const distPath = getDistPath();
console.log('Using dist path:', distPath);

app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend not found. Please ensure the app is built correctly.');
    }
  }
});

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'An internal error occurred'
  });
});

const PORT = parseInt(process.env.PORT || '5000', 10);

initializeDefaultData().then(() => {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Airavoto Gaming POS server running on http://127.0.0.1:${PORT}`);
    console.log('Mode: Offline (SQLite database)');
  });
});

export { app };
