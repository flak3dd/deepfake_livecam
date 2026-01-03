# Backend Hosting Checklist

## Prerequisites
- [ ] Docker Hub account (or GitHub Container Registry)
- [ ] Cudo Compute account at https://compute.cudo.org/

## Step 1: Build and Push Docker Image

On your local machine:

```bash
cd backend

# Build GPU-enabled image
docker build -f Dockerfile.cuda -t face-swap-backend:latest .

# Login to Docker Hub
docker login

# Tag with your username
docker tag face-swap-backend:latest YOUR_USERNAME/face-swap-backend:latest

# Push to registry
docker push YOUR_USERNAME/face-swap-backend:latest
```

Replace `YOUR_USERNAME` with your Docker Hub username.

## Step 2: Deploy on Cudo Compute

1. Go to https://compute.cudo.org/
2. Click **"Create VM"**
3. Select GPU:
   - **Budget**: RTX A5000 (24GB VRAM) - ~$0.60-1.00/hr
   - **Performance**: A40 or RTX A6000 (48GB) - ~$1.50-2.00/hr
   - **Maximum**: A100 PCIe (80GB) - ~$2.50-4.00/hr
4. Configure:
   - RAM: 16GB minimum
   - Storage: 50GB+
   - Region: Closest to your users
5. In **"Startup Script"** section, paste:

```bash
#!/bin/bash
set -e

apt-get update -y && apt-get install -y curl
curl -fsSL https://get.docker.com | sh

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
apt-get update -y && apt-get install -y nvidia-container-toolkit
nvidia-ctk runtime configure --runtime=docker
systemctl restart docker

mkdir -p /data/models

docker pull YOUR_USERNAME/face-swap-backend:latest

docker run -d \
  --name face-swap-backend \
  --gpus all \
  --restart unless-stopped \
  -p 8000:8000 \
  -v /data/models:/app/models \
  YOUR_USERNAME/face-swap-backend:latest

sleep 30
curl http://localhost:8000/health && echo "✓ Backend ready!"
```

6. **IMPORTANT**: Replace `YOUR_USERNAME` with your Docker Hub username in the script
7. Enable firewall rule for **port 8000**
8. Click **"Create"**

## Step 3: Wait for Deployment

- Initial setup takes 3-5 minutes
- Model download happens on first request (adds 2-3 minutes)
- Monitor progress via SSH: `ssh ubuntu@YOUR-VM-IP` then `docker logs -f face-swap-backend`

## Step 4: Get Your VM IP

- Find the **Public IP** in your Cudo Compute dashboard
- Test backend: `curl http://YOUR-VM-IP:8000/health`

## Step 5: Update Frontend Configuration

Update `.env` file:
```env
VITE_FACE_PROCESSING_BACKEND_URL=http://YOUR-VM-IP:8000
```

Then rebuild and redeploy frontend:
```bash
npm run build
```

## Step 6: Deploy Supabase Edge Function (Optional)

If using the Supabase proxy:

```bash
# Deploy edge function
npx supabase functions deploy face-swap-proxy

# Set backend URL as secret
npx supabase secrets set FACE_PROCESSING_BACKEND_URL=http://YOUR-VM-IP:8000
```

Update frontend to use proxy:
```env
VITE_FACE_PROCESSING_BACKEND_URL=https://fmejymngjnhymlssoucr.supabase.co/functions/v1/face-swap-proxy
```

## Verification

Test the complete flow:

```bash
# Test backend directly
curl http://YOUR-VM-IP:8000/health

# Test through Supabase proxy (if using)
curl https://fmejymngjnhymlssoucr.supabase.co/functions/v1/face-swap-proxy/health
```

## Monitoring

SSH into your VM:
```bash
ssh ubuntu@YOUR-VM-IP
```

Useful commands:
```bash
# View logs
docker logs -f face-swap-backend

# Check GPU usage
nvidia-smi

# Check container status
docker ps

# Restart backend
docker restart face-swap-backend

# View resource usage
docker stats face-swap-backend
```

## Cost Optimization

- **Auto-shutdown**: Stop VM during low usage periods
- **Spot instances**: Use Cudo's spot pricing for 50-70% savings
- **Right-sizing**: Start with RTX A5000, upgrade if needed

## Troubleshooting

### Container won't start
```bash
docker logs face-swap-backend
```

### GPU not detected
```bash
docker exec face-swap-backend nvidia-smi
```

### Health check fails
- Wait 5 minutes for models to download
- Check firewall allows port 8000
- Verify Docker container is running: `docker ps`

### Backend URL not working
- Ensure firewall rule exists for port 8000
- Try using IP instead of hostname
- Check if VM is running in Cudo dashboard

## Production Recommendations

1. **Use HTTPS**: Set up SSL/TLS with Let's Encrypt
2. **API Authentication**: Add API key validation to backend
3. **Rate Limiting**: Implement request throttling
4. **Monitoring**: Set up alerting for downtime
5. **Backups**: Regular snapshots of VM state
6. **Load Balancing**: Deploy multiple instances for high traffic

## Support

- Cudo Compute Docs: https://www.cudocompute.com/docs
- Backend Setup: See `backend/README.md`
- GPU Commands: See `backend/GPU_COMMANDS_REFERENCE.md`
