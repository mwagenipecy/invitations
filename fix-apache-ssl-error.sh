#!/bin/bash

# Fix Apache SSL configuration error

set -e

DOMAIN="event.wibook.co.tz"
APACHE_SITE_CONFIG="/etc/apache2/sites-available/${DOMAIN}.conf"
SSL_ERROR_LOG="/var/log/apache2/${DOMAIN}_ssl_error.log"

echo "=== Fixing Apache SSL Configuration Error ==="
echo ""

# Check SSL error log
echo "1. Checking SSL error log..."
if [ -f "$SSL_ERROR_LOG" ]; then
    echo "SSL Error Log:"
    sudo tail -20 "$SSL_ERROR_LOG"
    echo ""
else
    echo "⚠️  SSL error log not found: $SSL_ERROR_LOG"
fi

# Check if SSL certificate files exist
echo "2. Checking SSL certificate files..."
SSL_CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"

if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    echo "✅ SSL certificates found"
    USE_SSL=true
else
    echo "⚠️  SSL certificates not found"
    echo "   Certificate: $SSL_CERT"
    echo "   Key: $SSL_KEY"
    USE_SSL=false
fi

# Check Apache configuration for SSL issues
echo ""
echo "3. Checking Apache configuration for SSL issues..."
if [ -f "$APACHE_SITE_CONFIG" ]; then
    # Check if there's a VirtualHost *:443 block with invalid SSL config
    if grep -q "<VirtualHost.*:443" "$APACHE_SITE_CONFIG"; then
        echo "⚠️  Found VirtualHost *:443 block"
        
        # Check if SSLEngine is on but certificates are missing
        if grep -A 20 "<VirtualHost.*:443" "$APACHE_SITE_CONFIG" | grep -q "SSLEngine on"; then
            if [ "$USE_SSL" = false ]; then
                echo "❌ Problem found: SSLEngine is on but SSL certificates don't exist"
                echo ""
                echo "Fixing by disabling SSL in the HTTPS VirtualHost..."
                
                # Backup
                sudo cp "$APACHE_SITE_CONFIG" "${APACHE_SITE_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
                
                # Comment out SSLEngine and SSL certificate lines in the 443 VirtualHost
                sudo sed -i '/<VirtualHost.*:443/,/<\/VirtualHost>/ {
                    s/^[[:space:]]*SSLEngine on/# SSLEngine on/
                    s/^[[:space:]]*SSLCertificateFile/# SSLCertificateFile/
                    s/^[[:space:]]*SSLCertificateKeyFile/# SSLCertificateKeyFile/
                }' "$APACHE_SITE_CONFIG"
                
                echo "✅ Commented out SSL configuration in HTTPS VirtualHost"
            fi
        fi
    fi
fi

# Alternative: Disable SSL module temporarily if certificates don't exist
if [ "$USE_SSL" = false ]; then
    echo ""
    echo "4. SSL certificates not found. Options:"
    echo "   a) Disable SSL module temporarily (recommended)"
    echo "   b) Remove/comment out VirtualHost *:443 block"
    echo ""
    echo "Disabling SSL module..."
    sudo a2dismod ssl 2>/dev/null || echo "   SSL module already disabled or not enabled"
    echo "✅ SSL module disabled"
fi

# Test configuration
echo ""
echo "5. Testing Apache configuration..."
if sudo apache2ctl configtest 2>&1; then
    echo "✅ Apache configuration is now valid"
    
    echo ""
    echo "Starting Apache..."
    if sudo systemctl start apache2; then
        echo "✅ Apache started successfully"
        
        # Check if it's running
        sleep 2
        if systemctl is-active --quiet apache2; then
            echo "✅ Apache is running"
            
            # Test local connection
            echo ""
            echo "6. Testing local API connection..."
            if curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null | grep -q "200\|404"; then
                echo "✅ Apache is responding on localhost"
            else
                echo "⚠️  Apache is running but not responding to /api/health"
            fi
        else
            echo "❌ Apache failed to start"
            echo "   Check: sudo systemctl status apache2"
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
echo "=== Summary ==="
if [ "$USE_SSL" = false ]; then
    echo "⚠️  SSL is disabled because certificates don't exist"
    echo "   To enable HTTPS later, install SSL certificate:"
    echo "   sudo certbot --apache -d $DOMAIN -d www.$DOMAIN"
fi
echo ""
echo "Test the API endpoint:"
echo "  curl -X POST http://$DOMAIN/api/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"admin@example.com\",\"password\":\"password\"}'"

