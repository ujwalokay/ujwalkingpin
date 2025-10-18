# Render Deployment Guide for Ankylo Gaming

## ✅ No Replit Dependencies!

Your app now uses **standard Google OAuth** - completely independent of Replit:
- ✅ No Replit account required
- ✅ Use your own Google Cloud OAuth credentials
- ✅ Works on any platform (Render, Vercel, AWS, etc.)
- ✅ Email whitelist feature included
- ✅ Fixed database migration (uses `--force` flag)

---

## 🚀 Step-by-Step Deployment on Render

### **Step 1: Set Up Google OAuth Credentials**

**Before deploying**, you need to create Google OAuth credentials:

👉 **Follow the complete guide:** `GOOGLE_OAUTH_SETUP.md`

Quick summary:
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials (Web application)
5. Get your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

---

### **Step 2: Environment Variables on Render**

Go to your Render service → **Environment** tab and add these variables:

#### **Required Variables:**
```
DATABASE_URL=your-neon-postgres-connection-string
SESSION_SECRET=generate-a-random-32-character-string
NODE_ENV=production
GOOGLE_CLIENT_ID=your-google-client-id-from-step-1
GOOGLE_CLIENT_SECRET=your-google-client-secret-from-step-1
```

#### **Optional Variables:**
```
ALLOWED_EMAIL=youremail@gmail.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

---

### **Step 2: Get Your Neon Database URL**

1. Go to your **Neon dashboard**
2. Select your database
3. Click **"Connection String"**
4. Copy the full PostgreSQL connection string
5. It should look like:
   ```
   postgresql://username:password@hostname.neon.tech/database?sslmode=require
   ```

---

### **Step 3: Generate SESSION_SECRET**

Run this command locally to generate a secure secret:

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Or use any random 32+ character string.

---

### **Step 4: Deploy on Render**

1. **Connect your GitHub repo** to Render
2. **Select your repository** (ujwalokay/ujwalkingpin)
3. **Choose "Web Service"**
4. Configure:
   - **Name:** `ankylo-gaming` (or your choice)
   - **Branch:** `main`
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm run start`
   - **Instance Type:** Free tier is fine for testing
5. Add **environment variables** from Step 1
6. Click **"Create Web Service"**

---

### **Step 5: Enable Google Login on Render (Optional)**

If you want users to log in with Google on Render:

1. **Add these environment variables on Render:**
   ```
   REPLIT_DOMAINS=your-app-name.onrender.com
   REPL_ID=ankylo-gaming-render
   ISSUER_URL=https://replit.com/oidc
   ```
   Replace `your-app-name` with your actual Render domain.

2. **Register your Render domain with Replit:**
   - Go to https://replit.com (log in to your Replit account)
   - Click your profile → **Account Settings**
   - Navigate to **OAuth Applications** (or similar section)
   - Add your Render domain as an authorized redirect URI:
     ```
     https://your-app-name.onrender.com/api/callback
     ```

3. **Test Google Login:**
   - Visit your Render URL
   - Click "Continue with Google"
   - You should be redirected to Google for authentication
   - After authenticating, you'll be redirected back to your app

**Troubleshooting Google Login:**
- If you see "redirect_uri_mismatch" error, make sure your Render domain is registered in Replit OAuth settings
- Make sure `REPLIT_DOMAINS` matches your exact Render domain
- Check that `ISSUER_URL` is set to `https://replit.com/oidc`

---

### **Step 6: Create Admin User**

After deployment, you need to create an admin user to log in:

**Option 1: Using Neon SQL Editor**
```sql
INSERT INTO users (email, username, password_hash, role, onboarding_completed)
VALUES (
  'admin@example.com',
  'admin',
  '$2b$10$YourHashedPasswordHere',
  'admin',
  1
);
```

**Option 2: Set Environment Variables (Easier)**
Add these to Render environment variables:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

The app will automatically create an admin user on startup.

---

### **Step 7: Access Your App**

1. Wait for deployment to complete (check Render logs)
2. Open your Render URL: `https://your-app-name.onrender.com`
3. You should see the login page with:
   - **"Continue with Google"** button (if you set up Google login)
   - **"Staff/Admin Login"** link for username/password login
4. Log in with either:
   - **Google:** Click "Continue with Google"
   - **Staff/Admin:** Click staff login link, then use:
     - Username: admin (or what you set)
     - Password: (what you set in ADMIN_PASSWORD)

---

## 🔧 Troubleshooting

### **Issue: "REPLIT_DOMAINS not provided" error**
✅ **Fixed!** The app now detects non-Replit environments automatically.

### **Issue: Database migration stuck**
✅ **Fixed!** Now uses `--force` flag to skip prompts.

### **Issue: "No admin user exists" warning**
**Solution:** Add `ADMIN_USERNAME` and `ADMIN_PASSWORD` to your Render environment variables.

### **Issue: Google login not working on Render**
**Solution:** Make sure you:
1. Set `REPLIT_DOMAINS` to your Render domain
2. Set `REPL_ID` to your app name
3. Set `ISSUER_URL` to `https://replit.com/oidc`
4. Registered your Render callback URL in Replit OAuth settings

### **Issue: "Access Denied" when logging in**
If you set `ALLOWED_EMAIL`, make sure you're logging in with that exact email address.

---

## 📋 Complete Environment Variable List

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | Neon PostgreSQL connection string |
| `SESSION_SECRET` | ✅ Yes | - | Random secret for session encryption |
| `NODE_ENV` | ✅ Yes | `production` | Set to `production` for Render |
| `ADMIN_USERNAME` | ⚠️ Recommended | - | Creates admin user on startup |
| `ADMIN_PASSWORD` | ⚠️ Recommended | - | Admin password (min 8 chars) |
| `ALLOWED_EMAIL` | ❌ Optional | - | Restrict access to one email (Google login only) |
| `REPLIT_DOMAINS` | ❌ Optional | - | Only needed for Replit/Google login |
| `REPL_ID` | ❌ Optional | - | Only needed for Replit/Google login |

---

## 🎯 Quick Start Checklist

- [ ] Add `DATABASE_URL` to Render environment
- [ ] Add `SESSION_SECRET` to Render environment  
- [ ] Add `ADMIN_USERNAME` and `ADMIN_PASSWORD` to Render environment
- [ ] Deploy on Render
- [ ] Check deployment logs for errors
- [ ] Access your Render URL
- [ ] Log in with admin credentials
- [ ] ✅ You're ready to use your app!

---

## 💡 Tips

1. **Free Tier Sleep:** Render free tier apps sleep after 15 minutes of inactivity. First request after sleep takes ~30 seconds.
2. **Database Costs:** Neon free tier includes 0.5 GB storage and 100 hours of compute per month.
3. **Email Whitelist:** If using `ALLOWED_EMAIL`, only that email can access via Google login (Replit only).
4. **Multiple Staff:** Create additional staff users through the Settings page after logging in as admin.

---

## 🔐 Security Best Practices

1. Use strong passwords for admin accounts
2. Never commit environment variables to Git
3. Rotate `SESSION_SECRET` periodically
4. Use `ALLOWED_EMAIL` to restrict Google login access
5. Enable 2FA on your Neon and Render accounts

---

## 📞 Need Help?

If you encounter issues:
1. Check Render deployment logs
2. Check Neon database connection
3. Verify all environment variables are set correctly
4. Make sure `ADMIN_USERNAME` and `ADMIN_PASSWORD` are at least 8 characters

---

Good luck with your deployment! 🚀
