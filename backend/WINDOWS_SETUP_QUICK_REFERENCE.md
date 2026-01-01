# Windows Setup - Quick Reference

Quick reference for setting up Deep Live Cam backend on Windows.

## Choose Your Setup Path

### Path 1: CPU Only (Simplest)
**Best for:** Testing, no NVIDIA GPU, or quick setup

**Time:** 5-10 minutes

**Steps:**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Performance:** 3-5 seconds per face swap

---

### Path 2: GPU Accelerated (Recommended)
**Best for:** Production use, NVIDIA GPU owners

**Time:** 30-45 minutes (first time)

**Requirements:**
- NVIDIA GPU (GTX 900+ or RTX series)
- CUDA Toolkit 11.8
- Updated NVIDIA drivers

**Steps:**
1. Install CUDA: [Download](https://developer.nvidia.com/cuda-11-8-0-download-archive)
2. Run automated setup:
   ```cmd
   cd backend
   setup_gpu.bat
   ```
3. Start backend:
   ```cmd
   python main.py
   ```

**Performance:** 0.5-1 second per face swap (2-5x faster)

**Detailed Guide:** See [WINDOWS_GPU_SETUP.md](WINDOWS_GPU_SETUP.md)

---

### Path 3: Docker (Production)
**Best for:** Deployment, isolated environment

**Requirements:**
- Docker Desktop for Windows
- 8GB+ RAM

**Steps:**
```cmd
cd backend
docker-compose up -d
```

**Note:** GPU support in Docker on Windows requires additional configuration

---

## Model Downloads

**All paths require downloading AI models:**

### Quick Fix for Most Common Issue

The inswapper model usually fails to download automatically:

1. **Download manually:**
   - Google Drive: https://drive.google.com/file/d/1HvZ4MAtzlY74Dk4ASGIS9L6Rg5oZdqvu/view
   - File size: 536 MB

2. **Place in:**
   ```
   backend\models\inswapper_128.onnx
   ```

3. **Verify:**
   ```cmd
   cd backend
   python download_models.py --verify
   ```

**Full Guide:** See [QUICK_START.md](QUICK_START.md)

---

## Verification Commands

### Check GPU Setup (if using GPU):
```cmd
cd backend
python verify_gpu.py
```

### Check Models:
```cmd
cd backend
python download_models.py --verify
```

### Check Backend Health:
```cmd
curl http://localhost:8000/health
```

---

## Common Issues & Quick Fixes

### Issue: "Python not found"
**Fix:** Install Python 3.10+ from [python.org](https://www.python.org/downloads/)
- Check "Add Python to PATH" during installation

### Issue: "CUDA Available: False" (GPU setup)
**Fix 1:** Reinstall PyTorch with CUDA:
```cmd
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118
```

**Fix 2:** Check CUDA installation:
```cmd
nvcc --version
nvidia-smi
```

### Issue: "Could not load face swapper model"
**Fix:** Download inswapper_128.onnx manually (see Model Downloads above)

### Issue: "DLL load failed"
**Fix:** Install Visual C++ Redistributables:
- Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
- Install and restart

### Issue: "Port 8000 already in use"
**Fix:** Kill process using port:
```cmd
netstat -ano | findstr :8000
taskkill /PID <process_id> /F
```

---

## File Structure After Setup

```
backend/
├── venv/                           (virtual environment)
├── models/
│   ├── models/
│   │   └── buffalo_l/              (5 ONNX files, auto-downloads)
│   └── inswapper_128.onnx          (536 MB, manual download)
├── main.py
├── requirements.txt
├── setup_gpu.bat                   (GPU setup script)
├── verify_gpu.py                   (verification script)
└── download_models.py              (model download script)
```

---

## Performance Comparison

| Setup | Face Swap | Restoration | Recommended For |
|-------|-----------|-------------|----------------|
| CPU | 3-5 sec | 4-6 sec | Testing, no GPU |
| GPU (GTX 1060) | 1-2 sec | 2-3 sec | Entry-level GPU |
| GPU (RTX 3060) | 0.5-1 sec | 1-2 sec | Mid-range GPU |
| GPU (RTX 3080+) | 0.3-0.5 sec | 0.8-1 sec | High-end GPU |

---

## Next Steps After Setup

1. **Start Backend:**
   ```cmd
   cd backend
   venv\Scripts\activate  # if not already activated
   python main.py
   ```

2. **Start Frontend:**
   ```cmd
   npm run dev
   ```

3. **Open Browser:**
   ```
   http://localhost:5173
   ```

4. **Test Face Swap:**
   - Click "Backend Swap" tab
   - Upload source face
   - Upload target image
   - Click "Swap Face"

---

## Documentation Links

- **Complete GPU Setup:** [WINDOWS_GPU_SETUP.md](WINDOWS_GPU_SETUP.md)
- **Model Download Guide:** [QUICK_START.md](QUICK_START.md)
- **General Backend Setup:** [README.md](README.md)
- **Model Documentation:** [MODELS.md](MODELS.md)
- **API Documentation:** http://localhost:8000/docs (when running)

---

## Getting Help

**Before asking for help, try:**
1. Run verification: `python verify_gpu.py`
2. Check models: `python download_models.py --verify`
3. Check health: `curl http://localhost:8000/health`
4. Read error messages carefully
5. Check the relevant documentation file

**Provide when asking for help:**
- Output of `python verify_gpu.py`
- Output of `python download_models.py --verify`
- Full error message
- Your Windows version
- GPU model (if using GPU)

---

## Quick Command Reference

```cmd
# Activate environment
cd backend
venv\Scripts\activate

# Install/Update packages
pip install -r requirements.txt

# Download models
python download_models.py

# Verify GPU (if using GPU)
python verify_gpu.py

# Start backend
python main.py

# Check health
curl http://localhost:8000/health

# Deactivate environment
deactivate
```

---

**Remember:** The most common issue is the inswapper model not downloading automatically. Download it manually from Google Drive first!
