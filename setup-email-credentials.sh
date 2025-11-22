#!/bin/bash

# Setup Email Credentials on Production Server
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"

echo "=== Setting Up Email Credentials ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

cd $PROJECT_PATH/backend

if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "Current email configuration:"
grep -E "^MAIL_" .env || echo "No MAIL_ variables found"
echo ""

# Check if credentials are already set
MAIL_USER=$(grep "^MAIL_USERNAME=" .env | cut -d'=' -f2 || echo "")
MAIL_PASS=$(grep "^MAIL_PASSWORD=" .env | cut -d'=' -f2 || echo "")
MAIL_FROM=$(grep "^MAIL_FROM_ADDRESS=" .env | cut -d'=' -f2 || echo "")

if [ -n "$MAIL_USER" ] && [ -n "$MAIL_PASS" ] && [ -n "$MAIL_FROM" ]; then
    echo "✅ Email credentials are already configured"
    echo "   MAIL_USERNAME: $MAIL_USER"
    echo "   MAIL_FROM_ADDRESS: $MAIL_FROM"
    echo ""
    read -p "Do you want to update them? (y/n): " update_creds
    if [ "$update_creds" != "y" ] && [ "$update_creds" != "Y" ]; then
        echo "Keeping existing credentials"
        exit 0
    fi
fi

echo "Enter email configuration:"
echo ""

# Get email username
if [ -z "$MAIL_USER" ]; then
    read -p "Gmail address (e.g., your-email@gmail.com): " MAIL_USER
else
    read -p "Gmail address [current: $MAIL_USER]: " NEW_MAIL_USER
    MAIL_USER=${NEW_MAIL_USER:-$MAIL_USER}
fi

# Get email password (App Password for Gmail)
if [ -z "$MAIL_PASS" ]; then
    read -p "Gmail App Password (16 characters, no spaces): " MAIL_PASS
else
    read -p "Gmail App Password [press Enter to keep current]: " NEW_MAIL_PASS
    MAIL_PASS=${NEW_MAIL_PASS:-$MAIL_PASS}
fi

# Get from address
if [ -z "$MAIL_FROM" ]; then
    read -p "From address [default: $MAIL_USER]: " MAIL_FROM
    MAIL_FROM=${MAIL_FROM:-$MAIL_USER}
else
    read -p "From address [current: $MAIL_FROM]: " NEW_MAIL_FROM
    MAIL_FROM=${NEW_MAIL_FROM:-$MAIL_FROM}
fi

# Validate inputs
if [ -z "$MAIL_USER" ] || [ -z "$MAIL_PASS" ] || [ -z "$MAIL_FROM" ]; then
    echo "❌ All fields are required!"
    exit 1
fi

echo ""
echo "Updating .env file..."

# Remove old email config lines
sed -i '/^MAIL_USERNAME=/d' .env
sed -i '/^MAIL_PASSWORD=/d' .env
sed -i '/^MAIL_FROM_ADDRESS=/d' .env

# Add new email config
echo "MAIL_USERNAME=$MAIL_USER" >> .env
echo "MAIL_PASSWORD=$MAIL_PASS" >> .env
echo "MAIL_FROM_ADDRESS=$MAIL_FROM" >> .env

# Ensure other email settings are set
if ! grep -q "^MAIL_HOST=" .env; then
    echo "MAIL_HOST=smtp.gmail.com" >> .env
fi
if ! grep -q "^MAIL_PORT=" .env; then
    echo "MAIL_PORT=587" >> .env
fi
if ! grep -q "^MAIL_ENCRYPTION=" .env; then
    echo "MAIL_ENCRYPTION=tls" >> .env
fi
if ! grep -q "^MAIL_FROM_NAME=" .env; then
    echo "MAIL_FROM_NAME=Event Invitation" >> .env
fi
if ! grep -q "^MAIL_FAMILY_NAME=" .env; then
    echo "MAIL_FAMILY_NAME=Tesha family" >> .env
fi

echo ""
echo "✅ Email credentials updated"
echo ""
echo "Updated configuration:"
grep -E "^MAIL_" .env
echo ""

# Restart backend
echo "Restarting backend to apply changes..."
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
    echo "✅ Backend restarted"
    echo ""
    echo "Check logs:"
    $PM2_CMD logs event-backend --lines 10 --nostream | grep -i email || echo "No email logs yet"
else
    echo "⚠️  PM2 not found. Please restart backend manually:"
    echo "   pm2 restart event-backend"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Note: For Gmail, make sure you're using an App Password, not your regular password."
echo "Generate one at: https://myaccount.google.com/apppasswords"

