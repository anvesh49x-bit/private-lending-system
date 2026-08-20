import AppShell from "@/components/layout/AppShell";

export default function AnalyticsLoading() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-5 border-b border-zinc-200 pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="h-8 w-64 bg-zinc-200 rounded-md"></div>
            <div className="mt-2 h-4 w-72 bg-zinc-200 rounded-md"></div>
          </div>
          <div className="h-10 w-48 bg-zinc-200 rounded-xl"></div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-100 rounded-2xl"></div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 bg-zinc-100 rounded-2xl"></div>
          <div className="h-96 bg-zinc-100 rounded-2xl"></div>
        </div>

        <div className="h-96 bg-zinc-100 rounded-2xl"></div>
      </div>
    </AppShell>
  );
}
