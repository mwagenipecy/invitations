# PM2 Commands Reference

## Important: PM2 is NOT a systemd service

PM2 is a process manager for Node.js applications. Use `pm2` commands directly, NOT `systemctl`.

## Basic Commands

### Check Status
```bash
pm2 status
# or
pm2 list
```

### View Logs
```bash
# All logs
pm2 logs

# Specific app
pm2 logs event-backend

# Last 100 lines
pm2 logs event-backend --lines 100

# Follow logs (real-time)
pm2 logs event-backend --follow
```

### Start/Stop/Restart
```bash
# Start
pm2 start event-backend
# or
pm2 start ecosystem.config.js

# Stop
pm2 stop event-backend

# Restart
pm2 restart event-backend

# Reload (zero-downtime)
pm2 reload event-backend
```

### Delete
```bash
pm2 delete event-backend
```

### Monitor
```bash
pm2 monit
```

## Common Issues

### PM2 not found
```bash
# Install PM2 globally
npm install -g pm2

# Or if already installed, check PATH
which pm2
```

### App not starting
```bash
# Check logs
pm2 logs event-backend

# Check if app exists
pm2 list

# Start manually to see errors
cd /var/www/html/Event/backend
node index.js
```

### App keeps crashing
```bash
# Check logs for errors
pm2 logs event-backend --err

# Check ecosystem config
cat /var/www/html/Event/ecosystem.config.js

# Restart with more info
pm2 restart event-backend --update-env
```

## Setup PM2 to Start on Boot

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

## Useful Commands

```bash
# Show app info
pm2 show event-backend

# Reset restart counter
pm2 reset event-backend

# Update environment variables
pm2 restart event-backend --update-env

# Clear all logs
pm2 flush

# Kill PM2 daemon
pm2 kill
```

## For Your Project

```bash
# Check if backend is running
pm2 status

# View backend logs
pm2 logs event-backend

# Restart backend after .env changes
pm2 restart event-backend

# Check backend health
curl http://localhost:5001/api/health
```

