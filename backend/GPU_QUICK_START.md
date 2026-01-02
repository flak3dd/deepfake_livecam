# GPU Quick Start - 5 Minutes to Production

Get your CUDA-accelerated Deep Live Cam backend running in minutes.

## Prerequisites Check

```bash
# Navigate to backend directory
cd backend

# Automated system check (recommended)
./gpu-docker.sh check
```

Or manually verify:
```bash
# 1. Verify NVIDIA GPU
nvidia-smi

# 2. Check Docker
docker --version

# 3. Test NVIDIA Docker
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

If any of these fail, see [BUILD_GPU.md](BUILD_GPU.md) for detailed setup.

## One-Command Deployment

### Option 1: Complete Management Script (Recommended)

```bash
# Navigate to backend directory
cd backend

# Build and run (all-in-one with system checks)
./gpu-docker.sh rebuild
```

**Features:**
- Comprehensive system validation
- Color-coded output
- Automatic health checks
- Built-in monitoring

See [GPU_DOCKER_SCRIPT.md](GPU_DOCKER_SCRIPT.md) for all commands.

### Option 2: Simple Build Script

```bash
# Build and run
./build-gpu.sh rebuild
```

### Option 3: Docker Compose

```bash
docker-compose -f docker-compose-gpu.yml up --build -d
```

## Verify It's Working

### Using Management Script (Easiest)

```bash
# Show complete status
./gpu-docker.sh status

# Test API
./gpu-docker.sh test

# Monitor GPU usage in real-time
./gpu-docker.sh monitor
```

### Manual Verification

```bash
# 1. Check health
curl http://localhost:8000/health

# Should return:
# {
#   "status": "healthy",
#   "device": "cuda",
#   "cuda_available": true
# }

# 2. View logs
docker logs deep-live-cam-gpu
# Or: ./gpu-docker.sh logs

# Look for:
# Device: cuda
# CUDA Available: True

# 3. Check GPU usage
nvidia-smi
```

## Test Face Swap

```bash
curl -X POST http://localhost:8000/api/face-swap \
  -F "source_face=@path/to/source.jpg" \
  -F "target_image=@path/to/target.jpg" \
  -F "blend_strength=0.8" \
  --output result.png
```

## Common Commands

### Using Management Script

```bash
# View logs
./gpu-docker.sh logs           # Last 50 lines
./gpu-docker.sh logs 100       # Last 100 lines
./gpu-docker.sh logs follow    # Real-time

# Container management
./gpu-docker.sh stop           # Stop service
./gpu-docker.sh restart        # Restart service
./gpu-docker.sh remove         # Remove container
./gpu-docker.sh status         # Show status

# Monitoring
./gpu-docker.sh monitor        # GPU and container stats
./gpu-docker.sh test           # Test API endpoints

# Shell access
./gpu-docker.sh shell          # Interactive bash

# Maintenance
./gpu-docker.sh backup         # Backup models
./gpu-docker.sh cleanup        # Clean Docker resources
```

### Direct Docker Commands

```bash
# View logs
docker logs -f deep-live-cam-gpu

# Stop service
docker stop deep-live-cam-gpu

# Restart service
docker restart deep-live-cam-gpu

# Remove container
docker rm -f deep-live-cam-gpu

# Check GPU usage
watch -n 1 nvidia-smi

# Access API docs
open http://localhost:8000/docs
```

## Performance Expectations

| GPU | Face Swap Speed | Restoration Speed |
|-----|----------------|-------------------|
| RTX 4090 | ~60 FPS @ 1080p | ~45 FPS @ 1080p |
| RTX 3080 | ~42 FPS @ 1080p | ~32 FPS @ 1080p |
| RTX 3060 Ti | ~35 FPS @ 1080p | ~25 FPS @ 1080p |
| Tesla T4 | ~25 FPS @ 1080p | ~18 FPS @ 1080p |

## Troubleshooting

### GPU Not Found

```bash
# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
    sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

### Out of Memory

Reduce resolution or use a GPU with more VRAM:

```bash
# Check GPU memory
nvidia-smi --query-gpu=memory.total,memory.free --format=csv
```

Minimum: 6GB VRAM
Recommended: 12GB+ VRAM

### Slow Performance

```bash
# Check if GPU is actually being used
docker exec deep-live-cam-gpu nvidia-smi

# GPU usage should be >80% during processing
```

## Next Steps

- **Management Script Guide**: [GPU_DOCKER_SCRIPT.md](GPU_DOCKER_SCRIPT.md) - Complete command reference
- **API Documentation**: http://localhost:8000/docs
- **Detailed GPU Guide**: [BUILD_GPU.md](BUILD_GPU.md)
- **Docker Guide**: [README_DOCKER.md](README_DOCKER.md)
- **Production Setup**: [BUILD_GPU.md#production-deployment](BUILD_GPU.md#production-deployment)

## Multi-GPU Setup

```yaml
# docker-compose-gpu.yml
services:
  gpu-0:
    environment:
      - CUDA_VISIBLE_DEVICES=0
    ports: ["8000:8000"]

  gpu-1:
    environment:
      - CUDA_VISIBLE_DEVICES=1
    ports: ["8001:8000"]
```

## Environment-Specific Settings

### Development
```bash
docker-compose -f docker-compose-gpu.yml up
# Auto-reloading enabled with volume mount
```

### Production
```bash
docker-compose -f docker-compose-gpu.yml up -d
# Runs in detached mode with auto-restart
```

## Monitoring

```bash
# Real-time GPU stats
watch -n 1 nvidia-smi

# Container resources
docker stats deep-live-cam-gpu

# Application logs
docker logs -f deep-live-cam-gpu --tail 50
```

## Cost Optimization

**Cloud GPU Instances** (Monthly Estimates):

| Provider | Instance Type | GPU | Cost/Month* |
|----------|--------------|-----|------------|
| AWS | g4dn.xlarge | T4 | ~$130 |
| GCP | n1-standard-4 + T4 | T4 | ~$140 |
| Azure | NC6s_v3 | V100 | ~$300 |
| Lambda Labs | gpu_1x_a4000 | A4000 | ~$400 |

*Approximate costs for 24/7 operation

**Budget Options:**
- Spot instances (60-80% cheaper but can be interrupted)
- Auto-scaling (scale down during low usage)
- Serverless GPU (pay per second of usage)

## Support

Having issues? Check:
1. `docker logs deep-live-cam-gpu` for errors
2. `nvidia-smi` for GPU status
3. [BUILD_GPU.md](BUILD_GPU.md) for detailed troubleshooting
4. GitHub issues for community support
