require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const { errorHandler, notFound } = require("./middleware/errorHandler");
const { generalLimiter, authLimiter, aiLimiter } = require("./middleware/rateLimiter");
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
const aiRoutes           = require("./routes/ai.routes");          // NEW
const healthRoutes       = require("./routes/health.routes");
const dbHealthRoutes     = require("./routes/db-health.routes");
const metricsRoutes      = require("./routes/metrics.routes");
const systemRoutes       = require("./routes/system.routes");

const app = express();

// ── SECURITY ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(
  cors({
    origin: [process.env.CLIENT_URL || "http://localhost:3000"],
    credentials: true,
  })
);
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
app.use("/api/auth", authLimiter);
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