#!/bin/bash

# Diagnose .env File Issues
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"

echo "=== Diagnosing .env File Issues ==="
echo ""

cd $PROJECT_PATH/backend

echo "1. Checking .env file location and contents..."
if [ -f .env ]; then
    echo "✅ .env file exists at: $(pwd)/.env"
    echo ""
    echo "Current .env contents:"
    cat .env
    echo ""
    echo "DB_* variables:"
    grep -E "^DB_" .env || echo "⚠️  No DB_ variables found!"
else
    echo "❌ .env file NOT found at: $(pwd)/.env"
    echo "   Creating it..."
    touch .env
fi
echo ""

echo "2. Testing if Node.js can read .env..."
cd $PROJECT_PATH/backend
node -e "
require('dotenv').config();
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('');
console.log('All DB_* env vars:');
Object.keys(process.env).filter(k => k.startsWith('DB_')).forEach(k => {
  console.log('  ' + k + ':', k.includes('PASSWORD') ? '***' : process.env[k]);
});
" 2>&1
echo ""

echo "3. Checking backend/database/connection.js default values..."
if [ -f database/connection.js ]; then
    echo "Default host in connection.js:"
    grep -A 1 "host:" database/connection.js | head -2
    echo ""
    echo "Default user in connection.js:"
    grep -A 1 "user:" database/connection.js | head -2
else
    echo "❌ connection.js not found"
fi
echo ""

echo "4. Checking PM2 process environment..."
if command -v pm2 &> /dev/null; then
    PM2_CMD="pm2"
elif [ -f /usr/bin/pm2 ]; then
    PM2_CMD="/usr/bin/pm2"
elif [ -f /usr/local/bin/pm2 ]; then
    PM2_CMD="/usr/local/bin/pm2"
else
    PM2_CMD=$(find /usr -name pm2 2>/dev/null | head -1)
fi

if [ -n "$PM2_CMD" ] && [ -f "$PM2_CMD" ]; then
    echo "PM2 process info:"
    $PM2_CMD show event-backend 2>/dev/null | grep -E "exec_mode|script|cwd|env" || echo "Could not get PM2 info"
else
    echo "⚠️  PM2 not found"
fi
echo ""

echo "5. Verifying .env file format..."
cd $PROJECT_PATH/backend
if [ -f .env ]; then
    # Check for common issues
    if grep -q "^DB_HOST=localhost" .env; then
        echo "⚠️  DB_HOST is set to 'localhost' (should be '127.0.0.1')"
    fi
    if grep -q "^DB_USER=test" .env; then
        echo "⚠️  DB_USER is set to 'test' (should be 'percy')"
    fi
    if ! grep -q "^DB_HOST=127.0.0.1" .env; then
        echo "⚠️  DB_HOST is not set to '127.0.0.1'"
    fi
    if ! grep -q "^DB_USER=percy" .env; then
        echo "⚠️  DB_USER is not set to 'percy'"
    fi
    if [ $(grep -c "^DB_" .env) -lt 4 ]; then
        echo "⚠️  Missing DB_* variables in .env"
    fi
fi
echo ""

echo "=== Diagnosis Complete ==="
echo ""
echo "If .env is wrong, fix it with:"
echo "  cd $PROJECT_PATH/backend"
echo "  sed -i '/^DB_/d' .env"
echo "  echo 'DB_HOST=127.0.0.1' >> .env"
echo "  echo 'DB_USER=percy' >> .env"
echo "  echo 'DB_PASSWORD=Mwageni@1' >> .env"
echo "  echo 'DB_NAME=invite_db' >> .env"
echo ""
echo "Then restart:"
echo "  pm2 delete event-backend"
echo "  cd $PROJECT_PATH"
echo "  pm2 start ecosystem.config.js"

