#!/bin/bash

# Force Complete Restart of Backend - Clear All Caches
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"

echo "=== Force Restart Backend (Clear All Caches) ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Find PM2
if command -v pm2 &> /dev/null; then
    PM2_CMD="pm2"
elif [ -f /usr/bin/pm2 ]; then
    PM2_CMD="/usr/bin/pm2"
elif [ -f /usr/local/bin/pm2 ]; then
    PM2_CMD="/usr/local/bin/pm2"
else
    echo "❌ PM2 not found"
    exit 1
fi

echo "1. Verifying backend .env file..."
cd $PROJECT_PATH/backend

if [ ! -f .env ]; then
    echo "❌ .env file not found! Creating it..."
    touch .env
fi

echo "Current .env contents:"
cat .env
echo ""

echo "2. Updating .env with correct values..."
# Remove all DB_* lines
sed -i '/^DB_HOST=/d; /^DB_USER=/d; /^DB_PASSWORD=/d; /^DB_NAME=/d' .env

# Add correct values
echo "DB_HOST=127.0.0.1" >> .env
echo "DB_USER=percy" >> .env
echo "DB_PASSWORD=Mwageni@1" >> .env
echo "DB_NAME=invite_db" >> .env

echo "Updated .env:"
cat .env | grep DB_
echo ""

echo "3. Checking ecosystem.config.js..."
cd $PROJECT_PATH
if [ -f ecosystem.config.js ]; then
    echo "ecosystem.config.js exists"
    # Check if it's setting DB_* env vars
    if grep -q "DB_" ecosystem.config.js; then
        echo "⚠️  ecosystem.config.js contains DB_ variables - these will override .env"
        grep "DB_" ecosystem.config.js
    else
        echo "✅ ecosystem.config.js doesn't override DB_ variables"
    fi
else
    echo "⚠️  ecosystem.config.js not found"
fi
echo ""

echo "4. Stopping all PM2 processes..."
$PM2_CMD delete all 2>/dev/null || true
$PM2_CMD kill 2>/dev/null || true
sleep 2

echo "5. Starting backend fresh..."
cd $PROJECT_PATH
$PM2_CMD start ecosystem.config.js
sleep 5

echo ""
echo "6. Checking backend logs..."
$PM2_CMD logs event-backend --lines 15 --nostream

echo ""
echo "7. Verifying database connection..."
sleep 2
if $PM2_CMD logs event-backend --lines 5 --nostream 2>/dev/null | grep -q "Database connected successfully"; then
    echo ""
    echo "✅ SUCCESS! Backend connected to database!"
    echo ""
    $PM2_CMD status
else
    echo ""
    echo "❌ Database connection still failing"
    echo ""
    echo "Debugging info:"
    echo "  .env file:"
    cat $PROJECT_PATH/backend/.env | grep DB_
    echo ""
    echo "  PM2 process info:"
    $PM2_CMD show event-backend | grep -E "exec_mode|env|script" || true
    echo ""
    echo "  Latest logs:"
    $PM2_CMD logs event-backend --lines 10 --nostream
    echo ""
    echo "Try manually:"
    echo "  cd $PROJECT_PATH/backend"
    echo "  node -e \"require('dotenv').config(); console.log('DB_HOST:', process.env.DB_HOST); console.log('DB_USER:', process.env.DB_USER);\""
fi

echo ""
echo "=== Restart Complete ==="

