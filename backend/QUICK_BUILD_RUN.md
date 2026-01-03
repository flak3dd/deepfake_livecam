# Quick Build and Run Guide for Windows

This guide shows you how to quickly build and run Deep Live Cam with GPU support on Windows.

## One-Command Setup

Simply run:

```cmd
build-and-run.bat
```

This script will automatically:
1. ✅ Check your system (NVIDIA driver, Docker, GPU support)
2. 🔨 Build the Docker image (takes 10-15 minutes first time)
3. 🚀 Start the container with GPU support

## What This Script Does

The `build-and-run.bat` script is a wrapper around `gpu-docker.bat` that automates the complete setup process:

```
build-and-run.bat
├── Step 1: gpu-docker.bat check    (verify system requirements)
├── Step 2: gpu-docker.bat build    (build Docker image)
└── Step 3: gpu-docker.bat start    (start container)
```

## Prerequisites

Before running the script, ensure you have:

- ✅ Windows 10/11 with WSL 2 enabled
- ✅ NVIDIA GPU with updated drivers
- ✅ Docker Desktop installed and running
- ✅ NVIDIA Container Toolkit configured in WSL 2

## After Running

Once the script completes, your API will be available at:

```
http://localhost:8000
```

## Useful Commands

After the initial setup, you can use these commands:

```cmd
gpu-docker.bat status   # Check if container is running
gpu-docker.bat logs     # View container logs
gpu-docker.bat monitor  # Monitor GPU usage
gpu-docker.bat stop     # Stop the container
gpu-docker.bat restart  # Restart the container
gpu-docker.bat shell    # Open bash shell in container
```

## Troubleshooting

### System Check Fails

If the system check fails, the script will stop and show you what's wrong. Common issues:

- **NVIDIA driver not detected**: Install latest NVIDIA drivers
- **Docker not running**: Start Docker Desktop
- **GPU support not enabled**: Configure NVIDIA Container Toolkit in WSL 2

### Build Fails

If the build fails:

1. Check your internet connection (downloads models and dependencies)
2. Ensure you have at least 15GB free disk space
3. Review the error messages for specific issues

### Container Won't Start

If the container fails to start:

1. Check if port 8000 is already in use
2. Verify GPU is accessible: `nvidia-smi`
3. Check Docker logs: `gpu-docker.bat logs`

## Re-running the Script

You can safely re-run `build-and-run.bat` at any time:

- If the image already exists, it will skip the build
- If the container is already running, it will restart it
- The system check always runs to ensure everything is configured correctly

## Manual Control

If you prefer manual control, use `gpu-docker.bat` directly:

```cmd
# Build only
gpu-docker.bat build

# Start only
gpu-docker.bat start

# Full rebuild (clears cache)
gpu-docker.bat rebuild
```

## Next Steps

After successful setup:

1. Test the API: `gpu-docker.bat test`
2. Monitor GPU usage: `gpu-docker.bat monitor`
3. View logs: `gpu-docker.bat logs`
4. Access the shell: `gpu-docker.bat shell`

For more detailed information, see:
- `GPU_QUICK_START.md` - Complete GPU setup guide
- `DOCKER_GPU_COMPLETE.md` - Docker GPU configuration
- `README_DOCKER.md` - General Docker usage
