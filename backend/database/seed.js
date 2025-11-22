import pool from './connection.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    console.log('Seeding database with test user...');
    
    const email = 'admin@example.com';
    const password = 'password';
    const hashedPassword = await bcrypt.hash(password, 10);

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('Test user already exists');
      await pool.query(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, email]
      );
      console.log('Test user password updated');
    } else {
      await pool.query(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email, hashedPassword, 'Admin User']
      );
      console.log('Test user created successfully!');
      console.log('Email: admin@example.com');
      console.log('Password: password');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

