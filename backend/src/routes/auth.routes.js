const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { z } = require("zod");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { sendVerifyEmail, sendWelcomeEmail } = require("../utils/email");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

const router = express.Router();
const COOKIE_NAME = process.env.COOKIE_NAME || "ledgerflow-token";
const REFRESH_COOKIE_NAME = `${COOKIE_NAME}-refresh`;
const VERIFY_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 min OTP window

// ---------- SHARED VALIDATION ----------
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const passwordMsg =
  "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character";

const cookieOpts = (maxAgeMs) => ({
  httpOnly: true,
  secure: true,           // required when sameSite is "none"
  sameSite: "none",       // required for cross-origin cookies
  maxAge: maxAgeMs,
  path: "/",
});

function setAuthCookies(res, user) {
  const accessToken = signAccessToken({ userId: user.id });
  const refreshToken = signRefreshToken({ userId: user.id });
  res.cookie(COOKIE_NAME, accessToken, cookieOpts(15 * 60 * 1000));
  res.cookie(
    REFRESH_COOKIE_NAME,
    refreshToken,
    cookieOpts(30 * 24 * 60 * 60 * 1000),
  );
  return { accessToken, refreshToken };
}

function publicUser(user) {
  const {
    passwordHash,
    refreshTokenHash,
    googleId,
    emailVerifyTokenHash,
    emailVerifyTokenExpires,
    ...safe
  } = user;
  return safe;
}

// Generates a 6-digit OTP + its hash (stored in DB)
function makeOtp() {
  const code = String(Math.floor(100000 + Math.random() * 900000)); // always 6 digits
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  return { code, hash, expires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS) };
}

async function issueAndSendVerifyToken(user) {
  const { code, hash, expires } = makeOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyTokenHash: hash, emailVerifyTokenExpires: expires },
  });
  try {
    await sendVerifyEmail({ to: user.email, name: user.name, otp: code });
  } catch (err) {
    const e = new Error(
      "Couldn't send the verification email. Please try again shortly.",
    );
    e.status = 502;
    e.cause = err;
    throw e;
  }
}

// ---------- REGISTER ----------
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z.string().regex(passwordRegex, passwordMsg),
});

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, emailVerified: false },
    });

    // DEV MODE: skip email, auto-verify instantly
    if (process.env.DEV_SKIP_EMAIL === "true") {
      const verified = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
      const { refreshToken } = setAuthCookies(res, verified);
      await prisma.user.update({
        where: { id: verified.id },
        data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10) },
      });
      // In dev, only send welcome email to Resend account owner (sandbox limit)
      // Welcome email skipped in dev (Resend sandbox restriction)
      // It fires for all users automatically in production
      return res.status(201).json({ user: publicUser(verified) });
    }

    // PRODUCTION: send OTP email, require verification
    await issueAndSendVerifyToken(user);
    res.status(201).json({ requiresVerification: true, user: publicUser(user) });
  }),
);

// ---------- VERIFY EMAIL ----------
const verifyEmailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

router.post(
  "/verify-email",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, otp } = verifyEmailSchema.parse(req.body);
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.emailVerifyTokenHash !== otpHash) {
      return res.status(400).json({ error: "Invalid verification code." });
    }

    if (
      !user.emailVerifyTokenExpires ||
      user.emailVerifyTokenExpires < new Date()
    ) {
      return res.status(400).json({
        error: "This code has expired. Please request a new one.",
      });
    }

    const verified = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyTokenHash: null,
        emailVerifyTokenExpires: null,
      },
    });

    const { refreshToken } = setAuthCookies(res, verified);
    await prisma.user.update({
      where: { id: verified.id },
      data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10) },
    });

    // Fire welcome email in background — don't fail the request if it errors
    sendWelcomeEmail({ to: verified.email, name: verified.name }).catch(() => {});

    res.json({ user: publicUser(verified) });
  }),
);

// ---------- RESEND VERIFICATION ----------
const resendSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

router.post(
  "/resend-verification",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email } = resendSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    // Don't leak whether the account exists.
    if (!user || user.emailVerified) {
      return res.json({
        ok: true,
        message: "If an unverified account exists, a new link was sent.",
      });
    }

    await issueAndSendVerifyToken(user);
    res.json({ ok: true, message: "Verification email sent." });
  }),
);

// ---------- LOGIN ----------
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Please verify your email before logging in.",
        requiresVerification: true,
        email: user.email,
      });
    }

    const { refreshToken } = setAuthCookies(res, user);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10) },
    });

    res.json({ user: publicUser(user) });
  }),
);

// ---------- GOOGLE OAUTH ----------
router.get("/google", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });
  res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
});

router.get(
  "/google/callback",
  asyncHandler(async (req, res) => {
    const { code } = req.query;
    if (!code)
      return res.redirect(
        `${process.env.CLIENT_URL}/login?error=google_failed`,
      );

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // Google already verifies ownership of the email, so these users
    // are trusted immediately — emailVerified: true is intentional here.
    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.picture,
          googleId: payload.sub,
          emailVerified: true,
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          avatarUrl: user.avatarUrl || payload.picture,
          emailVerified: true,
        },
      });
    }

    setAuthCookies(res, user);
    const redirectPath = user.onboardingComplete ? "/dashboard" : "/onboarding";
    res.redirect(`${process.env.CLIENT_URL}${redirectPath}`);
  }),
);

// ---------- REFRESH ----------
// NOTE: no authLimiter here on purpose — this fires on every access-token
// cycle (every ~15 min per active tab, plus once on every 401), so sharing
// the login/register budget causes legitimate sessions to get locked out.
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "No refresh token" });

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res
        .status(401)
        .json({ error: "Refresh token invalid or expired" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ error: "Session not found" });
    }

    const valid = await bcrypt.compare(token, user.refreshTokenHash);
    if (!valid) return res.status(401).json({ error: "Session invalid" });

    const { refreshToken } = setAuthCookies(res, user);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10) },
    });

    res.json({ ok: true });
  }),
);

// ---------- LOGOUT ----------
router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.user.update({
      where: { id: req.userId },
      data: { refreshTokenHash: null },
    });
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
    res.json({ ok: true });
  }),
);

// ---------- LOGOUT ALL SESSIONS ----------
router.post(
  "/logout-all",
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.user.update({
      where: { id: req.userId },
      data: { refreshTokenHash: null },
    });
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
    res.json({ ok: true, message: "Logged out of all sessions." });
  }),
);

// ---------- ME ----------
// NOTE: no authLimiter here either — fires on every dashboard mount/route
// change, and would exhaust the same budget as login/register.
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(user) });
  }),
);

// ---------- CHANGE PASSWORD ----------
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

router.post(
  "/change-password",
  requireAuth,
  authLimiter,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(
      req.body,
    );
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user.passwordHash) {
      return res
        .status(400)
        .json({
          error:
            "This account uses Google sign-in. Password change not available.",
        });
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid)
      return res.status(401).json({ error: "Current password is incorrect." });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash },
    });
    res.json({ ok: true, message: "Password updated successfully." });
  }),
);

// ---------- DELETE ACCOUNT ----------
router.delete(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: req.userId } });
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
    res.json({ ok: true });
  }),
);

module.exports = router;