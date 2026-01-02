# Deploying to Cudo Compute Cloud GPUs

This guide covers deploying the face swap backend to Cudo Compute, a cloud GPU platform that provides cost-effective GPU instances for AI workloads.

## Prerequisites

1. Create a Cudo Compute account at https://compute.cudo.org/
2. Generate an API key from the dashboard
3. Install Docker on your local machine (for building the container)

## Quick Start

### 1. Build and Push Docker Image

```bash
cd backend

# Build the Docker image
docker build -t face-swap-backend:latest .

# Tag for your container registry (e.g., Docker Hub)
docker tag face-swap-backend:latest yourusername/face-swap-backend:latest

# Push to registry
docker push yourusername/face-swap-backend:latest
```

### 2. Deploy to Cudo Compute

You can deploy using either the Cudo Compute dashboard or their REST API.

#### Option A: Using the Dashboard

1. Log in to https://compute.cudo.org/
2. Navigate to "Virtual Machines"
3. Click "Create VM"
4. Select GPU instance type (recommended: RTX 3090, RTX 4090, or A100)
5. Configure:
   - **Image**: Ubuntu 22.04 with Docker
   - **GPU**: Select based on budget (RTX 3090 recommended for cost/performance)
   - **RAM**: Minimum 16GB
   - **Storage**: 50GB+
6. Under "Startup Script", add:

```bash
#!/bin/bash
docker pull yourusername/face-swap-backend:latest
docker run -d -p 8000:8000 --gpus all \
  -v /data/models:/app/models \
  yourusername/face-swap-backend:latest
```

7. Enable port 8000 in firewall settings
8. Launch the instance

#### Option B: Using the API

```bash
# Set your API key
export CUDO_API_KEY="your-api-key"

# Create VM using curl
curl -X POST https://rest.compute.cudo.org/v1/vms \
  -H "Authorization: Bearer $CUDO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "machineType": "gpu-rtx3090",
    "region": "us-east",
    "imageId": "ubuntu-22.04-docker",
    "diskSize": 50,
    "startupScript": "docker pull yourusername/face-swap-backend:latest && docker run -d -p 8000:8000 --gpus all yourusername/face-swap-backend:latest"
  }'
```

### 3. Configure Frontend

Once deployed, update your environment variables:

```env
VITE_BACKEND_URL=https://your-cudo-instance-ip:8000
```

Or configure the Supabase Edge Function to proxy requests to your Cudo Compute instance.

## GPU Instance Recommendations

### Budget Option: RTX 3090
- **VRAM**: 24GB
- **Performance**: ~100 FPS for face swap
- **Cost**: ~$0.50-0.80/hour
- **Best for**: Development and moderate usage

### Performance Option: RTX 4090
- **VRAM**: 24GB
- **Performance**: ~150 FPS for face swap
- **Cost**: ~$1.00-1.50/hour
- **Best for**: Production with high demand

### Enterprise Option: A100
- **VRAM**: 40GB/80GB
- **Performance**: ~200+ FPS for face swap
- **Cost**: ~$2.00-4.00/hour
- **Best for**: Large-scale production

## Monitoring and Scaling

### Health Check Endpoint

The backend includes a health check endpoint:

```bash
curl https://your-cudo-instance-ip:8000/health
```

### Auto-scaling with Cudo Compute

Create multiple instances and use a load balancer:

```bash
# Deploy multiple instances
for i in {1..3}; do
  curl -X POST https://rest.compute.cudo.org/v1/vms \
    -H "Authorization: Bearer $CUDO_API_KEY" \
    -d @vm-config.json
done
```

### Cost Optimization

1. **Spot Instances**: Use Cudo's spot pricing for 50-70% cost savings
2. **Auto-shutdown**: Stop instances during low usage periods
3. **Right-sizing**: Start with RTX 3090 and scale as needed

## Persistent Startup Configuration

The deployment scripts automatically configure Docker with the `--restart unless-stopped` policy, ensuring your backend:
- Starts automatically on VM boot
- Restarts after crashes
- Persists across VM reboots

For advanced persistence options including systemd services and health monitoring, see [CUDO_PERSISTENT_STARTUP.md](CUDO_PERSISTENT_STARTUP.md).

### Quick Verification

After deployment, verify persistence:

```bash
# SSH into your instance
ssh ubuntu@your-instance-ip

# Check Docker restart policy
docker inspect face-swap-backend | grep -A 5 RestartPolicy

# Test by rebooting
sudo reboot

# After reboot, verify container is running
docker ps
```

## Security Best Practices

1. **API Authentication**: Always require API keys for backend access
2. **HTTPS**: Use SSL/TLS certificates (Let's Encrypt recommended)
3. **Firewall**: Restrict port 8000 to your application's IP ranges
4. **Environment Variables**: Store sensitive data in Cudo's secrets manager

## Troubleshooting

### GPU Not Detected

```bash
# SSH into your instance
ssh ubuntu@your-instance-ip

# Check GPU availability
docker exec -it <container-id> python verify_gpu.py
```

### Model Download Issues

Models are automatically downloaded on first run. If you experience issues:

```bash
# Pre-download models
docker exec -it <container-id> python download_models.py
```

### Performance Issues

Monitor GPU usage:

```bash
# Install nvidia-smi
docker exec -it <container-id> nvidia-smi

# Check memory usage
docker stats
```

## API Reference

For detailed API documentation, visit:
- https://www.cudocompute.com/docs/rest-api/introduction
- https://www.cudocompute.com/docs

## Support

- Cudo Compute Documentation: https://www.cudocompute.com/docs
- Cudo Compute Support: https://support.cudocompute.com/
