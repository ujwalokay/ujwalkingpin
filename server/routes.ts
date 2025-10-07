import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertDeviceConfigSchema, insertPricingConfigSchema, insertFoodItemSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/bookings/available-seats", async (req, res) => {
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

  app.get("/api/bookings/active", async (req, res) => {
    try {
      const bookings = await storage.getActiveBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bookings", async (req, res) => {
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

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await storage.updateBooking(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteBooking(id);
      if (!deleted) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/bookings/archive", async (req, res) => {
    try {
      const count = await storage.moveBookingsToHistory();
      res.json({ success: true, count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/booking-history", async (req, res) => {
    try {
      const history = await storage.getAllBookingHistory();
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/reports/stats", async (req, res) => {
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

  app.get("/api/reports/history", async (req, res) => {
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

  app.get("/api/device-config", async (req, res) => {
    try {
      const configs = await storage.getAllDeviceConfigs();
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/device-config", async (req, res) => {
    try {
      const config = insertDeviceConfigSchema.parse(req.body);
      const saved = await storage.upsertDeviceConfig(config);
      res.json(saved);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/pricing-config", async (req, res) => {
    try {
      const configs = await storage.getAllPricingConfigs();
      res.json(configs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/pricing-config", async (req, res) => {
    try {
      const { category, configs } = req.body;
      if (!category || !Array.isArray(configs)) {
        return res.status(400).json({ message: "Invalid request format" });
      }
      
      const validatedConfigs = configs.map(c => insertPricingConfigSchema.parse({ ...c, category }));
      const saved = await storage.upsertPricingConfigs(category, validatedConfigs);
      res.json(saved);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/device-config/:category", async (req, res) => {
    try {
      const { category } = req.params;
      await storage.deleteDeviceConfig(category);
      res.json({ success: true, message: `Deleted device config for ${category}` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/pricing-config/:category", async (req, res) => {
    try {
      const { category } = req.params;
      await storage.deletePricingConfig(category);
      res.json({ success: true, message: `Deleted pricing config for ${category}` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/food-items", async (req, res) => {
    try {
      const items = await storage.getAllFoodItems();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/food-items", async (req, res) => {
    try {
      const item = insertFoodItemSchema.parse(req.body);
      const created = await storage.createFoodItem(item);
      res.json(created);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/food-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const item = insertFoodItemSchema.parse(req.body);
      const updated = await storage.updateFoodItem(id, item);
      if (!updated) {
        return res.status(404).json({ message: "Food item not found" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/food-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFoodItem(id);
      if (!deleted) {
        return res.status(404).json({ message: "Food item not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
