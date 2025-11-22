# Quick Fix - Run These Commands Now

## On Your Server

### 1. Start Backend with PM2

```bash
cd /var/www/html/Event/invitations
pm2 start backend/index.js --name event-backend
pm2 save
pm2 status
```

### 2. Check Backend Logs

```bash
pm2 logs event-backend
```

### 3. Run Database Setup

```bash
cd /var/www/html/Event/invitations/backend
npm run setup-db
npm run seed
```

### 4. Restart Backend

```bash
pm2 restart event-backend
pm2 logs event-backend --lines 50
```

### 5. Check Apache

```bash
systemctl status apache2
systemctl restart apache2
```

### 6. Test

```bash
# Test backend
curl http://localhost:5001/api/health

# Test frontend
curl http://localhost
```

## Or Update and Re-run Script

```bash
cd /var/www/html/Event/invitations
git pull
sudo ./deploy.sh
```

The updated script will:
- Fix ecosystem.config.js path
- Show better error messages
- Verify PM2 actually started

