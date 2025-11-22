#!/bin/bash

# Fix merge conflict in connection.js
# Run this on the server

set -e

PROJECT_PATH="/var/www/html/Event/invitations"

echo "=== Fixing Merge Conflict ==="
echo ""

cd $PROJECT_PATH/backend/database

# Remove merge conflict markers
echo "Removing merge conflict markers from connection.js..."
sed -i '/^<<<<<<< HEAD$/,/^>>>>>>>/d' connection.js
sed -i '/^=======$/d' connection.js

# Ensure the file has the correct content
cat > connection.js << 'CONNECTIONEOF'
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1', // Use 127.0.0.1 instead of localhost to avoid IPv6 issues
  user: process.env.DB_USER || 'test',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'invite_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✓ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('✗ Database connection error:', err.message);
    console.log('\nPlease check:');
    console.log('1. MySQL server is running');
    console.log('2. Database "invite_db" exists');
    console.log('3. Credentials in .env file are correct');
  });

export default pool;
CONNECTIONEOF

echo "✅ connection.js fixed"
echo ""

# Now run database setup
echo "Running database setup..."
cd $PROJECT_PATH/backend
npm run setup-db

echo ""
echo "✅ Merge conflict fixed and database setup completed"

