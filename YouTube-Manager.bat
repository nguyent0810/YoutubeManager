@echo off
title YouTube Manager
echo.
echo ========================================
echo    YouTube Manager - Starting...
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

REM Build and start the application
echo Building and starting YouTube Manager...
npm run start

REM Keep window open if there's an error
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start YouTube Manager!
    pause
)
