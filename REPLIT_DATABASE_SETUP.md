# 🗄️ Replit Database Setup Guide

## Quick Setup (Required to Run the Application)

Your application uses PostgreSQL and needs a database to be provisioned in Replit.

### Step 1: Create the Database

1. Look for the **"Database"** or **"PostgreSQL"** icon in the left sidebar
2. Click on it to open the database panel
3. Click **"Create Database"** or **"Provision Database"**
4. Wait for the database to be created (usually takes a few seconds)

Once created, Replit will automatically set the `DATABASE_URL` environment variable.

### Step 2: Run Database Migrations

After the database is created, the migrations will run automatically when you start the application. The system will:

- Create all 20+ database tables
- Set up indexes and relationships
- Create a default admin user (admin/Admin@123)
- Initialize device configurations

### Step 3: Start the Application

The workflow should start automatically. If not, click the **Run** button or restart the workflow.

---

## What Gets Created

The database includes:

**Core Tables:**
- bookings (gaming sessions)
- sessionGroups (group bookings)
- foodItems (cafe menu)
- deviceConfigs (gaming devices)
- pricingConfigs (hourly rates)

**Management Tables:**
- users (staff accounts)
- activityLogs (audit trail)
- expenses (business costs)
- stockBatches (inventory)

**Plus 12 more tables** for complete business operations

---

## Default Admin Account

After setup, you can login with:
- **Username:** admin
- **Password:** Admin@123

**⚠️ Change this password immediately after first login!**

---

## Troubleshooting

**Database creation failed?**
- Make sure you have permission to create databases
- Check if you're on a free plan (may have limits)
- Contact Replit support if issues persist

**Application won't start after database creation?**
- Wait 10-15 seconds and try again
- Check the console logs for errors
- Restart the workflow manually

---

## Need Help?

If you encounter any issues:
1. Check the console logs for error messages
2. Verify the database is showing as "provisioned" in the database panel
3. Try restarting the workflow
4. Contact support if problems persist

---

**Once the database is provisioned, you're ready to go! 🎮✨**
