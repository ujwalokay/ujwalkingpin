# Tauri Desktop Application Build Guide

## Overview

This project has been converted from a web application to a Tauri desktop application with offline SQLite database storage. The desktop app provides the same functionality as the web app but works completely offline.

## Prerequisites

Before building the desktop application, you need:

### Windows
- **Rust** (install from https://rustup.rs/)
- **Microsoft Visual Studio Build Tools** with C++ workload
- **Node.js 18+** and npm

### macOS
- **Rust** (install from https://rustup.rs/)
- **Xcode Command Line Tools** (`xcode-select --install`)
- **Node.js 18+** and npm

### Linux
- **Rust** (install from https://rustup.rs/)
- **Build essentials**: `sudo apt install build-essential`
- **WebKit2GTK**: `sudo apt install libwebkit2gtk-4.1-dev`
- **Other dependencies**:
  ```bash
  sudo apt install libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```
- **Node.js 18+** and npm

## Project Structure

```
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/
│   │   ├── lib.rs          # Main Tauri app with SQLite migrations
│   │   └── main.rs         # Entry point
│   ├── capabilities/
│   │   └── default.json    # Permissions for SQL plugin
│   ├── icons/              # Application icons
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── client/                  # React frontend
│   └── src/
│       └── lib/
│           ├── api.ts      # Unified API (web/tauri)
│           ├── tauri-db.ts # Local SQLite database layer
│           └── queryClient.ts
└── package.json            # Node.js scripts
```

## Development

### Web Development (Online Mode)
```bash
npm run dev
```
This runs the Express backend server at port 5000 with PostgreSQL database.

### Tauri Development (Desktop Mode)
```bash
npm run tauri:dev
```
This starts the Tauri development environment with hot-reload and SQLite database.

## Building

### Build for Current Platform
```bash
npm run tauri:build
```

This will:
1. Build the React frontend
2. Compile the Rust backend
3. Create an installer for your current operating system

### Build Output Locations

- **Windows**: `src-tauri/target/release/bundle/msi/` or `nsis/`
- **macOS**: `src-tauri/target/release/bundle/dmg/` or `app/`
- **Linux**: `src-tauri/target/release/bundle/deb/` or `appimage/`

## Database

### SQLite Database Location

When running as a desktop app, the SQLite database is stored at:

- **Windows**: `%APPDATA%/com.airavoto.gaming.pos/airavoto_pos.db`
- **macOS**: `~/Library/Application Support/com.airavoto.gaming.pos/airavoto_pos.db`
- **Linux**: `~/.config/com.airavoto.gaming.pos/airavoto_pos.db`

### Database Migrations

Migrations are automatically applied on first run. The following tables are created:

1. `users` - Staff and admin accounts
2. `session_groups` - Group booking sessions
3. `bookings` - Active bookings
4. `booking_history` - Archived bookings
5. `food_items` - Menu items
6. `stock_batches` - Inventory tracking
7. `device_configs` - Gaming device configuration
8. `pricing_configs` - Pricing tiers
9. `happy_hours_configs` - Happy hour settings
10. `happy_hours_pricing` - Happy hour pricing
11. `expenses` - Business expenses
12. `activity_logs` - User activity tracking
13. `notifications` - System notifications
14. `gaming_center_info` - Center information
15. `gallery_images` - Photo gallery
16. `facilities` - Available facilities
17. `games` - Available games
18. `device_maintenance` - Maintenance records
19. `staff_visibility_settings` - Staff permissions
20. `app_settings` - Application settings

### Default Admin Account

A default admin account is created on first run via SQLite migrations:
- **Username**: `admin`
- **Password**: `Admin@123`
- **Role**: `admin`

**IMPORTANT**: Change this password immediately after first login!

Note: The password hash is pre-generated using bcrypt with 12 rounds. If you need to reset, delete the database file and restart the application.

## Application Features

The desktop version supports offline mode for core functionality:

### Fully Supported Offline:
1. **Booking Management** - Create, update, pause, resume, and end sessions
2. **Food & Inventory** - Track food items and stock levels
3. **Device Configuration** - Set up gaming stations and categories
4. **Pricing Configuration** - Manage pricing tiers and durations
5. **Happy Hours** - Configure promotional pricing windows
6. **Expense Tracking** - Record and manage business expenses
7. **Booking History** - View archived booking records
8. **Activity Logs** - Track user actions
9. **Notifications** - System notifications and alerts
10. **User Management** - Create and manage staff accounts
11. **Gaming Center Info** - Update business information
12. **Session Groups** - Manage group bookings

### Web-Only Features (require online connection):
- Reports & Analytics (complex aggregations)
- Google OAuth authentication
- Real-time sync with cloud database
- Advanced payment integrations

## Icons

Before building, place your application icons in `src-tauri/icons/`:

- `32x32.png` - 32x32 pixels PNG
- `128x128.png` - 128x128 pixels PNG
- `128x128@2x.png` - 256x256 pixels PNG (for Retina)
- `icon.icns` - macOS icon bundle
- `icon.ico` - Windows icon

You can generate these from a source image using:
```bash
npm run tauri icon path/to/your-logo.png
```

## Troubleshooting

### Build Errors

**SQLite Dependency Conflict (libsqlite3-sys)**:

If you see an error like:
```
error: failed to select a version for `libsqlite3-sys`
... package links to native library `sqlite3`, but it conflicts with a previous package
```

This means there are conflicting SQLite dependencies. The fix is to ensure only `tauri-plugin-sql` is used for SQLite operations. Check `src-tauri/Cargo.toml` and remove any duplicate SQLite dependencies like `rusqlite`. The `tauri-plugin-sql` plugin already includes everything needed.

**"Couldn't recognize the current folder as a Tauri project" Error**:

This error means the Tauri CLI cannot find the configuration file. Solutions:

1. **Verify the src-tauri folder exists**:
   ```bash
   # Windows (PowerShell)
   Test-Path src-tauri/tauri.conf.json
   
   # macOS/Linux
   ls -la src-tauri/tauri.conf.json
   ```

2. **If src-tauri folder is missing**, re-download the project or create it:
   ```bash
   npx tauri init
   ```

3. **Run from project root** - Make sure you're in the main project folder (where package.json is located):
   ```bash
   # Check you're in the right folder
   dir package.json        # Windows
   ls package.json         # macOS/Linux
   ```

4. **Clear npm cache and reinstall**:
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

**Missing Rust toolchain**:
```bash
rustup default stable
rustup update
```

**Windows: Missing Visual Studio Build Tools**:
1. Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Install with "Desktop development with C++" workload
3. Restart your terminal

**Windows: WebView2 Missing**:
WebView2 is required for Tauri on Windows. It's usually pre-installed on Windows 10/11, but if needed:
- Download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

**Missing WebKit2GTK (Linux)**:
```bash
sudo apt install libwebkit2gtk-4.1-dev
```

**Permission denied on Linux**:
```bash
chmod +x src-tauri/target/release/airavoto-gaming-pos
```

### Database Issues

**Reset database**:
Delete the SQLite file at the location mentioned above, and the app will recreate it on next launch.

**View database**:
Use any SQLite browser (like DB Browser for SQLite) to inspect the database file.

## Updating

When updating the application:

1. Back up your database file (optional but recommended)
2. Install the new version
3. Migrations will automatically apply any schema changes

## Support

For issues specific to:
- **Desktop app**: Check the Tauri logs and this guide
- **Web app**: Check server logs and browser console
- **Database**: Use SQLite browser to inspect data

## License

MIT License - Airavoto Gaming
