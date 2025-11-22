#!/bin/bash

# Check Apache status and configuration

set -e

echo "=== Checking Apache Status ==="
echo ""

# Check if Apache is running
echo "1. Checking Apache service status..."
if systemctl is-active --quiet apache2; then
    echo "✅ Apache is running"
else
    echo "❌ Apache is NOT running"
    echo "   Starting Apache..."
    sudo systemctl start apache2
    sleep 2
    if systemctl is-active --quiet apache2; then
        echo "✅ Apache started successfully"
    else
        echo "❌ Failed to start Apache"
        echo "   Check logs: sudo journalctl -u apache2 -n 50"
        exit 1
    fi
fi

# Check what ports Apache is listening on
echo ""
echo "2. Checking which ports Apache is listening on..."
sudo netstat -tlnp | grep apache2 || sudo ss -tlnp | grep apache2 || echo "   (netstat/ss not available, checking with lsof...)"
sudo lsof -i -P -n | grep apache2 | grep LISTEN || echo "   No Apache processes found listening"

# Check Apache configuration
echo ""
echo "3. Checking Apache configuration..."
if sudo apache2ctl configtest 2>&1; then
    echo "✅ Apache configuration is valid"
else
    echo "❌ Apache configuration has errors"
    exit 1
fi

# Check if event.wibook.co.tz site is enabled
echo ""
echo "4. Checking if event.wibook.co.tz site is enabled..."
if [ -f "/etc/apache2/sites-enabled/event.wibook.co.tz.conf" ] || [ -L "/etc/apache2/sites-enabled/event.wibook.co.tz.conf" ]; then
    echo "✅ Site is enabled"
else
    echo "⚠️  Site is not enabled"
    echo "   Enabling site..."
    sudo a2ensite event.wibook.co.tz.conf 2>/dev/null || echo "   Site config might not exist"
    sudo systemctl reload apache2
fi

# Check VirtualHost configuration
echo ""
echo "5. Checking VirtualHost configuration..."
if sudo apache2ctl -S 2>&1 | grep -i "event.wibook"; then
    echo "✅ VirtualHost found in Apache configuration"
    sudo apache2ctl -S 2>&1 | grep -A 5 "event.wibook"
else
    echo "❌ VirtualHost not found"
fi

# Test local connection
echo ""
echo "6. Testing local connection to Apache..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null | grep -q "200\|404"; then
    echo "✅ Apache is responding on localhost"
else
    echo "❌ Apache is not responding on localhost"
    echo "   This might indicate Apache is not running or misconfigured"
fi

echo ""
echo "=== Summary ==="
echo "If Apache is running but not accessible, check:"
echo "  1. Firewall: sudo ufw status"
echo "  2. Apache logs: sudo tail -50 /var/log/apache2/error.log"
echo "  3. Apache access logs: sudo tail -20 /var/log/apache2/access.log"

