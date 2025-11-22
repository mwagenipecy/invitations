import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
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

