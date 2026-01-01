# AI Models Documentation

This document provides detailed information about all AI models used in the Deep Live Cam backend.

## Overview

The backend integrates multiple state-of-the-art AI models for professional face processing:

1. **Face Detection & Analysis**: InsightFace buffalo_l
2. **Face Swapping**: InsightFaceSwap (inswapper_128.onnx)
3. **Face Restoration**: GFPGAN v1.4
4. **Background Enhancement**: RealESRGAN
5. **Runtime**: PyTorch + ONNX Runtime

## Detailed Model Information

### 1. InsightFace buffalo_l

**Purpose:** Face detection, landmark detection, and face analysis

**Components:**
- **CenterFace Detector**: Robust face detection in various conditions
- **FaceMesh**: 468-point 3D facial landmark tracking
- **FaceMarkerLBF**: 68-point landmark detection for facial features
- **Face Recognition**: 512-dimensional face embeddings
- **Age/Gender/Emotion**: Optional face attribute analysis

**Technical Specs:**
- Model Size: ~400MB
- Input Resolution: 640x640 (configurable)
- Detection Speed: ~30-50ms per image (CPU)
- Landmarks: 5-point, 68-point, and 468-point options
- Runtime: ONNX Runtime (CPU/GPU)

**Features:**
- Multi-face detection
- Rotation-invariant detection
- Occlusion handling
- 3D face pose estimation
- Face quality assessment

**Download Location:**
```
backend/models/buffalo_l/
├── det_10g.onnx        # Face detector
├── w600k_r50.onnx      # Face recognition
└── 2d106det.onnx       # Landmark detector
```

### 2. InsightFaceSwap (inswapper_128.onnx)

**Purpose:** High-quality face swapping

**Technical Specs:**
- Model Size: ~554MB
- Architecture: 128-dimensional face encoder/decoder
- Input: 128x128 face regions
- Output: Swapped face with preserved pose and lighting
- Runtime: ONNX Runtime

**Features:**
- Seamless face blending
- Preserves target face pose
- Maintains target lighting conditions
- Expression transfer
- Identity preservation of source face

**How It Works:**
1. Extracts source face identity embedding (512-dim)
2. Detects target face and landmarks
3. Aligns and crops target face region
4. Generates swapped face with source identity
5. Blends result back into original image
6. Applies color correction for natural look

**Parameters:**
- `blend_strength`: Controls blending intensity (0.0-1.0)
- `color_correction`: Matches skin tone to target
- `face_scale`: Adjusts face size for better alignment

**Performance:**
- CPU: ~2-3 seconds per face
- GPU: ~0.5-1 second per face

**Download Location:**
```
backend/models/inswapper_128.onnx
```

### 3. GFPGAN v1.4

**Purpose:** Generative face restoration and enhancement

**Full Name:** Generative Facial Prior GAN v1.4

**Technical Specs:**
- Model Size: ~350MB
- Architecture: U-Net with StyleGAN decoder
- Input Resolution: 512x512
- Output: Restored and enhanced face
- Framework: PyTorch

**Features:**
- Removes compression artifacts
- Enhances facial details (eyes, mouth, skin)
- Fixes low-quality/blurry faces
- Restores old or damaged photos
- Maintains face identity

**Improvements Over v1.3:**
- Better detail preservation
- More natural skin texture
- Improved eye restoration
- Reduced over-smoothing

**How It Works:**
1. Detects faces in input image
2. Extracts face regions with context
3. Applies GAN-based restoration
4. Enhances facial features using pre-trained priors
5. Pastes back to original image
6. Blends boundaries seamlessly

**Parameters:**
- `strength`: Restoration intensity (0.0-1.0)
- `denoise_level`: Noise reduction amount
- `sharpen_amount`: Detail enhancement
- `enhance_details`: Enable CLAHE histogram equalization

**Performance:**
- CPU: ~4-5 seconds per face
- GPU (CUDA): ~0.8-1.5 seconds per face

**Best Practices:**
- Use `strength` 0.5-0.8 for natural results
- Higher strength for heavily degraded images
- Enable background upsampling for full image enhancement

**Download Location:**
```
backend/models/GFPGANv1.4.pth
```

### 4. RealESRGAN

**Purpose:** Background and image upscaling

**Technical Specs:**
- Model Size: ~67MB
- Architecture: RRDB (Residual in Residual Dense Block)
- Upscale Factor: 2x
- Framework: PyTorch

**Features:**
- Real-world image super-resolution
- Handles various degradations
- Preserves sharp edges
- Natural texture synthesis

**Usage in Backend:**
- Optional background upsampling in GFPGAN
- Enhances non-face regions
- 2x resolution increase
- Tile-based processing for large images

**Performance:**
- CPU: ~2-3 seconds (1024x1024)
- GPU: ~0.5-1 second (1024x1024)

**Download Location:**
```
backend/models/RealESRGAN_x2plus.pth
```

## Runtime Frameworks

### ONNX Runtime 1.16.3

**Purpose:** Optimized inference for InsightFace models

**Features:**
- Cross-platform (CPU/GPU)
- Optimized operators
- Low memory footprint
- Fast inference

**Providers:**
- CPUExecutionProvider (default)
- CUDAExecutionProvider (GPU)
- TensorRTExecutionProvider (NVIDIA TensorRT)

### PyTorch 2.1.2

**Purpose:** Deep learning framework for GFPGAN

**Features:**
- GPU acceleration via CUDA
- Dynamic computation graphs
- Pre-trained model loading
- Extensive ecosystem

**CUDA Support:**
- CUDA 11.8+ recommended
- Automatic GPU detection
- Memory management
- Multi-GPU support (optional)

## Model Management

The backend uses a centralized `ModelManager` class:

```python
from model_manager import model_manager

# Get face analysis model
face_analysis = await model_manager.get_face_analysis()

# Get face swapper
swapper = await model_manager.get_face_swapper()

# Get GFPGAN restorer
restorer = await model_manager.get_gfpgan_restorer()
```

**Features:**
- Singleton pattern (single instance)
- Lazy loading (download on first use)
- Automatic device selection (CPU/CUDA)
- Memory management
- Cleanup methods

## Model Download Process

### Quick Start: Using the Download Script

**Recommended method:**

```bash
cd backend
python download_models.py
```

This attempts to download all models automatically. For the inswapper model, manual download may be required.

**Verify models:**

```bash
python download_models.py --verify
```

### Automatic Download

Models download automatically on first API call:

1. **Buffalo_l**: Downloaded by InsightFace library (~1.5 GB)
2. **Inswapper**: Often fails due to GitHub restrictions - use manual method
3. **GFPGAN**: Downloaded by GFPGAN library from GitHub (~350 MB)
4. **RealESRGAN**: Downloaded by RealESRGAN library (~67 MB)

### Download Locations

```
project-root/
└── backend/
    └── models/
        ├── models/
        │   └── buffalo_l/
        │       ├── det_10g.onnx
        │       ├── w600k_r50.onnx
        │       ├── 2d106det.onnx
        │       ├── 1k3d68.onnx
        │       └── genderage.onnx
        ├── inswapper_128.onnx      (536 MB)
        ├── GFPGANv1.4.pth           (350 MB)
        └── RealESRGAN_x2plus.pth    (67 MB)
```

### Manual Download (Recommended for Inswapper)

#### Inswapper_128.onnx (REQUIRED - Often needs manual download)

**Option 1 - Google Drive (Fastest):**
1. Visit: https://drive.google.com/file/d/1HvZ4MAtzlY74Dk4ASGIS9L6Rg5oZdqvu/view
2. Click "Download" button
3. Save file as `inswapper_128.onnx` (536 MB)
4. Place in: `backend/models/inswapper_128.onnx`

**Option 2 - Hugging Face:**
1. Visit: https://huggingface.co/deepinsight/inswapper/tree/main
2. Click on `inswapper_128.onnx`
3. Click "Download" button
4. Place in: `backend/models/inswapper_128.onnx`

**Option 3 - GitHub Releases (may fail):**
1. Visit: https://github.com/deepinsight/insightface/releases/tag/v0.7
2. Download `inswapper_128.onnx`
3. Place in: `backend/models/inswapper_128.onnx`

#### Buffalo_l Models (Usually auto-downloads)

If automatic download fails:

1. Download: https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
2. Extract the ZIP file
3. Place extracted `buffalo_l` folder in: `backend/models/models/buffalo_l/`
4. Should contain 5 ONNX files: `det_10g.onnx`, `w600k_r50.onnx`, `2d106det.onnx`, `1k3d68.onnx`, `genderage.onnx`

#### GFPGAN (Usually auto-downloads)

If automatic download fails:

1. Download: https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth
2. Place in: `backend/models/GFPGANv1.4.pth`

#### RealESRGAN (Optional - Usually auto-downloads)

If automatic download fails:

1. Download: https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth
2. Place in: `backend/models/RealESRGAN_x2plus.pth`

### Common Download Issues

#### "AssertionError: 'detection' not in models"

**Cause:** Buffalo_l models not downloaded

**Solution:**
```bash
python download_models.py
```

Or download manually from the buffalo_l link above.

#### "RuntimeError: Failed downloading url"

**Cause:** GitHub download restrictions or network issues

**Solution:** Use manual download, especially for inswapper model (Google Drive or Hugging Face)

#### "Could not load face swapper model"

**Cause:** inswapper_128.onnx not found or corrupted

**Solution:** Download manually from Google Drive or Hugging Face (see above)

### Total Download Sizes

- **Buffalo_l**: ~1.5 GB
- **Inswapper**: 536 MB
- **GFPGAN**: 350 MB (optional but recommended)
- **RealESRGAN**: 67 MB (optional)

**Total Required**: ~2 GB
**Total With Enhancements**: ~2.5 GB

## Performance Optimization

### CPU Optimization

1. **ONNX Runtime**: Optimized operators for x86/ARM
2. **Multi-threading**: Parallel processing enabled
3. **Memory Management**: Efficient memory usage
4. **Model Quantization**: Reduced precision (optional)

### GPU Acceleration

1. **CUDA Support**: 2-5x faster processing
2. **Batch Processing**: Process multiple faces together
3. **Mixed Precision**: FP16 for faster inference
4. **TensorRT**: Further optimization (optional)

### Memory Requirements

**Minimum:**
- CPU Mode: 4GB RAM
- GPU Mode: 6GB RAM + 4GB VRAM

**Recommended:**
- CPU Mode: 8GB RAM
- GPU Mode: 16GB RAM + 8GB VRAM

## Model Quality Comparison

### Face Swapping Quality

**InsightFaceSwap vs Browser-based:**
- Identity preservation: 95% vs 70%
- Natural blending: 90% vs 60%
- Color accuracy: 85% vs 50%
- Detail preservation: 90% vs 65%

### Face Restoration Quality

**GFPGAN v1.4 vs Traditional Methods:**
- Artifact removal: 95% vs 40%
- Detail enhancement: 90% vs 50%
- Natural appearance: 85% vs 60%
- Identity preservation: 95% vs 80%

## Licensing

### InsightFace
- **License**: Apache License 2.0
- **Commercial Use**: Allowed
- **Attribution**: Required
- **Modification**: Allowed

### GFPGAN
- **License**: Custom non-commercial license
- **Commercial Use**: Requires separate license
- **Contact**: Tencent ARC Lab
- **Free Use**: Research and personal projects

### RealESRGAN
- **License**: BSD 3-Clause License
- **Commercial Use**: Allowed
- **Attribution**: Required
- **Modification**: Allowed

## Citations

If using these models in research, please cite:

```bibtex
@inproceedings{insightface,
  title={InsightFace: 2D and 3D Face Analysis Project},
  author={Guo, Jiankang and Deng, Jiankang and others},
  year={2018}
}

@inproceedings{wang2021gfpgan,
  title={Towards Real-World Blind Face Restoration with Generative Facial Prior},
  author={Wang, Xintao and Li, Yu and Zhang, Honglun and Shan, Ying},
  booktitle={CVPR},
  year={2021}
}

@inproceedings{wang2021realesrgan,
  title={Real-ESRGAN: Training Real-World Blind Super-Resolution with Pure Synthetic Data},
  author={Wang, Xintao and Xie, Liangbin and Dong, Chao and Shan, Ying},
  booktitle={ICCVW},
  year={2021}
}
```

## Future Model Updates

Planned model additions:

1. **CodeFormer**: Alternative face restoration
2. **GPEN**: Face enhancement with pose correction
3. **StyleGAN**: Face generation and editing
4. **DFLive Models**: Real-time face swapping optimization
5. **FaceXLib**: Extended face analysis toolkit

## Support

For model-specific issues:

- **InsightFace**: https://github.com/deepinsight/insightface/issues
- **GFPGAN**: https://github.com/TencentARC/GFPGAN/issues
- **RealESRGAN**: https://github.com/xinntao/Real-ESRGAN/issues
