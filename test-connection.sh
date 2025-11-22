#!/bin/bash

# Test Frontend-Backend Connection
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"
FRONTEND_DOMAIN="event.wibook.co.tz"
BACKEND_PORT="5001"

echo "=== Testing Frontend-Backend Connection ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Some tests require root. Continuing with available tests..."
    echo ""
fi

# Test 1: Check backend is running
echo "1. Testing backend directly (localhost:$BACKEND_PORT)..."
if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null; then
    BACKEND_RESPONSE=$(curl -s http://localhost:$BACKEND_PORT/api/health)
    echo "✅ Backend is running"
    echo "   Response: $BACKEND_RESPONSE"
else
    echo "❌ Backend is NOT running on port $BACKEND_PORT"
    echo "   Check: pm2 status"
    echo "   Start: pm2 start ecosystem.config.js"
fi
echo ""

# Test 2: Check PM2 status
echo "2. Checking PM2 status..."
if command -v pm2 &> /dev/null; then
    pm2 status | grep event-backend || echo "⚠️  event-backend not found in PM2"
else
    echo "⚠️  PM2 not installed"
fi
echo ""

# Test 3: Check frontend .env
echo "3. Checking frontend .env..."
if [ -f "$PROJECT_PATH/frontend/.env" ]; then
    echo "Frontend .env contents:"
    cat $PROJECT_PATH/frontend/.env
    FRONTEND_API=$(grep VITE_API_URL $PROJECT_PATH/frontend/.env | cut -d'=' -f2)
    echo ""
    echo "Frontend will call: $FRONTEND_API"
else
    echo "❌ Frontend .env not found!"
fi
echo ""

# Test 4: Check Apache proxy configuration
echo "4. Checking Apache proxy configuration..."
if [ -f "/etc/apache2/sites-available/$FRONTEND_DOMAIN.conf" ]; then
    echo "Apache config file exists"
    if grep -q "ProxyPass /api" /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf; then
        echo "✅ ProxyPass /api found:"
        grep "ProxyPass /api" /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf
    else
        echo "❌ ProxyPass /api NOT found in Apache config!"
    fi
else
    echo "❌ Apache config file not found!"
fi
echo ""

# Test 5: Test API through Apache proxy
echo "5. Testing API through Apache proxy..."
PROXY_TEST=$(curl -s -H "Host: $FRONTEND_DOMAIN" http://localhost/api/health 2>&1)
if echo "$PROXY_TEST" | grep -q "status\|ok"; then
    echo "✅ Proxy is working"
    echo "   Response: $PROXY_TEST"
else
    echo "❌ Proxy is NOT working"
    echo "   Response: $PROXY_TEST"
    echo "   Check Apache config and restart: sudo systemctl reload apache2"
fi
echo ""

# Test 6: Test from external domain (if accessible)
echo "6. Testing from external domain..."
EXTERNAL_TEST=$(curl -s https://$FRONTEND_DOMAIN/api/health 2>&1)
if echo "$EXTERNAL_TEST" | grep -q "status\|ok"; then
    echo "✅ External API access working"
    echo "   Response: $EXTERNAL_TEST"
else
    echo "⚠️  External API access issue"
    echo "   Response: $EXTERNAL_TEST"
    echo "   This might be SSL or DNS related"
fi
echo ""

# Test 7: Check frontend build
echo "7. Checking frontend build..."
if [ -d "$PROJECT_PATH/frontend/dist" ]; then
    DIST_SIZE=$(du -sh $PROJECT_PATH/frontend/dist | cut -f1)
    echo "✅ Frontend dist exists ($DIST_SIZE)"
    if [ -f "$PROJECT_PATH/frontend/dist/index.html" ]; then
        echo "✅ index.html exists"
        # Check if API URL is in the built files
        if grep -r "VITE_API_URL\|localhost:5001" $PROJECT_PATH/frontend/dist 2>/dev/null | head -1; then
            echo "⚠️  Found localhost in dist - frontend might need rebuild"
        fi
    else
        echo "❌ index.html not found in dist!"
    fi
else
    echo "❌ Frontend dist directory not found!"
    echo "   Run: cd $PROJECT_PATH/frontend && npm run build"
fi
echo ""

# Test 8: Check Apache DocumentRoot
echo "8. Checking Apache DocumentRoot..."
APACHE_DOCROOT=$(grep -i "DocumentRoot" /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf | head -1 | awk '{print $2}' | tr -d '"')
if [ -n "$APACHE_DOCROOT" ]; then
    echo "DocumentRoot: $APACHE_DOCROOT"
    if [ -d "$APACHE_DOCROOT" ]; then
        echo "✅ DocumentRoot exists"
    else
        echo "❌ DocumentRoot does NOT exist!"
    fi
else
    echo "⚠️  Could not find DocumentRoot"
fi
echo ""

# Summary
echo "=== Summary ==="
echo ""
echo "To fix connection issues:"
echo "1. Ensure backend is running: pm2 status"
echo "2. Check frontend .env has: VITE_API_URL=https://$FRONTEND_DOMAIN/api"
echo "3. Rebuild frontend: cd $PROJECT_PATH/frontend && npm run build"
echo "4. Verify Apache proxy: grep ProxyPass /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf"
echo "5. Restart Apache: sudo systemctl reload apache2"
echo "6. Check browser console (F12) for CORS or network errors"
echo ""

