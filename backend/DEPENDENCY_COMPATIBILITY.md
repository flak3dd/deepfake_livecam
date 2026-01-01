# Dependency Compatibility Guide

This document outlines compatibility requirements, known issues, and solutions for Deep Live Cam backend dependencies.

## Critical Version Requirements

### NumPy - MOST CRITICAL

**Required Version:** `numpy==1.24.3`

**Why This Exact Version?**
- InsightFace 0.7.3 requires NumPy < 1.25
- GFPGAN 1.3.8 requires NumPy < 1.25
- BasicSR 1.4.2 has issues with NumPy >= 1.25
- PyTorch 2.1.2 is compatible with NumPy 1.24.x

**Problems with Wrong Version:**
```
NumPy 1.25+: ImportError, AttributeError with InsightFace
NumPy < 1.24: Compatibility issues with PyTorch
```

**Fix:**
```bash
pip install numpy==1.24.3
```

### PyTorch - CRITICAL

**Required Versions:**
- `torch==2.1.2`
- `torchvision==0.16.2`

**CUDA Version:** CUDA 11.8 (for GPU)

**Why These Versions?**
- GFPGAN requires PyTorch >= 2.0
- Compatible with CUDA 11.8
- Stable with NumPy 1.24.3
- Works with all face processing libraries

**CPU Installation:**
```bash
pip install torch==2.1.2 torchvision==0.16.2
```

**GPU Installation (CUDA 11.8):**
```bash
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118
```

**Common Issues:**
- Installing CPU version when GPU version needed
- Wrong CUDA version (cu117, cu121, etc.)
- Version mismatch between torch and torchvision

### ONNX Runtime - CRITICAL

**Required Version:** `onnxruntime==1.16.3` OR `onnxruntime-gpu==1.16.3`

**NEVER install both** - they conflict with each other

**For CPU:**
```bash
pip install onnxruntime==1.16.3
```

**For GPU (CUDA 11.8):**
```bash
pip uninstall onnxruntime  # Remove CPU version first
pip install onnxruntime-gpu==1.16.3
```

**Why This Version?**
- Compatible with InsightFace 0.7.3
- Works with CUDA 11.8
- Stable performance

## GFPGAN Stack - Installation Order Matters

**CRITICAL: Install in this exact order:**

1. **BasicSR** (foundation library)
   ```bash
   pip install basicsr==1.4.2
   ```

2. **Facexlib** (depends on BasicSR)
   ```bash
   pip install facexlib==0.3.0
   ```

3. **GFPGAN** (depends on both above)
   ```bash
   pip install gfpgan==1.3.8
   ```

4. **RealESRGAN** (optional, for upscaling)
   ```bash
   pip install realesrgan==0.3.0
   ```

**Why Order Matters?**
- Each package modifies the dependency tree
- Installing out of order causes version conflicts
- pip may downgrade/upgrade incompatible versions

**If Already Installed Incorrectly:**
```bash
pip uninstall basicsr facexlib gfpgan realesrgan -y
pip install basicsr==1.4.2
pip install facexlib==0.3.0
pip install gfpgan==1.3.8
pip install realesrgan==0.3.0
```

## Additional Required Dependencies

Beyond the core AI packages, several supporting libraries are required for proper functionality:

### Core Support Libraries

**lmdb** (>=1.4.0) - Lightning Memory-Mapped Database
- Required by BasicSR and GFPGAN for dataset handling and model caching
- Essential for efficient model loading and data management

**pyyaml** (>=6.0) - YAML Parser
- Configuration file parsing used by BasicSR, GFPGAN, and FaceXLib
- Required for loading model configuration files

**requests** (>=2.28.0) - HTTP Library
- Used for downloading models from remote servers
- Essential for automatic model downloads

**addict** (>=2.4.0) - Dictionary Enhancement
- Dictionary subclass for easier configuration management in BasicSR
- Allows dot-notation access to nested dictionaries

**future** (>=0.18.0) - Python 2/3 Compatibility
- Required by some legacy dependencies
- Ensures compatibility across Python versions

### Image Processing & Enhancement

**filterpy** (>=1.4.5) - Kalman Filtering
- Used for face tracking smoothing and temporal consistency
- Improves video processing quality

**scikit-image** (>=0.19.0) - Image Processing
- Advanced image processing algorithms
- Used by GFPGAN and BasicSR for various transformations

**scipy** (>=1.9.0) - Scientific Computing
- Required by scikit-image and image processing operations
- Provides mathematical functions for image enhancement

### Model Format & Optimization

**onnx** (>=1.14.0) - ONNX Model Format
- Support for ONNX model format and optimizations
- Required for model inspection and validation

**protobuf** (>=3.20.0) - Protocol Buffers
- Serialization format used by ONNX Runtime and TensorFlow
- Required for model loading and inference

### Web Framework Support

**aiofiles** (>=23.1.0) - Async File Operations
- Enables asynchronous file operations in FastAPI
- Improves performance when handling large images/videos

### Development & Debugging

**tqdm** (>=4.64.0) - Progress Bars
- Visual progress indicators for long operations
- Used during model training and batch processing

**yapf** (>=0.32.0) - Code Formatter
- Python code formatter
- Required by some development tools

**tb-nightly** (>=2.12.0) - TensorBoard
- Training visualization and logging
- Used by BasicSR and GFPGAN for monitoring

### Installation Note

These dependencies are typically installed automatically as transitive dependencies when you install the main packages. However, explicitly listing them in requirements.txt ensures:
- Version compatibility across the stack
- Prevents installation issues
- Makes dependencies explicit for troubleshooting
- Ensures consistent environments across setups

## Known Compatibility Issues

### Issue 1: NumPy Version Conflicts

**Symptom:**
```
AttributeError: module 'numpy' has no attribute 'float'
ImportError: cannot import name 'int' from 'numpy'
```

**Cause:**
NumPy 1.25+ removed deprecated aliases (`numpy.float`, `numpy.int`, etc.)

**Solution:**
```bash
pip install numpy==1.24.3
```

### Issue 2: InsightFace Import Errors

**Symptom:**
```
ImportError: cannot import name 'FACE_SWAPPER' from 'insightface'
ModuleNotFoundError: No module named 'insightface.model_zoo'
```

**Cause:**
- Wrong InsightFace version
- NumPy version incompatibility
- Missing ONNX Runtime

**Solution:**
```bash
pip install insightface==0.7.3
pip install numpy==1.24.3
pip install onnxruntime==1.16.3
```

### Issue 3: GFPGAN Runtime Errors

**Symptom:**
```
RuntimeError: Numpy is not available
AttributeError: module 'cv2' has no attribute 'face'
```

**Cause:**
- Wrong installation order
- Incompatible OpenCV version
- NumPy version issue

**Solution:**
```bash
pip uninstall gfpgan basicsr facexlib -y
pip install opencv-python==4.9.0.80
pip install numpy==1.24.3
pip install basicsr==1.4.2
pip install facexlib==0.3.0
pip install gfpgan==1.3.8
```

### Issue 4: PyTorch CUDA Not Available

**Symptom:**
```python
torch.cuda.is_available() # Returns False
```

**Cause:**
- CPU version of PyTorch installed
- Wrong CUDA version
- CUDA not installed on system

**Solution:**
```bash
# Uninstall CPU version
pip uninstall torch torchvision

# Install GPU version
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118
```

**Verify:**
```python
import torch
print(torch.cuda.is_available())  # Should be True
print(torch.version.cuda)         # Should be 11.8
```

### Issue 5: ONNX Runtime Conflicts

**Symptom:**
```
ImportError: DLL load failed while importing onnxruntime
Multiple providers detected
```

**Cause:**
Both `onnxruntime` and `onnxruntime-gpu` installed

**Solution:**
```bash
pip uninstall onnxruntime onnxruntime-gpu -y
# For CPU:
pip install onnxruntime==1.16.3
# OR for GPU:
pip install onnxruntime-gpu==1.16.3
```

### Issue 6: Pillow Compatibility

**Symptom:**
```
ImportError: cannot import name 'ANTIALIAS' from 'PIL'
```

**Cause:**
Pillow 10.0+ removed `ANTIALIAS` alias (use `LANCZOS` instead)

**Solution:**
```bash
pip install pillow==10.2.0
```

## Model Hash Verification

### Why Hash Verification Matters

**Problems Without Hash Verification:**
- Corrupted downloads go undetected
- Partial downloads cause runtime errors
- Wrong models produce incorrect results
- Security risk from tampered files

### Expected Model Hashes (SHA256)

**inswapper_128.onnx:**
```
Hash: e4a3f08c753cb72d04e10aa0f7dbe3deebbf39567d4ead6dce08e98aa49e16af
Size: ~536 MB
```

**Buffalo_l models:**
```
1k3d68.onnx:     df5c06b8a0c12e422b2ed8947b8869faa4105387f199c477af038aa01f9a45cc
2d106det.onnx:   5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91
det_10g.onnx:    5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91
genderage.onnx:  4fde69b1c810857b88c64a335084f1c3fe8f01246c9a191b48c7bb756d6652fb
w600k_r50.onnx:  4c06341c33c2ca1f86781dab0e829f88ad5b64be9fba56e56bc9ebdefc619e43
```

### Verify Model Hashes

**Run verification:**
```bash
python download_models.py --verify
```

**Manual verification (Python):**
```python
import hashlib

def verify_hash(file_path, expected_hash):
    sha256 = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for block in iter(lambda: f.read(4096), b""):
            sha256.update(block)
    actual = sha256.hexdigest()
    return actual == expected_hash

# Example
result = verify_hash('models/inswapper_128.onnx',
                     'e4a3f08c753cb72d04e10aa0f7dbe3deebbf39567d4ead6dce08e98aa49e16af')
print(f"Hash valid: {result}")
```

### What If Hash Doesn't Match?

**If verification fails:**
1. **Delete the corrupted file**
2. **Re-download from official source:**
   - Google Drive: https://drive.google.com/file/d/1HvZ4MAtzlY74Dk4ASGIS9L6Rg5oZdqvu/view
   - Hugging Face: https://huggingface.co/deepinsight/inswapper
3. **Verify hash again**
4. **Never use unverified models in production**

## Recommended Installation Procedure

### Fresh Installation (Recommended)

**Step 1: Create Virtual Environment**
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

**Step 2: Upgrade pip**
```bash
python -m pip install --upgrade pip
```

**Step 3: Install Core Dependencies First**
```bash
pip install numpy==1.24.3
pip install pillow==10.2.0
```

**Step 4: Install PyTorch**

CPU:
```bash
pip install torch==2.1.2 torchvision==0.16.2
```

GPU (CUDA 11.8):
```bash
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118
```

**Step 5: Install ONNX Runtime**

CPU:
```bash
pip install onnxruntime==1.16.3
```

GPU:
```bash
pip install onnxruntime-gpu==1.16.3
```

**Step 6: Install Remaining Dependencies**
```bash
pip install -r requirements.txt
```

**Step 7: Verify Installation**
```bash
python check_dependencies.py
```

**Step 8: Download and Verify Models**
```bash
python download_models.py
python download_models.py --verify
```

### Troubleshooting Installation

**If something goes wrong during installation:**

1. **Check for conflicts:**
   ```bash
   pip check
   ```

2. **Run dependency checker:**
   ```bash
   python check_dependencies.py
   ```

3. **If many errors, start fresh:**
   ```bash
   deactivate
   rm -rf venv  # Linux/Mac
   rmdir /s venv  # Windows
   # Then follow Fresh Installation steps
   ```

## Platform-Specific Notes

### Windows

**Visual C++ Redistributables Required:**
- Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
- Required for ONNX Runtime and other C++ extensions

**GPU Setup:**
- See [WINDOWS_GPU_SETUP.md](WINDOWS_GPU_SETUP.md)
- Requires CUDA Toolkit 11.8
- Updated NVIDIA drivers

### Linux

**System Dependencies:**
```bash
sudo apt-get update
sudo apt-get install -y \
    python3-dev \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev
```

### macOS (Intel)

**System Dependencies:**
```bash
brew install python@3.10
```

**Note:** CUDA not available on macOS

### macOS (Apple Silicon)

**Metal Acceleration:**
- See [APPLE_SILICON_SETUP.md](APPLE_SILICON_SETUP.md)
- Use PyTorch with MPS backend
- Limited InsightFace support

## Verification Tools

### Check Dependencies
```bash
python check_dependencies.py
```

**Checks:**
- Package versions
- Version compatibility
- Import tests
- Dependency conflicts

### Verify Models
```bash
python download_models.py --verify
```

**Checks:**
- Model file presence
- File sizes
- SHA256 hashes
- Model integrity

### Verify GPU Setup
```bash
python verify_gpu.py
```

**Checks:**
- CUDA installation
- PyTorch CUDA support
- GPU detection
- Performance test

## Quick Reference

### Check Installed Versions
```bash
pip list | grep -E "(torch|numpy|insightface|gfpgan|onnx)"
```

### Verify Specific Package
```bash
python -c "import package; print(package.__version__)"
```

### Test GPU Support
```bash
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"
```

### Check for Conflicts
```bash
pip check
```

### Show Package Dependencies
```bash
pip show package-name
```

## Getting Help

**Before asking for help, run:**
```bash
python check_dependencies.py > dependencies.txt
python download_models.py --verify > models.txt
pip list > packages.txt
```

**Provide these files along with:**
- Python version: `python --version`
- Operating system
- Error messages (full traceback)
- What you were trying to do

## Additional Resources

- **PyTorch Installation:** https://pytorch.org/get-started/locally/
- **CUDA Toolkit:** https://developer.nvidia.com/cuda-toolkit
- **InsightFace:** https://github.com/deepinsight/insightface
- **GFPGAN:** https://github.com/TencentARC/GFPGAN
- **ONNX Runtime:** https://onnxruntime.ai/

## Summary

**Critical Points:**
1. ✓ NumPy 1.24.3 is MANDATORY
2. ✓ Install PyTorch before other ML libraries
3. ✓ Install GFPGAN stack in correct order
4. ✓ Never install both onnxruntime and onnxruntime-gpu
5. ✓ Always verify model hashes
6. ✓ Use virtual environment
7. ✓ Run verification tools

**If in doubt, follow the Fresh Installation procedure exactly as written.**
