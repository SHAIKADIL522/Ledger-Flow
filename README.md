# LedgerFlow

AI-powered invoicing, expense tracking, and business insights SaaS.

---

## Project Structure

```
ledgerflow/
├── backend/          ← Express + Prisma + PostgreSQL
└── frontend/         ← Next.js 15 + Tailwind + Zustand + TanStack Query
```

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# ↑ Fill in all REPLACE_WITH_... values

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev          # → http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

npm install
npm run dev          # → http://localhost:3000
```

---

## Environment Variables to Fill In

All secrets live in `backend/.env`. Grab these keys:

| Variable                | Where to get it                          |
|-------------------------|------------------------------------------|
| `DATABASE_URL`          | Neon / Supabase / local Postgres         |
| `JWT_ACCESS_SECRET`     | Any long random string                   |
| `JWT_REFRESH_SECRET`    | Another long random string               |
| `GOOGLE_CLIENT_ID`      | console.cloud.google.com → OAuth 2.0     |
| `GOOGLE_CLIENT_SECRET`  | Same as above                            |
| `OPENROUTER_API_KEY`    | openrouter.ai → Keys                     |
| `RESEND_API_KEY`        | resend.com → API Keys                    |
| `RAZORPAY_KEY_ID`       | dashboard.razorpay.com → Settings → API  |
| `RAZORPAY_KEY_SECRET`   | Same as above                            |
| `STRIPE_SECRET_KEY`     | dashboard.stripe.com → Developers → API  |
| `CLOUDINARY_*`          | cloudinary.com → Dashboard               |
| `SENTRY_DSN`            | sentry.io → Project → Settings           |

---

## What Works Out of the Box (Phase 1–9)

- Landing page with hero, features, integrations, AI demo, pricing, security, FAQ
- Email/password auth + Google OAuth (needs `GOOGLE_*` keys)
- 3-step onboarding wizard
- Client management (CRUD, search, detail page)
- Project management (CRUD, budget, deadline, status)
- Invoices — manual creation AND AI-generated via OpenRouter
- PDF invoice download (pdfkit, zero deps)
- Expense tracking (CRUD, categories)
- Dashboard snapshot: revenue / expenses / profit / pending invoices
- AI business insights (falls back to deterministic if OpenRouter not set)
- Multi-currency support with fallback FX rates
- Reports with date range + CSV export + recharts
- Notifications centre
- Settings (profile, business, password change)

## Payments (Scaffolded)

`/api/payments/razorpay/order` and `/api/payments/stripe/checkout-session` exist but return `503` until you add the real keys and install `razorpay` / `stripe` npm packages.

## Deploy

- **Frontend → Vercel** (root: `frontend/`, framework preset: Next.js)
- **Backend → Render** (root: `backend/`, start: `npm start`, add env vars)
- **Database → Neon** (free PostgreSQL, connection string → `DATABASE_URL`)
