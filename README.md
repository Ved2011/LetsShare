# LetsShare Backend

This is the backend for the LetsShare application, built with Node.js, Express, and PostgreSQL.

## Prerequisites
- Node.js and npm installed
- PostgreSQL running with database 'letsshare' created

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Ensure PostgreSQL is running and the database 'letsshare' exists.

3. Configure environment variables in `.env` file (already set up).

4. Start the server:
   ```
   npm start
   ```
   or for development:
   ```
   npm run dev
   ```

The server will run on http://localhost:3000 and create the database tables automatically.

## Frontend Updates
The frontend JavaScript files have been updated to make API calls to the backend. Users need to register/login first to get a JWT token, which is stored in localStorage.

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Items
- POST /api/items - Create a new item (requires auth)
- GET /api/items - Get all items
- GET /api/items/:id - Get item by ID

### Borrows
- POST /api/borrows - Create a borrow request (requires auth)
- GET /api/borrows - Get borrows for the authenticated user

### Returns
- POST /api/returns - Log a return (requires auth)

### Complaints
- POST /api/complaints - Submit a complaint (requires auth)
- GET /api/complaints - Get complaints for the authenticated user

## Database Schema

The database includes tables for users, items, borrows, returns, and complaints as specified.