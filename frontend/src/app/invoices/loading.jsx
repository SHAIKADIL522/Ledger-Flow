import { Skeleton, SkeletonTable, PageHeader } from "@/components/ui/Skeletons";

export default function InvoicesLoading() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-lg" />
        ))}
      </div>

      <SkeletonTable
        rows={8}
        cols={6}
        headers={["Invoice", "Client", "Amount", "Due Date", "Status", ""]}
      />
    </div>
  );
}