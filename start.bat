@echo off
echo ==================================================
echo   Medical Information System (MIS) Startup
echo ==================================================
echo.

cd /d %~dp0

echo [1/3] Checking Frontend...
cd frontend
if not exist node_modules (
    echo Installing Frontend dependencies...
    call npm install
)
echo Building Frontend...
call npm run build
cd ..

echo.
echo [2/3] Checking Backend...
cd backend
if not exist node_modules (
    echo Installing Backend dependencies...
    call npm install
)

echo Updating database schema...
call npx prisma db push

echo.
echo [3/3] Starting Server...
for /f "tokens=14" %%a in ('ipconfig ^| findstr IPv4') do set LOCAL_IP=%%a
echo Server will be available locally at http://localhost:8080
if defined LOCAL_IP (
    echo Server is available on the network at http://%LOCAL_IP%:8080
) else (
    echo Could not detect local IP automatically.
)
echo Opening browser...
start http://localhost:8080
echo Press Ctrl+C in this window to stop the server.
echo.

node index.js
pause
