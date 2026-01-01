# Deep Live Cam - Python Face Processing Backend v2.0

High-performance Python backend for face swapping and restoration using state-of-the-art AI models.

## AI Models Used

### Face Detection & Analysis
- **InsightFace buffalo_l**: Multi-task face detection model
  - Includes CenterFace detector for robust face localization
  - 468-point FaceMesh for detailed facial landmarks
  - FaceMarkerLBF for additional landmark precision
  - 68-point and 468-point landmark tracking

### Face Swapping
- **InsightFaceSwap (inswapper_128.onnx)**: Professional face swapping model
  - ONNX Runtime optimized for CPU and GPU
  - 128-dimensional face encoding
  - Advanced blending and color correction
  - Real-time capable on GPU

### Face Restoration
- **GFPGAN v1.4**: Generative Facial Prior GAN for restoration
  - Removes artifacts and enhances quality
  - Restores facial details
  - Improves skin texture
  - Fixes low-quality/compressed images

- **RealESRGAN**: Background and image upscaling
  - 2x upscaling for better quality
  - Preserves details during enhancement
  - Optional background upsampling

### Frameworks
- **PyTorch 2.1.2**: Deep learning framework for GFPGAN
- **ONNX Runtime 1.16.3**: Optimized inference for InsightFace models
- **OpenCV 4.9**: Image processing and computer vision

## Features

- Professional-grade face swapping with InsightFace
- GFPGAN face restoration for enhanced quality
- Advanced color correction and blending
- Multi-face detection and processing
- GPU acceleration support (CUDA)
- REST API with automatic documentation
- Docker support for easy deployment

## Requirements

- Python 3.10+
- 4GB+ RAM (8GB+ recommended)
- GPU with CUDA support (optional, but recommended for GFPGAN)

## Installation

### Quick Start (CPU Only)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### GPU Installation (NVIDIA CUDA)

For better performance with GFPGAN:

```bash
cd backend
python -m venv venv
source venv/bin/activate

# Install PyTorch with CUDA
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118

# Install other requirements
pip install -r requirements.txt

python main.py
```

## API Endpoints

### Root
```
GET /
```
Returns API information and loaded models.

### Health Check
```
GET /health
```
Returns detailed health status including:
- Model initialization status
- Device information (CPU/CUDA)
- Individual model status

### Face Swap
```
POST /api/face-swap
```

Professional face swapping using InsightFace.

**Parameters:**
- `source_face` (file): Source face image
- `target_image` (file): Target image
- `blend_strength` (float): 0.0-1.0 (default: 0.8)
- `color_correction` (bool): Enable color matching (default: true)
- `face_scale` (float): Face scaling factor (default: 1.0)

**Response:** PNG image with swapped face

**Example:**
```bash
curl -X POST http://localhost:8000/api/face-swap \
  -F "source_face=@source.jpg" \
  -F "target_image=@target.jpg" \
  -F "blend_strength=0.8" \
  -F "color_correction=true" \
  -o result.png
```

### Face Restoration
```
POST /api/face-restore
```

Restore and enhance face quality using GFPGAN v1.4.

**Parameters:**
- `image` (file): Image to restore
- `strength` (float): 0.0-1.0 (default: 0.5)
- `denoise_level` (float): 0.0-1.0 (default: 0.3)
- `sharpen_amount` (float): 0.0-1.0 (default: 0.2)
- `enhance_details` (bool): Enable detail enhancement (default: true)

**Response:** PNG image with restored face

**Example:**
```bash
curl -X POST http://localhost:8000/api/face-restore \
  -F "image=@photo.jpg" \
  -F "strength=0.7" \
  -o restored.png
```

### Video Frame Swap
```
POST /api/face-swap-video-frame
```

Optimized endpoint for real-time video processing.

**Parameters:**
- `source_face` (file): Source face
- `frame` (file): Video frame
- `blend_strength` (float): 0.0-1.0 (default: 0.8)

**Response:** JPEG image (optimized for speed)

## Model Download

### Automatic Download (Recommended)

Models are downloaded automatically on first run:

1. **InsightFace models** (~1.5GB)
   - Downloaded to `backend/models/`
   - buffalo_l detection model
   - inswapper_128.onnx face swapping model

2. **GFPGAN model** (~350MB)
   - Downloaded to `~/.cache/torch/hub/checkpoints/`
   - GFPGANv1.4.pth

3. **RealESRGAN model** (~67MB, optional)
   - For background enhancement
   - RealESRGAN_x2plus.pth

**First run may take several minutes** to download all models (~2GB total).

### Manual Download (Recommended for Inswapper)

The inswapper model often requires manual download due to GitHub restrictions.

**Quick fix for inswapper model:**
1. Download from Google Drive: https://drive.google.com/file/d/1HvZ4MAtzlY74Dk4ASGIS9L6Rg5oZdqvu/view
2. Save as `inswapper_128.onnx` (536 MB)
3. Place in `backend/models/inswapper_128.onnx`

**Or use the download script:**

```bash
cd backend
python download_models.py
```

The script will attempt to download buffalo_l automatically and provide instructions for inswapper.

**Verify models:**
```bash
python download_models.py --verify
```

**For detailed download instructions, see:**
- [MODELS.md](MODELS.md) - Comprehensive model download guide
- All download links (Google Drive, Hugging Face, GitHub)
- Troubleshooting for specific models

## Docker Deployment

### Build and Run

```bash
cd backend
docker-compose up -d
```

### Check Logs
```bash
docker-compose logs -f
```

### Stop Service
```bash
docker-compose down
```

## Performance Optimization

### CPU Optimization
- Models use ONNX Runtime for faster CPU inference
- Multi-threading enabled
- Optimized memory usage

### GPU Acceleration
1. Install CUDA toolkit (11.8 or higher)
2. Install PyTorch with CUDA:
```bash
pip install torch==2.1.2 torchvision==0.16.2 --index-url https://download.pytorch.org/whl/cu118
```
3. GFPGAN will automatically use GPU
4. 2-5x faster processing with CUDA

### Processing Speed Benchmarks

**CPU (Intel i7-12700K):**
- Face swap: ~2-3 seconds per image
- Face restoration (GFPGAN): ~4-5 seconds per image

**GPU (NVIDIA RTX 3080):**
- Face swap: ~0.5-1 second per image
- Face restoration (GFPGAN): ~0.8-1.5 seconds per image

## Troubleshooting

### AssertionError on Startup

**Issue:** `AssertionError: 'detection' not in models` or similar

**Cause:** Buffalo_l models haven't been downloaded yet

**Solutions:**
1. Use the download script:
   ```bash
   python download_models.py
   ```

2. Check internet connection and retry

3. Verify models directory is writable:
   ```bash
   ls -la backend/models/
   ```

4. Manual download if needed:
   - Buffalo_l: https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
   - Extract to `backend/models/models/buffalo_l/`

### Models Not Downloading

**Issue:** Models fail to download automatically

**Solutions:**
1. Check internet connection
2. Verify firewall settings (models download from GitHub)
3. Ensure sufficient disk space (~2GB required)
4. Run manual download script:
   ```bash
   python download_models.py
   ```

5. Manual download links:
   - InsightFace buffalo_l: https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
   - Inswapper: https://github.com/deepinsight/insightface/releases/download/v0.7/inswapper_128.onnx
   - GFPGAN: https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth

Place models in:
- InsightFace: `backend/models/models/buffalo_l/`
- Inswapper: `backend/models/`
- GFPGAN: `backend/models/` or `~/.cache/torch/hub/checkpoints/`

### Out of Memory (OOM)

**Issue:** CUDA out of memory error

**Solutions:**
1. Reduce image resolution before processing
2. Process one image at a time
3. Use CPU mode instead:
```bash
export CUDA_VISIBLE_DEVICES=""
python main.py
```

### Slow Processing

**Issue:** Processing takes too long

**Solutions:**
1. Enable GPU acceleration
2. Reduce image size:
```python
max_dimension = 1024
if max(img.shape) > max_dimension:
    scale = max_dimension / max(img.shape)
    img = cv2.resize(img, None, fx=scale, fy=scale)
```
3. Disable background upsampling in GFPGAN

### Import Errors

**Issue:** Module not found errors

**Solution:**
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

## API Documentation

Once running, visit:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

## Development

### Project Structure
```
backend/
├── main.py                 # FastAPI application
├── model_manager.py        # Centralized model management
├── face_swapper.py         # InsightFace swapping logic
├── face_restoration.py     # GFPGAN restoration logic
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container configuration
└── docker-compose.yml     # Docker Compose config
```

### Adding New Models

1. Update `model_manager.py`:
```python
async def get_new_model(self):
    if self.new_model is None:
        self.new_model = load_model()
    return self.new_model
```

2. Use in processing modules:
```python
model = await model_manager.get_new_model()
```

## Production Deployment

### Security Best Practices

1. **Enable HTTPS**: Use reverse proxy (nginx/Caddy)
2. **Restrict CORS**: Update allowed origins in `main.py`
3. **Add Authentication**: Implement API keys or JWT
4. **Rate Limiting**: Prevent abuse
5. **Resource Limits**: Set memory/CPU limits

### Example nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## License

This project uses models with specific licenses:
- **InsightFace**: Apache License 2.0
- **GFPGAN**: Non-commercial use only (requires license for commercial use)
- **RealESRGAN**: BSD 3-Clause License

Review individual model licenses before commercial deployment.

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test thoroughly
4. Submit a pull request

## Support

- Backend issues: Check logs with `docker-compose logs -f`
- Model issues: Verify downloads in model directories
- Performance: Enable GPU acceleration
- API questions: Visit `/docs` for interactive documentation
