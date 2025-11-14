# 🚀 How to Add 6 Neon Databases in Render

## When You Need This

When your storage reaches ~400-500 MB (in 5-6 years), you'll want to use 6 free Neon databases = 3 GB total storage.

---

## Step 1: Create 6 Neon Databases

1. Go to **https://console.neon.tech/**
2. Click **"New Project"** 6 times
3. Name them clearly:
   ```
   airavoto-main
   airavoto-history
   airavoto-payments
   airavoto-expenses
   airavoto-logs
   airavoto-analytics
   ```

4. For **each project**, copy the connection string:
   - Click on your project
   - Go to **"Connection Details"**
   - Copy the **connection string** (starts with `postgresql://`)

You'll have 6 connection strings like:
```
postgresql://user:pass@host1.neon.tech/dbname1?sslmode=require
postgresql://user:pass@host2.neon.tech/dbname2?sslmode=require
postgresql://user:pass@host3.neon.tech/dbname3?sslmode=require
postgresql://user:pass@host4.neon.tech/dbname4?sslmode=require
postgresql://user:pass@host5.neon.tech/dbname5?sslmode=require
postgresql://user:pass@host6.neon.tech/dbname6?sslmode=require
```

---

## Step 2: Add to Render Environment Variables

### If Using Render.com for Deployment:

1. **Go to your Render dashboard:** https://dashboard.render.com/
2. **Select your web service** (your Airavoto app)
3. **Click "Environment"** tab in the left sidebar
4. **Click "Add Environment Variable"** button

5. **Add these 6 variables one by one:**

| Key | Value |
|-----|-------|
| `DATABASE_URL_MAIN` | `postgresql://user:pass@host1.neon.tech/dbname1?sslmode=require` |
| `DATABASE_URL_HISTORY` | `postgresql://user:pass@host2.neon.tech/dbname2?sslmode=require` |
| `DATABASE_URL_PAYMENTS` | `postgresql://user:pass@host3.neon.tech/dbname3?sslmode=require` |
| `DATABASE_URL_EXPENSES` | `postgresql://user:pass@host4.neon.tech/dbname4?sslmode=require` |
| `DATABASE_URL_LOGS` | `postgresql://user:pass@host5.neon.tech/dbname5?sslmode=require` |
| `DATABASE_URL_ANALYTICS` | `postgresql://user:pass@host6.neon.tech/dbname6?sslmode=require` |

6. **Click "Save Changes"**
7. Render will **automatically redeploy** your app with the new environment variables

---

## Step 3: Add to Replit (For Development)

### In Replit:

1. **Click "Tools"** in the left sidebar
2. **Click "Secrets"** 
3. **Add each secret:**

**For each database:**
- Click **"+ New Secret"**
- Enter **Key:** `DATABASE_URL_MAIN`
- Enter **Value:** `postgresql://user:pass@host1.neon.tech/dbname1?sslmode=require`
- Click **"Add Secret"**

**Repeat for all 6 databases:**
- `DATABASE_URL_MAIN`
- `DATABASE_URL_HISTORY`
- `DATABASE_URL_PAYMENTS`
- `DATABASE_URL_EXPENSES`
- `DATABASE_URL_LOGS`
- `DATABASE_URL_ANALYTICS`

---

## Step 4: Access in Your Code

Once environment variables are set, access them in your code:

```typescript
// server/storage.ts (future implementation)
const mainDb = drizzle(process.env.DATABASE_URL_MAIN!);
const historyDb = drizzle(process.env.DATABASE_URL_HISTORY!);
const paymentsDb = drizzle(process.env.DATABASE_URL_PAYMENTS!);
const expensesDb = drizzle(process.env.DATABASE_URL_EXPENSES!);
const logsDb = drizzle(process.env.DATABASE_URL_LOGS!);
const analyticsDb = drizzle(process.env.DATABASE_URL_ANALYTICS!);
```

---

## 📸 Visual Guide for Render

### Adding Environment Variables in Render:

```
1. Render Dashboard
   └── Your App (airavoto-gaming)
       └── Environment Tab
           └── Environment Variables Section
               └── [+ Add Environment Variable]
                   ├── Key: DATABASE_URL_MAIN
                   └── Value: postgresql://...
```

**Screenshot locations:**
- Top right: **"Add Environment Variable"** button
- Each variable has:
  - **Key** field (left)
  - **Value** field (right)
  - **Delete** icon (far right)

---

## 🔒 Security Notes

✅ **DO:**
- Keep connection strings secret
- Use environment variables (never hardcode)
- Copy-paste carefully (one wrong character breaks everything)

❌ **DON'T:**
- Share connection strings publicly
- Commit them to Git
- Post them in screenshots

---

## ✅ Verification

**After adding environment variables:**

1. **In Render:**
   - Check "Environment" tab
   - Should see all 6 `DATABASE_URL_*` variables

2. **In Replit:**
   - Check "Secrets" tool
   - Should see all 6 secrets listed

3. **Test in Code:**
   ```typescript
   console.log('Main DB:', process.env.DATABASE_URL_MAIN ? 'Connected' : 'Missing');
   console.log('History DB:', process.env.DATABASE_URL_HISTORY ? 'Connected' : 'Missing');
   // ... etc
   ```

---

## 🆘 Troubleshooting

### "Environment variable not found"
- ✅ Check spelling (exact match required)
- ✅ Restart app after adding variables
- ✅ Make sure no extra spaces

### "Connection refused"
- ✅ Check connection string format
- ✅ Verify Neon database is active
- ✅ Check if `?sslmode=require` is at the end

### "Password authentication failed"
- ✅ Copy connection string again from Neon
- ✅ Make sure you copied the FULL string
- ✅ Check for special characters that might break

---

## 📅 When to Do This

**NOT NOW!** You have 6-7 years before needing this.

**Do this when:**
- Your single database reaches ~400 MB (75% full)
- Neon sends you storage warnings
- Around Year 5-6 of operation

**For now:**
- Keep using the single `DATABASE_URL`
- Monitor storage in Neon dashboard
- Relax and run your business! 🎮

---

## 💡 Current Setup (Simple)

**Right now you only have:**
```
DATABASE_URL = postgresql://... (one database)
```

**This is perfect for the next 6-7 years!**

When you need to scale to 6 databases, come back to this guide.

---

## 📞 Need Help?

When the time comes (in 5-6 years):
1. Create the 6 Neon projects
2. Copy the 6 connection strings
3. Add them to Render/Replit environment
4. Request code modification help

**But for now, enjoy your free 512 MB!** ✨
