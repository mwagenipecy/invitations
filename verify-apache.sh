#!/bin/bash

# Verify and fix Apache configuration for event.wibook.co.tz
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"
FRONTEND_DOMAIN="event.wibook.co.tz"

echo "=== Verifying Apache Configuration ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Check if virtual host file exists
echo "1. Checking virtual host file..."
if [ -f /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf ]; then
    echo "✅ Virtual host file exists"
    echo ""
    echo "Current configuration:"
    cat /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf
    echo ""
else
    echo "❌ Virtual host file not found!"
    exit 1
fi

# Check if site is enabled
echo "2. Checking if site is enabled..."
if [ -L /etc/apache2/sites-enabled/$FRONTEND_DOMAIN.conf ]; then
    echo "✅ Site is enabled"
else
    echo "⚠️  Site is not enabled, enabling now..."
    a2ensite $FRONTEND_DOMAIN.conf
fi

# Check DocumentRoot
echo ""
echo "3. Checking DocumentRoot..."
DOCUMENT_ROOT=$(grep -i "DocumentRoot" /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf | awk '{print $2}' | head -1)
echo "DocumentRoot: $DOCUMENT_ROOT"

if [ -d "$DOCUMENT_ROOT" ]; then
    echo "✅ DocumentRoot directory exists"
    echo "Files in DocumentRoot:"
    ls -la "$DOCUMENT_ROOT" | head -10
else
    echo "❌ DocumentRoot directory does not exist!"
    echo "Expected: $PROJECT_PATH/frontend/dist"
    echo "Creating directory structure..."
    mkdir -p $PROJECT_PATH/frontend/dist
    echo "⚠️  Directory created but may be empty. Rebuild frontend:"
    echo "   cd $PROJECT_PATH/frontend && npm run build"
fi

# Check if index.html exists
echo ""
echo "4. Checking for index.html..."
if [ -f "$DOCUMENT_ROOT/index.html" ]; then
    echo "✅ index.html exists"
    echo "First few lines:"
    head -5 "$DOCUMENT_ROOT/index.html"
else
    echo "❌ index.html not found!"
    echo "Frontend needs to be built:"
    echo "   cd $PROJECT_PATH/frontend && npm run build"
fi

# Test Apache configuration
echo ""
echo "5. Testing Apache configuration..."
if apache2ctl configtest; then
    echo "✅ Apache configuration is valid"
else
    echo "❌ Apache configuration has errors"
    exit 1
fi

# Check which virtual host handles the domain
echo ""
echo "6. Checking virtual host priority..."
apache2ctl -S | grep -A 2 "$FRONTEND_DOMAIN"

# Test with curl
echo ""
echo "7. Testing with curl..."
echo "Testing: curl -H 'Host: $FRONTEND_DOMAIN' http://localhost"
curl -H "Host: $FRONTEND_DOMAIN" http://localhost 2>&1 | head -20

echo ""
echo "=== Verification Complete ==="
echo ""
echo "If frontend is not loading, check:"
echo "1. DocumentRoot is correct: $PROJECT_PATH/frontend/dist"
echo "2. Frontend is built: cd $PROJECT_PATH/frontend && npm run build"
echo "3. Apache is reloaded: systemctl reload apache2"
echo "4. No conflicting virtual hosts with higher priority"

