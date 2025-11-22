# Deployment Guide - Event Invitation System

## Server Information
- **Server IP**: wibook.co.tz
- **Username**: root
- **Password**: Mwageni@1
- **Project Path**: /var/www/html/Event
- **Frontend Domain**: event.wibook.co.tz

## Prerequisites

1. **Local machine requirements:**
   - SSH access to server
   - `scp` command available
   - `tar` command available

2. **Server requirements:**
   - Ubuntu server
   - Node.js and npm
   - Nginx
   - MySQL
   - PM2 (will be installed by script)

## Deployment Steps

### Step 1: Prepare Local Files

```bash
cd /Users/mac/Desktop/PercyFolder/Invitation
chmod +x deploy.sh deploy-setup.sh
```

### Step 2: Deploy Files to Server

```bash
./deploy.sh
```

This will:
- Create a deployment package (excluding node_modules, .git, etc.)
- Upload files to the server
- Extract files to `/var/www/html/Event`

### Step 3: SSH to Server and Run Setup

```bash
ssh root@wibook.co.tz
cd /var/www/html/Event
bash /tmp/deploy-setup.sh
```

Or manually run the setup commands:

### Step 4: Install System Dependencies

```bash
apt-get update
apt-get install -y nodejs npm nginx mysql-client
npm install -g pm2
```

### Step 5: Configure Backend

```bash
cd /var/www/html/Event/backend
```

Create/update `.env` file:

```env
PORT=5001
NODE_ENV=production
JWT_SECRET=your-very-secure-secret-key-change-this
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-mysql-password
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

Install dependencies:
```bash
npm install --production
```

### Step 6: Set Up Database

```bash
# Create database
mysql -u root -p
CREATE DATABASE invite_db;
EXIT;

# Run setup script
npm run setup-db
npm run seed
```

### Step 7: Configure Frontend

```bash
cd /var/www/html/Event/frontend
```

Create `.env` file:

```env
VITE_API_URL=https://event.wibook.co.tz/api
```

Build frontend:
```bash
npm install
npm run build
```

### Step 8: Configure Nginx

Create Nginx configuration:

```bash
nano /etc/nginx/sites-available/event.wibook.co.tz
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name event.wibook.co.tz;
    
    # Frontend
    root /var/www/html/Event/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/event.wibook.co.tz /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 9: Set Up SSL (Let's Encrypt)

```bash
apt-get install certbot python3-certbot-nginx
certbot --nginx -d event.wibook.co.tz
```

### Step 10: Start Backend with PM2

```bash
cd /var/www/html/Event/backend
pm2 start index.js --name "event-backend"
pm2 save
pm2 startup
```

### Step 11: Update Frontend API URL

After SSL is set up, update frontend `.env`:

```env
VITE_API_URL=https://event.wibook.co.tz/api
```

Rebuild frontend:
```bash
cd /var/www/html/Event/frontend
npm run build
systemctl reload nginx
```

## Verification

1. **Check backend:**
   ```bash
   pm2 status
   pm2 logs event-backend
   curl http://localhost:5001/api/health
   ```

2. **Check frontend:**
   - Visit: http://event.wibook.co.tz (or https://event.wibook.co.tz after SSL)

3. **Check Nginx:**
   ```bash
   systemctl status nginx
   nginx -t
   ```

## Useful Commands

### Backend Management
```bash
pm2 restart event-backend    # Restart backend
pm2 stop event-backend       # Stop backend
pm2 logs event-backend       # View logs
pm2 monit                    # Monitor
```

### Frontend Updates
```bash
cd /var/www/html/Event/frontend
npm run build
systemctl reload nginx
```

### Database Management
```bash
cd /var/www/html/Event/backend
npm run setup-db    # Reset database
npm run seed        # Seed test data
```

## Troubleshooting

### Backend not starting
- Check `.env` file exists and has correct values
- Check database connection: `mysql -u root -p`
- Check logs: `pm2 logs event-backend`

### Frontend not loading
- Check Nginx: `systemctl status nginx`
- Check build: `ls -la /var/www/html/Event/frontend/dist`
- Check Nginx config: `nginx -t`

### API not working
- Check backend is running: `pm2 status`
- Check CORS settings in backend
- Check Nginx proxy configuration

## Security Notes

1. **Change default passwords** in `.env`
2. **Use strong JWT_SECRET**
3. **Enable firewall:**
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```
4. **Keep system updated:**
   ```bash
   apt-get update && apt-get upgrade -y
   ```

## Domain DNS Setup

Make sure DNS A record points to server IP:
```
event.wibook.co.tz  A  [SERVER_IP]
```

