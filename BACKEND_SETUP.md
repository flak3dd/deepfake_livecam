# Python Backend Setup Guide - Advanced AI Models

This guide will help you set up the Python backend with professional AI models for high-quality face swapping and restoration.

## AI Models Included

The backend uses state-of-the-art AI models:

### Face Detection & Analysis
- **InsightFace buffalo_l** - Multi-task face detection
- **CenterFace** - Robust face localization
- **FaceMesh** - 468-point facial landmarks
- **FaceMarkerLBF** - Additional landmark precision

### Face Swapping
- **InsightFaceSwap (inswapper_128.onnx)** - Professional face swapping
- **ONNX Runtime** - Optimized inference

### Face Restoration
- **GFPGAN v1.4** - Generative face restoration GAN
- **RealESRGAN** - Background upscaling (optional)

### Frameworks
- **PyTorch 2.1.2** - Deep learning framework
- **ONNX Runtime 1.16.3** - Optimized inference
- **OpenCV 4.9** - Image processing

## Why Use the Python Backend?

The Python backend provides:
- Professional-grade face swapping using InsightFace
- GFPGAN v1.4 for face restoration (removes artifacts, enhances details)
- Better quality than browser-based solutions
- Advanced color correction and blending
- GPU acceleration support (2-5x faster)
- Multi-face detection and processing

## Quick Start (5 minutes)

### Step 1: Install Python

Make sure you have Python 3.10 or higher:
```bash
python --version
```

If not installed, download from [python.org](https://www.python.org/downloads/)

### Step 2: Set Up Backend

```bash
cd backend

python -m venv venv

# On Mac/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

pip install -r requirements.txt

python main.py
```

**Note:** First run will download models (~850MB total). This may take 5-10 minutes.

The backend will start at `http://localhost:8000`

### Step 3: Verify Installation

Open another terminal and test:
```bash
curl http://localhost:8000/health
```

You should see all models loaded successfully.

### Step 4: Use Backend Face Swap

1. Keep backend running
2. Start frontend: `npm run dev`
3. Open app in browser
4. Click "Backend Swap" tab
5. Upload source face and target image
6. Click "Swap Face"
7. Download your result

## GPU Acceleration (Recommended)

For 2-5x faster processing with GFPGAN:

### NVIDIA GPU Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install PyTorch with CUDA 11.8
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118

# Install other requirements
pip install -r requirements.txt

python main.py
```

Check if CUDA is working:
```bash
curl http://localhost:8000/health
```

Look for `"cuda_available": true`

## Using Docker (Recommended for Production)

### Prerequisites
- Docker Desktop installed
- 8GB+ RAM available

### Steps

1. Navigate to backend:
```bash
cd backend
```

2. Start the service:
```bash
docker-compose up -d
```

3. Check status:
```bash
docker-compose logs -f
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

4. Stop the service:
```bash
docker-compose down
```

## Model Download Details

Models download automatically on first run:

### 1. InsightFace Models (~400MB)
- Location: `~/.insightface/models/`
- buffalo_l detection model (face detection + landmarks)
- inswapper_128.onnx (face swapping model)

### 2. GFPGAN v1.4 (~350MB)
- Location: `~/.cache/torch/hub/checkpoints/`
- GFPGANv1.4.pth (face restoration)

### 3. RealESRGAN (~67MB, optional)
- For background enhancement
- RealESRGAN_x2plus.pth

**First run timing:**
- CPU: 5-10 minutes (download + initialization)
- GPU: 3-5 minutes

## API Testing

### Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "models_loaded": true,
  "device": "cpu",
  "cuda_available": false,
  "models": {
    "face_analysis": true,
    "face_swapper": true,
    "gfpgan_restorer": true
  }
}
```

### Face Swap Test
```bash
curl -X POST http://localhost:8000/api/face-swap \
  -F "source_face=@source.jpg" \
  -F "target_image=@target.jpg" \
  -F "blend_strength=0.8" \
  -F "color_correction=true" \
  -o result.png
```

### Face Restoration Test
```bash
curl -X POST http://localhost:8000/api/face-restore \
  -F "image=@photo.jpg" \
  -F "strength=0.7" \
  -o restored.png
```

## Performance Tips

### For Faster Processing

1. **Use GPU**: 2-5x faster with CUDA
2. **Reduce Image Size**: Resize to max 1024x1024
3. **Batch Processing**: Process multiple images sequentially

### For Better Quality

1. **High-Quality Source**: Use clear, well-lit source faces
2. **Similar Angles**: Best results with similar face angles
3. **Adjust Blend Strength**: Try 0.7-0.9 for natural results
4. **Enable Color Correction**: Matches skin tones better
5. **Use Face Restoration**: Apply GFPGAN after swapping

### Processing Speed Benchmarks

**CPU (Intel i7-12700K):**
- Face swap: 2-3 seconds per image
- Face restoration: 4-5 seconds per image

**GPU (NVIDIA RTX 3080):**
- Face swap: 0.5-1 second per image
- Face restoration: 0.8-1.5 seconds per image

## Troubleshooting

### Models Not Downloading

**Symptoms:**
- Errors about missing models
- Failed to initialize messages

**Solutions:**
1. Check internet connection
2. Verify firewall allows downloads
3. Check disk space (need ~1GB free)
4. Manual download:
   - InsightFace: https://github.com/deepinsight/insightface
   - GFPGAN: https://github.com/TencentARC/GFPGAN/releases

### Import Errors

**Symptoms:**
```
ModuleNotFoundError: No module named 'gfpgan'
```

**Solution:**
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### CUDA/GPU Issues

**Symptoms:**
- `cuda_available: false` even with GPU
- Slower than expected processing

**Solutions:**
1. Install CUDA Toolkit 11.8
2. Install PyTorch with CUDA:
```bash
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118
```
3. Verify CUDA:
```python
import torch
print(torch.cuda.is_available())  # Should be True
```

### Out of Memory Errors

**Symptoms:**
```
CUDA out of memory
```

**Solutions:**
1. Reduce image size before processing
2. Use CPU mode:
```bash
export CUDA_VISIBLE_DEVICES=""
python main.py
```
3. Process one image at a time
4. Close other GPU applications

### Port Already in Use

**Symptoms:**
```
Address already in use
```

**Solution:**
Change port in `main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)
```

Update frontend `.env`:
```
VITE_FACE_PROCESSING_BACKEND_URL=http://localhost:8001
```

## Deployment Options

### Option 1: Local Development
- **Best for:** Testing and personal use
- **Cost:** Free
- **Setup:** 5 minutes
- **Command:** `python main.py`

### Option 2: Cloud VM (AWS/GCP/DigitalOcean)
- **Best for:** Production use
- **Cost:** $10-20/month
- **Setup:** 30 minutes
- **Requirements:** 2GB+ RAM, 20GB+ disk

Steps:
1. Create VM instance
2. Install Docker: `curl -fsSL https://get.docker.com | sh`
3. Clone repo and run: `docker-compose up -d`
4. Configure firewall for port 8000
5. Update frontend with VM IP

### Option 3: Platform as a Service (Railway, Render)
- **Best for:** Easy deployment
- **Cost:** Free tier available
- **Setup:** 10 minutes
- **Auto-scaling:** Yes

### Option 4: Docker on Local Network
- **Best for:** Team use in office/home
- **Cost:** Free
- **Setup:** 15 minutes
- **Access:** Local network only

## API Documentation

Once running, visit for interactive docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Security for Production

1. **Enable HTTPS**: Use nginx reverse proxy
2. **Configure CORS**: Restrict to your domain
3. **Add Authentication**: API keys or JWT
4. **Rate Limiting**: Prevent abuse
5. **Resource Limits**: Set CPU/memory limits

## Next Steps

1. ✅ Start backend: `python main.py`
2. ✅ Verify health: `curl http://localhost:8000/health`
3. ✅ Test face swap via API or frontend
4. ✅ Experiment with different blend strengths
5. ✅ Try face restoration options
6. ✅ Deploy to cloud for production

## Getting Help

- **Backend logs:** Check terminal output
- **API testing:** Use `/docs` endpoint
- **Model issues:** Verify downloads in model directories
- **Performance:** Enable GPU acceleration
- **Documentation:** Review backend/README.md

## Model Licenses

- **InsightFace:** Apache License 2.0
- **GFPGAN:** Non-commercial use (requires license for commercial)
- **RealESRGAN:** BSD 3-Clause License

Review licenses before commercial deployment.
