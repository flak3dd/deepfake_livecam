@echo off
setlocal enabledelayedexpansion

:: Deep Live Cam - Quick Build and Run Script for Windows
:: This script automates the complete setup process

echo ============================================================
echo Deep Live Cam - GPU Build and Run
echo ============================================================
echo.

:: Step 1: System Check
echo [STEP 1/3] Running system checks...
echo.
call gpu-docker.bat check
if errorlevel 1 (
    echo.
    echo [ERROR] System check failed. Please resolve the issues above.
    pause
    exit /b 1
)
echo.
echo [SUCCESS] System checks passed!
echo.

:: Step 2: Build Docker Image
echo [STEP 2/3] Building Docker image...
echo This may take 10-15 minutes on first build...
echo.
call gpu-docker.bat build
if errorlevel 1 (
    echo.
    echo [ERROR] Build failed. Please check the error messages above.
    pause
    exit /b 1
)
echo.
echo [SUCCESS] Docker image built successfully!
echo.

:: Step 3: Start Container
echo [STEP 3/3] Starting container...
echo.
call gpu-docker.bat start
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start container. Please check the error messages above.
    pause
    exit /b 1
)
echo.
echo ============================================================
echo [SUCCESS] Deep Live Cam is now running!
echo ============================================================
echo.
echo API is available at: http://localhost:8000
echo.
echo Useful commands:
echo   gpu-docker.bat status   - Check container status
echo   gpu-docker.bat logs     - View container logs
echo   gpu-docker.bat monitor  - Monitor GPU usage
echo   gpu-docker.bat stop     - Stop the container
echo   gpu-docker.bat shell    - Open shell in container
echo.
pause
