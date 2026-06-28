# Deploy Backend — Render

## 1. Create PostgreSQL

1. Render dashboard → **New** → **PostgreSQL**
2. Name: `ledgerflow-db`, Region: Singapore (closest to India)
3. Plan: Free (dev) or Starter (prod)
4. Copy **Internal Database URL** → use as `DATABASE_URL`

## 2. Create Web Service

1. Render dashboard → **New** → **Web Service**
2. Connect GitHub repo → select `ledgerflow`
3. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm ci && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `node src/server.js`
   - **Node Version:** 18

## 3. Environment Variables

Add all vars from `deployment/environment.md` under **Environment** tab.

## 4. Verify Deploy

After deploy, check:
```
GET https://your-app.onrender.com/health
GET https://your-app.onrender.com/db-health
GET https://your-app.onrender.com/system/version
GET https://your-app.onrender.com/metrics
```

All should return 200.

## Notes

- Free tier spins down after 15min inactivity — upgrade to Starter for production
- Render runs `prisma migrate deploy` (not `dev`) — safe for production
- Logs: Render dashboard → Web Service → Logs tab