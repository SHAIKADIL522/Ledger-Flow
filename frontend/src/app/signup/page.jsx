"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Chrome, Check, X, Mail } from "lucide-react";
import AuthVisual from "@/components/auth/AuthVisual";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { api, API_URL } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
  { label: "One special character", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  // NEW: show verify banner after successful register
  const [registered, setRegistered] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const passwordValid = PASSWORD_RULES.every((r) => r.test(password));
  const emailValid = EMAIL_REGEX.test(email);
  const confirmMatch = password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!emailValid) return setError("Enter a valid email address.");
    if (!passwordValid) return setError("Password does not meet requirements.");
    if (!confirmMatch) return setError("Passwords do not match.");
    setIsLoading(true);
    try {
      const data = await api.post("/auth/register", { name, email, password });
      setUser(data.user);
      // If backend requires email verification, show banner instead of redirect
      if (data.requiresVerification) {
        setRegistered(true);
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        router.push("/onboarding");
      }
    } catch (err) {
      setError(err.message || "Couldn't create your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg("");
    try {
      await api.post("/auth/resend-verification", { email });
      setResendMsg("Verification email sent!");
    } catch (err) {
      setResendMsg(err.message || "Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  // Email verify banner — shown after successful register
  if (registered) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Mail className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-slate-400 text-sm">
              We sent a verification link to{" "}
              <span className="text-white font-medium">{email}</span>.
              Click it to activate your account.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-400 space-y-1">
            <p>Didn't get it? Check your spam folder.</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary hover:underline disabled:opacity-50 cursor-pointer"
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>
            {resendMsg && (
              <p className={resendMsg.includes("sent") ? "text-emerald-400" : "text-rose-400"}>
                {resendMsg}
              </p>
            )}
          </div>
          <Link href="/login" className="block text-sm text-slate-500 hover:text-slate-300">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-navy-950">
      <AuthVisual tagline="Join freelancers and growing businesses automating their books with AI." />
      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center justify-center mb-10 sm:mb-12">
            <Logo size="md" />
          </div>
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">Create your account</h1>
            <p className="text-slate-400 text-sm">Start free — no credit card required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <Input
              ref={nameRef}
              label="Full name"
              name="name"
              placeholder="Anna Patel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); emailRef.current?.focus(); } }}
              required
              autoComplete="name"
            />

            <div className="space-y-1.5">
              <Input
                ref={emailRef}
                label="Email"
                type="email"
                name="email"
                placeholder="anna@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); passwordRef.current?.focus(); } }}
                required
                autoComplete="email"
              />
              {email && !emailValid && (
                <p className="text-xs text-rose-400">Enter a valid email address.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmPasswordRef.current?.focus(); } }}
                  required
                  autoComplete="new-password"
                  className="w-full h-11 px-4 pr-11 rounded-xl bg-navy-800/60 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:border-primary-400/60 transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              {passwordTouched && (
                <ul className="mt-2 space-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password);
                    return (
                      <li key={rule.label} className={`flex items-center gap-2 text-xs ${passed ? "text-emerald-400" : "text-slate-500"}`}>
                        {passed ? <Check className="size-3" /> : <X className="size-3" />}
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">Confirm Password</label>
              <div className="relative">
                <input
                  ref={confirmPasswordRef}
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`w-full h-11 px-4 pr-11 rounded-xl bg-navy-800/60 border text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                    confirmPassword
                      ? confirmMatch
                        ? "border-emerald-500/60 focus:ring-emerald-400/40"
                        : "border-rose-500/60 focus:ring-rose-400/40"
                      : "border-white/10 focus:ring-primary-400/60 focus:border-primary-400/60"
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                  {showConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              {confirmPassword && !confirmMatch && <p className="text-xs text-rose-400">Passwords do not match.</p>}
              {confirmPassword && confirmMatch && <p className="text-xs text-emerald-400">Passwords match.</p>}
            </div>

            {error && (
              <div className="p-3 text-sm text-rose-400 bg-rose-950/30 border border-rose-900/40 rounded-lg">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isLoading}
              disabled={!passwordValid || !confirmMatch || !emailValid || isLoading}
            >
              Create account
            </Button>
          </form>

          <div className="mt-4 sm:mt-6">
            <Button variant="secondary" className="w-full" size="lg" icon={Chrome} type="button"
              onClick={() => (window.location.href = `${API_URL}/auth/google`)}>
              Continue with Google
            </Button>
          </div>

          <div className="text-center text-sm text-slate-400 mt-6 sm:mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-white font-medium hover:underline">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}