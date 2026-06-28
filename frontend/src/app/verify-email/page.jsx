"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

// Handles: /verify-email?token=xxx
// Backend route: POST /auth/verify-email  { token }
export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const setUser = useAuthStore((s) => s.setUser);

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token. Check your email link.");
      return;
    }

    api
      .post("/auth/verify-email", { token })
      .then((data) => {
        if (data?.user) setUser(data.user);
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Verification failed. The link may have expired.");
      });
  }, [token, setUser]);

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center px-4">
      <Logo size="md" className="mb-12" />

      <div className="w-full max-w-md text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="size-12 text-primary animate-spin mx-auto" />
            <h1 className="text-xl font-semibold text-white">Verifying your email…</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="size-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="size-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Email verified!</h1>
              <p className="text-slate-400 text-sm">Your account is now active. You're ready to go.</p>
            </div>
            <Button className="w-full" size="lg" onClick={() => router.push("/onboarding")}>
              Continue to setup
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="size-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
              <XCircle className="size-8 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Verification failed</h1>
              <p className="text-slate-400 text-sm">{message}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/signup">
                <Button className="w-full" size="lg">Back to sign up</Button>
              </Link>
              <Link href="/login" className="text-sm text-slate-500 hover:text-slate-300">
                Already verified? Log in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}