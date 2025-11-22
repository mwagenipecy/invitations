#!/bin/bash

# Check Email Configuration
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"

echo "=== Checking Email Configuration ==="
echo ""

cd $PROJECT_PATH/backend

echo "1. Checking .env file for email configuration..."
if [ -f .env ]; then
    echo "Email-related variables in .env:"
    grep -E "^MAIL_" .env || echo "⚠️  No MAIL_* variables found in .env"
    echo ""
    
    # Check each required variable
    if grep -q "^MAIL_HOST=" .env; then
        MAIL_HOST=$(grep "^MAIL_HOST=" .env | cut -d'=' -f2)
        echo "✅ MAIL_HOST: $MAIL_HOST"
    else
        echo "❌ MAIL_HOST not set"
    fi
    
    if grep -q "^MAIL_PORT=" .env; then
        MAIL_PORT=$(grep "^MAIL_PORT=" .env | cut -d'=' -f2)
        echo "✅ MAIL_PORT: $MAIL_PORT"
    else
        echo "❌ MAIL_PORT not set"
    fi
    
    if grep -q "^MAIL_USERNAME=" .env; then
        MAIL_USER=$(grep "^MAIL_USERNAME=" .env | cut -d'=' -f2)
        if [ -n "$MAIL_USER" ]; then
            echo "✅ MAIL_USERNAME: $MAIL_USER"
        else
            echo "❌ MAIL_USERNAME is empty"
        fi
    else
        echo "❌ MAIL_USERNAME not set"
    fi
    
    if grep -q "^MAIL_PASSWORD=" .env; then
        MAIL_PASS=$(grep "^MAIL_PASSWORD=" .env | cut -d'=' -f2)
        if [ -n "$MAIL_PASS" ]; then
            echo "✅ MAIL_PASSWORD: ***SET***"
        else
            echo "❌ MAIL_PASSWORD is empty"
        fi
    else
        echo "❌ MAIL_PASSWORD not set"
    fi
    
    if grep -q "^MAIL_FROM_ADDRESS=" .env; then
        MAIL_FROM=$(grep "^MAIL_FROM_ADDRESS=" .env | cut -d'=' -f2)
        echo "✅ MAIL_FROM_ADDRESS: $MAIL_FROM"
    else
        echo "⚠️  MAIL_FROM_ADDRESS not set (will use default)"
    fi
    
    if grep -q "^MAIL_FROM_NAME=" .env; then
        MAIL_FROM_NAME=$(grep "^MAIL_FROM_NAME=" .env | cut -d'=' -f2)
        echo "✅ MAIL_FROM_NAME: $MAIL_FROM_NAME"
    else
        echo "⚠️  MAIL_FROM_NAME not set (will use default)"
    fi
else
    echo "❌ .env file not found!"
fi
echo ""

echo "2. Checking backend logs for email errors..."
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
    echo "Recent email-related logs:"
    $PM2_CMD logs event-backend --lines 50 --nostream 2>/dev/null | grep -i "email\|mail\|nodemailer" || echo "No email-related logs found"
else
    echo "⚠️  PM2 not found, cannot check logs"
fi
echo ""

echo "3. Testing email configuration with Node.js..."
cd $PROJECT_PATH/backend
node -e "
require('dotenv').config();
console.log('Email Configuration Test:');
console.log('MAIL_HOST:', process.env.MAIL_HOST || 'NOT SET');
console.log('MAIL_PORT:', process.env.MAIL_PORT || 'NOT SET');
console.log('MAIL_USERNAME:', process.env.MAIL_USERNAME || 'NOT SET');
console.log('MAIL_PASSWORD:', process.env.MAIL_PASSWORD ? '***SET***' : 'NOT SET');
console.log('MAIL_FROM_ADDRESS:', process.env.MAIL_FROM_ADDRESS || 'NOT SET');
console.log('MAIL_FROM_NAME:', process.env.MAIL_FROM_NAME || 'NOT SET');
" 2>&1
echo ""

echo "=== Summary ==="
echo ""
echo "If email is not working, check:"
echo "1. All MAIL_* variables are set in backend/.env"
echo "2. For Gmail: Use App Password (not regular password)"
echo "3. Check backend logs: pm2 logs event-backend"
echo "4. Test email sending manually"
echo ""

