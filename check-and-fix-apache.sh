#!/bin/bash

# Check and fix Apache configuration
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"
FRONTEND_DOMAIN="event.wibook.co.tz"

echo "=== Checking Apache Configuration ==="
echo ""

# Check current virtual host
echo "1. Current virtual host configuration:"
if [ -f /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf ]; then
    cat /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf
    echo ""
else
    echo "❌ Virtual host file not found!"
    exit 1
fi

# Check DocumentRoot
echo "2. Checking DocumentRoot..."
CURRENT_DOCROOT=$(grep -i "DocumentRoot" /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf | awk '{print $2}' | head -1)
EXPECTED_DOCROOT="$PROJECT_PATH/frontend/dist"

echo "Current DocumentRoot: $CURRENT_DOCROOT"
echo "Expected DocumentRoot: $EXPECTED_DOCROOT"

if [ "$CURRENT_DOCROOT" != "$EXPECTED_DOCROOT" ]; then
    echo "⚠️  DocumentRoot mismatch! Fixing..."
    
    # Backup current config
    cp /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf.backup
    
    # Recreate with correct path
    cat > /etc/apache2/sites-available/$FRONTEND_DOMAIN.conf << APACHEEOF
<VirtualHost *:80>
    ServerName $FRONTEND_DOMAIN
    ServerAlias www.$FRONTEND_DOMAIN
    DocumentRoot $EXPECTED_DOCROOT
    
    <Directory $EXPECTED_DOCROOT>
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
    echo "✅ Virtual host updated with correct DocumentRoot"
else
    echo "✅ DocumentRoot is correct"
fi

# Check if frontend is built
echo ""
echo "3. Checking if frontend is built..."
if [ -f "$EXPECTED_DOCROOT/index.html" ]; then
    echo "✅ Frontend is built (index.html exists)"
    echo "File size: $(du -h $EXPECTED_DOCROOT/index.html | cut -f1)"
else
    echo "❌ Frontend is NOT built!"
    echo "Building frontend now..."
    cd $PROJECT_PATH/frontend
    npm run build
    echo "✅ Frontend built"
fi

# Test Apache config
echo ""
echo "4. Testing Apache configuration..."
if apache2ctl configtest; then
    echo "✅ Configuration is valid"
else
    echo "❌ Configuration has errors"
    exit 1
fi

# Reload Apache
echo ""
echo "5. Reloading Apache..."
systemctl reload apache2
echo "✅ Apache reloaded"

# Test the domain
echo ""
echo "6. Testing domain..."
echo "Testing: curl -H 'Host: $FRONTEND_DOMAIN' http://localhost"
RESPONSE=$(curl -s -H "Host: $FRONTEND_DOMAIN" http://localhost | head -5)
if echo "$RESPONSE" | grep -q "html\|<!DOCTYPE\|<html"; then
    echo "✅ Domain is serving content!"
    echo "$RESPONSE"
else
    echo "⚠️  Domain response:"
    echo "$RESPONSE"
    echo ""
    echo "Check Apache error logs:"
    echo "  tail -f /var/log/apache2/$FRONTEND_DOMAIN-error.log"
fi

echo ""
echo "=== Check Complete ==="
echo ""
echo "If still not working:"
echo "1. Check Apache error log: tail -f /var/log/apache2/$FRONTEND_DOMAIN-error.log"
echo "2. Verify DNS: nslookup $FRONTEND_DOMAIN"
echo "3. Test directly: curl http://localhost -H 'Host: $FRONTEND_DOMAIN'"

