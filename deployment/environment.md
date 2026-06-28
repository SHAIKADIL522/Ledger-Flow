# Environment Variables — LedgerFlow

## Backend (Render)

```env
# Database
DATABASE_URL=

# Auth
JWT_SECRET=
JWT_REFRESH_SECRET=

# Frontend URL (for CORS)
CLIENT_URL=

# AI
OPENROUTER_API_KEY=

# Email
RESEND_API_KEY=

# Monitoring
SENTRY_DSN=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App
NODE_ENV=production
PORT=5000
LOG_LEVEL=info
```

## Frontend (Vercel)

```env
NEXT_PUBLIC_API_URL=
```

## Rules
- Never commit `.env` — it is gitignored
- Generate `JWT_SECRET` + `JWT_REFRESH_SECRET` with: `openssl rand -base64 64`
- `DATABASE_URL` comes from Render PostgreSQL → Connect tab
- `SENTRY_DSN` from sentry.io → Project Settings → Client Keys
- `RESEND_API_KEY` from resend.com → API Keys