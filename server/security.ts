import { storage } from "./storage";
import type { Request, Response, NextFunction } from "express";

export interface SecurityEvent {
  userId?: string;
  username?: string;
  action: string;
  resource: string;
  ip?: string;
  userAgent?: string;
  success: boolean;
  details?: string;
}

export async function logSecurityEvent(event: SecurityEvent) {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${event.action} on ${event.resource} by ${event.username || 'anonymous'} from IP ${event.ip} - ${event.success ? 'SUCCESS' : 'FAILED'}${event.details ? ` - ${event.details}` : ''}`);
  
  if (event.userId && event.username) {
    try {
      await storage.createActivityLog({
        userId: event.userId,
        username: event.username,
        userRole: 'staff',
        action: event.action,
        entityType: event.resource,
        entityId: null,
        details: `${event.action} on ${event.resource} from IP ${event.ip} - ${event.success ? 'SUCCESS' : 'FAILED'}${event.details ? ` - ${event.details}` : ''}`
      });
    } catch (error) {
      console.error('Failed to log security event to database:', error);
    }
  }
}

export function securityAuditMiddleware(action: string, resource: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    let responseSent = false;

    res.json = function (body: any) {
      if (!responseSent) {
        responseSent = true;
        const success = res.statusCode >= 200 && res.statusCode < 300;
        
        logSecurityEvent({
          userId: req.session?.userId,
          username: req.session?.username || 'anonymous',
          action,
          resource,
          ip: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
          success,
          details: success ? undefined : body.message
        }).catch(err => console.error('Security audit error:', err));
      }
      return originalJson(body);
    };

    next();
  };
}

// Validate SESSION_SECRET at module load time
if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }
  console.warn('⚠️  WARNING: SESSION_SECRET not set - using insecure default. Set SESSION_SECRET for production!');
}

export const SecurityConfig = {
  session: {
    secret: process.env.SESSION_SECRET || 'insecure-dev-secret-change-in-production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
  },
  
  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    webhook: {
      windowMs: 1 * 60 * 1000,
      max: 30,
    },
    publicApi: {
      windowMs: 1 * 60 * 1000,
      max: 60,
    },
    sensitiveOps: {
      windowMs: 1 * 60 * 1000,
      max: 20,
    },
    dataExport: {
      windowMs: 5 * 60 * 1000,
      max: 10,
    },
  },
  
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    saltRounds: 12,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
  },
  
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5000'],
    credentials: true,
  },
  
  security: {
    enforceHttps: process.env.NODE_ENV === 'production',
    requestSizeLimit: '1mb',
    sessionRegenerationOnLogin: true,
    logFailedAttempts: true,
  },
};

// Password validation function
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = SecurityConfig.password;
  
  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }
  
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Input sanitization to prevent XSS
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize SQL-like inputs (additional layer on top of parameterized queries)
export function sanitizeSQLInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove common SQL injection patterns
  return input
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '')
    .replace(/sp_/gi, '')
    .trim();
}

export default SecurityConfig;
