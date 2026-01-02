#!/bin/bash

set -e

VERSION="1.0.0"
CONTAINER_NAME="deep-live-cam-gpu"
IMAGE_NAME="deep-live-cam-gpu"
IMAGE_TAG="latest"
DOCKERFILE="Dockerfile.cuda"
COMPOSE_FILE="docker-compose-gpu.yml"
PORT=8000

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "================================================"
    echo "  Deep Live Cam - CUDA GPU Docker Manager"
    echo "  Version: $VERSION"
    echo "================================================"
    echo ""
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        return 1
    fi
    return 0
}

check_docker() {
    log_info "Checking Docker installation..."

    if ! check_command docker; then
        log_error "Docker is not installed"
        echo ""
        echo "Install Docker:"
        echo "  Ubuntu/Debian: curl -fsSL https://get.docker.com | sh"
        echo "  Or visit: https://docs.docker.com/engine/install/"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running or you don't have permission"
        echo ""
        echo "Try:"
        echo "  sudo systemctl start docker"
        echo "  sudo usermod -aG docker $USER"
        echo "  Then log out and back in"
        exit 1
    fi

    log_success "Docker is installed and running"
}

check_nvidia_driver() {
    log_info "Checking NVIDIA driver..."

    if ! check_command nvidia-smi; then
        log_error "NVIDIA driver not found (nvidia-smi not available)"
        echo ""
        echo "Install NVIDIA driver:"
        echo "  Ubuntu: sudo apt install nvidia-driver-535"
        echo "  Or download from: https://www.nvidia.com/drivers"
        exit 1
    fi

    if ! nvidia-smi &> /dev/null; then
        log_error "NVIDIA driver is installed but not working properly"
        exit 1
    fi

    DRIVER_VERSION=$(nvidia-smi --query-gpu=driver_version --format=csv,noheader | head -n1)
    log_success "NVIDIA driver detected: $DRIVER_VERSION"
}

check_nvidia_docker() {
    log_info "Checking NVIDIA Container Toolkit..."

    if ! docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi &> /dev/null; then
        log_error "NVIDIA Container Toolkit is not properly configured"
        echo ""
        echo "Install NVIDIA Container Toolkit:"
        echo ""
        echo "distribution=\$(. /etc/os-release;echo \$ID\$VERSION_ID)"
        echo "curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -"
        echo "curl -s -L https://nvidia.github.io/nvidia-docker/\$distribution/nvidia-docker.list | \\"
        echo "    sudo tee /etc/apt/sources.list.d/nvidia-docker.list"
        echo ""
        echo "sudo apt-get update"
        echo "sudo apt-get install -y nvidia-container-toolkit"
        echo "sudo systemctl restart docker"
        echo ""
        echo "Documentation: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html"
        exit 1
    fi

    log_success "NVIDIA Container Toolkit is configured"
}

check_gpu_info() {
    log_info "GPU Information:"
    echo ""
    nvidia-smi --query-gpu=index,name,driver_version,memory.total,compute_cap --format=csv,noheader | while IFS=, read -r idx name driver mem compute; do
        echo "  GPU $idx: $name"
        echo "    Driver: $driver"
        echo "    Memory: $mem"
        echo "    Compute Capability: $compute"
        echo ""
    done
}

check_disk_space() {
    log_info "Checking disk space..."

    AVAILABLE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    REQUIRED=20

    if [ "$AVAILABLE" -lt "$REQUIRED" ]; then
        log_warning "Low disk space: ${AVAILABLE}GB available (${REQUIRED}GB recommended)"
    else
        log_success "Disk space: ${AVAILABLE}GB available"
    fi
}

check_memory() {
    log_info "Checking system memory..."

    TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
    REQUIRED=8

    if [ "$TOTAL_MEM" -lt "$REQUIRED" ]; then
        log_warning "Low memory: ${TOTAL_MEM}GB total (${REQUIRED}GB recommended)"
    else
        log_success "System memory: ${TOTAL_MEM}GB"
    fi
}

check_port() {
    log_info "Checking if port $PORT is available..."

    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Port $PORT is already in use"
        echo "  Process using port: $(lsof -Pi :$PORT -sTCP:LISTEN | tail -n1)"
        return 1
    else
        log_success "Port $PORT is available"
        return 0
    fi
}

system_check() {
    print_header
    log_info "Running comprehensive system check..."
    echo ""

    check_docker
    check_nvidia_driver
    check_nvidia_docker
    check_gpu_info
    check_disk_space
    check_memory
    check_port || true

    echo ""
    log_success "System check completed successfully!"
    echo ""
}

build_image() {
    print_header
    log_info "Building CUDA GPU Docker image..."
    echo ""

    if [ ! -f "$DOCKERFILE" ]; then
        log_error "Dockerfile not found: $DOCKERFILE"
        exit 1
    fi

    log_info "Building image: $IMAGE_NAME:$IMAGE_TAG"
    log_info "This may take 10-15 minutes on first build..."
    echo ""

    BUILD_START=$(date +%s)

    docker build \
        -f "$DOCKERFILE" \
        -t "$IMAGE_NAME:$IMAGE_TAG" \
        --progress=plain \
        . 2>&1 | tee build.log

    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))

    echo ""
    log_success "Image built successfully in ${BUILD_TIME}s"

    IMAGE_SIZE=$(docker images "$IMAGE_NAME:$IMAGE_TAG" --format "{{.Size}}")
    log_info "Image size: $IMAGE_SIZE"
    echo ""
}

start_container() {
    print_header
    log_info "Starting GPU-accelerated container..."
    echo ""

    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_error "Container '$CONTAINER_NAME' already exists"
        echo ""
        echo "Options:"
        echo "  Stop:    $0 stop"
        echo "  Restart: $0 restart"
        echo "  Remove:  $0 remove"
        echo "  Rebuild: $0 rebuild"
        exit 1
    fi

    if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${IMAGE_NAME}:${IMAGE_TAG}$"; then
        log_error "Image not found: $IMAGE_NAME:$IMAGE_TAG"
        echo "Build the image first: $0 build"
        exit 1
    fi

    mkdir -p models

    GPU_ARG="--gpus all"
    if [ -n "$GPU_ID" ]; then
        GPU_ARG="--gpus device=$GPU_ID"
        log_info "Using GPU: $GPU_ID"
    else
        log_info "Using all available GPUs"
    fi

    docker run -d \
        --name "$CONTAINER_NAME" \
        $GPU_ARG \
        -p "$PORT:8000" \
        -v "$(pwd)/models:/app/models" \
        -e CUDA_VISIBLE_DEVICES="${GPU_ID:-0}" \
        -e NVIDIA_VISIBLE_DEVICES=all \
        -e PYTHONUNBUFFERED=1 \
        --restart unless-stopped \
        "$IMAGE_NAME:$IMAGE_TAG"

    log_success "Container started: $CONTAINER_NAME"
    echo ""

    log_info "Waiting for service initialization..."

    for i in {1..30}; do
        if docker exec "$CONTAINER_NAME" curl -s http://localhost:8000/health > /dev/null 2>&1; then
            log_success "Service is ready!"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""

    show_status
}

stop_container() {
    print_header
    log_info "Stopping container..."

    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_warning "Container is not running"
        exit 0
    fi

    docker stop "$CONTAINER_NAME"
    log_success "Container stopped"
}

restart_container() {
    print_header
    log_info "Restarting container..."

    if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_error "Container does not exist"
        echo "Start container: $0 start"
        exit 1
    fi

    docker restart "$CONTAINER_NAME"
    log_success "Container restarted"

    sleep 3
    show_status
}

remove_container() {
    print_header
    log_info "Removing container..."

    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker rm -f "$CONTAINER_NAME"
        log_success "Container removed"
    else
        log_warning "Container does not exist"
    fi
}

show_logs() {
    if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_error "Container does not exist"
        exit 1
    fi

    LINES="${1:-50}"

    if [ "$LINES" = "follow" ]; then
        docker logs -f "$CONTAINER_NAME"
    else
        docker logs --tail "$LINES" "$CONTAINER_NAME"
    fi
}

show_status() {
    echo ""
    echo "================================================"
    echo "  Service Status"
    echo "================================================"

    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "Status: ${GREEN}Running${NC}"
    elif docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "Status: ${YELLOW}Stopped${NC}"
    else
        echo -e "Status: ${RED}Not Created${NC}"
        return
    fi

    echo ""
    echo "Container: $CONTAINER_NAME"

    CONTAINER_ID=$(docker ps -a --filter "name=^${CONTAINER_NAME}$" --format "{{.ID}}")
    if [ -n "$CONTAINER_ID" ]; then
        echo "ID: $CONTAINER_ID"

        UPTIME=$(docker ps --filter "name=^${CONTAINER_NAME}$" --format "{{.Status}}" 2>/dev/null || echo "Stopped")
        echo "Uptime: $UPTIME"
    fi

    echo ""
    echo "URLs:"
    echo "  API:         http://localhost:$PORT"
    echo "  Health:      http://localhost:$PORT/health"
    echo "  Docs:        http://localhost:$PORT/docs"
    echo "  Interactive: http://localhost:$PORT/redoc"
    echo ""

    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        HEALTH=$(docker exec "$CONTAINER_NAME" curl -s http://localhost:8000/health 2>/dev/null || echo '{"status":"unknown"}')
        echo "Health Check:"
        echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
    fi

    echo ""
    echo "Commands:"
    echo "  View logs:  $0 logs [lines]"
    echo "  Follow:     $0 logs follow"
    echo "  Monitor:    $0 monitor"
    echo "  Restart:    $0 restart"
    echo "  Stop:       $0 stop"
    echo "================================================"
    echo ""
}

monitor_container() {
    print_header
    log_info "Monitoring container and GPU usage"
    echo "Press Ctrl+C to exit"
    echo ""

    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_error "Container is not running"
        exit 1
    fi

    watch -n 1 "
        echo '=== Container Stats ==='
        docker stats --no-stream $CONTAINER_NAME
        echo ''
        echo '=== GPU Usage ==='
        nvidia-smi --query-gpu=index,name,utilization.gpu,utilization.memory,memory.used,memory.total,temperature.gpu --format=csv,noheader
    "
}

run_shell() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_error "Container is not running"
        exit 1
    fi

    log_info "Opening shell in container..."
    docker exec -it "$CONTAINER_NAME" /bin/bash
}

test_api() {
    print_header
    log_info "Testing API endpoints..."
    echo ""

    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_error "Container is not running"
        exit 1
    fi

    BASE_URL="http://localhost:$PORT"

    echo "Testing root endpoint..."
    curl -s "$BASE_URL/" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/"
    echo ""

    echo "Testing health endpoint..."
    curl -s "$BASE_URL/health" | python3 -m json.tool 2>/dev/null || curl -s "$BASE_URL/health"
    echo ""

    log_success "API is responding"
    echo ""
    echo "Full API documentation: $BASE_URL/docs"
}

cleanup_docker() {
    print_header
    log_info "Cleaning up Docker resources..."
    echo ""

    log_info "Removing stopped containers..."
    docker container prune -f

    log_info "Removing unused images..."
    docker image prune -f

    log_info "Removing unused volumes..."
    docker volume prune -f

    log_info "Removing unused networks..."
    docker network prune -f

    log_success "Cleanup completed"
}

full_rebuild() {
    print_header
    log_info "Performing full rebuild..."
    echo ""

    system_check

    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_info "Removing existing container..."
        docker rm -f "$CONTAINER_NAME" || true
    fi

    build_image
    start_container
}

backup_models() {
    print_header
    BACKUP_FILE="models_backup_$(date +%Y%m%d_%H%M%S).tar.gz"

    log_info "Creating backup: $BACKUP_FILE"

    if [ ! -d "models" ] || [ -z "$(ls -A models)" ]; then
        log_warning "No models to backup"
        exit 0
    fi

    tar -czf "$BACKUP_FILE" models/

    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
}

restore_models() {
    print_header

    if [ -z "$1" ]; then
        log_error "Usage: $0 restore <backup_file>"
        exit 1
    fi

    BACKUP_FILE="$1"

    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    log_info "Restoring from: $BACKUP_FILE"

    tar -xzf "$BACKUP_FILE"

    log_success "Models restored"
}

show_help() {
    cat << EOF
Deep Live Cam - CUDA GPU Docker Manager v$VERSION

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  check       Check system requirements and configuration
  build       Build the GPU-enabled Docker image
  start       Start the container
  stop        Stop the container
  restart     Restart the container
  remove      Remove the container
  rebuild     Full rebuild (remove + build + start)

  status      Show container status and information
  logs        Show container logs (default: 50 lines)
              Usage: $0 logs [lines|follow]
  monitor     Monitor container and GPU usage in real-time
  shell       Open bash shell in container
  test        Test API endpoints

  backup      Backup model files
  restore     Restore model files
              Usage: $0 restore <backup_file>
  cleanup     Clean up Docker resources

  help        Show this help message

Environment Variables:
  GPU_ID      Specify GPU device ID (default: 0)
              Usage: GPU_ID=1 $0 start

Examples:
  $0 check                    # Check system requirements
  $0 rebuild                  # Full rebuild and start
  $0 logs follow              # Follow logs in real-time
  $0 monitor                  # Monitor GPU usage
  GPU_ID=1 $0 start          # Use GPU 1

Documentation:
  GPU Quick Start:  GPU_QUICK_START.md
  Complete Guide:   BUILD_GPU.md
  Docker Guide:     README_DOCKER.md

EOF
}

main() {
    case "${1:-help}" in
        check)
            system_check
            ;;
        build)
            system_check
            build_image
            ;;
        start|run)
            start_container
            ;;
        stop)
            stop_container
            ;;
        restart)
            restart_container
            ;;
        remove|rm)
            remove_container
            ;;
        rebuild)
            full_rebuild
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "${2:-50}"
            ;;
        monitor)
            monitor_container
            ;;
        shell|bash|sh)
            run_shell
            ;;
        test)
            test_api
            ;;
        backup)
            backup_models
            ;;
        restore)
            restore_models "$2"
            ;;
        cleanup)
            cleanup_docker
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
