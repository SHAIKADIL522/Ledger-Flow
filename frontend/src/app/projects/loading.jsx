import { Skeleton, SkeletonTable, PageHeader } from "@/components/ui/Skeletons";

export default function ProjectsLoading() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader />

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-md" />
        ))}
      </div>

      <SkeletonTable
        rows={7}
        cols={5}
        headers={["Project", "Client", "Status", "Due Date", "Budget"]}
      />
    </div>
  );
}