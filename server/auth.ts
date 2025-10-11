import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { loginSchema } from "@shared/schema";
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export async function loginHandler(req: Request, res: Response) {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    const user = await storage.validatePassword(username, password);
    
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid username or password" 
      });
    }
    
    // Set user in session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    
    // Log login activity
    await storage.createActivityLog({
      userId: user.id,
      username: user.username,
      userRole: user.role,
      action: 'login',
      entityType: null,
      entityId: null,
      details: `${user.role} logged in`
    });
    
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
}

export async function getCurrentUserHandler(req: Request, res: Response) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  res.json({
    id: req.session.userId,
    username: req.session.username,
    role: req.session.role,
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.session.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function requireAdminOrStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.session.role !== "admin" && req.session.role !== "staff") {
    return res.status(403).json({ message: "Admin or staff access required" });
  }
  next();
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", loginLimiter, loginHandler);
  app.post("/api/auth/logout", logoutHandler);
  app.get("/api/auth/me", getCurrentUserHandler);
}

// Extend Express session types
declare module "express-session" {
  interface SessionData {
    userId: string;
    username: string;
    role: string;
  }
}
