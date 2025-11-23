#!/bin/bash

# Complete HTTPS Setup Script
# Installs SSL certificates and configures frontend/backend for HTTPS

set -e

DOMAIN="event.wibook.co.tz"
PROJECT_PATH="/var/www/html/Event/invitations"
FRONTEND_DIR="$PROJECT_PATH/frontend"
BACKEND_DIR="$PROJECT_PATH/backend"
APACHE_SITE_CONFIG="/etc/apache2/sites-available/${DOMAIN}.conf"

echo "=== Complete HTTPS Setup ==="
echo "Domain: $DOMAIN"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Step 1: Install Certbot if not already installed
echo "1. Checking Certbot installation..."
if ! command -v certbot &> /dev/null; then
    echo "   Installing Certbot..."
    apt-get update -qq
    apt-get install -y certbot python3-certbot-apache
    echo "✅ Certbot installed"
else
    echo "✅ Certbot already installed"
fi

# Step 2: Ensure Apache is running and configured for HTTP first
echo ""
echo "2. Ensuring Apache is running..."
systemctl start apache2 || true

# Step 3: Obtain SSL certificate
echo ""
echo "3. Obtaining SSL certificate from Let's Encrypt..."
echo "   This will use Certbot to get a free SSL certificate"
echo ""

# Check if certificate already exists
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "✅ SSL certificate already exists"
    SSL_CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    SSL_KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"
else
    echo "   Obtaining new certificate..."
    echo "   Note: This requires the domain to point to this server"
    echo "   Note: Port 80 must be accessible from the internet"
    echo ""
    
    # Use certbot with Apache plugin
    certbot --apache -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email admin@${DOMAIN} --redirect || {
        echo "⚠️  Certbot failed. This might be because:"
        echo "   - Domain doesn't point to this server"
        echo "   - Port 80 is not accessible"
        echo "   - DNS propagation is incomplete"
        echo ""
        echo "   You can try manually:"
        echo "   certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN"
        exit 1
    }
    
    SSL_CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    SSL_KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"
    
    if [ ! -f "$SSL_CERT" ] || [ ! -f "$SSL_KEY" ]; then
        echo "❌ SSL certificate files not found after certbot"
        exit 1
    fi
    
    echo "✅ SSL certificate obtained successfully"
fi

# Step 4: Configure Apache for HTTPS
echo ""
echo "4. Configuring Apache for HTTPS..."

# Enable required modules
a2enmod ssl > /dev/null 2>&1
a2enmod proxy > /dev/null 2>&1
a2enmod proxy_http > /dev/null 2>&1
a2enmod headers > /dev/null 2>&1
a2enmod rewrite > /dev/null 2>&1

# Backup existing config
if [ -f "$APACHE_SITE_CONFIG" ]; then
    cp "$APACHE_SITE_CONFIG" "${APACHE_SITE_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Create/update Apache configuration with HTTPS
cat > "$APACHE_SITE_CONFIG" <<EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    
    DocumentRoot $FRONTEND_DIR/dist
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile $SSL_CERT
    SSLCertificateKeyFile $SSL_KEY
    SSLProtocol all -SSLv2 -SSLv3
    SSLCipherSuite HIGH:!aNULL:!MD5
    
    # Proxy API requests to backend
    ProxyPreserveHost On
    ProxyPass /api http://localhost:5001/api
    ProxyPassReverse /api http://localhost:5001/api
    
    # Serve frontend files
    <Directory $FRONTEND_DIR/dist>
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
    
    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    
    ErrorLog \${APACHE_LOG_DIR}/${DOMAIN}_ssl_error.log
    CustomLog \${APACHE_LOG_DIR}/${DOMAIN}_ssl_access.log combined
</VirtualHost>
EOF

echo "✅ Apache configuration updated"

# Enable site
a2ensite "${DOMAIN}.conf" > /dev/null 2>&1

# Test Apache configuration
echo ""
echo "5. Testing Apache configuration..."
if apache2ctl configtest; then
    echo "✅ Apache configuration is valid"
    systemctl reload apache2
    echo "✅ Apache reloaded"
else
    echo "❌ Apache configuration has errors"
    apache2ctl configtest
    exit 1
fi

# Step 5: Update frontend .env to use HTTPS
echo ""
echo "6. Updating frontend configuration for HTTPS..."

cd "$FRONTEND_DIR"

# Create or update .env file
cat > .env <<EOF
VITE_API_URL=https://${DOMAIN}/api
EOF

echo "✅ Frontend .env updated: VITE_API_URL=https://${DOMAIN}/api"

# Step 6: Rebuild frontend
echo ""
echo "7. Rebuilding frontend with HTTPS configuration..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend rebuilt successfully"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Step 7: Update backend CORS to allow HTTPS
echo ""
echo "8. Updating backend CORS configuration..."

cd "$BACKEND_DIR"

# Check if CORS needs updating
if grep -q "http://event.wibook.co.tz" index.js 2>/dev/null || grep -q "localhost:517" index.js 2>/dev/null; then
    # Backup
    cp index.js "index.js.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Update CORS to allow HTTPS domain
    sed -i "s|origin:.*|origin: ['https://${DOMAIN}', 'https://www.${DOMAIN}'],|g" index.js 2>/dev/null || true
    
    # Restart backend
    pm2 restart event-backend || pm2 start ecosystem.config.js --name event-backend || true
    echo "✅ Backend CORS updated and restarted"
else
    echo "✅ Backend CORS already configured"
fi

# Step 8: Test HTTPS connection
echo ""
echo "9. Testing HTTPS connection..."
sleep 2

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/health" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ HTTPS API is working (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "⚠️  Could not connect to HTTPS (might need a few minutes for DNS/propagation)"
else
    echo "⚠️  HTTPS returned HTTP code: $HTTP_CODE"
fi

echo ""
echo "=== HTTPS Setup Complete ==="
echo ""
echo "✅ SSL certificate installed"
echo "✅ Apache configured for HTTPS"
echo "✅ HTTP redirects to HTTPS"
echo "✅ Frontend configured to use HTTPS API"
echo "✅ Frontend rebuilt"
echo ""
echo "Test URLs:"
echo "  Frontend: https://${DOMAIN}"
echo "  API:      https://${DOMAIN}/api/health"
echo ""
echo "Next steps:"
echo "  1. Update mobile app to use: https://${DOMAIN}/"
echo "  2. Test the frontend at: https://${DOMAIN}"
echo "  3. SSL certificate will auto-renew via Certbot"

