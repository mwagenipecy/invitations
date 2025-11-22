# Alternative Deployment Methods

Since SSH password authentication might not be enabled, here are alternative ways to deploy:

## Method 1: FTP/SFTP Client

### Using FileZilla (Free)

1. **Download FileZilla**: https://filezilla-project.org/

2. **Connect to Server:**
   - Host: `wibook.co.tz`
   - Username: `root`
   - Password: `Mwageni@1`
   - Port: `22` (SFTP) or `21` (FTP)

3. **Upload Files:**
   - Navigate to `/var/www/html/Event/`
   - Upload `deployment-complete.tar.gz`
   - Upload `setup-server.sh`

4. **Extract on Server:**
   - Use terminal in FileZilla or SSH after enabling password auth
   - Or use web-based file manager if available

## Method 2: Web-based File Manager

If your hosting provider offers a web file manager (cPanel, Plesk, etc.):

1. Log in to control panel
2. Navigate to File Manager
3. Go to `/var/www/html/Event/`
4. Upload `deployment-complete.tar.gz`
5. Extract using built-in extract tool
6. Run setup via terminal or SSH

## Method 3: Enable SSH Password Authentication

If you have access to the server console or another method:

```bash
# On the server, edit SSH config
nano /etc/ssh/sshd_config

# Find and change:
PasswordAuthentication yes
PubkeyAuthentication yes

# Restart SSH service
systemctl restart sshd

# Now password login should work
```

## Method 4: Use SSH Key

Generate SSH key and copy to server:

```bash
# On your local machine
ssh-keygen -t rsa -b 4096

# Copy key to server (if you can access it another way)
ssh-copy-id root@wibook.co.tz

# Or manually add to server:
# On server: ~/.ssh/authorized_keys
```

## Method 5: Direct Server Access

If you have physical or console access to the server:

1. Log in directly to server
2. Download files using wget/curl:
   ```bash
   cd /var/www/html/Event
   wget https://your-file-host.com/deployment-complete.tar.gz
   tar -xzf deployment-complete.tar.gz
   bash setup-server.sh
   ```

## Method 6: Git Repository

If you can set up a Git repository:

```bash
# On server
cd /var/www/html/Event
git clone https://your-repo-url.git .
bash setup-server.sh
```

## Recommended: FTP/SFTP Method

**Easiest approach:**

1. Install FileZilla
2. Connect via SFTP (port 22)
3. Upload `deployment-complete.tar.gz` to `/var/www/html/Event/`
4. Use server's terminal/SSH to extract and run setup

## Files to Upload

- `deployment-complete.tar.gz` (main deployment package)
- `setup-server.sh` (server setup script)
- `MANUAL_DEPLOYMENT.md` (instructions)

## After Upload

Once files are on server:

```bash
# SSH to server (or use server terminal)
cd /var/www/html/Event
tar -xzf deployment-complete.tar.gz
chmod +x setup-server.sh
bash setup-server.sh
```

Then follow the setup instructions in `MANUAL_DEPLOYMENT.md`

