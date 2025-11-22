// PM2 ecosystem configuration
// Auto-detects project path
const path = require('path');
const projectPath = __dirname;

module.exports = {
  apps: [{
    name: 'event-backend',
    script: path.join(projectPath, 'backend', 'index.js'),
    cwd: projectPath,
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: '/var/log/pm2/event-backend-error.log',
    out_file: '/var/log/pm2/event-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};

