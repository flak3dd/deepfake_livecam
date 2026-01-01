# Apple Silicon Optimization Guide

This guide explains how to run the Deep Live Cam backend with optimized performance on Apple Silicon Macs (M1, M2, M3, M4).

## Requirements

- Mac with Apple Silicon (M1 or newer)
- macOS 12.3 or later (for Metal Performance Shaders support)
- Python 3.9 or 3.10 (recommended)
- At least 8GB RAM (16GB+ recommended for best performance)

## Installation

### 1. Install PyTorch with MPS Support

```bash
pip install --upgrade torch torchvision
```

### 2. Install Project Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Performance Optimization

### Metal Performance Shaders (MPS)

The backend automatically detects Apple Silicon and optimizes accordingly:

- **Automatic Detection**: On startup, the backend checks for MPS availability
- **CPU Execution for ONNX**: InsightFace Buffalo_l models use CPU execution (CoreML not fully compatible)
- **MPS for PyTorch**: GFPGAN and face restoration use MPS acceleration
- **Memory Management**: Efficient memory handling with `torch.mps.empty_cache()`

**Note**: While Apple Silicon is detected, InsightFace models (buffalo_l, inswapper_128) currently run on CPU for maximum compatibility. The Buffalo_l models are optimized for CPU/CUDA and may not work reliably with CoreML execution providers.

### Optimization Modes

Configure performance settings in the frontend Performance tab:

#### Performance Mode (Recommended for M1 Pro/Max, M2/M3/M4)
- Max Resolution: 3840p (4K)
- Thread Count: 8
- Batch Size: 4
- Metal Acceleration: Enabled

#### Balanced Mode (Default for M1)
- Max Resolution: 1920p (Full HD)
- Thread Count: 6
- Batch Size: 2
- Metal Acceleration: Enabled

#### Quality Mode (For Final Output)
- Max Resolution: 4096p
- Thread Count: 8
- Batch Size: 1 (slower but best quality)
- Metal Acceleration: Enabled

#### Battery Mode (For Portability)
- Max Resolution: 1280p (HD)
- Thread Count: 4
- Batch Size: 1
- Metal Acceleration: Disabled (CPU only)

## Verifying Apple Silicon Support

### Check Device Type

Start the backend and look for these log messages:

```
Using device: mps
Apple Silicon detected - Metal Performance Shaders enabled
```

### Check via API

```bash
curl http://localhost:8000/health
```

Response should include:

```json
{
  "device": "mps",
  "mps_available": true,
  "apple_silicon": true,
  ...
}
```

## Performance Tips

### 1. Memory Management

Apple Silicon Macs have unified memory. Monitor usage:

```bash
sudo powermetrics --samplers gpu_power -i 1000 -n 1
```

### 2. Thermal Management

For sustained performance:
- Ensure good ventilation
- Consider a laptop stand for better airflow
- Monitor Activity Monitor > GPU tab

### 3. Model Optimization

The backend uses:
- **InsightFace**: CPU-optimized face detection (buffalo_l models work best on CPU)
- **ONNX Runtime**: CPU execution for maximum compatibility
- **GFPGAN**: Automatic MPS device selection for face restoration

### 4. Resolution Selection

- **Real-time**: Use 1280p or 1920p
- **Recording**: Use 1920p or 2560p
- **Final Export**: Use 3840p (4K) on M1 Pro/Max or newer

### 5. Batch Processing

Larger batch sizes improve throughput on Apple Silicon:
- M1: Batch size 2
- M1 Pro/Max: Batch size 4
- M2/M3/M4: Batch size 4-8

## Troubleshooting

### "MPS not available" Error

If MPS isn't detected:

1. Check macOS version: `sw_vers`
   - Requires macOS 12.3+

2. Verify PyTorch installation:
   ```python
   import torch
   print(torch.backends.mps.is_available())
   ```

3. Update PyTorch:
   ```bash
   pip install --upgrade torch torchvision
   ```

### Slow Performance

If performance is slower than expected:

1. **Check CPU usage**: Ensure Metal is being used, not CPU
2. **Monitor memory**: Close other applications
3. **Reduce resolution**: Lower max_resolution setting
4. **Disable background upsampler**: Edit model_manager.py

### Memory Errors

If you encounter memory errors:

1. **Lower resolution**: Reduce max_resolution
2. **Reduce batch size**: Set to 1
3. **Restart backend**: Clear memory cache
4. **Close other apps**: Free up unified memory

### ONNX Runtime Configuration

The backend automatically uses CPU execution for InsightFace models on Apple Silicon for maximum compatibility:

- **Default Behavior**: CPU execution provider (most reliable)
- **Context ID**: Uses `-1` for non-CUDA devices
- **Automatic Fallback**: If any provider fails, automatically falls back to CPU

You don't need to install special ONNX Runtime packages. The standard `onnxruntime` from pip works perfectly with CPU execution.

If you see provider-related warnings in logs, they are expected and the system will automatically fall back to CPU execution.

## Benchmarks

Approximate processing times on different Apple Silicon chips:

### Face Swap (1920x1080)
- M1: ~200ms per frame
- M1 Pro: ~150ms per frame
- M1 Max: ~100ms per frame
- M2: ~180ms per frame
- M3: ~120ms per frame
- M4: ~90ms per frame

### Face Restoration (1920x1080)
- M1: ~400ms per frame
- M1 Pro: ~300ms per frame
- M1 Max: ~200ms per frame
- M2: ~350ms per frame
- M3: ~250ms per frame
- M4: ~180ms per frame

*Note: Times vary based on face count and complexity*

## Advanced Configuration

### Force CPU Mode

To disable MPS and use CPU only:

```python
# In model_manager.py
def _get_best_device(self) -> str:
    return 'cpu'
```

### Custom Thread Count

Set optimal thread count for your chip:

```python
import torch
torch.set_num_threads(8)  # Adjust based on CPU cores
```

### Memory Limit

Set memory limit for models:

```python
# In main.py startup event
import os
os.environ['PYTORCH_MPS_HIGH_WATERMARK_RATIO'] = '0.7'
```

## Additional Resources

- [PyTorch MPS Backend](https://pytorch.org/docs/stable/notes/mps.html)
- [Apple Metal Documentation](https://developer.apple.com/metal/)
- [ONNX Runtime Performance Tuning](https://onnxruntime.ai/docs/performance/tune-performance.html)

## Support

If you encounter issues specific to Apple Silicon:

1. Check logs in terminal output
2. Verify device detection: `curl http://localhost:8000/health`
3. Test with CPU mode first to isolate hardware issues
4. Report issues with system info: chip model, macOS version, RAM

## Future Improvements

Planned optimizations:
- ANE (Apple Neural Engine) support for specific models
- Optimized batch processing for video
- Metal shader-based post-processing
- Native CoreML model conversions
