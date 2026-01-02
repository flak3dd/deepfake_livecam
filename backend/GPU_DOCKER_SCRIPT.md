# GPU Docker Management Script

Complete CUDA GPU Docker build and run script with comprehensive management features.

## Overview

`gpu-docker.sh` is a production-ready management script for the Deep Live Cam GPU backend. It handles everything from system checks to deployment, monitoring, and maintenance.

## Features

- Comprehensive system validation
- Color-coded output for better readability
- Automatic prerequisite checking
- Container lifecycle management
- Real-time monitoring
- API testing
- Model backup/restore
- Resource cleanup
- Interactive shell access
- Detailed error messages with solutions

## Quick Start

```bash
# One-command deployment
./gpu-docker.sh rebuild

# Or step by step
./gpu-docker.sh check    # Verify system
./gpu-docker.sh build    # Build image
./gpu-docker.sh start    # Start container
```

## All Commands

### System Management

#### check
Comprehensive system validation including:
- Docker installation and daemon status
- NVIDIA driver detection
- NVIDIA Container Toolkit verification
- GPU information and capabilities
- Disk space check
- Memory check
- Port availability

```bash
./gpu-docker.sh check
```

**Output:**
```
[INFO] Checking Docker installation...
[SUCCESS] Docker is installed and running
[INFO] Checking NVIDIA driver...
[SUCCESS] NVIDIA driver detected: 535.129.03
[INFO] Checking NVIDIA Container Toolkit...
[SUCCESS] NVIDIA Container Toolkit is configured
[INFO] GPU Information:

  GPU 0: NVIDIA GeForce RTX 3080
    Driver: 535.129.03
    Memory: 10240 MiB
    Compute Capability: 8.6
```

### Build and Deployment

#### build
Build the CUDA-enabled Docker image.

```bash
./gpu-docker.sh build
```

**Features:**
- Validates system before building
- Shows build progress
- Logs build output to `build.log`
- Reports build time and image size
- Handles errors gracefully

**Expected Duration:** 10-15 minutes (first build)

#### start
Start the container with GPU acceleration.

```bash
./gpu-docker.sh start

# Specify GPU device
GPU_ID=1 ./gpu-docker.sh start
```

**What it does:**
1. Checks if image exists
2. Creates models directory
3. Starts container with GPU access
4. Waits for service to be ready
5. Shows service status

#### stop
Stop the running container.

```bash
./gpu-docker.sh stop
```

#### restart
Restart the container (useful after code changes).

```bash
./gpu-docker.sh restart
```

#### remove
Remove the container (keeps image and models).

```bash
./gpu-docker.sh remove
```

#### rebuild
Complete rebuild - removes container, rebuilds image, and starts fresh.

```bash
./gpu-docker.sh rebuild
```

**Use when:**
- Updating dependencies
- Major code changes
- Switching between CPU/GPU builds
- Troubleshooting issues

### Monitoring and Debugging

#### status
Show comprehensive service status.

```bash
./gpu-docker.sh status
```

**Output includes:**
- Container running state
- Container ID and uptime
- Service URLs
- Health check response
- Available commands

**Example:**
```
================================================
  Service Status
================================================
Status: Running

Container: deep-live-cam-gpu
ID: a1b2c3d4e5f6
Uptime: Up 2 hours

URLs:
  API:         http://localhost:8000
  Health:      http://localhost:8000/health
  Docs:        http://localhost:8000/docs
  Interactive: http://localhost:8000/redoc

Health Check:
{
  "status": "healthy",
  "models_loaded": true,
  "device": "cuda",
  "cuda_available": true
}
```

#### logs
View container logs.

```bash
# Last 50 lines (default)
./gpu-docker.sh logs

# Last 100 lines
./gpu-docker.sh logs 100

# Follow logs in real-time
./gpu-docker.sh logs follow
```

**Use cases:**
- Debugging startup issues
- Monitoring API requests
- Checking model loading
- Investigating errors

#### monitor
Real-time monitoring of container and GPU usage.

```bash
./gpu-docker.sh monitor
```

**Displays:**
- Container CPU/Memory usage
- GPU utilization percentage
- GPU memory usage
- GPU temperature
- Updates every second

Press `Ctrl+C` to exit.

**Example output:**
```
=== Container Stats ===
CONTAINER          CPU %    MEM USAGE / LIMIT    MEM %
deep-live-cam-gpu  45.2%    3.2GB / 16GB        20.0%

=== GPU Usage ===
0, NVIDIA GeForce RTX 3080, 82%, 67%, 6842MiB, 10240MiB, 76C
```

#### shell
Open interactive bash shell inside container.

```bash
./gpu-docker.sh shell
```

**Use for:**
- Inspecting file system
- Running Python commands
- Debugging model issues
- Checking CUDA availability
- Manual testing

**Example commands inside container:**
```bash
python3 -c "import torch; print(torch.cuda.is_available())"
nvidia-smi
ls -la /app/models/
```

#### test
Test API endpoints automatically.

```bash
./gpu-docker.sh test
```

**Tests:**
- Root endpoint (/)
- Health endpoint (/health)
- API response time
- JSON parsing

**Output:**
```
Testing root endpoint...
{
  "message": "Deep Live Cam Face Processing API",
  "version": "2.0.0",
  "status": "ready",
  "device": "cuda"
}

Testing health endpoint...
{
  "status": "healthy",
  "models_loaded": true,
  "cuda_available": true
}

[SUCCESS] API is responding
```

### Maintenance

#### backup
Create timestamped backup of model files.

```bash
./gpu-docker.sh backup
```

**Creates:** `models_backup_YYYYMMDD_HHMMSS.tar.gz`

**Example:**
```
[INFO] Creating backup: models_backup_20260102_143022.tar.gz
[SUCCESS] Backup created: models_backup_20260102_143022.tar.gz (1.8G)
```

**Use before:**
- Major updates
- Model changes
- System upgrades

#### restore
Restore models from backup.

```bash
./gpu-docker.sh restore models_backup_20260102_143022.tar.gz
```

**Warning:** Overwrites existing models directory.

#### cleanup
Clean up Docker resources to free disk space.

```bash
./gpu-docker.sh cleanup
```

**Removes:**
- Stopped containers
- Unused images
- Unused volumes
- Unused networks

**Safe:** Only removes unused resources, doesn't affect running containers.

## Environment Variables

### GPU_ID
Specify which GPU to use (for multi-GPU systems).

```bash
# Use GPU 0 (default)
./gpu-docker.sh start

# Use GPU 1
GPU_ID=1 ./gpu-docker.sh start

# Use multiple GPUs
GPU_ID=0,1 ./gpu-docker.sh start
```

### PORT
Change the exposed port (default: 8000).

```bash
PORT=8080 ./gpu-docker.sh start
```

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - System check failed
- `3` - Build failed
- `4` - Container start failed

## Logs and Output

### Build Log
Build output is saved to `build.log` for troubleshooting.

### Color Coding
- **Blue [INFO]** - Informational messages
- **Green [SUCCESS]** - Successful operations
- **Yellow [WARNING]** - Warnings (non-fatal)
- **Red [ERROR]** - Errors (fatal)

## Common Workflows

### First Time Setup
```bash
./gpu-docker.sh check    # Verify prerequisites
./gpu-docker.sh rebuild  # Build and start
./gpu-docker.sh test     # Verify API
./gpu-docker.sh monitor  # Watch GPU usage
```

### Daily Development
```bash
# After code changes
./gpu-docker.sh restart

# Check logs
./gpu-docker.sh logs follow

# Debug issues
./gpu-docker.sh shell
```

### Production Deployment
```bash
./gpu-docker.sh backup   # Backup models
./gpu-docker.sh rebuild  # Fresh deployment
./gpu-docker.sh test     # Verify API
./gpu-docker.sh status   # Confirm status
```

### Troubleshooting
```bash
./gpu-docker.sh logs 200        # Check recent logs
./gpu-docker.sh shell           # Inspect container
./gpu-docker.sh remove          # Remove container
./gpu-docker.sh cleanup         # Clean Docker
./gpu-docker.sh rebuild         # Fresh start
```

### Maintenance
```bash
./gpu-docker.sh backup          # Backup models
./gpu-docker.sh stop            # Stop service
./gpu-docker.sh cleanup         # Clean resources
./gpu-docker.sh build           # Rebuild image
./gpu-docker.sh start           # Start service
```

## Advanced Usage

### Multi-GPU Setup

**Load balancing with multiple containers:**

```bash
# Start on GPU 0
GPU_ID=0 PORT=8000 CONTAINER_NAME=gpu-0 ./gpu-docker.sh start

# Start on GPU 1
GPU_ID=1 PORT=8001 CONTAINER_NAME=gpu-1 ./gpu-docker.sh start
```

Then use a load balancer (NGINX, HAProxy) to distribute requests.

### Automated Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Deploying Deep Live Cam GPU Backend..."

# Backup
./gpu-docker.sh backup

# Pull latest code
git pull

# Rebuild
./gpu-docker.sh rebuild

# Test
sleep 10
./gpu-docker.sh test

echo "Deployment complete!"
```

### Health Check Monitoring

```bash
#!/bin/bash
# monitor-health.sh

while true; do
    if ! curl -sf http://localhost:8000/health > /dev/null; then
        echo "Service unhealthy, restarting..."
        ./gpu-docker.sh restart
    fi
    sleep 60
done
```

### Automated Backup

```bash
#!/bin/bash
# backup-cron.sh

# Add to crontab: 0 2 * * * /path/to/backup-cron.sh

cd /path/to/backend
./gpu-docker.sh backup

# Keep only last 7 backups
ls -t models_backup_*.tar.gz | tail -n +8 | xargs -r rm
```

## Error Messages and Solutions

### "Docker is not installed"
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### "NVIDIA driver not found"
```bash
# Ubuntu
sudo apt update
sudo apt install nvidia-driver-535
sudo reboot
```

### "NVIDIA Container Toolkit is not properly configured"
Follow the installation commands shown in the error message.

### "Port 8000 is already in use"
```bash
# Find and stop the process
sudo lsof -ti:8000 | xargs sudo kill -9

# Or use a different port
PORT=8001 ./gpu-docker.sh start
```

### "Container already exists"
```bash
./gpu-docker.sh remove
./gpu-docker.sh start
```

## Performance Tips

1. **First Run:** Initial model download takes 10-15 minutes
2. **Build Cache:** Subsequent builds are faster (2-3 minutes)
3. **Model Cache:** Models are cached in `./models/` directory
4. **GPU Warm-up:** First inference is slower (model initialization)
5. **Concurrent Requests:** Use multiple workers for production

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Build and Test GPU Backend

on: [push]

jobs:
  gpu-test:
    runs-on: ubuntu-latest-gpu
    steps:
      - uses: actions/checkout@v3
      - name: Check System
        run: cd backend && ./gpu-docker.sh check
      - name: Build Image
        run: cd backend && ./gpu-docker.sh build
      - name: Start Container
        run: cd backend && ./gpu-docker.sh start
      - name: Test API
        run: cd backend && ./gpu-docker.sh test
      - name: Cleanup
        run: cd backend && ./gpu-docker.sh remove
```

## Comparison with Other Scripts

| Feature | gpu-docker.sh | build-gpu.sh | docker-compose |
|---------|---------------|--------------|----------------|
| System checks | Comprehensive | Basic | None |
| Color output | Yes | No | No |
| Monitoring | Built-in | Manual | Manual |
| Backup/Restore | Yes | No | No |
| API testing | Yes | No | No |
| Error recovery | Yes | Basic | No |
| Multi-GPU | Yes | No | Yes |
| Shell access | Yes | Manual | Manual |

## Support

For issues:
1. Check logs: `./gpu-docker.sh logs`
2. Verify system: `./gpu-docker.sh check`
3. Review documentation: `BUILD_GPU.md`
4. Test API: `./gpu-docker.sh test`

## License

Part of the Deep Live Cam project.
