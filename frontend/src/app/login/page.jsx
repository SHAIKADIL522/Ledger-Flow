"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Chrome } from "lucide-react";
import AuthVisual from "@/components/auth/AuthVisual";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { api, API_URL } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailValid = EMAIL_REGEX.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!emailValid) return setError("Enter a valid email address.");
    if (!password) return setError("Password is required.");
    setIsLoading(true);
    try {
      const data = await api.post("/auth/login", { email, password });
      setUser(data.user);
      router.push(data.user.onboardingComplete ? "/dashboard" : "/onboarding");
    } catch (err) {
      // 403 = email not verified
      if (err.status === 403) {
        setError("Please verify your email before logging in. Check your inbox.");
      } else {
        setError(err.message || "Invalid email or password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-navy-950">
      <AuthVisual />
      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center justify-center mb-10 sm:mb-12">
            <Logo size="md" />
          </div>
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">Welcome back</h1>
            <p className="text-slate-400 text-sm">Please enter your details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
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
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-11 rounded-xl bg-navy-800/60 border border-white/10 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400/60 focus:border-primary-400/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Checkbox id="remember" checked={remember} onChange={() => setRemember(!remember)} label="Remember for 30 days" />
              {/* FIXED: was href="#" — now wired to forgot-password page */}
              <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="p-3 text-sm text-rose-400 bg-rose-950/30 border border-rose-900/40 rounded-lg">
                {error}
                {error.includes("verify your email") && (
                  <Link href="/resend-verification" className="block mt-1 text-primary hover:underline text-xs">
                    Resend verification email →
                  </Link>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isLoading}
              disabled={!email || !password || isLoading}
            >
              Log in
            </Button>
          </form>

          <div className="mt-4 sm:mt-6">
            <Button
              variant="secondary"
              className="w-full"
              size="lg"
              icon={Chrome}
              type="button"
              onClick={() => (window.location.href = `${API_URL}/auth/google`)}
            >
              Log in with Google
            </Button>
          </div>

          <div className="text-center text-sm text-slate-400 mt-6 sm:mt-8">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-white font-medium hover:underline">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}