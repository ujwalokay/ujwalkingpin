import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, requireAdmin, requireAdminOrStaff } from "./auth";
import { 
  insertBookingSchema, 
  insertDeviceConfigSchema, 
  insertPricingConfigSchema, 
  insertFoodItemSchema, 
  insertExpenseSchema,
  insertGamingCenterInfoSchema,
  insertGalleryImageSchema,
  insertFacilitySchema,
  insertGameSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/bookings/available-seats", requireAuth, async (req, res) => {
    try {
      const { date, timeSlot, durationMinutes } = req.query;
      
      if (!date || !timeSlot || !durationMinutes) {
        return res.status(400).json({ message: "Missing required parameters: date, timeSlot, durationMinutes" });
      }

      const bookingDate = new Date(date as string);
      const [startTimeStr] = (timeSlot as string).split('-');
      const [startHour, startMin] = startTimeStr.split(':').map(Number);
      
      const requestStart = new Date(bookingDate);
      requestStart.setHours(startHour, startMin, 0, 0);
      const requestEnd = new Date(requestStart.getTime() + parseInt(durationMinutes as string) * 60 * 1000);

      const allBookings = await storage.getAllBookings();
      const deviceConfigs = await storage.getAllDeviceConfigs();
      
      const availableSeats = deviceConfigs.map(config => {
        const occupiedSeats = allBookings
          .filter(booking => {
            if (booking.category !== config.category) return false;
            
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            
            const hasOverlap = requestStart < bookingEnd && requestEnd > bookingStart;
            
            return hasOverlap && (booking.status === "running" || booking.status === "paused" || booking.status === "upcoming");
          })
          .map(b => b.seatNumber);

        const allSeatNumbers = config.seats.length > 0 
          ? config.seats.map(seatName => {
              const match = seatName.match(/\d+$/);
              return match ? parseInt(match[0]) : 0;
            }).filter(n => n > 0)
          : Array.from({ length: config.count }, (_, i) => i + 1);

        const availableSeats = allSeatNumbers.filter(n => !occupiedSeats.includes(n));

        return {
          category: config.category,
          seats: availableSeats,
        };
      });

      res.json(availableSeats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/bookings/active", requireAuth, async (req, res) => {
    try {
      const bookings = await storage.getActiveBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const booking = insertBookingSchema.parse(req.body);
      
      // Validate that the seat is not already booked for this time slot
      const allBookings = await storage.getAllBookings();
      const requestStart = new Date(booking.startTime);
      const requestEnd = new Date(booking.endTime);
      
      const hasConflict = allBookings.some(existingBooking => {
        if (existingBooking.category !== booking.category || existingBooking.seatNumber !== booking.seatNumber) {
          return false;
        }
        
        if (existingBooking.status !== "running" && existingBooking.status !== "paused" && existingBooking.status !== "upcoming") {
          return false;
        }
        
        const bookingStart = new Date(existingBooking.startTime);
        const bookingEnd = new Date(existingBooking.endTime);
        
        const hasOverlap = requestStart < bookingEnd && requestEnd > bookingStart;
        
        return hasOverlap;
      });
      
      if (hasConflict) {
        return res.status(409).json({ 
          message: `Seat ${booking.category}-${booking.seatNumber} is already booked for this time slot. Please select a different seat or time.` 
        });
      }
      
      const created = await storage.createBooking(booking);
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      console.log('PATCH /api/bookings/:id - Request body:', JSON.stringify(req.body, null, 2));
      const updated = await storage.updateBooking(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error('PATCH /api/bookings/:id - Error:', error.message, error.stack);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userRole = req.session.role;
      const userId = req.session.userId;
      const username = req.session.username;
      
      // Get the booking for logging
      const bookings = await storage.getAllBookings();
      const booking = bookings.find(b => b.id === id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Both admin and staff can delete any booking
      const deleted = await storage.deleteBooking(id);
      if (!deleted) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Log the deletion activity
      if (userId && username && userRole) {
        await storage.createActivityLog({
          userId,
          username,
          userRole,
          action: 'delete',
          entityType: 'booking',
          entityId: id,
          details: `Deleted ${booking.status} booking for ${booking.customerName} at ${booking.seatName}`
        });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/bookings/archive", requireAuth, async (req, res) => {
    try {
      const count = await storage.moveBookingsToHistory();
      res.json({ success: true, count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/booking-history", requireAuth, async (req, res) => {
    try {
      const history = await storage.getAllBookingHistory();
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/stats", requireAuth, async (req, res) => {
    try {
      const period = req.query.period as string || "daily";
      const now = new Date();
      let startDate: Date;
      let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      switch (period) {
        case "daily":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          break;
        case "weekly":
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "monthly":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      }

      const stats = await storage.getBookingStats(startDate, endDate);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/history", requireAuth, async (req, res) => {
    try {
      const period = req.query.period as string || "daily";
      const now = new Date();
      let startDate: Date;
      let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      switch (period) {
        case "daily":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          break;
        case "weekly":
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "monthly":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      }

      const history = await storage.getBookingHistory(startDate, endDate);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/device-config", requireAuth, async (req, res) => {
    try {
      const configs = await storage.getAllDeviceConfigs();
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/device-config", requireAdmin, async (req, res) => {
    try {
      const config = insertDeviceConfigSchema.parse(req.body);
      const saved = await storage.upsertDeviceConfig(config);
      
      // Log the admin activity
      if (req.session.userId && req.session.username && req.session.role) {
        await storage.createActivityLog({
          userId: req.session.userId,
          username: req.session.username,
          userRole: req.session.role,
          action: 'update',
          entityType: 'device-config',
          entityId: saved.id,
          details: `Updated device config for ${config.category} - ${config.count} seats`
        });
      }
      
      res.json(saved);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/pricing-config", requireAuth, async (req, res) => {
    try {
      const configs = await storage.getAllPricingConfigs();
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/pricing-config", requireAdmin, async (req, res) => {
    try {
      const { category, configs } = req.body;
      if (!category || !Array.isArray(configs)) {
        return res.status(400).json({ message: "Invalid request format" });
      }
      
      const validatedConfigs = configs.map(c => insertPricingConfigSchema.parse({ ...c, category }));
      const saved = await storage.upsertPricingConfigs(category, validatedConfigs);
      
      // Log the admin activity
      if (req.session.userId && req.session.username && req.session.role) {
        await storage.createActivityLog({
          userId: req.session.userId,
          username: req.session.username,
          userRole: req.session.role,
          action: 'update',
          entityType: 'pricing-config',
          entityId: category,
          details: `Updated pricing config for ${category} - ${configs.length} price tiers`
        });
      }
      
      res.json(saved);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/device-config/:category", requireAdmin, async (req, res) => {
    try {
      const { category } = req.params;
      await storage.deleteDeviceConfig(category);
      res.json({ success: true, message: `Deleted device config for ${category}` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/pricing-config/:category", requireAdmin, async (req, res) => {
    try {
      const { category } = req.params;
      await storage.deletePricingConfig(category);
      res.json({ success: true, message: `Deleted pricing config for ${category}` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/food-items", requireAuth, async (req, res) => {
    try {
      const items = await storage.getAllFoodItems();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/food-items", requireAuth, async (req, res) => {
    try {
      const item = insertFoodItemSchema.parse(req.body);
      const created = await storage.createFoodItem(item);
      
      // Log the admin activity
      if (req.session.userId && req.session.username && req.session.role) {
        await storage.createActivityLog({
          userId: req.session.userId,
          username: req.session.username,
          userRole: req.session.role,
          action: 'create',
          entityType: 'food-item',
          entityId: created.id,
          details: `Created food item: ${item.name} - ₹${item.price}`
        });
      }
      
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/food-items/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const item = insertFoodItemSchema.parse(req.body);
      const updated = await storage.updateFoodItem(id, item);
      if (!updated) {
        return res.status(404).json({ message: "Food item not found" });
      }
      
      // Log the admin activity
      if (req.session.userId && req.session.username && req.session.role) {
        await storage.createActivityLog({
          userId: req.session.userId,
          username: req.session.username,
          userRole: req.session.role,
          action: 'update',
          entityType: 'food-item',
          entityId: id,
          details: `Updated food item: ${item.name} - ₹${item.price}`
        });
      }
      
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/food-items/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const items = await storage.getAllFoodItems();
      const foodItem = items.find(f => f.id === id);
      
      const deleted = await storage.deleteFoodItem(id);
      if (!deleted) {
        return res.status(404).json({ message: "Food item not found" });
      }
      
      // Log the admin activity
      if (req.session.userId && req.session.username && req.session.role && foodItem) {
        await storage.createActivityLog({
          userId: req.session.userId,
          username: req.session.username,
          userRole: req.session.role,
          action: 'delete',
          entityType: 'food-item',
          entityId: id,
          details: `Deleted food item: ${foodItem.name}`
        });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/expenses", requireAuth, async (req, res) => {
    try {
      const expenses = await storage.getAllExpenses();
      res.json(expenses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const expense = insertExpenseSchema.parse(req.body);
      const created = await storage.createExpense(expense);
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const expense = insertExpenseSchema.parse(req.body);
      const updated = await storage.updateExpense(id, expense);
      if (!updated) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteExpense(id);
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Activity Logs Routes
  app.get("/api/activity-logs", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getAllActivityLogs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Public Status Route (No Auth Required)
  app.get("/api/public/status", async (req, res) => {
    try {
      const allBookings = await storage.getAllBookings();
      const deviceConfigs = await storage.getAllDeviceConfigs();
      
      const availability = deviceConfigs.map(config => {
        const activeBookings = allBookings.filter(booking => 
          booking.category === config.category && 
          (booking.status === "running" || booking.status === "paused")
        );
        
        const totalSeats = config.count;
        const occupiedSeats = activeBookings.length;
        const availableSeats = totalSeats - occupiedSeats;
        
        return {
          category: config.category,
          total: totalSeats,
          available: availableSeats,
          occupied: occupiedSeats
        };
      });
      
      res.json(availability);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // WhatsApp Bot Routes
  app.get("/api/whatsapp/availability", async (req, res) => {
    try {
      const allBookings = await storage.getAllBookings();
      const deviceConfigs = await storage.getAllDeviceConfigs();
      
      const now = new Date();
      
      const availability = deviceConfigs.map(config => {
        const activeBookings = allBookings.filter(booking => 
          booking.category === config.category && 
          (booking.status === "running" || booking.status === "paused")
        );
        
        const totalSeats = config.count;
        const occupiedSeats = activeBookings.length;
        const availableSeats = totalSeats - occupiedSeats;
        
        return {
          category: config.category,
          total: totalSeats,
          available: availableSeats,
          occupied: occupiedSeats
        };
      });
      
      res.json(availability);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      const { Body, From } = req.body;
      
      if (!Body || !From) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const message = Body.toLowerCase().trim();
      const phoneNumber = From.replace('whatsapp:', '');
      
      const keywords = ['available', 'availability', 'how many', 'pc', 'ps5', 'vr', 'free', 'check'];
      const isAvailabilityQuery = keywords.some(keyword => message.includes(keyword));
      
      if (isAvailabilityQuery) {
        const allBookings = await storage.getAllBookings();
        const deviceConfigs = await storage.getAllDeviceConfigs();
        
        const availability = deviceConfigs.map(config => {
          const activeBookings = allBookings.filter(booking => 
            booking.category === config.category && 
            (booking.status === "running" || booking.status === "paused")
          );
          
          const totalSeats = config.count;
          const occupiedSeats = activeBookings.length;
          const availableSeats = totalSeats - occupiedSeats;
          
          return {
            category: config.category,
            total: totalSeats,
            available: availableSeats,
            occupied: occupiedSeats
          };
        });
        
        let responseMessage = "📊 *Current Availability*\n\n";
        
        availability.forEach(item => {
          const percentage = item.total > 0 ? Math.round((item.available / item.total) * 100) : 0;
          const status = item.available > 0 ? '✅' : '❌';
          responseMessage += `${status} *${item.category}*: ${item.available}/${item.total} available (${percentage}%)\n`;
        });
        
        responseMessage += `\n_Updated: ${new Date().toLocaleString()}_`;
        
        const { sendWhatsAppMessage } = await import('./twilio');
        await sendWhatsAppMessage(phoneNumber, responseMessage);
        
        return res.status(200).json({ success: true, message: "Availability sent" });
      }
      
      return res.status(200).json({ success: true, message: "Message received but not an availability query" });
    } catch (error: any) {
      console.error('WhatsApp webhook error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/consumer/center-info", async (req, res) => {
    try {
      const info = await storage.getGamingCenterInfo();
      res.json(info || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/consumer/gallery", async (req, res) => {
    try {
      const images = await storage.getAllGalleryImages();
      res.json(images);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/consumer/facilities", async (req, res) => {
    try {
      const facilities = await storage.getAllFacilities();
      res.json(facilities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/consumer/games", async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/consumer/availability", async (req, res) => {
    try {
      const allBookings = await storage.getAllBookings();
      const deviceConfigs = await storage.getAllDeviceConfigs();
      
      const availability = deviceConfigs.map(config => {
        const activeBookings = allBookings.filter(booking => 
          booking.category === config.category && 
          (booking.status === "running" || booking.status === "paused")
        );
        
        const totalSeats = config.count;
        const occupiedSeats = activeBookings.length;
        const availableSeats = totalSeats - occupiedSeats;
        
        return {
          category: config.category,
          total: totalSeats,
          available: availableSeats,
          occupied: occupiedSeats,
          percentage: totalSeats > 0 ? Math.round((availableSeats / totalSeats) * 100) : 0
        };
      });
      
      res.json(availability);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/consumer/pricing", async (req, res) => {
    try {
      const pricing = await storage.getAllPricingConfigs();
      res.json(pricing);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
