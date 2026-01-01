# Quick Start Guide - Model Downloads

Having trouble with model downloads? This guide provides quick solutions.

## The Problem

When starting the backend for the first time, you may encounter:
```
AssertionError: assert 'detection' in self.models
```
or
```
RuntimeError: Failed downloading url https://github.com/.../inswapper_128.onnx.zip
```

## The Solution

### Step 1: Download Buffalo_l Models

Usually downloads automatically. If not:

```bash
cd backend
python download_models.py
```

If script fails, download manually:
- Visit: https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
- Extract to `backend/models/models/buffalo_l/`

### Step 2: Download Inswapper Model (REQUIRED)

This almost always requires manual download.

**Quick Fix (Recommended):**

1. **Download from Google Drive:**
   - Visit: https://drive.google.com/file/d/1HvZ4MAtzlY74Dk4ASGIS9L6Rg5oZdqvu/view
   - Click Download
   - File: inswapper_128.onnx (536 MB)

2. **Place the file:**
   ```
   backend/models/inswapper_128.onnx
   ```

3. **Verify placement:**
   ```bash
   cd backend
   python download_models.py --verify
   ```

**Alternative Download (Hugging Face):**
- Visit: https://huggingface.co/deepinsight/inswapper/tree/main
- Download inswapper_128.onnx
- Place in `backend/models/inswapper_128.onnx`

### Step 3: Start Backend

```bash
cd backend
python main.py
```

You should see:
```
Deep Live Cam - Face Processing API v2.0.0
Device: cpu (or cuda)
Initializing AI models...
  - InsightFace buffalo_l (Face Detection & Landmarks)
  - InsightFaceSwap inswapper_128 (Face Swapping)
  - GFPGAN v1.4 (Face Restoration)
  - RealESRGAN (Background Enhancement)
All models initialized successfully!
```

## Verification

After downloading models, verify they're in the right place:

```bash
cd backend
python download_models.py --verify
```

Expected output:
```
✓ Buffalo_l models found at: .../backend/models/models/buffalo_l/
  Found 5 ONNX model files:
    - 1k3d68.onnx
    - 2d106det.onnx
    - det_10g.onnx
    - genderage.onnx
    - w600k_r50.onnx

✓ Inswapper model found at: .../backend/models/inswapper_128.onnx
  Size: 536.00 MB

All required models verified successfully!
```

## Directory Structure

After successful setup:
```
backend/
├── models/
│   ├── models/
│   │   └── buffalo_l/
│   │       ├── 1k3d68.onnx
│   │       ├── 2d106det.onnx
│   │       ├── det_10g.onnx
│   │       ├── genderage.onnx
│   │       └── w600k_r50.onnx
│   └── inswapper_128.onnx      (536 MB) ← Most important!
```

## Still Having Issues?

### Check disk space:
```bash
df -h .
```
Need ~3GB free space

### Check internet connection:
```bash
curl -I https://github.com
```

### Check file permissions:
```bash
ls -la backend/models/
```

Should be writable by your user

## Complete Documentation

For detailed information:
- **MODELS.md** - Complete model documentation with all download links
- **README.md** - Full backend setup and API documentation
- **BACKEND_SETUP.md** - Step-by-step backend setup guide
- **APPLE_SILICON_SETUP.md** - Mac-specific instructions

## Get Help

If you're still stuck after following this guide:
1. Verify your directory structure matches above
2. Check the console output for specific error messages
3. Try running `python download_models.py --verify`
4. Check that inswapper_128.onnx is exactly 536 MB

The most common issue is simply forgetting to download inswapper_128.onnx manually!
