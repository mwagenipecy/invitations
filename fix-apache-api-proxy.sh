#!/bin/bash

# Fix Apache API Proxy Configuration for event.wibook.co.tz
# This script ensures /api/* requests are proxied to the backend

set -e

DOMAIN="event.wibook.co.tz"
APACHE_SITE_CONFIG="/etc/apache2/sites-available/${DOMAIN}.conf"
BACKEND_URL="http://localhost:5001"

echo "=== Fixing Apache API Proxy Configuration ==="
echo "Domain: $DOMAIN"
echo "Backend: $BACKEND_URL"
echo ""

# Check if Apache site config exists
if [ ! -f "$APACHE_SITE_CONFIG" ]; then
    echo "❌ Apache config not found: $APACHE_SITE_CONFIG"
    echo "Creating new configuration..."
    
    # Create basic config
    sudo tee "$APACHE_SITE_CONFIG" > /dev/null <<EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    
    DocumentRoot /var/www/html/Event/invitations/frontend/dist
    
    # Proxy API requests to backend
    ProxyPreserveHost On
    ProxyPass /api $BACKEND_URL/api
    ProxyPassReverse /api $BACKEND_URL/api
    
    # Serve frontend files
    <Directory /var/www/html/Event/invitations/frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Fallback to index.html for SPA
    FallbackResource /index.html
    
    ErrorLog \${APACHE_LOG_DIR}/${DOMAIN}_error.log
    CustomLog \${APACHE_LOG_DIR}/${DOMAIN}_access.log combined
</VirtualHost>
EOF
    echo "✅ Created new Apache config"
else
    echo "✅ Apache config exists: $APACHE_SITE_CONFIG"
    
    # Check if ProxyPass is already configured
    if grep -q "ProxyPass /api" "$APACHE_SITE_CONFIG"; then
        echo "✅ ProxyPass /api already configured"
    else
        echo "⚠️  ProxyPass /api not found. Adding it..."
        
        # Enable required modules
        sudo a2enmod proxy
        sudo a2enmod proxy_http
        sudo a2enmod headers
        sudo a2enmod rewrite
        
        # Backup original config
        sudo cp "$APACHE_SITE_CONFIG" "${APACHE_SITE_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Add ProxyPass configuration
        # Find the VirtualHost block and add ProxyPass before </VirtualHost>
        sudo sed -i '/<\/VirtualHost>/i\
    # Proxy API requests to backend\
    ProxyPreserveHost On\
    ProxyPass /api '"$BACKEND_URL"'/api\
    ProxyPassReverse /api '"$BACKEND_URL"'/api
' "$APACHE_SITE_CONFIG"
        
        echo "✅ Added ProxyPass configuration"
    fi
fi

# Enable required Apache modules
echo ""
echo "Enabling required Apache modules..."
sudo a2enmod proxy 2>/dev/null || true
sudo a2enmod proxy_http 2>/dev/null || true
sudo a2enmod headers 2>/dev/null || true
sudo a2enmod rewrite 2>/dev/null || true

# Enable the site
echo ""
echo "Enabling Apache site..."
sudo a2ensite "${DOMAIN}.conf" 2>/dev/null || true

# Test Apache configuration
echo ""
echo "Testing Apache configuration..."
if sudo apache2ctl configtest; then
    echo "✅ Apache configuration is valid"
    
    # Reload Apache
    echo ""
    echo "Reloading Apache..."
    sudo systemctl reload apache2
    
    echo ""
    echo "=== Configuration Complete ==="
    echo "✅ Apache is now configured to proxy /api/* requests to $BACKEND_URL"
    echo ""
    echo "Test the API endpoint:"
    echo "  curl -X POST https://$DOMAIN/api/auth/login \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"email\":\"admin@example.com\",\"password\":\"password\"}'"
else
    echo "❌ Apache configuration has errors. Please check manually."
    exit 1
fi

