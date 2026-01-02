#!/usr/bin/env python3
import os
import sys
import json
import subprocess
import requests
from typing import Optional

CUDO_API_BASE = "https://rest.compute.cudo.org/v1"

def print_header(message: str):
    print("\n" + "=" * 60)
    print(f"  {message}")
    print("=" * 60 + "\n")

def print_success(message: str):
    print(f"✓ {message}")

def print_error(message: str):
    print(f"✗ {message}", file=sys.stderr)

def print_info(message: str):
    print(f"ℹ {message}")

def check_api_key() -> str:
    api_key = os.environ.get("CUDO_API_KEY")
    if not api_key:
        print_error("CUDO_API_KEY environment variable is not set")
        print_info("Get your API key from: https://compute.cudo.org/")
        print_info("Then set it with: export CUDO_API_KEY='your-api-key'")
        sys.exit(1)
    return api_key

def load_config() -> dict:
    config_path = "cudo-config.json"
    try:
        with open(config_path, 'r') as f:
            config = json.load(f)
            print_success(f"Loaded configuration from {config_path}")
            return config
    except FileNotFoundError:
        print_info(f"{config_path} not found, using defaults")
        return {
            "machineType": "gpu-rtx3090",
            "region": "us-east",
            "diskSize": 50,
            "dockerImage": "yourusername/face-swap-backend:latest"
        }

def build_docker_image(image_name: str) -> bool:
    print_header("Building Docker Image")

    try:
        subprocess.run(
            ["docker", "build", "-t", "face-swap-backend:latest", "."],
            check=True
        )
        print_success("Docker image built successfully")

        subprocess.run(
            ["docker", "tag", "face-swap-backend:latest", image_name],
            check=True
        )
        print_success(f"Tagged as {image_name}")

        response = input("\nPush to Docker registry? (y/n): ").strip().lower()
        if response == 'y':
            subprocess.run(["docker", "push", image_name], check=True)
            print_success("Docker image pushed successfully")
            return True
        else:
            print_info("Skipping push. Make sure the image is available on the registry.")
            return False

    except subprocess.CalledProcessError as e:
        print_error(f"Docker build/push failed: {e}")
        return False
    except FileNotFoundError:
        print_error("Docker not found. Please install Docker first.")
        return False

def create_startup_script(image_name: str) -> str:
    return f"""#!/bin/bash
set -e

echo "Installing Docker and NVIDIA Docker support..."
apt-get update
apt-get install -y docker.io nvidia-docker2
systemctl restart docker

echo "Pulling Docker image: {image_name}"
docker pull {image_name}

echo "Starting face swap backend..."
docker run -d \\
  --name face-swap-backend \\
  --gpus all \\
  --restart unless-stopped \\
  -p 8000:8000 \\
  -v /data/models:/app/models \\
  {image_name}

echo "Waiting for service to start..."
sleep 30

echo "Running health check..."
curl -f http://localhost:8000/health || echo "Warning: Health check failed"

echo "Deployment complete! Backend is running on port 8000"
"""

def deploy_to_cudo(api_key: str, config: dict) -> Optional[dict]:
    print_header("Deploying to Cudo Compute")

    startup_script = create_startup_script(config["dockerImage"])

    payload = {
        "projectId": config.get("projectId", "default"),
        "machineType": config["machineType"],
        "region": config["region"],
        "imageId": "ubuntu-22.04-docker",
        "diskSize": config["diskSize"],
        "startupScript": startup_script,
        "firewallRules": [
            {
                "port": 8000,
                "protocol": "tcp",
                "source": "0.0.0.0/0"
            }
        ]
    }

    print_info(f"Configuration:")
    print_info(f"  Machine Type: {config['machineType']}")
    print_info(f"  Region: {config['region']}")
    print_info(f"  Disk Size: {config['diskSize']}GB")
    print_info(f"  Docker Image: {config['dockerImage']}")

    try:
        response = requests.post(
            f"{CUDO_API_BASE}/vms",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=30
        )

        if response.status_code in [200, 201]:
            vm_data = response.json()
            print_success("VM deployed successfully!")
            return vm_data
        else:
            print_error(f"Deployment failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None

    except requests.exceptions.RequestException as e:
        print_error(f"API request failed: {e}")
        return None

def display_deployment_info(vm_data: dict):
    print_header("Deployment Information")

    vm_id = vm_data.get("id", "N/A")
    vm_ip = vm_data.get("publicIp", "pending")

    print_success(f"VM ID: {vm_id}")
    print_success(f"Public IP: {vm_ip}")

    print("\n" + "=" * 60)
    print("  Next Steps")
    print("=" * 60)
    print("\n1. Wait 5-10 minutes for VM initialization")
    print("   - Docker installation")
    print("   - Model downloads (~2GB)")
    print("   - Service startup")

    print(f"\n2. Test the endpoint:")
    print(f"   curl http://{vm_ip}:8000/health")

    print(f"\n3. Configure Supabase Edge Function:")
    print(f"   supabase secrets set FACE_PROCESSING_BACKEND_URL=http://{vm_ip}:8000")

    print(f"\n4. Or update frontend .env:")
    print(f"   VITE_BACKEND_URL=http://{vm_ip}:8000")

    print("\n" + "=" * 60)
    print("  Monitoring")
    print("=" * 60)
    print(f"\nSSH into VM: ssh ubuntu@{vm_ip}")
    print("Check logs: docker logs -f face-swap-backend")
    print("GPU status: nvidia-smi")
    print("\n")

def main():
    print_header("Cudo Compute Deployment Tool")

    api_key = check_api_key()
    config = load_config()

    if "--skip-build" not in sys.argv:
        response = input("\nBuild and push Docker image? (y/n): ").strip().lower()
        if response == 'y':
            if not build_docker_image(config["dockerImage"]):
                print_error("Docker build failed. Continuing with existing image...")

    print("\n" + "-" * 60)
    response = input("\nProceed with deployment? (y/n): ").strip().lower()
    if response != 'y':
        print_info("Deployment cancelled.")
        sys.exit(0)

    vm_data = deploy_to_cudo(api_key, config)

    if vm_data:
        display_deployment_info(vm_data)
        print_success("Deployment complete!")
    else:
        print_error("Deployment failed!")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nDeployment cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
