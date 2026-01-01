# Face Processing Models

This directory stores machine learning models used for face processing features.

## Automatic Model Loading

The application automatically downloads and initializes face detection models from CDN. No manual setup is required.

## Detection Methods

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

## Directory Structure

```
models/
├── mediapipe/          # MediaPipe models (optional local cache)
├── tensorflow/         # TensorFlow.js models (future use)
└── README.md          # This file
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
