@echo off
echo ========================================
echo  Airavoto Gaming POS - WebView2 Build
echo ========================================
echo.

:: Check if .NET SDK is installed
dotnet --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: .NET SDK is not installed!
    echo Please download and install .NET 8 SDK from:
    echo https://dotnet.microsoft.com/download/dotnet/8.0
    echo.
    pause
    exit /b 1
)

echo [1/4] Checking .NET SDK version...
dotnet --version
echo.

echo [2/4] Restoring NuGet packages...
dotnet restore
if errorlevel 1 (
    echo ERROR: Failed to restore packages!
    pause
    exit /b 1
)
echo.

echo [3/4] Building application in Release mode...
dotnet build -c Release
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo.

echo [4/4] Publishing as single-file executable...
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o .\publish
if errorlevel 1 (
    echo ERROR: Publish failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  BUILD SUCCESSFUL!
echo ========================================
echo.
echo Your application is ready at:
echo   .\publish\AiravotoGamingPOS.exe
echo.
echo NOTE: You also need to copy the WebView2Runtime folder
echo       to the same directory as the .exe for offline use.
echo.
pause
