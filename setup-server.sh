#!/bin/bash

# Server setup script - Run this ON THE SERVER
# Usage: bash setup-server.sh

set -e

PROJECT_PATH="/var/www/html/Event"
FRONTEND_DOMAIN="event.wibook.co.tz"

echo "=== Event Invitation System - Server Setup ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Step 1: Install system dependencies
echo "Step 1: Installing system dependencies..."
apt-get update
apt-get install -y nodejs npm nginx mysql-client curl

# Install Node.js 18+ if needed
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 18 ]; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PM2
echo "Installing PM2..."
npm install -g pm2

# Step 2: Set up backend
echo ""
echo "Step 2: Setting up backend..."
cd $PROJECT_PATH/backend

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating backend .env file..."
    cat > .env << 'ENVFILE'
PORT=5001
NODE_ENV=production
JWT_SECRET=CHANGE-THIS-TO-A-SECURE-RANDOM-STRING
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=invite_db
FRONTEND_URL=https://event.wibook.co.tz
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME=Event Invitation
MAIL_FAMILY_NAME=Tesha family
ENVFILE
    echo "⚠️  Please edit backend/.env and update with your credentials!"
fi

# Install backend dependencies
echo "Installing backend dependencies..."
npm install --production

# Step 3: Set up frontend
echo ""
echo "Step 3: Setting up frontend..."
cd $PROJECT_PATH/frontend

# Create .env for frontend
if [ ! -f .env ]; then
    echo "Creating frontend .env file..."
    cat > .env << 'ENVFILE'
VITE_API_URL=https://event.wibook.co.tz/api
ENVFILE
fi

# Install and build frontend
echo "Installing frontend dependencies..."
npm install
echo "Building frontend..."
npm run build

# Step 4: Configure Nginx
echo ""
echo "Step 4: Configuring Nginx..."
cat > /etc/nginx/sites-available/$FRONTEND_DOMAIN << NGINXCONF
server {
    listen 80;
    server_name $FRONTEND_DOMAIN;
    
    # Frontend
    root $PROJECT_PATH/frontend/dist;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINXCONF

# Enable site
ln -sf /etc/nginx/sites-available/$FRONTEND_DOMAIN /etc/nginx/sites-enabled/

# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
echo "Testing Nginx configuration..."
nginx -t
systemctl reload nginx

# Step 5: Set up PM2
echo ""
echo "Step 5: Setting up PM2..."
cd $PROJECT_PATH

# Start backend with PM2
pm2 delete event-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Step 6: Database setup reminder
echo ""
echo "=== Setup Complete ==="
echo ""
echo "✅ Backend dependencies installed"
echo "✅ Frontend built"
echo "✅ Nginx configured"
echo "✅ PM2 configured"
echo ""
echo "⚠️  IMPORTANT: Next steps:"
echo ""
echo "1. Configure database:"
echo "   mysql -u root -p"
echo "   CREATE DATABASE invite_db;"
echo "   EXIT;"
echo ""
echo "2. Update backend/.env with:"
echo "   - Database password"
echo "   - JWT_SECRET (use a strong random string)"
echo "   - Email credentials"
echo ""
echo "3. Set up database:"
echo "   cd $PROJECT_PATH/backend"
echo "   npm run setup-db"
echo "   npm run seed"
echo ""
echo "4. Restart backend:"
echo "   pm2 restart event-backend"
echo ""
echo "5. Set up SSL (optional but recommended):"
echo "   apt-get install certbot python3-certbot-nginx"
echo "   certbot --nginx -d $FRONTEND_DOMAIN"
echo ""
echo "6. Update frontend .env if using SSL:"
echo "   VITE_API_URL=https://event.wibook.co.tz/api"
echo "   Then rebuild: cd frontend && npm run build"
echo ""
echo "Check status:"
echo "  pm2 status"
echo "  pm2 logs event-backend"
echo "  systemctl status nginx"

