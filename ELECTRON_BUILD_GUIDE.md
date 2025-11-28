# Airavoto Gaming POS - Desktop Application Build & Installation Guide

## Overview
This guide explains how to build the Airavoto Gaming POS as an offline desktop application and how to distribute it to gaming cafes.

---

## Building the Desktop Application

### Prerequisites (For Building)
You need a computer with:
- **Windows 10/11** (for building Windows installer)
- **Node.js 18+** installed
- **Git** installed

### Step 1: Download the Project
1. Download this entire project folder to your computer
2. Open Command Prompt or Terminal
3. Navigate to the project folder:
   ```bash
   cd path/to/airavoto-gaming-pos
   ```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build for Windows
To create a Windows installer (.exe):
```bash
npm run electron:dist-win
```

**Output Files** (found in `release/` folder):
- `Airavoto Gaming POS-1.0.0-Setup.exe` - Installer file
- `Airavoto Gaming POS-1.0.0.exe` - Portable version (no installation needed)

### Step 4: Build for Linux (Optional)
```bash
npm run electron:dist-linux
```

### Step 5: Build for All Platforms
```bash
npm run electron:dist-all
```

---

## Installing on Gaming Cafe Computers

### For Windows PCs

#### Option A: Using the Installer (Recommended)
1. Copy `Airavoto Gaming POS-1.0.0-Setup.exe` to a USB drive
2. Insert USB into the gaming cafe computer
3. Double-click the installer
4. Choose installation location (default: C:\Program Files\Airavoto Gaming POS)
5. Click "Install"
6. A desktop shortcut will be created automatically

#### Option B: Portable Version (No Installation)
1. Copy `Airavoto Gaming POS-1.0.0.exe` to the gaming cafe computer
2. Double-click to run - no installation needed
3. Data is stored in: `C:\Users\[Username]\AppData\Roaming\Airavoto Gaming POS`

### First-Time Setup
1. Launch the application
2. Default admin login:
   - Username: `admin`
   - Password: `admin123`
3. **IMPORTANT**: Change the admin password immediately after first login!

---

## Features for Gaming Cafes

### What This Software Does
- Manage gaming PC bookings (hourly/session-based)
- Track customer information
- Process payments (Cash/UPI)
- Generate receipts and reports
- Manage food/snack orders
- Track staff and multiple users
- Run promotions and discounts
- Customer loyalty program
- Tournament management

**Note:** This offline version does not include cloud-based SMS/WhatsApp notifications. All features work locally without internet.

### Key Benefits for Gaming Cafes
1. **Works Offline** - No internet required for daily operations
2. **Easy to Use** - Simple interface designed for staff
3. **All-in-One** - Booking, payments, food orders in one app
4. **Reports** - Daily/weekly/monthly business reports
5. **Multi-User** - Different access levels for staff and admin

---

## Selling to Other Gaming Cafes

### Pricing Suggestions

| License Type | Price (INR) | Description |
|-------------|-------------|-------------|
| Single Cafe | ₹15,000 - ₹25,000 | One-time purchase for 1 location |
| Multi-Location | ₹40,000 - ₹60,000 | Up to 5 locations |
| Enterprise | Custom | Unlimited locations + support |

### What to Include in Your Package

#### Basic Package (₹15,000)
- Software installer
- Installation support (remote)
- User manual
- 30 days email support

#### Standard Package (₹20,000)
- Everything in Basic
- On-site installation
- Staff training (2 hours)
- 90 days support
- Minor customizations

#### Premium Package (₹30,000)
- Everything in Standard
- Custom branding (cafe logo/name)
- 1 year support
- Free updates
- Priority support via phone/WhatsApp

### How to Customize for Each Cafe

1. **Change Branding**
   - Edit `client/src/pages/Login.tsx` - Update cafe name and branding
   - Replace `attached_assets/airavoto_logo.png` with client's logo
   - Rebuild: `npm run electron:dist-win`

2. **Configure Pricing**
   - Log into admin panel
   - Go to Settings > Pricing Configuration
   - Set hourly rates for different PC categories

3. **Set Up Categories**
   - Admin Panel > Settings > PC Categories
   - Add: Gaming PC, VR Station, Racing Simulator, etc.

---

## Technical Support Guide

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| App won't start | Right-click > Run as Administrator |
| Data not saving | Check if antivirus is blocking the app |
| Slow performance | Restart the computer |
| Login not working | Use admin/admin123 to reset |

### Database Location
- Windows: `C:\Users\[Username]\AppData\Roaming\Airavoto Gaming POS\airavoto-gaming.db`
- This SQLite file contains all data - back it up regularly!

### Backup Procedure
1. Close the application
2. Copy the `airavoto-gaming.db` file to a safe location
3. To restore: Replace the db file and restart the app

---

## Updating the Software

### To Send Updates to Clients
1. Make changes to the code
2. Update version in `package.json`
3. Build new installer
4. Send to client with instructions:
   - Backup their data first
   - Uninstall old version
   - Install new version
   - Data will be preserved

---

## Legal Considerations

### Before Selling
1. Register your business
2. Create a Terms of Service document
3. Create a License Agreement
4. Consider GST registration for India

### License Agreement Template Points
- Software is licensed, not sold
- No resale without permission
- Support terms and limitations
- Data ownership (client owns their data)
- Liability limitations

---

## Contact & Support

For development support:
- Email: support@airavotogaming.com
- Website: www.airavotogaming.com

---

## Quick Reference Commands

```bash
# Development mode
npm run dev

# Build all Electron files
npm run electron:build

# Create Windows installer
npm run electron:dist-win

# Create Linux installer
npm run electron:dist-linux

# Create all platform installers
npm run electron:dist-all

# Test Electron app locally
npm run electron:dev
```

---

## Folder Structure After Build

```
release/
├── Airavoto Gaming POS-1.0.0-Setup.exe    (Windows Installer)
├── Airavoto Gaming POS-1.0.0.exe          (Windows Portable)
├── Airavoto Gaming POS-1.0.0.AppImage     (Linux)
├── Airavoto Gaming POS-1.0.0.deb          (Linux Debian)
└── ... other platform files
```

---

**Last Updated: November 2024**
**Version: 1.0.0**
