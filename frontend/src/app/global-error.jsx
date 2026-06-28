"use client";

import { useEffect } from "react";

// Catches errors in layout.jsx itself — must include <html> and <body>
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[LedgerFlow GlobalError]", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-navy-950 text-slate-200 flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">💥</p>
          <h1 className="text-2xl font-semibold text-slate-200 mb-3">
            Critical error
          </h1>
          <p className="text-slate-400 mb-2 text-sm font-mono bg-slate-800 rounded px-3 py-2 break-words">
            {error?.message || "The app crashed unexpectedly."}
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Please refresh or contact support if this persists.
          </p>
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Reload app
          </button>
        </div>
      </body>
    </html>
  );
}