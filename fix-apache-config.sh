#!/bin/bash

# Fix Apache Configuration for event.wibook.co.tz
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"
FRONTEND_DOMAIN="event.wibook.co.tz"

echo "=== Fixing Apache Configuration ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Enable required modules
echo "Enabling Apache modules..."
a2enmod rewrite
a2enmod proxy
a2enmod proxy_http
a2enmod headers
a2enmod ssl

# Remove any existing config for this domain
echo "Removing existing configs..."
rm -f /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf
rm -f /etc/apache2/sites-enabled/$FRONTEND_DOMAIN.conf
rm -f /etc/apache2/sites-enabled/*$FRONTEND_DOMAIN*

# Create new virtual host with priority
echo "Creating new virtual host..."
cat > /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf << APACHEEOF
<VirtualHost *:80>
    ServerName $FRONTEND_DOMAIN
    ServerAlias www.$FRONTEND_DOMAIN
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

# Enable the site
echo "Enabling site..."
a2ensite $FRONTEND_DOMAIN.conf

# Disable default site if it exists
a2dissite 000-default.conf 2>/dev/null || true

# List all enabled sites
echo ""
echo "Currently enabled sites:"
ls -la /etc/apache2/sites-enabled/

# Test configuration
echo ""
echo "Testing Apache configuration..."
if apache2ctl configtest; then
    echo "✅ Configuration is valid"
else
    echo "❌ Configuration has errors"
    exit 1
fi

# Reload Apache
echo ""
echo "Reloading Apache..."
systemctl reload apache2

echo ""
echo "=== Apache Configuration Fixed ==="
echo ""
echo "Virtual host: /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf"
echo "DocumentRoot: $PROJECT_PATH/frontend/dist"
echo ""
echo "Check if frontend dist exists:"
ls -la $PROJECT_PATH/frontend/dist/ | head -10
echo ""
echo "Test:"
echo "  curl -H 'Host: $FRONTEND_DOMAIN' http://localhost"
echo "  or visit: http://$FRONTEND_DOMAIN"

