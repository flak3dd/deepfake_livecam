#!/bin/bash

# Cudo Compute Deployment Script
# This script automates the deployment of the face swap backend to Cudo Compute

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Face Swap Backend - Cudo Compute Deployment${NC}"
echo ""

# Check if API key is set
if [ -z "$CUDO_API_KEY" ]; then
    echo -e "${RED}Error: CUDO_API_KEY environment variable is not set${NC}"
    echo "Please set it with: export CUDO_API_KEY='your-api-key'"
    exit 1
fi

# Configuration
DOCKER_IMAGE=${DOCKER_IMAGE:-"yourusername/face-swap-backend:latest"}
PROJECT_ID=${CUDO_PROJECT_ID:-"default"}
MACHINE_TYPE=${CUDO_MACHINE_TYPE:-"gpu-rtx3090"}
REGION=${CUDO_REGION:-"us-east"}
DISK_SIZE=${CUDO_DISK_SIZE:-50}

echo "Configuration:"
echo "  Docker Image: $DOCKER_IMAGE"
echo "  Machine Type: $MACHINE_TYPE"
echo "  Region: $REGION"
echo "  Disk Size: ${DISK_SIZE}GB"
echo ""

# Step 1: Build Docker image
echo -e "${YELLOW}Step 1: Building Docker image...${NC}"
read -p "Build and push Docker image? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker build -t face-swap-backend:latest .
    docker tag face-swap-backend:latest $DOCKER_IMAGE
    docker push $DOCKER_IMAGE
    echo -e "${GREEN}Docker image built and pushed successfully${NC}"
else
    echo "Skipping Docker build..."
fi
echo ""

# Step 2: Create startup script
STARTUP_SCRIPT=$(cat <<'EOF'
#!/bin/bash
set -e

echo "Installing Docker and NVIDIA Docker support..."
apt-get update
apt-get install -y docker.io nvidia-docker2 curl
systemctl restart docker

echo "Pulling Docker image..."
docker pull DOCKER_IMAGE_PLACEHOLDER

echo "Starting face swap backend with persistent restart policy..."
docker run -d \
  --name face-swap-backend \
  --gpus all \
  --restart unless-stopped \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  -p 8000:8000 \
  -v /data/models:/app/models \
  DOCKER_IMAGE_PLACEHOLDER

echo "Waiting for service to start..."
sleep 30

echo "Running health check..."
curl -f http://localhost:8000/health || echo "Warning: Health check failed"

echo "Setup complete! Backend is running with auto-restart enabled."
EOF
)

STARTUP_SCRIPT=${STARTUP_SCRIPT//DOCKER_IMAGE_PLACEHOLDER/$DOCKER_IMAGE}

# Step 3: Deploy to Cudo Compute
echo -e "${YELLOW}Step 2: Deploying to Cudo Compute...${NC}"

RESPONSE=$(curl -s -X POST https://rest.compute.cudo.org/v1/vms \
  -H "Authorization: Bearer $CUDO_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"machineType\": \"$MACHINE_TYPE\",
    \"region\": \"$REGION\",
    \"imageId\": \"ubuntu-22.04-docker\",
    \"diskSize\": $DISK_SIZE,
    \"startupScript\": $(echo "$STARTUP_SCRIPT" | jq -Rs .),
    \"firewallRules\": [
      {
        \"port\": 8000,
        \"protocol\": \"tcp\",
        \"source\": \"0.0.0.0/0\"
      }
    ]
  }")

# Check if deployment was successful
if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    VM_ID=$(echo "$RESPONSE" | jq -r '.id')
    VM_IP=$(echo "$RESPONSE" | jq -r '.publicIp // "pending"')

    echo -e "${GREEN}Deployment successful!${NC}"
    echo ""
    echo "VM Details:"
    echo "  ID: $VM_ID"
    echo "  IP Address: $VM_IP"
    echo ""
    echo "Next steps:"
    echo "1. Wait 5-10 minutes for the VM to initialize and download models"
    echo "2. Test the endpoint: curl http://$VM_IP:8000/health"
    echo "3. Update your Supabase Edge Function environment variable:"
    echo "   FACE_PROCESSING_BACKEND_URL=http://$VM_IP:8000"
    echo ""
    echo "To configure Supabase:"
    echo "  supabase secrets set FACE_PROCESSING_BACKEND_URL=http://$VM_IP:8000"
else
    echo -e "${RED}Deployment failed!${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi
