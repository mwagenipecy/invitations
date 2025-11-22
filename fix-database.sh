#!/bin/bash

# Fix Database Connection Issues
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"
DB_USER="percy"
DB_PASSWORD="Mwageni@1"
DB_NAME="invite_db"

echo "=== Fixing Database Connection ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Step 1: Check MySQL is running
echo "1. Checking MySQL service..."
if systemctl is-active --quiet mysql || systemctl is-active --quiet mariadb; then
    echo "✅ MySQL/MariaDB is running"
else
    echo "⚠️  MySQL/MariaDB is not running. Starting..."
    systemctl start mysql 2>/dev/null || systemctl start mariadb
    sleep 2
    if systemctl is-active --quiet mysql || systemctl is-active --quiet mariadb; then
        echo "✅ MySQL/MariaDB started"
    else
        echo "❌ Failed to start MySQL/MariaDB"
        exit 1
    fi
fi
echo ""

# Step 2: Check database exists
echo "2. Checking database exists..."
if mysql -u $DB_USER -p$DB_PASSWORD -e "USE $DB_NAME;" 2>/dev/null; then
    echo "✅ Database '$DB_NAME' exists"
else
    echo "⚠️  Database '$DB_NAME' does not exist. Creating..."
    mysql -u $DB_USER -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || \
    mysql -u root -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || \
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || {
        echo "❌ Failed to create database. Please run manually:"
        echo "   mysql -u $DB_USER -p -e 'CREATE DATABASE IF NOT EXISTS $DB_NAME;'"
    }
fi
echo ""

# Step 3: Check backend .env
echo "3. Checking backend .env..."
cd $PROJECT_PATH/backend

if [ -f .env ]; then
    echo "Current DB_HOST in .env:"
    grep DB_HOST .env || echo "DB_HOST not found"
    echo ""
    
    # Update DB_HOST to 127.0.0.1 if it's localhost
    if grep -q "DB_HOST=localhost" .env; then
        echo "Updating DB_HOST from localhost to 127.0.0.1..."
        sed -i 's/^DB_HOST=localhost$/DB_HOST=127.0.0.1/' .env
        echo "✅ DB_HOST updated to 127.0.0.1"
    elif ! grep -q "DB_HOST=" .env; then
        echo "Adding DB_HOST=127.0.0.1 to .env..."
        echo "DB_HOST=127.0.0.1" >> .env
        echo "✅ DB_HOST added"
    else
        echo "✅ DB_HOST is already set (not localhost)"
    fi
    
    # Ensure DB_USER and DB_PASSWORD are set
    if ! grep -q "DB_USER=" .env; then
        echo "DB_USER=$DB_USER" >> .env
    fi
    if ! grep -q "DB_PASSWORD=" .env; then
        echo "DB_PASSWORD=$DB_PASSWORD" >> .env
    fi
    if ! grep -q "DB_NAME=" .env; then
        echo "DB_NAME=$DB_NAME" >> .env
    fi
    
    echo ""
    echo "Current database config in .env:"
    grep -E "DB_HOST|DB_USER|DB_NAME" .env
else
    echo "❌ Backend .env not found!"
    exit 1
fi
echo ""

# Step 4: Test database connection
echo "4. Testing database connection..."
if mysql -u $DB_USER -p$DB_PASSWORD -h 127.0.0.1 -e "USE $DB_NAME; SELECT 1;" 2>/dev/null; then
    echo "✅ Database connection successful with 127.0.0.1"
else
    echo "⚠️  Connection test failed. Trying with root..."
    mysql -u root -p$DB_PASSWORD -h 127.0.0.1 -e "USE $DB_NAME; SELECT 1;" 2>/dev/null || \
    mysql -u root -h 127.0.0.1 -e "USE $DB_NAME; SELECT 1;" 2>/dev/null || {
        echo "❌ Database connection failed"
        echo "Please check:"
        echo "  1. MySQL is running: systemctl status mysql"
        echo "  2. Database exists: mysql -u $DB_USER -p -e 'SHOW DATABASES;'"
        echo "  3. User has permissions: mysql -u root -p -e \"GRANT ALL ON $DB_NAME.* TO '$DB_USER'@'localhost';\""
    }
fi
echo ""

# Step 5: Run database setup
echo "5. Running database setup..."
cd $PROJECT_PATH/backend
if npm run setup-db 2>&1; then
    echo "✅ Database tables created/verified"
else
    echo "⚠️  Database setup had issues - check manually"
fi
echo ""

# Step 6: Restart backend
echo "6. Restarting backend..."
if command -v pm2 &> /dev/null; then
    pm2 restart event-backend
    sleep 2
    pm2 logs event-backend --lines 10 --nostream
else
    echo "⚠️  PM2 not found in PATH. Trying with full path..."
    if [ -f /usr/bin/pm2 ]; then
        /usr/bin/pm2 restart event-backend
        sleep 2
        /usr/bin/pm2 logs event-backend --lines 10 --nostream
    elif [ -f /usr/local/bin/pm2 ]; then
        /usr/local/bin/pm2 restart event-backend
        sleep 2
        /usr/local/bin/pm2 logs event-backend --lines 10 --nostream
    else
        echo "⚠️  PM2 not found. Please restart backend manually:"
        echo "   pm2 restart event-backend"
        echo "   Or: cd $PROJECT_PATH/backend && node index.js"
    fi
fi
echo ""

# Step 7: Verify connection
echo "7. Verifying backend can connect to database..."
sleep 2
PM2_CMD="pm2"
if ! command -v pm2 &> /dev/null; then
    if [ -f /usr/bin/pm2 ]; then
        PM2_CMD="/usr/bin/pm2"
    elif [ -f /usr/local/bin/pm2 ]; then
        PM2_CMD="/usr/local/bin/pm2"
    else
        echo "⚠️  PM2 not found. Skipping log check."
        PM2_CMD=""
    fi
fi

if [ -n "$PM2_CMD" ]; then
    if $PM2_CMD logs event-backend --lines 5 --nostream 2>/dev/null | grep -q "Database connected successfully"; then
        echo "✅ Backend connected to database successfully"
    else
        echo "⚠️  Check backend logs for connection status:"
        $PM2_CMD logs event-backend --lines 10 --nostream 2>/dev/null || echo "Could not read PM2 logs"
    fi
else
    echo "⚠️  PM2 not available. Please check backend logs manually."
fi
echo ""

echo "=== Database Fix Complete ==="
echo ""
echo "If connection still fails, check:"
echo "  1. MySQL is running: systemctl status mysql"
echo "  2. Database exists: mysql -u $DB_USER -p -e 'SHOW DATABASES;'"
echo "  3. Backend .env has correct credentials"
echo "  4. User has permissions: mysql -u root -p -e \"GRANT ALL ON $DB_NAME.* TO '$DB_USER'@'localhost';\""

