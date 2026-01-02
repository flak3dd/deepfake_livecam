# Cudo Compute Quick Start Guide

Quick reference for deploying the face swap backend to Cudo Compute cloud GPUs.

## What is Cudo Compute?

Cudo Compute is a cloud GPU platform that provides cost-effective GPU instances for AI workloads. Perfect for production deployments of the face swap backend.

**Website:** https://compute.cudo.org/

## Why Use Cudo Compute?

- **Cost Effective**: $0.50-$4.00/hour based on GPU type
- **Easy Deployment**: One-command Docker deployment
- **GPU Accelerated**: 2-5x faster than CPU processing
- **Scalable**: Start small, scale as needed
- **Flexible**: RTX 3090, RTX 4090, A100 options

## Quick Deployment

### Step 1: Get API Key

1. Create account at https://compute.cudo.org/
2. Navigate to API Keys section
3. Generate new API key
4. Copy the key

### Step 2: Configure Deployment

Edit `backend/cudo-config.json`:

```json
{
  "dockerImage": "YOUR-DOCKERHUB-USERNAME/face-swap-backend:latest",
  "machineType": "gpu-rtx3090",
  "region": "us-east"
}
```

### Step 3: Deploy

```bash
cd backend
export CUDO_API_KEY="your-api-key-here"
python deploy_cudo.py
```

The script will:
1. Build Docker image
2. Push to Docker Hub
3. Deploy to Cudo Compute
4. Configure GPU and networking
5. Provide instance IP

### Step 4: Configure Frontend

After deployment, update your Supabase Edge Function:

```bash
supabase secrets set FACE_PROCESSING_BACKEND_URL=http://YOUR-CUDO-IP:8000
```

## GPU Options

### Budget: RTX 3090
- **VRAM**: 24GB
- **Performance**: ~100 FPS for face swap
- **Cost**: ~$0.50-0.80/hour
- **Best for**: Development, moderate usage

### Performance: RTX 4090
- **VRAM**: 24GB
- **Performance**: ~150 FPS for face swap
- **Cost**: ~$1.00-1.50/hour
- **Best for**: Production with high demand

### Enterprise: A100
- **VRAM**: 40GB/80GB
- **Performance**: ~200+ FPS for face swap
- **Cost**: ~$2.00-4.00/hour
- **Best for**: Large-scale production

## Monitoring

### Check Health

```bash
curl http://YOUR-CUDO-IP:8000/health
```

### SSH Access

```bash
ssh ubuntu@YOUR-CUDO-IP
```

### View Logs

```bash
docker logs -f face-swap-backend
```

### GPU Status

```bash
nvidia-smi
```

## Cost Optimization

1. **Use Spot Instances**: 50-70% savings
2. **Auto-Shutdown**: Stop during low usage
3. **Right-Size GPU**: Start with RTX 3090
4. **Monitor Usage**: Track processing volume

## Troubleshooting

### Connection Failed

```bash
# Check if service is running
curl http://YOUR-CUDO-IP:8000/health

# Check Docker logs
ssh ubuntu@YOUR-CUDO-IP
docker logs face-swap-backend
```

### GPU Not Detected

```bash
# SSH into instance
ssh ubuntu@YOUR-CUDO-IP

# Check GPU
nvidia-smi

# Check Docker GPU access
docker exec face-swap-backend nvidia-smi
```

### Models Not Downloading

```bash
# SSH into instance
ssh ubuntu@YOUR-CUDO-IP

# Check disk space
df -h

# Manually download models
docker exec -it face-swap-backend python download_models.py
```

## Complete Documentation

- **Full Guide**: [backend/CUDO_COMPUTE_DEPLOYMENT.md](backend/CUDO_COMPUTE_DEPLOYMENT.md)
- **API Reference**: https://www.cudocompute.com/docs/rest-api/introduction
- **Cudo Docs**: https://www.cudocompute.com/docs

## Deployment Scripts

- **Python Script**: `backend/deploy_cudo.py` (cross-platform)
- **Bash Script**: `backend/deploy-cudo.sh` (Linux/Mac)
- **Config File**: `backend/cudo-config.json`

## Support

- Cudo Compute Documentation: https://www.cudocompute.com/docs
- Cudo Compute Support: https://support.cudocompute.com/
- Backend Issues: Check `backend/README.md`
