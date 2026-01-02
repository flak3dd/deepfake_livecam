# Cudo Compute Startup Script Guide

Complete guide for deploying the Face Swap Backend using Cudo Compute's startup script feature.

## Quick Start

1. Go to https://compute.cudo.org/?create=virtual-machine
2. Configure your VM:
   - **Machine Type**: GPU instance (RTX 3090 or better recommended)
   - **OS**: Ubuntu 22.04 LTS
   - **Storage**: 50GB minimum
3. Scroll to **"Startup Script"** section
4. Copy and paste the script below
5. **IMPORTANT**: Replace `your-username/face-swap-backend:latest` with your actual Docker image
6. Click **"Create"**

## Startup Script

Copy this entire script:

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

## Customization

### 1. Docker Image

Replace this line with your actual image:
```bash
DOCKER_IMAGE="your-username/face-swap-backend:latest"
```

Examples:
- Docker Hub: `johnsmith/face-swap-backend:latest`
- GitHub Registry: `ghcr.io/username/face-swap-backend:latest`
- Private Registry: `registry.example.com/face-swap-backend:latest`

### 2. Resource Limits

Add resource constraints to prevent overconsumption:
```bash
docker run -d \
  --name face-swap-backend \
  --gpus all \
  --restart unless-stopped \
  --memory="8g" \
  --cpus="4" \
  ...
```

### 3. Environment Variables

Pass environment variables to the container:
```bash
docker run -d \
  --name face-swap-backend \
  --gpus all \
  --restart unless-stopped \
  -e API_KEY="your-secret-key" \
  -e MODEL_QUALITY="high" \
  ...
```

### 4. Additional Ports

Expose multiple ports:
```bash
docker run -d \
  --name face-swap-backend \
  --gpus all \
  --restart unless-stopped \
  -p 8000:8000 \
  -p 8001:8001 \
  ...
```

## Verification Steps

### 1. Check Startup Script Execution

SSH into your VM:
```bash
ssh ubuntu@your-cudo-vm-ip
```

Check cloud-init logs:
```bash
# View startup script execution
sudo cat /var/log/cloud-init-output.log

# Check for errors
sudo tail -f /var/log/cloud-init-output.log
```

### 2. Verify Docker Installation

```bash
# Check Docker is running
sudo systemctl status docker

# Verify NVIDIA Docker runtime
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### 3. Check Container Status

```bash
# List running containers
docker ps

# Check container logs
docker logs face-swap-backend

# Follow logs in real-time
docker logs -f face-swap-backend
```

### 4. Test Health Endpoint

```bash
# From VM
curl http://localhost:8000/health

# From your local machine (replace with actual IP)
curl http://YOUR-VM-IP:8000/health
```

### 5. Verify Auto-Restart

```bash
# Check restart policy
docker inspect face-swap-backend | grep -A 5 RestartPolicy

# Test restart on failure
docker stop face-swap-backend
sleep 5
docker ps  # Should show container running again

# Test reboot persistence
sudo reboot
# Wait for VM to restart, then:
docker ps  # Should show container running
```

## Troubleshooting

### Startup Script Didn't Run

Check cloud-init status:
```bash
cloud-init status
```

View full logs:
```bash
sudo cat /var/log/cloud-init.log
sudo cat /var/log/cloud-init-output.log
```

### Docker Not Installed

Manually run installation:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### NVIDIA Runtime Not Working

Check NVIDIA drivers:
```bash
nvidia-smi
```

Reinstall NVIDIA Container Toolkit:
```bash
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### Container Not Starting

Check logs:
```bash
docker logs face-swap-backend
```

Try running manually:
```bash
docker run --rm --gpus all -p 8000:8000 your-username/face-swap-backend:latest
```

### Image Pull Fails

Verify image exists:
```bash
docker pull your-username/face-swap-backend:latest
```

For private registries, login first:
```bash
docker login registry.example.com
```

### Port 8000 Not Accessible

Check firewall rules in Cudo Console:
- Navigate to your VM
- Click "Networking" or "Firewall"
- Add rule: TCP port 8000 from 0.0.0.0/0

Check if container is listening:
```bash
docker port face-swap-backend
netstat -tlnp | grep 8000
```

## Advanced Configuration

### Using Docker Compose

If you prefer Docker Compose, modify the startup script:

```bash
#!/bin/bash
set -e

# Install Docker and NVIDIA runtime (same as above)
# ...

# Install Docker Compose
apt-get install -y docker-compose-plugin

# Create docker-compose.yml
cat > /opt/face-swap/docker-compose.yml <<EOF
version: '3.8'
services:
  backend:
    image: your-username/face-swap-backend:latest
    container_name: face-swap-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - /data/models:/app/models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
EOF

cd /opt/face-swap
docker compose up -d
```

### Health Monitoring Service

Add automatic health monitoring:

```bash
# At the end of your startup script, add:

cat > /usr/local/bin/face-swap-monitor.sh <<'EOF'
#!/bin/bash
while true; do
    if ! curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "$(date): Health check failed, restarting container..."
        docker restart face-swap-backend
    fi
    sleep 60
done
EOF

chmod +x /usr/local/bin/face-swap-monitor.sh

# Create systemd service
cat > /etc/systemd/system/face-swap-monitor.service <<EOF
[Unit]
Description=Face Swap Backend Health Monitor
After=docker.service

[Service]
Type=simple
ExecStart=/usr/local/bin/face-swap-monitor.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl enable face-swap-monitor.service
systemctl start face-swap-monitor.service
```

### SSL/TLS with Nginx Reverse Proxy

Add SSL termination:

```bash
# Install Nginx and Certbot
apt-get install -y nginx certbot python3-certbot-nginx

# Configure Nginx
cat > /etc/nginx/sites-available/face-swap <<EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/face-swap /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Get SSL certificate (replace with your domain)
certbot --nginx -d your-domain.com --non-interactive --agree-tos --email your-email@example.com
```

## Getting Your VM IP

After VM creation, find your public IP:

### From Cudo Console
1. Go to https://compute.cudo.org/virtual-machines
2. Click on your VM
3. Copy the **Public IP** address

### From SSH
```bash
curl ifconfig.me
```

## Update Frontend Configuration

Once deployed, update your Supabase Edge Function environment:

```bash
# Set backend URL (replace with your actual IP)
supabase secrets set FACE_PROCESSING_BACKEND_URL=http://YOUR-VM-IP:8000

# Or if using SSL
supabase secrets set FACE_PROCESSING_BACKEND_URL=https://your-domain.com
```

## Monitoring and Maintenance

### View Real-time Logs
```bash
docker logs -f face-swap-backend
```

### Check Resource Usage
```bash
# Container stats
docker stats face-swap-backend

# GPU usage
watch -n 1 nvidia-smi
```

### Update Backend
```bash
# Pull latest image
docker pull your-username/face-swap-backend:latest

# Restart with new image
docker stop face-swap-backend
docker rm face-swap-backend

# Run the docker run command again from your startup script
```

### Backup Models
```bash
# Models are stored in /data/models
tar -czf models-backup.tar.gz /data/models
```

## Cost Optimization

1. **Use Spot Instances**: Save 50-70% on GPU costs
2. **Auto-shutdown**: Stop VM when not in use
3. **Right-size GPU**: Start with RTX 3090, upgrade only if needed
4. **Monitor Usage**: Use Cudo's billing dashboard

## Security Best Practices

1. **Restrict Port Access**: Limit port 8000 to your app's IP only
2. **Use API Keys**: Add authentication to your backend
3. **Regular Updates**: Keep Docker images updated
4. **Enable SSL**: Use HTTPS for production
5. **Firewall Rules**: Configure Cudo's firewall properly

## Next Steps

1. Deploy VM with startup script
2. Wait 3-5 minutes for initial setup
3. Verify health endpoint
4. Update frontend configuration
5. Test face swap functionality
6. Monitor logs and performance

## Complete Documentation

- **Persistence Details**: [CUDO_PERSISTENT_STARTUP.md](CUDO_PERSISTENT_STARTUP.md)
- **Full Deployment Guide**: [CUDO_COMPUTE_DEPLOYMENT.md](CUDO_COMPUTE_DEPLOYMENT.md)
- **Quick Reference**: [CUDO_QUICK_START.md](../CUDO_QUICK_START.md)

## Support

For issues:
1. Check startup logs: `sudo cat /var/log/cloud-init-output.log`
2. Check Docker logs: `docker logs face-swap-backend`
3. Verify GPU: `nvidia-smi`
4. Test manually: `docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi`
