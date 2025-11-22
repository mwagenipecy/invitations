#!/bin/bash

# Fix Apache SSL configuration for all sites
# Re-enables mod_ssl but comments out SSL directives for sites without valid certificates

set -e

DOMAIN="event.wibook.co.tz"
APACHE_SITE_CONFIG="/etc/apache2/sites-available/${DOMAIN}.conf"

echo "=== Fixing Apache SSL Configuration for All Sites ==="
echo ""

# Re-enable SSL module (other sites need it)
echo "1. Re-enabling SSL module..."
sudo a2enmod ssl 2>/dev/null && echo "✅ SSL module enabled" || echo "⚠️  SSL module already enabled"

# Enable required modules
echo ""
echo "2. Enabling required Apache modules..."
sudo a2enmod proxy 2>/dev/null || true
sudo a2enmod proxy_http 2>/dev/null || true
sudo a2enmod headers 2>/dev/null || true
sudo a2enmod rewrite 2>/dev/null || true

# Fix event.wibook.co.tz - comment out SSL VirtualHost if it exists
if [ -f "$APACHE_SITE_CONFIG" ]; then
    echo ""
    echo "3. Fixing $DOMAIN configuration..."
    
    # Backup
    sudo cp "$APACHE_SITE_CONFIG" "${APACHE_SITE_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Comment out VirtualHost *:443 block if it exists
    if grep -q "<VirtualHost.*:443" "$APACHE_SITE_CONFIG"; then
        echo "⚠️  Found VirtualHost *:443 block - commenting it out..."
        
        # Comment out the entire VirtualHost *:443 block
        sudo sed -i '/<VirtualHost.*:443/,/<\/VirtualHost>/ {
            s/^/#/
        }' "$APACHE_SITE_CONFIG"
        
        echo "✅ Commented out VirtualHost *:443 block for $DOMAIN"
    fi
    
    # Ensure VirtualHost *:80 has ProxyPass
    if ! grep -A 20 "<VirtualHost.*:80" "$APACHE_SITE_CONFIG" | grep -q "ProxyPass /api"; then
        echo ""
        echo "4. Adding ProxyPass to VirtualHost *:80 for $DOMAIN..."
        
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

# Check other sites for SSL issues
echo ""
echo "5. Checking other enabled sites for SSL configuration issues..."

# Get list of enabled sites
ENABLED_SITES=$(ls /etc/apache2/sites-enabled/*.conf 2>/dev/null | xargs -n1 basename)

for SITE_FILE in $ENABLED_SITES; do
    SITE_PATH="/etc/apache2/sites-enabled/$SITE_FILE"
    
    # Skip event.wibook.co.tz (already fixed)
    if [[ "$SITE_FILE" == *"event.wibook.co.tz"* ]]; then
        continue
    fi
    
    # Check if site has SSLEngine but might have certificate issues
    if grep -q "SSLEngine on" "$SITE_PATH" 2>/dev/null; then
        # Check if SSL certificates are referenced
        if grep -q "SSLCertificateFile" "$SITE_PATH" 2>/dev/null; then
            CERT_FILE=$(grep "SSLCertificateFile" "$SITE_PATH" | head -1 | awk '{print $2}' | tr -d '"')
            if [ -n "$CERT_FILE" ] && [ ! -f "$CERT_FILE" ]; then
                echo "⚠️  $SITE_FILE has SSLEngine but certificate file missing: $CERT_FILE"
                echo "   Commenting out SSL directives in this site..."
                
                # Backup
                sudo cp "$SITE_PATH" "${SITE_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
                
                # Comment out SSL directives
                sudo sed -i 's/^[[:space:]]*SSLEngine on/# SSLEngine on/g' "$SITE_PATH"
                sudo sed -i 's/^[[:space:]]*SSLCertificateFile/# SSLCertificateFile/g' "$SITE_PATH"
                sudo sed -i 's/^[[:space:]]*SSLCertificateKeyFile/# SSLCertificateKeyFile/g' "$SITE_PATH"
                sudo sed -i 's/^[[:space:]]*SSLProtocol/# SSLProtocol/g' "$SITE_PATH"
                sudo sed -i 's/^[[:space:]]*SSLCipherSuite/# SSLCipherSuite/g' "$SITE_PATH"
                
                echo "   ✅ Commented out SSL directives in $SITE_FILE"
            fi
        fi
    fi
done

# Test configuration
echo ""
echo "6. Testing Apache configuration..."
if sudo apache2ctl configtest 2>&1; then
    echo "✅ Apache configuration is valid"
    
    echo ""
    echo "7. Starting Apache..."
    if sudo systemctl start apache2; then
        sleep 2
        if systemctl is-active --quiet apache2; then
            echo "✅ Apache started successfully"
            
            # Test local connection
            echo ""
            echo "8. Testing local API connection..."
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
    echo ""
    echo "Checking for remaining SSL issues..."
    sudo apache2ctl configtest 2>&1 | grep -i ssl || true
    echo ""
    echo "   Run: sudo apache2ctl configtest"
    exit 1
fi

echo ""
echo "=== Fix Complete ==="
echo "✅ Apache is now running"
echo "✅ mod_ssl is enabled (for sites that need it)"
echo "✅ SSL directives commented out for sites without valid certificates"
echo "✅ $DOMAIN is configured for HTTP with API proxy"
echo ""
echo "Test the API endpoint:"
echo "  curl -X POST http://$DOMAIN/api/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"email\":\"admin@example.com\",\"password\":\"password\"}'"

