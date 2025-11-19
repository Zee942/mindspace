@echo off
echo ========================================
echo   Mind Space Frontend Server
echo ========================================
echo.

cd frontend

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

:: Run dev server
echo.
echo Starting Vite dev server...
echo Frontend running at: http://localhost:5173
echo.
call npm run dev
