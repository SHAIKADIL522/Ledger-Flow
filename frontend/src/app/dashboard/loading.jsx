import { Skeleton, SkeletonCard, SkeletonTable, PageHeader } from "@/components/ui/Skeletons";

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader showButton={false} />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>

      {/* Recent invoices table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <Skeleton className="h-5 w-40 mb-4" />
        <SkeletonTable rows={5} cols={5} />
      </div>
    </div>
  );
}