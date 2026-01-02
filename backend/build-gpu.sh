#!/bin/bash

set -e

echo "================================================"
echo "Deep Live Cam - CUDA GPU Docker Build Script"
echo "================================================"
echo ""

check_nvidia_docker() {
    if ! command -v docker &> /dev/null; then
        echo "Error: Docker is not installed"
        exit 1
    fi

    if ! docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi &> /dev/null; then
        echo "Error: NVIDIA Container Toolkit is not properly configured"
        echo "Please install NVIDIA Container Toolkit first:"
        echo "  https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html"
        exit 1
    fi

    echo "✓ NVIDIA Docker support detected"
}

check_gpu() {
    if ! command -v nvidia-smi &> /dev/null; then
        echo "Warning: nvidia-smi not found. Cannot verify GPU"
        return 1
    fi

    echo "✓ GPU Information:"
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
    echo ""
}

build_image() {
    echo "Building CUDA-enabled Docker image..."
    echo ""

    docker build \
        -f Dockerfile.cuda \
        -t deep-live-cam-gpu:latest \
        --progress=plain \
        .

    echo ""
    echo "✓ Image built successfully: deep-live-cam-gpu:latest"
}

run_container() {
    echo ""
    echo "Starting GPU-accelerated container..."

    docker run -d \
        --name deep-live-cam-gpu \
        --gpus all \
        -p 8000:8000 \
        -v "$(pwd)/models:/app/models" \
        -e CUDA_VISIBLE_DEVICES=0 \
        --restart unless-stopped \
        deep-live-cam-gpu:latest

    echo "✓ Container started: deep-live-cam-gpu"
    echo ""
    echo "Waiting for service to be ready..."
    sleep 5

    docker logs deep-live-cam-gpu --tail 20

    echo ""
    echo "================================================"
    echo "Service Status:"
    echo "================================================"
    echo "API URL: http://localhost:8000"
    echo "Health Check: http://localhost:8000/health"
    echo "API Docs: http://localhost:8000/docs"
    echo ""
    echo "View logs: docker logs -f deep-live-cam-gpu"
    echo "Stop service: docker stop deep-live-cam-gpu"
    echo "Remove container: docker rm deep-live-cam-gpu"
    echo "================================================"
}

main() {
    case "${1:-build}" in
        check)
            echo "Checking system requirements..."
            check_nvidia_docker
            check_gpu
            ;;
        build)
            check_nvidia_docker
            check_gpu
            build_image
            ;;
        run)
            if docker ps -a --format '{{.Names}}' | grep -q "^deep-live-cam-gpu$"; then
                echo "Container 'deep-live-cam-gpu' already exists"
                echo "Stop and remove it first with: docker rm -f deep-live-cam-gpu"
                exit 1
            fi
            run_container
            ;;
        rebuild)
            check_nvidia_docker
            if docker ps -a --format '{{.Names}}' | grep -q "^deep-live-cam-gpu$"; then
                echo "Stopping and removing existing container..."
                docker rm -f deep-live-cam-gpu || true
            fi
            build_image
            run_container
            ;;
        *)
            echo "Usage: $0 {check|build|run|rebuild}"
            echo ""
            echo "Commands:"
            echo "  check   - Verify NVIDIA Docker support and GPU availability"
            echo "  build   - Build the GPU-enabled Docker image"
            echo "  run     - Run the container (must build first)"
            echo "  rebuild - Rebuild image and restart container"
            exit 1
            ;;
    esac
}

main "$@"
