#!/bin/bash

# Complete Deployment Script
# Deploys backend and frontend to server in one go
# Usage: ./deploy-all.sh

set -e

SERVER="root@wibook.co.tz"
SERVER_PASSWORD="Mwageni@1"
PROJECT_PATH="/var/www/html/Event"
FRONTEND_DOMAIN="event.wibook.co.tz"
DB_USER="percy"
DB_PASSWORD="Mwageni@1"
DB_NAME="invite_db"

echo "=== Event Invitation System - Complete Deployment ==="
echo ""

# Check if sshpass is available, if not, try to install or use alternative
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass not found. Trying alternative methods..."
    USE_SSHPASS=false
else
    USE_SSHPASS=true
fi

# Step 1: Create deployment package
echo "Step 1: Creating deployment package..."
cd "$(dirname "$0")"

tar -czf deployment.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='frontend/dist' \
    --exclude='frontend/node_modules' \
    --exclude='backend/node_modules' \
    --exclude='mobile' \
    --exclude='*.log' \
    --exclude='.env' \
    --exclude='deployment*.tar.gz' \
    backend/ frontend/ ecosystem.config.js 2>/dev/null

if [ ! -f deployment.tar.gz ]; then
    echo "❌ Failed to create deployment package"
    exit 1
fi

echo "✅ Deployment package created"

# Step 2: Upload to server
echo ""
echo "Step 2: Uploading to server..."

if [ "$USE_SSHPASS" = true ]; then
    sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no deployment.tar.gz $SERVER:/tmp/ 2>&1
    UPLOAD_SUCCESS=$?
else
    echo "Please upload deployment.tar.gz manually to server at /tmp/"
    echo "Or install sshpass: brew install hudochenkov/sshpass/sshpass (macOS)"
    read -p "Press Enter after uploading..."
    UPLOAD_SUCCESS=0
fi

if [ $UPLOAD_SUCCESS -ne 0 ]; then
    echo "⚠️  Automatic upload failed. Please upload manually:"
    echo "   File: deployment.tar.gz"
    echo "   Destination: /tmp/deployment.tar.gz on server"
    echo ""
    read -p "Press Enter after uploading manually..."
fi

# Step 3: Deploy on server
echo ""
echo "Step 3: Deploying on server..."

DEPLOY_SCRIPT=$(cat << 'DEPLOY_EOF'
#!/bin/bash
set -e

PROJECT_PATH="/var/www/html/Event"
FRONTEND_DOMAIN="event.wibook.co.tz"
DB_USER="percy"
DB_PASSWORD="Mwageni@1"
DB_NAME="invite_db"

echo "=== Server Deployment Started ==="

# Extract files
echo "Extracting files..."
mkdir -p $PROJECT_PATH
cd $PROJECT_PATH
tar -xzf /tmp/deployment.tar.gz
rm /tmp/deployment.tar.gz

# Install system dependencies
echo ""
echo "Installing system dependencies..."
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

# Set up backend
echo ""
echo "Setting up backend..."
cd $PROJECT_PATH/backend

# Create .env file
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

# Install backend dependencies
echo "Installing backend dependencies..."
npm install --production > /dev/null 2>&1

# Set up frontend
echo ""
echo "Setting up frontend..."
cd $PROJECT_PATH/frontend

# Create .env for frontend
cat > .env << ENVEOF
VITE_API_URL=https://$FRONTEND_DOMAIN/api
ENVEOF

# Install and build frontend
echo "Installing frontend dependencies..."
npm install > /dev/null 2>&1
echo "Building frontend..."
npm run build > /dev/null 2>&1

# Enable Apache modules
echo ""
echo "Configuring Apache..."
a2enmod rewrite > /dev/null 2>&1
a2enmod proxy > /dev/null 2>&1
a2enmod proxy_http > /dev/null 2>&1
a2enmod headers > /dev/null 2>&1
a2enmod ssl > /dev/null 2>&1

# Configure Apache Virtual Host
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
apache2ctl configtest > /dev/null 2>&1
systemctl reload apache2 > /dev/null 2>&1

# Set up database
echo ""
echo "Setting up database..."
mysql -u $DB_USER -p$DB_PASSWORD << DBEOF 2>/dev/null || true
CREATE DATABASE IF NOT EXISTS $DB_NAME;
USE $DB_NAME;
DBEOF

# Run database setup
cd $PROJECT_PATH/backend
npm run setup-db > /dev/null 2>&1 || echo "⚠️  Database setup - check manually"

# Set up PM2
echo ""
echo "Setting up PM2..."
cd $PROJECT_PATH
pm2 delete event-backend 2>/dev/null || true
pm2 start ecosystem.config.js > /dev/null 2>&1
pm2 save > /dev/null 2>&1
pm2 startup > /dev/null 2>&1 || true

# Install SSL if certbot is available
echo ""
echo "Installing SSL certificate..."
if command -v certbot &> /dev/null || apt-get install -y certbot python3-certbot-apache > /dev/null 2>&1; then
    certbot --apache -d $FRONTEND_DOMAIN --non-interactive --agree-tos --email admin@$FRONTEND_DOMAIN --redirect > /dev/null 2>&1 || echo "⚠️  SSL installation - run manually: certbot --apache -d $FRONTEND_DOMAIN"
else
    echo "⚠️  Certbot not available - install SSL manually"
fi

# Update frontend for HTTPS if SSL was installed
if [ -f /etc/letsencrypt/live/$FRONTEND_DOMAIN/fullchain.pem ]; then
    cd $PROJECT_PATH/frontend
    echo "VITE_API_URL=https://$FRONTEND_DOMAIN/api" > .env
    npm run build > /dev/null 2>&1
    systemctl reload apache2 > /dev/null 2>&1
fi

echo ""
echo "=== Deployment Complete ==="
echo "✅ Backend: http://localhost:5001"
echo "✅ Frontend: http://$FRONTEND_DOMAIN"
echo "✅ Database: $DB_NAME"
echo ""
echo "Check status:"
echo "  pm2 status"
echo "  pm2 logs event-backend"
echo "  systemctl status nginx"
DEPLOY_EOF
)

if [ "$USE_SSHPASS" = true ]; then
    echo "$DEPLOY_SCRIPT" | sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER "bash -s"
else
    echo "Please run this script on the server:"
    echo ""
    echo "$DEPLOY_SCRIPT" > /tmp/server-deploy.sh
    echo "Script saved to: /tmp/server-deploy.sh"
    echo "Copy it to server and run: bash /tmp/server-deploy.sh"
fi

# Cleanup
rm -f deployment.tar.gz

echo ""
echo "✅ Deployment script completed!"
echo ""
echo "Next steps:"
echo "1. Update email credentials in backend/.env"
echo "2. Test: https://$FRONTEND_DOMAIN"
echo "3. Check: pm2 status (on server)"
echo "4. Check Apache: systemctl status apache2"

