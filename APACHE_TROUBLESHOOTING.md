# Apache Configuration Troubleshooting

## Problem: Domain Redirects to Another App

This happens when Apache is serving the wrong virtual host for your domain.

## Quick Fix

Run this on your server:

```bash
cd /var/www/html/Event/invitations
sudo bash fix-apache-config.sh
```

Or manually:

### 1. Check Current Virtual Hosts

```bash
# List all enabled sites
ls -la /etc/apache2/sites-enabled/

# Check which site is handling the domain
apache2ctl -S
```

### 2. Check Virtual Host Priority

Apache uses the first matching virtual host. Make sure your domain's config is loaded first.

```bash
# Check site priority (alphabetical order matters)
ls -la /etc/apache2/sites-enabled/ | sort
```

### 3. Create/Update Virtual Host

```bash
sudo nano /etc/apache2/sites-available/event.wibook.co.tz.conf
```

Make sure it has:
- `ServerName event.wibook.co.tz`
- Correct `DocumentRoot` pointing to your frontend/dist
- No conflicting ServerName/ServerAlias

### 4. Enable Your Site

```bash
# Enable your site
sudo a2ensite event.wibook.co.tz.conf

# Disable conflicting sites (if any)
sudo a2dissite 000-default.conf
sudo a2dissite other-site.conf  # if there's a conflicting site

# Test configuration
sudo apache2ctl configtest

# Reload Apache
sudo systemctl reload apache2
```

### 5. Verify Configuration

```bash
# Check which virtual host Apache will use
apache2ctl -S | grep event.wibook.co.tz

# Test locally
curl -H "Host: event.wibook.co.tz" http://localhost

# Check if frontend files exist
ls -la /var/www/html/Event/invitations/frontend/dist/
```

## Common Issues

### Issue 1: Default Site Taking Priority

**Solution:**
```bash
sudo a2dissite 000-default.conf
sudo systemctl reload apache2
```

### Issue 2: Another Virtual Host Has Same ServerName

**Solution:**
Check all virtual hosts:
```bash
grep -r "ServerName.*event.wibook.co.tz" /etc/apache2/sites-available/
grep -r "ServerAlias.*event.wibook.co.tz" /etc/apache2/sites-available/
```

Remove or fix conflicting configurations.

### Issue 3: DocumentRoot Points to Wrong Location

**Solution:**
Verify the path in your virtual host:
```bash
grep DocumentRoot /etc/apache2/sites-available/event.wibook.co.tz.conf
```

Should be: `/var/www/html/Event/invitations/frontend/dist`

### Issue 4: Site Not Enabled

**Solution:**
```bash
# Check if enabled
ls -la /etc/apache2/sites-enabled/ | grep event.wibook.co.tz

# If not, enable it
sudo a2ensite event.wibook.co.tz.conf
sudo systemctl reload apache2
```

## Correct Virtual Host Configuration

```apache
<VirtualHost *:80>
    ServerName event.wibook.co.tz
    ServerAlias www.event.wibook.co.tz
    DocumentRoot /var/www/html/Event/invitations/frontend/dist
    
    <Directory /var/www/html/Event/invitations/frontend/dist>
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
    
    ProxyPreserveHost On
    ProxyPass /api http://localhost:5001/api
    ProxyPassReverse /api http://localhost:5001/api
    
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    
    ErrorLog ${APACHE_LOG_DIR}/event.wibook.co.tz-error.log
    CustomLog ${APACHE_LOG_DIR}/event.wibook.co.tz-access.log combined
</VirtualHost>
```

## Verification Steps

1. **Check Apache virtual host selection:**
   ```bash
   apache2ctl -S
   ```

2. **Test with curl:**
   ```bash
   curl -H "Host: event.wibook.co.tz" http://localhost
   ```

3. **Check Apache error logs:**
   ```bash
   tail -f /var/log/apache2/event.wibook.co.tz-error.log
   ```

4. **Check Apache access logs:**
   ```bash
   tail -f /var/log/apache2/event.wibook.co.tz-access.log
   ```

5. **Verify frontend files:**
   ```bash
   ls -la /var/www/html/Event/invitations/frontend/dist/
   cat /var/www/html/Event/invitations/frontend/dist/index.html | head -20
   ```

## After Fixing

1. Reload Apache: `sudo systemctl reload apache2`
2. Test domain: Visit `http://event.wibook.co.tz`
3. Should see your React app, not another app

