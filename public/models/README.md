# Face Processing Models

This directory stores machine learning models used for both frontend and backend face processing.

## Frontend Models (Browser-based)

### Automatic Model Loading

The frontend automatically downloads and initializes face detection models from CDN. No manual setup required.

### Detection Methods

The app uses a dual-detection system with automatic fallback:

1. **Primary: MediaPipe Face Mesh**
   - High-quality 3D face mesh with 468 landmarks
   - Loads from: `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh`
   - Best for detailed facial tracking and effects

2. **Fallback: face-api.js**
   - Lightweight TinyFaceDetector with 68 landmarks
   - Loads from: `https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model`
   - Activates if MediaPipe fails to load
   - Works in more restrictive network environments

## Backend Models (Python-based)

### InsightFace Models (~400MB)
- **buffalo_l**: Face detection and analysis
- **inswapper_128.onnx**: Professional face swapping

### Face Restoration Models
- **GFPGANv1.4.pth** (~350MB): Face restoration and enhancement
- **RealESRGAN_x2plus.pth** (~67MB): Background upscaling

### Automatic Download
Models download automatically when the Python backend starts for the first time. See `backend/README.md` for details.

## Directory Structure

```
models/
├── buffalo_l/              # InsightFace detection models
│   ├── det_10g.onnx
│   ├── w600k_r50.onnx
│   └── 2d106det.onnx
├── inswapper_128.onnx      # Face swapping model
├── GFPGANv1.4.pth          # Face restoration model
├── RealESRGAN_x2plus.pth   # Background upscaling
├── mediapipe/              # MediaPipe models (optional cache)
├── tensorflow/             # TensorFlow.js models (future use)
└── README.md               # This file
```

## Performance Tips

For faster loading in production, you can optionally cache models locally:

1. Download MediaPipe models from CDN
2. Place files in `public/models/mediapipe/`
3. App will automatically use local models when available

## Troubleshooting

If face detection fails to load:
- Check your internet connection
- Verify CDN access is not blocked by firewall
- Check browser console for detailed error messages
- The app will automatically try the fallback detector
- Refresh the page to retry initialization

## Notes

- All models load automatically from CDN
- No manual installation required
- Models are excluded from version control
- Fallback system ensures reliability across different networks
