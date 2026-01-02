#!/bin/bash

set -e

echo "=========================================="
echo "Docker Installation Script"
echo "=========================================="
echo ""

if command -v docker &> /dev/null; then
    echo "✓ Docker is already installed"
    docker --version
    echo ""
    read -p "Do you want to reinstall? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Detected Linux - Installing Docker..."
    echo ""

    sudo apt-get update
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    sudo usermod -aG docker $USER

    echo ""
    echo "✓ Docker installed successfully!"
    echo ""
    echo "IMPORTANT: You need to log out and log back in for group changes to take effect."
    echo "Or run: newgrp docker"
    echo ""

elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected macOS"
    echo ""
    echo "Please install Docker Desktop from:"
    echo "https://docs.docker.com/desktop/install/mac-install/"
    echo ""
    echo "Or if you have Homebrew installed, run:"
    echo "  brew install --cask docker"
    exit 1

elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    echo "Detected Windows"
    echo ""
    echo "Please install Docker Desktop from:"
    echo "https://docs.docker.com/desktop/install/windows-install/"
    exit 1
else
    echo "Unsupported operating system: $OSTYPE"
    exit 1
fi

echo "Testing Docker installation..."
docker --version
docker compose version

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
