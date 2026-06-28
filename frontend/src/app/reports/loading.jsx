import { Skeleton, SkeletonCard, PageHeader } from "@/components/ui/Skeletons";

export default function ReportsLoading() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader showButton={false} />

      {/* Date range picker skeleton */}
      <div className="flex gap-3 items-center">
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Two chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <Skeleton className="h-5 w-36 mb-4" />
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}