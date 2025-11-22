#!/bin/bash

# Fix HTTPS Configuration and Add SSL Support
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"
FRONTEND_DOMAIN="event.wibook.co.tz"

echo "=== Fixing HTTPS Configuration ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Enable required modules
echo "1. Enabling Apache modules..."
a2enmod rewrite > /dev/null 2>&1
a2enmod proxy > /dev/null 2>&1
a2enmod proxy_http > /dev/null 2>&1
a2enmod headers > /dev/null 2>&1
a2enmod ssl > /dev/null 2>&1

# Check if SSL certificate exists
echo ""
echo "2. Checking SSL certificate..."
if [ -f "/etc/letsencrypt/live/$FRONTEND_DOMAIN/fullchain.pem" ]; then
    echo "✅ SSL certificate found"
    SSL_CERT="/etc/letsencrypt/live/$FRONTEND_DOMAIN/fullchain.pem"
    SSL_KEY="/etc/letsencrypt/live/$FRONTEND_DOMAIN/privkey.pem"
    HAS_SSL=true
else
    echo "⚠️  SSL certificate not found. Will configure HTTP only with redirect."
    HAS_SSL=false
fi

# Update Apache virtual host
echo ""
echo "3. Updating Apache virtual host configuration..."

# Create HTTP virtual host (port 80) with redirect to HTTPS if SSL exists
cat > /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf << APACHEEOF
<VirtualHost *:80>
    ServerName $FRONTEND_DOMAIN
    ServerAlias www.$FRONTEND_DOMAIN
    
    # Redirect to HTTPS if SSL is available
    $([ "$HAS_SSL" = true ] && echo "RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]")
    
    # If no SSL, serve normally
    $([ "$HAS_SSL" != true ] && echo "DocumentRoot $PROJECT_PATH/frontend/dist
    
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
    Header always set X-Frame-Options \"SAMEORIGIN\"
    Header always set X-Content-Type-Options \"nosniff\"
    Header always set X-XSS-Protection \"1; mode=block\"
    
    ErrorLog \${APACHE_LOG_DIR}/$FRONTEND_DOMAIN-error.log
    CustomLog \${APACHE_LOG_DIR}/$FRONTEND_DOMAIN-access.log combined")
</VirtualHost>
APACHEEOF

# Add HTTPS virtual host if SSL exists
if [ "$HAS_SSL" = true ]; then
    echo "4. Adding HTTPS virtual host..."
    cat >> /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf << APACHEHTTPS

<VirtualHost *:443>
    ServerName $FRONTEND_DOMAIN
    ServerAlias www.$FRONTEND_DOMAIN
    DocumentRoot $PROJECT_PATH/frontend/dist
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile $SSL_CERT
    SSLCertificateKeyFile $SSL_KEY
    SSLProtocol all -SSLv2 -SSLv3
    SSLCipherSuite HIGH:!aNULL:!MD5
    
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
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    
    ErrorLog \${APACHE_LOG_DIR}/$FRONTEND_DOMAIN-ssl-error.log
    CustomLog \${APACHE_LOG_DIR}/$FRONTEND_DOMAIN-ssl-access.log combined
</VirtualHost>
APACHEHTTPS
fi

# Enable site
echo ""
echo "5. Enabling site..."
a2ensite $FRONTEND_DOMAIN.conf > /dev/null 2>&1

# Disable default site
a2dissite 000-default.conf > /dev/null 2>&1

# Test and reload Apache
echo ""
echo "6. Testing Apache configuration..."
if apache2ctl configtest; then
    echo "✅ Apache configuration is valid"
    systemctl reload apache2
    echo "✅ Apache reloaded"
else
    echo "❌ Apache configuration has errors"
    apache2ctl configtest
    exit 1
fi

echo ""
echo "=== HTTPS Configuration Complete ==="
echo ""
if [ "$HAS_SSL" = true ]; then
    echo "✅ HTTPS configured with SSL certificate"
    echo "✅ HTTP redirects to HTTPS"
else
    echo "⚠️  SSL certificate not found"
    echo "   To install SSL certificate, run:"
    echo "   sudo certbot --apache -d $FRONTEND_DOMAIN -d www.$FRONTEND_DOMAIN"
fi
echo ""
echo "Test:"
echo "  HTTP:  http://$FRONTEND_DOMAIN"
echo "  HTTPS: https://$FRONTEND_DOMAIN"
echo "  API:   https://$FRONTEND_DOMAIN/api/health"

