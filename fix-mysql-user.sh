#!/bin/bash

# Fix MySQL User and Permissions
# Run this on the server

set -e

DB_USER="percy"
DB_PASSWORD="Mwageni@1"
DB_NAME="invite_db"

echo "=== Fixing MySQL User and Permissions ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

echo "1. Checking if MySQL user '$DB_USER' exists..."
USER_EXISTS=$(mysql -u root -pMwageni@1 -e "SELECT User FROM mysql.user WHERE User='$DB_USER';" 2>/dev/null | grep -c "$DB_USER" || echo "0")

if [ "$USER_EXISTS" -eq 0 ]; then
    echo "⚠️  User '$DB_USER' does not exist. Creating..."
    mysql -u root -pMwageni@1 << EOF
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER IF NOT EXISTS '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASSWORD';
FLUSH PRIVILEGES;
EOF
    echo "✅ User '$DB_USER' created"
else
    echo "✅ User '$DB_USER' exists"
fi
echo ""

echo "2. Granting permissions..."
mysql -u root -pMwageni@1 << EOF
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'127.0.0.1';
FLUSH PRIVILEGES;
EOF
echo "✅ Permissions granted"
echo ""

echo "3. Testing connection with new user..."
if mysql -u $DB_USER -p$DB_PASSWORD -h 127.0.0.1 -e "USE $DB_NAME; SELECT 1;" 2>/dev/null; then
    echo "✅ Connection test successful"
else
    echo "❌ Connection test failed"
    echo "   Trying to reset password..."
    mysql -u root -pMwageni@1 << EOF
ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
ALTER USER '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASSWORD';
FLUSH PRIVILEGES;
EOF
    echo "✅ Password reset"
fi
echo ""

echo "4. Verifying backend .env file..."
PROJECT_PATH="/var/www/html/Event/invitations"
cd $PROJECT_PATH/backend

if [ -f .env ]; then
    echo "Current DB_* settings in .env:"
    grep -E "^DB_" .env || echo "No DB_ variables found"
    echo ""
    
    # Update .env
    sed -i '/^DB_HOST=/d; /^DB_USER=/d; /^DB_PASSWORD=/d; /^DB_NAME=/d' .env
    echo "DB_HOST=127.0.0.1" >> .env
    echo "DB_USER=$DB_USER" >> .env
    echo "DB_PASSWORD=$DB_PASSWORD" >> .env
    echo "DB_NAME=$DB_NAME" >> .env
    
    echo "Updated .env:"
    grep -E "^DB_" .env
else
    echo "❌ .env file not found!"
    exit 1
fi
echo ""

echo "5. Restarting backend..."
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
    $PM2_CMD delete event-backend 2>/dev/null || true
    sleep 2
    cd $PROJECT_PATH
    $PM2_CMD start ecosystem.config.js
    sleep 3
    
    echo ""
    echo "Backend logs:"
    $PM2_CMD logs event-backend --lines 10 --nostream
    
    if $PM2_CMD logs event-backend --lines 5 --nostream 2>/dev/null | grep -q "Database connected successfully"; then
        echo ""
        echo "✅ Backend connected to database successfully!"
    else
        echo ""
        echo "⚠️  Check logs for details:"
        $PM2_CMD logs event-backend --lines 10 --nostream
    fi
else
    echo "⚠️  PM2 not found"
fi

echo ""
echo "=== Fix Complete ==="

