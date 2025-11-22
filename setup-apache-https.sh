#!/bin/bash

# Setup Apache HTTPS with SSL and ProxyPass configuration

set -e

DOMAIN="event.wibook.co.tz"
APACHE_SITE_CONFIG="/etc/apache2/sites-available/${DOMAIN}.conf"
BACKEND_URL="http://localhost:5001"
FRONTEND_DIR="/var/www/html/Event/invitations/frontend/dist"

echo "=== Setting up Apache HTTPS Configuration ==="
echo "Domain: $DOMAIN"
echo "Backend: $BACKEND_URL"
echo ""

# Enable required modules
echo "Enabling required Apache modules..."
sudo a2enmod proxy 2>/dev/null || true
sudo a2enmod proxy_http 2>/dev/null || true
sudo a2enmod ssl 2>/dev/null || true
sudo a2enmod headers 2>/dev/null || true
sudo a2enmod rewrite 2>/dev/null || true

# Check if SSL certificate exists
SSL_CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"

if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    echo "✅ SSL certificate found"
    USE_SSL=true
else
    echo "⚠️  SSL certificate not found. Will create self-signed certificate for testing."
    USE_SSL=false
fi

# Create or update Apache configuration
echo ""
echo "Creating/updating Apache configuration..."

if [ -f "$APACHE_SITE_CONFIG" ]; then
    # Backup existing config
    sudo cp "$APACHE_SITE_CONFIG" "${APACHE_SITE_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backed up existing configuration"
fi

# Create HTTP VirtualHost (redirects to HTTPS if SSL available, otherwise serves content)
sudo tee "$APACHE_SITE_CONFIG" > /dev/null <<EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    
    DocumentRoot $FRONTEND_DIR
    
    # Proxy API requests to backend
    ProxyPreserveHost On
    ProxyPass /api $BACKEND_URL/api
    ProxyPassReverse /api $BACKEND_URL/api
    
    # Serve frontend files
    <Directory $FRONTEND_DIR>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Fallback to index.html for SPA
    FallbackResource /index.html
    
    ErrorLog \${APACHE_LOG_DIR}/${DOMAIN}_error.log
    CustomLog \${APACHE_LOG_DIR}/${DOMAIN}_access.log combined
EOF

if [ "$USE_SSL" = true ]; then
    # Add HTTPS redirect
    sudo tee -a "$APACHE_SITE_CONFIG" > /dev/null <<EOF
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    
    DocumentRoot $FRONTEND_DIR
    
    # Proxy API requests to backend
    ProxyPreserveHost On
    ProxyPass /api $BACKEND_URL/api
    ProxyPassReverse /api $BACKEND_URL/api
    
    # Serve frontend files
    <Directory $FRONTEND_DIR>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Fallback to index.html for SPA
    FallbackResource /index.html
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile $SSL_CERT
    SSLCertificateKeyFile $SSL_KEY
    
    ErrorLog \${APACHE_LOG_DIR}/${DOMAIN}_ssl_error.log
    CustomLog \${APACHE_LOG_DIR}/${DOMAIN}_ssl_access.log combined
</VirtualHost>
EOF
    echo "✅ Created HTTP and HTTPS VirtualHosts with SSL"
else
    # No SSL, just HTTP
    sudo tee -a "$APACHE_SITE_CONFIG" > /dev/null <<EOF
</VirtualHost>
EOF
    echo "✅ Created HTTP VirtualHost (no SSL)"
    echo ""
    echo "⚠️  To enable HTTPS, install SSL certificate:"
    echo "   sudo certbot --apache -d $DOMAIN -d www.$DOMAIN"
fi

# Enable the site
echo ""
echo "Enabling Apache site..."
sudo a2ensite "${DOMAIN}.conf" 2>/dev/null || true

# Test configuration
echo ""
echo "Testing Apache configuration..."
if sudo apache2ctl configtest; then
    echo "✅ Apache configuration is valid"
    
    echo ""
    echo "Restarting Apache..."
    sudo systemctl restart apache2
    
    echo ""
    echo "=== Configuration Complete ==="
    if [ "$USE_SSL" = true ]; then
        echo "✅ HTTPS is configured and enabled"
        echo ""
        echo "Test the API endpoint:"
        echo "  curl -k -X POST https://$DOMAIN/api/auth/login \\"
        echo "    -H 'Content-Type: application/json' \\"
        echo "    -d '{\"email\":\"admin@example.com\",\"password\":\"password\"}'"
    else
        echo "⚠️  HTTPS is not configured. Using HTTP only."
        echo ""
        echo "Test the API endpoint:"
        echo "  curl -X POST http://$DOMAIN/api/auth/login \\"
        echo "    -H 'Content-Type: application/json' \\"
        echo "    -d '{\"email\":\"admin@example.com\",\"password\":\"password\"}'"
        echo ""
        echo "To enable HTTPS, run:"
        echo "  sudo certbot --apache -d $DOMAIN -d www.$DOMAIN"
    fi
else
    echo "❌ Apache configuration has errors. Please check manually."
    exit 1
fi

