"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, RefreshCw, Mail } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const setUser = useAuthStore((s) => s.setUser);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [userData, setUserData] = useState(null);
  const inputRefs = useRef([]);

  // Auto-focus first box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Accept only digits
    if (!/^\d*$/.test(value)) return;
    if (value.length > 1) {
      // Handle paste: distribute across boxes
      const digits = value.slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split("").forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const otpCode = otp.join("");
  const isComplete = otpCode.length === 6;

  const handleVerify = async () => {
    if (!isComplete) return;
    setError("");
    setStatus("loading");
    try {
      const data = await api.post("/auth/verify-email", {
        email: emailParam,
        otp: otpCode,
      });
      if (data?.user) {
        setUser(data.user);
        setUserData(data.user);
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Invalid code. Please try again.");
      // Clear OTP on error so user can retype
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg("");
    try {
      await api.post("/auth/resend-verification", { email: emailParam });
      setResendMsg("New code sent! Check your inbox.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setResendMsg(err.message || "Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  // ── SUCCESS SCREEN ──────────────────────────────────────────────
  if (status === "success") {
    const firstName = userData?.name?.split(" ")[0] || "there";
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-4 py-12">
        <Logo size="md" className="mb-10" />

        <div className="w-full max-w-md">
          {/* Card */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-navy-900 to-navy-950 p-8 text-center shadow-2xl">
            {/* Glow */}
            <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 size-48 rounded-full bg-primary/15 blur-3xl" />

            {/* Icon */}
            <div className="relative mb-6 flex justify-center">
              <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="size-8 text-emerald-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome, {firstName}! 👋
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Your email is verified and your LedgerFlow account is ready.
              Let's get your workspace set up so you can start invoicing in minutes.
            </p>

            {/* Checklist */}
            <div className="text-left space-y-3 mb-8">
              {[
                { icon: "🏢", text: "Add your business details" },
                { icon: "💱", text: "Set your default currency" },
                { icon: "🚀", text: "Create your first invoice" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>

            <Button
              className="w-full"
              size="lg"
              icon={ArrowRight}
              onClick={() => router.push("/onboarding")}
            >
              Complete Setup
            </Button>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            A welcome email has been sent to{" "}
            <span className="text-slate-500">{emailParam}</span>
          </p>
        </div>
      </div>
    );
  }

  // ── OTP INPUT SCREEN ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-4 py-12">
      <Logo size="md" className="mb-10" />

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/8 bg-navy-900/60 p-8 shadow-2xl backdrop-blur">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
              <Mail className="size-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              We sent a 6-digit verification code to{" "}
              <span className="font-medium text-white">
                {emailParam || "your email"}
              </span>
            </p>
          </div>

          {/* OTP Boxes */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all outline-none
                  ${digit
                    ? "border-primary bg-primary/10 text-white"
                    : "border-white/10 bg-navy-800/60 text-slate-300"
                  }
                  focus:border-primary focus:ring-2 focus:ring-primary/30
                  ${status === "error" ? "border-rose-500/60 bg-rose-950/20" : ""}
                `}
              />
            ))}
          </div>

          {/* Error */}
          {status === "error" && error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 text-rose-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Verify button */}
          <Button
            className="w-full mb-4"
            size="lg"
            loading={status === "loading"}
            disabled={!isComplete || status === "loading"}
            onClick={handleVerify}
          >
            Verify Email
          </Button>

          {/* Resend */}
          <div className="text-center text-sm">
            <span className="text-slate-500">Didn't get the code? </span>
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-primary hover:underline disabled:opacity-50 cursor-pointer inline-flex items-center gap-1"
            >
              {resending ? (
                <><RefreshCw className="size-3 animate-spin" /> Sending...</>
              ) : (
                "Resend code"
              )}
            </button>
            {resendMsg && (
              <p className={`mt-2 text-xs ${resendMsg.includes("sent") ? "text-emerald-400" : "text-rose-400"}`}>
                {resendMsg}
              </p>
            )}
          </div>

        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Wrong email?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Back to sign up
          </Link>
        </p>
      </div>
    </div>
  );
}