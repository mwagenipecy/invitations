# Setup Guide

This guide will help you set up both the backend and frontend for testing.

## Prerequisites

- Node.js (v16 or higher)
- MySQL Server running
- npm or yarn package manager

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_USER=test
DB_PASSWORD=password
DB_NAME=invite_db
JWT_SECRET=your-secret-key-change-this-in-production
PORT=5000
FRONTEND_URL=http://localhost:5173
```

4. Create the database in MySQL:
```sql
CREATE DATABASE IF NOT EXISTS invite_db;
```

5. Run the database setup to create tables:
```bash
npm run setup-db
```

6. (Optional) Seed a test user:
```bash
npm run seed
```
This creates a test user:
- Email: `admin@example.com`
- Password: `password`

7. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Testing the Connection

1. Open your browser and go to `http://localhost:5173`
2. You should see the login page
3. The login page will show a warning if the backend is not connected
4. Try logging in with the test user:
   - Email: `admin@example.com`
   - Password: `password`

## Troubleshooting

### Backend won't start
- Check if port 5000 is already in use
- Verify MySQL is running
- Check database credentials in `.env` file

### Database connection errors
- Ensure MySQL server is running
- Verify the database `invite_db` exists
- Check username and password in `.env` file

### Frontend can't connect to backend
- Ensure backend server is running on port 5000
- Check browser console for CORS errors
- Verify frontend is running on `http://localhost:5173`

### Login fails
- Verify you ran `npm run setup-db` in the backend
- Check if test user was created with `npm run seed`
- Check backend console for error messages

## Testing the API

You can test the backend directly:

1. Test health endpoint:
```bash
curl http://localhost:5000/api/health
```

2. Test login endpoint:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

Or use the test script:
```bash
node test-connection.js
```

