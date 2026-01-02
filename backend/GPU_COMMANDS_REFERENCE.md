# GPU Docker Quick Reference

Essential commands for the GPU Docker management script.

## Quick Start

```bash
./gpu-docker.sh check    # Verify system
./gpu-docker.sh rebuild  # Build & start
./gpu-docker.sh status   # Check status
```

## All Commands

| Command | Description | Example |
|---------|-------------|---------|
| `check` | Verify system requirements | `./gpu-docker.sh check` |
| `build` | Build Docker image | `./gpu-docker.sh build` |
| `start` | Start container | `./gpu-docker.sh start` |
| `stop` | Stop container | `./gpu-docker.sh stop` |
| `restart` | Restart container | `./gpu-docker.sh restart` |
| `remove` | Remove container | `./gpu-docker.sh remove` |
| `rebuild` | Full rebuild | `./gpu-docker.sh rebuild` |
| `status` | Show status | `./gpu-docker.sh status` |
| `logs` | View logs | `./gpu-docker.sh logs [lines\|follow]` |
| `monitor` | Real-time monitoring | `./gpu-docker.sh monitor` |
| `shell` | Open bash shell | `./gpu-docker.sh shell` |
| `test` | Test API | `./gpu-docker.sh test` |
| `backup` | Backup models | `./gpu-docker.sh backup` |
| `restore` | Restore models | `./gpu-docker.sh restore <file>` |
| `cleanup` | Clean Docker | `./gpu-docker.sh cleanup` |
| `help` | Show help | `./gpu-docker.sh help` |

## Common Workflows

### First Setup
```bash
./gpu-docker.sh check
./gpu-docker.sh rebuild
./gpu-docker.sh test
```

### Development
```bash
./gpu-docker.sh logs follow  # Watch logs
./gpu-docker.sh restart      # After changes
./gpu-docker.sh shell        # Debug
```

### Monitoring
```bash
./gpu-docker.sh status       # Quick check
./gpu-docker.sh monitor      # GPU usage
./gpu-docker.sh logs 100     # Recent logs
```

### Maintenance
```bash
./gpu-docker.sh backup       # Backup
./gpu-docker.sh stop         # Stop
./gpu-docker.sh cleanup      # Clean
./gpu-docker.sh start        # Start
```

### Troubleshooting
```bash
./gpu-docker.sh logs 200     # Check logs
./gpu-docker.sh shell        # Inspect
./gpu-docker.sh remove       # Remove
./gpu-docker.sh rebuild      # Fresh start
```

## Environment Variables

```bash
# Use specific GPU
GPU_ID=1 ./gpu-docker.sh start

# Use different port
PORT=8080 ./gpu-docker.sh start

# Multi-GPU
GPU_ID=0,1 ./gpu-docker.sh start
```

## Log Examples

### View Last 50 Lines (Default)
```bash
./gpu-docker.sh logs
```

### View Last 100 Lines
```bash
./gpu-docker.sh logs 100
```

### Follow Logs Real-time
```bash
./gpu-docker.sh logs follow
```

## Service URLs

Once running:
- API: http://localhost:8000
- Health: http://localhost:8000/health
- Docs: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc

## Status Indicators

- **Green [SUCCESS]** - Operation completed
- **Blue [INFO]** - Information message
- **Yellow [WARNING]** - Warning (non-critical)
- **Red [ERROR]** - Error (needs attention)

## Quick Tests

### Health Check
```bash
curl http://localhost:8000/health
```

### Face Swap Test
```bash
curl -X POST http://localhost:8000/api/face-swap \
  -F "source_face=@source.jpg" \
  -F "target_image=@target.jpg" \
  --output result.png
```

### GPU Check
```bash
nvidia-smi
```

## Container Management

### Check if Running
```bash
docker ps | grep deep-live-cam-gpu
```

### View Container Stats
```bash
docker stats deep-live-cam-gpu --no-stream
```

### Execute Command in Container
```bash
docker exec deep-live-cam-gpu <command>
```

### Copy File from Container
```bash
docker cp deep-live-cam-gpu:/app/file.txt .
```

## Performance Benchmarks

| GPU | Face Swap | Restoration |
|-----|-----------|-------------|
| RTX 4090 | ~60 FPS | ~45 FPS |
| RTX 3080 | ~42 FPS | ~32 FPS |
| RTX 3060 Ti | ~35 FPS | ~25 FPS |
| T4 | ~25 FPS | ~18 FPS |

*@ 1080p resolution*

## System Requirements

**Minimum:**
- GPU: 6GB VRAM
- RAM: 8GB
- Disk: 20GB

**Recommended:**
- GPU: 12GB VRAM
- RAM: 16GB
- Disk: 50GB

## Common Issues

### Port In Use
```bash
# Use different port
PORT=8001 ./gpu-docker.sh start
```

### Container Exists
```bash
./gpu-docker.sh remove
./gpu-docker.sh start
```

### GPU Not Found
```bash
# Check NVIDIA driver
nvidia-smi

# Check Docker GPU access
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### Out of Memory
- Reduce resolution
- Close other GPU applications
- Use GPU with more VRAM

## Files Location

- **Script:** `gpu-docker.sh`
- **Dockerfile:** `Dockerfile.cuda`
- **Compose:** `docker-compose-gpu.yml`
- **Models:** `./models/`
- **Build Log:** `build.log`

## Documentation

- **Quick Start:** GPU_QUICK_START.md
- **Complete Guide:** GPU_DOCKER_SCRIPT.md
- **GPU Setup:** BUILD_GPU.md
- **Docker Guide:** README_DOCKER.md

## Support

```bash
# Show help
./gpu-docker.sh help

# Check system
./gpu-docker.sh check

# View logs
./gpu-docker.sh logs

# Test API
./gpu-docker.sh test
```

## One-Liners

```bash
# Complete deployment
./gpu-docker.sh check && ./gpu-docker.sh rebuild

# Restart and test
./gpu-docker.sh restart && sleep 5 && ./gpu-docker.sh test

# Backup and rebuild
./gpu-docker.sh backup && ./gpu-docker.sh rebuild

# Clean and fresh start
./gpu-docker.sh remove && ./gpu-docker.sh cleanup && ./gpu-docker.sh rebuild
```
