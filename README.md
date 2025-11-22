# Event Invitation System

Complete event invitation management system with QR code scanning, email invitations, and mobile check-in app.

## Features

- Event management
- Invitee management with QR codes
- Email invitations with PDF cards
- QR code generation and scanning
- Mobile Android scanner app
- Check-in system
- Real-time status updates

## Quick Start

### After Cloning

1. **Navigate to project:**
   ```bash
   cd invitations
   ```

2. **Make script executable:**
   ```bash
   chmod +x deploy.sh
   ```

3. **Run deployment (on server as root):**
   ```bash
   sudo ./deploy.sh
   ```

The script will:
- Install all dependencies (Node.js, Apache, PM2)
- Set up backend with database
- Build frontend
- Configure Apache virtual host
- Install SSL certificate
- Start all services

### Configuration

**Backend .env** (created automatically):
```env
PORT=5001
NODE_ENV=production
JWT_SECRET=auto-generated
DB_USER=percy
DB_PASSWORD=Mwageni@1
DB_NAME=invite_db
FRONTEND_URL=https://event.wibook.co.tz
```

**Frontend .env** (created automatically):
```env
VITE_API_URL=https://event.wibook.co.tz/api
```

### Manual Setup

If you prefer manual setup, see:
- `DEPLOY_AFTER_CLONE.md` - Step-by-step guide
- `MANUAL_DEPLOYMENT.md` - Detailed instructions

## Project Structure

```
invitations/
├── backend/          # Node.js/Express API
├── frontend/         # React/Vite frontend
├── mobile/           # Android scanner app
├── deploy.sh         # Complete deployment script
└── ecosystem.config.js  # PM2 configuration
```

## Server Requirements

- Ubuntu Server
- Apache web server
- MySQL database
- Node.js 18+
- PM2

## Default Credentials

**Database:**
- User: `percy`
- Password: `Mwageni@1`
- Database: `invite_db`

**Scanner App:**
- Email: `scanner_user`
- Password: `scanner_pass_2024`

## Services

**Backend:** PM2 process manager
```bash
pm2 status
pm2 logs event-backend
pm2 restart event-backend
```

**Frontend:** Apache web server
```bash
systemctl status apache2
systemctl reload apache2
```

## Access

- **Frontend:** https://event.wibook.co.tz
- **Backend API:** https://event.wibook.co.tz/api
- **Health Check:** https://event.wibook.co.tz/api/health

## Documentation

- `DEPLOY_AFTER_CLONE.md` - Deployment after cloning
- `PM2_COMMANDS.md` - PM2 command reference
- `MANUAL_DEPLOYMENT.md` - Manual deployment guide

## License

Private project
