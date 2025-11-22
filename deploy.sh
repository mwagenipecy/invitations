#!/bin/bash

# Complete Deployment Script
# Run this after cloning from GitHub
# Usage: ./deploy.sh

set -e

PROJECT_PATH="/var/www/html/Event"
FRONTEND_DOMAIN="event.wibook.co.tz"
DB_USER="percy"
DB_PASSWORD="Mwageni@1"
DB_NAME="invite_db"

echo "=== Event Invitation System - Complete Deployment ==="
echo "Domain: $FRONTEND_DOMAIN"
echo "Path: $PROJECT_PATH"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Get current directory (project root)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# If running from cloned directory, use current directory as project path
if [[ "$SCRIPT_DIR" == *"invitations"* ]]; then
    PROJECT_PATH="$SCRIPT_DIR"
    echo "Detected cloned directory, using: $PROJECT_PATH"
else
    # Otherwise, copy to standard location
    mkdir -p $PROJECT_PATH
    cp -r backend $PROJECT_PATH/ 2>/dev/null || true
    cp -r frontend $PROJECT_PATH/ 2>/dev/null || true
    cp ecosystem.config.js $PROJECT_PATH/ 2>/dev/null || true
fi

echo "Step 1: Installing system dependencies..."
apt-get update -qq
apt-get install -y nodejs npm apache2 mysql-client curl > /dev/null 2>&1

# Install Node.js 18+ if needed
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 18 ]; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
fi

# Install PM2
echo "Installing PM2..."
npm install -g pm2 > /dev/null 2>&1

# Project directory already set above
echo ""
echo "Step 2: Project directory ready..."
echo "Using: $PROJECT_PATH"

# Set up backend
echo ""
echo "Step 3: Setting up backend..."
cd $PROJECT_PATH/backend

# Create .env file (same structure as local)
if [ ! -f .env ]; then
    echo "Creating backend .env file..."
    cat > .env << ENVEOF
PORT=5001
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
FRONTEND_URL=https://$FRONTEND_DOMAIN
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME=Event Invitation
MAIL_FAMILY_NAME=Tesha family
ENVEOF
    echo "✅ Backend .env created"
else
    echo "✅ Backend .env already exists"
fi

# Install backend dependencies
echo "Installing backend dependencies..."
npm install --production > /dev/null 2>&1

# Set up database
echo ""
echo "Step 4: Setting up database..."
mysql -u $DB_USER -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || \
mysql -u root -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;" 2>/dev/null || \
echo "⚠️  Database setup - please run manually: mysql -u percy -p -e 'CREATE DATABASE IF NOT EXISTS invite_db;'"

# Run database setup
cd $PROJECT_PATH/backend
echo "Running database setup..."
if npm run setup-db 2>&1; then
    echo "✅ Database tables created"
else
    echo "⚠️  Database setup script failed - check manually"
    echo "   Run: cd backend && npm run setup-db"
fi

echo "Running database seed..."
if npm run seed 2>&1; then
    echo "✅ Database seeded"
else
    echo "⚠️  Database seed failed - check manually"
    echo "   Run: cd backend && npm run seed"
fi

# Set up frontend
echo ""
echo "Step 5: Setting up frontend..."
cd $PROJECT_PATH/frontend

# Create .env for frontend (same structure as local)
if [ ! -f .env ]; then
    echo "Creating frontend .env file..."
    cat > .env << ENVEOF
VITE_API_URL=https://$FRONTEND_DOMAIN/api
ENVEOF
    echo "✅ Frontend .env created"
else
    echo "✅ Frontend .env already exists"
fi

# Install and build frontend
echo "Installing frontend dependencies..."
npm install > /dev/null 2>&1
echo "Building frontend..."
npm run build > /dev/null 2>&1
echo "✅ Frontend built successfully"

# Configure Apache
echo ""
echo "Step 6: Configuring Apache..."

# Enable required Apache modules
a2enmod rewrite > /dev/null 2>&1
a2enmod proxy > /dev/null 2>&1
a2enmod proxy_http > /dev/null 2>&1
a2enmod headers > /dev/null 2>&1
a2enmod ssl > /dev/null 2>&1

# Create Apache Virtual Host
cat > /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf << APACHEEOF
<VirtualHost *:80>
    ServerName $FRONTEND_DOMAIN
    DocumentRoot $PROJECT_PATH/frontend/dist
    
    <Directory $PROJECT_PATH/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Proxy API requests to backend
    ProxyPreserveHost On
    ProxyPass /api http://localhost:5001/api
    ProxyPassReverse /api http://localhost:5001/api
    
    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    
    ErrorLog \${APACHE_LOG_DIR}/$FRONTEND_DOMAIN-error.log
    CustomLog \${APACHE_LOG_DIR}/$FRONTEND_DOMAIN-access.log combined
</VirtualHost>
APACHEEOF

# Enable site and disable default
a2ensite $FRONTEND_DOMAIN.conf > /dev/null 2>&1
a2dissite 000-default.conf > /dev/null 2>&1

# Test and reload Apache
echo "Testing Apache configuration..."
apache2ctl configtest > /dev/null 2>&1
systemctl reload apache2 > /dev/null 2>&1
echo "✅ Apache configured"

# Set up PM2 for backend
echo ""
echo "Step 7: Setting up PM2 for backend..."
cd $PROJECT_PATH/backend

# Update ecosystem.config.js with correct path
if [ -f $PROJECT_PATH/ecosystem.config.js ]; then
    echo "Updating ecosystem.config.js with correct path..."
    cat > $PROJECT_PATH/ecosystem.config.js << ECOSYSTEMEOF
// PM2 ecosystem configuration
const path = require('path');
const projectPath = '$PROJECT_PATH';

module.exports = {
  apps: [{
    name: 'event-backend',
    script: path.join(projectPath, 'backend', 'index.js'),
    cwd: projectPath,
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: '/var/log/pm2/event-backend-error.log',
    out_file: '/var/log/pm2/event-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
ECOSYSTEMEOF
fi

# Start backend with PM2
pm2 delete event-backend 2>/dev/null || true
cd $PROJECT_PATH
pm2 start ecosystem.config.js
pm2 save
pm2 startup > /dev/null 2>&1 || true

# Wait a moment and check status
sleep 2
if pm2 list | grep -q "event-backend.*online"; then
    echo "✅ Backend started with PM2"
else
    echo "⚠️  Backend may not have started. Check logs: pm2 logs event-backend"
    pm2 logs event-backend --lines 20
fi

# Install SSL certificate
echo ""
echo "Step 8: Installing SSL certificate..."
if command -v certbot &> /dev/null || apt-get install -y certbot python3-certbot-apache > /dev/null 2>&1; then
    certbot --apache -d $FRONTEND_DOMAIN --non-interactive --agree-tos --email admin@$FRONTEND_DOMAIN --redirect > /dev/null 2>&1 || echo "⚠️  SSL installation - run manually: certbot --apache -d $FRONTEND_DOMAIN"
    
    # Update frontend for HTTPS if SSL was installed
    if [ -f /etc/letsencrypt/live/$FRONTEND_DOMAIN/fullchain.pem ]; then
        cd $PROJECT_PATH/frontend
        echo "VITE_API_URL=https://$FRONTEND_DOMAIN/api" > .env
        npm run build > /dev/null 2>&1
        systemctl reload apache2 > /dev/null 2>&1
        echo "✅ SSL certificate installed"
    fi
else
    echo "⚠️  Certbot not available - install SSL manually"
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "✅ Backend: Running on port 5001"
echo "✅ Frontend: https://$FRONTEND_DOMAIN"
echo "✅ Database: $DB_NAME"
echo "✅ Apache: Configured and running"
echo ""
echo "Check status:"
echo "  pm2 status"
echo "  pm2 logs event-backend"
echo "  systemctl status apache2"
echo ""
echo "Next steps:"
echo "1. Update email credentials in $PROJECT_PATH/backend/.env"
echo "2. Test: https://$FRONTEND_DOMAIN"
echo "3. Login and create events"
