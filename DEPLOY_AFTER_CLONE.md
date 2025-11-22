# Deploy After Cloning - Step by Step

## Prerequisites
- Project cloned from GitHub
- Server: Ubuntu with Apache
- Server access: root@wibook.co.tz
- Database user: percy
- Database password: Mwageni@1

## Step 1: Navigate to Project

```bash
cd invitations  # or wherever you cloned it
```

## Step 2: Make Deployment Script Executable

```bash
chmod +x deploy-all.sh
chmod +x setup-server.sh
```

## Step 3: Run Deployment Script

### Option A: Automated Deployment (if SSH works)

```bash
./deploy-all.sh
```

This will:
- Create deployment package
- Upload to server
- Install dependencies
- Configure Apache
- Set up database
- Install SSL certificate
- Start all services

### Option B: Manual Deployment (if SSH doesn't work)

**Step 3a: Create Deployment Package**

```bash
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

**Step 3b: Upload to Server**

Upload `deployment.tar.gz` to server at `/tmp/` using:
- FTP/SFTP client (FileZilla)
- Web file manager
- Or any file transfer method

**Step 3c: SSH to Server and Deploy**

```bash
ssh root@wibook.co.tz
# Password: Mwageni@1

cd /var/www/html
mkdir -p Event
cd Event
tar -xzf /tmp/deployment.tar.gz
chmod +x setup-server.sh
bash setup-server.sh
```

## Step 4: Configure Database

On the server:

```bash
mysql -u percy -p
# Enter password: Mwageni@1

CREATE DATABASE IF NOT EXISTS invite_db;
EXIT;
```

## Step 5: Update Backend .env (if needed)

```bash
cd /var/www/html/Event/backend
nano .env
```

Verify these settings:
```env
DB_USER=percy
DB_PASSWORD=Mwageni@1
DB_NAME=invite_db
```

## Step 6: Set Up Database Tables

```bash
cd /var/www/html/Event/backend
npm run setup-db
npm run seed
```

## Step 7: Update Email Credentials (Important)

```bash
cd /var/www/html/Event/backend
nano .env
```

Update:
- MAIL_USERNAME=your-email@gmail.com
- MAIL_PASSWORD=your-gmail-app-password
- MAIL_FROM_ADDRESS=your-email@gmail.com

## Step 8: Restart Services

```bash
pm2 restart event-backend
systemctl reload apache2
```

## Step 9: Install SSL Certificate

```bash
apt-get install certbot python3-certbot-apache
certbot --apache -d event.wibook.co.tz
```

Follow prompts:
- Enter email
- Agree to terms
- Choose redirect HTTP to HTTPS (option 2)

## Step 10: Update Frontend for HTTPS

```bash
cd /var/www/html/Event/frontend
echo "VITE_API_URL=https://event.wibook.co.tz/api" > .env
npm run build
systemctl reload apache2
```

## Step 11: Test Everything

1. **Backend Health:**
   ```bash
   curl https://event.wibook.co.tz/api/health
   ```

2. **Frontend:**
   - Visit: https://event.wibook.co.tz

3. **Check Services:**
   ```bash
   pm2 status
   pm2 logs event-backend
   systemctl status apache2
   ```

## Quick Commands Reference

```bash
# Check backend
pm2 status
pm2 logs event-backend

# Check Apache
systemctl status apache2
apache2ctl configtest

# Restart services
pm2 restart event-backend
systemctl reload apache2

# View logs
pm2 logs event-backend
tail -f /var/log/apache2/event.wibook.co.tz-error.log
```

## Troubleshooting

### Backend not starting
```bash
cd /var/www/html/Event/backend
pm2 logs event-backend
# Check .env file
cat .env
```

### Frontend not loading
```bash
# Check if build exists
ls -la /var/www/html/Event/frontend/dist

# Check Apache config
apache2ctl configtest

# Check Apache logs
tail -f /var/log/apache2/error.log
```

### Database connection error
```bash
# Test MySQL connection
mysql -u percy -pMwageni@1

# Check if database exists
mysql -u percy -pMwageni@1 -e "SHOW DATABASES;"
```

## Next Steps After Deployment

1. ✅ Test login at https://event.wibook.co.tz
2. ✅ Create an event
3. ✅ Add invitees
4. ✅ Test QR code generation
5. ✅ Test email sending
6. ✅ Test mobile app connection

## Mobile App

The mobile app is already configured to use:
- API URL: `https://event.wibook.co.tz/`

After deployment, rebuild and install:
```bash
cd mobile/android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

