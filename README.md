# Postback URL (S2S Tracking) MVP with PostgreSQL

## Overview
This MVP demonstrates Server-to-Server (S2S) postback tracking for affiliate marketing. Instead of browser cookies or pixels, the advertiser’s server notifies the affiliate system when a conversion occurs.

Flow:
1. A user clicks an affiliate tracking link: `/click?affiliate_id=1&campaign_id=10&click_id=abc123`.
2. The system stores the click in Postgres.
3. When a purchase happens, the advertiser fires a postback: `/postback?affiliate_id=1&click_id=abc123&amount=100&currency=USD`.
4. The system validates the click and stores the conversion, visible on the affiliate dashboard.

## Tech Stack
- Backend: Node.js + Express
- Frontend: Next.js (React)
- Database: PostgreSQL
- Orchestration: Docker Compose (optional)

## Monorepo Structure
- `apps/backend` – Express API + migrations and seeds
- `apps/frontend` – Next.js dashboard

## Database Schema
Tables:
- `affiliates(id, name)`
- `campaigns(id, name)`
- `clicks(id, affiliate_id, campaign_id, click_id, created_at)` with unique `(affiliate_id, campaign_id, click_id)`
- `conversions(id, click_id, amount, currency, created_at)`

Migrations and seed data are in `apps/backend/migrations` and are applied automatically on backend start.

## Getting Started

### Option A: Run locally (no Docker)
Prereqs: Node 18+, PostgreSQL 14+ running locally.

1) Install deps
```
# Backend
cd apps/backend
npm i

# Frontend
cd ../frontend
npm i
```

2) Start Postgres and create a DB named `affiliate` (or set envs accordingly).

3) Start backend
```
cd ../backend
# envs if needed
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=affiliate
export DB_USER=postgres
export DB_PASSWORD=postgres
export CORS_ORIGIN=http://localhost:3000
npm run dev
```
Backend will apply migrations on boot and listen on `http://localhost:4000`.

4) Start frontend
```
cd ../frontend
export NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
export NEXT_PUBLIC_POSTBACK_BASE=http://localhost:4000
npm run dev
```
Frontend runs on `http://localhost:3000`.

### Option B: Docker Compose
If you have Docker available, run:
```
docker compose up -d --build
```
Services:
- Postgres: `localhost:5432`
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:3000`

Note: In the included Compose, the frontend uses `NEXT_PUBLIC_BACKEND_URL=http://backend:4000` internally; from your browser, you’ll access via `http://localhost:3000`.

## API Endpoints

- Health: `GET /health`
  - Response: `{ "status": "ok" }`

- List affiliates: `GET /affiliates`
  - Response: `[{ id, name }, ...]`

- List campaigns: `GET /campaigns`
  - Response: `[{ id, name }, ...]`

- Track click: `GET /click?affiliate_id=1&campaign_id=10&click_id=abc123`
  - Stores the click (idempotent by unique constraint)
  - Response: `{ "status": "success", "click_row_id": number }`

- Postback: `GET /postback?affiliate_id=1&click_id=abc123&amount=100&currency=USD`
  - Validates the click for the affiliate, stores a conversion
  - Response: `{ "status": "success", "message": "Conversion tracked" }`

- Affiliate overview: `GET /affiliates/:id/overview`
  - Response: `{ affiliate, clicks: [...], conversions: [...] }`

## Frontend (Dashboard)
- Home page: select an affiliate (simulated login)
- Dashboard: 
  - Create clicks (choose campaign + set `click_id`)
  - View clicks and conversions
  - See affiliate postback URL format:
```
{POSTBACK_BASE}/postback?affiliate_id={id}&click_id={click_id}&amount={amount}&currency={currency}
```

Set `NEXT_PUBLIC_POSTBACK_BASE` in the frontend env for the display value.

## Example Requests (Local)
- Track a click:
```
curl "http://localhost:4000/click?affiliate_id=1&campaign_id=1&click_id=abc123"
```
- Fire a postback:
```
curl "http://localhost:4000/postback?affiliate_id=1&click_id=abc123&amount=100&currency=USD"
```
- Fetch overview:
```
curl "http://localhost:4000/affiliates/1/overview"
```

## Notes
- Migrations auto-apply on backend boot.
- Seed data provides a few affiliates and campaigns.
- Click insertion is idempotent via `UNIQUE(affiliate_id, campaign_id, click_id)`.