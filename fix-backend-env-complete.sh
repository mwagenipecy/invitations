#!/bin/bash

# Complete fix for Backend .env - Force update and restart
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"

echo "=== Complete Backend .env Fix ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

cd $PROJECT_PATH/backend

if [ ! -f .env ]; then
    echo "❌ Backend .env file not found! Creating it..."
    touch .env
fi

echo "Current .env database settings:"
grep -E "^DB_" .env || echo "No DB_ variables found"
echo ""

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Remove old DB_* lines
sed -i '/^DB_HOST=/d' .env
sed -i '/^DB_USER=/d' .env
sed -i '/^DB_PASSWORD=/d' .env
sed -i '/^DB_NAME=/d' .env

# Add correct database configuration
echo "DB_HOST=127.0.0.1" >> .env
echo "DB_USER=percy" >> .env
echo "DB_PASSWORD=Mwageni@1" >> .env
echo "DB_NAME=invite_db" >> .env

echo "✅ Updated .env with:"
grep -E "^DB_" .env
echo ""

# Test database connection
echo "Testing database connection..."
if mysql -u percy -pMwageni@1 -h 127.0.0.1 -e "USE invite_db; SELECT 1;" 2>/dev/null; then
    echo "✅ Database connection test successful"
else
    echo "⚠️  Database connection test failed"
    echo "   Trying with root..."
    if mysql -u root -pMwageni@1 -h 127.0.0.1 -e "USE invite_db; SELECT 1;" 2>/dev/null; then
        echo "✅ Connection works with root"
        echo "   You may need to grant permissions to 'percy' user"
    else
        echo "❌ Connection failed. Please check:"
        echo "   1. MySQL is running: systemctl status mysql"
        echo "   2. Database exists: mysql -u percy -p -e 'SHOW DATABASES;'"
        echo "   3. User has permissions"
    fi
fi
echo ""

# Find PM2
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
    echo "Stopping backend..."
    $PM2_CMD delete event-backend 2>/dev/null || true
    sleep 2
    
    echo "Starting backend with updated .env..."
    cd $PROJECT_PATH
    $PM2_CMD start ecosystem.config.js
    sleep 3
    
    echo ""
    echo "Backend logs:"
    $PM2_CMD logs event-backend --lines 15 --nostream
    
    echo ""
    if $PM2_CMD logs event-backend --lines 5 --nostream 2>/dev/null | grep -q "Database connected successfully"; then
        echo "✅ Backend connected to database successfully!"
    else
        echo "⚠️  Database connection issue persists"
        echo "   Check logs: $PM2_CMD logs event-backend"
        echo "   Verify .env: cat $PROJECT_PATH/backend/.env | grep DB_"
    fi
else
    echo "⚠️  PM2 not found. Please restart backend manually:"
    echo "   cd $PROJECT_PATH"
    echo "   pm2 delete event-backend"
    echo "   pm2 start ecosystem.config.js"
fi

echo ""
echo "=== Fix Complete ==="

