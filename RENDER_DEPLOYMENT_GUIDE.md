# Render Deployment Guide for Ankylo Gaming

## ✅ Fixes Applied

Your app has been updated to work on **both Replit and Render**:
- ✅ Fixed `REPLIT_DOMAINS` requirement - now optional
- ✅ Fixed database migration stuck on user input - uses `--force` flag
- ✅ Google login disabled on Render (only staff/admin login available)
- ✅ Added environment variable checks

---

## 🚀 Step-by-Step Deployment on Render

### **Step 1: Environment Variables on Render**

Go to your Render service → **Environment** tab and add these variables:

#### **Required Variables:**
```
DATABASE_URL=your-neon-postgres-connection-string
SESSION_SECRET=generate-a-random-32-character-string
NODE_ENV=production
```

#### **Optional (for email whitelist):**
```
ALLOWED_EMAIL=youremail@gmail.com
```

#### **Optional (for Google login on Render - Advanced):**
If you want Google login to work on Render, you need to set up your own OAuth:
```
REPLIT_DOMAINS=your-render-domain.onrender.com
REPL_ID=your-app-name
ISSUER_URL=https://replit.com/oidc
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

### **Step 5: Create Admin User**

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

### **Step 6: Access Your App**

1. Wait for deployment to complete (check Render logs)
2. Open your Render URL: `https://your-app-name.onrender.com`
3. You should see the **staff login page** (no Google button)
4. Log in with:
   - **Username:** admin (or what you set)
   - **Password:** (what you set in ADMIN_PASSWORD)

---

## 🔧 Troubleshooting

### **Issue: "REPLIT_DOMAINS not provided" error**
✅ **Fixed!** The app now detects non-Replit environments automatically.

### **Issue: Database migration stuck**
✅ **Fixed!** Now uses `--force` flag to skip prompts.

### **Issue: "No admin user exists" warning**
**Solution:** Add `ADMIN_USERNAME` and `ADMIN_PASSWORD` to your Render environment variables.

### **Issue: Google login not working on Render**
**Expected behavior.** Google login (Replit Auth) only works in Replit environment. On Render, use staff/admin username/password login.

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
