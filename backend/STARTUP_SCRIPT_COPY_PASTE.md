# Copy-Paste Startup Script for Cudo Compute

Quick reference - just copy the script below and paste it into Cudo Compute's VM creation interface.

## Where to Use This

Go to: https://compute.cudo.org/?create=virtual-machine

1. Select **Ubuntu 22.04 LTS**
2. Choose **GPU instance** (RTX 3090 recommended)
3. Set storage to **50GB minimum**
4. Scroll to **"Startup Script"** section
5. Copy and paste the script below
6. **Replace** `your-username/face-swap-backend:latest` with your actual Docker image name
7. Click **"Create"**

## The Script

```bash
#!/bin/bash
set -e

echo "Installing Docker and NVIDIA runtime..."
apt-get update -y && apt-get install -y curl gnupg

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
apt-get update -y && apt-get install -y nvidia-container-toolkit
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker

# Create models directory
mkdir -p /data/models

# Deploy Face Swap Backend
echo "Deploying Face Swap Backend..."
DOCKER_IMAGE="your-username/face-swap-backend:latest"

docker pull $DOCKER_IMAGE

docker run -d \
  --name face-swap-backend \
  --gpus all \
  --restart unless-stopped \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  -p 8000:8000 \
  -v /data/models:/app/models \
  $DOCKER_IMAGE

sleep 30
curl -f http://localhost:8000/health && echo "✓ Backend ready!" || echo "⚠ Check logs: docker logs face-swap-backend"
```

## What to Customize

### 1. Docker Image (REQUIRED)

Replace this line:
```bash
DOCKER_IMAGE="your-username/face-swap-backend:latest"
```

With your actual image, for example:
```bash
DOCKER_IMAGE="johnsmith/face-swap-backend:latest"
```

Or for GitHub Container Registry:
```bash
DOCKER_IMAGE="ghcr.io/username/face-swap-backend:latest"
```

### 2. Memory Limit (Optional)

To limit memory usage, change the docker run line to:
```bash
docker run -d \
  --name face-swap-backend \
  --gpus all \
  --restart unless-stopped \
  --memory="8g" \
  --cpus="4" \
  ...
```

### 3. Environment Variables (Optional)

To pass environment variables:
```bash
docker run -d \
  --name face-swap-backend \
  --gpus all \
  --restart unless-stopped \
  -e API_KEY="your-secret-key" \
  -e MODEL_QUALITY="high" \
  ...
```

## After VM Creation

### 1. Wait for Setup
The script takes 3-5 minutes to complete. You can monitor progress via SSH:

```bash
ssh ubuntu@YOUR-VM-IP
sudo tail -f /var/log/cloud-init-output.log
```

### 2. Get Your IP
Find your VM's public IP in the Cudo Console at:
https://compute.cudo.org/virtual-machines

### 3. Test Health Endpoint
```bash
curl http://YOUR-VM-IP:8000/health
```

### 4. Update Frontend
Update your Supabase Edge Function:
```bash
supabase secrets set FACE_PROCESSING_BACKEND_URL=http://YOUR-VM-IP:8000
```

## Verification Commands

SSH into your VM and run:

```bash
# Check container is running
docker ps

# View logs
docker logs face-swap-backend

# Check GPU access
docker exec face-swap-backend nvidia-smi

# Verify auto-restart
docker inspect face-swap-backend | grep RestartPolicy
```

## Troubleshooting

### Script Didn't Run
```bash
sudo cat /var/log/cloud-init-output.log
```

### Container Not Starting
```bash
docker logs face-swap-backend
```

### Port Not Accessible
Check firewall settings in Cudo Console - ensure port 8000 is open.

## Complete Documentation

For advanced options, see:
- [CUDO_STARTUP_SCRIPT_GUIDE.md](CUDO_STARTUP_SCRIPT_GUIDE.md) - Full guide with customization options
- [CUDO_PERSISTENT_STARTUP.md](CUDO_PERSISTENT_STARTUP.md) - Advanced persistence configuration
- [CUDO_COMPUTE_DEPLOYMENT.md](CUDO_COMPUTE_DEPLOYMENT.md) - Complete deployment reference
