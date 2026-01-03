@echo off
echo Stopping and removing old container...
docker stop deep-live-cam-gpu 2>nul
docker rm deep-live-cam-gpu 2>nul

echo Building GPU Docker image...
docker build -f Dockerfile.cuda -t deep-live-cam-gpu:latest .

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful! Starting container...
    docker run -d --gpus all --name deep-live-cam-gpu -p 8000:8000 -v "%CD%/models:/app/models" -e MODEL_PATH=/app/models deep-live-cam-gpu:latest

    echo.
    echo Container started. Checking logs...
    timeout /t 3 /nobreak >nul
    docker logs deep-live-cam-gpu

    echo.
    echo To view live logs: docker logs -f deep-live-cam-gpu
    echo To check status: docker ps
) else (
    echo Build failed!
)
