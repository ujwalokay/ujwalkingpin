# Security Implementation

This application has been secured with industry-standard authentication and security measures.

## 🔐 Security Features Implemented

### 1. **Backend Authentication with Password Hashing**
- User passwords are hashed using bcrypt (10 salt rounds)
- Passwords are never stored in plain text
- Password validation is done securely on the server

### 2. **Session Management**
- Secure session-based authentication using express-session
- HttpOnly cookies to prevent XSS attacks
- SameSite: 'lax' to prevent CSRF attacks
- Secure flag enabled in production (HTTPS only)
- 24-hour session lifetime

### 3. **Protected API Routes**
- All API endpoints require authentication
- Unauthorized requests receive 401 responses
- Session validation on every request

### 4. **Rate Limiting**
- Login endpoint limited to 5 attempts per 15 minutes per IP
- Prevents brute force attacks
- Returns clear error messages when limit exceeded

### 5. **Security Headers**
- Helmet.js configured for security headers
- XSS protection enabled
- Clickjacking protection enabled
- Content Security Policy (disabled in development for Vite HMR)

### 6. **Frontend Security**
- No credentials stored in localStorage
- Session-based authentication only
- Automatic logout on session expiry
- Loading states to prevent double submissions

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
