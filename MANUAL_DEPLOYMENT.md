# Manual Deployment Instructions

Since automated deployment requires SSH access, follow these manual steps:

## Step 1: Prepare Files Locally

```bash
cd /Users/mac/Desktop/PercyFolder/Invitation

# Create deployment package
tar -czf deployment.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='frontend/dist' \
    --exclude='frontend/node_modules' \
    --exclude='backend/node_modules' \
    --exclude='mobile' \
    --exclude='*.log' \
    --exclude='.env' \
    backend/ frontend/ ecosystem.config.js setup-server.sh
```

## Step 2: Upload to Server

Upload `deployment.tar.gz` and `setup-server.sh` to the server using:
- FTP/SFTP client (FileZilla, WinSCP, etc.)
- Web hosting file manager
- Or any file transfer method

Upload to: `/var/www/html/Event/`

## Step 3: SSH to Server

```bash
ssh root@wibook.co.tz
# Password: Mwageni@1
```

## Step 4: Extract and Setup

```bash
cd /var/www/html/Event
tar -xzf deployment.tar.gz
chmod +x setup-server.sh
bash setup-server.sh
```

## Step 5: Configure Database

```bash
mysql -u root -p
# Enter MySQL password when prompted

CREATE DATABASE invite_db;
EXIT;
```

## Step 6: Update Backend .env

```bash
cd /var/www/html/Event/backend
nano .env
```

Update these values:
```env
PORT=5001
NODE_ENV=production
JWT_SECRET=CHANGE-THIS-TO-A-SECURE-RANDOM-STRING-MIN-32-CHARACTERS
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=invite_db
FRONTEND_URL=https://event.wibook.co.tz
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME=Event Invitation
MAIL_FAMILY_NAME=Tesha family
```

## Step 7: Set Up Database

```bash
cd /var/www/html/Event/backend
npm run setup-db
npm run seed
```

## Step 8: Install SSL Certificate

```bash
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Install certificate
certbot --nginx -d event.wibook.co.tz

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)
```

## Step 9: Update Frontend for HTTPS

```bash
cd /var/www/html/Event/frontend
nano .env
```

Update to:
```env
VITE_API_URL=https://event.wibook.co.tz/api
```

Rebuild:
```bash
npm run build
```

## Step 10: Restart Services

```bash
# Restart backend
pm2 restart event-backend

# Reload Nginx
systemctl reload nginx
```

## Step 11: Test

1. **Backend Health Check:**
   ```bash
   curl https://event.wibook.co.tz/api/health
   ```

2. **Frontend:**
   - Visit: https://event.wibook.co.tz

3. **Check PM2:**
   ```bash
   pm2 status
   pm2 logs event-backend
   ```

4. **Check Nginx:**
   ```bash
   systemctl status nginx
   nginx -t
   ```

## Step 12: Update Mobile App

The mobile app has been updated to use: `https://event.wibook.co.tz/`

Rebuild and install the APK:
```bash
cd /Users/mac/Desktop/PercyFolder/Invitation/mobile/android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### Backend not starting
```bash
cd /var/www/html/Event/backend
pm2 logs event-backend
# Check for errors in .env file
```

### Frontend not loading
```bash
# Check if build exists
ls -la /var/www/html/Event/frontend/dist

# Check Nginx error logs
tail -f /var/log/nginx/error.log
```

### SSL certificate issues
```bash
# Check certificate
certbot certificates

# Renew if needed
certbot renew
```

### Database connection errors
```bash
# Test MySQL connection
mysql -u root -p

# Check if database exists
SHOW DATABASES;
```

## Security Checklist

- [ ] Changed JWT_SECRET to strong random string
- [ ] Updated database password
- [ ] Configured email credentials
- [ ] SSL certificate installed
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] PM2 auto-start configured
- [ ] Nginx configured correctly

