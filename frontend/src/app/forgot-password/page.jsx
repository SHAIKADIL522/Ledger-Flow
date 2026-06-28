"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Backend route: POST /auth/forgot-password  { email }
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const emailValid = EMAIL_REGEX.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailValid) return setError("Enter a valid email address.");
    setError("");
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-4">
        <Logo size="md" className="mb-12" />
        <div className="w-full max-w-md text-center space-y-6">
          <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Mail className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your inbox</h1>
            <p className="text-slate-400 text-sm">
              If an account exists for{" "}
              <span className="text-white font-medium">{email}</span>, we've sent
              a password reset link. It expires in 1 hour.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Didn't get it? Check your spam folder or{" "}
            <button
              onClick={() => setSent(false)}
              className="text-primary hover:underline cursor-pointer"
            >
              try again
            </button>
            .
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
            <ArrowLeft className="size-4" /> Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-4">
      <Logo size="md" className="mb-12" />
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">Forgot password?</h1>
          <p className="text-slate-400 text-sm">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="anna@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
            {email && !emailValid && (
              <p className="text-xs text-rose-400">Enter a valid email address.</p>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-rose-400 bg-rose-950/30 border border-rose-900/40 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isLoading}
            disabled={!emailValid || isLoading}
          >
            Send reset link
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="size-4" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}