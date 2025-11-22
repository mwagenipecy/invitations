# Fix Current Deployment Issues

## Current Status

The deployment script ran but:
- ✅ Frontend built successfully
- ✅ Apache configured
- ❌ PM2 backend not started
- ⚠️  Database setup/seed had warnings

## Quick Fix Commands

Run these on your server:

### 1. Check Backend Directory
```bash
cd /var/www/html/Event/invitations/backend
ls -la
```

### 2. Check if index.js exists
```bash
ls -la index.js
```

### 3. Test Backend Manually
```bash
cd /var/www/html/Event/invitations/backend
node index.js
```

If it starts, press Ctrl+C and continue.

### 4. Start with PM2
```bash
cd /var/www/html/Event/invitations
pm2 start ecosystem.config.js
pm2 save
pm2 status
```

### 5. Check PM2 Logs
```bash
pm2 logs event-backend
```

### 6. Run Database Setup Manually
```bash
cd /var/www/html/Event/invitations/backend
npm run setup-db
npm run seed
```

### 7. Check Apache Status
```bash
systemctl status apache2
systemctl restart apache2
```

### 8. Test Frontend
```bash
curl http://localhost
# or visit: http://event.wibook.co.tz
```

## After Pulling Updated Script

```bash
cd /var/www/html/Event/invitations
git pull
sudo ./deploy.sh
```

The updated script will:
- Show better error messages
- Check if backend actually started
- Display PM2 logs if startup fails

