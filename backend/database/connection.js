import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1', // Use 127.0.0.1 instead of localhost to avoid IPv6 issues
  user: process.env.DB_USER || 'percy', // Changed default from 'test' to 'percy'
  password: process.env.DB_PASSWORD || 'Mwageni@1', // Changed default password
  database: process.env.DB_NAME || 'invite_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Log the connection config for debugging (without password)
console.log('Database connection config:', {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'percy',
  database: process.env.DB_NAME || 'invite_db',
  envLoaded: !!process.env.DB_USER
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

