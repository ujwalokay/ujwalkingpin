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

// Rate limiter for webhook endpoints
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: "Too many webhook requests, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for public API endpoints
export const publicApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for sensitive operations (payment, credit, etc.)
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per minute for sensitive operations
  message: "Too many requests for this operation, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for data export/reports
export const dataExportLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit to 10 exports per 5 minutes
  message: "Too many export requests, please wait before trying again.",
  standardHeaders: true,
  legacyHeaders: false,
});

export async function loginHandler(req: Request, res: Response) {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    const user = await storage.validatePassword(username, password);
    
    if (!user) {
      // Generic error message to prevent username enumeration
      return res.status(401).json({ 
        message: "Invalid credentials" 
      });
    }
    
    // Regenerate session to prevent session fixation attacks
    const oldSessionData = {
      googleVerified: req.session.googleVerified,
      googleUserId: req.session.googleUserId,
      googleEmail: req.session.googleEmail
    };
    
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ message: "Login failed. Please try again." });
      }
      
      // Restore Google OAuth data if it existed
      req.session.googleVerified = oldSessionData.googleVerified;
      req.session.googleUserId = oldSessionData.googleUserId;
      req.session.googleEmail = oldSessionData.googleEmail;
      
      // Set new session data
      req.session.userId = user.id;
      req.session.username = user.username!;
      req.session.role = user.role!;
      
      // Log login activity
      const loginMethod = req.session.googleVerified 
        ? `two-step auth (Google: ${req.session.googleEmail})` 
        : 'direct login';
      
      storage.createActivityLog({
        userId: user.id,
        username: user.username!,
        userRole: user.role!,
        action: 'login',
        entityType: null,
        entityId: null,
        details: `${user.role} logged in via ${loginMethod} from IP ${req.ip}`
      }).catch(err => console.error('Activity log error:', err));
      
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        googleEmail: req.session.googleEmail,
      });
    });
  } catch (error: any) {
    // Don't expose internal error details
    console.error('Login error:', error);
    res.status(400).json({ message: "Invalid request" });
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
  // Check if user is authenticated via staff/admin login
  if (req.session.userId) {
    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        googleEmail: req.session.googleEmail,
        onboardingCompleted: user.onboardingCompleted === 1,
        twoStepComplete: true,
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
  
  // Check if Google authentication is verified but no staff login yet
  if (req.session.googleVerified) {
    return res.status(200).json({
      googleVerified: true,
      googleEmail: req.session.googleEmail,
      needsStaffLogin: true,
    });
  }
  
  // Not authenticated at all
  return res.status(401).json({ message: "Not authenticated" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Require staff/admin login (Google OAuth is optional)
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
  // Staff/Admin username/password authentication routes
  app.post("/api/auth/login", loginLimiter, loginHandler);
  app.post("/api/auth/logout", logoutHandler);
  app.get("/api/auth/me", getCurrentUserHandler);
  
  app.post("/api/auth/complete-onboarding", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      await storage.updateUserOnboarding(req.session.userId, true);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
}

// Extend Express session types
declare module "express-session" {
  interface SessionData {
    userId: string;
    username: string;
    role: string;
    googleVerified: boolean;
    googleUserId: string;
    googleEmail: string;
  }
}
