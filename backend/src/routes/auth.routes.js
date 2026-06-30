const express = require("express");
const bcrypt = require("bcrypt");
const { z } = require("zod");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("../lib/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

const router = express.Router();
const COOKIE_NAME = process.env.COOKIE_NAME || "ledgerflow-token";
const REFRESH_COOKIE_NAME = `${COOKIE_NAME}-refresh`;

// ---------- SHARED VALIDATION ----------
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
const passwordMsg =
  "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character";

const cookieOpts = (maxAgeMs) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
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
  const { passwordHash, refreshTokenHash, googleId, ...safe } = user;
  return safe;
}

// ---------- REGISTER ----------
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address"),
  password: z.string().regex(passwordRegex, passwordMsg),
});

router.post(
  "/register",
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
      data: { name, email, passwordHash },
    });

    const { refreshToken } = setAuthCookies(res, user);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10) },
    });

    res.status(201).json({ user: publicUser(user) });
  }),
);

// ---------- LOGIN ----------
const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

router.post(
  "/login",
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
        },
      });
    }

    setAuthCookies(res, user);
    const redirectPath = user.onboardingComplete ? "/dashboard" : "/onboarding";
    res.redirect(`${process.env.CLIENT_URL}${redirectPath}`);
  }),
);

// ---------- REFRESH ----------
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
