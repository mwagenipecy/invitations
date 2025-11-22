#!/bin/bash

# Verify Complete Deployment
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"
FRONTEND_DOMAIN="event.wibook.co.tz"

echo "=== Verifying Complete Deployment ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Some checks require root. Continuing with available checks..."
    echo ""
fi

# 1. Check backend is running
echo "1. Checking backend status..."
if command -v pm2 &> /dev/null; then
    PM2_CMD="pm2"
elif [ -f /usr/bin/pm2 ]; then
    PM2_CMD="/usr/bin/pm2"
elif [ -f /usr/local/bin/pm2 ]; then
    PM2_CMD="/usr/local/bin/pm2"
else
    PM2_CMD=""
fi

if [ -n "$PM2_CMD" ]; then
    if $PM2_CMD list | grep -q "event-backend.*online"; then
        echo "✅ Backend is running"
        $PM2_CMD status
    else
        echo "❌ Backend is not running"
        echo "   Start with: $PM2_CMD start ecosystem.config.js"
    fi
else
    echo "⚠️  PM2 not found. Check backend manually."
fi
echo ""

# 2. Check database connection
echo "2. Checking database connection..."
if [ -n "$PM2_CMD" ]; then
    if $PM2_CMD logs event-backend --lines 10 --nostream 2>/dev/null | grep -q "Database connected successfully"; then
        echo "✅ Database connection successful"
    else
        echo "⚠️  Database connection issue - check logs:"
        $PM2_CMD logs event-backend --lines 5 --nostream 2>/dev/null || echo "Could not read logs"
    fi
else
    echo "⚠️  Cannot check - PM2 not available"
fi
echo ""

# 3. Check backend health endpoint
echo "3. Testing backend health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:5001/api/health 2>&1)
if echo "$HEALTH_RESPONSE" | grep -q "status.*ok"; then
    echo "✅ Backend health check passed"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "❌ Backend health check failed"
    echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# 4. Check Apache proxy
echo "4. Testing Apache proxy..."
PROXY_RESPONSE=$(curl -s -H "Host: $FRONTEND_DOMAIN" http://localhost/api/health 2>&1)
if echo "$PROXY_RESPONSE" | grep -q "status.*ok"; then
    echo "✅ Apache proxy is working"
    echo "   Response: $PROXY_RESPONSE"
else
    echo "❌ Apache proxy issue"
    echo "   Response: $PROXY_RESPONSE"
    echo "   Check: sudo systemctl status apache2"
fi
echo ""

# 5. Check frontend build
echo "5. Checking frontend build..."
if [ -d "$PROJECT_PATH/frontend/dist" ] && [ -f "$PROJECT_PATH/frontend/dist/index.html" ]; then
    DIST_SIZE=$(du -sh $PROJECT_PATH/frontend/dist | cut -f1)
    echo "✅ Frontend dist exists ($DIST_SIZE)"
    
    # Check if API URL is correct in build
    if grep -r "localhost:5001" $PROJECT_PATH/frontend/dist 2>/dev/null | head -1; then
        echo "⚠️  Found localhost in dist - frontend needs rebuild"
    else
        echo "✅ No localhost URLs found in dist"
    fi
else
    echo "❌ Frontend dist not found or incomplete"
    echo "   Rebuild: cd $PROJECT_PATH/frontend && npm run build"
fi
echo ""

# 6. Check frontend .env
echo "6. Checking frontend .env..."
if [ -f "$PROJECT_PATH/frontend/.env" ]; then
    FRONTEND_API=$(grep VITE_API_URL $PROJECT_PATH/frontend/.env | cut -d'=' -f2)
    echo "Frontend API URL: $FRONTEND_API"
    if echo "$FRONTEND_API" | grep -q "event.wibook.co.tz"; then
        echo "✅ Frontend .env is correct"
    else
        echo "⚠️  Frontend .env should be: VITE_API_URL=https://event.wibook.co.tz/api"
    fi
else
    echo "❌ Frontend .env not found"
fi
echo ""

# 7. Check external API access
echo "7. Testing external API access..."
EXTERNAL_RESPONSE=$(curl -s https://$FRONTEND_DOMAIN/api/health 2>&1)
if echo "$EXTERNAL_RESPONSE" | grep -q "status.*ok"; then
    echo "✅ External API access working"
    echo "   Response: $EXTERNAL_RESPONSE"
else
    echo "⚠️  External API access issue"
    echo "   Response: $EXTERNAL_RESPONSE"
    echo "   This might be SSL or DNS related"
fi
echo ""

# 8. Check Apache virtual host
echo "8. Checking Apache virtual host..."
if [ -f "/etc/apache2/sites-enabled/$FRONTEND_DOMAIN.conf" ] || [ -f "/etc/apache2/sites-enabled/event.wibook.co.tz.conf" ]; then
    echo "✅ Apache virtual host is enabled"
    if grep -q "ProxyPass /api" /etc/apache2/sites-enabled/*$FRONTEND_DOMAIN*.conf 2>/dev/null; then
        echo "✅ ProxyPass configured"
    else
        echo "⚠️  ProxyPass not found in config"
    fi
else
    echo "❌ Apache virtual host not enabled"
    echo "   Enable: sudo a2ensite $FRONTEND_DOMAIN.conf"
fi
echo ""

# Summary
echo "=== Summary ==="
echo ""
echo "If all checks pass, your deployment should be working!"
echo ""
echo "Test in browser:"
echo "  https://$FRONTEND_DOMAIN"
echo ""
echo "If issues found:"
echo "  1. Backend not running: pm2 start ecosystem.config.js"
echo "  2. Database connection: check backend/.env DB_* variables"
echo "  3. Frontend needs rebuild: cd frontend && npm run build"
echo "  4. Apache proxy: sudo systemctl reload apache2"
echo ""

