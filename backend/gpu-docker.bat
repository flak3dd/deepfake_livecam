@echo off
setlocal enabledelayedexpansion

:: Deep Live Cam - CUDA GPU Docker Manager for Windows
:: Version 1.0.0

set VERSION=1.0.0
set CONTAINER_NAME=deep-live-cam-gpu
set IMAGE_NAME=deep-live-cam-gpu
set IMAGE_TAG=latest
set DOCKERFILE=Dockerfile.cuda
set COMPOSE_FILE=docker-compose-gpu.yml
set PORT=8000

:: Main entry point
if "%1"=="" goto show_help
if "%1"=="help" goto show_help
if "%1"=="--help" goto show_help
if "%1"==-h goto show_help

if "%1"=="check" goto system_check
if "%1"=="build" goto build_image
if "%1"=="start" goto start_container
if "%1"=="run" goto start_container
if "%1"=="stop" goto stop_container
if "%1"=="restart" goto restart_container
if "%1"=="remove" goto remove_container
if "%1"=="rm" goto remove_container
if "%1"=="rebuild" goto full_rebuild
if "%1"=="status" goto show_status
if "%1"=="logs" goto show_logs
if "%1"=="monitor" goto monitor_container
if "%1"=="shell" goto run_shell
if "%1"=="bash" goto run_shell
if "%1"=="sh" goto run_shell
if "%1"=="test" goto test_api
if "%1"=="backup" goto backup_models
if "%1"=="restore" goto restore_models
if "%1"=="cleanup" goto cleanup_docker

echo [ERROR] Unknown command: %1
echo.
goto show_help

:: ============================================================
:: Utility Functions
:: ============================================================

:log_info
echo [INFO] %~1
goto :eof

:log_success
echo [SUCCESS] %~1
goto :eof

:log_warning
echo [WARNING] %~1
goto :eof

:log_error
echo [ERROR] %~1
goto :eof

:print_header
echo.
echo ================================================
echo   Deep Live Cam - CUDA GPU Docker Manager
echo   Version: %VERSION%
echo ================================================
echo.
goto :eof

:: ============================================================
:: Check Functions
:: ============================================================

:check_docker
call :log_info "Checking Docker installation..."

where docker >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker is not installed"
    echo.
    echo Install Docker Desktop for Windows:
    echo   https://docs.docker.com/desktop/install/windows-install/
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker daemon is not running"
    echo.
    echo Try:
    echo   - Start Docker Desktop
    echo   - Check if Docker service is running
    exit /b 1
)

call :log_success "Docker is installed and running"
goto :eof

:check_nvidia_driver
call :log_info "Checking NVIDIA driver..."

where nvidia-smi >nul 2>&1
if errorlevel 1 (
    call :log_error "NVIDIA driver not found (nvidia-smi not available)"
    echo.
    echo Install NVIDIA driver:
    echo   Download from: https://www.nvidia.com/drivers
    exit /b 1
)

nvidia-smi >nul 2>&1
if errorlevel 1 (
    call :log_error "NVIDIA driver is installed but not working properly"
    exit /b 1
)

for /f "tokens=*" %%i in ('nvidia-smi --query-gpu^=driver_version --format^=csv,noheader') do set DRIVER_VERSION=%%i
call :log_success "NVIDIA driver detected: !DRIVER_VERSION!"
goto :eof

:check_nvidia_docker
call :log_info "Checking NVIDIA Container Toolkit..."

docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi >nul 2>&1
if errorlevel 1 (
    call :log_error "NVIDIA Container Toolkit is not properly configured"
    echo.
    echo Make sure Docker Desktop has GPU support enabled:
    echo   1. Open Docker Desktop Settings
    echo   2. Go to Resources ^> WSL Integration
    echo   3. Ensure WSL 2 is enabled
    echo   4. Install NVIDIA Container Toolkit in WSL 2:
    echo.
    echo   In WSL terminal:
    echo   distribution=$(. /etc/os-release;echo $ID$VERSION_ID^)
    echo   curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey ^| sudo apt-key add -
    echo   curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list ^| \
    echo       sudo tee /etc/apt/sources.list.d/nvidia-docker.list
    echo   sudo apt-get update
    echo   sudo apt-get install -y nvidia-container-toolkit
    echo   sudo systemctl restart docker
    echo.
    echo Documentation: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html
    exit /b 1
)

call :log_success "NVIDIA Container Toolkit is configured"
goto :eof

:check_gpu_info
call :log_info "GPU Information:"
echo.
nvidia-smi --query-gpu=index,name,driver_version,memory.total,compute_cap --format=csv,noheader
echo.
goto :eof

:check_disk_space
call :log_info "Checking disk space..."
for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do set AVAILABLE=%%a
call :log_success "Disk space check completed"
goto :eof

:check_port
call :log_info "Checking if port %PORT% is available..."
netstat -ano | findstr ":%PORT%" >nul 2>&1
if not errorlevel 1 (
    call :log_warning "Port %PORT% is already in use"
    goto :eof
)
call :log_success "Port %PORT% is available"
goto :eof

:: ============================================================
:: Main Commands
:: ============================================================

:system_check
call :print_header
call :log_info "Running comprehensive system check..."
echo.

call :check_docker
if errorlevel 1 exit /b 1

call :check_nvidia_driver
if errorlevel 1 exit /b 1

call :check_nvidia_docker
if errorlevel 1 exit /b 1

call :check_gpu_info
call :check_disk_space
call :check_port

echo.
call :log_success "System check completed successfully!"
echo.
exit /b 0

:build_image
call :print_header
call :log_info "Building CUDA GPU Docker image..."
echo.

if not exist "%DOCKERFILE%" (
    call :log_error "Dockerfile not found: %DOCKERFILE%"
    exit /b 1
)

call :log_info "Building image: %IMAGE_NAME%:%IMAGE_TAG%"
call :log_info "This may take 10-15 minutes on first build..."
echo.

docker build -f "%DOCKERFILE%" -t "%IMAGE_NAME%:%IMAGE_TAG%" --progress=plain .

if errorlevel 1 (
    call :log_error "Build failed"
    exit /b 1
)

echo.
call :log_success "Image built successfully"

for /f "tokens=*" %%i in ('docker images "%IMAGE_NAME%:%IMAGE_TAG%" --format "{{.Size}}"') do set IMAGE_SIZE=%%i
call :log_info "Image size: !IMAGE_SIZE!"
echo.
exit /b 0

:start_container
call :print_header
call :log_info "Starting GPU-accelerated container..."
echo.

docker ps -a --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if not errorlevel 1 (
    call :log_error "Container '%CONTAINER_NAME%' already exists"
    echo.
    echo Options:
    echo   Stop:    %~nx0 stop
    echo   Restart: %~nx0 restart
    echo   Remove:  %~nx0 remove
    echo   Rebuild: %~nx0 rebuild
    exit /b 1
)

docker images --format "{{.Repository}}:{{.Tag}}" | findstr /x "%IMAGE_NAME%:%IMAGE_TAG%" >nul 2>&1
if errorlevel 1 (
    call :log_error "Image not found: %IMAGE_NAME%:%IMAGE_TAG%"
    echo Build the image first: %~nx0 build
    exit /b 1
)

if not exist "models" mkdir models

set GPU_ARG=--gpus all
if not "%GPU_ID%"=="" (
    set GPU_ARG=--gpus device=%GPU_ID%
    call :log_info "Using GPU: %GPU_ID%"
) else (
    call :log_info "Using all available GPUs"
)

docker run -d --name "%CONTAINER_NAME%" %GPU_ARG% -p "%PORT%:8000" -v "%cd%/models:/app/models" -e CUDA_VISIBLE_DEVICES=%GPU_ID% -e NVIDIA_VISIBLE_DEVICES=all -e PYTHONUNBUFFERED=1 --restart unless-stopped "%IMAGE_NAME%:%IMAGE_TAG%"

if errorlevel 1 (
    call :log_error "Failed to start container"
    exit /b 1
)

call :log_success "Container started: %CONTAINER_NAME%"
echo.

call :log_info "Waiting for service initialization..."
for /l %%i in (1,1,30) do (
    timeout /t 2 /nobreak >nul
    docker exec "%CONTAINER_NAME%" curl -s http://localhost:8000/health >nul 2>&1
    if not errorlevel 1 (
        call :log_success "Service is ready!"
        goto start_done
    )
    echo|set /p=.
)
:start_done
echo.
goto show_status

:stop_container
call :print_header
call :log_info "Stopping container..."

docker ps --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if errorlevel 1 (
    call :log_warning "Container is not running"
    exit /b 0
)

docker stop "%CONTAINER_NAME%"
call :log_success "Container stopped"
exit /b 0

:restart_container
call :print_header
call :log_info "Restarting container..."

docker ps -a --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if errorlevel 1 (
    call :log_error "Container does not exist"
    echo Start container: %~nx0 start
    exit /b 1
)

docker restart "%CONTAINER_NAME%"
call :log_success "Container restarted"
timeout /t 3 /nobreak >nul
goto show_status

:remove_container
call :print_header
call :log_info "Removing container..."

docker ps -a --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if not errorlevel 1 (
    docker rm -f "%CONTAINER_NAME%"
    call :log_success "Container removed"
) else (
    call :log_warning "Container does not exist"
)
exit /b 0

:show_logs
docker ps -a --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if errorlevel 1 (
    call :log_error "Container does not exist"
    exit /b 1
)

set LINES=%2
if "%LINES%"=="" set LINES=50

if "%LINES%"=="follow" (
    docker logs -f "%CONTAINER_NAME%"
) else (
    docker logs --tail %LINES% "%CONTAINER_NAME%"
)
exit /b 0

:show_status
echo.
echo ================================================
echo   Service Status
echo ================================================

docker ps --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if not errorlevel 1 (
    echo Status: Running
) else (
    docker ps -a --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
    if not errorlevel 1 (
        echo Status: Stopped
    ) else (
        echo Status: Not Created
        exit /b 0
    )
)

echo.
echo Container: %CONTAINER_NAME%

for /f "tokens=*" %%i in ('docker ps -a --filter "name=^%CONTAINER_NAME%$" --format "{{.ID}}"') do set CONTAINER_ID=%%i
if not "!CONTAINER_ID!"=="" (
    echo ID: !CONTAINER_ID!
    for /f "tokens=*" %%i in ('docker ps --filter "name=^%CONTAINER_NAME%$" --format "{{.Status}}"') do set UPTIME=%%i
    if not "!UPTIME!"=="" (
        echo Uptime: !UPTIME!
    ) else (
        echo Uptime: Stopped
    )
)

echo.
echo URLs:
echo   API:         http://localhost:%PORT%
echo   Health:      http://localhost:%PORT%/health
echo   Docs:        http://localhost:%PORT%/docs
echo   Interactive: http://localhost:%PORT%/redoc
echo.

docker ps --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if not errorlevel 1 (
    echo Health Check:
    docker exec "%CONTAINER_NAME%" curl -s http://localhost:8000/health 2>nul
    echo.
)

echo.
echo Commands:
echo   View logs:  %~nx0 logs [lines]
echo   Follow:     %~nx0 logs follow
echo   Monitor:    %~nx0 monitor
echo   Restart:    %~nx0 restart
echo   Stop:       %~nx0 stop
echo ================================================
echo.
exit /b 0

:monitor_container
call :print_header
call :log_info "Monitoring container and GPU usage"
echo Press Ctrl+C to exit
echo.

docker ps --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if errorlevel 1 (
    call :log_error "Container is not running"
    exit /b 1
)

:monitor_loop
cls
echo === Container Stats ===
docker stats --no-stream %CONTAINER_NAME%
echo.
echo === GPU Usage ===
nvidia-smi --query-gpu=index,name,utilization.gpu,utilization.memory,memory.used,memory.total,temperature.gpu --format=csv,noheader
timeout /t 1 /nobreak >nul
goto monitor_loop

:run_shell
docker ps --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if errorlevel 1 (
    call :log_error "Container is not running"
    exit /b 1
)

call :log_info "Opening shell in container..."
docker exec -it "%CONTAINER_NAME%" /bin/bash
exit /b 0

:test_api
call :print_header
call :log_info "Testing API endpoints..."
echo.

docker ps --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if errorlevel 1 (
    call :log_error "Container is not running"
    exit /b 1
)

set BASE_URL=http://localhost:%PORT%

echo Testing root endpoint...
curl -s "%BASE_URL%/"
echo.
echo.

echo Testing health endpoint...
curl -s "%BASE_URL%/health"
echo.
echo.

call :log_success "API is responding"
echo.
echo Full API documentation: %BASE_URL%/docs
exit /b 0

:cleanup_docker
call :print_header
call :log_info "Cleaning up Docker resources..."
echo.

call :log_info "Removing stopped containers..."
docker container prune -f

call :log_info "Removing unused images..."
docker image prune -f

call :log_info "Removing unused volumes..."
docker volume prune -f

call :log_info "Removing unused networks..."
docker network prune -f

call :log_success "Cleanup completed"
exit /b 0

:full_rebuild
call :print_header
call :log_info "Performing full rebuild..."
echo.

call :system_check
if errorlevel 1 exit /b 1

docker ps -a --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>&1
if not errorlevel 1 (
    call :log_info "Removing existing container..."
    docker rm -f "%CONTAINER_NAME%"
)

call :build_image
if errorlevel 1 exit /b 1

goto start_container

:backup_models
call :print_header

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set BACKUP_FILE=models_backup_%mydate%_%mytime%.tar.gz

call :log_info "Creating backup: %BACKUP_FILE%"

if not exist "models" (
    call :log_warning "No models directory to backup"
    exit /b 0
)

tar -czf "%BACKUP_FILE%" models/

if errorlevel 1 (
    call :log_error "Backup failed"
    exit /b 1
)

call :log_success "Backup created: %BACKUP_FILE%"
exit /b 0

:restore_models
call :print_header

if "%2"=="" (
    call :log_error "Usage: %~nx0 restore <backup_file>"
    exit /b 1
)

set BACKUP_FILE=%2

if not exist "%BACKUP_FILE%" (
    call :log_error "Backup file not found: %BACKUP_FILE%"
    exit /b 1
)

call :log_info "Restoring from: %BACKUP_FILE%"

tar -xzf "%BACKUP_FILE%"

if errorlevel 1 (
    call :log_error "Restore failed"
    exit /b 1
)

call :log_success "Models restored"
exit /b 0

:show_help
echo Deep Live Cam - CUDA GPU Docker Manager v%VERSION%
echo.
echo Usage: %~nx0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo   check       Check system requirements and configuration
echo   build       Build the GPU-enabled Docker image
echo   start       Start the container
echo   stop        Stop the container
echo   restart     Restart the container
echo   remove      Remove the container
echo   rebuild     Full rebuild (remove + build + start)
echo.
echo   status      Show container status and information
echo   logs        Show container logs (default: 50 lines)
echo               Usage: %~nx0 logs [lines^|follow]
echo   monitor     Monitor container and GPU usage in real-time
echo   shell       Open bash shell in container
echo   test        Test API endpoints
echo.
echo   backup      Backup model files
echo   restore     Restore model files
echo               Usage: %~nx0 restore ^<backup_file^>
echo   cleanup     Clean up Docker resources
echo.
echo   help        Show this help message
echo.
echo Environment Variables:
echo   GPU_ID      Specify GPU device ID (default: 0)
echo               Usage: set GPU_ID=1 ^& %~nx0 start
echo.
echo Examples:
echo   %~nx0 check                    # Check system requirements
echo   %~nx0 rebuild                  # Full rebuild and start
echo   %~nx0 logs follow              # Follow logs in real-time
echo   %~nx0 monitor                  # Monitor GPU usage
echo   set GPU_ID=1 ^& %~nx0 start    # Use GPU 1
echo.
echo Documentation:
echo   GPU Quick Start:  GPU_QUICK_START.md
echo   Complete Guide:   BUILD_GPU.md
echo   Docker Guide:     README_DOCKER.md
echo.
exit /b 0
