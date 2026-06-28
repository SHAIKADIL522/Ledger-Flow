"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Check, X, CheckCircle } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
  { label: "One special character", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

// Handles: /reset-password?token=xxx
// Backend route: POST /auth/reset-password  { token, password }
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordValid = PASSWORD_RULES.every((r) => r.test(password));
  const confirmMatch = password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return setError("Invalid reset link. Please request a new one.");
    if (!passwordValid) return setError("Password does not meet requirements.");
    if (!confirmMatch) return setError("Passwords do not match.");

    setError("");
    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Reset failed. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-4">
        <Logo size="md" className="mb-12" />
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Invalid reset link</h1>
          <p className="text-slate-400 text-sm">This link is missing a token. Please request a new one.</p>
          <Link href="/forgot-password">
            <Button className="w-full" size="lg">Request new link</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-4">
        <Logo size="md" className="mb-12" />
        <div className="w-full max-w-md text-center space-y-6">
          <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="size-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Password reset!</h1>
            <p className="text-slate-400 text-sm">Your password has been updated. You can now log in.</p>
          </div>
          <Button className="w-full" size="lg" onClick={() => router.push("/login")}>
            Go to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-4">
      <Logo size="md" className="mb-12" />
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">Reset password</h1>
          <p className="text-slate-400 text-sm">Choose a strong new password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* New password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">New password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true); }}
                required
                autoComplete="new-password"
                autoFocus
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

          {/* Confirm */}
          <div className="space-y-1.5">
            <label htmlFor="confirm" className="block text-sm font-medium text-slate-300">Confirm password</label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className={`w-full h-11 px-4 pr-11 rounded-xl bg-navy-800/60 border text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                  confirm
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
            {confirm && !confirmMatch && <p className="text-xs text-rose-400">Passwords do not match.</p>}
            {confirm && confirmMatch && <p className="text-xs text-emerald-400">Passwords match.</p>}
          </div>

          {error && (
            <div className="p-3 text-sm text-rose-400 bg-rose-950/30 border border-rose-900/40 rounded-lg">
              {error}
              {error.includes("expired") && (
                <Link href="/forgot-password" className="block mt-1 text-primary hover:underline text-xs">
                  Request a new link →
                </Link>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isLoading}
            disabled={!passwordValid || !confirmMatch || isLoading}
          >
            Reset password
          </Button>
        </form>
      </div>
    </div>
  );
}