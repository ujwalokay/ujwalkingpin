# Security Documentation

This application implements enterprise-grade security measures following industry best practices and OWASP guidelines.

## 🔐 Security Features Implemented

### 1. **Authentication & Session Management**

#### Password Security
- Bcrypt hashing with 10 salt rounds
- Passwords never stored in plaintext
- Generic error messages prevent username enumeration
- Session regeneration on login prevents session fixation

#### Session Security
- PostgreSQL-backed sessions with connect-pg-simple
- **HttpOnly** cookies prevent XSS theft
- **SameSite: lax** for CSRF protection (required for OAuth flows)
- **Secure** flag enforces HTTPS in production
- 7-day session lifetime with automatic cleanup
- Session regeneration on authentication prevents fixation

#### Two-Step Authentication (Optional)
- Google OAuth integration
- Staff/Admin username+password required
- IP address tracking in activity logs

#### Role-Based Access Control
- `requireAuth`: Any authenticated user
- `requireAdminOrStaff`: Staff and admin roles
- `requireAdmin`: Admin-only operations

### 2. **Advanced Rate Limiting**

#### Login Protection
- **5 attempts per 15 minutes** per IP
- Prevents brute-force attacks
- Automatic cooldown period

#### Sensitive Operations
- **20 requests per minute** per IP
- Applied to payment and credit endpoints
- Protects financial transactions

#### Webhook Protection
- **30 requests per minute** per IP
- Prevents webhook abuse

#### Public API
- **60 requests per minute** per IP
- General API protection

#### Data Export
- **10 exports per 5 minutes**
- Prevents data scraping

### 3. **HTTP Security Headers (Helmet.js)**

#### Content Security Policy (CSP)
**Note:** CSP is disabled in development for Vite HMR compatibility. In production:
```javascript
defaultSrc: ["'self'"]
scriptSrc: ["'self'"]  // No unsafe-inline or unsafe-eval
styleSrc: ["'self'", "fonts.googleapis.com"]
fontSrc: ["'self'", "fonts.gstatic.com", "data:"]
imgSrc: ["'self'", "data:", "https:", "blob:"]
connectSrc: ["'self'"]  // May need adjustment for external APIs
frameSrc: ["'none'"]
objectSrc: ["'none'"]
upgradeInsecureRequests: enabled
```
**Important:** If your app makes API calls to external services, you'll need to whitelist those domains in `connectSrc`.

#### HTTP Strict Transport Security (HSTS)
- **Max-Age**: 1 year (31536000 seconds)
- **includeSubDomains**: true
- **preload**: true

#### Additional Protection
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: enabled
- **Referrer-Policy**: strict-origin-when-cross-origin
- **X-Powered-By**: removed (reduces fingerprinting)

### 4. **Input Validation & Protection**

#### Request Size Limits
- **JSON payload**: 1MB maximum
- **URL-encoded**: 1MB maximum
- Prevents DOS attacks via payload bombs

#### Schema Validation
- Zod schema validation on all API endpoints
- Type-safe input validation with Drizzle ORM
- Parameterized queries prevent SQL injection
- Comprehensive error messages in development only

### 5. **HTTPS Enforcement**

- **Automatic HTTPS redirect** for GET/HEAD requests in production
- Checks both `x-forwarded-proto` header and `req.protocol`
- **301 permanent redirect** to HTTPS for page loads
- Skips API endpoints to avoid issues with POST data
- Compatible with reverse proxies (Nginx, load balancers)

### 6. **Activity Logging**

#### Built-in Activity Log System
The application includes a comprehensive activity log system that tracks:
- User logins (with IP address logged in login handler)
- Administrative actions via createActivityLog
- Database changes through storage layer
- Payment and booking modifications
- Configuration updates

All activity logs are stored in the database and can be reviewed by administrators through the activity log page.

## 🚀 Setting Up Admin Credentials

### Initial Setup

**IMPORTANT:** You must set admin credentials via environment variables to create the initial admin user.

1. **Create a `.env` file in your project root:**

```env
# Admin credentials (REQUIRED for first-time setup)
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password

# Session secret (REQUIRED for production)
SESSION_SECRET=your_random_session_secret_at_least_32_characters

# Database (already configured by Replit)
DATABASE_URL=your_database_url
```

2. **Password Requirements:**
- Minimum 8 characters (enforced with warning)
- Use a strong, unique password
- Do NOT use common passwords like "admin123"

3. **Generate a Strong Session Secret:**
```bash
# Run this in the Shell to generate a random secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Creating Admin User

The application will automatically create an admin user on first startup **ONLY IF**:
- No users exist in the database
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables are set

Check the console logs for confirmation:
- ✅ Success: "Admin user created with username: your_username"
- ⚠️ Warning: "No admin user exists and ADMIN_USERNAME/ADMIN_PASSWORD are not set!"

## 🔒 Security Best Practices

### For Development
1. Always use unique passwords (never reuse)
2. Set `SESSION_SECRET` environment variable
3. Review security warnings in console logs

### For Production
1. **MUST** set strong `SESSION_SECRET` (32+ random characters)
2. **MUST** use HTTPS (secure cookies enabled automatically)
3. **MUST** use strong admin password (12+ characters, mixed case, numbers, symbols)
4. Consider IP whitelisting for admin panel
5. Regularly update dependencies for security patches
6. Monitor failed login attempts
7. Enable database backups

## 📝 Default Credentials - REMOVED

**Previous versions had default credentials (admin/admin123) - these have been REMOVED for security.**

You MUST now set credentials via environment variables. The app will not create an admin user without them.

## 🔍 Testing Authentication

1. **Test login with correct credentials:**
   - Enter username and password set in `.env`
   - Should redirect to dashboard on success

2. **Test login with wrong credentials:**
   - Enter incorrect password
   - Should show "Invalid username or password" error

3. **Test rate limiting:**
   - Try logging in with wrong password 5+ times
   - Should show "Too many login attempts" message

4. **Test session persistence:**
   - Log in successfully
   - Refresh the page
   - Should remain logged in (session valid)

5. **Test logout:**
   - Click lock icon in header
   - Should return to login screen
   - Session should be destroyed

## 🛡️ Additional Security Recommendations

1. **Add Two-Factor Authentication (2FA)** - For enhanced security
2. **Add password reset functionality** - Via email verification
3. **Implement account lockout** - After multiple failed attempts
4. **Add audit logging** - Track all admin actions
5. **Add IP-based access control** - Restrict admin panel to specific IPs
6. **Implement HTTPS** - Always use SSL/TLS in production

## 🐛 Troubleshooting

### Cannot Login
- Check that `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set in `.env`
- Verify the admin user was created (check console logs)
- Try resetting the session: clear browser cookies
- Check for rate limiting (wait 15 minutes if blocked)

### 401 Unauthorized Errors
- Session may have expired (24-hour lifetime)
- Log in again to create new session
- Check that authentication middleware is configured correctly

### Admin User Not Created
- Verify `.env` file exists and has correct variables
- Check console for warning messages
- Ensure database is accessible
- Try restarting the application

## 📚 API Endpoints

### Authentication Endpoints (Public)
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout and destroy session
- `GET /api/auth/me` - Get current user (requires auth)

### Protected Endpoints (Require Authentication)
All other `/api/*` endpoints require valid authentication session.

## 🔄 Updating This Document

As you add more security features, update this document to reflect the changes and keep your team informed of security practices.
