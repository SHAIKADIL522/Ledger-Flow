const express = require("express");
const { z } = require("zod");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { createAuditLog } = require("../utils/audit");

const router = express.Router();
router.use(requireAuth);

// ─── PROFILE ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name:      z.string().min(1).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  username:  z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Lowercase letters, numbers, - and _ only")
    .optional(),
  phone:    z.string().optional(),
  language: z.enum(["en", "hi"]).optional(),
  timezone: z.string().optional(),
});

router.get(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, name: true, email: true, avatarUrl: true,
        username: true, phone: true, language: true, timezone: true,
        googleId: true, businessName: true, defaultCurrency: true,
      },
    });
    res.json({ user });
  })
);

router.put(
  "/profile",
  asyncHandler(async (req, res) => {
    if (req.body.username) req.body.username = req.body.username.toLowerCase().trim();
    const data = profileSchema.parse(req.body);

    if (data.username) {
      const existing = await prisma.user.findFirst({
        where: { username: data.username, NOT: { id: req.userId } },
      });
      if (existing) return res.status(409).json({ error: "Username already taken" });
    }

    const user = await prisma.user.update({ where: { id: req.userId }, data });
    await createAuditLog({
      userId: req.userId,
      action: "PROFILE_UPDATED",
      entity: "User",
      entityId: req.userId,
    });
    res.json({ user });
  })
);

// ─── BUSINESS ─────────────────────────────────────────────────────────────────

const businessSchema = z.object({
  businessName:    z.string().optional(),
  ownerName:       z.string().optional(),
  businessEmail:   z.string().email().optional().or(z.literal("")),
  businessPhone:   z.string().optional(),
  website:         z.string().optional(),
  gstNumber:       z.string().optional(),
  panNumber:       z.string().optional(),
  country:         z.string().optional(),
  state:           z.string().optional(),
  city:            z.string().optional(),
  postalCode:      z.string().optional(),
  address:         z.string().optional(),
  defaultCurrency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "CAD"]).optional(),
  invoicePrefix:   z.string().optional(),
  paymentTerms:    z.number().int().optional(),
  defaultTax:      z.number().optional(),
  lateFee:         z.number().optional(),
  defaultNotes:    z.string().optional(),
  startingNumber:  z.number().int().optional(),
  logoUrl:         z.string().optional().or(z.literal("")),
  upiId:            z.string().optional().or(z.literal("")),
  bankName:         z.string().optional().or(z.literal("")),
  bankAccountHolder:z.string().optional().or(z.literal("")),
  bankAccountNumber:z.string().optional().or(z.literal("")),
  bankIfsc:         z.string().optional().or(z.literal("")),
});

router.get(
  "/business",
  asyncHandler(async (req, res) => {
    const [user, biz] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          businessName: true, gstNumber: true, country: true,
          defaultCurrency: true, address: true,
          upiId: true, bankName: true, bankAccountHolder: true,
          bankAccountNumber: true, bankIfsc: true,
        },
      }),
      prisma.businessSettings.findUnique({ where: { userId: req.userId } }),
    ]);
    const merged = { ...user, ...(biz || {}) };
    // Nullable Prisma columns come back as `null` when unset — coerce to ""
    // so every consumer gets clean, controlled-input-safe strings.
    const clean = Object.fromEntries(
      Object.entries(merged).map(([k, v]) => [k, v === null ? "" : v])
    );
    res.json({ business: clean });
  })
);

router.put(
  "/business",
  asyncHandler(async (req, res) => {
    const data = businessSchema.parse(req.body);
    const {
      businessName, gstNumber, country, defaultCurrency, address,
      ownerName, businessEmail, businessPhone, website, panNumber,
      state, city, postalCode, invoicePrefix, paymentTerms, defaultTax,
      lateFee, defaultNotes, startingNumber, logoUrl,
      upiId, bankName, bankAccountHolder, bankAccountNumber, bankIfsc,
    } = data;

    const [user] = await Promise.all([
      prisma.user.update({
        where: { id: req.userId },
        data: {
          ...(businessName !== undefined && { businessName }),
          ...(gstNumber    !== undefined && { gstNumber }),
          ...(country      !== undefined && { country }),
          ...(defaultCurrency !== undefined && { defaultCurrency }),
          ...(address      !== undefined && { address }),
          ...(upiId             !== undefined && { upiId }),
          ...(bankName          !== undefined && { bankName }),
          ...(bankAccountHolder !== undefined && { bankAccountHolder }),
          ...(bankAccountNumber !== undefined && { bankAccountNumber }),
          ...(bankIfsc          !== undefined && { bankIfsc }),
        },
      }),
      prisma.businessSettings.upsert({
        where: { userId: req.userId },
        update: {
          ownerName, businessEmail, businessPhone, website, panNumber,
          state, city, postalCode, invoicePrefix, paymentTerms,
          defaultTax, lateFee, defaultNotes, startingNumber, logoUrl,
        },
        create: {
          userId: req.userId,
          ownerName, businessEmail, businessPhone, website, panNumber,
          state, city, postalCode, invoicePrefix, paymentTerms,
          defaultTax, lateFee, defaultNotes, startingNumber, logoUrl,
        },
      }),
    ]);

    await createAuditLog({
      userId: req.userId,
      action: "BUSINESS_UPDATED",
      entity: "BusinessSettings",
      entityId: req.userId,
    });
    res.json({ ok: true, user });
  })
);

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

const notifSchema = z.object({
  invoicePaid:     z.boolean().optional(),
  invoiceOverdue:  z.boolean().optional(),
  newClient:       z.boolean().optional(),
  weeklySummary:   z.boolean().optional(),
  monthlyReport:   z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  browserNotifs:   z.boolean().optional(),
});

router.get(
  "/notifications",
  asyncHandler(async (req, res) => {
    const prefs = await prisma.notificationPrefs.findUnique({
      where: { userId: req.userId },
    });
    res.json({
      prefs: prefs || {
        invoicePaid: true, invoiceOverdue: true, newClient: true,
        weeklySummary: true, monthlyReport: false,
        marketingEmails: false, browserNotifs: false,
      },
    });
  })
);

router.put(
  "/notifications",
  asyncHandler(async (req, res) => {
    const data = notifSchema.parse(req.body);
    const prefs = await prisma.notificationPrefs.upsert({
      where: { userId: req.userId },
      update: data,
      create: { userId: req.userId, ...data },
    });
    res.json({ prefs });
  })
);

// ─── APPEARANCE ───────────────────────────────────────────────────────────────

const appearanceSchema = z.object({
  theme:       z.enum(["dark", "light", "system"]).optional(),
  accentColor: z.string().optional(),
  compactMode: z.boolean().optional(),
  animations:  z.boolean().optional(),
});

router.get(
  "/appearance",
  asyncHandler(async (req, res) => {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
    });
    res.json({
      prefs: prefs || {
        theme: "dark", accentColor: "#22D3C5",
        compactMode: false, animations: true,
      },
    });
  })
);

router.put(
  "/appearance",
  asyncHandler(async (req, res) => {
    const data = appearanceSchema.parse(req.body);
    const prefs = await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: data,
      create: { userId: req.userId, ...data },
    });
    res.json({ prefs });
  })
);

// ─── SESSIONS ─────────────────────────────────────────────────────────────────

router.get(
  "/sessions",
  asyncHandler(async (req, res) => {
    const sessions = await prisma.loginSession.findMany({
      where: { userId: req.userId },
      orderBy: { lastActive: "desc" },
      take: 10,
    });
    res.json({ sessions });
  })
);

router.delete(
  "/sessions/:id",
  asyncHandler(async (req, res) => {
    const session = await prisma.loginSession.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!session) return res.status(404).json({ error: "Session not found" });
    await prisma.loginSession.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

router.delete(
  "/sessions",
  asyncHandler(async (req, res) => {
    await prisma.loginSession.deleteMany({
      where: { userId: req.userId, isCurrent: false },
    });
    res.json({ ok: true });
  })
);

// ─── API KEYS ─────────────────────────────────────────────────────────────────

router.get(
  "/api-keys",
  asyncHandler(async (req, res) => {
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.userId, active: true },
      select: { id: true, name: true, prefix: true, lastUsed: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ keys });
  })
);

router.post(
  "/api-keys",
  asyncHandler(async (req, res) => {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
    const raw = `LF_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = await bcrypt.hash(raw, 10);
    const prefix = raw.slice(0, 8);

    await prisma.apiKey.create({
      data: { userId: req.userId, name, keyHash, prefix },
    });
    await createAuditLog({
      userId: req.userId,
      action: "API_KEY_CREATED",
      entity: "ApiKey",
      entityId: req.userId,
    });

    // Raw key returned ONCE — never stored in plain text
    res.status(201).json({ key: raw, prefix, name });
  })
);

router.delete(
  "/api-keys/:id",
  asyncHandler(async (req, res) => {
    const key = await prisma.apiKey.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!key) return res.status(404).json({ error: "Key not found" });
    await prisma.apiKey.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    res.json({ ok: true });
  })
);

// ─── DATA EXPORT ──────────────────────────────────────────────────────────────

router.get(
  "/export/:entity",
  asyncHandler(async (req, res) => {
    const { entity } = req.params;
    const { format = "json" } = req.query;
    const allowed = ["clients", "invoices", "expenses", "projects"];

    if (!allowed.includes(entity)) {
      return res.status(400).json({ error: "Invalid entity" });
    }

    let data;
    if (entity === "clients")
      data = await prisma.client.findMany({ where: { userId: req.userId } });
    if (entity === "invoices")
      data = await prisma.invoice.findMany({
        where: { userId: req.userId },
        include: { items: true },
      });
    if (entity === "expenses")
      data = await prisma.expense.findMany({ where: { userId: req.userId } });
    if (entity === "projects")
      data = await prisma.project.findMany({ where: { userId: req.userId } });

    if (format === "csv") {
      if (!data.length) {
        res.setHeader("Content-Type", "text/csv");
        return res.send("");
      }
      // flatten nested objects for CSV
      const flatten = (obj, prefix = "") =>
        Object.entries(obj).reduce((acc, [k, v]) => {
          const key = prefix ? `${prefix}_${k}` : k;
          if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
            Object.assign(acc, flatten(v, key));
          } else {
            acc[key] = v;
          }
          return acc;
        }, {});

      const flat = data.map((row) => flatten(row));
      const keys = [...new Set(flat.flatMap(Object.keys))];
      const csv = [
        keys.join(","),
        ...flat.map((row) =>
          keys.map((k) => JSON.stringify(row[k] ?? "")).join(",")
        ),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${entity}.csv"`
      );
      return res.send(csv);
    }

    res.json({ data });
  })
);

// ─── DANGER ZONE ──────────────────────────────────────────────────────────────

router.delete(
  "/account",
  asyncHandler(async (req, res) => {
    const { password } = z
      .object({ password: z.string().min(1) })
      .parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.passwordHash) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Incorrect password" });
    }

    await prisma.user.delete({ where: { id: req.userId } });
    res.clearCookie("refreshToken");
    res.json({ ok: true, message: "Account deleted successfully" });
  })
);

module.exports = router;