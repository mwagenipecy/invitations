#!/bin/bash

# Install Node.js 18+ for Vite
# Run this on the server

set -e

echo "=== Installing Node.js 18+ ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Check current Node.js version
CURRENT_VERSION=$(node -v 2>/dev/null || echo "not installed")
echo "Current Node.js: $CURRENT_VERSION"

# Get major version
if command -v node &> /dev/null; then
    MAJOR_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    echo "Major version: $MAJOR_VERSION"
    
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        echo "✅ Node.js 18+ already installed"
        exit 0
    fi
fi

echo "Removing old Node.js packages to avoid conflicts..."
apt-get remove -y nodejs nodejs-dev libnode-dev libnode72 2>/dev/null || true
apt-get purge -y nodejs nodejs-dev libnode-dev libnode72 2>/dev/null || true

echo "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get update
apt-get install -y nodejs

echo ""
echo "Verifying installation..."
node -v
npm -v

echo ""
echo "✅ Node.js 18+ installed successfully"
echo ""
echo "Now rebuild frontend:"
echo "  cd /var/www/html/Event/invitations/frontend"
echo "  npm run build"

