#!/bin/bash

# Direct fix for Apache SSL error - disable SSL or remove problematic VirtualHost

set -e

DOMAIN="event.wibook.co.tz"
APACHE_SITE_CONFIG="/etc/apache2/sites-available/${DOMAIN}.conf"
SSL_ERROR_LOG="/var/log/apache2/${DOMAIN}_ssl_error.log"

echo "=== Direct Fix for Apache SSL Error ==="
echo ""

# Check SSL error log
if [ -f "$SSL_ERROR_LOG" ]; then
    echo "SSL Error Log:"
    sudo tail -10 "$SSL_ERROR_LOG"
    echo ""
fi

# Disable SSL module
echo "1. Disabling SSL module..."
sudo a2dismod ssl 2>/dev/null && echo "✅ SSL module disabled" || echo "⚠️  SSL module already disabled or not enabled"

# Check and fix the Apache config
if [ -f "$APACHE_SITE_CONFIG" ]; then
    echo ""
    echo "2. Checking Apache configuration..."
    
    # Backup
    sudo cp "$APACHE_SITE_CONFIG" "${APACHE_SITE_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Check if there's a VirtualHost *:443 block
    if grep -q "<VirtualHost.*:443" "$APACHE_SITE_CONFIG"; then
        echo "⚠️  Found VirtualHost *:443 block - commenting it out..."
        
        # Comment out the entire VirtualHost *:443 block
        sudo sed -i '/<VirtualHost.*:443/,/<\/VirtualHost>/ {
            s/^/#/
        }' "$APACHE_SITE_CONFIG"
        
        echo "✅ Commented out VirtualHost *:443 block"
    fi
    
    # Ensure VirtualHost *:80 has ProxyPass
    if ! grep -A 20 "<VirtualHost.*:80" "$APACHE_SITE_CONFIG" | grep -q "ProxyPass /api"; then
        echo ""
        echo "3. Adding ProxyPass to VirtualHost *:80..."
        
        # Add ProxyPass before </VirtualHost> in the 80 block
        sudo sed -i '/<VirtualHost.*:80/,/<\/VirtualHost>/ {
            /<\/VirtualHost>/i\
    # Proxy API requests to backend\
    ProxyPreserveHost On\
    ProxyPass /api http://localhost:5001/api\
    ProxyPassReverse /api http://localhost:5001/api
        }' "$APACHE_SITE_CONFIG"
        
        echo "✅ Added ProxyPass to VirtualHost *:80"
    else
        echo "✅ ProxyPass already configured in VirtualHost *:80"
    fi
fi

# Enable required modules (except SSL)
echo ""
echo "4. Enabling required Apache modules..."
sudo a2enmod proxy 2>/dev/null || true
sudo a2enmod proxy_http 2>/dev/null || true
sudo a2enmod headers 2>/dev/null || true
sudo a2enmod rewrite 2>/dev/null || true

# Test configuration
echo ""
echo "5. Testing Apache configuration..."
if sudo apache2ctl configtest 2>&1; then
    echo "✅ Apache configuration is valid"
    
    echo ""
    echo "6. Starting Apache..."
    if sudo systemctl start apache2; then
        sleep 2
        if systemctl is-active --quiet apache2; then
            echo "✅ Apache started successfully"
            
            # Test local connection
            echo ""
            echo "7. Testing local API connection..."
            sleep 1
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null || echo "000")
            if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
                echo "✅ Apache is responding (HTTP code: $HTTP_CODE)"
            else
                echo "⚠️  Apache is running but returned HTTP code: $HTTP_CODE"
            fi
        else
            echo "❌ Apache failed to start"
            echo "   Check: sudo systemctl status apache2"
            exit 1
        fi
    else
        echo "❌ Failed to start Apache"
        echo "   Check: sudo journalctl -u apache2 -n 50 --no-pager"
        exit 1
    fi
else
    echo "❌ Apache configuration still has errors"
    echo "   Run: sudo apache2ctl configtest"
    exit 1
fi

echo ""
echo "=== Fix Complete ==="
echo "✅ Apache is now running on HTTP (port 80)"
echo ""
echo "Test the API endpoint:"
echo "  curl -X POST http://$DOMAIN/api/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"admin@example.com\",\"password\":\"password\"}'"

