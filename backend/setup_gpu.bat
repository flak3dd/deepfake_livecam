@echo off
echo ============================================================
echo Windows GPU Setup Script for Deep Live Cam Backend
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/6] Checking CUDA installation...
nvcc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo WARNING: CUDA not found!
    echo.
    echo Please install CUDA Toolkit 11.8:
    echo https://developer.nvidia.com/cuda-11-8-0-download-archive
    echo.
    echo After installing CUDA, run this script again.
    echo.
    pause
    exit /b 1
) else (
    nvcc --version | findstr "11.8" >nul
    if %errorlevel% neq 0 (
        echo.
        echo WARNING: CUDA 11.8 not detected!
        nvcc --version
        echo.
        echo This project requires CUDA 11.8 for compatibility with PyTorch 2.1.2
        echo.
        set /p continue="Continue anyway? (y/n): "
        if /i not "%continue%"=="y" exit /b 1
    ) else (
        echo CUDA 11.8 detected - OK
    )
)

echo.
echo [2/6] Checking NVIDIA GPU...
nvidia-smi >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: nvidia-smi not found!
    echo Please update your NVIDIA drivers from:
    echo https://www.nvidia.com/Download/index.aspx
    pause
    exit /b 1
) else (
    echo GPU detected:
    nvidia-smi --query-gpu=name --format=csv,noheader
)

echo.
echo [3/6] Creating virtual environment...
if exist venv (
    echo Virtual environment already exists.
    set /p recreate="Recreate? (y/n): "
    if /i "%recreate%"=="y" (
        echo Removing old virtual environment...
        rmdir /s /q venv
        python -m venv venv
    )
) else (
    python -m venv venv
)

echo.
echo [4/6] Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo [5/7] Installing core dependencies first (for compatibility)...
pip install numpy==1.24.3 pillow==10.2.0
if %errorlevel% neq 0 (
    echo ERROR: Failed to install core dependencies
    pause
    exit /b 1
)

echo.
echo [6/7] Installing PyTorch with CUDA 11.8 support...
echo This will download ~2.5GB and may take 5-10 minutes...
echo.
pip install torch==2.1.2 torchvision==0.16.2 torchaudio==2.1.2 --index-url https://download.pytorch.org/whl/cu118
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install PyTorch with CUDA support
    pause
    exit /b 1
)

echo.
echo [7/7] Installing other requirements...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install requirements
    echo This might be due to dependency conflicts.
    echo Run: python check_dependencies.py for details
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Verifying GPU support...
echo ============================================================
python -c "import torch; print(''); print('CUDA Available:', torch.cuda.is_available()); print('PyTorch Version:', torch.__version__); print('CUDA Version:', torch.version.cuda if torch.cuda.is_available() else 'N/A'); print('GPU Count:', torch.cuda.device_count() if torch.cuda.is_available() else 0); print('GPU Name:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A'); print('')"

echo.
echo Checking dependencies for conflicts...
python check_dependencies.py
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Some dependency issues detected.
    echo See output above for details.
    echo.
)

echo.
echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
echo Next steps:
echo 1. Download models (see QUICK_START.md)
echo 2. Run: python main.py
echo 3. Backend will start at http://localhost:8000
echo.
echo To activate this environment in the future:
echo   cd backend
echo   venv\Scripts\activate
echo.
pause
