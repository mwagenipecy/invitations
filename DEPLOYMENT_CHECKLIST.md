# Deployment Checklist

## Pre-Deployment
- [ ] Server accessible (wibook.co.tz)
- [ ] SSH access working
- [ ] Domain DNS configured (event.wibook.co.tz → server IP)

## Deployment Steps
- [ ] Upload files to /var/www/html/Event
- [ ] Run setup-server.sh
- [ ] Install system dependencies (Node.js, Nginx, PM2)
- [ ] Configure backend .env file
- [ ] Set up MySQL database
- [ ] Run database setup scripts
- [ ] Build frontend
- [ ] Configure Nginx
- [ ] Install SSL certificate
- [ ] Start backend with PM2
- [ ] Test backend API
- [ ] Test frontend
- [ ] Update mobile app API URL
- [ ] Rebuild and test mobile app

## Post-Deployment Testing
- [ ] Backend health check works
- [ ] Frontend loads at https://event.wibook.co.tz
- [ ] Login works
- [ ] Events can be created
- [ ] Invitees can be added
- [ ] QR codes can be scanned
- [ ] Check-in works from mobile app
- [ ] Email sending works
- [ ] SSL certificate valid

## Mobile App
- [ ] API URL updated to https://event.wibook.co.tz
- [ ] APK rebuilt
- [ ] App installed on device
- [ ] Authentication works
- [ ] QR scanning works
- [ ] Check-in works

