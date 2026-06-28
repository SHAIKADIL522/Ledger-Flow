import { Skeleton, SkeletonText, PageHeader } from "@/components/ui/Skeletons";

export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <PageHeader showButton={false} />

      {/* Settings sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}