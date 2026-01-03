# Troubleshooting Guide

Common issues and solutions for Deep Live Cam GPU Docker setup.

## "Could not import module 'main'" Error

### Cause
The docker-compose file was mounting the entire project directory (`./:/app`), which overwrote the installed Python dependencies in the container.

### Solution
This has been fixed in the latest `docker-compose-gpu.yml`. The file now only mounts specific Python files:
- `main.py`
- `face_swapper.py`
- `face_restoration.py`
- `model_manager.py`
- `models/` directory

### If You Still See This Error
1. Stop and remove the container:
   ```cmd
   gpu-docker.bat stop
   gpu-docker.bat rm
   ```

2. Rebuild the image:
   ```cmd
   gpu-docker.bat rebuild
   ```

3. Start again:
   ```cmd
   gpu-docker.bat start
   ```

## "NVIDIA Driver was not detected" Warning

### During System Check
This warning during `gpu-docker.bat check` is **NORMAL**. The system check runs a test container to verify your setup, and GPU warnings during this phase can be ignored if the check passes.

### During Container Runtime
If you see this warning when your actual container is running:

1. **Verify NVIDIA Driver on Host**
   ```cmd
   nvidia-smi
   ```
   Should show your GPU information. If not, install/update NVIDIA drivers.

2. **Check Docker Desktop GPU Support**
   - Open Docker Desktop Settings
   - Go to "Resources" → "WSL Integration"
   - Ensure WSL 2 is enabled
   - Restart Docker Desktop

3. **Verify NVIDIA Container Toolkit in WSL 2**
   Open WSL terminal and run:
   ```bash
   docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
   ```

   If this fails, install the toolkit:
   ```bash
   distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
   curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
   curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
       sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
       sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
   sudo apt-get update
   sudo apt-get install -y nvidia-container-toolkit
   sudo systemctl restart docker
   ```

4. **Verify GPU Access in Running Container**
   ```cmd
   gpu-docker.bat shell
   ```
   Then inside the container:
   ```bash
   nvidia-smi
   python3 -c "import torch; print('CUDA Available:', torch.cuda.is_available())"
   ```

## Port 8000 Already in Use

### Symptoms
- Container fails to start
- Error message mentions port 8000 is already allocated

### Solution
1. **Find what's using port 8000:**
   ```cmd
   netstat -ano | findstr :8000
   ```

2. **Stop the conflicting process** or **change the port:**

   Edit `docker-compose-gpu.yml`:
   ```yaml
   ports:
     - "8001:8000"  # Change 8000 to 8001 or any free port
   ```

## Build Fails - Network/Download Issues

### Symptoms
- Build stops during pip install
- Download timeouts
- Connection errors

### Solution
1. **Check Internet Connection**

2. **Try with Docker Build Cache Cleared:**
   ```cmd
   gpu-docker.bat rebuild
   ```

3. **Increase Docker Memory** (if build crashes):
   - Open Docker Desktop Settings
   - Go to "Resources"
   - Increase memory allocation to at least 8GB

## Models Not Downloading

### Symptoms
- Application starts but fails on first face swap
- "Model not found" errors in logs

### Solution
1. **Check Models Directory:**
   ```cmd
   dir backend\models
   ```

2. **Manually Download Models** (if needed):
   ```cmd
   gpu-docker.bat shell
   ```
   Then inside container:
   ```bash
   python3 download_models.py
   ```

3. **Verify Models Directory is Mounted:**
   Check that `docker-compose-gpu.yml` has:
   ```yaml
   volumes:
     - ./models:/app/models
   ```

## Container Keeps Restarting

### Symptoms
- Container shows "Restarting" status
- Can't access API at localhost:8000

### Solution
1. **Check Container Logs:**
   ```cmd
   gpu-docker.bat logs
   ```

2. **Common Causes:**
   - Python import errors → Rebuild container
   - Out of memory → Increase Docker memory allocation
   - Port conflict → Change port in docker-compose
   - Missing dependencies → Check requirements.txt and rebuild

3. **Stop Auto-Restart:**
   If you need to debug, edit `docker-compose-gpu.yml`:
   ```yaml
   restart: "no"  # Change from "unless-stopped"
   ```

## Health Check Failing

### Symptoms
- Container shows "unhealthy" status
- API not responding

### Solution
1. **Check if App is Running:**
   ```cmd
   gpu-docker.bat shell
   ```
   Inside container:
   ```bash
   ps aux | grep uvicorn
   curl http://localhost:8000/health
   ```

2. **Check Uvicorn Logs:**
   ```cmd
   gpu-docker.bat logs
   ```

3. **Disable Health Check Temporarily** (for debugging):
   Comment out in `docker-compose-gpu.yml`:
   ```yaml
   # healthcheck:
   #   test: ["CMD", "python3", "-c", "import requests; requests.get('http://localhost:8000/health')"]
   ```

## Low Performance / Slow Processing

### Symptoms
- Face swap takes too long
- High CPU usage instead of GPU

### Solution
1. **Verify GPU is Being Used:**
   ```cmd
   gpu-docker.bat monitor
   ```
   Should show GPU utilization when processing.

2. **Check PyTorch is Using CUDA:**
   ```cmd
   gpu-docker.bat shell
   ```
   ```bash
   python3 -c "import torch; print('CUDA:', torch.cuda.is_available()); print('Device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
   ```

3. **If Using CPU Instead of GPU:**
   - Verify NVIDIA drivers are up to date
   - Ensure container has GPU access (see NVIDIA Driver section above)
   - Check that `CUDA_VISIBLE_DEVICES=0` is set in docker-compose

## Getting More Help

### Collect Debug Information
```cmd
REM System info
nvidia-smi
docker --version
docker-compose --version

REM Container info
gpu-docker.bat status
gpu-docker.bat logs

REM GPU test
gpu-docker.bat shell
# Then in container:
python3 verify_gpu.py
```

### Check Documentation
- `GPU_QUICK_START.md` - Complete setup guide
- `DOCKER_GPU_COMPLETE.md` - Docker GPU configuration details
- `README_DOCKER.md` - General Docker usage
- `QUICK_BUILD_RUN.md` - Build script usage

### Docker Desktop Logs
If Docker itself is having issues:
1. Open Docker Desktop
2. Click the bug icon (top right)
3. View diagnostics and logs
