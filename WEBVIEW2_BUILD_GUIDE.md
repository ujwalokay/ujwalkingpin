# Airavoto Gaming POS - WebView2 Desktop Build Guide

This guide explains how to build the Airavoto Gaming POS as a standalone Windows executable using WebView2 instead of Electron.

## Overview

WebView2 is Microsoft's modern web control that uses the Chromium-based Microsoft Edge. It provides:
- Smaller app size compared to Electron
- Native Windows integration
- Automatic security updates (Evergreen mode) or complete offline support (Fixed version)

## Prerequisites

### On Your Windows Machine:

1. **Install .NET 8 SDK**
   - Download from: https://dotnet.microsoft.com/download/dotnet/8.0
   - Choose "SDK" (not just Runtime)
   - Verify installation: Open Command Prompt and run `dotnet --version`

2. **Optional: Visual Studio 2022**
   - For easier development and debugging
   - Install "Desktop development with .NET" workload

## Building the Application

### Step 1: Prepare Web App Files

First, build the web application on Replit or your development machine:

```bash
npm run build
```

This creates the `dist/` folder with your compiled web app.

### Step 2: Copy Files to Windows

1. Download/clone the project to your Windows machine
2. Copy the contents of `dist/` folder to `webview2-app/wwwroot/`

### Step 2b: Add Application Icon (Optional)

To add a custom application icon:
1. Convert `build/icon.png` to `.ico` format using an online converter or tool
2. Save as `webview2-app/icon.ico`
3. Edit `AiravotoGamingPOS.csproj` and uncomment the ApplicationIcon line:
   ```xml
   <ApplicationIcon>icon.ico</ApplicationIcon>
   ```

Your folder structure should look like:
```
webview2-app/
├── AiravotoGamingPOS.csproj
├── Program.cs
├── MainForm.cs
├── build.bat
├── build-portable.bat
└── wwwroot/
    ├── index.html
    ├── assets/
    │   ├── index-xxxxx.js
    │   └── index-xxxxx.css
    └── ... (other built files)
```

### Step 3: Build the Executable

**Option A: Using Command Line**
```cmd
cd webview2-app
build.bat
```

**Option B: Using Visual Studio**
1. Open `AiravotoGamingPOS.csproj` in Visual Studio
2. Select Release configuration
3. Build > Publish

### Step 4: Get Your Executable

After successful build, find your app at:
```
webview2-app\publish\AiravotoGamingPOS.exe
```

## Distribution Options

### Option 1: Evergreen (Recommended for most users)

The app uses the system-installed WebView2 runtime that auto-updates:
- Smaller download size (~50MB)
- Automatic security updates
- Requires internet for first install (runtime download)

Just distribute:
- `AiravotoGamingPOS.exe`
- `wwwroot/` folder

### Option 2: Fixed Version (Fully Offline)

Bundle the WebView2 runtime with your app:
1. After building, find the runtime in: `packages\.webview2\runtimes\win-x64\`
2. Copy entire folder to: `publish\WebView2Runtime\`

Final package structure:
```
AiravotoGamingPOS/
├── AiravotoGamingPOS.exe
├── wwwroot/
│   └── ... (web app files)
└── WebView2Runtime/
    └── ... (runtime files ~150MB)
```

This creates a completely offline-capable application.

## Creating an Installer

### Using Inno Setup (Free)

1. Download Inno Setup: https://jrsoftware.org/isinfo.php

2. Create an installer script (`installer.iss`):

```iss
[Setup]
AppName=Airavoto Gaming POS
AppVersion=1.0.0
DefaultDirName={autopf}\AiravotoGamingPOS
DefaultGroupName=Airavoto Gaming
OutputBaseFilename=AiravotoGamingPOS-Setup
Compression=lzma2
SolidCompression=yes

[Files]
Source: "publish\AiravotoGamingPOS.exe"; DestDir: "{app}"
Source: "publish\wwwroot\*"; DestDir: "{app}\wwwroot"; Flags: recursesubdirs
Source: "publish\WebView2Runtime\*"; DestDir: "{app}\WebView2Runtime"; Flags: recursesubdirs

[Icons]
Name: "{group}\Airavoto Gaming POS"; Filename: "{app}\AiravotoGamingPOS.exe"
Name: "{autodesktop}\Airavoto Gaming POS"; Filename: "{app}\AiravotoGamingPOS.exe"

[Run]
Filename: "{app}\AiravotoGamingPOS.exe"; Description: "Launch Airavoto Gaming POS"; Flags: postinstall nowait
```

3. Compile with Inno Setup to create `AiravotoGamingPOS-Setup.exe`

## Troubleshooting

### "WebView2 Runtime not found"

**Solution 1:** Install WebView2 Runtime from Microsoft:
https://developer.microsoft.com/microsoft-edge/webview2/

**Solution 2:** Use fixed version build (see Option 2 above)

### Application shows blank screen

1. Ensure `wwwroot/index.html` exists
2. Check the web app was built correctly (`npm run build`)
3. Make sure all dist files are copied to wwwroot

### Build errors

1. Ensure .NET 8 SDK is installed (not just runtime)
2. Run `dotnet restore` before building
3. Check Windows version (requires Windows 10 1803 or later)

## File Size Comparison

| Approach | Size |
|----------|------|
| WebView2 (Evergreen) | ~50 MB |
| WebView2 (Fixed Runtime) | ~200 MB |
| Electron | ~250+ MB |

## Technical Notes

- WebView2 is Windows-only (no macOS/Linux support)
- Minimum: Windows 10 version 1803 or Windows Server 2019
- For cross-platform needs, consider keeping the web version available
- The app uses virtual host mapping (`https://app.local/`) for security

## Support

For issues with:
- **Web App**: Check Replit logs and browser console
- **WebView2 Build**: Check .NET build output
- **Runtime Issues**: Ensure WebView2 Runtime is properly installed
