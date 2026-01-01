# Performance Optimization Guide

Your Deep Live Cam app now includes comprehensive performance optimization with special support for Apple Silicon Macs.

## Features

### Automatic Device Detection

The app automatically detects your hardware and recommends optimal settings:

- **Apple Silicon** (M1/M2/M3/M4) - Metal Performance Shaders
- **NVIDIA GPU** - CUDA/TensorRT acceleration
- **AMD GPU** - OpenCL/WebGL acceleration
- **CPU** - Multi-threaded processing

### Optimization Modes

Choose the best mode for your needs:

#### Performance Mode
- Maximum speed with higher resource usage
- Best for: Real-time streaming, live demos
- Recommended for: M1 Pro/Max/Ultra, M2/M3/M4, High-end GPUs

#### Balanced Mode (Default)
- Good balance between speed and quality
- Best for: General use, recording
- Recommended for: M1, Mid-range GPUs, Modern CPUs

#### Quality Mode
- Best quality, slower processing
- Best for: Final output, professional work
- Recommended for: All devices (when time isn't critical)

#### Battery Mode
- Energy efficient with reduced quality
- Best for: Laptop use, extended sessions
- Recommended for: When on battery power

## Apple Silicon Optimization

### What You Get

1. **Metal Performance Shaders (MPS)**
   - Hardware-accelerated neural network processing
   - 3-5x faster than CPU-only mode
   - Efficient memory usage on unified memory architecture

2. **CoreML Execution**
   - Optimized ONNX model execution
   - Automatic use of Neural Engine when available
   - Better thermal management

3. **Recommended Settings**
   - M1: Balanced mode, 1920p, 6 threads
   - M1 Pro/Max: Performance mode, 3840p, 8 threads
   - M2/M3/M4: Performance mode, 3840p, 8 threads

### Backend Setup

The Python backend automatically detects Apple Silicon and configures itself optimally. See `backend/APPLE_SILICON_SETUP.md` for detailed setup instructions.

## Settings Storage

All performance settings are automatically saved to your Supabase database:

- Persists across sessions
- Syncs across devices (when logged in)
- Automatic presets based on detected hardware
- Manual override available

## Frontend Optimizations

### WebGL Acceleration

The frontend uses WebGL for:
- Real-time video processing
- Face detection and tracking
- Filter effects
- Canvas rendering

### TensorFlow.js

Optimized for each device type:
- Apple Silicon: WebGL backend with Metal
- NVIDIA/AMD: WebGL backend with GPU
- CPU: WASM backend with multi-threading

## Performance Tab

Access the Performance tab in the app to:

1. **View Detected Hardware**
   - Device type and capabilities
   - CPU cores and memory
   - GPU support status

2. **Select Optimization Mode**
   - One-click preset selection
   - Automatic configuration

3. **Fine-Tune Settings**
   - Max resolution
   - Thread count
   - Batch size
   - Hardware acceleration options

4. **Monitor Status**
   - Current configuration
   - Active optimizations
   - Performance tips

## Configuration Details

### Max Resolution

Controls the maximum processing resolution:
- **3840p (4K)**: High-end devices only
- **1920p (Full HD)**: Most devices
- **1280p (HD)**: Battery mode, older devices
- **720p**: Minimum quality

### Thread Count

CPU threads used for processing:
- **8 threads**: Performance mode
- **6 threads**: Balanced mode
- **4 threads**: Battery mode
- **2 threads**: Minimum

### Batch Size

Number of frames processed together:
- **8**: NVIDIA GPUs (TensorRT)
- **4**: Apple Silicon (M-series)
- **2**: Mid-range devices
- **1**: CPU mode, quality priority

### Hardware Acceleration Options

#### Metal (Apple Silicon)
- Enables Metal Performance Shaders
- Uses unified memory efficiently
- Automatic thermal management

#### TensorRT (NVIDIA)
- Optimized inference engine
- Best for RTX series GPUs
- Requires NVIDIA drivers

## Backend Configuration

The backend API (`http://localhost:8000`) automatically configures:

### Device Selection Priority
1. CUDA (if NVIDIA GPU available)
2. MPS (if Apple Silicon available)
3. CPU (fallback)

### Model Loading
- InsightFace: Face detection and landmarks
- GFPGAN: Face restoration
- RealESRGAN: Background enhancement

### Execution Providers
- **CUDA**: CUDAExecutionProvider
- **Apple Silicon**: CoreMLExecutionProvider
- **CPU**: CPUExecutionProvider

## Performance Monitoring

### Check Backend Status

```bash
curl http://localhost:8000/health
```

Response includes:
- Device type (cuda/mps/cpu)
- Model loading status
- Hardware availability

### Frontend Detection

Open browser console to see:
- Detected device capabilities
- Selected optimization mode
- Active acceleration features

## Troubleshooting

### Slow Performance

1. Check optimization mode is appropriate for your device
2. Verify GPU acceleration is enabled (if available)
3. Lower max resolution if processing is too slow
4. Reduce thread count if system is overloaded

### High Battery Drain (Laptops)

1. Switch to Battery mode
2. Reduce max resolution to 1280p or lower
3. Disable GPU acceleration
4. Lower frame rate in camera settings

### Memory Errors

1. Reduce max resolution
2. Lower batch size to 1
3. Close other applications
4. Restart backend to clear cache

### Metal Not Available (Mac)

1. Verify macOS 12.3 or later
2. Update PyTorch: `pip install --upgrade torch`
3. Check in terminal: Backend should show "Using device: mps"

## Best Practices

### For Apple Silicon

1. Always enable Metal acceleration
2. Use Performance or Balanced mode
3. Monitor Activity Monitor > GPU tab
4. Ensure good ventilation for sustained performance

### For NVIDIA GPUs

1. Enable TensorRT if available
2. Use Performance mode
3. Keep GPU drivers updated
4. Monitor GPU temperature

### For CPU Processing

1. Use Balanced or Battery mode
2. Close background applications
3. Lower resolution for real-time processing
4. Consider Quality mode for offline processing

## API Integration

The performance settings are available to your application:

```typescript
import { getPerformanceSettings } from './lib/performanceSettings';

// Get user's settings
const settings = await getPerformanceSettings(userId);

// Use in backend requests
const response = await fetch(`${backendUrl}/api/face-swap`, {
  method: 'POST',
  body: formData,
  headers: {
    'X-Max-Resolution': settings.max_resolution.toString(),
    'X-Enable-Metal': settings.enable_metal.toString(),
  }
});
```

## Database Schema

Settings stored in `performance_settings` table:

| Column | Type | Description |
|--------|------|-------------|
| device_type | text | apple_silicon, nvidia_gpu, amd_gpu, cpu |
| optimization_mode | text | performance, balanced, quality, battery |
| use_gpu_acceleration | boolean | Enable GPU processing |
| max_resolution | integer | Maximum processing resolution |
| thread_count | integer | CPU thread count |
| enable_metal | boolean | Apple Metal support |
| enable_tensorrt | boolean | NVIDIA TensorRT support |
| batch_size | integer | Processing batch size |

## Future Enhancements

Planned improvements:
- Real-time performance metrics
- Automatic mode switching based on workload
- Advanced memory management
- Custom profile creation
- Performance benchmarking tools

## Support

For device-specific issues:
- **Apple Silicon**: See `backend/APPLE_SILICON_SETUP.md`
- **NVIDIA GPUs**: Ensure CUDA toolkit is installed
- **General**: Check browser console and backend logs
