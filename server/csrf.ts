import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Modern CSRF protection using signed double-submit cookie pattern
// This is better suited for SPAs than the deprecated csurf package

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.SESSION_SECRET || 'csrf-secret-change-in-production';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';

if (!process.env.CSRF_SECRET && !process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CSRF_SECRET or SESSION_SECRET environment variable is required in production');
  }
  console.warn('⚠️  WARNING: CSRF_SECRET not set - using insecure default');
}

// Generate a random CSRF token
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

// Sign a token with HMAC
function signToken(token: string): string {
  const hmac = crypto.createHmac('sha256', CSRF_SECRET);
  hmac.update(token);
  return hmac.digest('hex');
}

// Verify a signed token
function verifyToken(token: string, signature: string): boolean {
  const expectedSignature = signToken(token);
  // Use constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

// Middleware to attach CSRF token to response
export function csrfProtectionInit(req: Request, res: Response, next: NextFunction) {
  // Generate new token if it doesn't exist or is invalid
  let token = req.cookies?.[CSRF_COOKIE_NAME];
  
  if (!token) {
    token = generateCsrfToken();
    const signature = signToken(token);
    const signedToken = `${token}.${signature}`;
    
    // Set cookie with token
    res.cookie(CSRF_COOKIE_NAME, signedToken, {
      httpOnly: false, // Must be accessible to JavaScript for SPA
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    });
  }
  
  next();
}

// Middleware to verify CSRF token on state-changing requests
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF check for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF check for unauthenticated requests (no session)
  if (!req.session?.userId) {
    return next();
  }
  
  // Get token from cookie
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  if (!cookieToken) {
    return res.status(403).json({ 
      message: 'CSRF token missing from cookie',
      code: 'CSRF_COOKIE_MISSING'
    });
  }
  
  // Parse signed token
  const [token, signature] = cookieToken.split('.');
  if (!token || !signature) {
    return res.status(403).json({ 
      message: 'Invalid CSRF token format',
      code: 'CSRF_INVALID_FORMAT'
    });
  }
  
  // Verify signature
  if (!verifyToken(token, signature)) {
    return res.status(403).json({ 
      message: 'CSRF token signature verification failed',
      code: 'CSRF_SIGNATURE_INVALID'
    });
  }
  
  // Get token from header or body
  const headerToken = req.headers[CSRF_HEADER_NAME] as string || req.body?._csrf;
  
  if (!headerToken) {
    return res.status(403).json({ 
      message: 'CSRF token missing from request',
      code: 'CSRF_TOKEN_MISSING'
    });
  }
  
  // Verify header token matches cookie token (double-submit pattern)
  try {
    if (!crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(headerToken, 'hex')
    )) {
      return res.status(403).json({ 
        message: 'CSRF token mismatch',
        code: 'CSRF_TOKEN_MISMATCH'
      });
    }
  } catch {
    return res.status(403).json({ 
      message: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }
  
  next();
}

// Endpoint to get CSRF token (for SPAs)
export function getCsrfToken(req: Request, res: Response) {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  
  if (cookieToken) {
    const [token] = cookieToken.split('.');
    if (token) {
      return res.json({ csrfToken: token });
    }
  }
  
  // Generate new token
  const token = generateCsrfToken();
  const signature = signToken(token);
  const signedToken = `${token}.${signature}`;
  
  res.cookie(CSRF_COOKIE_NAME, signedToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  
  res.json({ csrfToken: token });
}
