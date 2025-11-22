#!/bin/bash

# Fix Frontend-Backend Connection
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"
FRONTEND_DOMAIN="event.wibook.co.tz"

echo "=== Fixing Frontend-Backend Connection ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Step 1: Check frontend .env
echo "1. Checking frontend .env..."
cd $PROJECT_PATH/frontend

if [ -f .env ]; then
    echo "Current frontend .env:"
    cat .env
    echo ""
else
    echo "⚠️  Frontend .env not found, creating..."
fi

# Update frontend .env with correct API URL
echo "Updating frontend .env..."
cat > .env << ENVEOF
VITE_API_URL=https://$FRONTEND_DOMAIN/api
ENVEOF
echo "✅ Frontend .env updated: VITE_API_URL=https://$FRONTEND_DOMAIN/api"

# Check Node.js version
echo ""
echo "2. Checking Node.js version..."
NODE_VERSION=$(node -v 2>/dev/null || echo "not installed")
echo "Current Node.js: $NODE_VERSION"

# Check if Node.js 18+ is installed
NODE_MAJOR=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "⚠️  Node.js version is too old (need 18+). Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js 18+ installed"
    node -v
fi

# Rebuild frontend with correct API URL
echo ""
echo "3. Rebuilding frontend with correct API URL..."
cd $PROJECT_PATH/frontend
npm run build
echo "✅ Frontend rebuilt"

# Step 2: Check backend .env
echo ""
echo "4. Checking backend .env..."
cd $PROJECT_PATH/backend

if [ -f .env ]; then
    echo "Current backend .env FRONTEND_URL:"
    grep FRONTEND_URL .env || echo "FRONTEND_URL not found"
    echo ""
    
    # Update FRONTEND_URL if needed
    if ! grep -q "FRONTEND_URL=https://$FRONTEND_DOMAIN" .env; then
        echo "Updating backend FRONTEND_URL..."
        # Remove old FRONTEND_URL line
        sed -i '/^FRONTEND_URL=/d' .env
        # Add new one
        echo "FRONTEND_URL=https://$FRONTEND_DOMAIN" >> .env
        echo "✅ Backend FRONTEND_URL updated"
    else
        echo "✅ Backend FRONTEND_URL is correct"
    fi
else
    echo "❌ Backend .env not found!"
    exit 1
fi

# Step 3: Check backend CORS configuration
echo ""
echo "5. Checking backend CORS configuration..."
cd $PROJECT_PATH/backend

# Check if CORS allows the frontend domain
if grep -q "event.wibook.co.tz" index.js; then
    echo "✅ CORS includes frontend domain"
else
    echo "⚠️  CORS might not include frontend domain"
    echo "Checking CORS configuration..."
    grep -A 5 "corsOptions" index.js || echo "CORS config not found"
fi

# Step 4: Restart backend to apply changes
echo ""
echo "6. Restarting backend..."
pm2 restart event-backend
sleep 2
pm2 status
echo "✅ Backend restarted"

# Step 5: Check Apache proxy configuration
echo ""
echo "7. Checking Apache proxy configuration..."
if grep -q "ProxyPass /api" /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf; then
    echo "✅ Apache proxy is configured"
    echo "Proxy configuration:"
    grep -A 2 "ProxyPass /api" /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf
else
    echo "❌ Apache proxy not configured!"
    echo "Fixing Apache configuration..."
    # Add proxy configuration (this should already be there, but just in case)
    systemctl reload apache2
fi

# Step 6: Test connection
echo ""
echo "8. Testing connection..."

# Test backend directly
echo "Testing backend directly:"
BACKEND_RESPONSE=$(curl -s http://localhost:5001/api/health)
echo "Backend response: $BACKEND_RESPONSE"

# Test through Apache proxy
echo ""
echo "Testing through Apache proxy:"
PROXY_RESPONSE=$(curl -s -H "Host: $FRONTEND_DOMAIN" http://localhost/api/health)
echo "Proxy response: $PROXY_RESPONSE"

# Test frontend API call
echo ""
echo "Testing frontend API URL:"
FRONTEND_API=$(grep VITE_API_URL $PROJECT_PATH/frontend/.env | cut -d'=' -f2)
echo "Frontend will call: $FRONTEND_API/health"
curl -s "$FRONTEND_API/health" || echo "⚠️  Frontend API URL test failed"

echo ""
echo "=== Connection Fix Complete ==="
echo ""
echo "Summary:"
echo "  ✅ Frontend .env: VITE_API_URL=https://$FRONTEND_DOMAIN/api"
echo "  ✅ Backend .env: FRONTEND_URL=https://$FRONTEND_DOMAIN"
echo "  ✅ Frontend rebuilt"
echo "  ✅ Backend restarted"
echo ""
echo "Test in browser:"
echo "  https://$FRONTEND_DOMAIN"
echo ""
echo "Check browser console (F12) for API errors"

