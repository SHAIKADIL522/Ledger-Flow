import { Skeleton, SkeletonTable, PageHeader } from "@/components/ui/Skeletons";

export default function ClientsLoading() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader />

      {/* Search bar */}
      <Skeleton className="h-10 w-full max-w-sm rounded-lg" />

      <SkeletonTable
        rows={8}
        cols={5}
        headers={["Name", "Email", "Phone", "Total Invoiced", ""]}
      />
    </div>
  );
}