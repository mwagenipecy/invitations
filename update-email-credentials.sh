#!/bin/bash

# Update Email Credentials with Specific Values
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"

echo "=== Updating Email Credentials ==="
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

echo "Updating email configuration..."

# Remove old email config lines
sed -i '/^MAIL_MAILER=/d' .env
sed -i '/^MAIL_HOST=/d' .env
sed -i '/^MAIL_PORT=/d' .env
sed -i '/^MAIL_USERNAME=/d' .env
sed -i '/^MAIL_PASSWORD=/d' .env
sed -i '/^MAIL_ENCRYPTION=/d' .env
sed -i '/^MAIL_FROM_ADDRESS=/d' .env
sed -i '/^MAIL_FROM_NAME=/d' .env
sed -i '/^MAIL_FAMILY_NAME=/d' .env

# Add new email config
echo "MAIL_MAILER=smtp" >> .env
echo "MAIL_HOST=smtp.gmail.com" >> .env
echo "MAIL_PORT=587" >> .env
echo "MAIL_USERNAME=mpembeesimon116@gmail.com" >> .env
echo "MAIL_PASSWORD=ezdmjhrqiqmfghlp" >> .env
echo "MAIL_ENCRYPTION=tls" >> .env
echo "MAIL_FROM_ADDRESS=nonreply@invitees.com" >> .env
echo 'MAIL_FROM_NAME="invitees"' >> .env
echo "MAIL_FAMILY_NAME=Tesha family" >> .env

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
    echo "Checking email configuration in logs..."
    $PM2_CMD logs event-backend --lines 10 --nostream | grep -i "email\|mail" || echo "No email logs yet"
else
    echo "⚠️  PM2 not found. Please restart backend manually:"
    echo "   pm2 restart event-backend"
fi

echo ""
echo "=== Update Complete ==="
echo ""
echo "Email credentials have been configured. Test by confirming an invitation."

