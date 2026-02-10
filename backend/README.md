# TradieLink Backend (PostgreSQL)

## Environment

Create `backend/.env`:

```env
DATABASE_URL=postgresql://localhost:5432/tradielink
PORT=4000
JWT_SECRET=tradielink_dev_secret
```

## Install

```bash
cd backend
npm install
```

## Run

```bash
npm run dev
```

On startup, the API auto-runs `backend/sql.init.sql` to create the `users` table if needed.

## Auth Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /health`

## Frontend API Base URL

Set in project root `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```
