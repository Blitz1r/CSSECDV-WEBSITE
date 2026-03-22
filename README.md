# Inventory System MERN Site

This repository contains a full-stack inventory and order management web app built as a CSSECDV/CSSWENG school project.

The application includes:
- User authentication with session-based login and security-question flows
- Role-aware access for Administrator, Manager, and Guest users
- Inventory item and category management
- Order management and pending order tracking
- Transaction and activity logging
- Dashboard and report views (sales and inventory)

Tech stack:
- Frontend: React (Create React App), React Router, Axios, Bootstrap, Chart.js
- Backend: Node.js, Express, Mongoose, express-session
- Database: MongoDB

## Project Structure

- `backend/`: Express API and MongoDB models/controllers/routes
- `frontend/`: React client application

## Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or cloud)

## Environment Setup

Create a `.env` file in `backend/` with at least:

```env
MONGO_URI=mongodb://127.0.0.1:27017/inventorydb
SESSION_SECRET=replace-with-a-long-random-secret
FRONTEND_ORIGIN=http://localhost:3000
```

Optional backend environment variables:

```env
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME_MINUTES=15
PASSWORD_HISTORY_LIMIT=5
MIN_PASSWORD_AGE_HOURS=24
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128
PASSWORD_REQUIRE_UPPER=true
PASSWORD_REQUIRE_LOWER=true
PASSWORD_REQUIRE_DIGIT=true
PASSWORD_REQUIRE_SPECIAL=true
```

Create a `.env` file in `frontend/` (optional for local development):

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_PASSWORD_MIN_LENGTH=8
```

## Install Dependencies

From the repository root:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Run the Application (Development)

Use two terminals.

1. Start the backend API:

```bash
cd backend
npm run dev
```

The backend runs on `http://localhost:5000`.

2. Start the frontend app:

```bash
cd frontend
npm start
```

The frontend runs on `http://localhost:3000`.

## Optional: Seed Sample Users

From `backend/`:

```bash
node scripts/seedUsers.js
```

This recreates the users collection with sample accounts defined in `backend/scripts/seedUsers.js`.

