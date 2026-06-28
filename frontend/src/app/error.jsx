"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Log to your error reporting service here (e.g. Sentry)
    console.error("[LedgerFlow Error]", error);
  }, [error]);

  // 401 → redirect to login
  if (error?.status === 401) {
    router.replace("/login");
    return null;
  }

  // 403
  if (error?.status === 403) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-2xl font-semibold text-slate-200 mb-3">Access denied</h1>
          <p className="text-slate-400 mb-8">You don't have permission to view this page.</p>
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Generic 500
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-2xl font-semibold text-slate-200 mb-3">Something went wrong</h1>
        <p className="text-slate-400 mb-2 text-sm font-mono bg-slate-800 rounded px-3 py-2 break-words">
          {error?.message || "An unexpected error occurred."}
        </p>
        <p className="text-slate-500 text-sm mb-8">
          If this keeps happening, contact support.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}