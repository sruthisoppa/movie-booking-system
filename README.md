# Movie Booking System

A small movie booking application with a Node/Express backend and a Next.js + React frontend. This repository contains two main folders:

- `backend/` — Express API (MySQL database, JWT auth, seat booking logic)
- `frontend/` — Next.js (App Router) client using TypeScript

This README explains how to set up, run, and develop the project locally (Windows / PowerShell instructions included).

## Table of contents

- Project structure
- Features
- Requirements
- Environment variables
- Database setup
- Backend: install & run
- Frontend: install & run
- Useful scripts
- Troubleshooting
- Development notes
- Tech stack
- Database schema (brief)

## Project structure

```
backend/
  package.json
  server.js
  routes/
    bookings.js
    admin.js
    shows.js
    seats.js
    ...

  config/
    database.js
    ...

  middleware/
    auth.js
    ...

frontend/
  package.json
  src/
    app/
        admin/
        bookings/
        ...
        login/
        signup/
        page.tsx          # Next.js App Router pages
    lib/           # API client (axios)
    ...
```

## Features

- Implemented Backend APIs, Cinema & Show Listing, Seat Selection Screen, Booking Confirmation, Booking History
- Implemented Bonus Features- Real-Time Concurrency with temporary seat blocking,
- Admin Panel with secure interface to add/edit/delete Movies, Admin view of show's seat layout with user booking details on hover.

## Requirements

- Node.js (>=18 recommended)
- npm
- MySQL (or compatible) running locally or accessible

## Tech stack

- Backend: Node.js, Express, MySQL (mysql2), JWT for authentication, Socket.io (for realtime/blocking), bcryptjs for password hashing
- Frontend: Next.js (App Router), React, TypeScript, Tailwind (configured), Axios for API calls, lucide-react for icons
- Dev tools: ESLint, Turbopack (Next.js), nodemon for backend development

## Environment variables

Create a `.env` file in `backend/` with at least the following values:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=movie_booking
JWT_SECRET=your_jwt_secret
```

Adjust values to match your environment.

## Database setup

1. Create a database in MySQL matching `DB_NAME` (default `movie_booking`).
2. Then after updating the env file and running, the backend automatically creates sample data.

### Brief database schema (overview)

Below is a brief high-level schema outline (column names inferred from backend queries). Use this as a starting point for creating tables or seeds.

-- Users table with role-based authentication
users

- id (PK, int, auto_increment)
- name (varchar)
- email (varchar, unique)
- password (varchar)
- created_at (timestamp)
- role (enum: 'admin','user')

-- Cinemas table for venue management  
cinemas

- id (PK)
- name (varchar)
- location (varchar)
- created_at (timestamp)

-- Movies table with film details
movies

- id (PK)
- title (varchar)
- description (text)
- duration (int)
- genre (varchar)
- poster_url (varchar)
- created_at (timestamp)

-- Screens table within cinemas
screens

- id (PK)
- cinema_id (FK -> cinemas.id)
- name (varchar)
- total_seats (int)

-- Shows table for movie screenings
shows

- id (PK)
- movie_id (FK -> movies.id)
- screen_id (FK -> screens.id)
- start_time (datetime)
- end_time (datetime)
- price (decimal)

-- Bookings table for user reservations
bookings

- id (PK)
- user_id (FK -> users.id)
- show_id (FK -> shows.id)
- booking_time (timestamp)
- total_amount (decimal)
- status (enum: 'confirmed', 'cancelled')

-- Seats table with real-time blocking
seats

- id (PK)
- booking_id (FK -> bookings.id, nullable)
- show_id (FK -> shows.id)
- seat_number (varchar)
- seat_row (int)
- seat_column (int)
- status (enum: 'available', 'booked', 'blocked')
- blocked_until (timestamp, nullable)
- blocked_by_user (FK -> users.id, nullable)

Notes:

- The backend often uses GROUP_CONCAT(seats.seat_number) to return seats as a comma-separated string; the frontend converts that to an array.
- The API currently returns a human-readable bookingId (e.g., `BK001`) for display; the canonical DB id is `bookings.id` and should be used for server-side operations (cancel, seat release).

## Backend: install & run (PowerShell)

Open a PowerShell terminal in `backend/`:

```powershell
cd backend
npm install
# Start in dev with auto-reload
npm run dev
# or run production
npm start
```

The backend listens on the port configured in `.env` (default 5000) and serves API routes under `/api` (for example: `GET /api/shows/:id`, `GET /api/seats/show/:showId`, `POST /api/bookings`, `POST /api/bookings/:id/cancel`).

## Frontend: install & run (PowerShell)

Open a PowerShell terminal in `frontend/`:

```powershell
cd frontend
npm install
# Development (Turbopack)
npm run dev
# Build for production
npm run build
npm start
```

The frontend uses the App Router. API base URL is configured in `frontend/src/lib/api.ts` (default: `http://localhost:5000/api`). Adjust if your backend runs elsewhere.

## Useful scripts

- Backend

  - `npm run dev` — start backend with nodemon
  - `npm start` — start backend with node

- Frontend
  - `npm run dev` — start Next.js dev server (Turbopack)
  - `npm run build` — build for production
  - `npm start` — start production server
  - `npm run lint` — run ESLint

## Troubleshooting

- 404 from seat/show APIs

  - Ensure the `showId` passed to frontend API calls is a numeric DB id (backend endpoints expect numeric IDs).
  - If you see requests with IDs like `BK001` (formatted bookingId), map to the numeric DB id on the client or change the backend to accept those formatted IDs.

- Auth issues (401)

  - Backend requires Authorization header `Bearer <token>` for protected routes. The frontend attaches token from `localStorage.token`.
  - If you get 401, make sure you are logging in properly and the JWT is present.

- Next.js build or ESLint warnings
  - The project uses Next 15 App Router with Turbopack; some warnings (react-hooks/exhaustive-deps, next/image suggestions) are non-fatal but should be cleaned up during development.

## Developer notes

- API client: `frontend/src/lib/api.ts` centralizes axios calls and interceptors.
- Booking flow:
  - Seat selection happens on the client and seats are temporarily "blocked" using seat updates.
  - Booking creation calls `POST /api/bookings` and the server links seats to the booking.
  - Cancellation endpoint: `POST /api/bookings/:id/cancel` (server expects the DB numeric booking id).
- When making changes to IDs or canonical fields (bookingId vs id), prefer normalizing the API response so the client receives both the DB id and a human-facing booking code.
