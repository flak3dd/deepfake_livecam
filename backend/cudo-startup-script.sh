#!/bin/bash
set -e

# Face Swap Backend - Cudo Compute Startup Script
# Paste this into the "Startup Script" field when creating a VM at:
# https://compute.cudo.org/?create=virtual-machine

echo "========================================"
echo "Face Swap Backend - Automated Setup"
echo "========================================"

# Update system packages
echo "[1/6] Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install Docker
echo "[2/6] Installing Docker..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common

# Add Docker's official GPG key and repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io

# Install NVIDIA Docker support
echo "[3/6] Installing NVIDIA Docker runtime..."
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

apt-get update -y
apt-get install -y nvidia-container-toolkit

# Configure Docker to use NVIDIA runtime
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker

# Create models directory
echo "[4/6] Setting up data directories..."
mkdir -p /data/models

# Pull and run the face swap backend
echo "[5/6] Deploying Face Swap Backend..."
# IMPORTANT: Replace 'your-username/face-swap-backend:latest' with your actual Docker image
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

# Wait for service to start
echo "[6/6] Waiting for service to start..."
sleep 45

# Health check
echo "Running health check..."
if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ Health check passed!"
else
    echo "⚠ Health check failed - service may still be starting"
    echo "Check logs with: docker logs face-swap-backend"
fi

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || curl -s ifconfig.me)

# Print success message
echo ""
echo "========================================"
echo "✓ Setup Complete!"
echo "========================================"
echo ""
echo "Backend URL: http://${PUBLIC_IP}:8000"
echo "Health Check: http://${PUBLIC_IP}:8000/health"
echo ""
echo "Useful Commands:"
echo "  View logs:      docker logs -f face-swap-backend"
echo "  Restart:        docker restart face-swap-backend"
echo "  Stop:           docker stop face-swap-backend"
echo "  GPU status:     nvidia-smi"
echo ""
echo "Auto-restart: ENABLED"
echo "Survives reboots: YES"
echo "========================================"
