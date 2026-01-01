# Windows GPU Setup Guide - CUDA Installation

This guide walks you through setting up GPU acceleration on Windows for 2-5x faster face processing.

## Benefits of GPU Acceleration

**Performance Comparison:**
- **CPU Processing:** 3-5 seconds per face swap, 4-6 seconds for restoration
- **GPU Processing:** 0.5-1 second per face swap, 0.8-1.5 seconds for restoration

**GPU acceleration is highly recommended for production use.**

## Prerequisites

### 1. Check Your GPU

You need an NVIDIA GPU with CUDA support.

**Check your GPU:**
1. Press `Win + R`
2. Type `dxdiag` and press Enter
3. Click "Display" tab
4. Look for your graphics card name

**Supported GPUs:**
- GeForce GTX 900 series or newer (GTX 960, 970, 980, 1050, 1060, 1070, 1080, etc.)
- GeForce RTX series (RTX 2060, 2070, 2080, 3060, 3070, 3080, 3090, 4060, 4070, 4080, 4090)
- Quadro and Tesla series

**Minimum Requirements:**
- NVIDIA GPU with Compute Capability 3.5+
- 4GB+ VRAM (6GB+ recommended)
- Windows 10/11 64-bit

**Check CUDA compatibility:**
Visit: https://developer.nvidia.com/cuda-gpus
Find your GPU and note its Compute Capability.

### 2. Update Graphics Drivers

**Before installing CUDA, update your NVIDIA drivers:**

1. Visit: https://www.nvidia.com/Download/index.aspx
2. Select your GPU model
3. Download and install the latest Game Ready or Studio driver
4. Restart your computer

**Or use GeForce Experience:**
1. Download: https://www.nvidia.com/en-us/geforce/geforce-experience/
2. Install and open GeForce Experience
3. Click "Drivers" tab
4. Click "Check for updates"
5. Download and install latest driver

## Step-by-Step Installation

### Step 1: Install CUDA Toolkit 11.8

**Why CUDA 11.8?**
PyTorch 2.1.2 (used by this project) is built for CUDA 11.8, providing optimal compatibility.

**Download CUDA Toolkit:**
1. Visit: https://developer.nvidia.com/cuda-11-8-0-download-archive
2. Select:
   - Operating System: Windows
   - Architecture: x86_64
   - Version: 10 or 11 (your Windows version)
   - Installer Type: exe (network) - recommended for smaller download

**Install CUDA:**
1. Run the downloaded installer (cuda_11.8.0_windows_network.exe)
2. Choose "Express Installation" (recommended)
3. Wait for installation (5-15 minutes)
4. Restart your computer when prompted

**Installation Size:** ~3-4 GB

**Installation Location:**
Default: `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8`

### Step 2: Verify CUDA Installation

**Open Command Prompt and check CUDA:**
```cmd
nvcc --version
```

Expected output:
```
Cuda compilation tools, release 11.8, V11.8.89
Build cuda_11.8.r11.8/compiler.31833905_0
```

**Check NVIDIA SMI:**
```cmd
nvidia-smi
```

You should see:
- Your GPU name
- Driver version
- CUDA version
- GPU memory

### Step 3: Install cuDNN (Optional but Recommended)

cuDNN accelerates deep learning operations.

**Download cuDNN:**
1. Visit: https://developer.nvidia.com/cudnn
2. Click "Download cuDNN"
3. Create/login to NVIDIA Developer account (free)
4. Download "cuDNN v8.9.7 for CUDA 11.x" (ZIP file)

**Install cuDNN:**
1. Extract the downloaded ZIP file
2. Copy files to CUDA installation directory:
   ```
   From cuDNN\bin\*.dll → C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin\
   From cuDNN\include\*.h → C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\include\
   From cuDNN\lib\*.lib → C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\lib\x64\
   ```
3. You may need administrator permissions to copy files

### Step 4: Set Environment Variables

**CUDA should set these automatically, but verify:**

1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Click "Advanced" tab
3. Click "Environment Variables"
4. Under "System variables", check for:

**Path should include:**
```
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\libnvvp
```

**CUDA_PATH should be:**
```
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8
```

If missing, add them manually.

### Step 5: Install Python with GPU Support

**Set up Python environment:**

```cmd
cd backend
python -m venv venv
venv\Scripts\activate
```

**Install PyTorch with CUDA 11.8:**
```cmd
pip install torch==2.1.2 torchvision==0.16.2 torchaudio==2.1.2 --index-url https://download.pytorch.org/whl/cu118
```

This downloads PyTorch with CUDA support (~2.5 GB).

**Install remaining requirements:**
```cmd
pip install -r requirements.txt
```

### Step 6: Verify GPU Support in Python

**Create a test script:**
```cmd
python -c "import torch; print('CUDA Available:', torch.cuda.is_available()); print('CUDA Version:', torch.version.cuda); print('GPU Name:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A')"
```

Expected output:
```
CUDA Available: True
CUDA Version: 11.8
GPU Name: NVIDIA GeForce RTX 3080
```

### Step 7: Start Backend with GPU

```cmd
python main.py
```

**Check the startup logs for:**
```
Device: cuda
CUDA available: True
Using GPU: NVIDIA GeForce RTX 3080
```

**Test the API:**
```cmd
curl http://localhost:8000/health
```

Look for:
```json
{
  "status": "healthy",
  "device": "cuda",
  "cuda_available": true,
  "gpu_name": "NVIDIA GeForce RTX 3080"
}
```

## Troubleshooting

### Issue 1: "CUDA Available: False"

**Possible Causes & Solutions:**

**A) Wrong PyTorch Version**
```cmd
pip uninstall torch torchvision torchaudio
pip install torch==2.1.2 torchvision==0.16.2 torchaudio==2.1.2 --index-url https://download.pytorch.org/whl/cu118
```

**B) CUDA Not in PATH**
Add to System PATH:
```
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin
```

**C) Outdated GPU Driver**
Update to latest driver from NVIDIA website.

**D) GPU Not Compatible**
Check GPU compute capability at: https://developer.nvidia.com/cuda-gpus

### Issue 2: "RuntimeError: CUDA out of memory"

**Solutions:**

**A) Reduce Image Size**
Resize images to max 1024x1024 before processing.

**B) Process One at a Time**
Don't process multiple images simultaneously.

**C) Close Other GPU Applications**
Close games, video editors, or other GPU-intensive apps.

**D) Reduce Batch Size**
In model settings, reduce batch processing size.

**E) Use CPU for Some Operations**
Set environment variable:
```cmd
set PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

### Issue 3: "DLL load failed" or Missing DLL Errors

**Solutions:**

**A) Install Visual C++ Redistributables**
Download and install:
- Visual C++ 2015-2022 Redistributable (x64)
- Link: https://aka.ms/vs/17/release/vc_redist.x64.exe

**B) Reinstall CUDA**
Uninstall CUDA from Control Panel, then reinstall.

**C) Check cuDNN Installation**
Verify cuDNN DLLs are in `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin\`

### Issue 4: "nvcc not found"

**Solution:**
CUDA bin folder not in PATH. Add to System PATH:
```
C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8\bin
```

Then restart Command Prompt.

### Issue 5: Performance Not Improved

**Check:**

**A) Verify GPU is Being Used**
```cmd
nvidia-smi
```
While processing, GPU usage should be 50-100%.

**B) Check Backend Logs**
Look for "Using device: cuda" in startup logs.

**C) Monitoring GPU Usage**
Open Task Manager → Performance → GPU
Should show activity during processing.

### Issue 6: Multiple CUDA Versions Installed

**If you have multiple CUDA versions:**

1. Uninstall all CUDA versions from Control Panel
2. Delete folders:
   ```
   C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\
   ```
3. Reinstall only CUDA 11.8

## Performance Optimization Tips

### 1. Optimal GPU Settings

**For Best Performance:**
- Keep GPU drivers updated
- Close unnecessary applications
- Enable "High Performance" power plan in Windows
- Disable Windows Game Mode (can interfere with CUDA)

**Windows Power Plan:**
1. Control Panel → Power Options
2. Select "High performance"

**Disable Game Mode:**
1. Settings → Gaming → Game Mode
2. Turn OFF

### 2. GPU Memory Management

**Monitor GPU Memory:**
```cmd
nvidia-smi -l 1
```
Shows GPU usage updating every second.

**Free GPU Memory Between Operations:**
The backend automatically clears GPU cache, but you can force it:
```python
import torch
torch.cuda.empty_cache()
```

### 3. Batch Processing

For multiple images:
- Process sequentially, not in parallel
- Allow 1-2 seconds between operations
- Monitor GPU memory usage

## Hardware Recommendations

### Minimum Specs:
- GPU: GTX 1060 6GB or RTX 2060
- RAM: 8GB
- Storage: 20GB free (for models)
- PSU: 450W+

### Recommended Specs:
- GPU: RTX 3060 12GB or better
- RAM: 16GB
- Storage: 50GB free (SSD)
- PSU: 650W+

### Optimal Specs:
- GPU: RTX 3080/3090 or RTX 4070/4080
- RAM: 32GB
- Storage: 100GB free (NVMe SSD)
- PSU: 750W+

## Alternative: Windows Subsystem for Linux (WSL2)

For advanced users, WSL2 with CUDA support is an option:

**Benefits:**
- Native Linux environment
- Better performance in some cases
- Easier to manage dependencies

**Requirements:**
- Windows 10 version 21H2+ or Windows 11
- WSL2 with GPU support

**Setup Guide:**
https://docs.nvidia.com/cuda/wsl-user-guide/index.html

## Automated Setup Script

**Save as `setup_gpu.bat`:**

```batch
@echo off
echo Checking CUDA installation...
nvcc --version
if %errorlevel% neq 0 (
    echo CUDA not found! Please install CUDA 11.8 first.
    echo Download from: https://developer.nvidia.com/cuda-11-8-0-download-archive
    pause
    exit /b 1
)

echo.
echo Creating virtual environment...
python -m venv venv

echo.
echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo Installing PyTorch with CUDA support...
pip install torch==2.1.2 torchvision==0.16.2 torchaudio==2.1.2 --index-url https://download.pytorch.org/whl/cu118

echo.
echo Installing other requirements...
pip install -r requirements.txt

echo.
echo Verifying GPU support...
python -c "import torch; print('CUDA Available:', torch.cuda.is_available()); print('GPU Name:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A')"

echo.
echo Setup complete! Start the backend with: python main.py
pause
```

**Run the script:**
```cmd
cd backend
setup_gpu.bat
```

## Verification Checklist

Before starting the backend, verify:

- [ ] NVIDIA GPU driver installed and updated
- [ ] CUDA Toolkit 11.8 installed
- [ ] `nvcc --version` shows CUDA 11.8
- [ ] `nvidia-smi` shows your GPU
- [ ] cuDNN installed (optional but recommended)
- [ ] PyTorch with CUDA 11.8 installed
- [ ] `torch.cuda.is_available()` returns True
- [ ] All required Python packages installed

## Getting Help

**Check CUDA Installation:**
```cmd
nvcc --version
nvidia-smi
where nvcc
```

**Check PyTorch CUDA:**
```cmd
python -c "import torch; print(torch.__version__); print(torch.version.cuda); print(torch.cuda.is_available())"
```

**Check Backend Logs:**
Look for device information at startup:
```
Device: cuda
CUDA available: True
GPU: NVIDIA GeForce RTX 3080
```

**Common Resources:**
- NVIDIA CUDA Documentation: https://docs.nvidia.com/cuda/
- PyTorch CUDA Setup: https://pytorch.org/get-started/locally/
- NVIDIA Developer Forums: https://forums.developer.nvidia.com/

## Next Steps

After GPU setup:
1. Download models (see QUICK_START.md)
2. Start backend: `python main.py`
3. Verify GPU usage with `nvidia-smi`
4. Test face swap API
5. Monitor performance improvements

GPU acceleration provides significant performance improvements, especially for GFPGAN face restoration!
