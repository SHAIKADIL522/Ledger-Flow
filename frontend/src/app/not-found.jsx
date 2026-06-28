import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-slate-700 mb-2">404</p>
        <h1 className="text-2xl font-semibold text-slate-200 mb-3">Page not found</h1>
        <p className="text-slate-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}