require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const { errorHandler, notFound } = require("./middleware/errorHandler");
const { generalLimiter, aiLimiter } = require("./middleware/rateLimiter");
const logger = require("./utils/logger");
const requestTracker = require("./monitoring/requestTracker");

const authRoutes         = require("./routes/auth.routes");
const onboardingRoutes   = require("./routes/onboarding.routes");
const clientsRoutes      = require("./routes/clients.routes");
const projectsRoutes     = require("./routes/projects.routes");
const invoicesRoutes     = require("./routes/invoices.routes");
const expensesRoutes     = require("./routes/expenses.routes");
const dashboardRoutes    = require("./routes/dashboard.routes");
const reportsRoutes      = require("./routes/reports.routes");
const notificationsRoutes = require("./routes/notifications.routes");
const settingsRoutes     = require("./routes/settings.routes");
const paymentsRoutes     = require("./routes/payments.routes");
const webhooksRoutes     = require("./routes/webhooks.routes");
const aiRoutes           = require("./routes/ai.routes");          // NEW
const healthRoutes       = require("./routes/health.routes");
const dbHealthRoutes     = require("./routes/db-health.routes");
const metricsRoutes      = require("./routes/metrics.routes");
const systemRoutes       = require("./routes/system.routes");

const app = express();

// ── SECURITY ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));

// Allow the stable production frontend URL (CLIENT_URL), localhost for dev,
// and any Vercel per-deployment preview URL for this project — Vercel mints
// a new unique subdomain (ledger-flow-<hash>-shaikadil522s-projects.vercel.app)
// on every deploy, so a single hardcoded origin breaks previews/redeploys.
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // non-browser tools (curl, Postman, server-to-server)

      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/ledger-flow-[a-z0-9]+-shaikadil522s-projects\.vercel\.app$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Webhooks MUST get the raw request body for signature verification, so this
// has to be registered before the global express.json() body parser below.
app.use("/api/webhooks", express.raw({ type: "application/json" }), webhooksRoutes);

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// ── MONITORING ────────────────────────────────────────────────────────────────
app.use(requestTracker);
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level]({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ms,
    });
  });
  next();
});

// ── RATE LIMITERS ─────────────────────────────────────────────────────────────
// NOTE: authLimiter is NO LONGER applied blanket-wide here. It's applied
// per-route inside auth.routes.js, only on login/register/verify/resend —
// NOT on /auth/me or /auth/refresh, which fire on every page load/token
// cycle and would otherwise share (and exhaust) the same 20-req/15min budget.
app.use("/api/invoices/ai-draft", aiLimiter);
app.use("/api/ai", aiLimiter);                                     // NEW — AI chat rate limited
app.use(generalLimiter);

// ── SYSTEM / OBSERVABILITY ────────────────────────────────────────────────────
app.use("/health",    healthRoutes);
app.use("/db-health", dbHealthRoutes);
app.use("/metrics",   metricsRoutes);
app.use("/system",    systemRoutes);

// ── API ROUTES ────────────────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/onboarding",    onboardingRoutes);
app.use("/api/clients",       clientsRoutes);
app.use("/api/projects",      projectsRoutes);
app.use("/api/invoices",      invoicesRoutes);
app.use("/api/expenses",      expensesRoutes);
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/reports",       reportsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/settings",      settingsRoutes);
app.use("/api/payments",      paymentsRoutes);
app.use("/api/ai",            aiRoutes);                           // NEW

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`LedgerFlow API running on http://localhost:${PORT}`);
});

module.exports = app;