# Backend API

This is the backend API for the invitation platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory (copy from `.env.example`):
```bash
DB_HOST=localhost
DB_USER=test
DB_PASSWORD=password
DB_NAME=invite_db
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
```

3. Make sure MySQL is running and the database exists:
```sql
CREATE DATABASE IF NOT EXISTS invite_db;
```

4. Run the database setup script to create tables:
```bash
npm run setup-db
```

5. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### POST /api/auth/login
Login endpoint
- Body: `{ "email": "user@example.com", "password": "password123" }`
- Returns: `{ "success": true, "token": "...", "user": {...} }`

### POST /api/auth/register
Registration endpoint
- Body: `{ "email": "user@example.com", "password": "password123", "name": "John Doe" }`
- Returns: `{ "success": true, "token": "...", "user": {...} }`

### GET /api/health
Health check endpoint

## Authentication

Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

