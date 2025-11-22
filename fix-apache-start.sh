#!/bin/bash

# Fix Apache startup issues

set -e

echo "=== Fixing Apache Startup Issues ==="
echo ""

# Check Apache error log
echo "1. Checking Apache error log for the actual error..."
echo ""
if [ -f "/var/log/apache2/error.log" ]; then
    echo "Last 30 lines of error log:"
    sudo tail -30 /var/log/apache2/error.log
    echo ""
else
    echo "⚠️  Error log not found"
fi

# Check for common issues
echo "2. Checking for common configuration issues..."
echo ""

# Check if there are syntax errors
echo "Testing Apache configuration syntax..."
if sudo apache2ctl configtest 2>&1; then
    echo "✅ Configuration syntax is OK"
else
    echo "❌ Configuration has syntax errors (see above)"
    echo ""
    echo "Common fixes:"
    echo "  - Check for missing </VirtualHost> tags"
    echo "  - Check for duplicate ServerName directives"
    echo "  - Check for invalid ProxyPass syntax"
fi

# Check for missing DocumentRoot directories
echo ""
echo "3. Checking DocumentRoot directories..."
MISSING_DIRS=0
for config in /etc/apache2/sites-enabled/*.conf; do
    if [ -f "$config" ]; then
        DOCROOT=$(grep -i "DocumentRoot" "$config" | head -1 | awk '{print $2}' | tr -d '"')
        if [ ! -z "$DOCROOT" ] && [ ! -d "$DOCROOT" ]; then
            echo "⚠️  Missing DocumentRoot: $DOCROOT (in $config)"
            MISSING_DIRS=$((MISSING_DIRS + 1))
        fi
    fi
done

if [ $MISSING_DIRS -gt 0 ]; then
    echo ""
    echo "⚠️  Found $MISSING_DIRS missing DocumentRoot directories"
    echo "   These are warnings and shouldn't prevent Apache from starting"
fi

# Check for port conflicts
echo ""
echo "4. Checking for port conflicts..."
if sudo netstat -tlnp 2>/dev/null | grep -E ":80 |:443 " || sudo ss -tlnp 2>/dev/null | grep -E ":80 |:443 "; then
    echo "⚠️  Ports 80 or 443 are already in use:"
    sudo netstat -tlnp 2>/dev/null | grep -E ":80 |:443 " || sudo ss -tlnp 2>/dev/null | grep -E ":80 |:443 "
else
    echo "✅ Ports 80 and 443 are available"
fi

# Try to identify the specific error
echo ""
echo "5. Attempting to start Apache with detailed output..."
sudo apache2ctl -S 2>&1 | head -20 || true

echo ""
echo "=== Next Steps ==="
echo "If Apache still won't start, check:"
echo "  1. Full error log: sudo tail -50 /var/log/apache2/error.log"
echo "  2. System journal: sudo journalctl -u apache2 -n 50 --no-pager"
echo "  3. Configuration test: sudo apache2ctl configtest"

