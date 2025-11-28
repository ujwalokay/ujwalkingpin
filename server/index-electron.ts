import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
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

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'));
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
