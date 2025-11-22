#!/bin/bash

# Fix Backend .env to use 127.0.0.1 instead of localhost
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"

echo "=== Fixing Backend .env Database Configuration ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

cd $PROJECT_PATH/backend

if [ ! -f .env ]; then
    echo "❌ Backend .env file not found!"
    exit 1
fi

echo "Current DB_HOST in .env:"
grep DB_HOST .env || echo "DB_HOST not found"
echo ""

# Update DB_HOST to 127.0.0.1
if grep -q "^DB_HOST=" .env; then
    echo "Updating DB_HOST to 127.0.0.1..."
    sed -i 's/^DB_HOST=.*$/DB_HOST=127.0.0.1/' .env
    echo "✅ DB_HOST updated"
else
    echo "Adding DB_HOST=127.0.0.1..."
    echo "DB_HOST=127.0.0.1" >> .env
    echo "✅ DB_HOST added"
fi

# Ensure other DB variables are set
if ! grep -q "^DB_USER=" .env; then
    echo "DB_USER=percy" >> .env
    echo "✅ DB_USER added"
fi

if ! grep -q "^DB_PASSWORD=" .env; then
    echo "DB_PASSWORD=Mwageni@1" >> .env
    echo "✅ DB_PASSWORD added"
fi

if ! grep -q "^DB_NAME=" .env; then
    echo "DB_NAME=invite_db" >> .env
    echo "✅ DB_NAME added"
fi

echo ""
echo "Updated database configuration:"
grep -E "^DB_" .env
echo ""

# Restart backend
echo "Restarting backend..."
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
    $PM2_CMD restart event-backend
    sleep 3
    echo ""
    echo "Backend logs (checking for database connection):"
    $PM2_CMD logs event-backend --lines 10 --nostream
    echo ""
    
    if $PM2_CMD logs event-backend --lines 5 --nostream 2>/dev/null | grep -q "Database connected successfully"; then
        echo "✅ Backend connected to database successfully!"
    else
        echo "⚠️  Check backend logs for connection status:"
        $PM2_CMD logs event-backend --lines 10 --nostream
    fi
else
    echo "⚠️  PM2 not found. Please restart backend manually:"
    echo "   pm2 restart event-backend"
fi

echo ""
echo "=== Fix Complete ==="

