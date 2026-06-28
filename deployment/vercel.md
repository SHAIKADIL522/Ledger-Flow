# Deploy Frontend — Vercel

## 1. Import Project

1. vercel.com → **Add New Project**
2. Import GitHub repo → `ledgerflow`
3. **Root Directory:** `frontend`
4. Framework: Next.js (auto-detected)

## 2. Environment Variables

Add in Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

## 3. Deploy

Click **Deploy**. Vercel runs `next build` automatically.

## 4. Verify

- Open deployed URL
- Login flow works
- API calls hit Render backend (check Network tab)

## Notes

- Every push to `main` triggers redeploy automatically
- Preview deployments on PRs — use separate `NEXT_PUBLIC_API_URL` for staging if needed
- `next build` must pass with zero errors before deploying — fix any TypeScript/ESLint errors first