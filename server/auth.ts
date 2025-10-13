import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { loginSchema, verifyOtpSchema } from "@shared/schema";
import rateLimit from "express-rate-limit";
import { generateOTP, sendOTPEmail } from "./email";

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

export async function loginHandler(req: Request, res: Response) {
  try {
    const { username, password } = loginSchema.parse(req.body);
    
    const user = await storage.validatePassword(username, password);
    
    if (!user) {
      return res.status(401).json({ 
        message: "Invalid username or password" 
      });
    }
    
    // Check if user is admin and has email configured for 2FA
    if (user.role === "admin" && user.email) {
      // Admin has email - use 2FA
      // Generate and send OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing OTPs for this user
      await storage.deleteOtpsByUserId(user.id);

      // Create new OTP
      await storage.createOtp({
        userId: user.id,
        code: otpCode,
        expiresAt,
      });

      // Send OTP email
      const emailSent = await sendOTPEmail(user.email, user.username, otpCode);

      if (!emailSent) {
        return res.status(500).json({
          message: "Failed to send OTP email. Please contact administrator."
        });
      }

      // Set pending verification in session
      req.session.pendingUserId = user.id;
      req.session.pendingUsername = user.username;
      req.session.pendingRole = user.role;
      req.session.otpVerified = false;

      return res.json({
        requiresOtp: true,
        userId: user.id,
        message: `OTP sent to ${user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`
      });
    }
    
    // Admin without email or staff user - login directly without 2FA
    if (user.role === "admin") {
      // Admin without email configured - allow login but warn in logs
      console.warn(`⚠️  Admin user "${user.username}" logged in without 2FA (no email configured)`);
    }
    
    // For non-admin users (staff), proceed with normal login
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.otpVerified = true; // Staff doesn't need OTP
    
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
      requiresOtp: false,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

export async function verifyOtpHandler(req: Request, res: Response) {
  try {
    const { userId, code } = verifyOtpSchema.parse(req.body);

    // Check if there's a pending verification for this user
    if (!req.session.pendingUserId || req.session.pendingUserId !== userId) {
      return res.status(400).json({
        message: "No pending verification found. Please log in again."
      });
    }

    // Verify OTP
    const isValid = await storage.verifyOtp(userId, code);

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid or expired OTP. Please try again or request a new code."
      });
    }

    // Delete the OTP after successful verification
    await storage.deleteOtpsByUserId(userId);

    // Complete the login by moving pending data to session
    req.session.userId = req.session.pendingUserId;
    req.session.username = req.session.pendingUsername!;
    req.session.role = req.session.pendingRole!;
    req.session.otpVerified = true;

    // Clear pending data
    delete req.session.pendingUserId;
    delete req.session.pendingUsername;
    delete req.session.pendingRole;

    // Log successful login
    await storage.createActivityLog({
      userId: req.session.userId,
      username: req.session.username,
      userRole: req.session.role,
      action: 'login',
      entityType: null,
      entityId: null,
      details: `${req.session.role} logged in with 2FA`
    });

    res.json({
      id: req.session.userId,
      username: req.session.username,
      role: req.session.role,
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
  // Check if admin user has completed OTP verification (only if they went through OTP flow)
  if (req.session.role === "admin" && req.session.otpVerified === false) {
    return res.status(401).json({ message: "OTP verification required" });
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
  app.post("/api/auth/verify-otp", loginLimiter, verifyOtpHandler);
  app.post("/api/auth/logout", logoutHandler);
  app.get("/api/auth/me", getCurrentUserHandler);
}

// Extend Express session types
declare module "express-session" {
  interface SessionData {
    userId: string;
    username: string;
    role: string;
    pendingUserId?: string;
    pendingUsername?: string;
    pendingRole?: string;
    otpVerified: boolean;
  }
}
