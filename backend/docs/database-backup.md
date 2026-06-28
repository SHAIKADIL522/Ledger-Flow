# Database Backup — LedgerFlow

## Daily Backup (Automated via Render/Supabase)

**Render PostgreSQL** — enables automatic daily backups on paid plans.

- Retention: 7 days
- Trigger: Automatic (midnight UTC)
- Location: Render dashboard → PostgreSQL → Backups tab

**Manual backup (pg_dump):**
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## Weekly Backup (Manual)

Run every Monday before deployments:

```bash
pg_dump $DATABASE_URL | gzip > backup_weekly_$(date +%Y%m%d).sql.gz
```

Store in: Google Drive / S3 bucket / local encrypted volume.

## Recovery Procedure

### From Render dashboard
1. Go to Render → PostgreSQL instance → Backups
2. Click **Restore** on target snapshot
3. Confirm — this creates a new DB instance (does not overwrite)
4. Update `DATABASE_URL` in Render environment vars
5. Redeploy backend service

### From pg_dump file
```bash
# Drop and recreate (destructive)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

### Post-recovery checklist
- [ ] Run `npx prisma migrate deploy` to apply any pending migrations
- [ ] Verify `/db-health` returns `{ "database": "connected" }`
- [ ] Verify `/health` returns `{ "status": "ok" }`
- [ ] Test login + invoice creation

## Environment Variables Required
```
DATABASE_URL=postgresql://user:password@host:5432/ledgerflow
```

Never commit this value. Store in Render → Environment.