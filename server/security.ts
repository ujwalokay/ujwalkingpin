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

export const SecurityConfig = {
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
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
    minLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false,
    saltRounds: 10,
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

export default SecurityConfig;
