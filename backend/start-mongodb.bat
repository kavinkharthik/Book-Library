@echo off
echo Starting MongoDB Service...
echo.

REM Try to start MongoDB service
net start MongoDB

if %errorlevel% equ 0 (
    echo.
    echo ✅ MongoDB service started successfully!
    echo You can now connect to MongoDB at localhost:27017
    echo.
    echo Next steps:
    echo 1. Open MongoDB Compass
    echo 2. Connect to localhost:27017
    echo 3. Run your Node.js server: node server.js
) else (
    echo.
    echo ❌ Failed to start MongoDB service
    echo.
    echo This usually means:
    echo 1. You need to run this as Administrator
    echo 2. MongoDB service is not properly installed
    echo.
    echo Solutions:
    echo 1. Right-click this file and "Run as administrator"
    echo 2. Or manually start MongoDB:
    echo    - Open Services (services.msc)
    echo    - Find "MongoDB Server (MongoDB)"
    echo    - Right-click and "Start"
    echo.
    echo 3. Or reinstall MongoDB:
    echo    - Download from: https://www.mongodb.com/try/download/community
    echo    - Install as Windows Service
)

echo.
pause
