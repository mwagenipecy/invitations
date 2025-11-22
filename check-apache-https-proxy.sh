#!/bin/bash

# Check and fix Apache HTTPS VirtualHost ProxyPass configuration

set -e

DOMAIN="event.wibook.co.tz"
APACHE_SITE_CONFIG="/etc/apache2/sites-available/${DOMAIN}.conf"
BACKEND_URL="http://localhost:5001"

echo "=== Checking Apache HTTPS ProxyPass Configuration ==="
echo "Domain: $DOMAIN"
echo "Backend: $BACKEND_URL"
echo ""

if [ ! -f "$APACHE_SITE_CONFIG" ]; then
    echo "❌ Apache config not found: $APACHE_SITE_CONFIG"
    exit 1
fi

echo "Checking Apache configuration file..."
echo ""

# Check if ProxyPass exists in HTTPS VirtualHost (port 443)
if grep -A 20 "<VirtualHost.*:443" "$APACHE_SITE_CONFIG" | grep -q "ProxyPass /api"; then
    echo "✅ ProxyPass /api found in HTTPS VirtualHost (port 443)"
else
    echo "❌ ProxyPass /api NOT found in HTTPS VirtualHost (port 443)"
    echo ""
    echo "This is the problem! The ProxyPass is likely only in the HTTP VirtualHost."
    echo ""
    echo "Let's check the current configuration:"
    echo ""
    sudo grep -A 30 "<VirtualHost.*:443" "$APACHE_SITE_CONFIG" | head -40
    echo ""
    echo "Adding ProxyPass to HTTPS VirtualHost..."
    
    # Backup
    sudo cp "$APACHE_SITE_CONFIG" "${APACHE_SITE_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Check if there's a VirtualHost *:443 block
    if grep -q "<VirtualHost.*:443" "$APACHE_SITE_CONFIG"; then
        # Add ProxyPass before </VirtualHost> in the HTTPS block
        sudo sed -i '/<VirtualHost.*:443/,/<\/VirtualHost>/ {
            /<\/VirtualHost>/i\
    # Proxy API requests to backend\
    ProxyPreserveHost On\
    ProxyPass /api '"$BACKEND_URL"'/api\
    ProxyPassReverse /api '"$BACKEND_URL"'/api
        }' "$APACHE_SITE_CONFIG"
        
        echo "✅ Added ProxyPass to HTTPS VirtualHost"
    else
        echo "⚠️  No HTTPS VirtualHost found. Creating one..."
        
        # Append HTTPS VirtualHost configuration
        sudo tee -a "$APACHE_SITE_CONFIG" > /dev/null <<EOF

<VirtualHost *:443>
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
    
    # SSL Configuration (update with your certificate paths)
    SSLEngine on
    # SSLCertificateFile /etc/letsencrypt/live/$DOMAIN/fullchain.pem
    # SSLCertificateKeyFile /etc/letsencrypt/live/$DOMAIN/privkey.pem
    
    ErrorLog \${APACHE_LOG_DIR}/${DOMAIN}_ssl_error.log
    CustomLog \${APACHE_LOG_DIR}/${DOMAIN}_ssl_access.log combined
</VirtualHost>
EOF
        echo "✅ Created HTTPS VirtualHost with ProxyPass"
    fi
fi

# Enable required modules
echo ""
echo "Enabling required Apache modules..."
sudo a2enmod proxy 2>/dev/null || true
sudo a2enmod proxy_http 2>/dev/null || true
sudo a2enmod ssl 2>/dev/null || true
sudo a2enmod headers 2>/dev/null || true
sudo a2enmod rewrite 2>/dev/null || true

# Test configuration
echo ""
echo "Testing Apache configuration..."
if sudo apache2ctl configtest; then
    echo "✅ Apache configuration is valid"
    
    echo ""
    echo "Reloading Apache..."
    sudo systemctl reload apache2
    
    echo ""
    echo "=== Configuration Complete ==="
    echo "✅ HTTPS VirtualHost now has ProxyPass /api configured"
    echo ""
    echo "Test the API endpoint (with SSL bypass):"
    echo "  curl -k -X POST https://$DOMAIN/api/auth/login \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"email\":\"admin@example.com\",\"password\":\"password\"}'"
else
    echo "❌ Apache configuration has errors. Please check manually."
    exit 1
fi

