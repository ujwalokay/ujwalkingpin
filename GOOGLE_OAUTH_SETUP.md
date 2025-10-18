# Google OAuth Setup Guide (No Replit Required)

This guide will help you set up **your own Google OAuth** for authentication on Render (or any platform).

---

## 🎯 Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Ankylo Gaming` (or any name)
4. Click **"Create"**
5. Wait for project creation (takes a few seconds)

---

## 🔑 Step 2: Enable Google+ API

1. In your Google Cloud project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and click **"Enable"**
4. (Optional) Also enable **"People API"** for better profile data

---

## 🛡️ Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace)
3. Click **"Create"**

### Fill in the required fields:

**App information:**
- App name: `Ankylo Gaming Staff Panel`
- User support email: `your-email@gmail.com`
- App logo: (optional, upload your logo)

**Developer contact information:**
- Email addresses: `your-email@gmail.com`

4. Click **"Save and Continue"**

### Scopes:
5. Click **"Add or Remove Scopes"**
6. Select these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
7. Click **"Update"** → **"Save and Continue"**

### Test users (optional for development):
8. Add your email address as a test user
9. Click **"Save and Continue"**
10. Review and click **"Back to Dashboard"**

---

## 🔐 Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `Ankylo Gaming Web Client`

### Configure Authorized URLs:

**Authorized JavaScript origins:**
```
https://your-app-name.onrender.com
```
Replace `your-app-name` with your actual Render domain.

**Authorized redirect URIs:**
```
https://your-app-name.onrender.com/api/auth/google/callback
```

For local development, also add:
```
http://localhost:5000
http://localhost:5000/api/auth/google/callback
```

5. Click **"Create"**

---

## 📋 Step 5: Save Your Credentials

You'll see a popup with your credentials:

- **Client ID**: `123456789-abc...googleusercontent.com`
- **Client Secret**: `GOCSPX-...`

**Important:** Copy these immediately! You'll need them for Render.

---

## 🚀 Step 6: Add Environment Variables to Render

Go to your Render dashboard → Your service → **Environment** tab:

### Required Variables:

```
DATABASE_URL=your-neon-postgres-connection-string
SESSION_SECRET=random-32-character-string
NODE_ENV=production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Optional Variables:

```
ALLOWED_EMAIL=youremail@gmail.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
GOOGLE_CALLBACK_URL=https://your-app-name.onrender.com/api/auth/google/callback
```

**Notes:**
- `GOOGLE_CALLBACK_URL` is optional - it will auto-detect your Render URL
- `ALLOWED_EMAIL` restricts access to only one email address
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` create a staff/admin user for backup login

---

## ✅ Step 7: Test Your Setup

1. Deploy your app on Render
2. Visit: `https://your-app-name.onrender.com`
3. Click **"Continue with Google"**
4. Sign in with your Google account
5. ✅ You should be redirected back to your app and logged in!

---

## 🔧 Troubleshooting

### Error: "redirect_uri_mismatch"
**Solution:** Make sure the callback URL in Google Cloud Console exactly matches:
```
https://your-app-name.onrender.com/api/auth/google/callback
```

### Error: "Access denied"
**Solution:** 
1. Check if you set `ALLOWED_EMAIL` - only that email can log in
2. Make sure the email you're logging in with matches exactly

### Error: "This app isn't verified"
**Solution:** This is normal during development. Click **"Advanced"** → **"Go to [App Name] (unsafe)"**

To remove this warning (optional):
1. Go to Google Cloud Console → OAuth consent screen
2. Click **"Publish App"**
3. Submit for verification (takes a few days)

### Google login button not working
**Check:**
1. `GOOGLE_CLIENT_ID` is set in Render environment variables
2. `GOOGLE_CLIENT_SECRET` is set in Render environment variables
3. Your Google Cloud OAuth credentials are for "Web application" type
4. Callback URL is correctly configured in Google Cloud Console

---

## 📊 Environment Variables Summary

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | `postgresql://...` | Neon database connection |
| `SESSION_SECRET` | ✅ Yes | Random 32+ chars | Session encryption key |
| `NODE_ENV` | ✅ Yes | `production` | Environment mode |
| `GOOGLE_CLIENT_ID` | ✅ Yes | `123...googleusercontent.com` | From Google Cloud |
| `GOOGLE_CLIENT_SECRET` | ✅ Yes | `GOCSPX-...` | From Google Cloud |
| `ALLOWED_EMAIL` | ❌ Optional | `admin@example.com` | Restrict to one email |
| `ADMIN_USERNAME` | ❌ Optional | `admin` | Staff/admin username |
| `ADMIN_PASSWORD` | ❌ Optional | `SecurePass123` | Staff/admin password |
| `GOOGLE_CALLBACK_URL` | ❌ Optional | Auto-detected | OAuth callback URL |

---

## 🎉 You're Done!

Your Google OAuth is now set up **completely independent** of Replit. You're using your own Google Cloud credentials.

**Benefits:**
- ✅ No Replit dependencies
- ✅ You control the OAuth application
- ✅ Works on any platform (Render, Vercel, AWS, etc.)
- ✅ Email whitelist still works
- ✅ Staff/admin backup login available

---

## 🔐 Security Best Practices

1. **Never commit credentials** - Keep `GOOGLE_CLIENT_SECRET` in environment variables only
2. **Use HTTPS in production** - Google OAuth requires HTTPS for production URLs
3. **Enable email whitelist** - Set `ALLOWED_EMAIL` to restrict access
4. **Rotate secrets periodically** - Update `SESSION_SECRET` every few months
5. **Monitor OAuth usage** - Check Google Cloud Console for suspicious activity

---

## 💡 Next Steps

- Set up custom domain on Render (optional)
- Add more authorized users through your app's settings
- Configure email notifications
- Set up monitoring and logging

Need help? Check the main `RENDER_DEPLOYMENT_GUIDE.md` for more information!
