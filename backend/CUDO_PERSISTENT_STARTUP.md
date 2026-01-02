# Persistent Startup Configuration for Cudo Compute

Guide for ensuring the face swap backend automatically starts and stays running on Cudo Compute Ubuntu VMs.

## Overview

This guide covers multiple approaches to ensure your Docker container starts automatically on boot and restarts if it crashes.

## Method 1: Docker Restart Policy (Recommended)

The simplest approach uses Docker's built-in restart policies.

### Setup

When deploying, use the `--restart` flag:

```bash
docker run -d \
  --name face-swap-backend \
  --gpus all \
  --restart unless-stopped \
  -p 8000:8000 \
  -v /data/models:/app/models \
  your-username/face-swap-backend:latest
```

### Restart Policies

- `no`: Never restart (default)
- `on-failure`: Restart only if container exits with error
- `always`: Always restart if stopped
- `unless-stopped`: Always restart unless explicitly stopped

**Recommended**: `unless-stopped` - survives reboots and only stops when you explicitly stop it.

### Verify

```bash
# Check restart policy
docker inspect face-swap-backend | grep -A 5 RestartPolicy

# Test by rebooting
sudo reboot

# After reboot, check container is running
docker ps
```

## Method 2: Systemd Service (Advanced)

For more control, create a systemd service that manages the Docker container.

### Step 1: Create Service File

SSH into your Cudo VM and create the service file:

```bash
sudo nano /etc/systemd/system/face-swap-backend.service
```

Add the following content:

```ini
[Unit]
Description=Face Swap Backend Docker Container
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/face-swap
ExecStartPre=-/usr/bin/docker stop face-swap-backend
ExecStartPre=-/usr/bin/docker rm face-swap-backend
ExecStart=/usr/bin/docker run \
  --name face-swap-backend \
  --gpus all \
  -p 8000:8000 \
  -v /data/models:/app/models \
  your-username/face-swap-backend:latest
ExecStop=/usr/bin/docker stop face-swap-backend
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Step 2: Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable face-swap-backend.service

# Start service now
sudo systemctl start face-swap-backend.service

# Check status
sudo systemctl status face-swap-backend.service
```

### Step 3: Manage Service

```bash
# Stop service
sudo systemctl stop face-swap-backend.service

# Restart service
sudo systemctl restart face-swap-backend.service

# View logs
sudo journalctl -u face-swap-backend.service -f

# Disable auto-start
sudo systemctl disable face-swap-backend.service
```

## Method 3: Docker Compose with Systemd

Combine Docker Compose with systemd for complex deployments.

### Step 1: Create docker-compose.yml

```bash
# Create project directory
sudo mkdir -p /opt/face-swap
cd /opt/face-swap

# Create docker-compose.yml
sudo nano docker-compose.yml
```

Add:

```yaml
version: '3.8'

services:
  face-swap-backend:
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
```

### Step 2: Create Systemd Service

```bash
sudo nano /etc/systemd/system/face-swap-compose.service
```

Add:

```ini
[Unit]
Description=Face Swap Backend Docker Compose
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/face-swap
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Step 3: Enable Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable face-swap-compose.service
sudo systemctl start face-swap-compose.service
```

## Method 4: Crontab @reboot

Simple approach using crontab for startup scripts.

### Setup

```bash
# Edit crontab
crontab -e

# Add this line
@reboot sleep 30 && docker start face-swap-backend || docker run -d --name face-swap-backend --gpus all -p 8000:8000 -v /data/models:/app/models your-username/face-swap-backend:latest
```

### Verify

```bash
# List crontab entries
crontab -l

# Test by rebooting
sudo reboot
```

## Health Monitoring Script

Create a monitoring script to automatically restart if the service becomes unhealthy.

### Create Monitor Script

```bash
sudo nano /opt/face-swap/health-monitor.sh
```

Add:

```bash
#!/bin/bash

CONTAINER_NAME="face-swap-backend"
HEALTH_ENDPOINT="http://localhost:8000/health"
MAX_FAILURES=3
FAILURE_COUNT=0

while true; do
    # Check if container is running
    if ! docker ps | grep -q $CONTAINER_NAME; then
        echo "$(date): Container not running, attempting to start..."
        docker start $CONTAINER_NAME
        sleep 60
        continue
    fi

    # Check health endpoint
    if ! curl -f -s $HEALTH_ENDPOINT > /dev/null 2>&1; then
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        echo "$(date): Health check failed ($FAILURE_COUNT/$MAX_FAILURES)"

        if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
            echo "$(date): Max failures reached, restarting container..."
            docker restart $CONTAINER_NAME
            FAILURE_COUNT=0
            sleep 60
        fi
    else
        FAILURE_COUNT=0
    fi

    sleep 30
done
```

### Make Executable and Run

```bash
# Make executable
sudo chmod +x /opt/face-swap/health-monitor.sh

# Create systemd service for monitor
sudo nano /etc/systemd/system/face-swap-monitor.service
```

Add:

```ini
[Unit]
Description=Face Swap Backend Health Monitor
After=face-swap-backend.service

[Service]
Type=simple
ExecStart=/opt/face-swap/health-monitor.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable face-swap-monitor.service
sudo systemctl start face-swap-monitor.service
```

## Automated Deployment Script with Persistence

Update the deployment to include persistence configuration:

```bash
#!/bin/bash
# deploy-with-persistence.sh

# Pull latest image
docker pull your-username/face-swap-backend:latest

# Stop and remove old container
docker stop face-swap-backend 2>/dev/null || true
docker rm face-swap-backend 2>/dev/null || true

# Run with restart policy
docker run -d \
  --name face-swap-backend \
  --gpus all \
  --restart unless-stopped \
  -p 8000:8000 \
  -v /data/models:/app/models \
  your-username/face-swap-backend:latest

# Wait for startup
sleep 30

# Health check
if curl -f http://localhost:8000/health; then
    echo "Deployment successful!"
else
    echo "Health check failed!"
    exit 1
fi
```

## Logs and Monitoring

### View Docker Logs

```bash
# View real-time logs
docker logs -f face-swap-backend

# View last 100 lines
docker logs --tail 100 face-swap-backend

# View logs with timestamps
docker logs -t face-swap-backend
```

### View Systemd Logs

```bash
# View service logs
sudo journalctl -u face-swap-backend.service -f

# View logs since boot
sudo journalctl -u face-swap-backend.service -b

# View last 50 lines
sudo journalctl -u face-swap-backend.service -n 50
```

### Container Stats

```bash
# Real-time stats
docker stats face-swap-backend

# GPU usage
nvidia-smi -l 1
```

## Troubleshooting

### Container Not Starting

```bash
# Check container status
docker ps -a | grep face-swap-backend

# View container logs
docker logs face-swap-backend

# Inspect container
docker inspect face-swap-backend

# Try starting manually
docker start face-swap-backend
```

### Service Not Starting

```bash
# Check service status
sudo systemctl status face-swap-backend.service

# View detailed logs
sudo journalctl -xe -u face-swap-backend.service

# Test service manually
sudo systemctl start face-swap-backend.service
```

### GPU Not Available

```bash
# Check nvidia-docker runtime
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi

# Check Docker daemon configuration
cat /etc/docker/daemon.json
```

Should contain:

```json
{
  "runtimes": {
    "nvidia": {
      "path": "nvidia-container-runtime",
      "runtimeArgs": []
    }
  },
  "default-runtime": "nvidia"
}
```

### Restart Docker Daemon

```bash
sudo systemctl restart docker
```

## Best Practices

1. **Use `--restart unless-stopped`**: Simplest and most reliable for most use cases

2. **Combine with Health Monitoring**: Automatically restart on application failures

3. **Set Resource Limits**: Prevent container from consuming all resources

```bash
docker run -d \
  --name face-swap-backend \
  --gpus all \
  --restart unless-stopped \
  --memory="8g" \
  --cpus="4" \
  -p 8000:8000 \
  -v /data/models:/app/models \
  your-username/face-swap-backend:latest
```

4. **Log Rotation**: Configure Docker log rotation

```bash
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  ...
```

5. **Use Volume for Models**: Persist models across container updates

6. **Regular Updates**: Schedule regular image pulls and container updates

## Summary

**Recommended Setup:**
1. Use Docker's `--restart unless-stopped` policy
2. Add systemd service for additional control
3. Implement health monitoring script
4. Configure log rotation
5. Set resource limits

This ensures your face swap backend:
- Starts automatically on boot
- Restarts after crashes
- Survives VM reboots
- Can be monitored and managed easily
