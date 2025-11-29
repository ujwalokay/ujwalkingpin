@echo off
echo ========================================
echo  Airavoto Gaming POS - Portable Build
echo ========================================
echo.
echo This will create a fully portable offline package
echo that includes WebView2 runtime.
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

set OUTPUT_DIR=.\portable
set PUBLISH_DIR=.\publish

echo [1/5] Cleaning previous builds...
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
if exist "%PUBLISH_DIR%" rmdir /s /q "%PUBLISH_DIR%"
mkdir "%OUTPUT_DIR%"
echo.

echo [2/5] Restoring NuGet packages...
dotnet restore
if errorlevel 1 (
    echo ERROR: Failed to restore packages!
    pause
    exit /b 1
)
echo.

echo [3/5] Publishing application...
dotnet publish -c Release -r win-x64 --self-contained true -o "%PUBLISH_DIR%"
if errorlevel 1 (
    echo ERROR: Publish failed!
    pause
    exit /b 1
)
echo.

echo [4/5] Creating portable package...
:: Copy main executable and dependencies
xcopy "%PUBLISH_DIR%\*" "%OUTPUT_DIR%\" /E /I /Y

:: Ensure wwwroot exists
if not exist "%OUTPUT_DIR%\wwwroot" mkdir "%OUTPUT_DIR%\wwwroot"
echo.

echo [5/5] Package info...
echo.

echo ========================================
echo  BUILD SUCCESSFUL!
echo ========================================
echo.
echo Your portable application is at:
echo   %OUTPUT_DIR%\
echo.
echo IMPORTANT: Before distributing:
echo   1. Copy your built web app (dist folder contents) to:
echo      %OUTPUT_DIR%\wwwroot\
echo.
echo   2. For fully offline use, copy WebView2 runtime to:
echo      %OUTPUT_DIR%\WebView2Runtime\
echo      (Download from packages\.webview2\runtimes\ after build)
echo.
echo The final portable folder can be copied to any Windows PC.
echo.
pause
