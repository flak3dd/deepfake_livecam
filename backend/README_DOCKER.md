# Docker Deployment Guide

This guide covers both CPU and GPU deployment options for the Deep Live Cam backend.

## Quick Start

### CPU Deployment (Slower, No GPU Required)

```bash
# Build and run
docker-compose up --build

# Or manually
docker build -t deep-live-cam:latest .
docker run -d -p 8000:8000 --name deep-live-cam deep-live-cam:latest
```

### GPU Deployment (Recommended for Production)

```bash
# Check system compatibility
./build-gpu.sh check

# Build and run
./build-gpu.sh rebuild

# Or use docker-compose
docker-compose -f docker-compose-gpu.yml up --build
```

## Comparison: CPU vs GPU

| Feature | CPU | GPU (CUDA) |
|---------|-----|------------|
| **Speed** | 1x baseline | 10-20x faster |
| **Face Swap (1080p)** | ~3-5 FPS | ~30-60 FPS |
| **Memory** | 4-8 GB RAM | 6-24 GB VRAM |
| **Setup** | Simple | Requires NVIDIA GPU + drivers |
| **Cost** | Lower | Higher |
| **Use Case** | Development, testing | Production, real-time |

## File Structure

```
backend/
├── Dockerfile              # CPU version (python:3.10-slim)
├── Dockerfile.cuda         # GPU version (nvidia/cuda:11.8.0)
├── docker-compose.yml      # CPU deployment
├── docker-compose-gpu.yml  # GPU deployment
├── build-gpu.sh            # GPU build helper script
├── requirements.txt        # CPU dependencies
├── requirements-gpu.txt    # GPU dependencies
└── BUILD_GPU.md           # Detailed GPU guide
```

## When to Use Each Version

### Use CPU Version When:
- Developing or testing locally
- Processing occasional images (< 10 per minute)
- Don't have NVIDIA GPU
- Running on cloud without GPU support
- Budget-conscious deployment

### Use GPU Version When:
- Real-time face processing required
- High throughput needed (> 10 images/sec)
- Video processing
- Production deployment
- Have NVIDIA GPU available
- Need lowest latency

## GPU Requirements

**Minimum GPU Requirements:**
- CUDA Compute Capability 6.0+
- 6GB VRAM (RTX 2060, GTX 1660 Ti)
- NVIDIA Driver 470.x or newer

**Recommended for Production:**
- RTX 3080, 4070 Ti, or better
- 12GB+ VRAM
- Latest NVIDIA drivers

**Supported GPUs:**
- GeForce RTX 20/30/40 series
- Tesla T4, V100, A100
- Quadro/A-series workstation GPUs

## Build Arguments

Both Dockerfiles support build arguments for customization:

```bash
# Specify Python version (CPU)
docker build --build-arg PYTHON_VERSION=3.10 -t deep-live-cam .

# Specify CUDA version (GPU)
docker build --build-arg CUDA_VERSION=11.8.0 -f Dockerfile.cuda -t deep-live-cam-gpu .
```

## Environment Variables

Configure container behavior with environment variables:

```yaml
# docker-compose.yml or docker run -e
environment:
  # GPU Selection (0 = first GPU, 1 = second GPU, etc.)
  - CUDA_VISIBLE_DEVICES=0

  # Enable all NVIDIA capabilities
  - NVIDIA_VISIBLE_DEVICES=all

  # Python optimizations
  - PYTHONUNBUFFERED=1

  # Model cache location
  - INSIGHTFACE_HOME=/app/models
```

## Volume Mounts

### Model Storage (Persistent)
```bash
-v $(pwd)/models:/app/models
```
Caches downloaded AI models to avoid re-downloading on container restart.

### Live Code Updates (Development)
```bash
-v $(pwd):/app
```
Enables hot-reloading during development.

## Health Checks

Both Dockerfiles include health checks:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' deep-live-cam-gpu

# View health logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' deep-live-cam-gpu

# Manual health check
curl http://localhost:8000/health
```

Expected healthy response:
```json
{
  "status": "healthy",
  "models_loaded": true,
  "device": "cuda",  // or "cpu"
  "cuda_available": true  // or false
}
```

## Performance Tuning

### CPU Version

Adjust workers based on CPU cores:
```yaml
command: ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### GPU Version

**Single GPU:**
```yaml
environment:
  - CUDA_VISIBLE_DEVICES=0
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

**Multi-GPU Load Balancing:**
```yaml
services:
  backend-gpu-1:
    environment:
      - CUDA_VISIBLE_DEVICES=0
    ports: ["8000:8000"]

  backend-gpu-2:
    environment:
      - CUDA_VISIBLE_DEVICES=1
    ports: ["8001:8000"]
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs deep-live-cam-gpu

# Common issues:
# 1. Models not downloaded - Wait for first-run download
# 2. Out of memory - Reduce resolution or use smaller model
# 3. Port conflict - Change port mapping
```

### GPU Not Detected (CUDA available: False)

```bash
# Test GPU access
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi

# If this fails:
# 1. Install NVIDIA Container Toolkit
# 2. Restart Docker daemon
# 3. Verify NVIDIA driver: nvidia-smi
```

### Slow Performance

**CPU Version:**
- Increase worker count
- Use smaller models
- Reduce image resolution

**GPU Version:**
- Check GPU utilization: `nvidia-smi`
- Ensure GPU is actually being used (check logs)
- Monitor temperature throttling
- Verify CUDA version matches driver

### Memory Issues

**Out of Memory (OOM):**
```yaml
# Limit container memory
deploy:
  resources:
    limits:
      memory: 8G
```

**GPU OOM:**
- Reduce batch size
- Lower processing resolution
- Use FP16 precision (mixed precision)
- Close other GPU applications

## Production Deployment

### Docker Swarm

```bash
docker stack deploy -c docker-compose-gpu.yml deep-live-cam
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests (to be created).

### Cloud Platforms

**AWS EC2 with GPU:**
- Instance types: g4dn.xlarge, g5.xlarge, p3.2xlarge
- AMI: Deep Learning AMI (Ubuntu)
- Use ECS with GPU support

**Google Cloud:**
- Instance types: n1-standard-4 with T4 or V100
- Use GKE with node pools containing GPUs

**Azure:**
- Instance types: NC-series (T4), NCv3-series (V100)
- Use AKS with GPU node pools

## Monitoring

### Resource Usage

```bash
# CPU/Memory
docker stats deep-live-cam-gpu

# GPU Usage
watch -n 1 nvidia-smi

# Detailed metrics
docker exec deep-live-cam-gpu nvidia-smi dmon
```

### Application Metrics

Access FastAPI metrics at:
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health
- Status: http://localhost:8000/

### Logging

```bash
# Follow logs
docker logs -f deep-live-cam-gpu

# Last 100 lines
docker logs --tail 100 deep-live-cam-gpu

# With timestamps
docker logs -t deep-live-cam-gpu
```

## Security Best Practices

1. **Don't run as root** (add USER directive in production)
2. **Scan images** for vulnerabilities
3. **Limit resources** with cgroups
4. **Use secrets** for API keys (not environment variables)
5. **Enable TLS** in production
6. **Network isolation** with Docker networks

## Updates and Maintenance

### Updating the Image

```bash
# Pull latest code
git pull

# Rebuild
./build-gpu.sh rebuild

# Or with docker-compose
docker-compose -f docker-compose-gpu.yml up --build -d
```

### Model Updates

Models are cached in `./models/`. To update:

```bash
# Clear cache
rm -rf ./models/*

# Restart container (will re-download)
docker restart deep-live-cam-gpu
```

## Support and Resources

- **GPU Guide**: See `BUILD_GPU.md` for detailed GPU setup
- **API Documentation**: http://localhost:8000/docs
- **NVIDIA Container Toolkit**: https://github.com/NVIDIA/nvidia-docker
- **Docker Documentation**: https://docs.docker.com/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/

## License

This Docker configuration is part of the Deep Live Cam project.
